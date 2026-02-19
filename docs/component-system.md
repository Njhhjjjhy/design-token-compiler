# Component System (Phase 6A)

**Added:** February 19, 2026
**View:** Components (Cmd+4)
**Store version:** v2
**Key files:**
- Types: `src/types/index.ts`
- Atom definitions: `src/lib/atoms/`
- Store: `src/store/useTokenStore.ts`
- View: `src/pages/ComponentsView.tsx`
- Components: `src/components/components/`
- Compilers: `src/lib/component-compilers/`

---

## Overview

The component system gives designers a predefined catalog of 15 atoms where they can:

1. **Browse** parts, states, and variants for each component
2. **Bind tokens** from the active token set to specific component properties
3. **Preview** how the component looks using the current bindings
4. **Export code** for Web (React), iOS (SwiftUI), or Android (Jetpack Compose)

Components live at app level — shared across all token sets. Token bindings are the only thing that changes per-session.

---

## Architecture

```
ComponentsView
├── ComponentsSidebar          atom list + binding coverage badges
└── ComponentDetail
    ├── OverviewTab            live preview + editable description/guidelines
    ├── AnatomyTab             parts, states, and variants reference
    ├── TokenBindingTab        binding table (part × state → token)
    │   └── TokenPicker        searchable dropdown over resolved tokens
    └── CodeTab
        ├── compileWebReact    → .tsx + .css
        ├── compileIosSwift    → .swift
        └── compileAndroidCompose → .kt
```

---

## Types (`src/types/index.ts`)

### `AtomicLevel`

```typescript
type AtomicLevel = 'atom' | 'molecule' | 'organism'
```

All 15 predefined components are `'atom'`. Molecules and organisms are reserved for future phases.

### `ComponentPart`

A named region of the component that can receive token bindings.

```typescript
interface ComponentPart {
  id: string        // kebab-case: 'container', 'label', 'icon-leading'
  name: string      // display name: 'Container', 'Label', 'Leading Icon'
  description?: string
}
```

### `ComponentState`

An interaction or visual state the component can be in.

```typescript
interface ComponentState {
  id: string   // 'default' | 'hover' | 'pressed' | 'disabled' | 'focus' | 'error'
  name: string
}
```

### `ComponentVariant`

A named variation of the component grouped by category.

```typescript
interface ComponentVariant {
  id: string
  name: string
  category: 'appearance' | 'size' | 'type'
}
```

- `appearance` — visual style variants (primary, secondary, ghost, filled, outlined)
- `size` — size variants, always prefixed `size-` (size-sm, size-md, size-lg)
- `type` — structural type variants (inline, standalone, horizontal, vertical)

### `TokenBinding`

Links a component part+state combination to a token path and CSS property.

```typescript
interface TokenBinding {
  id: string
  partId: string           // references ComponentPart.id
  stateId: string          // references ComponentState.id
  variantId: string | null // null = applies to all variants
  tokenPath: string        // e.g. 'color.interactive.default'
  cssProperty: string      // e.g. 'background-color'
}
```

### `Component`

The full component definition.

```typescript
interface Component {
  id: string
  name: string
  atomicLevel: AtomicLevel
  description: string
  usageGuidelines: string
  parts: ComponentPart[]
  states: ComponentState[]
  variants: ComponentVariant[]
  bindings: TokenBinding[]
  createdAt: number
  updatedAt: number
}
```

### `ViewMode` update

`'components'` was added between `'browser'` and `'compiler'`:

```typescript
type ViewMode = 'dashboard' | 'editor' | 'browser' | 'components' | 'compiler' | 'sync'
```

---

## Naming Conventions

These are strict and enforced everywhere:

| Convention | Rule | Examples |
|-----------|------|---------|
| Component ID | kebab-case, type-modifier | `button`, `button-icon`, `input-text` |
| Part ID | kebab-case, directional-agnostic | `icon-leading`, `icon-trailing` (never `icon-left`) |
| Size variant ID | `size-` prefix | `size-sm`, `size-md`, `size-lg` |
| CSS classes (output) | BEM modifier | `.button`, `.button--primary`, `.button--size-sm` |
| Generated filenames | component ID | `button.tsx`, `Button.swift`, `Button.kt` |

---

## Atom Catalog (`src/lib/atoms/`)

### `definitions.ts`

Exports `ATOM_DEFINITIONS: Component[]` — the 15 static atom definitions. Bindings are always empty (`[]`) in the seed data.

### `index.ts`

```typescript
export { ATOM_DEFINITIONS } from './definitions'
export function getSeedComponents(): Component[]  // deep-cloned, safe to mutate
```

