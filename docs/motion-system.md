# Motion System

**Added:** February 19, 2026
**Library:** Framer Motion v11 (`framer-motion`)
**Shared config:** `src/lib/motion.ts`
**CSS tokens:** `src/index.css` (`:root` block)

---

## Overview

The motion system adds smooth, consistent animations across every view using Framer Motion. All animations are data-driven from a single shared config file. Users with `prefers-reduced-motion: reduce` get near-instant transitions via the global CSS override.

Design intent: animations should feel purposeful and fast — never decorative or slow. The longest animation in the system is 250ms (panel slide). Most interactions are 120–200ms.

---

## Motion Tokens (CSS)

Defined in `src/index.css` on `:root`:

| Token | Value | Use |
|-------|-------|-----|
| `--motion-duration-micro` | `100ms` | Badges, status indicators |
| `--motion-duration-short` | `150ms` | Modals, fade transitions |
| `--motion-duration-medium` | `200ms` | View transitions, stagger items |
| `--motion-duration-long` | `300ms` | Reserved |
| `--motion-ease-enter` | `cubic-bezier(0, 0, 0.2, 1)` | Elements entering |
| `--motion-ease-exit` | `cubic-bezier(0.4, 0, 1, 1)` | Elements leaving |
| `--motion-ease-inout` | `cubic-bezier(0.4, 0, 0.2, 1)` | Bidirectional (slides, collapses) |

Also extended in `tailwind.config.js` as `duration-motion-*` and `ease-motion-*` utilities.

---

## Reduced Motion

Global override in `src/index.css`:

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

All Framer Motion components inherit this — their CSS transitions collapse to near-instant without any JavaScript changes needed.

---

## Shared Config (`src/lib/motion.ts`)

```ts
// Transition presets
motionConfig.enter   // { duration: 0.2, ease: [0,0,0.2,1] }   — standard entrance
motionConfig.exit    // { duration: 0.15, ease: [0.4,0,1,1] }   — standard exit
motionConfig.slide   // { duration: 0.25, ease: [0.4,0,0.2,1] } — panels/drawers
motionConfig.micro   // { duration: 0.12 }                       — icon swaps
motionConfig.collapse // { duration: 0.18, ease: [0.4,0,0.2,1] } — height animations

// Variant objects
viewVariants         // { initial, animate, exit } — view fade+rise
modalVariants        // { initial, animate, exit } — dialog scale+fade
backdropVariants     // { initial, animate, exit } — overlay fade

// Stagger variants
staggerContainer     // container with staggerChildren: 0.05
staggerItem          // { hidden: opacity 0 + y 12, show: opacity 1 + y 0 }
```

Import from `@/lib/motion`.

---

## Animation Patterns

### View Transitions

**File:** `src/App.tsx`
**Pattern:** `AnimatePresence mode="wait"` wrapping the active view, keyed on `activeView`.

```tsx
<AnimatePresence mode="wait">
  <motion.div
    key={activeView}
    initial={{ opacity: 0, y: 6 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -4 }}
    transition={motionConfig.enter}
  >
    {renderView()}
  </motion.div>
</AnimatePresence>
```

Switching views fades out the current content (moving slightly up), then fades in the new content (rising from slightly below). Duration: 200ms.

---

### Storage Warning Banner Slide-Down

**File:** `src/App.tsx`
**Pattern:** Height + opacity animation on conditional mount.

```tsx
<AnimatePresence>
  {storageWarning && (
    <motion.div
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: 'auto', opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      transition={motionConfig.enter}
      style={{ overflow: 'hidden' }}
    >
      {/* banner content */}
    </motion.div>
  )}
</AnimatePresence>
```

---

### Modal Dialogs (Scale + Fade)

**Files:** `src/components/editor/AddTokenDialog.tsx`, `src/pages/DashboardView.tsx`, `src/components/versioning/VersionPanel.tsx`

