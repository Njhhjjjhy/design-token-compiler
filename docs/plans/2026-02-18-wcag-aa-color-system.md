# WCAG AA Color System with Light/Dark Mode

Date: 2026-02-18

## Overview

Refactor the color system to use CSS custom properties with `.dark` class toggling, fix WCAG AA contrast failures, and add a light mode theme.

## Tasks

### Task 1: Update src/index.css

- Replace `:root` color variables with **light mode** values
- Add `.dark` block with dark mode values
- Add `surface-sunken` variable (missing from current CSS)
- Set `html` to apply `.dark` by default (preserves current appearance)
- Fix `--color-text-tertiary` mismatch (#7a6565 -> #9a8080 dark, #806a6a light)

### Task 2: Update tailwind.config.js

- Change all hardcoded hex colors to `var(--color-*)` references
- Add `surface-sunken` to the surface color group
- Add `darkMode: 'class'` to config

### Task 3: Fix undefined Tailwind classes in components

Replace in all component files:
- `bg-bg-primary` -> `bg-surface`
- `bg-bg-secondary` -> `bg-surface-elevated`
- `border-border-default` -> `border-border`
- `text-text-primary` -> `text-white`
- `bg-surface-sunken` -> already defined after Task 2

Files affected:
- `src/components/editor/AddTokenDialog.tsx`
- `src/components/editor/EditorHeader.tsx`
- `src/components/editor/TokenValueNode.tsx`
- `src/components/browser/BrowserHeader.tsx`
- `src/components/versioning/VersionPanel.tsx`
- `src/pages/DashboardView.tsx`

### Task 4: Replace hardcoded off-system colors

Replace Tailwind `amber-*`, `red-*`, `blue-*`, `gray-*` with design system tokens:

Files affected:
- `src/components/browser/ColorGrid.tsx` -- amber/red -> warning/error
- `src/components/editor/TokenValueNode.tsx` -- amber/gray/blue -> warning/border/info
- `src/pages/CompilerView.tsx` -- hardcoded #858585 -> var(--color-text-tertiary)
- `src/components/browser/ColorGrid.tsx` -- hardcoded #2a2a2a/#1a1a1a pattern -> use CSS vars

### Task 5: Add theme toggle

- Add sun/moon toggle button to `src/components/Header.tsx`
- Create `src/hooks/useTheme.ts` hook:
  - Read from localStorage key `theme`
  - Fall back to `prefers-color-scheme`
  - Toggle `.dark` class on `<html>`
  - Default to dark mode
- Import Lucide `Sun`/`Moon` icons

### Task 6: Build verification and final commit

- Run `npm run build` final pass
- Verify no TypeScript or build errors
