# QA Issue: Browser missing shadow tokens and REM heading font

**Date:** 2026-02-18
**Status:** Fixed
**Reporter:** QA Review

## Issue Description

1. Browser shadow tab shows "No shadow tokens found." -- no shadow tokens exist in the sample design system.
2. Browser typography tab only shows Noto Sans JP. Missing REM Semibold which should be used for H1-5, Labels, and CTAs.

## Root Cause

The `createSampleDesignSystem()` function in `src/lib/sample-data.ts` (used by the Dashboard's "Create sample" button) was missing:
- An entire shadow token group
- A heading font family entry for REM

Additionally, the Google Fonts import in `index.html` did not load REM or Noto Sans JP, so even if tokens referenced these fonts, they would not render correctly in the Browser.

## Solution

1. Added `buildShadowGroup()` to `src/lib/sample-data.ts` with:
   - 4 primitive shadows (sm, md, lg, xl)
   - 3 semantic elevations (elevation-low, elevation-mid, elevation-high) referencing primitives
2. Added `'heading': tok('heading', 'REM', 'fontFamily')` to the font family group alongside existing Noto Sans JP body entry
3. Updated `index.html` Google Fonts link to include `Noto+Sans+JP:wght@400;500` and `REM:wght@600`

## Files Modified

- `src/lib/sample-data.ts` -- Added shadow group builder function, REM heading font family, wired shadow group into token set
- `index.html` -- Added Noto Sans JP and REM to Google Fonts import

## Verification Results

### Code Review
- [x] Changes match approved plan
- [x] Design system compliance verified
- [x] No unintended side effects detected

### Browser Testing
- [ ] User must delete existing "Design System" set and create a new sample to pick up changes (localStorage persists old data)
- [ ] Shadow tab should show 7 shadow tokens with visual box-shadow previews
- [ ] Typography tab should show REM heading font alongside Noto Sans JP body font

## CLAUDE.md Updates

None -- existing rules were sufficient.
