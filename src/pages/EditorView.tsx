import { useState, useCallback } from 'react'
import { useTokenStore } from '@/store/useTokenStore'
import { EditorHeader } from '@/components/editor/EditorHeader'
import { TokenTree } from '@/components/editor/TokenTree'
import { AddTokenDialog } from '@/components/editor/AddTokenDialog'
import { VersionPanel } from '@/components/versioning/VersionPanel'
import { ModePanel } from '@/components/modes/ModePanel'
import type { Token, TokenGroup } from '@/types'

const EXPANDED_STORAGE_KEY = 'dtc-expanded-groups'

function collectGroupPaths(
  tokens: Record<string, Token | TokenGroup>,
  prefix = ''
): string[] {
  const paths: string[] = []
  for (const [key, item] of Object.entries(tokens)) {
    if ('tokens' in item) {
      const path = prefix ? `${prefix}.${key}` : key
      paths.push(path)
      paths.push(...collectGroupPaths(item.tokens, path))
    }
  }
  return paths
}

export function EditorView() {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isVersionPanelOpen, setIsVersionPanelOpen] = useState(false)
  const [isModePanelOpen, setIsModePanelOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [treeKey, setTreeKey] = useState(0)
  const activeSet = useTokenStore((state) => state.getActiveTokenSet())
  const storeSetActiveMode = useTokenStore((s) => s.setActiveMode)
  const versionCount = useTokenStore((s) => s.getVersionsForActiveSet().length)

  const activeMode = activeSet?.activeMode ?? null

  const handleModeChange = useCallback(
    (modeId: string | null) => {
      if (activeSet) storeSetActiveMode(activeSet.id, modeId)
    },
    [activeSet, storeSetActiveMode]
  )

  const handleExpandAll = useCallback(() => {
    if (!activeSet) return
    const allPaths = collectGroupPaths(activeSet.tokens)
    try { localStorage.setItem(EXPANDED_STORAGE_KEY, JSON.stringify(allPaths)) } catch { /* ignore */ }
    setTreeKey((k) => k + 1)
  }, [activeSet])

  const handleCollapseAll = useCallback(() => {
    try { localStorage.setItem(EXPANDED_STORAGE_KEY, JSON.stringify([])) } catch { /* ignore */ }
    setTreeKey((k) => k + 1)
  }, [])

  if (!activeSet) {
    return (
      <div className="p-8">
        <h2 className="section-title text-primary mb-6">TOKEN EDITOR</h2>
        <p className="font-mono text-sm text-text-secondary">
          No token set selected. Go to the Dashboard to create or import one.
        </p>
      </div>
    )
  }

  return (
    <div className="p-8">
      <EditorHeader
        onAddToken={() => setIsAddDialogOpen(true)}
        onOpenVersions={() => setIsVersionPanelOpen(true)}
        onOpenModes={() => setIsModePanelOpen(true)}
        onExpandAll={handleExpandAll}
        onCollapseAll={handleCollapseAll}
        versionCount={versionCount}
        modeCount={Object.keys(activeSet.modes).length}
        modes={activeSet.modes}
        activeMode={activeMode}
        onModeChange={handleModeChange}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />
      <div className="mt-6" data-tour="editor-tree">
        <TokenTree key={treeKey} tokenSet={activeSet} activeMode={activeMode} searchQuery={searchQuery} />
      </div>
      <AddTokenDialog
        isOpen={isAddDialogOpen}
        onClose={() => setIsAddDialogOpen(false)}
      />
      <VersionPanel
        isOpen={isVersionPanelOpen}
        onClose={() => setIsVersionPanelOpen(false)}
      />
      <ModePanel
        isOpen={isModePanelOpen}
        onClose={() => setIsModePanelOpen(false)}
      />
    </div>
  )
}
