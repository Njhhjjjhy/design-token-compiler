# Component System (Phase 6A) Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a predefined atom catalog to the app where designers bind tokens to component properties and developers export production-ready code for Web (React), iOS (SwiftUI), and Android (Jetpack Compose).

**Architecture:** 15 predefined atoms live at app level (shared across all token sets). A new `components` array is stored in Zustand alongside `tokenSets`. A new `ComponentsView` page with a two-panel layout (sidebar + four-tab detail) provides the UI. Three pure-function compilers generate platform code from token bindings.

**Tech Stack:** React 18, TypeScript, Zustand (with localStorage persist), Tailwind CSS, Framer Motion, Lucide React. No new dependencies needed.

**Design doc:** `docs/plans/2026-02-19-component-system-design.md`

---

## Naming Conventions (STRICT — apply everywhere)

- All component IDs: **kebab-case** (`button`, `button-icon`, `input-text`)
- Pattern: **`[type]-[modifier]`** — base concept first
- Anatomy parts: directional-agnostic only — **`icon-leading`**, **`icon-trailing`** (never `icon-left`, `icon-right`)
- CSS classes: `.button`, `.button--primary`, `.button--size-sm` (BEM modifier pattern)
- Generated file names: `button.tsx`, `button.css`, `Button.swift`, `Button.kt`

---

## Task 1: Add Types to `src/types/index.ts`

**Files:**
- Modify: `src/types/index.ts`

**Step 1: Add the component types**

Append this block to the end of `src/types/index.ts`:

```typescript
// ============================================================================
// COMPONENT SYSTEM TYPES
// ============================================================================

export type AtomicLevel = 'atom' | 'molecule' | 'organism'

export interface ComponentPart {
  id: string        // kebab-case: 'container', 'label', 'icon-leading'
  name: string      // display name: 'Container', 'Label', 'Leading Icon'
  description?: string
}

export interface ComponentState {
  id: string        // kebab-case: 'default', 'hover', 'pressed', 'disabled', 'focus', 'error'
  name: string
}

export interface ComponentVariant {
  id: string        // kebab-case: 'primary', 'secondary', 'size-sm', 'size-md'
  name: string
  category: 'appearance' | 'size' | 'type'
}

export interface TokenBinding {
  id: string
  partId: string           // references ComponentPart.id
  stateId: string          // references ComponentState.id
  variantId: string | null // null = applies to all variants
  tokenPath: string        // e.g. 'color.interactive.default'
  cssProperty: string      // e.g. 'background-color'
}

export interface Component {
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

**Step 2: Update `ViewMode` to include `'components'`**

Find this line in `src/types/index.ts`:
```typescript
export type ViewMode = 'dashboard' | 'editor' | 'browser' | 'compiler' | 'sync'
```

Replace with:
```typescript
export type ViewMode = 'dashboard' | 'editor' | 'browser' | 'components' | 'compiler' | 'sync'
```

**Step 3: Verify TypeScript**

Run: `npx tsc --noEmit`
Expected: no errors

**Step 4: Commit**

```bash
git add src/types/index.ts
git commit -m "feat(components): add component system types to index"
```

---

## Task 2: Create Atom Seed Definitions

**Files:**
- Create: `src/lib/atoms/index.ts`
- Create: `src/lib/atoms/definitions.ts`

These files define the static structure of all 15 atoms. Bindings start empty — users fill them in.

**Step 1: Create `src/lib/atoms/definitions.ts`**

```typescript
import type { Component } from '@/types'

const NOW = 0 // static seed timestamp