**Pattern:** Backdrop fades (150ms), dialog scales 0.95 → 1 simultaneously.

```tsx
<AnimatePresence>
  {isOpen && (
    // Backdrop
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={motionConfig.exit}
    >
      // Dialog panel
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.15, ease: [0, 0, 0.2, 1] }}
      >
        {/* content */}
      </motion.div>
    </motion.div>
  )}
</AnimatePresence>
```

**Implementation note for AddTokenDialog:** The `if (!isOpen) return null` guard was moved inside `AnimatePresence` so the exit animation can play. The `getParentPaths` computation runs always (lightweight).

**Dialogs animated:**
- Add Token dialog (EditorView)
- Clear All confirm (DashboardView)
- Load Sample confirm (DashboardView)
- Restore/Delete version confirm (VersionPanel)

---

### Slide-In Panels

**Files:** `src/components/versioning/VersionPanel.tsx`, `src/components/modes/ModePanel.tsx`
**Parent:** `src/pages/EditorView.tsx`

**Pattern:** Panel slides in from the right edge (x: '100%' → 0), controlled by `AnimatePresence` in the parent.

```tsx
// EditorView.tsx
<AnimatePresence>
  {isPanelOpen && (
    <PanelComponent isOpen={isPanelOpen} onClose={closePanel} />
  )}
</AnimatePresence>

// PanelComponent
return (
  <motion.div
    className="fixed inset-y-0 right-0 w-sidebar ..."
    initial={{ x: '100%' }}
    animate={{ x: 0 }}
    exit={{ x: '100%' }}
    transition={motionConfig.slide}
  >
    {/* panel content */}
  </motion.div>
)
```

**Implementation note:** The `if (!isOpen) return null` guard was moved to the parent `AnimatePresence` condition so exit animation plays. ModePanel retains its `if (!activeSet || !activeSetId) return null` guard (not motion-related).

**Panels animated:** VersionPanel, ModePanel

---

### Dashboard Card Stagger

**File:** `src/pages/DashboardView.tsx`

**Pattern:** Grid container uses `staggerContainer` variants; each card item uses `staggerItem` variants. Cards enter sequentially with 50ms delay between each.

```tsx
<motion.div
  className="grid ..."
  variants={staggerContainer}
  initial="hidden"
  animate="show"
>
  {sets.map((tokenSet) => (
    <motion.div key={tokenSet.id} variants={staggerItem}>
      <TokenSetCard ... />
    </motion.div>
  ))}
</motion.div>
```

The `staggerItem` variant: `hidden = { opacity: 0, y: 12 }`, `show = { opacity: 1, y: 0, transition: { duration: 0.2 } }`.

Empty state uses a simple opacity fade: `initial={{ opacity: 0 }} animate={{ opacity: 1 }}`.

---

### Token Tree Expand/Collapse

**File:** `src/components/editor/TokenGroupNode.tsx`

**Pattern:** `AnimatePresence initial={false}` + height animation. `initial={false}` prevents the animation from playing on first render (groups start at their persisted expanded state).

```tsx
<AnimatePresence initial={false}>
  {isExpanded && (
    <motion.div
      role="group"
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: 'auto', opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      transition={motionConfig.collapse}
      style={{ overflow: 'hidden' }}
    >
      {children}
    </motion.div>
  )}
</AnimatePresence>
```

Duration: 180ms. The chevron icon rotation is handled separately via CSS `transition-transform`.

---

### Browser Tab Content Fade

**File:** `src/pages/BrowserView.tsx`

**Pattern:** `AnimatePresence mode="wait"` + `key={activeTab}` causes the exiting tab content to fade out before the entering content fades in.

```tsx
<AnimatePresence mode="wait">
  <motion.div
    key={activeTab}
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    transition={{ duration: 0.15 }}
  >
    {/* active tab panel */}
  </motion.div>
</AnimatePresence>
```

---

### Compiler Tab Indicator (layoutId)

