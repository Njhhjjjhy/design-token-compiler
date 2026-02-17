import { Plus, Clock } from 'lucide-react'

interface EditorHeaderProps {
  onAddToken: () => void
  onOpenVersions: () => void
  versionCount: number
}

export function EditorHeader({ onAddToken, onOpenVersions, versionCount }: EditorHeaderProps) {
  return (
    <div className="flex items-center justify-between pb-6 border-b border-border-default">
      <h2 className="section-title text-primary">TOKEN EDITOR</h2>
      <div className="flex gap-3">
        <button
          onClick={onOpenVersions}
          className="flex items-center gap-2 px-4 py-2 bg-surface-elevated border border-border hover:border-primary text-white font-mono text-sm transition-colors"
        >
          <Clock className="w-4 h-4" />
          Versions
          {versionCount > 0 && (
            <span className="text-text-secondary">({versionCount})</span>
          )}
        </button>
        <button
          onClick={onAddToken}
          className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 text-white font-mono text-sm rounded transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Token
        </button>
      </div>
    </div>
  )
}
