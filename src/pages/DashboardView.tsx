import { Plus, Upload, Database, Trash2 } from 'lucide-react'
import { nanoid } from 'nanoid'
import { useTokenStore } from '@/store/useTokenStore'
import { TokenSetCard } from '@/components/dashboard/TokenSetCard'
import { createSampleDesignSystem } from '@/lib/sample-data'
import type { TokenSet, ViewMode } from '@/types'
import { useCallback, useRef } from 'react'

export function DashboardView() {
  const tokenSets = useTokenStore((s) => s.tokenSets)
  const versions = useTokenStore((s) => s.versions)
  const addTokenSet = useTokenStore((s) => s.addTokenSet)
  const deleteTokenSet = useTokenStore((s) => s.deleteTokenSet)
  const setActiveSet = useTokenStore((s) => s.setActiveSet)
  const setActiveView = useTokenStore((s) => s.setActiveView)
  const importFile = useTokenStore((s) => s.importFile)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const sets = Object.values(tokenSets)

  const navigateTo = useCallback((setId: string, view: ViewMode) => {
    setActiveSet(setId)
    setActiveView(view)
  }, [setActiveSet, setActiveView])

  const handleNewSet = useCallback(() => {
    const newSet: TokenSet = {
      id: nanoid(),
      name: 'Untitled Token Set',
      tokens: {},
      modes: {},
      activeMode: null,
      metadata: {
        createdAt: Date.now(),
        updatedAt: Date.now(),
        version: '1.0.0',
      },
    }
    addTokenSet(newSet)
    setActiveView('editor')
  }, [addTokenSet, setActiveView])

  const handleLoadSample = useCallback(() => {
    // Clear all existing sets first for a clean start
    for (const id of Object.keys(tokenSets)) {
      deleteTokenSet(id)
    }
    const sampleSet = createSampleDesignSystem()
    addTokenSet(sampleSet)
  }, [tokenSets, deleteTokenSet, addTokenSet])

  const handleClearAll = useCallback(() => {
    for (const id of Object.keys(tokenSets)) {
      deleteTokenSet(id)
    }
  }, [tokenSets, deleteTokenSet])

  const handleImportFile = useCallback(() => {
    fileInputRef.current?.click()
  }, [])

  const handleFileSelected = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (ev) => {
      const content = ev.target?.result as string
      if (!content) return

      const newSet: TokenSet = {
        id: nanoid(),
        name: file.name.replace(/\.[^.]+$/, ''),
        tokens: {},
        modes: {},
        activeMode: null,
        metadata: {
          createdAt: Date.now(),
          updatedAt: Date.now(),
          version: '1.0.0',
        },
      }
      addTokenSet(newSet)
      importFile(file.name, content)
      setActiveView('sync')
    }
    reader.readAsText(file)
    e.target.value = ''
  }, [addTokenSet, importFile, setActiveView])

  if (sets.length === 0) {
    return (
      <div className="p-8">
        <h2 className="section-title text-primary mb-8">DASHBOARD</h2>
        <div className="flex flex-col items-center justify-center py-24">
          <h3 className="font-mono text-lg text-white mb-3">Create Your First Token Set</h3>
          <p className="font-mono text-sm text-text-secondary mb-8 max-w-md text-center">
            A token set is a collection of design tokens — colors, spacing, typography, and more — that define your design system.
          </p>
          <div className="flex gap-4">
            <button onClick={handleNewSet} className="flex items-center gap-2 px-6 py-3 bg-primary hover:bg-primary/90 text-white font-mono text-sm transition-colors">
              <Plus className="w-4 h-4" />
              New Token Set
            </button>
            <button onClick={handleImportFile} className="flex items-center gap-2 px-6 py-3 bg-surface-elevated border border-border hover:border-primary text-white font-mono text-sm transition-colors">
              <Upload className="w-4 h-4" />
              Import File
            </button>
            <button onClick={handleLoadSample} className="flex items-center gap-2 px-6 py-3 bg-surface-elevated border border-border hover:border-primary text-white font-mono text-sm transition-colors">
              <Database className="w-4 h-4" />
              Load Sample Data
            </button>
          </div>
        </div>
        <input ref={fileInputRef} type="file" accept=".json,.css,.scss" onChange={handleFileSelected} className="hidden" />
      </div>
    )
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <h2 className="section-title text-primary">DASHBOARD</h2>
        <div className="flex gap-3">
          <button onClick={handleNewSet} className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 text-white font-mono text-xs transition-colors">
            <Plus className="w-4 h-4" />
            NEW SET
          </button>
          <button onClick={handleImportFile} className="flex items-center gap-2 px-4 py-2 bg-surface-elevated border border-border hover:border-primary text-white font-mono text-xs transition-colors">
            <Upload className="w-4 h-4" />
            IMPORT
          </button>
          <button onClick={handleLoadSample} className="flex items-center gap-2 px-4 py-2 bg-surface-elevated border border-border hover:border-primary text-white font-mono text-xs transition-colors">
            <Database className="w-4 h-4" />
            SAMPLE DATA
          </button>
          <button onClick={handleClearAll} className="flex items-center gap-2 px-4 py-2 bg-surface-elevated border border-border hover:border-red-500 text-text-secondary hover:text-red-400 font-mono text-xs transition-colors">
            <Trash2 className="w-4 h-4" />
            CLEAR ALL
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sets.map((tokenSet) => (
          <TokenSetCard
            key={tokenSet.id}
            tokenSet={tokenSet}
            versionCount={(versions[tokenSet.id] || []).length}
            onEdit={() => navigateTo(tokenSet.id, 'editor')}
            onBrowse={() => navigateTo(tokenSet.id, 'browser')}
            onExport={() => navigateTo(tokenSet.id, 'compiler')}
            onVersions={() => navigateTo(tokenSet.id, 'editor')}
          />
        ))}
      </div>

      <input ref={fileInputRef} type="file" accept=".json,.css,.scss" onChange={handleFileSelected} className="hidden" />
    </div>
  )
}
