import { RotateCcw, Trash2 } from 'lucide-react'
import { format } from 'date-fns'
import type { Version } from '@/types'

interface VersionEntryProps {
  version: Version
  onRestore: () => void
  onDelete: () => void
}

export function VersionEntry({ version, onRestore, onDelete }: VersionEntryProps) {
  return (
    <div className="flex items-center gap-3 px-4 py-3 border-b border-border-subtle hover:bg-white/[0.02] transition-colors">
      <div className="w-2 h-2 rounded-full bg-primary/60 flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="font-mono text-xs text-white truncate">{version.name}</p>
        <p className="font-mono text-xs text-text-tertiary mt-0.5">
          {format(version.timestamp, 'MMM d, yyyy · h:mm a')}
          <span className="ml-2">{version.tokenCount} tokens</span>
        </p>
      </div>
      <div className="flex gap-1 flex-shrink-0">
        <button onClick={onRestore} className="p-1.5 text-text-tertiary hover:text-success hover:bg-success/10 transition-colors rounded" title="Restore this version">
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
        <button onClick={onDelete} className="p-1.5 text-text-tertiary hover:text-error hover:bg-error/10 transition-colors rounded" title="Delete this version">
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  )
}
