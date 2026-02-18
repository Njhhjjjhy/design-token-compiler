# Onboarding Walkthrough -- Design Document

Date: 2026-02-18

## Summary

A step-by-step guided tour that helps designers (especially those unfamiliar with code) understand how to use the Design Token Compiler from start to finish. The tour auto-shows on first visit and is re-accessible via a help button in the header.

## Requirements

- Auto-show on first visit, skip on subsequent visits (localStorage)
- Help button in the header to restart the tour anytime
- Floating tooltip cards with arrows pointing at real UI elements
- Progressive detail: brief by default, expandable for more context
- Navigate through actual app views (Dashboard, Editor, Browser, Compiler, Sync)
- Designer-friendly language throughout -- no unexplained jargon
- Offer demo token set at the end for hands-on exploration
- Full keyboard and screen reader accessibility

## Approach

Custom tooltip tour engine built from scratch (no third-party library). Chosen because:
- Zero new dependencies
- Full control over styling to match the dark warm palette
- Builds on existing modal, focus trap, and ARIA dialog patterns

## Architecture

### Components

| Component | Purpose |
|-----------|---------|
| `TourProvider` | React context managing tour state (active, step index, navigation functions) |
| `TourOverlay` | Semi-transparent backdrop with spotlight cutout around the target element |
| `TourTooltip` | Positioned floating card with step content, arrows, and navigation buttons |

### Data Attributes

Existing UI elements receive `data-tour="step-name"` attributes so the tour engine can locate them. These are invisible to users and have no behavioral impact.

### State Management

- Tour state lives in React context (not Zustand) -- it is ephemeral UI state, not persisted app data
- localStorage key `dtc-onboarding-complete` tracks whether the user has completed or skipped the tour
- The help button bypasses this flag and always starts the tour

### Positioning

The tooltip calculates placement (top, bottom, left, right) based on the target element's `getBoundingClientRect()` and available viewport space. Recalculates on window resize. Falls back to centered if the target element is not found.

## Tour Steps

### Step 1: Welcome (centered, no target)

> "Welcome to Token Compiler -- a tool that turns your design decisions into files developers can use directly in code. Let's walk through how it works."
>
> Expand: "Design tokens are the named values behind your designs -- colors like 'brand-red', spacing like 'padding-large', fonts like 'heading-style'. This app helps you organize them and export them in formats your dev team needs."

### Step 2: Getting Your Tokens (centered, no target)

> "First, you need to get your design values out of Figma. There are three ways:"
>
> Expand:
> - "Figma Variables: Export your variables from Figma's native Variables panel as JSON"
> - "Tokens Studio plugin: If your team uses Tokens Studio (formerly Figma Tokens), export from the plugin"
> - "Manual files: You can also use existing CSS, SCSS, or JSON token files your team already has"

### Step 3: The Dashboard (view: dashboard, target: token set grid)

> "This is your home base. Each card represents a token set -- a collection of related design values."
>
> Expand: "Think of a token set like a Figma library. It holds all the colors, spacing, typography, and other values for a project or brand."

### Step 4: Creating or Importing (view: dashboard, target: action buttons)

> "Start by creating a new empty set, or import a file you exported from Figma."
>
> Expand: "Click 'Import' to load a JSON, CSS, or SCSS file. The app will automatically detect the format and organize your tokens into groups."

### Step 5: Try the Demo (view: dashboard, target: sample data button)

> "Want to explore first? Load the sample token set -- it includes realistic colors, spacing, typography, and shadows you can play with."

### Step 6: The Editor (view: editor, target: token tree)

> "This is where you organize and edit your tokens. Your values are arranged in a tree -- groups contain tokens, just like folders contain files."
>
> Expand: "Click any value to edit it. You can change colors, adjust spacing, update font settings, or add entirely new tokens."

### Step 7: Editing a Token (view: editor, target: a token value)

> "Click any token to edit its value. Changes are saved automatically."
>
> Expand: "Tokens can reference other tokens -- for example, 'button-background' can point to 'brand-primary'. When you update 'brand-primary', everything that references it updates too."

### Step 8: The Browser (view: browser, target: color grid)

