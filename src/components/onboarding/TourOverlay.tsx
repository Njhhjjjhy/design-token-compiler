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
