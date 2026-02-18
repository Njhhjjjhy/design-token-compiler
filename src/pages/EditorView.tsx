import { useState, useCallback } from 'react'
import { useTokenStore } from '@/store/useTokenStore'
import { EditorHeader } from '@/components/editor/EditorHeader'
import { TokenTree } from '@/components/editor/TokenTree'
import { AddTokenDialog } from '@/components/editor/AddTokenDialog'
import { VersionPanel } from '@/components/versioning/VersionPanel'
import { ModePanel } from '@/components/modes/ModePanel'

export function EditorView() {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isVersionPanelOpen, setIsVersionPanelOpen] = useState(false)
  const [isModePanelOpen, setIsModePanelOpen] = useState(false)
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

  if (!activeSet) {
    return (
      <div className="p-8">
        <h2 className="section-title text-primary mb-6">TOKEN EDITOR</h2>
        <p className="font-mono text-sm text-text-secondary">
          No token set loaded. Create or import a token set to begin editing.
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
        versionCount={versionCount}
        modeCount={Object.keys(activeSet.modes).length}
        modes={activeSet.modes}
        activeMode={activeMode}
        onModeChange={handleModeChange}
      />
      <div className="mt-6">
        <TokenTree tokenSet={activeSet} activeMode={activeMode} />
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
