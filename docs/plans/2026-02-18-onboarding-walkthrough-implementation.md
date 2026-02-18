# Onboarding Walkthrough Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a 12-step guided tour that teaches designers how to use the Design Token Compiler, with floating tooltips, spotlight overlay, progressive detail, and a help button for re-access.

**Architecture:** Custom tooltip tour engine using React context for ephemeral tour state, CSS box-shadow spotlight, and `data-tour` attributes on existing elements. No new dependencies. Tour auto-starts on first visit (localStorage flag) and can be restarted from a header help button.

**Tech Stack:** React 18 context + hooks, TypeScript, Tailwind CSS, Lucide React (HelpCircle, ChevronDown icons), existing useFocusTrap hook.

**Design doc:** `docs/plans/2026-02-18-onboarding-walkthrough-design.md`

---

### Task 1: Tour Step Data Definitions

**Files:**
- Create: `src/components/onboarding/tour-steps.ts`

**Step 1: Create the tour step type and data array**

This file defines the shape of each step and all 12 tour steps. Each step specifies its target `data-tour` attribute, which view it requires, tooltip placement preference, and the content (title, description, expanded detail).

```ts
import type { ViewMode } from '@/types'

export type TooltipPlacement = 'top' | 'bottom' | 'left' | 'right' | 'center'

export interface TourStep {
  id: string
  target: string | null          // data-tour="..." selector, null = centered
  view: ViewMode | null          // navigate to this view, null = stay on current
  placement: TooltipPlacement
  title: string
  description: string
  expandedDetail?: string        // progressive detail, shown on "Learn more" click
  isFinal?: boolean              // last step shows action buttons instead of Next
}

export const TOUR_STEPS: TourStep[] = [
  {
    id: 'welcome',
    target: null,
    view: null,
    placement: 'center',
    title: 'Welcome to Token Compiler',
    description: 'A tool that turns your design decisions into files developers can use directly in code. Let\'s walk through how it works.',
    expandedDetail: 'Design tokens are the named values behind your designs -- colors like \'brand-red\', spacing like \'padding-large\', fonts like \'heading-style\'. This app helps you organize them and export them in formats your dev team needs.',
  },
  {
    id: 'getting-tokens',
    target: null,
    view: null,
    placement: 'center',
    title: 'Getting Your Tokens',
    description: 'First, you need to get your design values out of Figma. There are three ways:',
    expandedDetail: 'Figma Variables: Export your variables from Figma\'s native Variables panel as JSON.\n\nTokens Studio plugin: If your team uses Tokens Studio (formerly Figma Tokens), export from the plugin.\n\nManual files: You can also use existing CSS, SCSS, or JSON token files your team already has.',
  },
  {
    id: 'dashboard',
    target: 'dashboard-grid',
    view: 'dashboard',
    placement: 'top',
    title: 'The Dashboard',
    description: 'This is your home base. Each card represents a token set -- a collection of related design values.',
    expandedDetail: 'Think of a token set like a Figma library. It holds all the colors, spacing, typography, and other values for a project or brand.',
  },
  {
    id: 'creating-importing',
    target: 'dashboard-actions',
    view: 'dashboard',
    placement: 'bottom',
    title: 'Creating or Importing',
    description: 'Start by creating a new empty set, or import a file you exported from Figma.',
    expandedDetail: 'Click \'Import\' to load a JSON, CSS, or SCSS file. The app will automatically detect the format and organize your tokens into groups.',
  },
  {
    id: 'try-demo',
    target: 'dashboard-sample',
    view: 'dashboard',
    placement: 'bottom',
    title: 'Try the Demo',
    description: 'Want to explore first? Load the sample token set -- it includes realistic colors, spacing, typography, and shadows you can play with.',
  },
  {
    id: 'editor',
    target: 'editor-tree',
    view: 'editor',
    placement: 'right',
    title: 'The Editor',
    description: 'This is where you organize and edit your tokens. Your values are arranged in a tree -- groups contain tokens, just like folders contain files.',
    expandedDetail: 'Click any value to edit it. You can change colors, adjust spacing, update font settings, or add entirely new tokens.',
  },
  {
    id: 'editing-token',
    target: 'editor-token-value',
    view: 'editor',
    placement: 'left',
    title: 'Editing a Token',
    description: 'Click any token to edit its value. Changes are saved automatically.',
    expandedDetail: 'Tokens can reference other tokens -- for example, \'button-background\' can point to \'brand-primary\'. When you update \'brand-primary\', everything that references it updates too.',
  },
  {
    id: 'browser',
    target: 'browser-content',
    view: 'browser',
    placement: 'top',
    title: 'The Browser',
    description: 'The Browser gives you a visual preview of all your tokens -- see your colors as swatches, spacing as scales, typography as live specimens.',
    expandedDetail: 'This is great for reviewing your design system at a glance and sharing previews with your team.',
  },
  {
    id: 'compiler',
    target: 'compiler-formats',
    view: 'compiler',
    placement: 'bottom',
    title: 'Exporting for Developers',
    description: 'This is where the magic happens. Choose a format and the app creates a file your developer can drop straight into their codebase.',
    expandedDetail: 'Each format serves a different tech stack: CSS for web, SCSS for Sass projects, TypeScript for React/JS apps, Tailwind for Tailwind CSS setups, and JSON formats for design tool integrations.',
  },
  {
    id: 'sync',
    target: 'sync-dropzone',
    view: 'sync',
    placement: 'top',
    title: 'Keeping Things in Sync',
    description: 'Updated your Figma file? Drop the new export here and the app will show you exactly what changed -- new tokens, removed tokens, and value differences.',
    expandedDetail: 'You can choose which changes to accept, one by one, so nothing gets overwritten by accident.',
  },
  {
    id: 'versions',
    target: 'editor-versions-btn',
    view: 'editor',
    placement: 'bottom',
    title: 'Version History',
    description: 'Every time you make a change, a version snapshot is saved. You can go back to any previous version if something goes wrong.',
  },
  {
    id: 'ready',
    target: null,
    view: null,
    placement: 'center',
    title: 'You\'re Ready!',
    description: 'That\'s it! You can revisit this guide anytime from the help button in the top bar. Start by loading the sample data or importing your own tokens.',
    isFinal: true,
  },
]
```

