# design token compiler — setup guide for claude code

## visual direction

this tool borrows the look and feel of wodniack.dev but applies it to a utility tool, not a portfolio. take the visual language — the compartmentalized borders, monospace detailing, red-on-dark palette, binary separator strips — and channel it into a tool interface where every pixel serves a function.

**take from wodniack.dev:**

- dark background with crimson red accent (`#f40c3f`) instead of cyan
- 1px solid border compartments dividing every section of the ui
- monospace typography for all data (jetbrains mono)
- serif typography for readable content (instrument serif)
- binary code separator strips between major sections (36px tall, scrolling digits)
- 16px body padding that frames the entire app in a border of the darkest color
- uppercase 8px monospace labels for section titles (inverted: light text on dark strip)
- 4-point star decorative motif as a subtle recurring accent
- the underline hover transition (existing line slides out right, new one enters from left)

**don't take:**

- massive display typography (30vw headlines)
- 3d scroll tunnel or perspective text distortion
- gsap/scrolltrigger (unnecessary for a tool)
- custom scrollbar

---

## stack

```
react + vite + typescript
tailwind css (dark warm theme)
zustand with persist middleware
shadcn/ui + lucide-react
react-colorful (color picker)
react-syntax-highlighter (code display)
jszip (multi-file download)
framer motion (subtle ui transitions only)
nanoid, date-fns, file-saver, diff
```

fonts: jetbrains mono (monospace), instrument serif (editorial), inter (ui fallback).

---

## color palette

```
primary:          #f40c3f   (crimson accent — buttons, active states, conflicts)
secondary:        #160000   (near-black — outermost frame, deepest bg)
surface:          #1e0505   (main content area bg)
surface-elevated: #2a0a0a   (modals, popovers)
border:           #3d1515   (1px compartment lines)
border-subtle:    #2d0e0e   (nested borders)
white:            #fff0eb   (warm white — primary text)
text-secondary:   #b39e9e   (muted labels)
text-tertiary:    #7a6565   (placeholders, disabled)
success:          #22c55e   (sync matches)
warning:          #f59e0b   (value mismatches)
error:            #ef4444   (missing refs, errors)
info:             #3b82f6   (design-only tokens)
```

the red accent is used sparingly — active nav items, primary buttons, sync conflict highlights, the logo mark. everything else is the restrained dark palette.

---

## global css foundation

```css
:root {
  --color-primary: #f40c3f;
  --color-secondary: #160000;
  --color-surface: #1e0505;
  --color-border: #3d1515;
  --color-white: #fff0eb;
  --font-mono: 'JetBrains Mono', monospace;
  --font-serif: 'Instrument Serif', serif;
}

html {
  font: 400 16px/1.48 'Inter', system-ui, sans-serif;
  background-color: var(--color-secondary);
  color: var(--color-white);
}

body {
  padding: 1rem;           /* creates the wodniack border frame */
  min-height: 100vh;
  background-color: var(--color-surface);
}
```

---

## key visual patterns

**compartment borders** — every header section, panel, tree row, and format tab is separated by `border: 1px solid var(--color-border)`. this is the most distinctive pattern from wodniack.

**section titles** — inverted strip: light text on dark background, 12px uppercase monospace, `letter-spacing: 0.1em`. use for token group headers, browser section headers, diff section headers.

**binary separator** — 36px tall strip with `border-top` and `border-bottom`, containing scrolling binary digit groups (`1 0 0 1 0 1 1 0`) in 8px monospace with `//` stripe separators. small css border-triangle on each end. scroll with a css `translateX` marquee animation.

**link hover underline swap:**
```css
.link::before { scale: 1 1; transition: scale 0.3s cubic-bezier(1,0,0,1); }
.link:hover::before { scale: 0 1; transform-origin: 100% 50%; }
.link::after { scale: 0 1; transform-origin: 0 50%; transition: scale 0.3s cubic-bezier(1,0,0,1); }
.link:hover::after { scale: 1 1; }
```

**syntax highlighting** — warm-toned: red for keywords, warm amber for strings, pale pink for numbers, dim gray for comments. matches the palette rather than defaulting to cold vs code colors.

---

## build sequence

### phase 1 — foundation and resolver

1. init vite + react + typescript, install deps, configure tailwind with the palette above
2. define all typescript types (token set, token, mode, version, sync result, compilation target)
3. build the token resolution engine (`resolver.ts`) — resolves `{references}`, detects circular/missing refs, applies mode overrides. **this is the most critical piece. test it thoroughly before touching any ui.**
4. build the app shell layout: body framing, header with compartment borders, binary separator, page routing

### phase 2 — token editor

5. build the token tree (recursive, collapsible groups, inline value previews — color swatches, spacing bars)
6. build the detail panel (color picker, spacing editor, typography editor, shadow editor, reference input)
7. wire to zustand store, add localstorage persistence

### phase 3 — compilers

8. build compilers as pure functions (resolved tokens → formatted string): css, scss, typescript, json (w3c), tailwind, swift, kotlin, style dictionary
9. build the compiler view: tabbed code output with syntax highlighting, copy/download, zip export

### phase 4 — sync and diff

10. build figma variable json parser and css/scss import parser
11. build the diff engine (compare two flattened token sets → matching/mismatch/design-only/code-only)
12. build the sync view: side-by-side diff, conflict resolution controls, merged export

### phase 5 — browser and polish

13. build the visual token browser (color palette grid, spacing scale bars, type specimens, shadow samples, mode switcher)
14. build the dashboard with token set cards and quick actions
15. add versioning (save snapshots, compare, restore)
16. deploy to vercel

---

## header structure

a flex row, 64px tall, divided into compartments by 1px borders:

```
[ logo 64x64 | app title + active set name | editor · browser · compiler · sync | sync status dot ]
```

- logo: a geometric mark in the accent red
- title: "token compiler" in 8px uppercase monospace, active set name below in dimmer text
- nav: 11px uppercase monospace, active link gets red underline
- status: colored dot (green/amber/red) + "synced" or "3 conflicts" in 8px monospace

---

## design inspiration references

- **wodniack.dev** — primary visual reference
- **linear.app** — dark tool ui density
- **vs code** — code editor panels, syntax highlighting
- **tokens studio** — token editor patterns (what to improve on)

---

*adapted from the wodniack.dev visual language — compartmentalized, precise, warm-dark.*