> "The Browser gives you a visual preview of all your tokens -- see your colors as swatches, spacing as scales, typography as live specimens."
>
> Expand: "This is great for reviewing your design system at a glance and sharing previews with your team."

### Step 9: Exporting for Developers (view: compiler, target: format selector)

> "This is where the magic happens. Choose a format and the app creates a file your developer can drop straight into their codebase."
>
> Expand: "Each format serves a different tech stack: CSS for web, SCSS for Sass projects, TypeScript for React/JS apps, Tailwind for Tailwind CSS setups, and JSON formats for design tool integrations."

### Step 10: Keeping Things in Sync (view: sync, target: drop zone)

> "Updated your Figma file? Drop the new export here and the app will show you exactly what changed -- new tokens, removed tokens, and value differences."
>
> Expand: "You can choose which changes to accept, one by one, so nothing gets overwritten by accident."

### Step 11: Version History (view: editor, target: version panel trigger)

> "Every time you make a change, a version snapshot is saved. You can go back to any previous version if something goes wrong."

### Step 12: You're Ready (centered, no target)

> "That's it! You can revisit this guide anytime from the help button in the top bar. Start by loading the sample data or importing your own tokens."
>
> Two action buttons: "Load Sample Data" / "Start from Scratch"

## Header Integration

- A `HelpCircle` icon button added to the left of the theme toggle in the header
- Same styling pattern: `border-l border-border`, same padding and size as the theme toggle
- Clicking restarts the tour from Step 1 regardless of completion state

## Replacing the Welcome Banner

The existing dismissible welcome banner in DashboardView becomes redundant and will be removed. The tour covers all the same information and more.

## Visual Design

- Tooltip: `bg-surface-elevated border border-border rounded-lg` with `shadow-lg`
- Arrow: CSS triangle (border trick) matching `bg-surface-elevated` and `border-border`
- Overlay: `fixed inset-0 bg-black/60` with a spotlight cutout (CSS clip-path or box-shadow trick)
- Step title: JetBrains Mono, 11px uppercase, `text-primary`
- Step body: Inter, 14px, `text-white`
- Expand link: `text-text-secondary` with underline, reveals content below
- Step counter: `text-text-tertiary`, 11px monospace
- Next button: `bg-primary text-white` (crimson)
- Back button: `bg-surface-elevated border border-border` (ghost)
- Skip link: `text-text-secondary` underline, smaller text

## Accessibility

- Tooltip has `role="dialog"`, `aria-label` with step title, `aria-describedby` for body
- Focus trapped within tooltip while active (reuse `useFocusTrap` hook)
- Keyboard: Tab between controls, Enter to activate, Escape to close tour
- Step transitions announce via `aria-live="polite"` region
- "Step X of Y" readable by assistive technology
- Spotlight cutout does not interfere with target element interaction (pointer-events pass through)

## Edge Cases

- Target element not found: tooltip falls back to centered position
- Window resize: recalculate tooltip position
- User navigates away during tour: tour pauses, can resume from help button
- Empty dashboard (no token sets): steps targeting cards skip gracefully or show centered fallback
- Mobile/narrow viewports: tooltip takes full width at bottom of screen

## New Files

| File | Purpose |
|------|---------|
| `src/components/onboarding/TourProvider.tsx` | Context provider, state management, step definitions |
| `src/components/onboarding/TourOverlay.tsx` | Backdrop with spotlight cutout |
| `src/components/onboarding/TourTooltip.tsx` | Positioned tooltip with content and navigation |
| `src/components/onboarding/tour-steps.ts` | Step configuration data (targets, content, views) |

## Modified Files

| File | Change |
|------|--------|
| `src/App.tsx` | Wrap app in `TourProvider`, add first-visit auto-start logic |
| `src/components/Header.tsx` | Add help button, add `data-tour` attributes |
| `src/pages/DashboardView.tsx` | Remove welcome banner, add `data-tour` attributes |
| `src/pages/EditorView.tsx` | Add `data-tour` attributes |
| `src/pages/BrowserView.tsx` | Add `data-tour` attributes |
| `src/pages/CompilerView.tsx` | Add `data-tour` attributes |
| `src/pages/SyncView.tsx` | Add `data-tour` attributes |