**Step 2: Verify build**

Run: `npm run build`
Expected: PASS (new file is just types and data, no side effects)

**Step 3: Commit**

```bash
git add src/components/onboarding/tour-steps.ts
git commit -m "feat(onboarding): add tour step definitions"
```

---

### Task 2: Tour Context Provider

**Files:**
- Create: `src/components/onboarding/TourProvider.tsx`

**Step 1: Create TourProvider with context, state, and navigation logic**

The provider manages: whether the tour is active, current step index, functions to go next/back/skip/restart, and coordination with the app's view navigation via a callback prop.

```tsx
import { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react'
import { TOUR_STEPS } from './tour-steps'
import type { ViewMode } from '@/types'

const ONBOARDING_COMPLETE_KEY = 'dtc-onboarding-complete'

interface TourContextValue {
  isActive: boolean
  currentStep: number
  totalSteps: number
  step: typeof TOUR_STEPS[number] | null
  next: () => void
  back: () => void
  skip: () => void
  start: () => void
}

const TourContext = createContext<TourContextValue | null>(null)

export function useTour() {
  const ctx = useContext(TourContext)
  if (!ctx) throw new Error('useTour must be used within TourProvider')
  return ctx
}

interface TourProviderProps {
  children: React.ReactNode
  onNavigate: (view: ViewMode) => void
}

export function TourProvider({ children, onNavigate }: TourProviderProps) {
  const [isActive, setIsActive] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const hasAutoStarted = useRef(false)

  // Auto-start on first visit
  useEffect(() => {
    if (hasAutoStarted.current) return
    hasAutoStarted.current = true
    try {
      if (localStorage.getItem(ONBOARDING_COMPLETE_KEY) !== 'true') {
        // Small delay so the app renders first
        const timer = setTimeout(() => setIsActive(true), 500)
        return () => clearTimeout(timer)
      }
    } catch { /* ignore */ }
  }, [])

  // Navigate to the correct view when step changes
  useEffect(() => {
    if (!isActive) return
    const step = TOUR_STEPS[currentStep]
    if (step?.view) {
      onNavigate(step.view)
    }
  }, [isActive, currentStep, onNavigate])

  const markComplete = useCallback(() => {
    try { localStorage.setItem(ONBOARDING_COMPLETE_KEY, 'true') } catch { /* ignore */ }
  }, [])

  const next = useCallback(() => {
    if (currentStep < TOUR_STEPS.length - 1) {
      setCurrentStep((s) => s + 1)
    } else {
      setIsActive(false)
      markComplete()
    }
  }, [currentStep, markComplete])

  const back = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep((s) => s - 1)
    }
  }, [currentStep])

  const skip = useCallback(() => {
    setIsActive(false)
    markComplete()
  }, [markComplete])

  const start = useCallback(() => {
    setCurrentStep(0)
    setIsActive(true)
  }, [])

  const step = isActive ? TOUR_STEPS[currentStep] : null

  return (
    <TourContext.Provider
      value={{
        isActive,
        currentStep,
        totalSteps: TOUR_STEPS.length,
        step,
        next,
        back,
        skip,
        start,
      }}
    >
      {children}
    </TourContext.Provider>
  )
}
```

