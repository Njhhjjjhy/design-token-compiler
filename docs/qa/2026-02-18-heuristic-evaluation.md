# Heuristic Evaluation Report

**Date:** 2026-02-18
**Scope:** Full application audit -- all 5 views, navigation, state management
**Method:** Expert review against Nielsen's 10 Usability Heuristics
**Evaluator:** Claude (automated)

---

## Severity Scale

| Rating | Meaning | Action |
|--------|---------|--------|
| 0 | Not a problem | -- |
| 1 | Cosmetic | Fix if time permits |
| 2 | Minor | Low priority fix |
| 3 | Major | Important to fix |
| 4 | Critical | Must fix before release |

---

## H1: Visibility of System Status

The system should keep users informed about what is going on through appropriate feedback within reasonable time.

| # | Finding | Location | Severity |
|---|---------|----------|----------|
| 1.1 | No save confirmation -- token edits persist silently to localStorage with no visual feedback | Editor (TokenValueNode) | 3 |
| 1.2 | No success feedback after version save -- input clears but no toast or confirmation | VersionPanel | 3 |
| 1.3 | No loading state during file import/parse operations | SyncDropZone | 2 |
| 1.4 | Sync status hardcoded to "UNSYNCED" -- never reflects actual state | Header | 3 |
| 1.5 | Copy button shows "COPIED" for only 2 seconds -- may not be noticed | Compiler | 1 |
| 1.6 | No indication of which mode is active when switching between views | Cross-view | 2 |
| 1.7 | localStorage quota failures are silent -- data loss without notification | Store | 4 |
| 1.8 | No loading/progress indicator when compiling large token sets | Compiler | 1 |

---

## H2: Match Between System and Real World

The system should speak the users' language with familiar concepts and conventions.

| # | Finding | Location | Severity |
|---|---------|----------|----------|
| 2.1 | Arrow icons for conflict resolution (left/right) don't clearly map to "keep editor" vs "keep imported" | SyncTokenRow | 3 |
| 2.2 | "SYNC & DIFF" title uses developer terminology -- users may expect "Compare" or "Merge" | SyncView | 1 |
| 2.3 | Version panel footer shows "max 50" without explaining why or what happens at limit | VersionPanel | 1 |
| 2.4 | Token type labels (e.g., "dimension") may not match user mental models (e.g., "spacing") | TokenSetCard, Browser | 1 |
| 2.5 | Unit conversion assumptions hardcoded (16px = 1rem) may not match user's design system | SpacingScale | 2 |

---

## H3: User Control and Freedom

Users need a clearly marked "emergency exit" to leave unwanted states without going through extended dialogue.

| # | Finding | Location | Severity |
|---|---------|----------|----------|
| 3.1 | No undo/redo for token edits -- only manual version snapshots | Editor | 4 |
| 3.2 | No browser back button support -- all routing is client-state, back navigates away from app | App | 3 |
| 3.3 | AddTokenDialog has no Escape key handler -- must click Cancel or X | AddTokenDialog | 2 |
| 3.4 | Blur on token value input auto-saves -- accidental blur commits unwanted changes | TokenValueNode | 3 |
| 3.5 | No way to undo a conflict resolution choice in Sync view | SyncTokenRow | 2 |
| 3.6 | Version restore is irreversible except for auto-created "Before restore" backup | VersionPanel | 2 |
| 3.7 | "Load Sample Data" clears all existing sets without warning | Dashboard | 3 |

---

## H4: Consistency and Standards

Users should not have to wonder whether different words, situations, or actions mean the same thing.

