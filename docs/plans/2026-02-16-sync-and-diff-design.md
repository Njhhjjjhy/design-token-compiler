# Sync & Diff — Design Document

**Date:** February 16, 2026
**Status:** Approved
**Scope:** Phase 4 — Full feature
**Priority:** High — Next phase after Token Editor MVP

---

## Context

Phases 1–3 are complete. The Design Token Compiler has a working token editor, resolution engine, and multi-format compilation (CSS, SCSS, TypeScript, Tailwind, JSON W3C, Style Dictionary). Users can create, edit, and compile tokens — but they can't compare their tokens against an external source like a Figma export or an existing CSS file.

The Sync & Diff feature bridges designers and developers by letting them:
- Import tokens from Figma or code files
- See what matches and what's different
- Resolve differences and merge the result
- Apply changes back to the editor or export a merged file

---

## Design Approach

**Selected:** Two-panel side-by-side diff view

**Alternatives considered:**
1. Single list with inline comparison — simpler but less visual separation between sources
2. Tab-based toggle (switch between "editor" and "imported" views) — loses simultaneous comparison

**Why two-panel:**
- Visual and intuitive — feels like "before and after" comparisons designers know from Figma version history
- Developers recognize the pattern from git diff and code review tools
- Clear spatial separation between the two sources
- Color-coded rows make the status scannable at a glance

---

## User Flow

### Step 1: Import

- User navigates to the Sync tab
- Sees a clean drop zone: "Drop a file to compare" with a file picker button
- Supported formats listed below the drop zone
- User drops or selects their Figma JSON, CSS, or SCSS file

### Step 2: Review

- The two-panel view fills in automatically after import
- Summary bar at the top: "38 same · 4 different · 2 only in editor · 1 only in file"
- Green rows (same) are collapsed by default
- Amber rows (different) are highlighted with both values shown
- Blue rows (editor-only) and red rows (file-only) clearly marked
- Filter buttons to show "All" or "Only differences"

### Step 3: Resolve

- For each amber (different) row: click left arrow to keep editor value, right arrow to keep imported value
- For blue (editor-only) rows: option to keep or discard
- For red (file-only) rows: option to add to token set or ignore
- Progress indicator: "3 of 4 resolved"

### Step 4: Apply

- "Apply to Editor" — merges decisions into the token editor (becomes new source of truth)
- "Export Merged" — downloads the merged result as a file
- Both buttons enabled once all conflicts are resolved

---

## View Layout

The Sync view has 3 zones stacked vertically:

### 1. Sync Header Bar

A toolbar with:
- **Source indicator** — shows the imported file name and detected format
- **Summary stats** — token counts by status (same, different, editor-only, file-only)
- **Filter controls** — "All" / "Differences only" toggle
- **Action buttons** — "Apply to Editor" and "Export Merged" (disabled until comparison is done and conflicts are resolved)

### 2. Two-Panel Diff Area

The main content area, split into two synchronized scrolling panels:

**Left panel — "EDITOR TOKENS":**
- Current token set from the editor
- Organized by token group (colors, spacing, typography, etc.)
- Each token shows: name, type badge, value, visual preview

**Right panel — "IMPORTED TOKENS":**
- Parsed tokens from the uploaded file
- Same organization and display format as the left panel
- Tokens aligned by path so matching rows are side-by-side

**Row color coding:**
- Green background — values match (collapsed by default)
- Amber background — values exist in both but differ (expanded, shows both values)
- Blue background — exists only in editor (left panel highlighted, right panel empty)
- Red background — exists only in imported file (left panel empty, right panel highlighted)

**Resolution controls on mismatched rows:**
- Left arrow button (←) — keep editor value
- Right arrow button (→) — keep imported value
- Selected choice highlighted, other side dimmed

### 3. Resolution Summary Footer

Fixed at the bottom:
- Resolution progress: "5 of 5 conflicts resolved"
- "Apply to Editor" button — merges result into token set
- "Export Merged" button — downloads merged tokens

---

## File Import & Parsing

### Supported Formats

1. **Figma Variables JSON** — exported from Figma's Variables panel. Parse variable collections, modes, and values into a flat token map.
2. **CSS files (.css)** — parse `:root { --token-name: value; }` blocks. Handle mode variants like `[data-theme="dark"]`.
3. **SCSS files (.scss)** — parse `$variable-name: value;` declarations and `$maps: (key: value)`.
4. **W3C Design Tokens JSON (.json)** — the `{ "$value": ..., "$type": ... }` format already used in the compiler output.

### Auto-Detection

- File extension determines the parser: `.css` → CSS parser, `.scss` → SCSS parser, `.json` → JSON parser
- For JSON files, detect Figma vs W3C format by checking the structure (Figma has `variableCollections`, W3C has `$value`/`$type`)

### Error Handling

- Unparseable files show a clear error: "Couldn't read this file. Supported formats: .json (Figma or W3C), .css, .scss"
- Partial parse failures: show the successfully parsed tokens with warnings on broken rows

---

## Diff Engine

### Comparison Logic

1. **Flatten both sides** — convert the editor's token tree and the imported tokens into flat lists of `path → value` pairs (e.g., `color.primary → #f40c3f`)
2. **Match by path** — tokens with the same path get compared
3. **Compare values** — for matched pairs, check if values are identical
4. **Categorize** each token into one of four statuses:
   - **Same** — path exists in both, values match
   - **Different** — path exists in both, values don't match
   - **Only in Editor** — path only in the editor token set
   - **Only in File** — path only in the imported file

