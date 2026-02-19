# QA Issue: Components View -- Preloading, Wrong Colors, Non-functional Controls, Card Atom

**Date:** 2026-02-19
**Status:** Fixed
**Reporter:** QA Review

## Issue Description

Five issues with the Components (Atoms) view:

1. Component previews showed wrong colors -- the app's own crimson (#f40c3f) and dark surface tones, not neutral fallbacks.
2. State and variant pill controls appeared to do nothing when clicked (0 bindings meant no visual change).
3. Card was listed as an atom; it is a molecule in atomic design.
4. `AnimatePresence mode="wait"` in ComponentDetail tab content caused React 18 StrictMode double-mount to corrupt presence tracking, leaving tab content stuck at opacity: 0.
5. Store persist version needed bumping (2 to 4) with migration to re-seed components for users with stale localStorage.

## Root Cause

1. **Wrong colors:** `ComponentPreview.tsx` template functions used `#f40c3f` (app crimson) as CSS var fallbacks. Since seed components have 0 bindings, `deriveCssVars` returns `{}` and every preview fell back to crimson.

2. **Non-functional controls:** The state/variant pills updated React state correctly, but with 0 bindings the preview never changed visually.

3. **Card atomicLevel:** `definitions.ts` had `card` defined with `atomicLevel: 'atom'`. Card is a composite component (molecule).

4. **Invisible tab content:** `ComponentDetail.tsx` wrapped tab content in `<AnimatePresence mode="wait">`. React 18 StrictMode double-mount corrupts AnimatePresence's internal presence tracking, leaving children at opacity: 0. Same bug that was already fixed in `App.tsx` (commit 88aa924).

5. **Stale localStorage:** Store was at persist version 2. Needed v4 migration to re-seed components for any user whose localStorage was in an inconsistent state.

## Solution

- Changed all `ComponentPreview.tsx` CSS var fallbacks from crimson (`#f40c3f`) to neutral grays (`#555`, `#aaa`, `#777`, etc.) so unbound previews look like generic component wireframes.
- Added small "unbound -- add tokens to customize" label when `bindings.length === 0`.
- Changed `card.atomicLevel` from `'atom'` to `'molecule'` in `definitions.ts`.
- Removed `AnimatePresence mode="wait"` from `ComponentDetail.tsx`, replaced with bare `motion.div` with `key` (same pattern as App.tsx fix).
- Bumped store persist version to 4 with migration that re-seeds components if array is empty.

## Files Modified

- `src/components/components/ComponentPreview.tsx` -- Neutral fallback colors, "unbound" label
- `src/components/components/ComponentDetail.tsx` -- Removed AnimatePresence, bare motion.div
- `src/lib/atoms/definitions.ts` -- card atomicLevel: 'atom' -> 'molecule'
- `src/store/useTokenStore.ts` -- Persist version 2 -> 4, re-seed migration

## Verification Results

### Code Review
- [x] Changes match approved plan
- [x] Design system compliance verified
- [x] No unintended side effects detected

### Browser Testing
- [x] Reload app and confirm Components view shows atom list in sidebar
- [x] Confirm component preview renders actual component visual (button, badge, etc.) with neutral colors
- [x] Confirm state/variant pills are visible and toggle correctly
- [x] Confirm Card appears under "Molecules" section (not atoms)
- [x] Confirm tab switching (Overview/Anatomy/Tokens/Code) works without content disappearing
- [x] Clear localStorage and reload to verify v4 migration seeds components

## CLAUDE.md Updates

None -- existing rules were sufficient. AnimatePresence gotcha already documented in session memory.
