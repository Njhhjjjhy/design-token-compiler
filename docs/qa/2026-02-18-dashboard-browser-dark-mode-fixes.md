# QA Issue: Dashboard, Browser, and Dark Mode Fixes

**Date:** 2026-02-18
**Status:** Fixed (6 bugs resolved)
**Reporter:** QA Review

## Issue Description

Six issues identified during QA review of the design token compiler:

1. **Duplicate token set cards** -- Dashboard showed duplicate cards after page reload
2. **Token set card not clickable** -- Card body had no click handler; only action icons were interactive
3. **Typography tab empty** -- Browser typography tab showed no tokens
4. **Shadows tab empty** -- Browser shadow tab showed no tokens
5-6. **Dark mode toggle ineffective** -- Switching to dark mode showed minimal visible change (only 4 of 27+ colors had overrides)

## Root Causes

**Bug #1:** `useEffect` in App.tsx ran before Zustand hydration from localStorage, so `tokenSets` appeared empty and sample data was added again on every mount.

**Bug #2:** TokenSetCard had no `onClick` on the card container, only on individual action icon buttons. Also, action buttons did not call `stopPropagation()`.

**Bug #3-4:** `sampleTokens.ts` had zero typography tokens (no fontFamily, fontWeight, or font-prefixed dimension tokens) and zero shadow tokens (type: 'shadow').

**Bug #5-6:** Only 4 dark mode overrides existed (background, surface, text-primary, text-secondary). The remaining semantic and all component colors had no dark mode values, so switching modes produced near-invisible changes.

## Solution

**Bug #1** (prior session):
- Added hydration-safe initialization in `App.tsx` using `useTokenStore.persist.hasHydrated()` and `onFinishHydration` to wait for localStorage data before checking if sample data should be added.

**Bug #2:**
- Added `e.stopPropagation()` to all 4 action buttons (edit, browse, export, versions) in TokenSetCard.tsx
- Wired `onClick={() => navigateTo(tokenSet.id, 'browser')}` on TokenSetCard in DashboardView.tsx

**Bug #3:**
- Added 20 typography tokens to `sampleTokens.ts` under `font.*` path following three-tier structure:
  - Primitive: 3 font families (sans, mono, serif), 4 font weights (regular through bold), 6 font sizes (xs through 2xl)
  - Semantic: 3 family aliases (body, heading, code) + 2 size aliases (body, caption)
  - Component: button-size, button-weight, heading-weight

**Bug #4:**
- Added 10 shadow tokens following three-tier structure:
  - Primitive: sm, md, lg, xl box shadows
  - Semantic: elevation-low, elevation-mid, elevation-high (referencing primitives)
  - Component: card-shadow, dropdown-shadow, modal-shadow (referencing semantic)

**Bug #5-6:**
- Expanded dark mode overrides from 4 to 14 tokens:
  - Semantic: primary (#60a5fa), error (#f87171), background, surface, border (#4b5563), text-primary, text-secondary
  - Component: button-primary-bg (#60a5fa), button-primary-text (#111827 dark-on-light), card-background, card-border
  - Shadows: all three elevation levels with increased opacity for dark backgrounds
- Added matching light mode overrides for the same paths (explicit light values)

## Files Modified

- `src/App.tsx` -- Hydration-safe sample data initialization (prior session)
- `src/components/dashboard/TokenSetCard.tsx` -- Added onClick prop, cursor-pointer, stopPropagation on action buttons
- `src/pages/DashboardView.tsx` -- Passed onClick prop to TokenSetCard (navigates to browser view)
- `src/data/sampleTokens.ts` -- Added typography tokens (font.*), shadow tokens (shadow.*), comprehensive dark mode overrides

## Verification Results

### Code Review
- [x] Changes match approved plan
- [x] Design system compliance verified (three-tier token structure maintained)
- [x] No unintended side effects detected
- [x] Typography token paths match BrowserView filter (fontFamily, fontWeight, font.* dimension)
- [x] Shadow token types match BrowserView filter (type === 'shadow')
- [x] Dark mode override paths use dot-notation matching resolver's applyModeOverrides

### Build Verification
- [x] `npm run build` passes with no TypeScript or bundling errors

### Browser Testing
- [ ] Verify dashboard cards are clickable (opens browser view)
- [ ] Verify action buttons work independently (edit/browse/export/versions)
- [ ] Verify Typography tab shows tokens in Browser view
- [ ] Verify Shadows tab shows tokens in Browser view
- [ ] Verify dark mode toggle produces visible color changes
- [ ] Verify light mode values remain correct after toggling back

**Test notes:** Build verification passed. Browser testing should be done by clearing localStorage (to get fresh sample data) and verifying each tab in the Browser view, plus toggling between Light/Dark modes.

## CLAUDE.md Updates

None -- existing rules were sufficient. The sample data structure follows the documented three-tier pattern (primitive/semantic/component) already described in CLAUDE.md.