| # | Finding | Location | Severity |
|---|---------|----------|----------|
| 4.1 | Confirmation dialogs use browser native alert/confirm -- inconsistent with app styling | VersionPanel, TokenValueNode | 2 |
| 4.2 | Icon-only buttons in some views (Dashboard cards) vs text+icon in others (Compiler) | Cross-view | 2 |
| 4.3 | Mode selector appears in both Editor and Browser headers but looks slightly different | EditorHeader, BrowserHeader | 1 |
| 4.4 | Empty state messaging style varies across views (some guide to Dashboard, some don't) | Cross-view | 2 |
| 4.5 | Tab navigation pattern differs -- Browser uses explicit tabs, Compiler uses button group | Browser, Compiler | 1 |
| 4.6 | Delete button appears on hover in Editor but always visible in Version entries | TokenValueNode, VersionEntry | 2 |

---

## H5: Error Prevention

A careful design prevents problems from occurring in the first place.

| # | Finding | Location | Severity |
|---|---------|----------|----------|
| 5.1 | "Clear All" button on Dashboard has no confirmation dialog | Dashboard | 4 |
| 5.2 | No duplicate token name prevention -- users can create tokens with identical names | AddTokenDialog, Store | 3 |
| 5.3 | No file type validation on drag-and-drop -- only file picker restricts types | SyncDropZone | 2 |
| 5.4 | No file size validation on import -- large files could crash the app | SyncDropZone | 2 |
| 5.5 | Orphaned mode overrides accumulate when tokens are deleted -- no cascade cleanup | Store | 2 |
| 5.6 | Create button in AddTokenDialog has no disabled state -- can be clicked multiple times | AddTokenDialog | 2 |
| 5.7 | Version snapshots don't include modes -- restoring loses mode context | Store | 3 |

---

## H6: Recognition Rather Than Recall

Minimize memory load by making objects, actions, and options visible.

| # | Finding | Location | Severity |
|---|---------|----------|----------|
| 6.1 | Icon-only action buttons on TokenSetCard (Edit, Browse, Export) require learning icon meanings | Dashboard | 2 |
| 6.2 | Resolution buttons in Sync use abstract icons without labels | SyncTokenRow | 3 |
| 6.3 | Delete button hidden until hover -- not discoverable without mouse exploration | TokenValueNode | 3 |
| 6.4 | Parent path dropdown in AddTokenDialog shows raw dot-notation -- no visual tree | AddTokenDialog | 2 |
| 6.5 | No legend for contrast ratio badges (W/B) in ColorGrid | ColorGrid | 2 |
| 6.6 | Disabled "Apply" and "Export" buttons don't explain why they're disabled | SyncHeader | 3 |
| 6.7 | EmptyState says "Click 'Add Token'" but the button may be out of viewport | EmptyState | 1 |

---

## H7: Flexibility and Efficiency of Use

Accelerators -- unseen by novices -- may speed up interaction for expert users.

| # | Finding | Location | Severity |
|---|---------|----------|----------|
| 7.1 | No keyboard shortcuts for common actions (add token, save version, switch tabs) | Global | 2 |
| 7.2 | No copy-to-clipboard on any Browser view token values | Browser (all tabs) | 3 |
| 7.3 | No batch conflict resolution in Sync -- must resolve tokens one by one | SyncView | 2 |
| 7.4 | No search/filter in token tree (Editor) or Browser views | Editor, Browser | 3 |
| 7.5 | No sorting options in SpacingScale (always sorted by pixel value) | SpacingScale | 1 |
| 7.6 | No collapse/expand all for token groups in Editor | TokenTree | 2 |
| 7.7 | Token group collapse state not persisted between sessions | TokenGroupNode | 1 |

---

## H8: Aesthetic and Minimalist Design

Dialogues should not contain irrelevant or rarely needed information.

| # | Finding | Location | Severity |
|---|---------|----------|----------|
| 8.1 | Color preview strip on TokenSetCard is 2px tall -- too small to be useful | TokenSetCard | 1 |
| 8.2 | Raw JSON displayed for complex typography/shadow tokens -- hard to parse visually | TypographySpecimens, TokenValueNode | 2 |
| 8.3 | Version entry colored dot is purely decorative -- adds visual noise without meaning | VersionEntry | 1 |
| 8.4 | Compiler stats (token count, errors, file size) are useful but visually compete for attention | Compiler | 1 |

---

## H9: Help Users Recognize, Diagnose, and Recover from Errors

Error messages should be expressed in plain language, precisely indicate the problem, and suggest a solution.

| # | Finding | Location | Severity |
|---|---------|----------|----------|
| 9.1 | Token validation shows red border but no explanatory text | TokenValueNode | 3 |
| 9.2 | Import error shows generic message -- no guidance on how to fix file format | SyncView | 3 |
| 9.3 | Invalid hex values silently render as black -- no indication of the problem | ColorGrid | 2 |
| 9.4 | Unresolved token references show #cccccc placeholder -- looks like a valid color | TokenValueNode, ColorGrid | 2 |
| 9.5 | AddTokenDialog uses browser alert for validation -- no inline field errors | AddTokenDialog | 2 |
| 9.6 | Compiler error count shown in red but no detail about which tokens have errors | Compiler | 3 |

---

## H10: Help and Documentation

The system should provide help and documentation that is easy to find, focused on the user's task, and concise.

| # | Finding | Location | Severity |
|---|---------|----------|----------|
| 10.1 | No onboarding or first-run guidance beyond loading sample data | App | 2 |
| 10.2 | No tooltips explaining what modes, versions, or token types are | Editor, Browser | 2 |
| 10.3 | No help text for reference syntax (e.g., `{color.primary}`) | AddTokenDialog, Editor | 2 |
| 10.4 | No documentation for supported import formats and their expected structure | SyncDropZone | 2 |
| 10.5 | Compiler format tabs have no description of what each format is for | Compiler | 1 |

---

## Accessibility Audit Summary

These issues cut across multiple heuristics but warrant a dedicated section.

| # | Finding | Location | Severity |
|---|---------|----------|----------|
| A.1 | AddTokenDialog lacks `role="dialog"`, `aria-modal`, and focus trap | AddTokenDialog | 4 |
| A.2 | TokenGroupNode missing `aria-expanded` on collapsible buttons | TokenGroupNode | 3 |
| A.3 | Tab components lack `role="tab"`, `role="tablist"`, `aria-selected` | Browser, Compiler | 3 |
| A.4 | No skip-to-main-content link | App | 2 |
| A.5 | Color-only status indicators (sync status dot, diff status badges) | Header, SyncTokenRow | 3 |
| A.6 | Icon buttons missing `aria-label` throughout | Global | 3 |
| A.7 | No visible focus indicators beyond browser defaults | Global | 3 |
| A.8 | BinarySeparator decorative elements not hidden with `aria-hidden` | App | 1 |
| A.9 | Nav buttons lack `aria-current="page"` for active state | Header | 2 |
| A.10 | Keyboard-inaccessible delete button (hover-only visibility) | TokenValueNode | 3 |

---

## Top 10 Issues by Impact

Prioritized by severity and frequency of user encounter:

| Rank | ID | Issue | Severity |
|------|-----|-------|----------|
| 1 | 3.1 | No undo/redo for token edits | 4 |
| 2 | 1.7 | Silent localStorage quota failures | 4 |
| 3 | 5.1 | "Clear All" has no confirmation | 4 |
| 4 | A.1 | Dialog lacks role, aria-modal, focus trap | 4 |
| 5 | 1.1 | No save confirmation for token edits | 3 |
| 6 | 7.4 | No search/filter in token tree or browser | 3 |
| 7 | 7.2 | No copy-to-clipboard in Browser views | 3 |
| 8 | 5.2 | No duplicate token name prevention | 3 |
| 9 | 3.4 | Blur auto-saves without confirmation | 3 |
| 10 | 1.4 | Sync status always shows "UNSYNCED" | 3 |

---

## Positive Patterns Observed

- Consistent header navigation across all views
- Clear visual token previews (color swatches, spacing bars, typography specimens, shadow samples)
- Confirmation dialogs on destructive version operations (restore, delete)
- Device-aware shadow interaction (hover vs touch)
- Contrast ratio display in ColorGrid (useful for accessibility checking)
- Structured conflict resolution workflow in Sync view
- Auto-pruning of versions (max 50) prevents unbounded storage
- "Before restore" auto-backup on version restore
- Good use of monospace for technical data, serif for content
- Empty states guide users to take action

---

## Recommendations

### Quick wins (severity 1-2, low effort)
1. Add `aria-label` to all icon buttons
2. Add `aria-expanded` to TokenGroupNode collapse buttons
3. Add confirmation dialog to "Clear All" button
4. Add `aria-hidden="true"` to decorative elements
5. Show inline validation errors instead of browser alerts

### Medium effort (severity 2-3)
1. Add copy-to-clipboard to all Browser view token values
2. Add search/filter to token tree and browser
3. Add Escape key handling to AddTokenDialog
4. Replace browser confirm/alert with styled modal dialogs
5. Add loading states to file import operations
6. Implement disabled button explanations (tooltip on disabled state)

### High effort (severity 3-4)
1. Implement undo/redo system (command pattern or state snapshots)
2. Add focus trap to AddTokenDialog
3. Add URL-based routing for browser back button support
4. Add localStorage quota detection and user notification
5. Include modes in version snapshots
6. Add cascade cleanup for orphaned mode overrides on token deletion
