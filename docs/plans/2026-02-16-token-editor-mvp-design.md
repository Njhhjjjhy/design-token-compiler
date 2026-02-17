# Token Editor MVP — Design Document

**Date:** February 16, 2026
**Status:** Approved
**Scope:** Essential MVP (6-8 hours)
**Priority:** High — Critical blocker for core functionality

---

## Context

Phase 1 & Phase 2 are complete (100%). The Design Token Compiler has a working foundation with token resolution, state management, and multi-format compilation (CSS, SCSS, TypeScript, Tailwind, JSON W3C, Style Dictionary). However, users cannot currently edit tokens — they can only compile the hardcoded sample data.

The Token Editor is the critical next step because:
- Without it, the tool can only compile sample data (not usable for real projects)
- Figma Sync isn't useful if you can't edit imported tokens afterward
- Visual Browser needs tokens to display, but you need an editor to create them
- It unlocks the core workflow: **Create/Edit → Compile → Export**

---

## Strategic Decision

**Chosen approach:** Build the Token Editor MVP before Visual Browser or Figma Sync.

**Why:** The editor is the blocker for everything else. It completes the minimum viable workflow and makes the tool actually functional for real token management.

**Scope decision:** Essential MVP (not full-featured V1).
- Focus on core editing workflow
- Defer advanced features (color picker, autocomplete, drag-to-reorder, undo/redo) to later iterations
- Target: 6-8 hours of implementation time

---

## Design Approach

**Selected:** Recursive Tree with Inline Editing

**Alternatives considered:**
1. Flat list with inline editing — Too simple, loses semantic organization
2. Split view (tree + detail panel) — Overkill for MVP, requires more screen space and state management

**Why recursive tree:**
- Matches how design systems are organized (primitive → semantic → component)
- Aligns with PRD requirements ("tree view organized by group with expand/collapse")
- Preserves hierarchy, easier to navigate large token sets
- Standard pattern that users expect from file explorers and design tools

---

## Component Architecture

### Component Hierarchy

```
EditorView (container page)
├── EditorHeader (toolbar with "Add Token" button)
├── TokenTree (recursive tree renderer)
│   └── TokenTreeNode (individual token/group dispatcher)
│       ├── TokenGroupNode (for groups - has expand/collapse)
│       └── TokenValueNode (for individual tokens - has inline editing)
└── EmptyState (shown when no tokens exist)
```

### Component Responsibilities

**EditorView:**
- Container for the entire editor page
- Replaces the current placeholder component
- Provides layout structure (header + tree area)

**EditorHeader:**
- Toolbar at the top of the editor
- Contains "Add Token" button
- Future: search/filter, bulk operations

**TokenTree:**
- Receives the token set from Zustand store
- Iterates over top-level groups
- Renders each as a `TokenTreeNode`
- Handles empty state when no tokens exist

**TokenTreeNode:**
- Inspects data to determine if it's a group or a token
- Dispatches to appropriate sub-component (`TokenGroupNode` or `TokenValueNode`)
- Handles recursive rendering logic

**TokenGroupNode:**
- Displays group name as a header
- Expand/collapse chevron icon
- When expanded, recursively renders child tokens
- Visual indentation based on nesting depth

**TokenValueNode:**
- Displays individual token in a compact row
- Layout: `[name] [type badge] [value] [preview] [delete icon on hover]`
- Handles inline editing of the value
- Shows visual previews (color swatches, spacing bars)

---

## Data Flow & State Management

### Reading Tokens

Components read from the existing Zustand store (`useTokenStore`) which provides the active token set.

### Editing a Token Value

1. User clicks a token value in `TokenValueNode`
2. Component enters edit mode (local state: `isEditing = true`)
3. Value becomes an input field, pre-filled and auto-focused
4. User modifies the value
5. On blur/Enter → calls `useTokenStore.getState().updateToken(tokenId, newValue)`
6. Store updates, React re-renders tree with new value
7. On Escape → cancels edit and reverts to original value

### Adding a Token

1. User clicks "Add Token" button in `EditorHeader`
2. Modal/dialog opens with form fields:
   - Parent Group (dropdown)
   - Token Name (text input)
   - Token Type (dropdown: color, dimension, typography, etc.)
   - Token Value (text input)
3. User fills form and clicks "Create"
4. Calls `useTokenStore.getState().addToken(parentPath, tokenData)`
5. Dialog closes
6. New token appears in tree under selected parent group
7. Parent group auto-expands if collapsed
8. New token briefly highlights to show where it landed

### Deleting a Token

1. User hovers over a token row
2. Delete icon (trash) appears
3. User clicks delete icon
4. Browser confirmation dialog: "Delete token 'primary'? This cannot be undone."
5. User confirms → calls `useTokenStore.getState().deleteToken(tokenId)`
6. Token immediately removed from tree

