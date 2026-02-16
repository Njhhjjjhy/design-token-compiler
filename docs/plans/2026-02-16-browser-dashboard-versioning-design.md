# Browser, Dashboard & Versioning — Design Document

**Date:** February 16, 2026
**Status:** Approved
**Scope:** Phase 5 — Browser, Dashboard, Versioning (deploy excluded)
**Priority:** High — Next phase after Sync & Diff

---

## Context

Phases 1–4 are complete. The Design Token Compiler has a token editor, resolution engine, multi-format compilation, and a sync & diff system. Users can create, edit, compile, and compare tokens — but they lack a visual overview of their design system and a way to manage multiple token sets or preserve history.

Phase 5 adds three features:
- **Dashboard** — a landing page showing all token sets with quick actions
- **Token Browser** — visual inspection of colors, spacing, typography, and shadows
- **Versioning** — manual snapshots with restore capability

---

## Design Approach

**Build order:** Dashboard → Browser → Versioning

**Why this order:**
- Dashboard becomes the new home screen and navigation hub — it contextualizes everything else
- Browser is the most visually complex piece and slots in naturally once the dashboard exists
- Versioning is a focused store + UI addition that layers on top

---

## Feature 1: Dashboard

### Purpose

Replace the editor as the default landing view. Provide an overview of all token sets and act as the navigation hub for the app.

### Navigation Change

- Add `'dashboard'` to the `ViewMode` type
- Dashboard becomes the default view (was `'editor'`)
- Nav order: DASHBOARD | EDITOR | BROWSER | COMPILER | SYNC
- Header component updated to include the new nav item

### Layout

Grid of token set cards (2–3 columns), matching the compartmentalized border style from the design system.

### Token Set Card

Each card shows:
- **Name** of the token set
- **Token count by type** — e.g. "12 colors, 8 spacing, 4 typography"
- **Last modified date** — formatted with date-fns
- **Active mode indicator** — shows current mode (light/dark)
- **Color preview strip** — top edge of card shows the set's first few color tokens as small swatches
- **Quick actions** — Edit (→ Editor), Browse (→ Browser), Export (→ Compiler)

### Global Actions

- "New Token Set" button — creates a new empty set and navigates to Editor
- "Import File" button — opens file picker, parses the file into a new token set

### Empty State

When no token sets exist, a prominent CTA: "Create Your First Token Set" with a brief description of what token sets are.

---

## Feature 2: Token Browser

### Purpose

Visual, read-only inspection of all tokens in the active set, organized by type. No editing — the editor handles that.

### Layout

- **Tab bar** at the top switches between token type sections: Colors | Spacing | Typography | Shadows
- **Mode switcher** below the tabs (light/dark toggle). Only appears when the active set has modes defined. Switching modes re-resolves all tokens through the resolver.
- **Content area** renders the appropriate visualization panel

Tabs show "(0)" and render an empty state message when a type has zero tokens.

### Color Palette Grid

Tokens grouped by category (e.g. "primary", "gray", "semantic"). Each color renders as a swatch card:
- Color fill (the actual color)
- Hex value
- Token path
- Contrast ratio against white and black text

Grid layout, ~4–6 columns. Responsive.

### Spacing Scale

Horizontal bars at proportional widths. Each row shows:
- Token name
- Bar visualization (proportional width)
- Pixel/rem value

Sorted by numeric value ascending — gives a visual "scale" feeling.

### Typography Specimens

Each typography token rendered as a live text sample ("The quick brown fox...") using the actual font-family, weight, and size values. Below the sample:
- Token path
- All property values (family, weight, size, line-height)

### Shadow Samples

Cards with the actual `box-shadow` applied so you can see the shadow visually. Below each card:
- Token path
- Raw shadow value

---

## Feature 3: Versioning

### Purpose

Manual snapshots stored in the Zustand store with localStorage persistence. The user decides when to save a version — no auto-save.

### Data Model

```typescript
interface Version {
  id: string
  name: string          // user-provided or auto-generated ("v3 — Feb 16")
  timestamp: number
  tokenSnapshot: Record<string, Token | TokenGroup>  // deep copy
  tokenCount: number
}
```

Store addition: `versions: Record<string, Version[]>` — array of snapshots per token set ID.

### UI — Version Panel

Accessible from:
- Dashboard — version count badge on each token set card
- Editor — "Versions" button in the EditorHeader toolbar

Renders as a right-side slide-in panel:
- **"Save Version" button** at the top with an optional name input field
- **Timeline list** of snapshots, newest first
- Each entry shows: version name, date/time, token count, "Restore" button

### Restore Behavior

- Restoring replaces the current token tree with the snapshot
- Before restoring, auto-saves a "Before restore" snapshot so the user can undo
- Simple alert/confirmation before restore: "This will replace your current tokens"

### Constraints

- Max ~50 versions per set (localStorage limits). Oldest auto-pruned when exceeded.
- Snapshots are full copies of the token tree — no incremental diffs. Simple and reliable.
- No diffing between versions (future enhancement could reuse Phase 4 diff engine).

---

## Architecture

### New/Modified Files

| Area | Files |
|------|-------|
| Types | Add `'dashboard'` to ViewMode, add `Version` interface |
| Store | Add version state/actions, change default view to dashboard |
| Dashboard | `src/pages/DashboardView.tsx`, `src/components/dashboard/TokenSetCard.tsx` |
| Browser | Replace `src/pages/BrowserView.tsx`, add `src/components/browser/ColorGrid.tsx`, `SpacingScale.tsx`, `TypographySpecimens.tsx`, `ShadowSamples.tsx`, `BrowserHeader.tsx` |
| Versioning | `src/components/versioning/VersionPanel.tsx`, `src/components/versioning/VersionEntry.tsx` |
| Header | Update nav items to include Dashboard |
| App.tsx | Add dashboard case to view switch, set as default |

### Data Flow

- **Dashboard** reads `tokenSets` from store, navigates via `setActiveSet()` + `setActiveView()`
- **Browser** reads active set, resolves tokens via `resolveTokens()`, groups by type for each panel
- **Versioning** reads/writes `versions` in store, deep-clones token tree for snapshots

### Dependencies

No new dependencies. Everything uses existing stack: React, Zustand, Tailwind, Lucide, date-fns.
