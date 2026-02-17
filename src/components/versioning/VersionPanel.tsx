import { useState } from 'react'
import { X, Save } from 'lucide-react'
import { useTokenStore } from '@/store/useTokenStore'
import { VersionEntry } from './VersionEntry'

interface VersionPanelProps {
  isOpen: boolean
  onClose: () => void
}

export function VersionPanel({ isOpen, onClose }: VersionPanelProps) {
  const [versionName, setVersionName] = useState('')
  const activeSetId = useTokenStore((s) => s.activeSetId)
  const versions = useTokenStore((s) => s.getVersionsForActiveSet())
  const saveVersion = useTokenStore((s) => s.saveVersion)
  const restoreVersion = useTokenStore((s) => s.restoreVersion)
  const deleteVersion = useTokenStore((s) => s.deleteVersion)

  if (!isOpen) return null

  const handleSave = () => {
    saveVersion(versionName.trim() || undefined)
    setVersionName('')
  }

  const handleRestore = (versionId: string) => {
    if (!activeSetId) return
    if (!confirm('This will replace your current tokens. A backup will be saved automatically.')) return
    restoreVersion(activeSetId, versionId)
  }

  const handleDelete = (versionId: string) => {
    if (!activeSetId) return
    if (!confirm('Delete this version? This cannot be undone.')) return
    deleteVersion(activeSetId, versionId)
  }

  const sortedVersions = [...versions].reverse()

  return (
    <div className="fixed inset-y-0 right-0 w-80 bg-surface border-l border-border z-50 flex flex-col shadow-2xl">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <h3 className="section-title text-primary">VERSIONS</h3>
        <button onClick={onClose} className="p-1 text-text-tertiary hover:text-white transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="px-4 py-3 border-b border-border">
        <div className="flex gap-2">
          <input
            type="text"
            value={versionName}
            onChange={(e) => setVersionName(e.target.value)}
            placeholder="Version name (optional)"
            className="flex-1 px-3 py-1.5 bg-surface-elevated border border-border font-mono text-xs text-white placeholder:text-text-tertiary focus:border-primary focus:outline-none"
            onKeyDown={(e) => e.key === 'Enter' && handleSave()}
          />
          <button onClick={handleSave} className="flex items-center gap-1.5 px-3 py-1.5 bg-primary hover:bg-primary/90 text-white font-mono text-xs transition-colors">
            <Save className="w-3.5 h-3.5" />
            SAVE
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        {sortedVersions.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <p className="font-mono text-xs text-text-secondary">No versions saved yet.</p>
          </div>
        ) : (
          sortedVersions.map((version) => (
            <VersionEntry
              key={version.id}
              version={version}
              onRestore={() => handleRestore(version.id)}
              onDelete={() => handleDelete(version.id)}
            />
          ))
        )}
      </div>

      {sortedVersions.length > 0 && (
        <div className="px-4 py-2 border-t border-border">
          <p className="font-mono text-xs text-text-tertiary">
            {sortedVersions.length} version{sortedVersions.length !== 1 ? 's' : ''} · max 50
          </p>
        </div>
      )}
    </div>
  )
}
