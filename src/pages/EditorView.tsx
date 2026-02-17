import { useState } from 'react'
import { useTokenStore } from '@/store/useTokenStore'
import { EditorHeader } from '@/components/editor/EditorHeader'
import { TokenTree } from '@/components/editor/TokenTree'
import { AddTokenDialog } from '@/components/editor/AddTokenDialog'
import { VersionPanel } from '@/components/versioning/VersionPanel'

export function EditorView() {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isVersionPanelOpen, setIsVersionPanelOpen] = useState(false)
  const activeSet = useTokenStore((state) => state.getActiveTokenSet())
  const versionCount = useTokenStore((s) => s.getVersionsForActiveSet().length)

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
        versionCount={versionCount}
      />
      <div className="mt-6">
        <TokenTree tokenSet={activeSet} />
      </div>
      <AddTokenDialog
        isOpen={isAddDialogOpen}
        onClose={() => setIsAddDialogOpen(false)}
      />
      <VersionPanel
        isOpen={isVersionPanelOpen}
        onClose={() => setIsVersionPanelOpen(false)}
      />
    </div>
  )
}
