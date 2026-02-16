# Design token compiler — product requirements document

This document defines the product requirements for a web-based design token compiler that treats tokens as the single source of truth between design tools and codebases. It draws on research synthesized in the parent PRD (designer tooling pain points, 2023–2026) and the detailed product scope for this tool.

---

## 1. Problem statement

Design-to-code synchronization is the single most cited frustration across every source in the research. The token layer — colors, spacing, typography, shadows, radii, motion values — is the foundation of that synchronization problem. When primitive values drift between Figma and code, everything built on top of them drifts too.

The current workflow is manual and error-prone. A designer updates a color in Figma, posts a message in Slack, a developer manually updates a CSS variable, another developer on a different branch misses the message, and three weeks later two different blues appear in production. This pattern repeats for every token, across every platform, across every sprint.

### Key data points

- 46.3% of teams report design-code inconsistencies. A 10-person team loses an estimated $58,500/month to design-delivery misalignment.
- 65.9% of respondents waste 25–50% of their time on handoff inefficiencies.
- No bidirectional sync exists between design tools and codebases. Changes in one environment don't propagate to the other.
- 68% of teams cite design system adoption as a top area needing improvement — largely because maintaining token parity is a full-time job with no automation layer.
- AI code generators (Bolt.new, Lovable, v0) make the problem worse by hardcoding values instead of referencing the team's actual design tokens.

### Why tokens specifically

Tokens are the atomic unit of a design system. If the primitive values are out of sync, components, layouts, and entire pages will be too. Solving the token layer doesn't solve everything, but nothing else can be solved without it. The token compiler is the foundation that the motion spec tool, the design QA tool, and the critique tool all eventually reference.

---

## 2. Product vision

A web-based tool that lets teams define design tokens in a platform-agnostic format, compile them to any target environment (CSS, SCSS, TypeScript, Tailwind, Swift, Kotlin, JSON), sync them between Figma and code, and catch drift before it ships.

The tool replaces the manual token propagation process with a structured workflow: import tokens from Figma or code, resolve references, compile to every platform the team needs, and detect when the two environments diverge.

---

## 3. Target users

### Primary — design system maintainers and design engineers

The people responsible for keeping tokens in sync between Figma and one or more codebases. They currently spend hours each week manually updating token files, writing migration guides, and answering "which blue do I use?" in Slack. At large companies this is a dedicated role. At smaller companies it falls on a senior designer or a frontend developer.

### Secondary — product designers

People who make token-level decisions (adjusting the spacing scale, refining the color palette, updating typography) and need those decisions to reach production without degradation. They don't want to think about JSON files or CSS variables — they want to update a value and trust that it propagates.

### Tertiary — frontend developers

Developers who consume design tokens in code. They want a single canonical token set that compiles to their platform's native format, instead of manually copying hex values from Figma and maintaining redundant definitions across CSS, JavaScript, iOS, and Android.

### Quaternary — engineering managers and design directors

People who want visibility into design system health — how many tokens are defined, how consistently they're used, and whether design and code environments are in sync.

---

## 4. Core concept

The tool centers on a "token set" — a structured, versioned collection of design tokens that serves as the canonical source of truth. The token set is platform-agnostic. The tool compiles it to any target format the team needs.

### Token structure

Tokens are organized in three tiers following the community standard that most mature design systems already use.

- **Primitive tokens.** The raw palette: blue-100 through blue-900, spacing-1 through spacing-16, font families.
- **Semantic tokens.** What the primitives mean in context: color-primary, color-error, text-body, content-gap. These reference primitives.
- **Component tokens.** How semantic tokens apply to specific components: button-background, card-border, input-focus-ring. These reference semantic tokens.

Tokens can reference other tokens (`{color.primitive.blue.600}`), and the compiler resolves these references during output. The resolution engine handles nested references, circular reference detection, missing reference warnings, and mode overrides.

### Token types supported

Color, spacing, typography (compound: font-family, font-size, font-weight, line-height, letter-spacing), shadow (compound: x-offset, y-offset, blur, spread, color), border-radius, opacity, z-index, duration, and easing.

---

## 5. Feature requirements

### 5.1 Token editor

A structured editor where the user defines, organizes, and modifies their token set.

**Requirements:**