**Step 2: Verify build**

Run: `npm run build`
Expected: PASS

**Step 3: Commit**

```bash
git add src/components/onboarding/TourProvider.tsx
git commit -m "feat(onboarding): add tour context provider with navigation"
```

---

### Task 3: Tour Overlay Component

**Files:**
- Create: `src/components/onboarding/TourOverlay.tsx`

**Step 1: Create spotlight overlay using box-shadow technique**

The overlay dims the page except for a spotlight cutout around the target element. Uses a massive box-shadow on a positioned element to create the dimming effect, which allows the cutout to be shaped around the target.

```tsx
import { useState, useEffect, useCallback } from 'react'
import { useTour } from './TourProvider'

function getTargetRect(target: string | null): DOMRect | null {
  if (!target) return null
  const el = document.querySelector(`[data-tour="${target}"]`)
  return el ? el.getBoundingClientRect() : null
}

export function TourOverlay() {
  const { isActive, step, skip } = useTour()
  const [rect, setRect] = useState<DOMRect | null>(null)

  const updateRect = useCallback(() => {
    if (!step) { setRect(null); return }
    setRect(getTargetRect(step.target))
  }, [step])

  useEffect(() => {
    updateRect()
    // Small delay to allow view transitions to render targets
    const timer = setTimeout(updateRect, 100)
    window.addEventListener('resize', updateRect)
    window.addEventListener('scroll', updateRect, true)
    return () => {
      clearTimeout(timer)
      window.removeEventListener('resize', updateRect)
      window.removeEventListener('scroll', updateRect, true)
    }
  }, [updateRect])

  if (!isActive) return null

  const padding = 8 // breathing room around the target

  return (
    <div
      className="fixed inset-0 z-tour-overlay"
      onClick={skip}
      aria-hidden="true"
    >
      {rect ? (
        // Spotlight cutout: a positioned div with a huge box-shadow
        <div
          className="absolute rounded"
          style={{
            top: rect.top - padding,
            left: rect.left - padding,
            width: rect.width + padding * 2,
            height: rect.height + padding * 2,
            boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.6)',
            pointerEvents: 'none',
          }}
        />
      ) : (
        // No target: full dim overlay
        <div className="absolute inset-0 bg-black/60" />
      )}
    </div>
  )
}
```

**Step 2: Add z-index values to Tailwind config**

In `tailwind.config.js`, add the tour z-index values under `theme.extend.zIndex`:

```js
'tour-overlay': '9000',
'tour-tooltip': '9001',
```

These must be above the existing `z-modal` value to ensure the tour displays above all other UI.

**Step 3: Verify build**

Run: `npm run build`
Expected: PASS

**Step 4: Commit**

```bash
git add src/components/onboarding/TourOverlay.tsx tailwind.config.js
git commit -m "feat(onboarding): add spotlight overlay component"
```

---

### Task 4: Tour Tooltip Component

**Files:**
- Create: `src/components/onboarding/TourTooltip.tsx`

**Step 1: Create the positioned tooltip with content, arrow, and navigation**

This is the main UI the user interacts with. It positions itself relative to the target element (or centers if no target), shows step content with progressive detail, and provides Back/Next/Skip navigation.

