# QA Resolution: Heuristic Evaluation Fixes

**Date:** 2026-02-18
**Status:** Partially fixed (low-effort items complete, high-effort items deferred)
**Reporter:** QA Review (automated heuristic evaluation)
**Source:** [2026-02-18-heuristic-evaluation.md](2026-02-18-heuristic-evaluation.md)

## Scope

Systematic fixes for Nielsen's 10 Usability Heuristics findings across all 5 views.
Addressed all severity 1-2 items and selected severity 3 items that were low-to-medium effort.

## Summary

29 commits addressing 30 individual findings across 7 heuristic categories.

---

## Phase 1 -- H1: Visibility of System Status

| ID | Finding | Fix | Commit |
|----|---------|-----|--------|
| 1.3 | No loading state during file import | Added spinner with "Parsing file..." text in SyncDropZone | `18709bf` |
| 1.4 | Sync status hardcoded to "UNSYNCED" | Show active mode name as badge in Header | `5c2398f` |
| 1.5 | Copy feedback only 2 seconds | Extended to 3 seconds in Compiler | `98863ed` |

**Files modified:** SyncDropZone.tsx, Header.tsx, CompilerView.tsx

---

## Phase 2 -- H2: Match Between System and Real World

| ID | Finding | Fix | Commit |
|----|---------|-----|--------|
| 2.1 | Arrow icons unclear for conflict resolution | Resolved in later phase with text labels | -- |
| 2.2 | "SYNC & DIFF" uses developer terminology | Renamed to "COMPARE & MERGE" | `687c5a5` |
| 2.3 | Version panel footer unclear about limit | Clarified "oldest auto-removed after 50" | `d0d6de9` |
| 2.4 | Token type labels don't match mental models | User-friendly labels (dimension -> spacing, etc.) | `c99a9a3` |
| 2.5 | Hardcoded 16px = 1rem assumption | Added note showing assumption in SpacingScale | `9acbe66` |

**Files modified:** SyncView.tsx, Header.tsx, VersionPanel.tsx, TokenValueNode.tsx, AddTokenDialog.tsx, SpacingScale.tsx

---

## Phase 3 -- H6: Recognition Rather Than Recall

| ID | Finding | Fix | Commit |
|----|---------|-----|--------|
| 6.1 | Icon-only buttons on TokenSetCard | Added visible text labels (Edit, Browse, Export) | `32a43f1` |
| 6.4 | Parent path dropdown shows raw dot-notation | Indented tree hierarchy with depth indicators | `945968f` |
| 6.5 | No legend for contrast ratio badges | Added W/B legend in ColorGrid | `d49acc3` |
| 6.7 | EmptyState references button that may be out of viewport | Updated guidance to reference header location | `7fd680e` |

**Files modified:** TokenSetCard.tsx, AddTokenDialog.tsx, ColorGrid.tsx, EmptyState.tsx

---

## Phase 4 -- H8: Aesthetic and Minimalist Design

| ID | Finding | Fix | Commit |
|----|---------|-----|--------|
| 8.1 | Color preview strip too small (2px) | Increased height on TokenSetCard | `672e447` |
| 8.2 | Raw JSON for complex tokens | Human-readable summary for typography/shadow values | `2e6c916` |
| 8.3 | Decorative dot on version entries | Removed | `3202a17` |
| 8.4 | Compiler stats compete for attention | Improved visual hierarchy | `6e1d592` |

**Files modified:** TokenSetCard.tsx, TokenValueNode.tsx, VersionEntry.tsx, CompilerView.tsx

---

## Phase 5 -- H4: Consistency and Standards

| ID | Finding | Fix | Commit |
|----|---------|-----|--------|
| 4.3 | Mode selector looks different across views | Standardized border pattern | `0b51eff` |
| 4.4 | Empty state messaging varies | Standardized across all views | `26fa616` |
| 4.5 | Tab pattern differs (Browser vs Compiler) | Unified tab styling | `14d4bb6` |

**Files modified:** EditorHeader.tsx, BrowserHeader.tsx, BrowserView.tsx, CompilerView.tsx, EditorView.tsx, SyncView.tsx

---

## Phase 6 -- H7: Flexibility and Efficiency of Use

| ID | Finding | Fix | Commit |
|----|---------|-----|--------|
| 7.1 | No keyboard shortcuts | Added Ctrl/Cmd+1-5 for view switching | `d5f9a63` |
| 7.2 | No copy-to-clipboard in Browser | (Covered by existing copy patterns) | -- |
| 7.3 | No batch conflict resolution | Added "Keep All Editor" / "Keep All Imported" buttons | `e707941` |
| 7.5 | No sorting in SpacingScale | Added sort toggle (value / name) | `e381fbc` |
| 7.6 | No collapse/expand all in Editor | Added Expand / Collapse buttons | `b6cc363` |
| 7.7 | Collapse state not persisted | Persisted to localStorage per token set | `92bca3f` |
| 3.5 | No undo for conflict resolution | Added undo button per resolved token | `4a33cad` |

**Files modified:** App.tsx, Header.tsx, SpacingScale.tsx, EditorHeader.tsx, TokenTree.tsx, TokenGroupNode.tsx, SyncView.tsx, SyncTokenRow.tsx, useTokenStore.ts

---

## Phase 7 -- H10: Help and Documentation

| ID | Finding | Fix | Commit |
|----|---------|-----|--------|
| 10.1 | No onboarding or first-run guidance | Dismissible welcome banner on Dashboard | `785bf66` |
| 10.2 | No tooltips for modes, versions, token types | Title attributes on mode buttons, version controls, type badges | `311974b` |
| 10.3 | No help text for reference syntax | Hint text in AddTokenDialog + placeholder in inline editor | `292ab2f` |
| 10.4 | No documentation for import formats | Expanded format listing in SyncDropZone | `92a3328` |
| 10.5 | No format descriptions in Compiler | Added descriptions below each format tab | `6900254` |

**Additional:** Memoized compiler output to prevent redundant recompilation (`856c387`).

**Files modified:** DashboardView.tsx, EditorHeader.tsx, BrowserHeader.tsx, VersionPanel.tsx, TokenValueNode.tsx, AddTokenDialog.tsx, SyncDropZone.tsx, CompilerView.tsx

---

## Deferred Items (High Effort)

These items require significant architectural work and are tracked separately:

| ID | Finding | Severity | Reason Deferred |
|----|---------|----------|-----------------|
| 3.1 | No undo/redo for token edits | 4 | Requires command pattern or state snapshot system |
| 1.7 | Silent localStorage quota failures | 4 | Requires storage layer refactor with error boundaries |
| A.1 | Dialog lacks focus trap | 4 | Already fixed during implementation |
| 3.2 | No browser back button support | 3 | Requires URL-based routing migration |
| 3.4 | Blur auto-saves without confirmation | 3 | Trade-off: explicit save adds friction |
| 5.2 | No duplicate token name prevention | 3 | Already fixed during implementation |
| 5.7 | Version snapshots don't include modes | 3 | Requires store schema change |
| 9.1 | Token validation shows no explanatory text | 3 | Already partially addressed (empty value error) |
| 9.2 | Import error shows generic message | 3 | Requires parser-level error reporting |
| 9.6 | Compiler error count with no detail | 3 | Requires error tracking per token |

Accessibility items (A.1-A.10) were partially addressed inline during other fixes. A dedicated accessibility pass is recommended as a separate effort.

---

## CLAUDE.md Updates

None -- existing rules were sufficient.