### Value Normalization

- Normalize hex colors to lowercase before comparing (`#FF0000` = `#ff0000`)
- Trim whitespace from values
- For complex values (shadows, typography objects), use the `diff` library to highlight what changed within a value

### Grouping

- Display diff results organized by token group (colors, spacing, typography) rather than a flat list
- Within each group, sort: different first, then editor-only, then file-only, then same

---

## Designer & Developer Accessibility

### Designer-friendly features:
- Visual previews next to every token (color swatches, spacing bars, font samples)
- Plain language status labels: "Same", "Different", "Only in Editor", "Only in File"
- Clean empty state with clear import prompt
- One-click resolution arrows — no jargon

### Developer-friendly features:
- Full token paths shown (e.g., `color.primary.500`)
- Raw values visible (hex codes, px values)
- Filter and search by token name or status

### Both benefit from:
- Color-coded rows (green/amber/blue/red) — universally readable
- Summary stats at the top for instant scope assessment
- Progressive disclosure — rows collapsed by default, expand for detail

---

## Component Architecture

### Component Hierarchy

```
SyncView (container page)
├── SyncHeader (toolbar: file info, stats, filters, action buttons)
├── SyncDropZone (empty state: file drop/pick area)
├── SyncDiffPanel (two-panel diff area)
│   ├── SyncTokenList (left panel — editor tokens)
│   │   └── SyncTokenRow (individual token row with preview)
│   ├── SyncTokenList (right panel — imported tokens)
│   │   └── SyncTokenRow (individual token row with preview)
│   └── SyncResolutionControl (per-row left/right arrows)
└── SyncFooter (resolution progress + action buttons)
```

### New Files

**Components:**
- `src/components/sync/SyncHeader.tsx`
- `src/components/sync/SyncDropZone.tsx`
- `src/components/sync/SyncDiffPanel.tsx`
- `src/components/sync/SyncTokenList.tsx`
- `src/components/sync/SyncTokenRow.tsx`
- `src/components/sync/SyncResolutionControl.tsx`
- `src/components/sync/SyncFooter.tsx`

**Parsers:**
- `src/lib/parsers/css-parser.ts`
- `src/lib/parsers/scss-parser.ts`
- `src/lib/parsers/figma-parser.ts`
- `src/lib/parsers/w3c-json-parser.ts`
- `src/lib/parsers/detect-format.ts`

**Diff engine:**
- `src/lib/diff/diff-engine.ts`
- `src/lib/diff/flatten-tokens.ts`
- `src/lib/diff/normalize-values.ts`

### Modified Files

- `src/pages/SyncView.tsx` — replace placeholder with full sync view
- `src/store/useTokenStore.ts` — add sync state management (imported tokens, diff results, resolution choices, apply merged result)

---

## State Management

### New Store State

```typescript
interface SyncStoreState {
  // Import state
  importedSource: SyncSource | null
  importedTokens: Record<string, FlatToken> | null
  importError: string | null

  // Diff state
  diffResult: SyncResult | null

  // Resolution state
  resolutions: Record<string, 'editor' | 'imported' | 'discard' | 'add'>

  // UI state
  syncFilter: 'all' | 'differences'

  // Actions
  importFile: (file: File) => Promise<void>
  clearImport: () => void
  resolveToken: (tokenPath: string, choice: 'editor' | 'imported' | 'discard' | 'add') => void
  applyToEditor: () => void
  exportMerged: (format: CompilationFormat) => void
}
```

---

## Visual Design

### Follows existing app patterns:
- Dark background with crimson accent (#f40c3f)
- 1px solid border compartments
- Monospace typography (JetBrains Mono) for token data
- Section title strips (uppercase, 12px monospace, letter-spacing: 0.1em)
- Binary separator between header and content

### Color coding for diff status:
- **Same:** success green (#22c55e) at ~10% opacity background
- **Different:** warning amber (#f59e0b) at ~10% opacity background
- **Only in Editor:** info blue (#3b82f6) at ~10% opacity background
- **Only in File:** primary red (#f40c3f) at ~10% opacity background

### Drop zone:
- Dashed border (border-dashed) in border color
- Large centered text: "Drop a file to compare"
- Supported formats listed in smaller text below
- Hover state: border brightens, subtle background shift

---

## Out of Scope

- Live Figma API connection (this is file-based import only)
- Automatic re-sync / file watching
- Multi-file import (one file at a time)
- Merge history / audit log
- Three-way merge (only two-way: editor vs. imported)

---

## Success Criteria

The Sync & Diff feature is complete when:

1. Users can import a Figma Variables JSON file and see it compared against editor tokens
2. Users can import a CSS or SCSS file and see it compared against editor tokens
3. Users can import a W3C Design Tokens JSON file and see it compared
4. The diff view clearly shows matching, different, editor-only, and file-only tokens
5. Visual previews (color swatches, spacing bars) appear alongside token values
6. Users can resolve each difference by choosing which value to keep
7. Users can apply the merged result back to the editor
8. Users can export the merged result as a file
9. Error states are handled gracefully (bad files, partial parse failures)
10. The view follows the existing visual design language (dark theme, compartment borders, monospace)

---

**Design approved by:** User (Riaan)
**Date approved:** February 16, 2026
**Ready for implementation:** Yes