```tsx
import { useState, useEffect, useCallback, useRef } from 'react'
import { ChevronDown } from 'lucide-react'
import { useTour } from './TourProvider'
import { useFocusTrap } from '@/hooks/useFocusTrap'
import type { TooltipPlacement } from './tour-steps'

const TOOLTIP_GAP = 16     // gap between target and tooltip
const TOOLTIP_WIDTH = 360   // max tooltip width in px
const VIEWPORT_PADDING = 16 // min distance from viewport edge

interface Position {
  top: number
  left: number
  actualPlacement: TooltipPlacement
}

function calculatePosition(
  target: string | null,
  preferredPlacement: TooltipPlacement,
  tooltipHeight: number,
): Position {
  if (!target || preferredPlacement === 'center') {
    return {
      top: window.innerHeight / 2 - tooltipHeight / 2,
      left: window.innerWidth / 2 - TOOLTIP_WIDTH / 2,
      actualPlacement: 'center',
    }
  }

  const el = document.querySelector(`[data-tour="${target}"]`)
  if (!el) {
    return {
      top: window.innerHeight / 2 - tooltipHeight / 2,
      left: window.innerWidth / 2 - TOOLTIP_WIDTH / 2,
      actualPlacement: 'center',
    }
  }

  const rect = el.getBoundingClientRect()
  const centerX = rect.left + rect.width / 2 - TOOLTIP_WIDTH / 2
  const centerY = rect.top + rect.height / 2 - tooltipHeight / 2

  // Clamp horizontal position
  const clampX = (x: number) =>
    Math.max(VIEWPORT_PADDING, Math.min(x, window.innerWidth - TOOLTIP_WIDTH - VIEWPORT_PADDING))

  switch (preferredPlacement) {
    case 'bottom': {
      const top = rect.bottom + TOOLTIP_GAP
      if (top + tooltipHeight < window.innerHeight - VIEWPORT_PADDING) {
        return { top, left: clampX(centerX), actualPlacement: 'bottom' }
      }
      // Fall back to top
      return { top: rect.top - TOOLTIP_GAP - tooltipHeight, left: clampX(centerX), actualPlacement: 'top' }
    }
    case 'top': {
      const top = rect.top - TOOLTIP_GAP - tooltipHeight
      if (top > VIEWPORT_PADDING) {
        return { top, left: clampX(centerX), actualPlacement: 'top' }
      }
      return { top: rect.bottom + TOOLTIP_GAP, left: clampX(centerX), actualPlacement: 'bottom' }
    }
    case 'right': {
      const left = rect.right + TOOLTIP_GAP
      if (left + TOOLTIP_WIDTH < window.innerWidth - VIEWPORT_PADDING) {
        return { top: Math.max(VIEWPORT_PADDING, centerY), left, actualPlacement: 'right' }
      }
      return { top: Math.max(VIEWPORT_PADDING, centerY), left: rect.left - TOOLTIP_GAP - TOOLTIP_WIDTH, actualPlacement: 'left' }
    }
    case 'left': {
      const left = rect.left - TOOLTIP_GAP - TOOLTIP_WIDTH
      if (left > VIEWPORT_PADDING) {
        return { top: Math.max(VIEWPORT_PADDING, centerY), left, actualPlacement: 'left' }
      }
      return { top: Math.max(VIEWPORT_PADDING, centerY), left: rect.right + TOOLTIP_GAP, actualPlacement: 'right' }
    }
    default:
      return { top: window.innerHeight / 2 - tooltipHeight / 2, left: clampX(centerX), actualPlacement: 'center' }
  }
}

interface TourTooltipProps {
  onLoadSample: () => void
}

export function TourTooltip({ onLoadSample }: TourTooltipProps) {
  const { isActive, step, currentStep, totalSteps, next, back, skip } = useTour()
  const [expanded, setExpanded] = useState(false)
  const [position, setPosition] = useState<Position>({ top: 0, left: 0, actualPlacement: 'center' })
  const tooltipRef = useRef<HTMLDivElement>(null)
  const trap = useFocusTrap(isActive, skip)

  // Reset expanded state when step changes
  useEffect(() => {
    setExpanded(false)
  }, [currentStep])

  // Calculate position
  const updatePosition = useCallback(() => {
    if (!step || !tooltipRef.current) return
    const height = tooltipRef.current.offsetHeight
    setPosition(calculatePosition(step.target, step.placement, height))
  }, [step])

  useEffect(() => {
    if (!isActive) return
    // Wait for DOM to update before measuring
    requestAnimationFrame(() => {
      updatePosition()
      // Second update after a short delay for view transitions
      setTimeout(updatePosition, 150)
    })
    window.addEventListener('resize', updatePosition)
    return () => window.removeEventListener('resize', updatePosition)
  }, [isActive, currentStep, expanded, updatePosition])

  if (!isActive || !step) return null

  const handleFinalAction = (action: 'sample' | 'scratch') => {
    if (action === 'sample') {
      onLoadSample()
    }
    skip() // closes the tour (skip also marks complete)
  }

  return (
    <>
      {/* Live region for screen readers */}
      <div className="sr-only" aria-live="polite">
        Step {currentStep + 1} of {totalSteps}: {step.title}
      </div>

      <div
        ref={(el) => {
          // Share ref between tooltip positioning and focus trap
          (tooltipRef as React.MutableRefObject<HTMLDivElement | null>).current = el
          ;(trap.dialogRef as React.MutableRefObject<HTMLDivElement | null>).current = el
        }}
        role="dialog"
        aria-modal="true"
        aria-label={`Tour step ${currentStep + 1} of ${totalSteps}: ${step.title}`}
        aria-describedby="tour-step-description"
        onKeyDown={trap.handleKeyDown}
        className="fixed z-tour-tooltip bg-surface-elevated border border-border rounded-lg shadow-lg"
        style={{
          top: position.top,
          left: position.left,
          width: TOOLTIP_WIDTH,
          maxHeight: 'calc(100vh - 32px)',
          overflowY: 'auto',
        }}
      >
        <div className="p-5">
          {/* Step counter */}
          <div className="flex items-center justify-between mb-3">
            <span className="font-mono text-[11px] text-text-tertiary uppercase tracking-wider">
              Step {currentStep + 1} of {totalSteps}
            </span>
            <button
              onClick={skip}
              className="font-mono text-[11px] text-text-secondary hover:text-white underline transition-colors"
            >
              Skip tour
            </button>
          </div>

          {/* Title */}
          <h3 className="font-mono text-[11px] font-semibold text-primary uppercase tracking-wider mb-2">
            {step.title}
          </h3>

          {/* Description */}
          <p id="tour-step-description" className="text-sm text-white leading-relaxed">
            {step.description}
          </p>

          {/* Expandable detail */}
          {step.expandedDetail && (
            <div className="mt-3">
              {!expanded ? (
                <button
                  onClick={() => setExpanded(true)}
                  className="flex items-center gap-1 font-mono text-xs text-text-secondary hover:text-white underline transition-colors"
                >
                  Learn more
                  <ChevronDown className="w-3 h-3" />
                </button>
              ) : (
                <div className="mt-2 pt-3 border-t border-border">
                  <p className="text-xs text-text-secondary leading-relaxed whitespace-pre-line">
                    {step.expandedDetail}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Navigation */}
          <div className="mt-5 flex items-center justify-between">
            <div>
              {currentStep > 0 && (
                <button
                  onClick={back}
                  className="px-4 py-2 bg-surface-elevated border border-border hover:border-primary text-white font-mono text-xs transition-colors"
                >
                  Back
                </button>
              )}
            </div>
            <div className="flex gap-2">
              {step.isFinal ? (
                <>
                  <button
                    onClick={() => handleFinalAction('sample')}
                    className="px-4 py-2 bg-primary hover:bg-primary/90 text-white font-mono text-xs transition-colors"
                  >
                    Load Sample Data
                  </button>
                  <button
                    onClick={() => handleFinalAction('scratch')}
                    className="px-4 py-2 bg-surface-elevated border border-border hover:border-primary text-white font-mono text-xs transition-colors"
                  >
                    Start from Scratch
                  </button>
                </>
              ) : (
                <button
                  onClick={next}
                  className="px-4 py-2 bg-primary hover:bg-primary/90 text-white font-mono text-xs transition-colors"
                >
                  Next
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Arrow (CSS triangle) */}
        {position.actualPlacement !== 'center' && step.target && (
          <TourArrow placement={position.actualPlacement} target={step.target} tooltipLeft={position.left} />
        )}
      </div>
    </>
  )
}

function TourArrow({ placement, target, tooltipLeft }: { placement: TooltipPlacement; target: string; tooltipLeft: number }) {
  const el = document.querySelector(`[data-tour="${target}"]`)
  if (!el) return null

  const rect = el.getBoundingClientRect()
  const arrowSize = 8

  // Calculate arrow position relative to the target center
  const targetCenterX = rect.left + rect.width / 2
  const arrowLeftInTooltip = targetCenterX - tooltipLeft - arrowSize

  const clampedLeft = Math.max(16, Math.min(arrowLeftInTooltip, TOOLTIP_WIDTH - 32))

  switch (placement) {
    case 'bottom':
      return (
        <div
          className="absolute -top-2"
          style={{ left: clampedLeft }}
        >
          <div className="w-0 h-0 border-l-8 border-r-8 border-b-8 border-l-transparent border-r-transparent border-b-border" />
          <div className="w-0 h-0 border-l-[7px] border-r-[7px] border-b-[7px] border-l-transparent border-r-transparent border-b-surface-elevated -mt-[6px] ml-[1px]" />
        </div>
      )
    case 'top':
      return (
        <div
          className="absolute -bottom-2"
          style={{ left: clampedLeft }}
        >
          <div className="w-0 h-0 border-l-8 border-r-8 border-t-8 border-l-transparent border-r-transparent border-t-border" />
          <div className="w-0 h-0 border-l-[7px] border-r-[7px] border-t-[7px] border-l-transparent border-r-transparent border-t-surface-elevated -mt-[9px] ml-[1px]" />
        </div>
      )
    case 'left':
      return (
        <div className="absolute top-1/2 -translate-y-1/2 -right-2">
          <div className="w-0 h-0 border-t-8 border-b-8 border-l-8 border-t-transparent border-b-transparent border-l-border" />
          <div className="w-0 h-0 border-t-[7px] border-b-[7px] border-l-[7px] border-t-transparent border-b-transparent border-l-surface-elevated -mt-[7px] -ml-[1px]" />
        </div>
      )
    case 'right':
      return (
        <div className="absolute top-1/2 -translate-y-1/2 -left-2">
          <div className="w-0 h-0 border-t-8 border-b-8 border-r-8 border-t-transparent border-b-transparent border-r-border" />
          <div className="w-0 h-0 border-t-[7px] border-b-[7px] border-r-[7px] border-t-transparent border-b-transparent border-r-surface-elevated -mt-[7px] ml-[1px]" />
        </div>
      )
    default:
      return null
  }
}
```

