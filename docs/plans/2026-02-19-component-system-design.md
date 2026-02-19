# Component System Design

**Date:** 2026-02-19
**Status:** Approved
**Approach:** Predefined atom catalog with token binding and multi-platform code output

---

## Goal

Add a component layer on top of the existing token system using the atomic design methodology, starting with atoms. Designers bind their design tokens to predefined component structures. Developers export production-ready code for Web (React), iOS (SwiftUI), and Android (Jetpack Compose).

---

## Architecture

### Ownership Model

Components are **shared across all token sets** — a `button` is a `button` regardless of theme. When previewing or exporting, components resolve their token bindings against the currently active token set.

### Approach

**Predefined atom catalog** — the app ships 15 standard UI atoms, each with a fixed anatomy, states, and variant categories already defined. Designers only bind their tokens to the predefined properties. No free-form component building in Phase 1.

### Naming Conventions

- All component IDs in kebab-case: `button`, `button-icon`, `input-text`
- Naming pattern: `[type]-[modifier]` — base concept first
- Anatomy parts use directional-agnostic names: `icon-leading`, `icon-trailing` (never `icon-left`, `icon-right`)
- CSS classes generated as: `.button`, `.button--primary`, `.button--size-sm`
- File names: `button.tsx`, `button.css`, `Button.swift`, `Button.kt`

---

## Data Model

All types added to `src/types/index.ts`.

```typescript
// Atomic design level
type AtomicLevel = 'atom' | 'molecule' | 'organism'

// A named part of a component's visual structure
interface ComponentPart {
  id: string         // kebab-case: 'container', 'label', 'icon-leading'
  name: string       // display: 'Container', 'Label', 'Leading Icon'
  description?: string
}

// A visual or interactive state
interface ComponentState {
  id: string         // kebab-case: 'default', 'hover', 'pressed', 'disabled', 'focus', 'error'
  name: string
}

// A dimensional variant category
interface ComponentVariant {
  id: string         // kebab-case: 'primary', 'secondary', 'ghost', 'size-sm', 'size-md', 'size-lg'
  name: string
  category: 'appearance' | 'size' | 'type'
}

// Maps a part + state (+ optional variant) to a token and CSS property
interface TokenBinding {
  id: string
  partId: string           // references ComponentPart.id
  stateId: string          // references ComponentState.id
  variantId: string | null // null = applies to all variants
  tokenPath: string        // e.g. 'color.interactive.default'
  cssProperty: string      // e.g. 'background-color'
}

// A component definition
interface Component {
  id: string                // kebab-case
  name: string              // display name
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

### Store

Components stored in Zustand at the top level alongside `tokenSets`:

```typescript
// Added to AppState
components: Component[]

