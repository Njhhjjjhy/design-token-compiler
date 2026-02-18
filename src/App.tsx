import { useEffect, useState } from 'react'
import { AlertTriangle, X } from 'lucide-react'
import { Header } from './components/Header'
import { BinarySeparator } from './components/BinarySeparator'
import { DashboardView } from './pages/DashboardView'
import { EditorView } from './pages/EditorView'
import { BrowserView } from './pages/BrowserView'
import { CompilerView } from './pages/CompilerView'
import { SyncView } from './pages/SyncView'
import { useTokenStore, STORAGE_ERROR_EVENT } from './store/useTokenStore'
import { createSampleTokenSet } from './data/sampleTokens'

function App() {
  const activeView = useTokenStore((state) => state.activeView)
  const setActiveView = useTokenStore((state) => state.setActiveView)
  const tokenSets = useTokenStore((state) => state.tokenSets)
  const activeSetId = useTokenStore((state) => state.activeSetId)
  const [storageWarning, setStorageWarning] = useState(false)

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

  const renderView = () => {
    switch (activeView) {
      case 'dashboard':
        return <DashboardView />
      case 'editor':
        return <EditorView />
      case 'browser':
        return <BrowserView />
      case 'compiler':
        return <CompilerView />
      case 'sync':
        return <SyncView />
      default:
        return <DashboardView />
    }
  }

  const activeSet = activeSetId ? tokenSets[activeSetId] : null

  return (
    <div className="min-h-screen">
      {storageWarning && (
        <div className="bg-yellow-900/80 border-b border-yellow-700 px-4 py-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-yellow-400 flex-shrink-0" />
            <p className="font-mono text-xs text-yellow-200">
              Storage quota exceeded. Some changes may not be saved. Consider exporting your token sets and clearing old data.
            </p>
          </div>
          <button
            onClick={() => setStorageWarning(false)}
            className="p-1 hover:bg-white/10 rounded transition-colors flex-shrink-0"
            aria-label="Dismiss storage warning"
          >
            <X className="w-4 h-4 text-yellow-400" />
          </button>
        </div>
      )}

      <Header
        activeView={activeView}
        onViewChange={setActiveView}
        activeSetName={activeSet?.name}
        syncStatus={{ status: 'unsynced' }}
      />

      <BinarySeparator />

      <main className="min-h-[calc(100vh-10rem)]">
        {renderView()}
      </main>

      <BinarySeparator />
    </div>
  )
}

export default App