Always use `getSeedComponents()` when initializing store state — never reference `ATOM_DEFINITIONS` directly if you intend to mutate.

### The 15 Atoms

| ID | Name | Parts | States | Variants |
|----|------|-------|--------|---------|
| `button` | Button | 5 | 5 | 7 |
| `button-icon` | Icon Button | 2 | 4 | 6 |
| `input-text` | Text Input | 8 | 5 | 6 |
| `input-select` | Select | 6 | 5 | 5 |
| `checkbox` | Checkbox | 4 | 5 | 0 |
| `radio` | Radio | 3 | 4 | 0 |
| `badge` | Badge | 2 | 1 | 7 |
| `badge-dot` | Badge Dot | 2 | 1 | 5 |
| `tag` | Tag | 4 | 4 | 4 |
| `link` | Link | 1 | 5 | 2 |
| `avatar` | Avatar | 4 | 2 | 4 |
| `divider` | Divider | 2 | 1 | 4 |
| `text-heading` | Heading | 1 | 1 | 6 |
| `text-body` | Body Text | 1 | 1 | 5 |
| `card` | Card | 4 | 3 | 3 |

---

## Zustand Store (`src/store/useTokenStore.ts`)

### State

```typescript
components: Component[]          // all 15 atoms (with user bindings)
selectedComponentId: string | null
```

### Actions

```typescript
setSelectedComponent(id: string | null): void

addBinding(componentId: string, binding: Omit<TokenBinding, 'id'>): void
// Appends a new binding with a generated nanoid. Updates updatedAt.

updateBinding(componentId: string, bindingId: string, updates: Partial<Pick<TokenBinding, 'tokenPath' | 'cssProperty'>>): void
// Updates tokenPath or cssProperty on an existing binding. Updates updatedAt.

removeBinding(componentId: string, bindingId: string): void
// Removes a binding by ID. Updates updatedAt.

updateComponentMeta(componentId: string, updates: Partial<Pick<Component, 'description' | 'usageGuidelines'>>): void
// Edits the description or usage guidelines. Updates updatedAt.
```

### Store Migration (v1 → v2)

The persist config was bumped to `version: 2`. The `migrate` callback seeds `components` and `selectedComponentId` for any user upgrading from v1:

```typescript
migrate: (persistedState, version) => {
  if (version < 2) {
    state.components = getSeedComponents()
    state.selectedComponentId = null
  }
  return state
}
```

New users get `getSeedComponents()` from the initial state directly.

---

## UI Components (`src/components/components/`)

### `ComponentsSidebar`

Left panel — fixed width, lists all atoms with binding coverage badges.

**Badge formula:** `bound / total` where `total = parts.length × states.length`.

- `0/N` badge — grey (`text-text-tertiary bg-surface-elevated`) — no bindings yet
- `N/N` or partial badge — crimson tint (`text-primary bg-primary/10`) — bindings exist

### `ComponentDetail`

Right panel — contains the component header and four tabs with Framer Motion crossfades (`tabVariants` from `src/lib/motion.ts`). Uses `layoutId="component-detail-tab-indicator"` for the sliding underline.

### `OverviewTab`

- State selector buttons (one per `component.states`)
- Appearance variant selector buttons (filtered from `component.variants`)
- `ComponentPreview` updates live as state/variant changes
- Editable `description` and `usageGuidelines` (click pencil to edit, check to save)

### `AnatomyTab`

Read-only display of:
- Parts with index numbers, IDs, display names, and optional descriptions
- States as chips
- Variants grouped by category (appearance / size / type)

### `TokenBindingTab`

Table with one row per `part × state` combination (variant column shows `—` for the base binding).

Each row has a `TokenPicker` in the Token column. If a binding exists for that slot, the picker shows it as selected. If not, it shows the placeholder.

Slot identity is determined by `slotKey(partId, stateId, variantId)` — the canonical key format is `${partId}__${stateId}__${variantId ?? '_'}`.

### `TokenPicker`

A controlled combobox. Props:

```typescript
interface TokenPickerProps {
  value: string | null          // currently bound token path, or null
  resolvedTokens: ResolvedTokenMap
  onSelect: (tokenPath: string) => void
  onClear: () => void
  placeholder?: string
}
```

- Shows a color swatch for `type === 'color'` tokens
- Shows a width bar for `type === 'dimension'` tokens
- Filters to 50 results; search is a substring match on token path
- Dropdown closes on outside click

### `ComponentPreview`

Renders the atom using inline styles driven by CSS custom properties derived from bindings.