// Store actions
addBinding(componentId: string, binding: Omit<TokenBinding, 'id'>): void
updateBinding(componentId: string, bindingId: string, tokenPath: string): void
removeBinding(componentId: string, bindingId: string): void
updateComponentMeta(componentId: string, updates: Partial<Pick<Component, 'description' | 'usageGuidelines'>>): void
```

Components are **not** user-created or deleted in Phase 1. The 15 predefined atoms are seeded at initialization and persist.

### ViewMode

Add `'components'` to `ViewMode` in `src/types/index.ts`.

---

## Atom Catalog (15 Atoms)

All atoms ship pre-seeded at app initialization.

| ID | Display Name | States | Variants |
|----|-------------|--------|---------|
| `button` | Button | default, hover, pressed, disabled, loading | primary, secondary, ghost, destructive / size-sm, size-md, size-lg |
| `button-icon` | Icon Button | default, hover, pressed, disabled | ghost, filled, outlined / size-sm, size-md, size-lg |
| `input-text` | Text Input | default, focus, filled, disabled, error | outlined, filled, underline / size-sm, size-md, size-lg |
| `input-select` | Select | default, focus, open, disabled, error | outlined, filled / size-sm, size-md, size-lg |
| `checkbox` | Checkbox | default, hover, checked, indeterminate, disabled | — |
| `radio` | Radio | default, hover, selected, disabled | — |
| `badge` | Badge | default | primary, success, warning, error, neutral / size-sm, size-md |
| `badge-dot` | Badge Dot | default | primary, success, warning, error, neutral |
| `tag` | Tag | default, hover, selected, disabled | filled, outlined / size-sm, size-md |
| `link` | Link | default, hover, visited, active, disabled | inline, standalone |
| `avatar` | Avatar | default, loading | size-sm, size-md, size-lg, size-xl |
| `divider` | Divider | default | horizontal, vertical, no-label, with-label |
| `text-heading` | Heading | default | h1, h2, h3, h4, h5, h6 |
| `text-body` | Body Text | default | size-lg, size-md, size-sm, caption, overline |
| `card` | Card | default, hover, selected | flat, elevated, outlined |

### Anatomy Parts Per Atom (examples)

**button:** `container`, `label`, `icon-leading`, `icon-trailing`, `spinner`
**input-text:** `container`, `label`, `input-field`, `placeholder`, `helper-text`, `error-text`, `icon-leading`, `icon-trailing`
**checkbox:** `container`, `indicator`, `label`, `description`
**avatar:** `container`, `image`, `initials`, `indicator`
**card:** `container`, `header`, `body`, `footer`

---

## Components View

### Navigation

New tab `Components` in `src/components/Header.tsx` between Browser and Compiler. New route in `src/App.tsx`. New page `src/pages/ComponentsView.tsx`.

### Layout

Two-panel layout matching the existing app pattern:

```
+------------------+------------------------------------------+
| Atoms            | [button]                                 |
| +--------------+ |                                          |
| | button    12/| | Overview | Anatomy | Tokens | Code       |
| | button-icon 4| | ---------+-----------------------------  |
| | input-text 8/| |                                          |
| | ...          | | [preview area]                           |
| +--------------+ |                                          |
|                  | Description (editable)                   |
| Molecules        | Usage Guidelines (editable)              |
| (coming soon)    |                                          |
+------------------+------------------------------------------+
```

**Left sidebar:**
- Section header `atoms` (future: `molecules`, `organisms`)
- Each row: atom display name + binding coverage badge (`12/24`)
- Active atom highlighted

**Right panel — four tabs:**

| Tab | Content |
|-----|---------|
| Overview | Description (editable), usage guidelines (editable), live preview with state/variant toggles |
| Anatomy | Labelled diagram of the component parts with descriptions |
| Tokens | Token binding table — map each part + state to a token |
| Code | Web / iOS / Android sub-tabs with copy-ready code |

---

## Token Binding UI (Tokens Tab)

### Binding Table

Each row = one `part + state` combination (optionally variant-specific).

| Part | State | Variant | CSS Property | Token |
|------|-------|---------|-------------|-------|
| `container` | `default` | — | `background-color` | [pick token] |
| `container` | `hover` | — | `background-color` | [pick token] |
| `container` | `default` | `secondary` | `background-color` | [pick token] |
| `label` | `default` | — | `color` | [pick token] |
| `label` | `disabled` | — | `color` | [pick token] |

- **Token picker:** click to open a searchable dropdown listing all resolved tokens from the active set
- Unbound rows show `— unlinked —` in muted style (not an error)
- Bound rows show token path + resolved value preview (e.g. color swatch or dimension bar)
- **Coverage badge** in sidebar: `bound / total` binding slots

### Auto-save

Bindings save on every change (no explicit save button). Consistent with how token edits work elsewhere in the app.

---

## Live Preview (Overview Tab)

Each atom has a purpose-built HTML + CSS preview template embedded in the app.

- Rendered in an isolated `<div>` using CSS custom properties derived from bound token values
- **State toggle:** switch between default / hover / pressed / disabled / focus
- **Variant toggle:** switch between appearance variants (primary / secondary / ghost) and size variants
- Unbound tokens show a placeholder value (e.g. `#ccc`, `8px`) so the preview is never broken
- When active token set changes, preview re-renders automatically