**File:** `src/pages/CompilerView.tsx`

**Pattern:** A single `motion.div` with `layoutId="compiler-tab-indicator"` is rendered only for the active tab. Framer Motion automatically animates it sliding between tab positions when `activeFormat` changes.

```tsx
{activeFormat === format && (
  <motion.div
    layoutId="compiler-tab-indicator"
    className="absolute bottom-0 left-0 right-0 h-[2px] bg-primary"
    transition={motionConfig.enter}
  />
)}
```

No manual position tracking needed — Framer Motion's layout animation handles it.

---

### Copy Button Icon Swap

**File:** `src/pages/CompilerView.tsx`

**Pattern:** `AnimatePresence mode="wait"` crossfades between the Copy and Check icons. Each icon is a `motion.span` with a unique `key` so React treats them as separate elements.

```tsx
<AnimatePresence mode="wait">
  {copied ? (
    <motion.span key="check"
      initial={{ scale: 0.5, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.5, opacity: 0 }}
      transition={{ duration: 0.12 }}
    >
      <Check ... /> COPIED
    </motion.span>
  ) : (
    <motion.span key="copy" ...>
      <Copy ... /> COPY
    </motion.span>
  )}
</AnimatePresence>
```

Duration: 120ms (micro config).

---

### Tour Tooltip Entrance + Step Crossfade

**File:** `src/components/onboarding/TourTooltip.tsx`

**Pattern:** The tooltip `motion.div` uses `key={currentStep}`, triggering a re-mount (and re-animation) on every step change. This creates a subtle scale+fade between steps.

```tsx
<motion.div
  key={currentStep}
  initial={{ opacity: 0, scale: 0.96 }}
  animate={{ opacity: 1, scale: 1 }}
  transition={{ duration: 0.15, ease: [0, 0, 0.2, 1] }}
  style={{ top: position.top, left: position.left, ... }}
>
  {/* step content */}
</motion.div>
```

The `ref` callback pattern (sharing between `tooltipRef` for positioning and `trap.dialogRef` for focus trapping) is preserved — `motion.div` supports standard React `ref` forwarding.

---

## Files Modified

| File | Changes |
|------|---------|
| `src/index.css` | Motion tokens, `prefers-reduced-motion` block |
| `tailwind.config.js` | `duration-motion-*`, `ease-motion-*` utilities |
| `src/lib/motion.ts` | New file — shared transition configs and variants |
| `src/App.tsx` | View transitions, banner slide-down |
| `src/pages/DashboardView.tsx` | Card stagger, confirm modals |
| `src/components/editor/AddTokenDialog.tsx` | Modal scale+fade |
| `src/components/versioning/VersionPanel.tsx` | Confirm modal, panel slide-in |
| `src/components/modes/ModePanel.tsx` | Panel slide-in |
| `src/pages/EditorView.tsx` | AnimatePresence for panels |
| `src/components/editor/TokenGroupNode.tsx` | Height animate expand/collapse |
| `src/pages/BrowserView.tsx` | Tab fade |
| `src/pages/CompilerView.tsx` | Tab indicator layoutId, copy icon swap |
| `src/components/onboarding/TourTooltip.tsx` | Tooltip entrance + step crossfade |

---

## Commit Log

```
b780915 feat(motion): tour tooltip entrance and step crossfade
6e40f60 feat(motion): compiler tab indicator slide + copy icon swap animation
cc3bdd9 feat(motion): fade browser tab content on tab switch
ef46c6b feat(motion): animate token group expand/collapse with height transition
5f1a35a feat(motion): stagger dashboard cards on entrance
c8687cd feat(motion): slide-in animation for version and mode panels
8d08114 feat(motion): animate modal dialogs with scale+fade entrance/exit
4738077 feat(motion): add view transitions and storage banner slide-down
b912147 feat(motion): add motion foundation — tokens, reduced-motion, shared config
```
