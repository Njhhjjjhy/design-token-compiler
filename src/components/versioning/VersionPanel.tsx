import { useState, useRef, useEffect } from 'react'
import { useFocusTrap } from '@/hooks/useFocusTrap'
import { X, Save, Check, AlertTriangle } from 'lucide-react'
import { useTokenStore } from '@/store/useTokenStore'
import { VersionEntry } from './VersionEntry'

interface VersionPanelProps {
  isOpen: boolean
  onClose: () => void
}

export function VersionPanel({ isOpen, onClose }: VersionPanelProps) {
  const [versionName, setVersionName] = useState('')
  const [justSaved, setJustSaved] = useState(false)
  const [confirmAction, setConfirmAction] = useState<{ type: 'restore' | 'delete'; versionId: string } | null>(null)
  const saveTimerRef = useRef<ReturnType<typeof setTimeout>>()
  const confirmTrap = useFocusTrap(!!confirmAction, () => setConfirmAction(null))
  const activeSetId = useTokenStore((s) => s.activeSetId)
  const versions = useTokenStore((s) => s.getVersionsForActiveSet())
  const saveVersion = useTokenStore((s) => s.saveVersion)
  const restoreVersion = useTokenStore((s) => s.restoreVersion)
  const deleteVersion = useTokenStore((s) => s.deleteVersion)

  useEffect(() => {
    return () => clearTimeout(saveTimerRef.current)
  }, [])


  if (!isOpen) return null

  const handleSave = () => {
    saveVersion(versionName.trim() || undefined)
    setVersionName('')
    setJustSaved(true)
    clearTimeout(saveTimerRef.current)
    saveTimerRef.current = setTimeout(() => setJustSaved(false), 1500)
  }

  const handleRestore = (versionId: string) => {
    if (!activeSetId) return
    setConfirmAction({ type: 'restore', versionId })
  }

  const handleDelete = (versionId: string) => {
    if (!activeSetId) return
    setConfirmAction({ type: 'delete', versionId })
  }

  const handleConfirm = () => {
    if (!confirmAction || !activeSetId) return
    if (confirmAction.type === 'restore') {
      restoreVersion(activeSetId, confirmAction.versionId)
    } else {
      deleteVersion(activeSetId, confirmAction.versionId)
    }
    setConfirmAction(null)
  }

  const sortedVersions = [...versions].reverse()

  return (
    <div className="fixed inset-y-0 right-0 w-80 bg-surface border-l border-border z-50 flex flex-col shadow-2xl">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <h3 className="section-title text-primary">VERSIONS</h3>
        <button onClick={onClose} className="p-1 text-text-tertiary hover:text-white transition-colors" aria-label="Close versions panel">
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
            aria-label="Version name"
            className="flex-1 px-3 py-1.5 bg-surface-elevated border border-border font-mono text-xs text-white placeholder:text-text-tertiary focus:border-primary focus:outline-none"
            onKeyDown={(e) => e.key === 'Enter' && handleSave()}
          />
          <button onClick={handleSave} className="flex items-center gap-1.5 px-3 py-1.5 bg-primary hover:bg-primary/90 text-white font-mono text-xs transition-colors" title="Create a snapshot of current token values">
            <Save className="w-3.5 h-3.5" />
            SAVE
          </button>
        </div>
        <span
          className={`flex items-center gap-1 mt-1.5 font-mono text-xs text-success transition-opacity duration-300 ${
            justSaved ? 'opacity-100' : 'opacity-0'
          }`}
          aria-live="polite"
        >
          <Check className="w-3 h-3" />
          Version saved
        </span>
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
            {sortedVersions.length} version{sortedVersions.length !== 1 ? 's' : ''} · oldest auto-removed after 50
          </p>
        </div>
      )}

      {confirmAction && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60]"
          onClick={(e) => { if (e.target === e.currentTarget) setConfirmAction(null) }}
        >
          <div
            ref={confirmTrap.dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="version-confirm-title"
            className="bg-surface border border-border rounded-lg p-6 w-full max-w-sm"
            onKeyDown={confirmTrap.handleKeyDown}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                confirmAction.type === 'delete' ? 'bg-red-500/10' : 'bg-warning/10'
              }`}>
                <AlertTriangle className={`w-5 h-5 ${
                  confirmAction.type === 'delete' ? 'text-red-400' : 'text-warning'
                }`} />
              </div>
              <h3 id="version-confirm-title" className="font-mono text-sm font-semibold text-white">
                {confirmAction.type === 'restore' ? 'Restore Version?' : 'Delete Version?'}
              </h3>
            </div>
            <p className="font-mono text-xs text-text-secondary mb-6 ml-[52px]">
              {confirmAction.type === 'restore'
                ? 'This will replace your current tokens. A backup will be saved automatically.'
                : 'Delete this version? This cannot be undone.'}
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setConfirmAction(null)}
                className="px-4 py-2 font-mono text-xs text-text-secondary hover:bg-white/10 rounded transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                className={`px-4 py-2 text-white font-mono text-xs rounded transition-colors ${
                  confirmAction.type === 'delete'
                    ? 'bg-red-600 hover:bg-red-500'
                    : 'bg-primary hover:bg-primary/90'
                }`}
              >
                {confirmAction.type === 'restore' ? 'Restore' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