---

## Code Output (Code Tab)

Three platform sub-tabs. Copy button per sub-tab. ZIP download (all three at once).

### Web

Two files per atom: `.tsx` (React component) + `.css` (component styles).

The `.css` file uses CSS custom properties whose names match the token variable names from the CSS compiler output. The React component accepts typed props for variant and state.

Example `button.tsx` structure:
```tsx
interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'ghost' | 'destructive'
  size?: 'sm' | 'md' | 'lg'
  disabled?: boolean
  loading?: boolean
  iconLeading?: React.ReactNode
  iconTrailing?: React.ReactNode
  children: React.ReactNode
  onClick?: () => void
}
export const Button: React.FC<ButtonProps> = ({ ... }) => { ... }
```

Example `button.css` structure:
```css
.button {
  background-color: var(--color-interactive-default);
  color: var(--color-text-on-primary);
  border-radius: var(--radius-md);
  /* ... */
}
.button:hover { background-color: var(--color-interactive-hover); }
.button:disabled { background-color: var(--color-interactive-disabled); }
.button--secondary { background-color: var(--color-interactive-secondary); }
.button--size-sm { padding: var(--spacing-xs) var(--spacing-sm); }
```

### iOS (SwiftUI)

A single `.swift` file per atom. Uses a `DesignTokens` struct (generated by the Swift token compiler). Typed enum for variant and size.

### Android (Jetpack Compose)

A single `.kt` file per atom. A `@Composable` function using `DesignTokens` object. Typed enum for variant and size.

---

## Code Generators

New directory `src/lib/component-compilers/`:

```
src/lib/component-compilers/
  index.ts           — entry point, routes to each compiler
  web-react.ts       — generates .tsx + .css
  ios-swift.ts       — generates .swift
  android-compose.ts — generates .kt
```

Each compiler is a pure function:
```typescript
type ComponentCompiler = (
  component: Component,
  bindings: TokenBinding[],
  resolvedTokens: ResolvedTokenMap
) => CompilationResult
```

---

## File Structure (new files)

```
src/
  pages/
    ComponentsView.tsx       — main view
  components/
    components/              — new directory
      ComponentsSidebar.tsx  — atom list
      ComponentDetail.tsx    — four-tab detail panel
      OverviewTab.tsx        — preview + description
      AnatomyTab.tsx         — anatomy diagram
      TokenBindingTab.tsx    — binding table
      CodeTab.tsx            — platform code output
      TokenPicker.tsx        — searchable token dropdown
      ComponentPreview.tsx   — isolated preview renderer
  lib/
    component-compilers/
      index.ts
      web-react.ts
      ios-swift.ts
      android-compose.ts
    atoms/
      index.ts               — exports all atom definitions
      button.ts
      button-icon.ts
      input-text.ts
      input-select.ts
      checkbox.ts
      radio.ts
      badge.ts
      badge-dot.ts
      tag.ts
      link.ts
      avatar.ts
      divider.ts
      text-heading.ts
      text-body.ts
      card.ts
```

---

## Out of Scope (Phase 1)

- Custom / user-defined atoms (free-form builder)
- Molecules and organisms
- Figma import for component bindings
- Animation / motion states in components
- Dark mode specific variant bindings (tokens resolve per active mode)
- Multi-user collaboration

---

## Success Criteria

- All 15 atoms visible in the Components view
- Token binding table works: pick a token from the active set, binding saves
- Live preview updates when bindings change or active token set switches
- Web (React + CSS), iOS (SwiftUI), Android (Jetpack Compose) code generates correctly
- Copy and ZIP download work
- Build passes (`tsc && vite build`)