**Step 2: Verify build**

Run: `npm run build`
Expected: PASS

**Step 3: Commit**

```bash
git add src/components/onboarding/TourTooltip.tsx
git commit -m "feat(onboarding): add positioned tooltip component"
```

---

### Task 5: Add data-tour Attributes to Existing Views

This task adds invisible `data-tour` attributes to elements across all views so the tour engine can find them. No visual or behavioral changes.

**Files:**
- Modify: `src/pages/DashboardView.tsx`
- Modify: `src/pages/EditorView.tsx`
- Modify: `src/pages/BrowserView.tsx`
- Modify: `src/pages/CompilerView.tsx`
- Modify: `src/pages/SyncView.tsx`

**Step 1: DashboardView.tsx**

Add `data-tour` attributes to:
- The action buttons group (line 154): add `data-tour="dashboard-actions"` to the `<div className="flex gap-3" role="group">` element
- The grid (line 195): add `data-tour="dashboard-grid"` to the `<div className="grid grid-cols-1">` element
- The "SAMPLE DATA" button (line 163): add `data-tour="dashboard-sample"` to the sample data `<button>`

In the empty state (sets.length === 0), add:
- `data-tour="dashboard-actions"` to the `<div className="flex gap-4">` on line 130
- `data-tour="dashboard-sample"` to the "Load Sample Data" button on line 139