### Store Methods Needed

Add these methods to `useTokenStore.ts`:

- `updateToken(tokenId: string, newValue: TokenValue)` — Updates a token's value
- `addToken(parentPath: string, token: Partial<Token>)` — Creates a new token
- `deleteToken(tokenId: string)` — Removes a token

**State principle:** No local component state except transient UI state (which node is being edited, which groups are expanded). The Zustand store remains the single source of truth for token data.

---

## Token Tree Rendering Logic

### Visual Structure

The tree displays tokens in nested groups with visual indentation:

```
▼ color                           (group - expanded)
  ▼ primitive                     (group - expanded)
    ▶ blue                        (group - collapsed)
  ▼ semantic                      (group - expanded)
      primary     color  #2563eb  [blue swatch]
      error       color  #dc2626  [red swatch]
▼ spacing                         (group - expanded)
  ▼ primitive                     (group - expanded)
      4           dimension  16px [bar]
```

### Recursive Rendering

- `TokenTree` iterates over the token set's top-level groups
- Each entry is passed to `TokenTreeNode`
- `TokenTreeNode` checks if the data has a `tokens` property:
  - If yes → it's a group → render `TokenGroupNode`
  - If no → it's a token → render `TokenValueNode`
- `TokenGroupNode` recursively renders its children when expanded
- Indentation increases with depth (using `paddingLeft: depth × 16px`)

### Expand/Collapse State

- Each `TokenGroupNode` has local state: `isExpanded`
- Clicking the chevron toggles `isExpanded`
- Chevron icon rotates 90° when expanded
- Default: all top-level groups start expanded, nested groups start collapsed

---

## Inline Editing Interaction

### Default State

- Token value displayed as plain text (e.g., `#2563eb`)
- Subtle hover feedback (slightly lighter background)
- Cursor changes to text cursor on hover

### Entering Edit Mode

- User clicks on the value
- Text transforms into an input field
- Input pre-filled with current value
- Input auto-focused, cursor ready to type

### Editing

- User types the new value
- **Color tokens:** hex codes, rgb values, or token references (`{color.primary}`)
- **Spacing tokens:** number with unit (16px, 1rem, etc.)
- **Other types:** plain text input

**MVP constraint:** Simple text inputs only. No color picker, no unit dropdowns, no reference autocomplete.

### Saving Changes

- **Press Enter** → saves and exits edit mode
- **Click outside input** (blur) → saves and exits edit mode
- **Press Escape** → cancels and reverts to original value

### Visual Feedback

- For color tokens: color swatch preview updates in real-time as you type
- Invalid values: red border on input (e.g., entering "abc" for a color)
- After saving: subtle flash/highlight confirms the change was saved

---

## Visual Previews

### Color Tokens

- **Preview:** 16×16px color swatch next to the hex value
- **Border:** Subtle gray border so white colors are visible against dark background
- **Value shown:** Resolved color (if token references another token, show the final color)

### Spacing Tokens

- **Preview:** Small horizontal bar showing relative size
- **Scaling:** Bar is proportional but capped (64px spacing doesn't render at actual 64px, it's scaled down)
- **Color:** Light gray fill visible against dark background

### Typography Tokens

- **Preview:** None for MVP
- **Display:** Just show the value text (e.g., `"JetBrains Mono"`, `"16px"`)

### Shadow, Border-Radius, Opacity, Duration

- **Preview:** None for MVP
- **Display:** Value as plain text

### Token Row Layout

```
[Chevron if group] [Token Name] [Type Badge] [Value] [Preview] [Delete Icon on hover]
```

**Example:**
```
  primary        color      #2563eb   [blue swatch]
  spacing-4      dimension  16px      [small bar]
  font-heading   typography "Inter"
```

---

## Add/Delete Operations

### Adding a New Token