export const ATOM_DEFINITIONS: Component[] = [
  {
    id: 'button',
    name: 'Button',
    atomicLevel: 'atom',
    description: 'A clickable element that triggers an action. The most fundamental interactive component in any design system.',
    usageGuidelines: 'Use primary buttons for the main call-to-action on a page. Limit to one primary button per section. Use secondary or ghost for supporting actions. Always include a visible label unless the context is unambiguous.',
    parts: [
      { id: 'container', name: 'Container', description: 'The outer clickable area' },
      { id: 'label', name: 'Label', description: 'The button text' },
      { id: 'icon-leading', name: 'Leading Icon', description: 'Optional icon before the label' },
      { id: 'icon-trailing', name: 'Trailing Icon', description: 'Optional icon after the label' },
      { id: 'spinner', name: 'Spinner', description: 'Loading indicator (loading state only)' },
    ],
    states: [
      { id: 'default', name: 'Default' },
      { id: 'hover', name: 'Hover' },
      { id: 'pressed', name: 'Pressed' },
      { id: 'disabled', name: 'Disabled' },
      { id: 'loading', name: 'Loading' },
    ],
    variants: [
      { id: 'primary', name: 'Primary', category: 'appearance' },
      { id: 'secondary', name: 'Secondary', category: 'appearance' },
      { id: 'ghost', name: 'Ghost', category: 'appearance' },
      { id: 'destructive', name: 'Destructive', category: 'appearance' },
      { id: 'size-sm', name: 'Small', category: 'size' },
      { id: 'size-md', name: 'Medium', category: 'size' },
      { id: 'size-lg', name: 'Large', category: 'size' },
    ],
    bindings: [],
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    id: 'button-icon',
    name: 'Icon Button',
    atomicLevel: 'atom',
    description: 'A square button containing only an icon. Used when space is limited or the icon alone is sufficient to communicate the action.',
    usageGuidelines: 'Always provide an accessible label (aria-label) even when no text is shown. Use tooltips to reveal the action on hover. Prefer labeled buttons when the action may be unclear.',
    parts: [
      { id: 'container', name: 'Container' },
      { id: 'icon', name: 'Icon' },
    ],
    states: [
      { id: 'default', name: 'Default' },
      { id: 'hover', name: 'Hover' },
      { id: 'pressed', name: 'Pressed' },
      { id: 'disabled', name: 'Disabled' },
    ],
    variants: [
      { id: 'ghost', name: 'Ghost', category: 'appearance' },
      { id: 'filled', name: 'Filled', category: 'appearance' },
      { id: 'outlined', name: 'Outlined', category: 'appearance' },
      { id: 'size-sm', name: 'Small', category: 'size' },
      { id: 'size-md', name: 'Medium', category: 'size' },
      { id: 'size-lg', name: 'Large', category: 'size' },
    ],
    bindings: [],
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    id: 'input-text',
    name: 'Text Input',
    atomicLevel: 'atom',
    description: 'A single-line text entry field. Used for short-form user input like names, emails, and search queries.',
    usageGuidelines: 'Always pair with a visible label above the field. Use helper text to clarify format requirements. Show error messages below the field, replacing helper text. Never use placeholder text as a substitute for a label.',
    parts: [
      { id: 'container', name: 'Container' },
      { id: 'label', name: 'Label' },
      { id: 'input-field', name: 'Input Field', description: 'The text entry area' },
      { id: 'placeholder', name: 'Placeholder' },
      { id: 'helper-text', name: 'Helper Text' },
      { id: 'error-text', name: 'Error Text' },
      { id: 'icon-leading', name: 'Leading Icon' },
      { id: 'icon-trailing', name: 'Trailing Icon' },
    ],
    states: [
      { id: 'default', name: 'Default' },
      { id: 'focus', name: 'Focus' },
      { id: 'filled', name: 'Filled' },
      { id: 'disabled', name: 'Disabled' },
      { id: 'error', name: 'Error' },
    ],
    variants: [
      { id: 'outlined', name: 'Outlined', category: 'appearance' },
      { id: 'filled', name: 'Filled', category: 'appearance' },
      { id: 'underline', name: 'Underline', category: 'appearance' },
      { id: 'size-sm', name: 'Small', category: 'size' },
      { id: 'size-md', name: 'Medium', category: 'size' },
      { id: 'size-lg', name: 'Large', category: 'size' },
    ],
    bindings: [],
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    id: 'input-select',
    name: 'Select',
    atomicLevel: 'atom',
    description: 'A dropdown selector for choosing one option from a predefined list.',
    usageGuidelines: 'Use when there are 5 or more options and radio buttons would be too verbose. Always show a default placeholder. Sort options logically — alphabetically, numerically, or by frequency of use.',
    parts: [
      { id: 'container', name: 'Container' },
      { id: 'label', name: 'Label' },
      { id: 'value', name: 'Selected Value' },
      { id: 'icon-trailing', name: 'Trailing Icon', description: 'Chevron/arrow indicator' },
      { id: 'helper-text', name: 'Helper Text' },
      { id: 'error-text', name: 'Error Text' },
    ],
    states: [
      { id: 'default', name: 'Default' },
      { id: 'focus', name: 'Focus' },
      { id: 'open', name: 'Open' },
      { id: 'disabled', name: 'Disabled' },
      { id: 'error', name: 'Error' },
    ],
    variants: [
      { id: 'outlined', name: 'Outlined', category: 'appearance' },
      { id: 'filled', name: 'Filled', category: 'appearance' },
      { id: 'size-sm', name: 'Small', category: 'size' },
      { id: 'size-md', name: 'Medium', category: 'size' },
      { id: 'size-lg', name: 'Large', category: 'size' },
    ],
    bindings: [],
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    id: 'checkbox',
    name: 'Checkbox',
    atomicLevel: 'atom',
    description: 'A binary toggle for selecting or deselecting an option. Supports indeterminate state for parent-child selection groups.',
    usageGuidelines: 'Use for multi-select scenarios. Group related checkboxes vertically with consistent spacing. Use indeterminate state only when a parent checkbox represents a mixed state of children.',
    parts: [
      { id: 'container', name: 'Container' },
      { id: 'indicator', name: 'Indicator', description: 'The checkbox box and checkmark' },
      { id: 'label', name: 'Label' },
      { id: 'description', name: 'Description', description: 'Optional supporting text' },
    ],
    states: [
      { id: 'default', name: 'Default' },
      { id: 'hover', name: 'Hover' },
      { id: 'checked', name: 'Checked' },
      { id: 'indeterminate', name: 'Indeterminate' },
      { id: 'disabled', name: 'Disabled' },
    ],
    variants: [],
    bindings: [],
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    id: 'radio',
    name: 'Radio',
    atomicLevel: 'atom',
    description: 'A single-select option within a mutually exclusive group.',
    usageGuidelines: 'Always group radios in a fieldset with a shared legend. Use when there are 2-5 mutually exclusive options visible at once. For more options, prefer a select dropdown.',
    parts: [
      { id: 'container', name: 'Container' },
      { id: 'indicator', name: 'Indicator', description: 'The radio circle and fill' },
      { id: 'label', name: 'Label' },
    ],
    states: [
      { id: 'default', name: 'Default' },
      { id: 'hover', name: 'Hover' },
      { id: 'selected', name: 'Selected' },
      { id: 'disabled', name: 'Disabled' },
    ],
    variants: [],
    bindings: [],
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    id: 'badge',
    name: 'Badge',
    atomicLevel: 'atom',
    description: 'A small label used to communicate status, category, or count. Non-interactive.',
    usageGuidelines: 'Keep badge text short — ideally one or two words. Use semantic color variants to reinforce meaning (green = success, red = error). Do not use badges for interactive actions; use tags instead.',
    parts: [
      { id: 'container', name: 'Container' },
      { id: 'label', name: 'Label' },
    ],
    states: [
      { id: 'default', name: 'Default' },
    ],
    variants: [
      { id: 'primary', name: 'Primary', category: 'appearance' },
      { id: 'success', name: 'Success', category: 'appearance' },
      { id: 'warning', name: 'Warning', category: 'appearance' },
      { id: 'error', name: 'Error', category: 'appearance' },
      { id: 'neutral', name: 'Neutral', category: 'appearance' },
      { id: 'size-sm', name: 'Small', category: 'size' },
      { id: 'size-md', name: 'Medium', category: 'size' },
    ],
    bindings: [],
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    id: 'badge-dot',
    name: 'Badge Dot',
    atomicLevel: 'atom',
    description: 'A minimal dot indicator used to signal status without text. Commonly used for notification indicators and presence/availability.',
    usageGuidelines: 'Use only when the meaning is unambiguous in context (e.g. an avatar with an online dot). Avoid using dots as the sole indicator of critical states — always provide an accessible text alternative.',
    parts: [
      { id: 'container', name: 'Container' },
      { id: 'dot', name: 'Dot' },
    ],
    states: [
      { id: 'default', name: 'Default' },
    ],
    variants: [
      { id: 'primary', name: 'Primary', category: 'appearance' },
      { id: 'success', name: 'Success', category: 'appearance' },
      { id: 'warning', name: 'Warning', category: 'appearance' },
      { id: 'error', name: 'Error', category: 'appearance' },
      { id: 'neutral', name: 'Neutral', category: 'appearance' },
    ],
    bindings: [],
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    id: 'tag',
    name: 'Tag',
    atomicLevel: 'atom',
    description: 'An interactive label used for filtering, categorizing, or multi-value input. Can be selected or dismissed.',
    usageGuidelines: 'Use tags when users need to interact with labels (select, remove). Use badges for non-interactive labels. Keep tag text short. When used in a multi-select input, ensure keyboard navigation works correctly.',
    parts: [
      { id: 'container', name: 'Container' },
      { id: 'label', name: 'Label' },
      { id: 'icon-leading', name: 'Leading Icon' },
      { id: 'icon-trailing', name: 'Trailing Icon', description: 'Often a remove/close icon' },
    ],
    states: [
      { id: 'default', name: 'Default' },
      { id: 'hover', name: 'Hover' },
      { id: 'selected', name: 'Selected' },
      { id: 'disabled', name: 'Disabled' },
    ],
    variants: [
      { id: 'filled', name: 'Filled', category: 'appearance' },
      { id: 'outlined', name: 'Outlined', category: 'appearance' },
      { id: 'size-sm', name: 'Small', category: 'size' },
      { id: 'size-md', name: 'Medium', category: 'size' },
    ],
    bindings: [],
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    id: 'link',
    name: 'Link',
    atomicLevel: 'atom',
    description: 'A text hyperlink for navigation. Can appear inline within body text or as a standalone element.',
    usageGuidelines: 'Link text should describe the destination, not the action (use "View pricing" not "Click here"). Visited state helps users track navigation history. External links should open in a new tab with a visual indicator.',
    parts: [
      { id: 'text', name: 'Text' },
    ],
    states: [
      { id: 'default', name: 'Default' },
      { id: 'hover', name: 'Hover' },
      { id: 'visited', name: 'Visited' },
      { id: 'active', name: 'Active' },
      { id: 'disabled', name: 'Disabled' },
    ],
    variants: [
      { id: 'inline', name: 'Inline', category: 'type' },
      { id: 'standalone', name: 'Standalone', category: 'type' },
    ],
    bindings: [],
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    id: 'avatar',
    name: 'Avatar',
    atomicLevel: 'atom',
    description: 'A visual representation of a user or entity. Shows a photo, initials, or a fallback icon.',
    usageGuidelines: 'Always provide an alt text or accessible label. When showing initials, use 1-2 characters. Stack avatars with consistent overlap and ensure each has a visible border against varied backgrounds.',
    parts: [
      { id: 'container', name: 'Container' },
      { id: 'image', name: 'Image' },
      { id: 'initials', name: 'Initials', description: 'Fallback text when no image' },
      { id: 'indicator', name: 'Indicator', description: 'Optional status dot' },
    ],
    states: [
      { id: 'default', name: 'Default' },
      { id: 'loading', name: 'Loading' },
    ],
    variants: [
      { id: 'size-sm', name: 'Small (24px)', category: 'size' },
      { id: 'size-md', name: 'Medium (32px)', category: 'size' },
      { id: 'size-lg', name: 'Large (40px)', category: 'size' },
      { id: 'size-xl', name: 'Extra Large (56px)', category: 'size' },
    ],
    bindings: [],
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    id: 'divider',
    name: 'Divider',
    atomicLevel: 'atom',
    description: 'A visual separator between sections or list items. Can be horizontal or vertical, with or without a label.',
    usageGuidelines: 'Use sparingly. Whitespace often communicates separation more elegantly than a divider. Use labeled dividers to introduce new sections in long forms or settings panels.',
    parts: [
      { id: 'line', name: 'Line' },
      { id: 'label', name: 'Label', description: 'Optional center text' },
    ],
    states: [
      { id: 'default', name: 'Default' },
    ],
    variants: [
      { id: 'horizontal', name: 'Horizontal', category: 'type' },
      { id: 'vertical', name: 'Vertical', category: 'type' },
      { id: 'no-label', name: 'No Label', category: 'type' },
      { id: 'with-label', name: 'With Label', category: 'type' },
    ],
    bindings: [],
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    id: 'text-heading',
    name: 'Heading',
    atomicLevel: 'atom',
    description: 'Section headings that establish visual hierarchy. Maps to HTML h1–h6 elements.',
    usageGuidelines: 'Follow document outline order (h1 → h2 → h3). Do not skip heading levels for visual styling — use CSS classes instead. One h1 per page.',
    parts: [
      { id: 'text', name: 'Text' },
    ],
    states: [
      { id: 'default', name: 'Default' },
    ],
    variants: [
      { id: 'h1', name: 'H1', category: 'type' },
      { id: 'h2', name: 'H2', category: 'type' },
      { id: 'h3', name: 'H3', category: 'type' },
      { id: 'h4', name: 'H4', category: 'type' },
      { id: 'h5', name: 'H5', category: 'type' },
      { id: 'h6', name: 'H6', category: 'type' },
    ],
    bindings: [],
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    id: 'text-body',
    name: 'Body Text',
    atomicLevel: 'atom',
    description: 'Paragraph and supporting text. Covers body sizes, captions, and overlines.',
    usageGuidelines: 'Body-md is the default reading size. Use caption for supplementary information below images or data cells. Use overline (all-caps, letter-spaced) sparingly for category labels above headings.',
    parts: [
      { id: 'text', name: 'Text' },
    ],
    states: [
      { id: 'default', name: 'Default' },
    ],
    variants: [
      { id: 'size-lg', name: 'Body Large', category: 'size' },
      { id: 'size-md', name: 'Body Medium', category: 'size' },
      { id: 'size-sm', name: 'Body Small', category: 'size' },
      { id: 'caption', name: 'Caption', category: 'type' },
      { id: 'overline', name: 'Overline', category: 'type' },
    ],
    bindings: [],
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    id: 'card',
    name: 'Card',
    atomicLevel: 'atom',
    description: 'A contained surface for grouping related content. Can be flat, elevated, or outlined.',
    usageGuidelines: 'Use cards to group related items into scannable units. Keep card content focused on a single topic. Avoid nesting cards inside cards. Interactive cards should have a clear hover/focus state.',
    parts: [
      { id: 'container', name: 'Container' },
      { id: 'header', name: 'Header' },
      { id: 'body', name: 'Body' },
      { id: 'footer', name: 'Footer' },
    ],
    states: [
      { id: 'default', name: 'Default' },
      { id: 'hover', name: 'Hover' },
      { id: 'selected', name: 'Selected' },
    ],
    variants: [
      { id: 'flat', name: 'Flat', category: 'appearance' },
      { id: 'elevated', name: 'Elevated', category: 'appearance' },
      { id: 'outlined', name: 'Outlined', category: 'appearance' },
    ],
    bindings: [],
    createdAt: NOW,
    updatedAt: NOW,
  },
]
```

**Step 2: Create `src/lib/atoms/index.ts`**

```typescript
export { ATOM_DEFINITIONS } from './definitions'

// Returns a deep clone of all atom definitions (safe to mutate)
export function getSeedComponents() {
  return JSON.parse(JSON.stringify(ATOM_DEFINITIONS))
}
```

**Step 3: Verify TypeScript**

Run: `npx tsc --noEmit`
Expected: no errors

**Step 4: Commit**

```bash
git add src/lib/atoms/
git commit -m "feat(components): add 15 predefined atom definitions"
```

---

## Task 3: Extend the Zustand Store

**Files:**
- Modify: `src/store/useTokenStore.ts`

**Step 1: Add import at top of file**

Add to the imports in `useTokenStore.ts`:

```typescript
import type { Component, TokenBinding } from '@/types'
import { getSeedComponents } from '@/lib/atoms'
import { nanoid } from 'nanoid'
```

**Step 2: Add component state and actions to `TokenStoreState` interface**

Add these to the `TokenStoreState` interface (after the version actions section):

```typescript
  // Component state
  components: Component[]

  // Component actions
  addBinding: (componentId: string, binding: Omit<TokenBinding, 'id'>) => void
  updateBinding: (componentId: string, bindingId: string, updates: Partial<Pick<TokenBinding, 'tokenPath' | 'cssProperty'>>) => void
  removeBinding: (componentId: string, bindingId: string) => void
  updateComponentMeta: (componentId: string, updates: Partial<Pick<Component, 'description' | 'usageGuidelines'>>) => void
  selectedComponentId: string | null
  setSelectedComponent: (id: string | null) => void
