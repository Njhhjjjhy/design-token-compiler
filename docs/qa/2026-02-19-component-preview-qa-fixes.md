# QA Issue: Component Preview Fixes (Post-Overhaul)

**Date:** 2026-02-19
**Status:** Completely Fixed
**Reporter:** QA Review (commit 70e6c02)

## Round 1 -- Visual and routing fixes

### Issue Description

Four issues found in ComponentPreview.tsx after the preview template overhaul:

1. **@keyframes spin missing** -- Loading spinners in ButtonPreview and AvatarPreview reference `animation: 'spin 0.8s linear infinite'` but no `@keyframes spin` rule exists. Spinners render as static elements.

2. **badge-dot uses BadgePreview** -- `renderAtomPreview` routes both `badge` and `badge-dot` to `BadgePreview` (text badge saying "Status"). The badge-dot component should render a small colored circle, not text.

3. **Link gets wrong label color** -- Link is in `INTERACTIVE_IDS`, so `autoDeriveCssVars` sets `--preview-label-color` to `contrastText(bg)` (white). But LinkPreview doesn't render a background -- it's text-only. The link appears white instead of the primary/accent color.

4. **Non-appearance variant pills missing** -- OverviewTab filters `v.category === 'appearance'` only. Components with `type` category variants (divider: horizontal/vertical/with-label) show no variant pills at all.

### Root Cause

1. Inline CSS `animation` property requires a corresponding `@keyframes` rule in CSS. No stylesheet or `<style>` tag provided one.
2. The `case 'badge-dot'` fell through to `case 'badge'` with no dedicated preview component.
3. The interactive block in `autoDeriveCssVars` treats all `INTERACTIVE_IDS` components identically -- computing contrast foreground against a filled background. Links don't use that background.
4. The `appearanceVariants` filter was the only variant grouping rendered.

### Solution

1. Injected `<style>{@keyframes spin { to { transform: rotate(360deg) } }}</style>` inside the ComponentPreview wrapper.
2. Created `BadgeDotPreview` component (10px colored circle using `--preview-dot-backgroundColor`) and split the case routing.
3. Added a post-block override: when `component.id === 'link'`, set `--preview-label-color` to `mainColor` instead of contrast-white.
4. Replaced `appearanceVariants` filter with category grouping that renders pills for every variant category, each preceded by a separator.

---

## Round 2 -- Size variant support and registry cleanup

### Issue Description

Two issues remaining after Round 1:

5. **Size variants ignored by previews** -- `ComponentPreview` accepted `activeVariant: string | null` (single variant). Selecting a size pill replaced the appearance variant (and vice versa). Preview functions (`ButtonPreview`, `AvatarPreview`, `BadgePreview`, `TagPreview`, etc.) received no variant info -- `renderAtomPreview` only passed `cssVars` and `activeState`, so size selections had zero visual effect.

6. **text-heading/text-body in atom registry** -- These components were removed from the preview renderer but their definitions remained in `ATOM_DEFINITIONS`, causing them to appear in the component list with no working preview.

### Root Cause

5. The variant model was single-select (`string | null`), not multi-category. Appearance and size are independent axes but only one could be active. Additionally, `renderAtomPreview` did not forward the active variant to preview functions, so even the single-select value was lost.
6. `TextHeadingPreview` and `TextBodyPreview` were removed from ComponentPreview but their registry entries in `definitions.ts` were not cleaned up.

### Solution

5. Migrated from `activeVariant: string | null` to `activeVariants: Record<string, string>` (keyed by category). OverviewTab initializes one active variant per category. Click handler updates per-category: `{ ...prev, [variant.category]: variant.id }`. Added `activeVariants` to `PreviewProps` interface. Created size lookup tables for each sizable component:
   - `BUTTON_SIZES` (sm/md/lg) -- padding, fontSize, spinnerSize
   - `ICON_BUTTON_SIZES` (sm/md/lg) -- box dimension, icon size
   - `BADGE_SIZES` (sm/md) -- padding, fontSize
   - `TAG_SIZES` (sm/md) -- padding, fontSize, iconSize
   - `AVATAR_SIZES` (sm/md/lg/xl) -- box dimension, icon size, spinner size
   - `INPUT_SIZES` (sm/md/lg) -- padding, fontSize, labelSize (shared by InputText + Select)

6. Removed `text-heading` and `text-body` entries from `ATOM_DEFINITIONS` array in `definitions.ts`.

## Files Modified

- `src/components/components/ComponentPreview.tsx` -- Round 1: @keyframes, BadgeDotPreview, link color, badge-dot routing. Round 2: migrated to `activeVariants: Record<string, string>`, added size lookup tables, updated all preview functions to use size props, removed TextHeadingPreview/TextBodyPreview, updated `autoDeriveCssVars`/`deriveCssVars` signatures
- `src/components/components/OverviewTab.tsx` -- Round 1: grouped variant categories. Round 2: migrated state from `activeVariant: string | null` to `activeVariants: Record<string, string>`, updated initializer/click handler/highlight check, passes `activeVariants` to ComponentPreview
- `src/lib/atoms/definitions.ts` -- Round 2: removed `text-heading` and `text-body` component definitions

## Verification Results

### Code Review
- [x] Changes match approved plan
- [x] Design system compliance verified
- [x] No unintended side effects detected
- [x] No stale references to `activeVariant` (single), `text-heading`, or `text-body` in src/

**Code review detail (Round 1):**

1. **@keyframes spin** -- `<style>` tag injects the rule. ButtonPreview and AvatarPreview both reference `animation: 'spin 0.8s linear infinite'`. Verified correct.
2. **BadgeDotPreview** -- Dedicated component renders 10px circle with `--preview-dot-backgroundColor`. Case routing split. Verified correct.
3. **Link color override** -- Post-block sets `--preview-label-color` to `mainColor` for links. Verified correct.
4. **Variant categories** -- OverviewTab groups by any category, renders pills per group with separators. Verified correct.

**Code review detail (Round 2):**

5. **Size variants** -- Each sizable preview component destructures `activeVariants`, reads `activeVariants['size']` with a sensible default, and indexes into its size lookup table. `autoDeriveCssVars` reads `activeVariants['appearance']` for color derivation. `deriveCssVars` creates a Set of all active variant values for binding filtering. Verified correct.
6. **Registry cleanup** -- `text-heading` and `text-body` entries fully removed from `ATOM_DEFINITIONS`. Grep confirms zero remaining references. Verified correct.

### Browser Testing
- [ ] Size variant pills visually change Button, Avatar, Badge, Tag, Icon Button, Input, Select dimensions
- [ ] Appearance and size can be independently selected without overriding each other
- [ ] Spin animation visible on Button and Avatar in loading state
- [ ] Badge-dot renders colored circle (not text badge)
- [ ] Link shows primary/accent color (not white)
- [ ] Divider shows type variant pills with separators
- [ ] text-heading and text-body no longer appear in component list

**Test notes:** Build passes (`tsc && vite build`). Manual browser verification required for visual confirmation.

## CLAUDE.md Updates

None -- existing rules were sufficient.
