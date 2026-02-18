import { useEffect } from 'react'
import { Header } from './components/Header'
import { BinarySeparator } from './components/BinarySeparator'
import { DashboardView } from './pages/DashboardView'
import { EditorView } from './pages/EditorView'
import { BrowserView } from './pages/BrowserView'
import { CompilerView } from './pages/CompilerView'
import { SyncView } from './pages/SyncView'
import { useTokenStore } from './store/useTokenStore'
import { createSampleTokenSet } from './data/sampleTokens'

function App() {
  const activeView = useTokenStore((state) => state.activeView)
  const setActiveView = useTokenStore((state) => state.setActiveView)
  const tokenSets = useTokenStore((state) => state.tokenSets)
  const activeSetId = useTokenStore((state) => state.activeSetId)

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
