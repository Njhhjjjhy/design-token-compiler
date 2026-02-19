import { useEffect, useCallback, useState } from 'react'
import { AlertTriangle, X } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import { Header } from './components/Header'
import { BinarySeparator } from './components/BinarySeparator'
import { DashboardView } from './pages/DashboardView'
import { EditorView } from './pages/EditorView'
import { BrowserView } from './pages/BrowserView'
import { ComponentsView } from './pages/ComponentsView'
import { CompilerView } from './pages/CompilerView'
import { SyncView } from './pages/SyncView'
import { useTokenStore, STORAGE_ERROR_EVENT } from './store/useTokenStore'
import { createSampleTokenSet } from './data/sampleTokens'
import { useTheme } from './hooks/useTheme'
import { TourProvider, useTour } from './components/onboarding/TourProvider'
import { TourOverlay } from './components/onboarding/TourOverlay'
import { TourTooltip } from './components/onboarding/TourTooltip'
import { createSampleDesignSystem } from './lib/sample-data'
import { viewVariants, motionConfig } from './lib/motion'

function TourUI() {
  const { isActive } = useTour()

  const handleLoadSample = useCallback(() => {
    const { tokenSets, deleteTokenSet, addTokenSet } = useTokenStore.getState()
    for (const id of Object.keys(tokenSets)) {
      deleteTokenSet(id)
    }
    addTokenSet(createSampleDesignSystem())
  }, [])

  if (!isActive) return null
  return (
    <>
      <TourOverlay />
      <TourTooltip onLoadSample={handleLoadSample} />
    </>
  )
}

function AppShell() {
  const activeView = useTokenStore((state) => state.activeView)
  const setActiveView = useTokenStore((state) => state.setActiveView)
  const tokenSets = useTokenStore((state) => state.tokenSets)
  const activeSetId = useTokenStore((state) => state.activeSetId)
  const [storageWarning, setStorageWarning] = useState(false)
  const { theme, toggleTheme } = useTheme()
  const { start: startTour } = useTour()

  // Listen for localStorage quota errors
  useEffect(() => {
    const handler = () => setStorageWarning(true)
    window.addEventListener(STORAGE_ERROR_EVENT, handler)
    return () => window.removeEventListener(STORAGE_ERROR_EVENT, handler)
  }, [])

  // Initialize with sample data if no token sets exist (after hydration)
  useEffect(() => {
    function initSampleData() {
      const { tokenSets: sets, addTokenSet } = useTokenStore.getState()
      if (Object.keys(sets).length === 0) {
        addTokenSet(createSampleTokenSet())
      }
    }

    if (useTokenStore.persist.hasHydrated()) {
      initSampleData()
    } else {
      return useTokenStore.persist.onFinishHydration(initSampleData)
    }
  }, [])

  // Global keyboard shortcuts: Ctrl/Cmd+1-5 to switch views
  const viewKeys: Record<string, typeof activeView> = {
    '1': 'dashboard',
    '2': 'editor',
    '3': 'browser',
    '4': 'components',
    '5': 'compiler',
    '6': 'sync',
  }

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // Skip when typing in inputs
    const tag = (e.target as HTMLElement)?.tagName
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return

    if ((e.ctrlKey || e.metaKey) && viewKeys[e.key]) {
      e.preventDefault()
      setActiveView(viewKeys[e.key])
      requestAnimationFrame(() => {
        const main = document.getElementById('main-content')
        if (main) {
          main.tabIndex = -1
          main.focus()
        }
      })
    }
  }, [setActiveView])

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  const renderView = () => {
    switch (activeView) {
      case 'dashboard':
        return <DashboardView />
      case 'editor':
        return <EditorView />
      case 'browser':
        return <BrowserView />
      case 'components':
        return <ComponentsView />
      case 'compiler':
        return <CompilerView />
      case 'sync':
        return <SyncView />
      default:
        return <DashboardView />
    }
  }

  const activeSet = activeSetId ? tokenSets[activeSetId] : null
  const activeModeName = activeSet?.activeMode && activeSet.modes[activeSet.activeMode]
    ? activeSet.modes[activeSet.activeMode].name
    : null

  return (
    <div className="min-h-screen">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-skiplink focus:px-4 focus:py-2 focus:bg-primary focus:text-white focus:font-mono focus:text-sm focus:rounded"
      >
        Skip to main content
      </a>

      <AnimatePresence>
        {storageWarning && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={motionConfig.enter}
            style={{ overflow: 'hidden' }}
          >
            <div className="bg-warning/20 border-b border-warning px-4 py-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-warning flex-shrink-0" />
                <p className="font-mono text-xs text-white">
                  Storage quota exceeded. Some changes may not be saved. Consider exporting your token sets and clearing old data.
                </p>
              </div>
              <button
                onClick={() => setStorageWarning(false)}
                className="p-1 hover:bg-white/10 rounded transition-colors flex-shrink-0"
                aria-label="Dismiss storage warning"
              >
                <X className="w-4 h-4 text-warning" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <Header
        activeView={activeView}
        onViewChange={setActiveView}
        activeSetName={activeSet?.name}
        activeModeName={activeModeName}
        theme={theme}
        onToggleTheme={toggleTheme}
        onStartTour={startTour}
      />

      <BinarySeparator />

      <main id="main-content" className="min-h-[calc(100vh-10rem)]">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeView}
            variants={viewVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={motionConfig.enter}
          >
            {renderView()}
          </motion.div>
        </AnimatePresence>
      </main>

      <BinarySeparator />

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

export default App
