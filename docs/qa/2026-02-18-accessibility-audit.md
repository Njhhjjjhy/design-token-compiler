# Accessibility Audit Report -- WCAG 2.1 AA

**Date:** 2026-02-18
**Scope:** Full application (all 5 views + shared components)
**Standard:** WCAG 2.1 Level AA

---

## Summary

| Severity | Count |
|----------|-------|
| Critical | 4 |
| Serious | 16 |
| Moderate | 28 |
| Minor | 8 |
| **Total** | **56** |

**WCAG AA verdict:** FAIL -- 4 critical and 16 serious issues must be resolved.

**Existing strengths:**
- `lang="en"` on `<html>` element
- `:focus-visible` global styling with primary color outline
- `aria-hidden="true"` on decorative elements (BinarySeparator)
- `role="dialog"` and `aria-modal="true"` on most modals
- `aria-expanded` on tree node toggles
- `aria-selected` on tab buttons
- `aria-live="polite"` on save indicator
- Escape key handling on modals
- Focus trap in AddTokenDialog

---

## Color Contrast Analysis

Calculated against tailwind.config.js color definitions:

| Foreground | Background | Ratio | AA Normal (4.5:1) | AA Large (3:1) |
|------------|------------|-------|--------------------|----------------|
| white (#fff0eb) | surface (#1e0505) | 17.5:1 | PASS | PASS |
| text-secondary (#b39e9e) | surface (#1e0505) | 7.7:1 | PASS | PASS |
| text-tertiary (#7a6565) | surface (#1e0505) | 3.6:1 | FAIL | PASS |
| text-tertiary (#7a6565) | surface-elevated (#2a0a0a) | 3.4:1 | FAIL | PASS |
| primary (#f40c3f) | surface (#1e0505) | 4.6:1 | PASS (marginal) | PASS |
| text-secondary (#b39e9e) | surface-elevated (#2a0a0a) | 6.4:1 | PASS | PASS |

**Key finding:** `text-tertiary` fails AA for normal-sized text everywhere it appears. It is used extensively for metadata, timestamps, counts, legends, and labels.

---

## Critical Issues (4)

### C1. Text-tertiary color fails contrast -- global

**WCAG:** 1.4.3 Contrast (Minimum)
**Impact:** All users with low vision or in bright environments
**Locations:** Every view -- used for timestamps, counts, labels, metadata, legends
**Current:** `#7a6565` on `#1e0505` = 3.6:1 (needs 4.5:1)
**Fix:** Change text-tertiary to at least `#9a8080` (~4.6:1) in tailwind.config.js. Audit all uses -- some currently at `text-[10px]` which makes the problem worse.

### C2. Shadow samples not keyboard accessible -- Browser

**WCAG:** 2.1.1 Keyboard
**Location:** `src/components/browser/ShadowSamples.tsx:32-35`
**Current:** Interactive hover/click on `<div>` with mouse events only, no tabIndex or keyDown
**Fix:** Add `tabIndex={0}`, `role="button"`, `onKeyDown` for Enter/Space, and `onFocus`/`onBlur` equivalents for `onMouseEnter`/`onMouseLeave`

### C3. Color swatches lack text alternatives -- Browser

**WCAG:** 1.1.1 Non-text Content
**Location:** `src/components/browser/ColorGrid.tsx:86-107`
**Current:** Color `<div>` elements with no accessible name
**Fix:** Add `role="img"` and `aria-label={`Color: ${value}`}` to swatch container

### C4. Drag-and-drop zone not keyboard accessible -- Sync

**WCAG:** 2.1.1 Keyboard
**Location:** `src/components/sync/SyncDropZone.tsx:68-128`
**Current:** Drop zone has mouse-only events. The "Choose File" button inside is accessible, but the zone itself is not.
**Fix:** Add `tabIndex={0}`, `role="button"`, `onKeyDown` to trigger file picker on Enter/Space. Alternatively, since the file input button exists, mark the surrounding drop zone as `aria-hidden` and ensure the button alone is the keyboard target.

---

## Serious Issues (16)

### S1. TokenSetCard is a non-semantic clickable div -- Dashboard

**WCAG:** 2.1.1 Keyboard, 4.1.2 Name/Role/Value
**Location:** `src/components/dashboard/TokenSetCard.tsx:77`
**Current:** `<div onClick={onClick}>` -- no keyboard access, no role
**Fix:** Use `<article>` with `tabIndex={0}`, `role="button"`, `onKeyDown`, `aria-label`; or restructure with a wrapping `<button>`

### S2. Modal focus traps missing -- Dashboard, Editor, Versioning

**WCAG:** 2.1.2 No Keyboard Trap (inverse -- focus escapes to background)
**Locations:**
- `DashboardView.tsx:224-308` (clear/sample confirmation)
- `TokenValueNode.tsx:292-333` (delete confirmation)
- `VersionPanel.tsx:125-176` (version confirmation)
**Current:** Modals have Escape handling but no Tab cycling trap
**Fix:** Implement focus trap (cycle Tab/Shift+Tab within dialog). Restore focus to trigger element on close.

### S3. Search inputs lack labels -- Editor, Browser

**WCAG:** 1.3.1 Info and Relationships, 3.3.2 Labels
**Locations:**
- `EditorHeader.tsx:100-108`
- `BrowserHeader.tsx:59-67`
**Current:** `<input placeholder="Filter tokens...">` with no `<label>` or `aria-label`
**Fix:** Add `aria-label="Filter tokens"` to each input

### S4. Tab panels missing `role="tabpanel"` -- Browser, Compiler

**WCAG:** 1.3.1 Info and Relationships
**Locations:**
- `BrowserHeader.tsx:70-88` (tabs have `role="tab"` but panels have no `role="tabpanel"`)
- `CompilerView.tsx:238-261`
**Current:** Tabs use correct `role="tab"` and `aria-selected`, but content has no `role="tabpanel"`, `aria-labelledby`, or `aria-controls`
**Fix:** Add `id` to each tab, `aria-controls` pointing to panel; add `role="tabpanel"` and `aria-labelledby` to content panels

### S5. Tab keyboard navigation missing -- Browser, Compiler

**WCAG:** 2.1.1 Keyboard
**Locations:** `BrowserHeader.tsx:70-88`, `CompilerView.tsx:238-261`
**Current:** Tabs are individually focusable via Tab key but lack arrow key navigation per WAI-ARIA Authoring Practices (only active tab should be in tab order; arrow keys move between tabs)
**Fix:** Set `tabIndex={activeTab === tab.id ? 0 : -1}` and handle ArrowLeft/ArrowRight

### S6. Tree view lacks `role="tree"` -- Editor

**WCAG:** 1.3.1 Info and Relationships
**Location:** `src/components/editor/TokenTree.tsx:58-71`
**Current:** Container is a plain `<div>` with no tree role
**Fix:** Add `role="tree"` to root, `role="treeitem"` to nodes with `aria-level`, `aria-setsize`, `aria-posinset`

### S7. Edit input missing label -- Editor

**WCAG:** 3.3.2 Labels
**Location:** `src/components/editor/TokenValueNode.tsx:233-247`
**Current:** Inline edit `<input>` has `placeholder` but no `aria-label`
**Fix:** Add `aria-label="Edit value for {tokenName}"`

### S8. Error messages not linked to inputs -- Editor, AddTokenDialog

**WCAG:** 3.3.1 Error Identification, 4.1.3 Status Messages
**Locations:**
- `TokenValueNode.tsx:248-250` (empty value error)
- `AddTokenDialog.tsx:209-213` (duplicate name error)
**Current:** Error `<p>` elements appear visually below inputs but are not connected via `aria-describedby`
**Fix:** Add `id` to error, `aria-describedby` on input, wrap error in `role="alert"`

### S9. Edit mode not announced -- Editor

**WCAG:** 4.1.3 Status Messages
**Location:** `src/components/editor/TokenValueNode.tsx:80-83`
**Current:** Transition to edit mode has no screen reader announcement
**Fix:** Add `aria-live="polite"` region: "Editing {name}. Enter to save, Escape to cancel."

### S10. Copy button feedback not announced -- Compiler

**WCAG:** 4.1.3 Status Messages
**Location:** `src/pages/CompilerView.tsx:163-178`
**Current:** "COPIED" text change is visual only
**Fix:** Add `aria-live="polite"` region that announces "Code copied to clipboard"

### S11. Code output area lacks semantic label -- Compiler

**WCAG:** 1.3.1 Info and Relationships
**Location:** `src/pages/CompilerView.tsx:270-291`
**Current:** SyntaxHighlighter output in a plain `<div>` with no accessible name
**Fix:** Add `role="region"` and `aria-label="Generated {format} code"`

### S12. Spacing bar visualization lacks text alternative -- Browser

**WCAG:** 1.1.1 Non-text Content
**Location:** `src/components/browser/SpacingScale.tsx:91-93`
**Current:** Visual bar with no accessible label
**Fix:** Add `role="meter"` with `aria-valuenow`, `aria-valuemin`, `aria-valuemax`; or `role="img"` with `aria-label`

### S13. Filter toggle buttons lack group semantics -- Sync

**WCAG:** 4.1.2 Name, Role, Value
**Location:** `src/components/sync/SyncHeader.tsx:111-128`
**Current:** Plain buttons with no indication they form a selector group; no `aria-pressed` or radio semantics
**Fix:** Use `role="radiogroup"` with `role="radio"` and `aria-checked`, or `aria-pressed` toggle buttons

### S14. Diff table uses div layout, not semantic table -- Sync

**WCAG:** 1.3.1 Info and Relationships
**Location:** `src/components/sync/SyncDiffPanel.tsx:43-92`
**Current:** Column headers and rows are `<div>` and `<span>` elements with no table semantics
**Fix:** Use `<table>`, `<thead>`, `<th scope="col">`, `<tbody>`, `<tr>`, `<td>`

### S15. Shadow sample boxes missing text alternatives -- Browser

**WCAG:** 1.1.1 Non-text Content
**Location:** `src/components/browser/ShadowSamples.tsx:39-45`
**Current:** Shadow preview `<div>` with no accessible label
**Fix:** Add `role="img"` and `aria-label="Shadow preview: {value}"`

### S16. Version name input missing label -- Versioning

**WCAG:** 3.3.2 Labels
**Location:** `src/components/versioning/VersionPanel.tsx:76-83`
**Current:** `<input placeholder="Version name (optional)">` with no label
**Fix:** Add `<label className="sr-only">` or `aria-label`

---

## Moderate Issues (28)

### M1. No `<h1>` on page -- all views
**WCAG:** 1.3.1 -- Add `<h1>` to Header ("TOKEN COMPILER") or sr-only `<h1>` in each view

### M2. Focus not managed on view change via keyboard shortcuts
**WCAG:** 2.4.3 -- `App.tsx:43-66`: after Cmd+1-5, focus should move to `#main-content`

### M3. No focus restoration on modal close -- Dashboard, Editor, Versioning
**WCAG:** 2.4.3 -- Save trigger ref, restore focus on close

### M4. Color preview bar on cards has no alt text -- Dashboard
**WCAG:** 1.4.1 -- `TokenSetCard.tsx:78-83`: add `role="img"` and `aria-label`

### M5. Mode badge lacks accessible context -- Dashboard, Editor
**WCAG:** 1.3.1 -- Add `aria-label="Active mode: {name}"` to mode badge spans

### M6. Button groups not semantically grouped -- Dashboard, Sync
**WCAG:** 1.3.1 -- Wrap action button sets in `role="group"` with `aria-label`

### M7. `title` attributes used where `aria-label` is needed -- Editor, Browser, Versioning
**WCAG:** 3.3.2 -- `title` is not reliably available to keyboard/screen reader users. Replace with `aria-label` on interactive elements.

### M8. Mode toggle buttons need radiogroup semantics -- Editor, Browser
**WCAG:** 1.3.1, 4.1.2 -- `EditorHeader.tsx:42-64`, `BrowserHeader.tsx:43-54`: use `role="radiogroup"` with `aria-checked`

### M9. Required fields not marked accessibly -- AddTokenDialog
**WCAG:** 3.3.2 -- `AddTokenDialog.tsx:195`: use `aria-required="true"` on input

### M10. Dialog missing `aria-describedby` -- all modals
**WCAG:** 1.3.1 -- Add `id` to description paragraphs, `aria-describedby` to dialog containers

### M11. Color token path truncated with no accessible full path -- Browser
**WCAG:** 1.3.1 -- `ColorGrid.tsx:109-110`: add `aria-label` for full path

### M12. Contrast abbreviations ambiguous for screen readers -- Browser
**WCAG:** 3.1.3 -- `ColorGrid.tsx:113-119`: "W 4.5" should have `aria-label="Contrast vs white: 4.5"`

### M13. Category headings not linked to grids -- Browser
**WCAG:** 1.3.1 -- Add `aria-labelledby` on grid pointing to category `<h3>` id

### M14. Sort button lacks descriptive label -- Browser
**WCAG:** 4.1.2 -- `SpacingScale.tsx:66-72`: add `aria-label="Sort by {mode}"`

### M15. Typography specimen lacks heading hierarchy -- Browser
**WCAG:** 1.3.1 -- `TypographySpecimens.tsx:59-73`: first `<p>` should be `<h3>`

### M16. Typography properties not in semantic list -- Browser
**WCAG:** 1.3.1 -- `TypographySpecimens.tsx:64-71`: use `<dl>` definition list

### M17. Shadow sample cards missing focus indicator -- Browser
**WCAG:** 2.4.7 -- `ShadowSamples.tsx:30-35`: add `focus:ring-2 focus:ring-primary`

### M18. Compiler error list not announced -- Compiler
**WCAG:** 4.1.3 -- `CompilerView.tsx:225-235`: wrap in `role="region"` with `aria-live="polite"`

### M19. Format description not linked to tab panel -- Compiler
**WCAG:** 1.3.1 -- `CompilerView.tsx:263-268`: use `aria-describedby` linking description to panel

### M20. File input label association fragile -- Sync
**WCAG:** 1.3.1 -- `SyncDropZone.tsx:101-109`: use explicit `htmlFor`/`id` instead of implicit wrapping; use `sr-only` instead of `hidden`

### M21. Loading state not announced -- Sync
**WCAG:** 4.1.3 -- `SyncDropZone.tsx:82-88`: add `aria-busy="true"` and `aria-live="polite"` announcement

### M22. Error message needs live region -- Sync
**WCAG:** 4.1.3 -- `SyncDropZone.tsx:120-125`: add `role="alert"` to error container

### M23. Disabled button reason not accessible -- Sync
**WCAG:** 4.1.2 -- `SyncHeader.tsx:55-69`: reason in `title` only; use `aria-label` instead

### M24. Batch resolve buttons lack context -- Sync
**WCAG:** 1.3.1 -- `SyncHeader.tsx:131-146`: add `role="group"` and `aria-label="Batch conflict resolution"`

### M25. Color/dimension previews in diff missing labels -- Sync
**WCAG:** 1.1.1 -- `SyncTokenRow.tsx:207-226`: add `role="img"` and `aria-label` to preview elements

### M26. Strikethrough text not announced -- Sync
**WCAG:** 1.4.1 -- `SyncTokenRow.tsx:76-77`: add `aria-label` indicating "discarded" state

### M27. Small buttons lack focus ring -- Sync
**WCAG:** 2.4.7 -- `SyncTokenRow.tsx:89-112`: add `focus:ring-2` classes

### M28. Color preview on token node missing label -- Editor
**WCAG:** 1.1.1 -- `TokenValueNode.tsx:170-203`: add `aria-label` to color/dimension preview divs

---

## Minor Issues (8)

### m1. Shortcut keys not discoverable -- Header nav buttons
### m2. Icon decorative status not explicit -- EmptyState FileQuestion icon needs `aria-hidden="true"`
### m3. Version list not marked as `<ul>` -- VersionPanel
### m4. Version entry could use `<h4>` for name -- VersionEntry
### m5. Search "no results" not announced -- TokenTree, BrowserView
### m6. Save indicator could add `role="status"` and `aria-atomic="true"`
### m7. Pixel conversion note not semantically linked -- SpacingScale
### m8. Resolution progress indicator not a live region -- SyncHeader

---

## Priority Fix Order

### Phase 1: Critical (immediate)
1. Fix text-tertiary contrast in tailwind.config.js
2. Make shadow samples keyboard accessible
3. Add alt text to color swatches
4. Add keyboard support to sync drop zone

### Phase 2: Serious (next)
5. Convert TokenSetCard to semantic button/article
6. Add focus traps to all modals
7. Label all search/edit inputs
8. Add tabpanel roles and keyboard nav to tabs
9. Add tree roles to editor tree
10. Add error linking and announcements
11. Add live region announcements (edit mode, copy, status)
12. Add labels to visual previews (spacing bars, shadows)
13. Add group semantics to filter toggles
14. Convert diff layout to semantic table

### Phase 3: Moderate (cleanup)
15. Add h1 to page
16. Focus management on view change
17. Focus restoration on modal close
18. Replace title with aria-label throughout
19. Add radiogroup semantics to mode toggles
20. Remaining labeling and semantic improvements

### Phase 4: Minor (polish)
21. Shortcut discoverability
22. Decorative icon hiding
23. List semantics
24. Live region refinements

---

## Keyboard Navigation Map

| Action | Key | Status | View |
|--------|-----|--------|------|
| Navigate between views | Cmd+1-5 | Works, no focus mgmt | All |
| Tab through interactive elements | Tab | Works (mostly) | All |
| Navigate between tabs | Arrow keys | Missing | Browser, Compiler |
| Expand/collapse tree node | Click only | Missing arrow keys | Editor |
| Close modal | Escape | Works | All modals |
| Cycle focus within modal | Tab | Missing (focus escapes) | All modals |
| Activate shadow sample | Keyboard | Missing entirely | Browser |
| File drop zone | Keyboard | Missing (file button works) | Sync |
| Resolve conflict | Tab+Enter | Works | Sync |

---

## Testing Notes

- Audit performed via static code review (no live screen reader testing)
- Contrast ratios calculated mathematically from hex values in tailwind.config.js
- Keyboard navigation assessed from event handlers in source code
- Recommend follow-up testing with VoiceOver + Safari and NVDA + Chrome
