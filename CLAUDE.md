# Design Token Compiler

## Quick Reference

- **Dev server:** `npm run dev` (http://localhost:5176/)
- **Build:** `npm run build` (runs `tsc && vite build`)
- **Lint:** `npm run lint`
- **Test resolver:** `npx tsx src/lib/__test-resolver.ts`

## Stack

React 18, TypeScript, Vite 5, Zustand (localStorage persist), Tailwind CSS, Lucide React, date-fns, nanoid, react-colorful, react-syntax-highlighter, jszip, diff

## Architecture

### State Management

Zustand store at `src/store/useTokenStore.ts` with localStorage persistence. Single store for token sets, active set, view state, and version snapshots.

### Types

All shared types in `src/types/index.ts` -- Token, TokenGroup, TokenSet, Version, ViewMode, etc.

### Views

Routing via ViewMode in `src/App.tsx`, navigation in `src/components/Header.tsx`:

| View | File | Purpose |
|------|------|---------|
| Dashboard (default) | `src/pages/DashboardView.tsx` | Token set cards, new/import |
| Editor | `src/pages/EditorView.tsx` | Token tree, inline editing, versioning |
| Browser | `src/pages/BrowserView.tsx` | Visual token browser (colors, spacing, type, shadows) |
| Compiler | `src/pages/CompilerView.tsx` | Multi-format output (CSS, SCSS, TS, Tailwind, W3C JSON, Style Dictionary) |
| Sync | `src/pages/SyncView.tsx` | File import, diff, conflict resolution |

### Key Libraries

| Directory | Purpose |
|-----------|---------|
| `src/lib/resolver.ts` | Token reference resolution engine (core logic) |
| `src/lib/flatten-tokens.ts` | Nested groups to flat dot-notation paths |
| `src/lib/diff-engine.ts` | Compare two token sets for sync |
| `src/lib/compilers/` | 6 format compilers (pure functions) |
| `src/lib/parsers/` | CSS, SCSS, W3C JSON, Figma variable parsers |

### Components

| Directory | Contents |
|-----------|----------|
| `src/components/editor/` | TokenTree, TokenValueNode, TokenGroupNode, EditorHeader, AddTokenDialog, EmptyState |
| `src/components/browser/` | BrowserHeader, ColorGrid, SpacingScale, TypographySpecimens, ShadowSamples |
| `src/components/dashboard/` | TokenSetCard |
| `src/components/versioning/` | VersionPanel, VersionEntry |
| `src/components/sync/` | SyncDropZone, SyncHeader, SyncDiffPanel, SyncTokenRow |

## Key Decisions

- Version snapshots use deep-cloned tokens (`JSON.parse`/`JSON.stringify`), not full TokenSet
- Max 50 versions per token set with auto-pruning
- Restore auto-saves a "Before restore" backup
- Dashboard is the default view (not editor)
- Token resolution follows reference chains recursively with circular detection
- Compilers are pure functions: resolved tokens in, formatted string out

## Visual Design

See `design-token-compiler.md` for the full visual spec (colors, typography, patterns). Key points:

- Dark warm palette with crimson accent (`#f40c3f`)
- Compartment borders (1px solid `#3d1515`) dividing every section
- Monospace (JetBrains Mono) for data, serif (Instrument Serif) for content
- Binary separator strips between major sections

## Process Rules

- Always verify build (`npm run build`) before committing
- Conventional commits with `Co-Authored-By` trailer
- Never use emojis in code, docs, commits, or communication
- Plan file -> task-by-task execution -> build after each task -> commit each task

## Project Status

See `docs/PROJECT-PROGRESS.md` for detailed status. Currently ~80% complete (Phases 1-3 + 5A-5C done).