- Tree view organized by group (colors, spacing, typography, shadows, radii, opacity, z-index, motion) with expand/collapse.
- Each token displays its name, value, resolved value (if it references another token), and a visual preview (color swatch, spacing bar, type sample, shadow applied to a card, radius applied to a rectangle).
- Inline editing: click a value to change it. Color tokens open a color picker. Spacing tokens accept a number input with unit selector (px, rem). Typography and shadow tokens open compound editors.
- Token references: type `{` to open a search dropdown listing all available tokens. Selecting one creates a reference. The editor shows both the reference path and the resolved value.
- Bulk operations: import from JSON (W3C DTCG format or Style Dictionary format), export the full set, find-and-replace token names, batch-change values.
- Validation: warn on orphan references, circular references, duplicate names, and unused tokens.

### 5.2 Visual token browser

A companion view that displays the full token set visually rather than as a data tree.

**Requirements:**

- Colors shown as a palette grid (rows for each hue, columns for each shade).
- Spacing shown as a scale (horizontal bars of increasing width).
- Typography shown as a type specimen (each style rendered at actual size with a sample sentence).
- Shadows shown applied to cards. Radii shown applied to rectangles.
- Mode switcher for theme preview (light, dark, brand variants).
- Shareable as a standalone link — functions as a living style guide generated directly from the token data.

### 5.3 Multi-format compiler

The core technical differentiator. Compiles the neutral token set to any target format.

**Required compilation targets:**