```

**Step 3: Add initial state**

Inside the `create<TokenStoreState>()(persist((set, get) => ({` block, add after the `versions: {}` line:

```typescript
      components: getSeedComponents(),
      selectedComponentId: null,
```

**Step 4: Add action implementations**

Add these action implementations in the body of the store (before the closing of the persist callback, after the `getVersionsForActiveSet` action):

```typescript
      // Component actions
      setSelectedComponent: (id) => set({ selectedComponentId: id }),

      addBinding: (componentId, binding) =>
        set((state) => ({
          components: state.components.map((c) =>
            c.id === componentId
              ? {
                  ...c,
                  bindings: [...c.bindings, { ...binding, id: nanoid() }],
                  updatedAt: Date.now(),
                }
              : c
          ),
        })),

      updateBinding: (componentId, bindingId, updates) =>
        set((state) => ({
          components: state.components.map((c) =>
            c.id === componentId
              ? {
                  ...c,
                  bindings: c.bindings.map((b) =>
                    b.id === bindingId ? { ...b, ...updates } : b
                  ),
                  updatedAt: Date.now(),
                }
              : c
          ),
        })),

      removeBinding: (componentId, bindingId) =>
        set((state) => ({
          components: state.components.map((c) =>
            c.id === componentId
              ? {
                  ...c,
                  bindings: c.bindings.filter((b) => b.id !== bindingId),
                  updatedAt: Date.now(),
                }
              : c
          ),
        })),

      updateComponentMeta: (componentId, updates) =>
        set((state) => ({
          components: state.components.map((c) =>
            c.id === componentId
              ? { ...c, ...updates, updatedAt: Date.now() }
              : c
          ),
        })),
```

**Step 5: Handle migration — ensure existing users get seeded components**

The Zustand persist middleware does a shallow merge. If a user has an existing persisted state without `components`, the initial `components: getSeedComponents()` value is preserved (not overwritten by the stored state). No explicit migration needed.

However, if a user has stored state with `components: []` (empty array), they won't get the seed data re-applied. To handle this, add a migration in the persist config:

Find the persist config at the bottom:
```typescript
    {
      name: 'token-compiler-storage',
      version: 1,
      storage: safeStorage,
    }
```

Replace with:
```typescript
    {
      name: 'token-compiler-storage',
      version: 2,
      storage: safeStorage,
      migrate: (persistedState: unknown, version: number) => {
        const state = persistedState as Record<string, unknown>
        if (version < 2) {
          // Seed components on upgrade from v1
          state.components = getSeedComponents()
          state.selectedComponentId = null
        }
        return state
      },
    }
```

**Step 6: Verify TypeScript**

Run: `npx tsc --noEmit`
Expected: no errors

**Step 7: Verify build**

Run: `npm run build`
Expected: Build succeeds

**Step 8: Commit**

```bash
git add src/store/useTokenStore.ts
git commit -m "feat(components): extend store with component state and actions"
```

---

## Task 4: Update Navigation

**Files:**
- Modify: `src/components/Header.tsx`
- Modify: `src/App.tsx`

**Step 1: Update `Header.tsx`**

In `Header.tsx`, the local `NavItem` type is defined separately from the global `ViewMode`. Update it:

Replace:
```typescript
type NavItem = 'dashboard' | 'editor' | 'browser' | 'compiler' | 'sync'
```
With:
```typescript
import type { ViewMode } from '@/types'
type NavItem = ViewMode
```

Then add `'components'` to the `navItems` array. Insert it between `browser` and `compiler`:

Find:
```typescript
    { id: 'dashboard', label: 'HOME', shortcut: 'Meta+1' },
    { id: 'editor', label: 'EDITOR', shortcut: 'Meta+2' },
    { id: 'browser', label: 'BROWSER', shortcut: 'Meta+3' },
    { id: 'compiler', label: 'COMPILER', shortcut: 'Meta+4' },
    { id: 'sync', label: 'SYNC', shortcut: 'Meta+5' },
```

Replace with:
```typescript
    { id: 'dashboard', label: 'HOME', shortcut: 'Meta+1' },
    { id: 'editor', label: 'EDITOR', shortcut: 'Meta+2' },
    { id: 'browser', label: 'BROWSER', shortcut: 'Meta+3' },
    { id: 'components', label: 'COMPONENTS', shortcut: 'Meta+4' },
    { id: 'compiler', label: 'COMPILER', shortcut: 'Meta+5' },
    { id: 'sync', label: 'SYNC', shortcut: 'Meta+6' },
```

**Step 2: Update `App.tsx`**

First, add the import for the new view (this file will be created in Task 5, but add the import now so we don't forget):

```typescript
// Add to imports at top of App.tsx:
import { ComponentsView } from './pages/ComponentsView'
```

Add the `'components'` case to `renderView()`:

Find the `renderView` function:
```typescript
    switch (activeView) {
      case 'dashboard':
        return <DashboardView />
      case 'editor':
        return <EditorView />
      case 'browser':
        return <BrowserView />
      case 'compiler':
        return <CompilerView />
      case 'sync':
        return <SyncView />
      default:
        return <DashboardView />
    }
```

Replace with:
```typescript
    switch (activeView) {
      case 'dashboard':
        return <DashboardView />
      case 'editor':
        return <EditorView />
      case 'browser':
        return <BrowserView />
      case 'components':
        return <ComponentsView />
      case 'compiler':
        return <CompilerView />
      case 'sync':
        return <SyncView />
      default:
        return <DashboardView />
    }
```

Update keyboard shortcut map:

Find:
```typescript
  const viewKeys: Record<string, typeof activeView> = {
    '1': 'dashboard',
    '2': 'editor',
    '3': 'browser',
    '4': 'compiler',
    '5': 'sync',
  }
```

Replace with:
```typescript
  const viewKeys: Record<string, typeof activeView> = {
    '1': 'dashboard',
    '2': 'editor',
    '3': 'browser',
    '4': 'components',
    '5': 'compiler',
    '6': 'sync',
  }
```

**Step 3: Create stub `ComponentsView` (placeholder to unblock build)**

Create `src/pages/ComponentsView.tsx` as a placeholder:

```typescript
export function ComponentsView() {
  return (
    <div className="flex items-center justify-center h-64">
      <p className="font-mono text-text-secondary text-sm">Components — coming soon</p>
    </div>
  )
}
```

**Step 4: Verify build**

Run: `npm run build`
Expected: Build succeeds — the Components tab now appears in the nav

**Step 5: Commit**

```bash
git add src/components/Header.tsx src/App.tsx src/pages/ComponentsView.tsx
git commit -m "feat(components): add Components nav tab and route"
```

---

## Task 5: Build ComponentsSidebar

**Files:**
- Create: `src/components/components/ComponentsSidebar.tsx`

**Step 1: Create the sidebar component**

```typescript
import type { Component } from '@/types'

interface ComponentsSidebarProps {
  components: Component[]
  selectedId: string | null
  onSelect: (id: string) => void
}

function getBindingCoverage(component: Component): { bound: number; total: number } {
  // Total binding slots = parts × states (simplified: count unique part+state combos)
  const total = component.parts.length * component.states.length
  const bound = component.bindings.length
  return { bound, total }
}

export function ComponentsSidebar({ components, selectedId, onSelect }: ComponentsSidebarProps) {
  const atoms = components.filter((c) => c.atomicLevel === 'atom')

  return (
    <aside className="w-64 flex-shrink-0 border-r border-border flex flex-col min-h-full">
      <div className="px-4 py-3 border-b border-border">
        <span className="font-mono text-xs text-text-tertiary tracking-widest uppercase">Atoms</span>
      </div>
      <nav className="flex-1 overflow-y-auto">
        {atoms.map((component) => {
          const { bound, total } = getBindingCoverage(component)
          const isSelected = selectedId === component.id
          return (
            <button
              key={component.id}
              onClick={() => onSelect(component.id)}
              className={`
                w-full flex items-center justify-between px-4 py-2.5 text-left
                transition-colors border-b border-border/50
                ${isSelected
                  ? 'bg-surface-elevated text-white'
                  : 'text-text-secondary hover:text-white hover:bg-surface-elevated/50'
                }
              `}
            >
              <span className="font-mono text-sm">{component.id}</span>
              <span className={`
                font-mono text-xs px-1.5 py-0.5 rounded
                ${bound === 0 ? 'text-text-tertiary bg-surface-elevated' : 'text-primary bg-primary/10'}
              `}>
                {bound}/{total}
              </span>
            </button>
          )
        })}
      </nav>
      <div className="px-4 py-3 border-t border-border">
        <span className="font-mono text-xs text-text-tertiary">Molecules — coming soon</span>
      </div>
    </aside>
  )
}
```

**Step 2: Verify TypeScript**

Run: `npx tsc --noEmit`
Expected: no errors

**Step 3: Commit**

```bash
git add src/components/components/ComponentsSidebar.tsx
git commit -m "feat(components): add ComponentsSidebar with binding coverage badges"
```

---

## Task 6: Build AnatomyTab

**Files:**
- Create: `src/components/components/AnatomyTab.tsx`

**Step 1: Create the anatomy tab**

```typescript
import type { Component } from '@/types'

interface AnatomyTabProps {
  component: Component
}

export function AnatomyTab({ component }: AnatomyTabProps) {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h3 className="font-mono text-xs text-text-tertiary tracking-widest uppercase mb-4">Parts</h3>
        <div className="space-y-2">
          {component.parts.map((part, index) => (
            <div
              key={part.id}
              className="flex items-start gap-4 p-3 border border-border rounded bg-surface-elevated"
            >
              <div className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-full bg-primary/10 border border-primary/30">
                <span className="font-mono text-xs text-primary">{index + 1}</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-3">
                  <span className="font-mono text-sm text-white">{part.id}</span>
                  <span className="text-xs text-text-secondary">{part.name}</span>
                </div>
                {part.description && (
                  <p className="font-mono text-xs text-text-tertiary mt-0.5">{part.description}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 className="font-mono text-xs text-text-tertiary tracking-widest uppercase mb-4">States</h3>
        <div className="flex flex-wrap gap-2">
          {component.states.map((state) => (
            <div
              key={state.id}
              className="px-3 py-1.5 border border-border rounded font-mono text-xs text-text-secondary bg-surface-elevated"
            >
              {state.id}
            </div>
          ))}
        </div>
      </div>

      {component.variants.length > 0 && (
        <div>
          <h3 className="font-mono text-xs text-text-tertiary tracking-widest uppercase mb-4">Variants</h3>
          {(['appearance', 'size', 'type'] as const).map((category) => {
            const categoryVariants = component.variants.filter((v) => v.category === category)
            if (categoryVariants.length === 0) return null
            return (
              <div key={category} className="mb-4">
                <p className="font-mono text-xs text-text-tertiary mb-2 capitalize">{category}</p>
                <div className="flex flex-wrap gap-2">
                  {categoryVariants.map((variant) => (
                    <div
                      key={variant.id}
                      className="px-3 py-1.5 border border-border rounded font-mono text-xs text-text-secondary bg-surface-elevated"
                    >
                      {variant.id}
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
```

**Step 2: Commit**

```bash
git add src/components/components/AnatomyTab.tsx
git commit -m "feat(components): add AnatomyTab component"
```

---

## Task 7: Build TokenPicker

**Files:**
- Create: `src/components/components/TokenPicker.tsx`

The token picker is a searchable dropdown that lets designers bind a token from the active token set to a component property.

**Step 1: Create `TokenPicker.tsx`**

```typescript
import { useState, useRef, useEffect, useMemo } from 'react'
import { Search, X, ChevronDown } from 'lucide-react'
import type { ResolvedToken, ResolvedTokenMap } from '@/types'

interface TokenPickerProps {
  value: string | null          // currently bound token path
  resolvedTokens: ResolvedTokenMap
  onSelect: (tokenPath: string) => void
  onClear: () => void
  placeholder?: string
}

function TokenSwatch({ token }: { token: ResolvedToken }) {
  if (token.type === 'color') {
    return (
      <span
        className="w-4 h-4 rounded-sm flex-shrink-0 border border-white/20"
        style={{ backgroundColor: String(token.resolvedValue) }}
        aria-hidden="true"
      />
    )
  }
  if (token.type === 'dimension') {
    return (
      <span
        className="w-4 h-2 flex-shrink-0 bg-text-secondary rounded-sm"
        style={{ width: `${Math.min(parseInt(String(token.resolvedValue)) / 4, 16)}px`, minWidth: '2px' }}
        aria-hidden="true"
      />
    )
  }
  return <span className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
}

export function TokenPicker({ value, resolvedTokens, onSelect, onClear, placeholder = 'Bind token...' }: TokenPickerProps) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const currentToken = value ? resolvedTokens[value] : null

  const filtered = useMemo(() => {
    const entries = Object.entries(resolvedTokens) as [string, ResolvedToken][]
    if (!query) return entries.slice(0, 50)
    const q = query.toLowerCase()
    return entries.filter(([path]) => path.toLowerCase().includes(q)).slice(0, 50)
  }, [resolvedTokens, query])

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50)
    } else {
      setQuery('')
    }
  }, [open])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [open])

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`
          w-full flex items-center gap-2 px-2.5 py-1.5 text-left
          border rounded text-xs font-mono transition-colors
          ${value
            ? 'border-primary/30 bg-primary/5 text-white hover:border-primary/60'
            : 'border-border bg-surface-elevated text-text-tertiary hover:border-border-strong hover:text-text-secondary'
          }
        `}
      >
        {currentToken && <TokenSwatch token={currentToken} />}
        <span className="flex-1 truncate">
          {value || placeholder}
        </span>
        {value ? (
          <span
            role="button"
            tabIndex={0}
            onClick={(e) => { e.stopPropagation(); onClear() }}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.stopPropagation(); onClear() } }}
            className="text-text-tertiary hover:text-white transition-colors"
            aria-label="Clear binding"
          >
            <X className="w-3 h-3" />
          </span>
        ) : (
          <ChevronDown className="w-3 h-3 text-text-tertiary" />
        )}
      </button>

      {open && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-surface border border-border rounded shadow-xl">
          <div className="flex items-center gap-2 px-2.5 py-2 border-b border-border">
            <Search className="w-3 h-3 text-text-tertiary flex-shrink-0" />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search tokens..."
              className="flex-1 bg-transparent font-mono text-xs text-white placeholder-text-tertiary outline-none"
            />
          </div>
          <div className="max-h-48 overflow-y-auto">
            {filtered.length === 0 ? (
              <div className="px-3 py-2 font-mono text-xs text-text-tertiary">No tokens found</div>
            ) : (
              filtered.map(([path, token]) => (
                <button
                  key={path}
                  type="button"
                  onClick={() => { onSelect(path); setOpen(false) }}
                  className={`
                    w-full flex items-center gap-2 px-2.5 py-1.5 text-left
                    font-mono text-xs transition-colors
                    ${path === value
                      ? 'bg-primary/10 text-primary'
                      : 'text-text-secondary hover:bg-surface-elevated hover:text-white'
                    }
                  `}
                >
                  <TokenSwatch token={token} />
                  <span className="flex-1 truncate">{path}</span>
                  <span className="text-text-tertiary flex-shrink-0 truncate max-w-[80px]">
                    {String(token.resolvedValue).substring(0, 12)}
                  </span>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
```

**Step 2: Commit**

```bash
git add src/components/components/TokenPicker.tsx
git commit -m "feat(components): add TokenPicker searchable dropdown"
```

---

## Task 8: Build TokenBindingTab

**Files:**
- Create: `src/components/components/TokenBindingTab.tsx`

**Step 1: Create `TokenBindingTab.tsx`**

```typescript
import type { Component, TokenBinding, ResolvedTokenMap } from '@/types'
import { TokenPicker } from './TokenPicker'
import { nanoid } from 'nanoid'

interface TokenBindingTabProps {
  component: Component
  resolvedTokens: ResolvedTokenMap
  onAddBinding: (binding: Omit<TokenBinding, 'id'>) => void
  onUpdateBinding: (bindingId: string, updates: Partial<Pick<TokenBinding, 'tokenPath' | 'cssProperty'>>) => void
  onRemoveBinding: (bindingId: string) => void
}

// Common CSS properties per part type
const CSS_PROPERTY_SUGGESTIONS: Record<string, string[]> = {
  container: ['background-color', 'border-color', 'border-radius', 'box-shadow', 'outline-color'],
  label: ['color', 'font-size', 'font-weight', 'font-family', 'line-height', 'letter-spacing'],
  text: ['color', 'font-size', 'font-weight', 'font-family', 'line-height'],
  'input-field': ['background-color', 'border-color', 'color', 'border-radius'],
  'icon-leading': ['color', 'width', 'height'],
  'icon-trailing': ['color', 'width', 'height'],
  indicator: ['background-color', 'border-color', 'color'],
  spinner: ['color'],
  line: ['background-color', 'height', 'width'],
  dot: ['background-color', 'width', 'height', 'border-radius'],
}

function getDefaultCssProperty(partId: string): string {
  const suggestions = CSS_PROPERTY_SUGGESTIONS[partId]
  return suggestions?.[0] || 'color'
}

// Generate a canonical key for a binding slot
function slotKey(partId: string, stateId: string, variantId: string | null) {
  return `${partId}__${stateId}__${variantId ?? '_'}`
}

export function TokenBindingTab({ component, resolvedTokens, onAddBinding, onUpdateBinding, onRemoveBinding }: TokenBindingTabProps) {
  // Build a map of existing bindings by slot key
  const bindingBySlot = new Map<string, TokenBinding>()
  for (const b of component.bindings) {
    bindingBySlot.set(slotKey(b.partId, b.stateId, b.variantId), b)
  }

  const hasTokens = Object.keys(resolvedTokens).length > 0

  function handleSelect(partId: string, stateId: string, variantId: string | null, tokenPath: string, cssProperty: string) {
    const key = slotKey(partId, stateId, variantId)
    const existing = bindingBySlot.get(key)
    if (existing) {
      onUpdateBinding(existing.id, { tokenPath })
    } else {
      onAddBinding({ partId, stateId, variantId, tokenPath, cssProperty })
    }
  }

  function handleClear(partId: string, stateId: string, variantId: string | null) {
    const key = slotKey(partId, stateId, variantId)
    const existing = bindingBySlot.get(key)
    if (existing) onRemoveBinding(existing.id)
  }

  if (!hasTokens) {
    return (
      <div className="p-6 flex items-center justify-center">
        <p className="font-mono text-sm text-text-tertiary text-center">
          No active token set.<br />
          <span className="text-text-tertiary/60">Activate a token set from the Dashboard to bind tokens.</span>
        </p>
      </div>
    )
  }

  return (
    <div className="overflow-auto">
      <table className="w-full text-xs font-mono">
        <thead>
          <tr className="border-b border-border">
            <th className="px-4 py-2.5 text-left text-text-tertiary font-normal tracking-wider uppercase w-[140px]">Part</th>
            <th className="px-4 py-2.5 text-left text-text-tertiary font-normal tracking-wider uppercase w-[100px]">State</th>
            <th className="px-4 py-2.5 text-left text-text-tertiary font-normal tracking-wider uppercase w-[100px]">Variant</th>
            <th className="px-4 py-2.5 text-left text-text-tertiary font-normal tracking-wider uppercase w-[140px]">CSS Property</th>
            <th className="px-4 py-2.5 text-left text-text-tertiary font-normal tracking-wider uppercase">Token</th>
          </tr>
        </thead>
        <tbody>
          {component.parts.flatMap((part) =>
            component.states.map((state) => {
              const key = slotKey(part.id, state.id, null)
              const existing = bindingBySlot.get(key)
              const defaultCss = getDefaultCssProperty(part.id)
              return (
                <tr key={key} className="border-b border-border/50 hover:bg-surface-elevated/30 transition-colors">
                  <td className="px-4 py-2 text-white">{part.id}</td>
                  <td className="px-4 py-2 text-text-secondary">{state.id}</td>
                  <td className="px-4 py-2 text-text-tertiary">—</td>
                  <td className="px-4 py-2 text-text-secondary">{existing?.cssProperty || defaultCss}</td>
                  <td className="px-4 py-2">
                    <TokenPicker
                      value={existing?.tokenPath || null}
                      resolvedTokens={resolvedTokens}
                      onSelect={(tokenPath) => handleSelect(part.id, state.id, null, tokenPath, existing?.cssProperty || defaultCss)}
                      onClear={() => handleClear(part.id, state.id, null)}
                    />
                  </td>
                </tr>
              )
            })
          )}
        </tbody>
      </table>
    </div>
  )
}
```

**Step 2: Verify TypeScript**

Run: `npx tsc --noEmit`
Expected: no errors

**Step 3: Commit**

```bash
git add src/components/components/TokenBindingTab.tsx
git commit -m "feat(components): add TokenBindingTab with binding table"
```

---

## Task 9: Build ComponentPreview

**Files:**
- Create: `src/components/components/ComponentPreview.tsx`

The preview renders each atom using HTML templates with CSS custom properties derived from the token bindings. Each atom has a purpose-built template.

**Step 1: Create `ComponentPreview.tsx`**

```typescript
import { useMemo } from 'react'
import type { Component, TokenBinding, ResolvedTokenMap } from '@/types'

interface ComponentPreviewProps {
  component: Component
  resolvedTokens: ResolvedTokenMap
  activeState: string
  activeVariant: string | null
}

function deriveCssVars(
  component: Component,
  resolvedTokens: ResolvedTokenMap,
  activeState: string,
  activeVariant: string | null
): Record<string, string> {
  const vars: Record<string, string> = {}
  for (const binding of component.bindings) {
    if (binding.stateId !== activeState) continue
    if (binding.variantId !== null && binding.variantId !== activeVariant) continue
    const token = resolvedTokens[binding.tokenPath]
    if (!token) continue
    // Convert cssProperty to a CSS var name: 'background-color' → '--preview-container-bg'
    const prop = binding.cssProperty.replace(/-([a-z])/g, (_, c) => c.toUpperCase())
    const varName = `--preview-${binding.partId}-${prop}`
    vars[varName] = String(token.resolvedValue)
  }
  return vars
}

// ---- Preview templates ----

function ButtonPreview({ cssVars }: { cssVars: Record<string, string> }) {
  return (
    <div style={cssVars as React.CSSProperties}>
      <button
        style={{
          backgroundColor: 'var(--preview-container-backgroundColor, #f40c3f)',
          color: 'var(--preview-label-color, #fff)',
          borderRadius: 'var(--preview-container-borderRadius, 6px)',
          padding: '8px 16px',
          border: `1px solid var(--preview-container-borderColor, transparent)`,
          fontFamily: 'monospace',
          fontSize: '14px',
          fontWeight: 500,
          cursor: 'pointer',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
        }}
      >
        Button Label
      </button>
    </div>
  )
}

function BadgePreview({ cssVars }: { cssVars: Record<string, string> }) {
  return (
    <div style={cssVars as React.CSSProperties}>
      <span
        style={{
          backgroundColor: 'var(--preview-container-backgroundColor, #f40c3f20)',
          color: 'var(--preview-label-color, #f40c3f)',
          borderRadius: 'var(--preview-container-borderRadius, 4px)',
          padding: '2px 8px',
          fontFamily: 'monospace',
          fontSize: '11px',
          fontWeight: 600,
          letterSpacing: '0.05em',
          textTransform: 'uppercase' as const,
          border: '1px solid var(--preview-container-borderColor, #f40c3f30)',
        }}
      >
        Status
      </span>
    </div>
  )
}

function InputTextPreview({ cssVars }: { cssVars: Record<string, string> }) {
  return (
    <div style={{ ...cssVars as React.CSSProperties, display: 'flex', flexDirection: 'column' as const, gap: '6px' }}>
      <label style={{ fontFamily: 'monospace', fontSize: '12px', color: 'var(--preview-label-color, #aaa)' }}>
        Label
      </label>
      <div
        style={{
          backgroundColor: 'var(--preview-container-backgroundColor, #1a0a0a)',
          border: '1px solid var(--preview-container-borderColor, #3d1515)',
          borderRadius: 'var(--preview-container-borderRadius, 6px)',
          padding: '8px 12px',
          fontFamily: 'monospace',
          fontSize: '14px',
          color: 'var(--preview-placeholder-color, #666)',
        }}
      >
        Placeholder text
      </div>
      <span style={{ fontFamily: 'monospace', fontSize: '11px', color: 'var(--preview-helperText-color, #666)' }}>
        Helper text
      </span>
    </div>
  )
}

function CheckboxPreview({ cssVars }: { cssVars: Record<string, string> }) {
  return (
    <div style={{ ...cssVars as React.CSSProperties, display: 'flex', alignItems: 'center', gap: '10px' }}>
      <div
        style={{
          width: '18px',
          height: '18px',
          borderRadius: 'var(--preview-indicator-borderRadius, 4px)',
          border: '2px solid var(--preview-indicator-borderColor, #f40c3f)',
          backgroundColor: 'var(--preview-indicator-backgroundColor, transparent)',
          flexShrink: 0,
        }}
      />
      <span style={{ fontFamily: 'monospace', fontSize: '14px', color: 'var(--preview-label-color, #ccc)' }}>
        Checkbox label
      </span>
    </div>
  )
}

function CardPreview({ cssVars }: { cssVars: Record<string, string> }) {
  return (
    <div
      style={{
        ...cssVars as React.CSSProperties,
        backgroundColor: 'var(--preview-container-backgroundColor, #1a0a0a)',
        border: '1px solid var(--preview-container-borderColor, #3d1515)',
        borderRadius: 'var(--preview-container-borderRadius, 8px)',
        boxShadow: 'var(--preview-container-boxShadow, none)',
        overflow: 'hidden',
        width: '200px',
      }}
    >
      <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--preview-container-borderColor, #3d1515)' }}>
        <span style={{ fontFamily: 'monospace', fontSize: '13px', fontWeight: 600, color: '#fff' }}>Card Header</span>
      </div>
      <div style={{ padding: '12px 16px' }}>
        <span style={{ fontFamily: 'monospace', fontSize: '12px', color: '#888' }}>Card body content goes here.</span>
      </div>
    </div>
  )
}

function TextHeadingPreview({ cssVars, activeVariant }: { cssVars: Record<string, string>; activeVariant: string | null }) {
  const level = activeVariant || 'h2'
  const sizes: Record<string, string> = { h1: '32px', h2: '24px', h3: '20px', h4: '18px', h5: '16px', h6: '14px' }
  const weights: Record<string, number> = { h1: 700, h2: 700, h3: 600, h4: 600, h5: 500, h6: 500 }
  return (
    <div style={cssVars as React.CSSProperties}>
      <span style={{
        display: 'block',
        fontFamily: 'var(--preview-text-fontFamily, serif)',
        fontSize: `var(--preview-text-fontSize, ${sizes[level] || '24px'})`,
        fontWeight: `var(--preview-text-fontWeight, ${weights[level] || 700})` as React.CSSProperties['fontWeight'],
        color: 'var(--preview-text-color, #fff)',
        lineHeight: 1.2,
      }}>
        {level.toUpperCase()} Heading Text
      </span>
    </div>
  )
}

function TextBodyPreview({ cssVars, activeVariant }: { cssVars: Record<string, string>; activeVariant: string | null }) {
  const sizes: Record<string, string> = {
    'size-lg': '18px', 'size-md': '14px', 'size-sm': '12px',
    caption: '11px', overline: '11px',
  }
  const variant = activeVariant || 'size-md'
  const isOverline = variant === 'overline'
  return (
    <div style={cssVars as React.CSSProperties}>
      <span style={{
        display: 'block',
        fontFamily: 'var(--preview-text-fontFamily, sans-serif)',
        fontSize: `var(--preview-text-fontSize, ${sizes[variant] || '14px'})`,
        fontWeight: 'var(--preview-text-fontWeight, 400)' as React.CSSProperties['fontWeight'],
        color: 'var(--preview-text-color, #ccc)',
        textTransform: isOverline ? 'uppercase' : 'none',
        letterSpacing: isOverline ? '0.1em' : 'normal',
        lineHeight: 1.5,
      }}>
        {isOverline ? 'OVERLINE TEXT' : 'The quick brown fox jumps over the lazy dog.'}
      </span>
    </div>
  )
}

function GenericPreview({ component, cssVars }: { component: Component; cssVars: Record<string, string> }) {
  return (
    <div style={cssVars as React.CSSProperties}>
      <div
        style={{
          padding: '12px 16px',
          border: '1px solid var(--preview-container-borderColor, #3d1515)',
          borderRadius: 'var(--preview-container-borderRadius, 6px)',
          backgroundColor: 'var(--preview-container-backgroundColor, #1a0a0a)',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
        }}
      >
        <span style={{
          fontFamily: 'monospace',
          fontSize: '13px',
          color: 'var(--preview-label-color, #ccc)',
        }}>
          {component.name}
        </span>
      </div>
    </div>
  )
}

function renderAtomPreview(component: Component, cssVars: Record<string, string>, activeVariant: string | null) {
  switch (component.id) {
    case 'button':
    case 'button-icon':
      return <ButtonPreview cssVars={cssVars} />
    case 'badge':
    case 'badge-dot':
      return <BadgePreview cssVars={cssVars} />
    case 'input-text':
    case 'input-select':
      return <InputTextPreview cssVars={cssVars} />
    case 'checkbox':
    case 'radio':
      return <CheckboxPreview cssVars={cssVars} />
    case 'card':
      return <CardPreview cssVars={cssVars} />
    case 'text-heading':
      return <TextHeadingPreview cssVars={cssVars} activeVariant={activeVariant} />
    case 'text-body':
      return <TextBodyPreview cssVars={cssVars} activeVariant={activeVariant} />
    default:
      return <GenericPreview component={component} cssVars={cssVars} />
  }
}

export function ComponentPreview({ component, resolvedTokens, activeState, activeVariant }: ComponentPreviewProps) {
  const cssVars = useMemo(
    () => deriveCssVars(component, resolvedTokens, activeState, activeVariant),
    [component, resolvedTokens, activeState, activeVariant]
  )

  return (
    <div className="flex items-center justify-center min-h-[120px] p-8 bg-surface-elevated/30 rounded border border-border">
      {renderAtomPreview(component, cssVars, activeVariant)}
    </div>
  )
}
```

**Step 2: Commit**

```bash
git add src/components/components/ComponentPreview.tsx
git commit -m "feat(components): add ComponentPreview with atom-specific templates"
```

---

## Task 10: Build OverviewTab

**Files:**
- Create: `src/components/components/OverviewTab.tsx`

**Step 1: Create `OverviewTab.tsx`**

```typescript
import { useState } from 'react'
import { Edit2, Check } from 'lucide-react'
import type { Component, ResolvedTokenMap } from '@/types'
import { ComponentPreview } from './ComponentPreview'

interface OverviewTabProps {
  component: Component
  resolvedTokens: ResolvedTokenMap
  onUpdateMeta: (updates: Partial<Pick<Component, 'description' | 'usageGuidelines'>>) => void
}

export function OverviewTab({ component, resolvedTokens, onUpdateMeta }: OverviewTabProps) {
  const [activeState, setActiveState] = useState(component.states[0]?.id || 'default')
  const [activeVariant, setActiveVariant] = useState<string | null>(
    component.variants.find((v) => v.category === 'appearance')?.id || null
  )
  const [editingDescription, setEditingDescription] = useState(false)
  const [editingGuidelines, setEditingGuidelines] = useState(false)
  const [descValue, setDescValue] = useState(component.description)
  const [guideValue, setGuideValue] = useState(component.usageGuidelines)

  const appearanceVariants = component.variants.filter((v) => v.category === 'appearance')
  const sizeVariants = component.variants.filter((v) => v.category === 'size')

  return (
    <div className="p-6 space-y-6">
      {/* Preview */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          {component.states.map((state) => (
            <button
              key={state.id}
              onClick={() => setActiveState(state.id)}
              className={`
                px-2.5 py-1 font-mono text-xs rounded border transition-colors
                ${activeState === state.id
                  ? 'border-primary/60 text-primary bg-primary/10'
                  : 'border-border text-text-tertiary hover:text-text-secondary hover:border-border-strong'
                }
              `}
            >
              {state.id}
            </button>
          ))}
          {appearanceVariants.length > 0 && (
            <>
              <div className="w-px h-4 bg-border mx-1" />
              {appearanceVariants.map((variant) => (
                <button
                  key={variant.id}
                  onClick={() => setActiveVariant(variant.id)}
                  className={`
                    px-2.5 py-1 font-mono text-xs rounded border transition-colors
                    ${activeVariant === variant.id
                      ? 'border-primary/60 text-primary bg-primary/10'
                      : 'border-border text-text-tertiary hover:text-text-secondary hover:border-border-strong'
                    }
                  `}
                >
                  {variant.id}
                </button>
              ))}
            </>
          )}
        </div>
        <ComponentPreview
          component={component}
          resolvedTokens={resolvedTokens}
          activeState={activeState}
          activeVariant={activeVariant}
        />
      </div>

      {/* Description */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-mono text-xs text-text-tertiary tracking-widest uppercase">Description</h3>
          <button
            onClick={() => {
              if (editingDescription) {
                onUpdateMeta({ description: descValue })
              }
              setEditingDescription(!editingDescription)
            }}
            className="p-1 text-text-tertiary hover:text-white transition-colors"
            aria-label={editingDescription ? 'Save description' : 'Edit description'}
          >
            {editingDescription ? <Check className="w-3 h-3" /> : <Edit2 className="w-3 h-3" />}
          </button>
        </div>
        {editingDescription ? (
          <textarea
            value={descValue}
            onChange={(e) => setDescValue(e.target.value)}
            rows={3}
            className="w-full bg-surface-elevated border border-border rounded px-3 py-2 font-mono text-sm text-white resize-none focus:outline-none focus:border-primary/60"
          />
        ) : (
          <p className="font-mono text-sm text-text-secondary leading-relaxed">{component.description}</p>
        )}
      </div>

      {/* Usage Guidelines */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-mono text-xs text-text-tertiary tracking-widest uppercase">When to Use</h3>
          <button
            onClick={() => {
              if (editingGuidelines) {
                onUpdateMeta({ usageGuidelines: guideValue })
              }
              setEditingGuidelines(!editingGuidelines)
            }}
            className="p-1 text-text-tertiary hover:text-white transition-colors"
            aria-label={editingGuidelines ? 'Save guidelines' : 'Edit guidelines'}
          >
            {editingGuidelines ? <Check className="w-3 h-3" /> : <Edit2 className="w-3 h-3" />}
          </button>
        </div>
        {editingGuidelines ? (
          <textarea
            value={guideValue}
            onChange={(e) => setGuideValue(e.target.value)}
            rows={4}
            className="w-full bg-surface-elevated border border-border rounded px-3 py-2 font-mono text-sm text-white resize-none focus:outline-none focus:border-primary/60"
          />
        ) : (
          <p className="font-mono text-sm text-text-secondary leading-relaxed">{component.usageGuidelines}</p>
        )}
      </div>
    </div>
  )
}
```

**Step 2: Commit**

```bash
git add src/components/components/OverviewTab.tsx
git commit -m "feat(components): add OverviewTab with preview and editable metadata"
```

---

## Task 11: Build Component Code Compilers

**Files:**
- Create: `src/lib/component-compilers/index.ts`
- Create: `src/lib/component-compilers/web-react.ts`
- Create: `src/lib/component-compilers/ios-swift.ts`
- Create: `src/lib/component-compilers/android-compose.ts`

These are pure functions: `(component, resolvedTokens) => string`.

**Step 1: Create `src/lib/component-compilers/web-react.ts`**

```typescript
import type { Component, ResolvedTokenMap } from '@/types'

function tokenPathToCssVar(tokenPath: string): string {
  return `--${tokenPath.replace(/\./g, '-')}`
}

export function compileWebReact(component: Component, resolvedTokens: ResolvedTokenMap): { tsx: string; css: string } {
  const id = component.id
  const name = id
    .split('-')
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join('')

  // --- Generate TypeScript props interface ---
  const appearanceVariants = component.variants.filter((v) => v.category === 'appearance')
  const sizeVariants = component.variants.filter((v) => v.category === 'size')

  const variantProp = appearanceVariants.length > 0
    ? `  variant?: ${appearanceVariants.map((v) => `'${v.id}'`).join(' | ')}`
    : null
  const sizeProp = sizeVariants.length > 0
    ? `  size?: ${sizeVariants.map((v) => `'${v.id.replace('size-', '')}'`).join(' | ')}`
    : null

  const hasLabel = component.parts.some((p) => p.id === 'label' || p.id === 'text')
  const hasIconLeading = component.parts.some((p) => p.id === 'icon-leading')
  const hasIconTrailing = component.parts.some((p) => p.id === 'icon-trailing')
  const hasDisabled = component.states.some((s) => s.id === 'disabled')
  const hasChildren = hasLabel || ['button', 'button-icon'].includes(id)

  const props: string[] = []
  if (variantProp) props.push(variantProp)
  if (sizeProp) props.push(sizeProp)
  if (hasDisabled) props.push('  disabled?: boolean')
  if (hasIconLeading) props.push('  iconLeading?: React.ReactNode')
  if (hasIconTrailing) props.push('  iconTrailing?: React.ReactNode')
  if (hasChildren) props.push('  children?: React.ReactNode')
  props.push(`  className?: string`)

  const defaultVariant = appearanceVariants[0]?.id
  const defaultSize = sizeVariants.find((v) => v.id === 'size-md')?.id.replace('size-', '') || sizeVariants[0]?.id.replace('size-', '')

  const defaultProps: string[] = []
  if (defaultVariant) defaultProps.push(`variant = '${defaultVariant}'`)
  if (defaultSize) defaultProps.push(`size = '${defaultSize}'`)
  if (hasDisabled) defaultProps.push('disabled = false')

  const classNameParts: string[] = [`'${id}'`]
  if (appearanceVariants.length > 0) classNameParts.push('`${id}--${variant}`')
  if (sizeVariants.length > 0) classNameParts.push('`${id}--size-${size}`')
  classNameParts.push('className')

  const tsx = `import React from 'react'
import './${id}.css'

interface ${name}Props {
${props.join('\n')}
}

export const ${name}: React.FC<${name}Props> = ({
  ${defaultProps.join(',\n  ')}${defaultProps.length > 0 ? ',' : ''}
  ${hasIconLeading ? 'iconLeading,' : ''}
  ${hasIconTrailing ? 'iconTrailing,' : ''}
  ${hasChildren ? 'children,' : ''}
  className = '',
}) => {
  const classes = [${classNameParts.join(', ')}]
    .filter(Boolean)
    .join(' ')

  return (
    <div className={classes}${hasDisabled ? ' aria-disabled={disabled}' : ''}>
      ${hasIconLeading ? '{iconLeading && <span className="${id}__icon-leading">{iconLeading}</span>}' : ''}
      ${hasLabel || hasChildren ? `{children && <span className="${id}__label">{children}</span>}` : ''}
      ${hasIconTrailing ? `{iconTrailing && <span className="${id}__icon-trailing">{iconTrailing}</span>}` : ''}
    </div>
  )
}

export default ${name}
`

  // --- Generate CSS ---
  const cssLines: string[] = [
    `/* ${name} component styles */`,
    `/* Generated by Token Compiler — do not edit manually */`,
    `/* Requires: your compiled token CSS file (tokens.css) */`,
    '',
    `.${id} {`,
  ]

  // Collect base (default state, no variant) bindings
  const baseBindings = component.bindings.filter((b) => b.stateId === 'default' && b.variantId === null)
  for (const b of baseBindings) {
    const cssVar = tokenPathToCssVar(b.tokenPath)
    cssLines.push(`  ${b.cssProperty}: var(${cssVar});`)
  }
  cssLines.push('}', '')

  // State-based rules
  const stateMap: Record<string, typeof component.bindings> = {}
  for (const b of component.bindings) {
    if (b.stateId === 'default') continue
    if (b.variantId !== null) continue
    if (!stateMap[b.stateId]) stateMap[b.stateId] = []
    stateMap[b.stateId].push(b)
  }

  const statePseudoMap: Record<string, string> = {
    hover: ':hover',
    pressed: ':active',
    focus: ':focus-visible',
    disabled: '[aria-disabled="true"]',
    error: '.is-error',
  }

  for (const [stateId, bindings] of Object.entries(stateMap)) {
    const pseudo = statePseudoMap[stateId] || `.is-${stateId}`
    cssLines.push(`.${id}${pseudo} {`)
    for (const b of bindings) {
      cssLines.push(`  ${b.cssProperty}: var(${tokenPathToCssVar(b.tokenPath)});`)
    }
    cssLines.push('}', '')
  }

  // Variant rules
  const variantMap: Record<string, typeof component.bindings> = {}
  for (const b of component.bindings) {
    if (!b.variantId) continue
    if (!variantMap[b.variantId]) variantMap[b.variantId] = []
    variantMap[b.variantId].push(b)
  }

  for (const [variantId, bindings] of Object.entries(variantMap)) {
    cssLines.push(`.${id}--${variantId} {`)
    for (const b of bindings) {
      cssLines.push(`  ${b.cssProperty}: var(${tokenPathToCssVar(b.tokenPath)});`)
    }
    cssLines.push('}', '')
  }

  return { tsx: tsx.trim(), css: cssLines.join('\n') }
}
```

**Step 2: Create `src/lib/component-compilers/ios-swift.ts`**

```typescript
import type { Component, ResolvedTokenMap } from '@/types'

function tokenPathToSwift(tokenPath: string): string {
  // 'color.interactive.default' → 'DesignTokens.Color.interactiveDefault'
  const parts = tokenPath.split('.')
  const category = parts[0].charAt(0).toUpperCase() + parts[0].slice(1)
  const rest = parts
    .slice(1)
    .map((s, i) => i === 0 ? s : s.charAt(0).toUpperCase() + s.slice(1))
    .join('')
  return `DesignTokens.${category}.${rest}`
}

function componentNameToSwift(id: string): string {
  return id.split('-').map((s) => s.charAt(0).toUpperCase() + s.slice(1)).join('')
}

export function compileIosSwift(component: Component, resolvedTokens: ResolvedTokenMap): string {
  const name = componentNameToSwift(component.id)
  const appearanceVariants = component.variants.filter((v) => v.category === 'appearance')
  const sizeVariants = component.variants.filter((v) => v.category === 'size')
  const hasLabel = component.parts.some((p) => p.id === 'label' || p.id === 'text')
  const hasChildren = hasLabel

  const variantEnum = appearanceVariants.length > 0
    ? `
    enum Variant {
        ${appearanceVariants.map((v) => `case ${v.id.replace(/-([a-z])/g, (_, c) => c.toUpperCase())}`).join('\n        ')}
    }
`
    : ''

  const sizeEnum = sizeVariants.length > 0
    ? `
    enum Size {
        ${sizeVariants.map((v) => `case ${v.id.replace('size-', '')}`).join('\n        ')}
    }
`
    : ''

  const baseBindings = component.bindings.filter((b) => b.stateId === 'default' && b.variantId === null)
  const modifiers = baseBindings.map((b) => {
    const token = resolvedTokens[b.tokenPath]
    const swiftToken = tokenPathToSwift(b.tokenPath)
    const comment = token ? ` // ${String(token.resolvedValue).substring(0, 20)}` : ''
    if (b.cssProperty === 'background-color') return `            .background(${swiftToken})${comment}`
    if (b.cssProperty === 'color') return `            .foregroundColor(${swiftToken})${comment}`
    if (b.cssProperty === 'border-radius') return `            .cornerRadius(${swiftToken})${comment}`
    if (b.cssProperty === 'font-size') return `            .font(.system(size: ${swiftToken}))${comment}`
    return `            // ${b.cssProperty}: ${swiftToken}${comment}`
  })

  return `import SwiftUI

/// ${component.name}
/// ${component.description}
///
/// Usage guidelines: ${component.usageGuidelines}
struct ${name}: View {
    ${appearanceVariants.length > 0 ? `var variant: Variant = .${appearanceVariants[0].id.replace(/-([a-z])/g, (_, c) => c.toUpperCase())}` : ''}
    ${sizeVariants.length > 0 ? `var size: Size = .${sizeVariants.find((v) => v.id === 'size-md')?.id.replace('size-', '') || 'md'}` : ''}
    ${hasChildren ? 'var label: String' : ''}
    var isDisabled: Bool = false
    ${variantEnum}${sizeEnum}
    var body: some View {
        ${hasLabel ? `Text(label)` : 'Rectangle()'}
${modifiers.join('\n')}
            .opacity(isDisabled ? 0.4 : 1.0)
    }
}

#Preview {
    VStack(spacing: 16) {
        ${name}(${hasChildren ? 'label: "${name} Preview"' : ''})
    }
    .padding()
    .background(Color.black)
}
`.trim()
}
```

**Step 3: Create `src/lib/component-compilers/android-compose.ts`**

```typescript
import type { Component, ResolvedTokenMap } from '@/types'

function tokenPathToKotlin(tokenPath: string): string {
  // 'color.interactive.default' → 'DesignTokens.Color.interactiveDefault'
  const parts = tokenPath.split('.')
  const category = parts[0].charAt(0).toUpperCase() + parts[0].slice(1)
  const rest = parts
    .slice(1)
    .map((s, i) => i === 0 ? s : s.charAt(0).toUpperCase() + s.slice(1))
    .join('')
  return `DesignTokens.${category}.${rest}`
}

function componentNameToKotlin(id: string): string {
  return id.split('-').map((s) => s.charAt(0).toUpperCase() + s.slice(1)).join('')
}

export function compileAndroidCompose(component: Component, resolvedTokens: ResolvedTokenMap): string {
  const name = componentNameToKotlin(component.id)
  const appearanceVariants = component.variants.filter((v) => v.category === 'appearance')
  const sizeVariants = component.variants.filter((v) => v.category === 'size')
  const hasLabel = component.parts.some((p) => p.id === 'label' || p.id === 'text')

  const variantEnum = appearanceVariants.length > 0
    ? `
enum class ${name}Variant {
    ${appearanceVariants.map((v) => v.id.replace(/-([a-z])/g, (_, c) => c.toUpperCase()).replace(/^./, (c) => c.toUpperCase())).join(',\n    ')}
}
`
    : ''

  const sizeEnum = sizeVariants.length > 0
    ? `
enum class ${name}Size {
    ${sizeVariants.map((v) => v.id.replace('size-', '').replace(/^./, (c) => c.toUpperCase())).join(',\n    ')}
}
`
    : ''

  const baseBindings = component.bindings.filter((b) => b.stateId === 'default' && b.variantId === null)

  const bgBinding = baseBindings.find((b) => b.cssProperty === 'background-color')
  const colorBinding = baseBindings.find((b) => b.cssProperty === 'color')
  const radiusBinding = baseBindings.find((b) => b.cssProperty === 'border-radius')

  const bg = bgBinding ? tokenPathToKotlin(bgBinding.tokenPath) : 'DesignTokens.Color.primary'
  const fg = colorBinding ? tokenPathToKotlin(colorBinding.tokenPath) : 'DesignTokens.Color.onPrimary'
  const radius = radiusBinding ? `DesignTokens.Radius.md` : '8.dp'

  const params = [
    hasLabel ? '    label: String' : null,
    appearanceVariants.length > 0 ? `    variant: ${name}Variant = ${name}Variant.${appearanceVariants[0].id.replace(/-([a-z])/g, (_, c) => c.toUpperCase()).replace(/^./, (c) => c.toUpperCase())}` : null,
    sizeVariants.length > 0 ? `    size: ${name}Size = ${name}Size.${(sizeVariants.find((v) => v.id === 'size-md') || sizeVariants[0]).id.replace('size-', '').replace(/^./, (c) => c.toUpperCase())}` : null,
    '    enabled: Boolean = true',
    hasLabel ? null : null,
  ].filter(Boolean)

  return `package com.example.designsystem.components

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import com.example.designsystem.tokens.DesignTokens
${variantEnum}${sizeEnum}
/**
 * ${component.name}
 *
 * ${component.description}
 *
 * Usage: ${component.usageGuidelines}
 */
@Composable
fun ${name}(
${params.join(',\n')},
    modifier: Modifier = Modifier
) {
    Surface(
        modifier = modifier,
        shape = RoundedCornerShape(${radius}),
        color = if (enabled) ${bg} else ${bg}.copy(alpha = 0.4f),
        contentColor = ${fg},
    ) {
        ${hasLabel ? `Text(
            text = label,
            modifier = Modifier.padding(horizontal = 16.dp, vertical = 8.dp),
            style = DesignTokens.Typography.bodyMd
        )` : 'Spacer(modifier = Modifier.size(40.dp))'}
    }
}

@Preview
@Composable
fun ${name}Preview() {
    ${name}(${hasLabel ? `label = "${name} Preview"` : ''})
}
`.trim()
}
```

**Step 4: Create `src/lib/component-compilers/index.ts`**

```typescript
export { compileWebReact } from './web-react'
export { compileIosSwift } from './ios-swift'
export { compileAndroidCompose } from './android-compose'
```

**Step 5: Verify TypeScript**

Run: `npx tsc --noEmit`
Expected: no errors

**Step 6: Commit**

```bash
git add src/lib/component-compilers/
git commit -m "feat(components): add web, iOS, and Android component code compilers"
```

---

## Task 12: Build CodeTab

**Files:**
- Create: `src/components/components/CodeTab.tsx`

**Step 1: Create `CodeTab.tsx`**

```typescript
import { useState, useMemo } from 'react'
import { Copy, Check, Download } from 'lucide-react'
import type { Component, ResolvedTokenMap } from '@/types'
import { compileWebReact, compileIosSwift, compileAndroidCompose } from '@/lib/component-compilers'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism'

type Platform = 'web' | 'ios' | 'android'
type WebTab = 'tsx' | 'css'

interface CodeTabProps {
  component: Component
  resolvedTokens: ResolvedTokenMap
}

function useCopy(text: string) {
  const [copied, setCopied] = useState(false)
  function copy() {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    })
  }
  return { copied, copy }
}

function downloadFile(filename: string, content: string) {
  const blob = new Blob([content], { type: 'text/plain' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export function CodeTab({ component, resolvedTokens }: CodeTabProps) {
  const [platform, setPlatform] = useState<Platform>('web')
  const [webTab, setWebTab] = useState<WebTab>('tsx')

  const webOutput = useMemo(() => compileWebReact(component, resolvedTokens), [component, resolvedTokens])
  const iosOutput = useMemo(() => compileIosSwift(component, resolvedTokens), [component, resolvedTokens])
  const androidOutput = useMemo(() => compileAndroidCompose(component, resolvedTokens), [component, resolvedTokens])

  const currentCode =
    platform === 'web'
      ? (webTab === 'tsx' ? webOutput.tsx : webOutput.css)
      : platform === 'ios'
      ? iosOutput
      : androidOutput

  const { copied, copy } = useCopy(currentCode)

  const fileName =
    platform === 'web'
      ? webTab === 'tsx' ? `${component.id}.tsx` : `${component.id}.css`
      : platform === 'ios'
      ? `${component.id.split('-').map((s) => s.charAt(0).toUpperCase() + s.slice(1)).join('')}.swift`
      : `${component.id.split('-').map((s) => s.charAt(0).toUpperCase() + s.slice(1)).join('')}.kt`

  const language =
    platform === 'ios' ? 'swift'
    : platform === 'android' ? 'kotlin'
    : webTab === 'tsx' ? 'tsx'
    : 'css'

  return (
    <div className="flex flex-col h-full">
      {/* Platform tabs */}
      <div className="flex items-center gap-0 border-b border-border px-4">
        {(['web', 'ios', 'android'] as Platform[]).map((p) => (
          <button
            key={p}
            onClick={() => setPlatform(p)}
            className={`
              px-4 py-3 font-mono text-xs tracking-wider uppercase transition-colors
              ${platform === p ? 'text-primary border-b-2 border-primary -mb-px' : 'text-text-tertiary hover:text-text-secondary'}
            `}
          >
            {p === 'web' ? 'Web' : p === 'ios' ? 'iOS' : 'Android'}
          </button>
        ))}
        <div className="ml-auto flex items-center gap-2 py-2">
          <button
            onClick={copy}
            className="flex items-center gap-1.5 px-2.5 py-1.5 border border-border rounded font-mono text-xs text-text-secondary hover:text-white hover:border-border-strong transition-colors"
            aria-label="Copy code"
          >
            {copied ? <Check className="w-3 h-3 text-success" /> : <Copy className="w-3 h-3" />}
            {copied ? 'Copied' : 'Copy'}
          </button>
          <button
            onClick={() => downloadFile(fileName, currentCode)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 border border-border rounded font-mono text-xs text-text-secondary hover:text-white hover:border-border-strong transition-colors"
            aria-label={`Download ${fileName}`}
          >
            <Download className="w-3 h-3" />
            {fileName}
          </button>
        </div>
      </div>

      {/* Web sub-tabs */}
      {platform === 'web' && (
        <div className="flex items-center gap-0 border-b border-border/50 px-4 bg-surface-elevated/20">
          {(['tsx', 'css'] as WebTab[]).map((t) => (
            <button
              key={t}
              onClick={() => setWebTab(t)}
              className={`
                px-3 py-2 font-mono text-xs tracking-wider transition-colors
                ${webTab === t ? 'text-white' : 'text-text-tertiary hover:text-text-secondary'}
              `}
            >
              {t}
            </button>
          ))}
        </div>
      )}

      {/* Code */}
      <div className="flex-1 overflow-auto">
        <SyntaxHighlighter
          language={language}
          style={vscDarkPlus}
          showLineNumbers
          customStyle={{
            margin: 0,
            borderRadius: 0,
            background: 'transparent',
            fontSize: '12px',
            lineHeight: '1.6',
          }}
        >
          {currentCode}
        </SyntaxHighlighter>
      </div>
    </div>
  )
}
```

**Step 2: Verify TypeScript**

Run: `npx tsc --noEmit`
Expected: no errors

**Step 3: Commit**

```bash
git add src/components/components/CodeTab.tsx
git commit -m "feat(components): add CodeTab with web, iOS, and Android output"
```

---

## Task 13: Assemble ComponentDetail

**Files:**
- Create: `src/components/components/ComponentDetail.tsx`

**Step 1: Create `ComponentDetail.tsx`**

```typescript
import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import type { Component, ResolvedTokenMap, TokenBinding } from '@/types'
import { tabVariants, motionConfig } from '@/lib/motion'
import { OverviewTab } from './OverviewTab'
import { AnatomyTab } from './AnatomyTab'
import { TokenBindingTab } from './TokenBindingTab'
import { CodeTab } from './CodeTab'

type DetailTab = 'overview' | 'anatomy' | 'tokens' | 'code'

interface ComponentDetailProps {
  component: Component
  resolvedTokens: ResolvedTokenMap
  onAddBinding: (binding: Omit<TokenBinding, 'id'>) => void
  onUpdateBinding: (bindingId: string, updates: Partial<Pick<TokenBinding, 'tokenPath' | 'cssProperty'>>) => void
  onRemoveBinding: (bindingId: string) => void
  onUpdateMeta: (updates: Partial<Pick<Component, 'description' | 'usageGuidelines'>>) => void
}

export function ComponentDetail({
  component,
  resolvedTokens,
  onAddBinding,
  onUpdateBinding,
  onRemoveBinding,
  onUpdateMeta,
}: ComponentDetailProps) {
  const [activeTab, setActiveTab] = useState<DetailTab>('overview')

  const tabs: { id: DetailTab; label: string }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'anatomy', label: 'Anatomy' },
    { id: 'tokens', label: 'Tokens' },
    { id: 'code', label: 'Code' },
  ]

  const boundCount = component.bindings.length

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* Component header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border">
        <div>
          <h2 className="font-mono text-base text-white">{component.id}</h2>
          <p className="font-mono text-xs text-text-tertiary mt-0.5">{component.name} — {component.atomicLevel}</p>
        </div>
        <div className="font-mono text-xs text-text-tertiary">
          {boundCount} binding{boundCount !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex items-center border-b border-border px-6">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`
              relative px-4 py-3 font-mono text-xs tracking-wider uppercase transition-colors
              ${activeTab === tab.id ? 'text-white' : 'text-text-tertiary hover:text-text-secondary'}
            `}
          >
            {tab.label}
            {activeTab === tab.id && (
              <motion.div
                layoutId="component-detail-tab-indicator"
                className="absolute bottom-0 left-0 right-0 h-[2px] bg-primary"
              />
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            variants={tabVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={motionConfig.enter}
            className="h-full"
          >
            {activeTab === 'overview' && (
              <OverviewTab
                component={component}
                resolvedTokens={resolvedTokens}
                onUpdateMeta={onUpdateMeta}
              />
            )}
            {activeTab === 'anatomy' && (
              <AnatomyTab component={component} />
            )}
            {activeTab === 'tokens' && (
              <TokenBindingTab
                component={component}
                resolvedTokens={resolvedTokens}
                onAddBinding={onAddBinding}
                onUpdateBinding={onUpdateBinding}
                onRemoveBinding={onRemoveBinding}
              />
            )}
            {activeTab === 'code' && (
              <CodeTab component={component} resolvedTokens={resolvedTokens} />
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}
```

Note: `tabVariants` may not exist yet in `src/lib/motion.ts`. Check that file. If it doesn't exist, use `viewVariants` instead, or add it:

```typescript
// Add to src/lib/motion.ts if tabVariants doesn't exist:
export const tabVariants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
}
```

**Step 2: Commit**

```bash
git add src/components/components/ComponentDetail.tsx
git commit -m "feat(components): add ComponentDetail with four tabs wired together"
```

---

## Task 14: Assemble ComponentsView (Final)

**Files:**
- Modify: `src/pages/ComponentsView.tsx`

Replace the placeholder with the full implementation.

**Step 1: Replace `src/pages/ComponentsView.tsx`**

```typescript
import { useMemo } from 'react'
import { useTokenStore } from '@/store/useTokenStore'
import { resolveTokens } from '@/lib/resolver'
import { ComponentsSidebar } from '@/components/components/ComponentsSidebar'
import { ComponentDetail } from '@/components/components/ComponentDetail'
import type { TokenBinding, Component } from '@/types'

export function ComponentsView() {
  const components = useTokenStore((s) => s.components)
  const selectedComponentId = useTokenStore((s) => s.selectedComponentId)
  const setSelectedComponent = useTokenStore((s) => s.setSelectedComponent)
  const addBinding = useTokenStore((s) => s.addBinding)
  const updateBinding = useTokenStore((s) => s.updateBinding)
  const removeBinding = useTokenStore((s) => s.removeBinding)
  const updateComponentMeta = useTokenStore((s) => s.updateComponentMeta)
  const activeSet = useTokenStore((s) => s.getActiveTokenSet())

  const resolvedTokens = useMemo(() => {
    if (!activeSet) return {}
    const result = resolveTokens(activeSet, activeSet.activeMode || undefined)
    return result.tokens
  }, [activeSet])

  const selectedComponent = components.find((c) => c.id === selectedComponentId) || components[0] || null

  // Auto-select first component if none selected
  if (!selectedComponentId && components.length > 0) {
    setSelectedComponent(components[0].id)
  }

  return (
    <div className="flex min-h-[calc(100vh-10rem)]">
      <ComponentsSidebar
        components={components}
        selectedId={selectedComponent?.id || null}
        onSelect={setSelectedComponent}
      />

      {selectedComponent ? (
        <ComponentDetail
          component={selectedComponent}
          resolvedTokens={resolvedTokens}
          onAddBinding={(binding) => addBinding(selectedComponent.id, binding)}
          onUpdateBinding={(bindingId, updates) => updateBinding(selectedComponent.id, bindingId, updates)}
          onRemoveBinding={(bindingId) => removeBinding(selectedComponent.id, bindingId)}
          onUpdateMeta={(updates) => updateComponentMeta(selectedComponent.id, updates)}
        />
      ) : (
        <div className="flex-1 flex items-center justify-center">
          <p className="font-mono text-sm text-text-tertiary">Select a component to get started</p>
        </div>
      )}
    </div>
  )
}
```

**Step 2: Check `src/lib/motion.ts` for `tabVariants`**

Open `src/lib/motion.ts`. If `tabVariants` is not exported, add it alongside the existing variants.

**Step 3: Run full build**

Run: `npm run build`
Expected: Build succeeds with no TypeScript errors

Fix any TypeScript errors before proceeding.

**Step 4: Verify in dev server**

Run: `npm run dev`

Manual checks:
- Components tab appears in the nav (between Browser and Compiler)
- Clicking it shows the two-panel layout
- Sidebar shows all 15 atoms with `0/N` badges
- Clicking an atom shows its detail panel
- All four tabs are accessible (Overview, Anatomy, Tokens, Code)
- Overview tab shows the preview + editable description/guidelines
- Anatomy tab shows parts, states, and variants
- Tokens tab shows the binding table (requires an active token set)
- Code tab shows web/iOS/Android code output
- Keyboard shortcut Cmd+4 now navigates to Components

**Step 5: Commit**

```bash
git add src/pages/ComponentsView.tsx src/lib/motion.ts
git commit -m "feat(components): complete ComponentsView with full two-panel layout"
```

---

## Task 15: Final Cleanup and Verification

**Step 1: Run full build**

```bash
npm run build
```

Expected: `dist/` folder created, no errors, no TypeScript warnings.

**Step 2: Check for console errors in dev server**

```bash
npm run dev
```

Open http://localhost:5176/ and check browser console for errors.

Known things to verify:
- Store migration works: if you have an older persisted state, the components should still appear
- Token binding table populates correctly when a token set is active
- Code output generates correctly for all 3 platforms
- Copy button copies code to clipboard
- Download button triggers file download

**Step 3: Update project progress doc**

Open `docs/PROJECT-PROGRESS.md` and add a new entry under "Recent Updates":

```markdown
### February 19, 2026 — Phase 6A Component System Complete

**Completed:** Predefined atom catalog with token binding and multi-platform code output

- 15 predefined atoms: button, button-icon, input-text, input-select, checkbox, radio, badge, badge-dot, tag, link, avatar, divider, text-heading, text-body, card
- New Components view (ViewMode: 'components') with two-panel layout
- ComponentsSidebar with binding coverage badges
- Four-tab ComponentDetail: Overview, Anatomy, Tokens, Code
- OverviewTab with live preview + editable description/usage guidelines
- AnatomyTab with parts, states, and variants display
- TokenBindingTab with binding table and searchable TokenPicker
- ComponentPreview with atom-specific HTML templates using CSS custom properties
- Web compiler: React TSX + CSS output
- iOS compiler: SwiftUI output
- Android compiler: Jetpack Compose output
- CodeTab with copy and download per platform
- Zustand store migration (v1→v2) seeds components on upgrade
```

**Step 4: Update `docs/PROJECT-PROGRESS.md` status line**

Change `~80% complete` to `~90% complete`.

**Step 5: Final commit**

```bash
git add docs/PROJECT-PROGRESS.md
git commit -m "docs: mark Phase 6A component system complete in project progress"
```

---

## Summary

| Task | Files | Description |
|------|-------|-------------|
| 1 | `src/types/index.ts` | Add 7 new component types, update ViewMode |
| 2 | `src/lib/atoms/` | 15 predefined atom definitions (2 files) |
| 3 | `src/store/useTokenStore.ts` | Component state + 5 actions, v2 migration |
| 4 | `Header.tsx`, `App.tsx` | Components nav tab, keyboard shortcut |
| 5 | `ComponentsSidebar.tsx` | Atom list with binding coverage badges |
| 6 | `AnatomyTab.tsx` | Parts, states, variants display |
| 7 | `TokenPicker.tsx` | Searchable token dropdown |
| 8 | `TokenBindingTab.tsx` | Binding table (part × state → token) |
| 9 | `ComponentPreview.tsx` | Live preview with CSS custom properties |
| 10 | `OverviewTab.tsx` | Preview + editable description/guidelines |
| 11 | `component-compilers/` | Web React, iOS Swift, Android Compose (4 files) |
| 12 | `CodeTab.tsx` | Three-platform code output |
| 13 | `ComponentDetail.tsx` | Four-tab detail panel |
| 14 | `ComponentsView.tsx` | Final view assembly |
| 15 | `docs/PROJECT-PROGRESS.md` | Progress doc update |