**Step 2: EditorView.tsx**

Add `data-tour` attributes to:
- The `<div className="mt-6">` wrapping TokenTree (line 85): add `data-tour="editor-tree"`
- Need to also expose a token value target. Add `data-tour="editor-token-value"` to the first token value node. This requires modifying TokenTree or TokenValueNode to add the attribute to the first rendered value.

For the version button, modify `src/components/editor/EditorHeader.tsx`:
- The Versions button (line 83-92): add `data-tour="editor-versions-btn"` to the `<button onClick={onOpenVersions}>`

**Step 3: BrowserView.tsx**

Add `data-tour="browser-content"` to the main content container that holds the color grid / spacing / typography / shadow sections.

**Step 4: CompilerView.tsx**

Add `data-tour="compiler-formats"` to the format tabs container (line 243): the `<div className="flex border-b border-border bg-surface overflow-x-auto" role="tablist">` element.

**Step 5: SyncView.tsx**

Add `data-tour="sync-dropzone"` to the SyncDropZone component or its wrapper. The drop zone is rendered when `!diffResult` -- add the attribute to the wrapper around `<SyncDropZone>`.

**Step 6: TokenValueNode.tsx (for editor-token-value target)**

Read this file and add `data-tour="editor-token-value"` to the first token value rendered in the tree. The simplest approach: accept an optional `dataTour` prop and pass it through.

Alternatively, add the attribute in EditorView to the first item in the token tree wrapper -- but since tokens render deeply, the cleanest approach is to add `data-tour="editor-token-value"` to the entire `<TokenTree>` wrapper's first visible child. The simplest path: add the `data-tour` directly to the `<div className="mt-6">` wrapper itself and change the step target to `editor-tree` (already covered above). Then for the "editing a token" step, we can use the same target with different placement. Update `tour-steps.ts` to point both step 6 and 7 at `editor-tree` with different placements (`right` and `left`).

