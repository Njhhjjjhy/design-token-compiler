# QA Issue: Bugs #3-#8 -- Logic, Validation, and Dead Code Fixes

**Date:** 2026-02-18
**Status:** Completely Fixed
**Reporter:** QA Review

## Issue Description

Six code-level bugs identified during QA review across dashboard, store, sync, browser, and editor components.

## Bugs and Root Causes

### Bug #3: Dashboard versionCount hardcoded to 0

**Location:** `src/pages/DashboardView.tsx:119`
**Root cause:** `versionCount={0}` passed as a static literal to every `TokenSetCard`. The `versions` state from the store was never subscribed to or read.
**Fix:** Subscribe to `versions` from the store and pass `(versions[tokenSet.id] || []).length`.

### Bug #4: restoreVersion missing 50-version pruning

**Location:** `src/store/useTokenStore.ts:418-449`
**Root cause:** `saveVersion` enforces a 50-version cap with `splice(0, len - 50)`, but `restoreVersion` appends an auto-save backup without any pruning. Rapid restore cycles could exceed the cap indefinitely.
**Fix:** Added identical `splice` pruning after appending the auto-save version.

### Bug #5: Sync APPLY disabled when file has 0 conflicts

**Location:** `src/components/sync/SyncHeader.tsx:29`
**Root cause:** `allResolved = totalConflicts > 0 && resolvedCount >= totalConflicts`. When importing an identical file (0 conflicts), the `> 0` guard keeps APPLY permanently disabled despite there being nothing to resolve.
**Fix:** Changed to `totalConflicts === 0 || resolvedCount >= totalConflicts`. Zero conflicts means everything is already resolved.

### Bug #6: TypographySpecimens dead code branch

**Location:** `src/components/browser/TypographySpecimens.tsx:18-22`
**Root cause:** `parseTypographyValue` had an `if` branch checking for non-digit strings and a fallback, but both returned `{ fontFamily: str }`. The condition was meaningless.
**Fix:** Removed the dead `if` branch. Single `return { fontFamily: String(value) }` remains.

### Bug #7: ColorGrid hex regex accepts invalid lengths

**Location:** `src/components/browser/ColorGrid.tsx:69`
**Root cause:** Regex `/^#[0-9a-fA-F]{3,8}$/` matches 3 to 8 hex characters, but valid hex colors are only 3 (shorthand RGB), 4 (shorthand RGBA), 6 (RGB), or 8 (RGBA) digits. Values like `#12345` (5 digits) or `#1234567` (7 digits) would incorrectly pass validation.
**Fix:** Changed to `/^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/` to match only valid lengths.

### Bug #8: AddTokenDialog accepts whitespace-only input

**Location:** `src/components/editor/AddTokenDialog.tsx:21`
**Root cause:** Validation `if (!tokenName || !tokenValue)` does not trim inputs. A name of `"   "` (spaces only) passes the falsy check and creates a token with a whitespace-only name.
**Fix:** Added `trim()` to both name and value before validation. Trimmed values are passed to `addToken`.

## Files Modified

- `src/pages/DashboardView.tsx` -- subscribe to versions store, pass real count
- `src/store/useTokenStore.ts` -- add pruning to restoreVersion auto-save
- `src/components/sync/SyncHeader.tsx` -- fix allResolved logic for 0 conflicts
- `src/components/browser/TypographySpecimens.tsx` -- remove dead code branch
- `src/components/browser/ColorGrid.tsx` -- tighten hex regex to valid lengths only
- `src/components/editor/AddTokenDialog.tsx` -- trim inputs before validation

## Verification Results

### Code Review
- [x] Changes match approved plan
- [x] No unintended side effects detected
- [x] All fixes are minimal, targeted single-point changes

### Build Verification
- [x] `npm run build` passes clean (tsc + vite build)
- [x] No new warnings or errors introduced

## CLAUDE.md Updates

None -- existing rules were sufficient.