- CSS custom properties (`:root {}` block, supports light/dark mode scoping via `[data-theme]` or `@media (prefers-color-scheme)`).
- SCSS variables (`$token-name: value;` declarations, supports maps for grouped tokens).
- JavaScript/TypeScript module (typed `as const` object with autocomplete and type checking).
- JSON in W3C Design Tokens Community Group format (the emerging industry standard).
- Tailwind CSS theme config (`theme.extend` object for `tailwind.config.js`).
- Swift for iOS (`UIColor` statics with SwiftUI `Color` extension).
- Kotlin for Android (`const val` properties with Compose theme compatibility).
- Style Dictionary format (for compatibility with teams using Amazon's tool).

**Requirements:**

- Tabbed code view with syntax highlighting and copy button per target.
- Download button exports all enabled targets as a zip file.
- Configurable naming convention (kebab-case, camelCase, etc.).
- Compiler runs entirely in the browser — each target is a pure function from resolved token set to formatted string.

### 5.4 Figma import and sync

The bridge between design and code.

**Requirements:**

- Import from Figma: accepts a JSON export of Figma's local variables. The tool parses it into the neutral token format. MVP is manual import (export from Figma, upload to tool). Post-MVP, the Figma API or a plugin automates this.
- Import from code: accepts existing token files in CSS, SCSS, JSON, or Style Dictionary format. A parser extracts token names and values into the neutral format.
- Diff and sync: once the tool has both a Figma-sourced and code-sourced token set, it computes a diff — tokens that match, tokens with value mismatches, tokens that exist in only one source.
- Diff display: matching tokens shown with green checkmark; value mismatches shown with both values side by side in amber; design-only tokens shown in blue; code-only tokens shown in purple.
- Conflict resolution: for each mismatch, the user can accept the design value, accept the code value, or enter a new value.
- Merged export: after resolving all conflicts, the user exports the merged token set in their desired code formats.

### 5.5 Theme and mode support

**Requirements:**

- Support named modes (dark, light, brand variants) where some token values override the defaults.
- Mode-aware compilation: CSS outputs separate variable blocks scoped to `[data-theme]`; JavaScript outputs a `themes` object with nested overrides; Tailwind outputs dark mode configuration.
- Visual token browser shows a mode switcher for previewing the full palette in each mode.

### 5.6 Token usage analytics

A dashboard answering the question: how healthy is our design system?

**Requirements:**

- Total token count by type.
- Coverage: percentage of the token set defined across all three tiers (primitive, semantic, component).
- Sync status: when was the last sync? How many tokens are currently out of sync?
- Unused tokens: tokens defined but not referenced by any semantic or component token.
- Overused primitives: places where raw primitive values are used directly instead of through semantic tokens.
- Change history: log of when tokens were added, modified, or removed, and by which import source.

### 5.7 Token set versioning

**Requirements:**

- Save named versions (like git tags) of the token set state.
- Compare any two versions side by side — which tokens were added, removed, or changed.
- Rollback to a previous version and re-export.
- MVP stores versions in localStorage. Post-MVP stores them in a database linked to git commits or Figma file versions.

---

## 6. Pages and navigation

The app has six main views.

1. **Dashboard.** Current token set's sync status, recent changes, quick stats (token count, sync health). "New token set" and "import" buttons.
2. **Token editor.** Tree-view editor with inline editing, visual previews, and validation.
3. **Token browser.** Visual style guide view — palette grids, spacing scales, type specimens, shadow samples, mode switcher.
4. **Compiler.** Multi-format export screen with tabbed code view, copy/download buttons, and zip export.
5. **Sync.** Diff and merge screen with side-by-side comparison and conflict resolution.
6. **Library.** Saved token sets and versions, organized by project, with version comparison.

Top navigation bar: logo, dashboard, editor, browser, compiler, sync, user avatar/menu.

---

## 7. Data model

### Token set

```json
{
  "id": "uuid",
  "name": "Acme Corp design system",
  "version": "2.1.0",
  "createdAt": "iso-date",
  "updatedAt": "iso-date",
  "groups": {
    "color": {
      "primitive": {
        "blue": {
          "600": { "value": "#2563EB", "type": "color" }
        }
      },
      "semantic": {
        "primary": {
          "value": "{color.primitive.blue.600}",
          "type": "color",
          "description": "Primary brand color"
        }
      },
      "component": {
        "button-primary-bg": {
          "value": "{color.semantic.primary}",
          "type": "color"
        }
      }
    },
    "spacing": {
      "primitive": {
        "4": { "value": "16px", "type": "spacing" }
      },
      "semantic": {
        "content-gap": { "value": "{spacing.primitive.4}", "type": "spacing" }
      }
    },
    "typography": {
      "semantic": {
        "heading-xl": {
          "value": {
            "fontFamily": "{typography.primitive.font-family-sans}",
            "fontSize": "36px",
            "fontWeight": "700",
            "lineHeight": "1.2",
            "letterSpacing": "-0.02em"
          },
          "type": "typography"
        }
      }
    },
    "shadow": {},
    "borderRadius": {},
    "motion": {}
  },
  "modes": {
    "dark": {
      "color.semantic.background": { "value": "{color.primitive.gray.900}" },
      "color.component.card-bg": { "value": "#1F2937" }
    }
  },
  "metadata": {
    "figmaFileId": "abc123",
    "lastFigmaSync": "iso-date",
    "lastCodeSync": "iso-date",
    "compilationTargets": ["css", "tailwind", "typescript"],
    "namingConvention": "kebab-case"
  }
}
```

### Version snapshot

```json
{
  "id": "uuid",
  "tokenSetId": "uuid",
  "version": "2.1.0",
  "label": "Brand refresh — updated blue palette",
  "createdAt": "iso-date",
  "source": "figma-import",
  "diff": {
    "added": ["color.primitive.blue.50"],
    "removed": [],
    "modified": [
      {
        "token": "color.primitive.blue.600",
        "from": "#3B82F6",
        "to": "#2563EB"
      }
    ]
  }
}
```

### Sync result

```json
{
  "id": "uuid",
  "tokenSetId": "uuid",
  "designSource": "figma-export.json",
  "codeSource": "tokens.css",
  "results": {
    "matching": 84,
    "designOnly": 3,
    "codeOnly": 1,
    "valueMismatch": 7
  },
  "conflicts": [
    {
      "token": "color.semantic.primary",
      "designValue": "#2563EB",
      "codeValue": "#3B82F6",
      "resolution": null
    }
  ]
}
```

---

## 8. Technical architecture

### Stack

- **Frontend:** React (single-page app) with Vite and TypeScript.
- **Styling:** Tailwind CSS with a dark warm theme.
- **State management:** Zustand with persist middleware.
- **Persistence:** localStorage for the MVP. Token set JSON is typically 10–50KB, so storage limits are not a concern.
- **Deployment:** Vercel (free tier, deploys from GitHub).

### Core technical modules

- **Token resolution engine.** A pure function that walks the reference graph (`{color.primitive.blue.600}` → `#2563EB`), handles nested references, detects circular references, resolves mode overrides, and warns on missing references. This is the most critical piece of logic and must be unit-tested in isolation before any UI is built.
- **Compiler functions.** Each output format is a separate pure function from resolved token set to formatted string. Handles naming convention transformation (token path → kebab-case for CSS, camelCase for TypeScript, etc.).
- **Figma variable parser.** Translates Figma's variable export JSON format into the tool's neutral token format. Moderately complex but well-documented by Figma.
- **CSS/SCSS parser.** Regex-based extraction of `--variable-name: value;` from `:root {}` blocks and `$variable: value;` from SCSS files. Does not need to be a full CSS parser.
- **Diff engine.** Iterates all token paths in both sets, classifies each as matching, mismatched, design-only, or code-only.
- **Tree view component.** Recursive React component with expand/collapse, inline editing, drag-to-reorder, and search/filter.

### Key libraries

- `react-colorful` for the color picker.
- `prism-react-renderer` or `react-syntax-highlighter` for code display.
- `jszip` for multi-file download.
- `nanoid` for ID generation.
- `date-fns` for timestamp formatting.
- `file-saver` for downloads.

---

## 9. Build phases

### Phase 1 — token editor and resolver (50–60% of total effort)

- TypeScript types for the full data model.
- Token resolution engine with comprehensive tests.
- Token editor UI: tree view, inline editing, visual previews, reference support.
- Import from JSON (W3C DTCG and Style Dictionary formats).
- localStorage persistence.
- Basic dashboard.

### Phase 2 — multi-format compiler

- CSS custom properties compiler.
- SCSS variables compiler.
- TypeScript module compiler.
- JSON (W3C DTCG) compiler.
- Tailwind CSS config compiler.
- Swift and Kotlin compilers.
- Tabbed code view with syntax highlighting, copy/download, zip export.
- Naming convention configuration.

### Phase 3 — Figma sync and diff

- Figma variable JSON import parser.
- CSS/SCSS file import parser.
- Diff engine.
- Sync UI with side-by-side diff and conflict resolution.
- Merged export after resolution.

### Phase 4 — themes, browser, and versioning

- Mode support (dark, brand variants).
- Mode-aware compilation.
- Visual token browser (palette grids, spacing scales, type specimens).
- Token set versioning (snapshots, comparison, rollback).

### Phase 5 — analytics and polish

- Token usage analytics dashboard.
- Validation warnings.
- Bulk operations.
- Onboarding flow with starter token sets.
- Responsive layout.
- Shareable token browser link (read-only, no account required).

### Phase 6 — post-MVP backend and integrations (optional)

- User accounts (Clerk or Supabase Auth).
- Database storage (Supabase or Firebase).
- Figma plugin for direct push/pull.
- GitHub integration for auto-PR on sync resolution.
- CI/CD webhook on Figma file changes.
- npm package publishing on version bump.
- Multi-user collaboration with role-based access.

---

## 10. Competitive landscape

| Tool | What it does | Gap |
|---|---|---|
| Tokens Studio (Figma plugin) | Stores tokens in JSON, pushes to GitHub from within Figma. | Lives inside Figma. No multi-format compilation, no visual browser, limited sync/diff. A plugin, not a platform. |
| Style Dictionary (Amazon) | Open-source CLI tool that transforms tokens from JSON to multiple formats. | Developer-only. Requires Node.js and config files. No visual editor, no Figma integration, no sync or diff. |
| Specify | Cloud-based token management with Figma integration and multi-format output. | Enterprise-priced, complex setup, steep learning curve. |
| Supernova | Design system management platform covering tokens, components, documentation, code gen. | Enterprise-focused and expensive. Does everything, but heavily. |
| Figma variables (native) | Figma's built-in token system. | No multi-format compilation, no code sync, no visual browser outside Figma, doesn't cover all token types. |
| Cobalt UI | Open-source token compiler similar to Style Dictionary. | Developer-only, no visual interface. |

The opportunity: no tool combines a visual token editor, multi-format compilation, Figma sync with diff/merge, a visual token browser, and analytics in a lightweight, affordable package usable by both designers and developers. The enterprise tools are too heavy. The developer tools have no visual interface. The Figma plugin is limited by being a plugin. This tool sits in the middle.

---

## 11. Revenue model

### Pricing tiers

- **Free.** One token set, up to 100 tokens, three compilation targets (CSS, JSON, Tailwind). Enough for freelancers and side projects. Drives adoption and word-of-mouth.
- **Pro ($12/user/month).** Unlimited token sets and tokens, all compilation targets, Figma import, sync and diff, versioning, visual browser, shareable links. At 5 designers + 10 developers, that's $180/month — trivially justifiable against $58,500/month in drift costs.
- **Team ($24/user/month).** Everything in Pro plus analytics, project-level management, priority targets (Swift, Kotlin, custom), unlimited themes, team collaboration, audit trail.
- **Enterprise (custom).** Everything in Team plus SSO/SAML, self-hosted option, SLA, CI/CD integration, GitHub/GitLab integration, npm publishing.

### Revenue projections

Conservative (18 months): 500 Pro users + 100 Team seats = ~$8,400/month (~$100k ARR).

Moderate (18 months): 2,000 Pro users + 500 Team seats = ~$36,000/month (~$430k ARR).

Growth (month 18–36): 10,000–50,000 paying users at blended $15/user/month = $1.8M–$9M ARR, plus enterprise contracts.

### The financial case

A tool costing a team $180/month that prevents even 10% of $58,500/month in drift waste saves over $5,000/month. The ROI is 28x. The tool sells itself once a team experiences one sync cycle.

---

## 12. Success metrics

- A design system maintainer can import existing tokens (from Figma or CSS) and have compiled, multi-format output in under 10 minutes.
- Compiled CSS, TypeScript, and Tailwind outputs are production-ready — a developer can drop them into a codebase without modification.
- A Figma-to-code sync diff catches 100% of token value mismatches (no silent drift).
- Teams report reducing token maintenance time by at least 50% compared to manual processes.
- The visual token browser is shared outside the tool (linked in documentation, README files, onboarding materials) — this is the viral loop metric.
- Free-to-Pro conversion rate above 10%.
- Net revenue retention above 120%.

---

## 13. Risks and mitigations

| Risk | Mitigation |
|---|---|
| Figma changes their variable export format or API. | The Figma parser is an isolated module. The internal format is Figma-agnostic. Supporting W3C DTCG as a second import path removes single-vendor dependency. |
| Style Dictionary has deep adoption as the compilation layer. | Complement rather than compete. Export to Style Dictionary format as one target, so teams adopt the tool for editing and syncing without abandoning their build pipeline. |
| Tokens Studio is free and has a large user base. | Different value proposition. Tokens Studio is "manage tokens in Figma." This tool is "manage tokens as the single source of truth across your entire stack." Many teams will use both. |
| The token set data model doesn't match how a specific team organizes tokens. | Make the model flexible. Don't enforce the three-tier structure. Support flat sets for simple projects and deep hierarchies for complex ones. |
| Large design systems have thousands of tokens, making the editor slow. | Virtualize the tree view. Debounce re-resolution. Lazy-compute compilation (only the active tab's format). Add search-first mode for massive sets. |
| Teams want backend integrations (Figma API, GitHub, npm) and the MVP doesn't have one. | The file-based import/export workflow is acceptable for MVP. Position backend integrations as the key Pro/Team feature that justifies the subscription. |
| The W3C DTCG spec isn't finalized and may change. | Support the current draft with versioning. Add migration functions when the spec evolves. The neutral internal format insulates the tool from spec changes. |

---

## 14. Integration with the tool suite

This tool is the foundation layer of the three-tool suite.

- **Motion spec tool.** References timing and easing tokens from this tool's token set (duration-fast, easing-default). When a motion spec references an easing value, it should reference the token, not a hardcoded cubic-bezier.
- **Design QA tool.** Cross-references the token set when detecting drift. When the QA tool finds a color mismatch, it can tell the developer: "this element uses #3B82F6, but the token `color.semantic.primary` is #2563EB."
- **Critique tool.** When a reviewer flags a color inconsistency, the designer can reference the token that defines the correct value.

All four tools share the same technical stack (React, Tailwind, Zustand, localStorage, Vercel), the same design language (dark UI, monospaced values, precision-instrument aesthetic), and the same target users. The token compiler is the logical starting point because it produces the data the other tools consume.

---

## 15. Design direction

The tool should feel systematic, trustworthy, and precise — like a well-built compiler or infrastructure tool. Not flashy, not playful.

- **Aesthetic.** Dark UI (dark gray, not pure black). The visual token browser is the one area where color is abundant, displaying the user's own palette. Elsewhere, the interface is restrained.
- **Token editor.** Feels like a code editor or database browser. Compact rows, clear hierarchy, smooth expand/collapse. Inline editing with no modals or save buttons.
- **Compiler output.** Feels like VS Code. Proper syntax highlighting, line numbers, monospaced type. Production-ready confidence.
- **Sync diff.** Feels like a git diff tool. Green for additions, red for removals, amber for changes.
- **Visual token browser.** Feels like a professionally designed style guide — the tool's showcase feature that designers share with their teams.
- **Typography.** JetBrains Mono for token names, values, and code. Clean geometric sans-serif for UI labels.
- **Palette.** Dark background (#1a1a1a range). Consistent accent color across the suite. Green for sync matches. Red for mismatches. Amber for warnings.
