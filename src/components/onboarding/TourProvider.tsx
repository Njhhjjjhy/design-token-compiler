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
