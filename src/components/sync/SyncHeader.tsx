import { X, Download, ArrowRightLeft } from 'lucide-react'
import type { DiffResult } from '@/lib/diff-engine'

interface SyncHeaderProps {
  fileName: string
  format: string
  diffResult: DiffResult
  filter: 'all' | 'differences'
  onFilterChange: (filter: 'all' | 'differences') => void
  onClear: () => void
  onApply: () => void
  onExport: () => void
  onResolveAll: (choice: 'editor' | 'imported') => void
  resolvedCount: number
  totalConflicts: number
}

export function SyncHeader({
  fileName,
  format,
  diffResult,
  filter,
  onFilterChange,
  onClear,
  onApply,
  onExport,
  onResolveAll,
  resolvedCount,
  totalConflicts,
}: SyncHeaderProps) {
  const allResolved = totalConflicts === 0 || resolvedCount >= totalConflicts
  const { stats } = diffResult

  return (
    <div className="p-6 border-b border-border">
      {/* Top row: title, file info, actions */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4">
          <h2 className="section-title text-primary">COMPARE & MERGE</h2>
          <div className="flex items-center gap-2 px-3 py-1 bg-surface-elevated border border-border font-mono text-xs">
            <span className="text-text-secondary">{format.toUpperCase()}</span>
            <span className="text-white">{fileName}</span>
            <button
              onClick={onClear}
              className="ml-1 text-text-tertiary hover:text-white transition-colors"
              title="Clear import"
              aria-label="Clear import"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onApply}
            disabled={!allResolved}
            aria-label={allResolved ? 'Apply to editor' : 'Apply to editor (resolve all conflicts first)'}
            className={`
              flex items-center gap-2 px-4 py-2 font-mono text-xs transition-colors
              ${allResolved
                ? 'bg-primary hover:bg-primary/90 text-white'
                : 'bg-surface-elevated border border-border text-text-tertiary cursor-not-allowed'
              }
            `}
          >
            <ArrowRightLeft className="w-4 h-4" />
            APPLY TO EDITOR
          </button>
          <button
            onClick={onExport}
            disabled={!allResolved}
            aria-label={allResolved ? 'Export merged' : 'Export merged (resolve all conflicts first)'}
            className={`
              flex items-center gap-2 px-4 py-2 font-mono text-xs transition-colors
              ${allResolved
                ? 'bg-surface-elevated border border-border hover:border-primary text-white'
                : 'bg-surface-elevated border border-border text-text-tertiary cursor-not-allowed'
              }
            `}
          >
            <Download className="w-4 h-4" />
            EXPORT MERGED
          </button>
        </div>
      </div>

      {/* Stats row */}
      <div className="flex items-center gap-6">
        <div className="flex gap-4 font-mono text-xs">
          <span>
            <span className="text-success">{stats.same}</span>
            <span className="text-text-secondary"> same</span>
          </span>
          <span>
            <span className="text-warning">{stats.different}</span>
            <span className="text-text-secondary"> different</span>
          </span>
          <span>
            <span className="text-info">{stats.editorOnly}</span>
            <span className="text-text-secondary"> editor only</span>
          </span>
          <span>
            <span className="text-primary">{stats.fileOnly}</span>
            <span className="text-text-secondary"> file only</span>
          </span>
        </div>

        <div className="ml-auto flex items-center gap-2">
          {/* Filter toggle */}
          <div className="flex border border-border" role="radiogroup" aria-label="Filter diff view">
            <button
              onClick={() => onFilterChange('all')}
              role="radio"
              aria-checked={filter === 'all'}
              className={`px-3 py-1 font-mono text-xs transition-colors ${
                filter === 'all' ? 'bg-surface-elevated text-white' : 'text-text-secondary hover:text-white'
              }`}
            >
              ALL
            </button>
            <button
              onClick={() => onFilterChange('differences')}
              role="radio"
              aria-checked={filter === 'differences'}
              className={`px-3 py-1 font-mono text-xs border-l border-border transition-colors ${
                filter === 'differences' ? 'bg-surface-elevated text-white' : 'text-text-secondary hover:text-white'
              }`}
            >
              DIFFERENCES
            </button>
          </div>

          {/* Batch resolution */}
          {totalConflicts > 0 && !allResolved && (
            <div className="flex gap-1 ml-2" role="group" aria-label="Batch conflict resolution">
              <button
                onClick={() => onResolveAll('editor')}
                className="px-2 py-0.5 font-mono text-mini text-text-tertiary hover:text-white hover:bg-white/5 rounded transition-colors"
              >
                Keep all editor
              </button>
              <button
                onClick={() => onResolveAll('imported')}
                className="px-2 py-0.5 font-mono text-mini text-text-tertiary hover:text-white hover:bg-white/5 rounded transition-colors"
              >
                Keep all imported
              </button>
            </div>
          )}

          {/* Resolution progress */}
          {totalConflicts > 0 && (
            <span className="font-mono text-xs text-text-secondary ml-4" role="status" aria-live="polite" aria-label={`${resolvedCount} of ${totalConflicts} conflicts resolved`}>
              <span className={allResolved ? 'text-success' : 'text-warning'}>{resolvedCount}</span>
              <span> / {totalConflicts} resolved</span>
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
