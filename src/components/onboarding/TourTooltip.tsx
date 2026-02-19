import { useState, useEffect, useCallback, useRef } from 'react'
import { motion } from 'framer-motion'
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

      <motion.div
        key={currentStep}
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
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.15, ease: [0, 0, 0.2, 1] }}
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
      </motion.div>
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