**Step 7: Verify build**

Run: `npm run build`
Expected: PASS

**Step 8: Commit**

```bash
git add src/pages/DashboardView.tsx src/pages/EditorView.tsx src/pages/BrowserView.tsx src/pages/CompilerView.tsx src/pages/SyncView.tsx src/components/editor/EditorHeader.tsx
git commit -m "feat(onboarding): add data-tour attributes to all views"
```

---

### Task 6: Header Help Button

**Files:**
- Modify: `src/components/Header.tsx`

**Step 1: Add HelpCircle import and onStartTour prop**

Add to imports: `import { Sun, Moon, HelpCircle } from 'lucide-react'`

Add to `HeaderProps`:
```ts
onStartTour?: () => void
```

**Step 2: Add help button between sync status and theme toggle**

Insert a new compartment before the theme toggle `<div>`:

```tsx
{/* Help Button */}
<div className="px-4 flex items-center border-l border-border h-full">
  <button
    onClick={onStartTour}
    className="p-2 text-text-secondary hover:text-white transition-colors"
    aria-label="Start guided tour"
  >
    <HelpCircle className="w-4 h-4" />
  </button>
</div>
```

Remove the `border-l` from the theme toggle div since the help button now provides the left border. The theme toggle div becomes:

```tsx
<div className="px-4 flex items-center border-l border-border h-full">
```

(Actually, keep both with `border-l` -- both compartments get left borders per the design language.)

**Step 3: Verify build**

Run: `npm run build`
Expected: PASS

**Step 4: Commit**

```bash
git add src/components/Header.tsx
git commit -m "feat(onboarding): add help button to header"
```

---

### Task 7: Remove Welcome Banner from DashboardView

**Files:**
- Modify: `src/pages/DashboardView.tsx`

**Step 1: Remove welcome banner state and JSX**

Remove:
- The `WELCOME_DISMISSED_KEY` constant (line 10)
- The `showWelcome` state (lines 23-25)
- The `handleDismissWelcome` callback (lines 83-86)
- The entire welcome banner JSX block (lines 174-193)
- The `X` import from lucide-react if it's no longer used elsewhere in this file

Check: `X` is also used in the Clear All confirmation modal? No -- looking at the imports, `X` is imported but only used in the welcome banner dismiss button. The confirmation modals use text buttons, not X icons. So remove `X` from the import.

**Step 2: Verify build**

Run: `npm run build`
Expected: PASS

**Step 3: Commit**

```bash
git add src/pages/DashboardView.tsx
git commit -m "refactor(dashboard): remove welcome banner, replaced by onboarding tour"
```

---

### Task 8: App.tsx Integration

**Files:**
- Modify: `src/App.tsx`

**Step 1: Import and wrap with TourProvider, add overlay and tooltip**

Add imports:
```tsx
import { TourProvider, useTour } from './components/onboarding/TourProvider'
import { TourOverlay } from './components/onboarding/TourOverlay'
import { TourTooltip } from './components/onboarding/TourTooltip'
import { createSampleDesignSystem } from './lib/sample-data'
```

Note: `createSampleDesignSystem` may already be imported or available. Check if `createSampleTokenSet` vs `createSampleDesignSystem` -- the Dashboard uses `createSampleDesignSystem` from `@/lib/sample-data`, while App.tsx uses `createSampleTokenSet` from `@/data/sampleTokens`. Use `createSampleDesignSystem` for the tour's "Load Sample Data" action for consistency with the Dashboard.

**Step 2: Wrap the app content in TourProvider**

The `TourProvider` needs `onNavigate` which maps to `setActiveView`. Wrap the entire return JSX:

```tsx
return (
  <TourProvider onNavigate={setActiveView}>
    <AppContent />
  </TourProvider>
)
```

Create an inner `AppContent` component (or use the existing App function body) that calls `useTour()` to get the `start` function and passes it to `Header` as `onStartTour`.

Actually, to keep it simpler, structure it as:

```tsx
function App() {
  // ... existing state ...

  const handleLoadSampleForTour = useCallback(() => {
    const { addTokenSet, tokenSets, deleteTokenSet } = useTokenStore.getState()
    // Clear existing if any
    for (const id of Object.keys(tokenSets)) {
      deleteTokenSet(id)
    }
    addTokenSet(createSampleDesignSystem())
  }, [])

  return (
    <TourProvider onNavigate={setActiveView}>
      <AppInner
        storageWarning={storageWarning}
        setStorageWarning={setStorageWarning}
        activeView={activeView}
        setActiveView={setActiveView}
        activeSet={activeSet}
        activeModeName={activeModeName}
        theme={theme}
        toggleTheme={toggleTheme}
        renderView={renderView}
        onLoadSampleForTour={handleLoadSampleForTour}
      />
    </TourProvider>
  )
}
```