**`deriveCssVars`** converts bindings to CSS var declarations:

```
binding: { partId: 'container', cssProperty: 'background-color', tokenPath: '...' }
→ var name: '--preview-container-backgroundColor'
→ var value: resolved token value
```

Each atom has a purpose-built template function. Unmapped atoms fall back to `GenericPreview`. Default fallback values in `var(...)` calls ensure the preview always looks reasonable even with zero bindings.

| Component IDs | Template |
|--------------|---------|
| `button`, `button-icon` | `ButtonPreview` |
| `badge`, `badge-dot` | `BadgePreview` |
| `input-text`, `input-select` | `InputTextPreview` |
| `checkbox`, `radio` | `CheckboxPreview` |
| `card` | `CardPreview` |
| `text-heading` | `TextHeadingPreview` (uses `activeVariant` for h1-h6 sizing) |
| `text-body` | `TextBodyPreview` (uses `activeVariant` for sizes + overline style) |
| all others | `GenericPreview` |

### `CodeTab`

Three platform tabs: Web, iOS, Android.
Web has a secondary sub-tab row: `tsx` / `css`.

Copy button uses `navigator.clipboard`. Download button creates a `Blob` and triggers a synthetic `<a>` click.

---

## Component Compilers (`src/lib/component-compilers/`)

All compilers are pure functions: `(component: Component, resolvedTokens: ResolvedTokenMap) => string`.

Import from `@/lib/component-compilers`.

### `compileWebReact(component, resolvedTokens)` → `{ tsx: string; css: string }`

**TSX output:**
- Generates a TypeScript props interface from variants (`variant?`, `size?`, `disabled?`, `iconLeading?`, `iconTrailing?`, `children?`)
- Generates a functional component with BEM class construction
- Includes the CSS import line

**CSS output:**
- Base styles from `default` state + `variantId === null` bindings → `.button { ... }`
- State overrides using pseudo-selectors (`hover`, `pressed`, `focus`, `disabled`, `error`)
- Variant overrides → `.button--primary { ... }`
- Token references output as `var(--token-path)` where dots are replaced with dashes

State → pseudo mapping:

| State ID | CSS selector |
|----------|-------------|
| `hover` | `:hover` |
| `pressed` | `:active` |
| `focus` | `:focus-visible` |
| `disabled` | `[aria-disabled="true"]` |
| `error` | `.is-error` |
| other | `.is-{stateId}` |

### `compileIosSwift(component, resolvedTokens)` → `string`

Generates a SwiftUI `View` struct with:
- `Variant` and `Size` enums (if variants exist)
- Modifier chain from `default` state bindings
- Token paths converted to `DesignTokens.Category.camelCasePath`
- `#Preview` block

Token path format: `color.interactive.default` → `DesignTokens.Color.interactiveDefault`

### `compileAndroidCompose(component, resolvedTokens)` → `string`

Generates a Jetpack Compose `@Composable` function with:
- `enum class` for variants and sizes (if applicable)
- `Surface` wrapper using token-derived background/foreground colors
- `@Preview` composable

Token path format: `color.interactive.default` → `DesignTokens.Color.interactiveDefault`

---

## Adding New Components

To add a component to the catalog:

1. Add a new entry to `ATOM_DEFINITIONS` in `src/lib/atoms/definitions.ts` following the existing structure
2. If the component needs a custom preview, add a template function in `ComponentPreview.tsx` and add a case to `renderAtomPreview`
3. The store migration version does **not** need to change for additions — new components will appear on next app load for existing users since `getSeedComponents()` is called fresh

To add a new atomic level (molecules):
1. Add component definitions with `atomicLevel: 'molecule'`
2. Update `ComponentsSidebar` to render the molecules section (currently shows "Molecules — coming soon")

---

## Keyboard Navigation

| Shortcut | Action |
|---------|--------|
| Cmd+4 | Navigate to Components view |

---

## Related Files

| File | Role |
|------|------|
| `src/types/index.ts` | All component types |
| `src/lib/atoms/definitions.ts` | 15 atom seed data |
| `src/lib/atoms/index.ts` | Exports + `getSeedComponents()` |
| `src/store/useTokenStore.ts` | State + all component actions |
| `src/pages/ComponentsView.tsx` | View entry point |
| `src/components/components/` | All UI components for this view |
| `src/lib/component-compilers/` | Three platform code generators |
| `docs/plans/2026-02-19-component-system-design.md` | Visual design spec |
| `docs/plans/2026-02-19-component-system-implementation.md` | Implementation plan |