**UI Trigger:**
- "Add Token" button in `EditorHeader` toolbar
- Prominent button using crimson accent color (#f40c3f)

**Dialog Contents:**
- **Parent Group:** Dropdown to select where to add the token
  - Options: all available group paths (e.g., "color.primitive", "spacing.semantic")
- **Token Name:** Text input (e.g., "primary-dark")
- **Token Type:** Dropdown (color, dimension, typography, shadow, etc.)
- **Token Value:** Text input (e.g., "#1a1a1a")
- **Cancel / Create buttons**

**After Creation:**
- Dialog closes
- New token appears in tree under selected parent group
- Parent group auto-expands if it was collapsed
- New token briefly highlights (subtle background fade animation) to show where it landed

### Deleting a Token

**UI Trigger:**
- Trash icon appears on hover for each token row
- Icon is subtle gray normally, turns red on hover over the icon itself

**Confirmation:**
- Browser native confirmation dialog
- Message: "Delete token 'primary'? This cannot be undone."
- User clicks OK → token deleted
- User clicks Cancel → nothing happens

**After Deletion:**
- Token immediately disappears from tree (fade-out animation)
- No undo for MVP (proper undo/redo comes later)

---

## Visual Design

### Layout

- Clean, spacious layout with clear hierarchy
- Toolbar at top with "Add Token" button
- Tree fills remaining vertical space
- Scrollable when content exceeds viewport height

### Typography

- **Token names:** JetBrains Mono (monospaced, matches the rest of the app)
- **Type badges:** Small pill-shaped badges, uppercase, muted color
- **Values:** JetBrains Mono, slightly lighter than names

### Colors

- **Background:** Dark theme matching existing app (#1a1a1a range)
- **Hover states:** Subtle lighten on hover
- **Edit mode:** Input field with focused border (crimson accent #f40c3f)
- **Type badges:** Muted colors per type (color: blue, dimension: purple, typography: green, etc.)
- **Delete icon:** Gray default, red on hover

### Spacing & Indentation

- **Base indentation:** 16px
- **Nested indentation:** +16px per level
- **Row height:** Comfortable 36-40px
- **Gaps:** 8px between sections

### Animations

- **Expand/collapse:** Smooth 200ms ease for group expansion
- **Chevron rotation:** 200ms ease
- **New token highlight:** 1s fade from highlighted to normal state
- **Delete fade-out:** 200ms fade

---

## Out of Scope for MVP

These features are deferred to future iterations:

- **Color picker integration** — MVP uses text input only
- **Reference autocomplete** — Type `{` to search tokens (comes later)
- **Drag-to-reorder tokens** — Manual reordering not in MVP
- **Compound editors** — Typography/shadow use simple text input for now
- **Search and filter** — Not needed for small token sets, add when necessary
- **Bulk operations** — Find/replace, batch updates come later
- **Validation warnings UI** — Circular refs, orphans detected but not shown in UI yet
- **Undo/redo** — No history tracking in MVP
- **Import/export UI** — File upload/download comes with Figma Sync phase

---

## Success Criteria

The Token Editor MVP is complete when:

1.  Users can view all tokens in a nested tree structure
2.  Users can expand/collapse token groups
3.  Users can edit any token value inline (click, type, save)
4.  Color tokens show a color swatch preview
5.  Spacing tokens show a size bar preview
6.  Users can add new tokens via a modal dialog
7.  Users can delete tokens with confirmation
8.  All changes persist to the Zustand store and localStorage
9.  Changes are immediately reflected in the Compiler view (multi-format output updates)

---

## Testing Approach

**Manual testing scenarios:**

1. **View tokens:** Open editor, verify all sample tokens display in tree
2. **Expand/collapse:** Click chevrons, verify groups expand/collapse smoothly
3. **Edit a color:** Click a color value, change it, verify swatch updates and compiler output updates
4. **Edit spacing:** Click a spacing value, change it, verify bar preview updates
5. **Add a token:** Click "Add Token", fill form, verify new token appears in tree
6. **Delete a token:** Hover, click trash, confirm, verify token removed
7. **Cancel edit:** Press Escape while editing, verify value reverts
8. **Persistence:** Make changes, refresh page, verify changes persisted via localStorage

**Edge cases:**

- Edit a token value to invalid syntax (e.g., "abc" for color) → should show error state
- Delete a token that's referenced by another token → deletion succeeds (warning about broken references comes in later phase)
- Add a token with a duplicate name → should allow for MVP (validation comes later)

---

## Implementation Notes

### File Changes

**New files:**
- `src/components/editor/TokenTree.tsx`
- `src/components/editor/TokenTreeNode.tsx`
- `src/components/editor/TokenGroupNode.tsx`
- `src/components/editor/TokenValueNode.tsx`
- `src/components/editor/EditorHeader.tsx`
- `src/components/editor/AddTokenDialog.tsx`
- `src/components/editor/EmptyState.tsx`

**Modified files:**
- `src/pages/EditorView.tsx` — Replace placeholder with full editor
- `src/store/useTokenStore.ts` — Add `updateToken`, `addToken`, `deleteToken` methods

### Dependencies

No new dependencies needed. Uses existing:
- React (component structure)
- Zustand (state management)
- Tailwind CSS (styling)
- Lucide React (icons: ChevronRight, Trash2, Plus)

---

## Next Steps

After design approval:
1. Write implementation plan (detailed step-by-step tasks)
2. Build components in order: EmptyState → TokenTree → TokenGroupNode → TokenValueNode → EditorHeader → AddTokenDialog
3. Add store methods (updateToken, addToken, deleteToken)
4. Manual testing against success criteria
5. Update PROJECT-PROGRESS.md to mark Token Editor as complete

---

**Design approved by:** User (Riaan)
**Date approved:** February 16, 2026
**Ready for implementation:** Yes