This is getting complex. Simpler approach: just have `TourProvider` wrap the return and access `useTour` in a small inner component that renders the overlay and tooltip:

```tsx
function TourUI() {
  const { isActive } = useTour()
  const addTokenSet = useTokenStore((s) => s.addTokenSet)
  const tokenSets = useTokenStore((s) => s.tokenSets)
  const deleteTokenSet = useTokenStore((s) => s.deleteTokenSet)

  const handleLoadSample = useCallback(() => {
    for (const id of Object.keys(tokenSets)) {
      deleteTokenSet(id)
    }
    addTokenSet(createSampleDesignSystem())
  }, [tokenSets, deleteTokenSet, addTokenSet])

  if (!isActive) return null
  return (
    <>
      <TourOverlay />
      <TourTooltip onLoadSample={handleLoadSample} />
    </>
  )
}
```

And in the App return, add `<TourUI />` inside the `TourProvider`.

For the Header, create a small wrapper component:

```tsx
function TourHelpButton() {
  const { start } = useTour()
  return start
}
```

Actually, pass `onStartTour` as a prop to Header. To get the `start` function, we need `useTour()` inside TourProvider. The simplest pattern:

```tsx
function AppShell() {
  // All existing App logic stays here
  const { start: startTour } = useTour()

  return (
    <div className="min-h-screen">
      {/* ... skip link, storage warning ... */}
      <Header
        {/* ... existing props ... */}
        onStartTour={startTour}
      />
      {/* ... rest ... */}
      <TourUI />
    </div>
  )
}

function App() {
  const setActiveView = useTokenStore((state) => state.setActiveView)

  return (
    <TourProvider onNavigate={setActiveView}>
      <AppShell />
    </TourProvider>
  )
}
```

This requires extracting App's current body into `AppShell`. The implementation should follow this pattern. The exact restructuring:

1. Rename the current `App` function body to `AppShell`
2. Create a new `App` that wraps `AppShell` in `TourProvider`
3. Inside `AppShell`, call `useTour()` to get `start` and pass it to Header
4. Add `<TourUI />` at the end of `AppShell`'s return, before the closing `</div>`

**Step 3: Verify build**

Run: `npm run build`
Expected: PASS

**Step 4: Test manually**

Run: `npm run dev`
- Open the app in a fresh browser (or clear `dtc-onboarding-complete` from localStorage)
- The tour should auto-start after ~500ms
- Click Next to advance through all 12 steps
- Verify view navigation works (should switch to Editor, Browser, Compiler, Sync)
- Verify the help button in the header restarts the tour
- Verify Escape closes the tour
- Verify "Skip tour" closes the tour

**Step 5: Commit**

```bash
git add src/App.tsx
git commit -m "feat(onboarding): integrate tour into app shell with auto-start"
```

---

### Task 9: Polish and Edge Cases

**Files:**
- Modify: `src/components/onboarding/TourOverlay.tsx` (if needed)
- Modify: `src/components/onboarding/TourTooltip.tsx` (if needed)
- Modify: `src/components/onboarding/tour-steps.ts` (if step targets need adjustment)

**Step 1: Test all 12 steps and fix positioning issues**

Run `npm run dev` and walk through the entire tour. For each step, verify:
- Tooltip appears near the correct element
- Arrow points at the target
- "Learn more" expands without breaking layout
- Back/Next navigate correctly
- View switches happen at the right steps

Fix any positioning or content issues found.

**Step 2: Test with empty state**

Clear all token sets and localStorage. The tour should handle steps that target elements on pages with no data (like the editor tree when no set is active). Ensure fallback to centered positioning works.

**Step 3: Test keyboard navigation**

Tab through the tooltip. Verify:
- Focus trapping works (Tab cycles within tooltip)
- Escape closes the tour
- Enter activates buttons

**Step 4: Verify build**

Run: `npm run build`
Expected: PASS

**Step 5: Commit any fixes**

```bash
git add -A
git commit -m "fix(onboarding): polish tour positioning and edge cases"
```

---

### Task 10: Final Build Verification

**Step 1: Full build**

Run: `npm run build`
Expected: PASS with zero errors and zero warnings

**Step 2: Lint**

Run: `npm run lint`
Expected: PASS (or only pre-existing warnings)
