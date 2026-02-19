# Component Preview Overhaul Plan

**Date:** 2026-02-19
**Status:** Not started -- continuation prompt at bottom
**Context:** The Components view preview system needs a complete rework. The current implementation uses generic CSS var fallbacks and filter-based state transforms that don't produce meaningful visual feedback.

## Background

The token compiler's Components view is meant to show how design tokens apply to real UI components -- like a lightweight Storybook. The user's actual design system is deployed at:
https://riaan-moha-map-storybook.vercel.app

The Storybook index.json is accessible and contains the full component catalog (Button, ChatContainer, ChatInput, ChatMessage, Details panels, StatCard, etc.). The Storybook uses Nunito Sans as its primary font.

## What was already committed (d710df0)

These fixes are DONE and committed:
- Crimson fallback colors replaced with neutral grays in ComponentPreview.tsx
- Auto-detect token color system added (autoDeriveCssVars)
- Card atomicLevel changed from atom to molecule
- AnimatePresence removed from ComponentDetail.tsx (React 18 StrictMode bug)
- Store persist version bumped to v4 with re-seed migration
- "unbound -- add tokens to customize" label added

## What is still broken (confirmed via screenshots)

### 1. button-icon shows "Button Label" text instead of an icon
`renderAtomPreview()` in ComponentPreview.tsx routes both `button` and `button-icon` to `ButtonPreview`, which always renders text. There is no `IconButtonPreview` template. Needs a square button with an inline SVG icon (e.g. Plus, Star, or Settings from Lucide).

### 2. States don't produce visual changes -- TWO problems

**Problem A: STATE_STYLES mostly empty.**
Only 6 of 13 states have CSS filter effects. The other 7 (focus, filled, checked, selected, error, open, indeterminate) have empty `{}` objects that do nothing:

```typescript
const STATE_STYLES: Record<string, React.CSSProperties> = {
  default: {},
  hover: { filter: 'brightness(1.2)' },
  pressed: { filter: 'brightness(0.8)', transform: 'scale(0.97)' },
  active: { filter: 'brightness(0.85)' },
  disabled: { filter: 'grayscale(0.8) brightness(0.6)', opacity: 0.4 },
  loading: { opacity: 0.6 },
  focus: {},          // <-- does nothing
  filled: {},         // <-- does nothing
  checked: {},        // <-- does nothing
  selected: {},       // <-- does nothing
  error: {},          // <-- does nothing
  open: {},           // <-- does nothing
  indeterminate: {},  // <-- does nothing
  visited: { filter: 'brightness(0.9) saturate(0.7)' },
}
```

**Problem B: `autoDeriveCssVars` ignores state for interactive components.**
For buttons/badges/tags/links, the function only branches on `activeVariant` (secondary, ghost, destructive). It never looks at `activeState`. Only input components have state-specific CSS var overrides (focus border, error color, checked indicator fill).

### 3. Missing preview templates
`tag`, `link`, `avatar`, `divider` all fall through to `GenericPreview` -- a box with the component name. Useless.

### 4. Typography
All preview templates hardcode `fontFamily: 'monospace'`. Real buttons/badges use sans-serif. Previews should use a neutral sans-serif (system font stack or similar) for UI component previews.

## Architecture of the preview system

### Data flow
1. OverviewTab.tsx manages `activeState` and `activeVariant` as local useState
2. These are passed as props to ComponentPreview
3. ComponentPreview computes CSS vars via useMemo:
   - If bindings exist: `deriveCssVars()` filters bindings by state+variant
   - If no bindings: `autoDeriveCssVars()` auto-detects from resolved tokens
4. CSS vars + state styles are applied to preview templates

### Key files
- `src/components/components/ComponentPreview.tsx` -- preview templates + CSS var derivation
- `src/components/components/OverviewTab.tsx` -- state/variant pill controls
- `src/components/components/ComponentDetail.tsx` -- tab container
- `src/lib/atoms/definitions.ts` -- component definitions (parts, states, variants)
- `src/pages/ComponentsView.tsx` -- top-level view

### The fix approach

The preview templates need to receive `activeState` as a prop (not just CSS vars) so they can render state-specific visuals internally:
- Checkbox: fill indicator on `checked`, dash on `indeterminate`
- Input: focus ring on `focus`, red border on `error`
- Button: dim on `disabled`, brightness on `hover`
- Link: underline style on `visited`
- Badge: no state changes (only has `default`)

`autoDeriveCssVars` should also set state-specific CSS var overrides for interactive components (currently only does this for inputs).

Each missing component (tag, link, avatar, divider) needs a proper visual template.

## Storybook reference

The user's Storybook (https://riaan-moha-map-storybook.vercel.app) has:
- **Foundations:** Color, Typography, Spacing, Shadows, Motion, Animation, Interaction
- **Guidelines:** Design Principles, Accessibility
- **Components/UI:** Button
- **Components/Chat:** ChatContainer, ChatEmpty, ChatInput, ChatMessage, MarkdownText
- **Components/Details:** CompanyDetails, CorridorDetails, DetailsPanel, EmptyState, FactoryDetails, FutureCircleDetails, GovPlanDetails, InvestmentAnalysisPanel, InvestmentAreaDetails, PropertyDetails, RailCommuteDetails, RegionDetails, RiskZoneDetails, StatCard, StationDetails

The Storybook is client-side rendered (SPA), so WebFetch only gets the shell. The index.json at the root is accessible and contains the full story catalog.

---

## Continuation Prompt

Use this to resume work in a new session:

```
Fix the Components view preview system in ComponentPreview.tsx. The previous session committed basic fixes (d710df0) but the previews are still broken. See docs/plans/2026-02-19-component-preview-overhaul.md for the full analysis.

Summary of remaining work:

1. **button-icon needs its own preview template** -- currently uses ButtonPreview which shows "Button Label" text. Needs a square button with a Lucide SVG icon (e.g. Plus or Settings).

2. **States don't produce visual changes** -- STATE_STYLES has empty {} for 7 of 13 states (focus, filled, checked, selected, error, open, indeterminate). Also, autoDeriveCssVars ignores activeState for interactive components (buttons/badges/tags/links) -- only handles variants. Each preview template needs to receive activeState directly and render state-specific visuals (checkbox fills on checked, input shows focus ring, button dims on disabled, etc.).

3. **Missing preview templates** -- tag, link, avatar, divider all fall through to GenericPreview (just a named box). Each needs a proper visual template.

4. **Typography** -- all preview templates hardcode fontFamily: 'monospace'. UI component previews should use sans-serif.

The key file is src/components/components/ComponentPreview.tsx. Also read src/components/components/OverviewTab.tsx (state/variant pill controls) and src/lib/atoms/definitions.ts (component definitions with parts, states, variants).

The user's real design system Storybook is at https://riaan-moha-map-storybook.vercel.app -- the point of this Components view is to show how tokens apply to real components, like a lightweight Storybook. Build, test, update QA doc, commit each task.
```
