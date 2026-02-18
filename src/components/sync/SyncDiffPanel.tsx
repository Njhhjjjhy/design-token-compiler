import type { DiffResult, DiffRow } from '@/lib/diff-engine'
import { SyncTokenRow } from './SyncTokenRow'

interface SyncDiffPanelProps {
  diffResult: DiffResult
  resolutions: Record<string, 'editor' | 'imported' | 'discard' | 'add'>
  filter: 'all' | 'differences'
  onResolve: (path: string, choice: 'editor' | 'imported' | 'discard' | 'add') => void
  onUnresolve: (path: string) => void
}

export function SyncDiffPanel({
  diffResult,
  resolutions,
  filter,
  onResolve,
  onUnresolve,
}: SyncDiffPanelProps) {
  // Apply filter
  let rows = diffResult.rows
  if (filter === 'differences') {
    rows = rows.filter((r) => r.status !== 'same')
  }

  // Group rows by top-level category
  const groups = new Map<string, DiffRow[]>()
  for (const row of rows) {
    const existing = groups.get(row.group) || []
    existing.push(row)
    groups.set(row.group, existing)
  }

  if (rows.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-12">
        <p className="font-mono text-sm text-text-secondary">
          {filter === 'differences' ? 'No differences found — all tokens match!' : 'No tokens to compare.'}
        </p>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-auto">
      {/* Column headers */}
      <div className="sticky top-0 z-10 flex items-center gap-2 px-4 py-2 bg-surface border-b border-border">
        <span className="font-mono text-xs text-text-tertiary uppercase tracking-wider min-w-[180px]">
          Token
        </span>
        <span className="font-mono text-xs text-text-tertiary uppercase tracking-wider min-w-[80px]">
          Status
        </span>
        <span className="flex-1 font-mono text-xs text-text-tertiary uppercase tracking-wider">
          Editor Value
        </span>
        <span className="w-[72px]" /> {/* Resolution controls spacer */}
        <span className="flex-1 font-mono text-xs text-text-tertiary uppercase tracking-wider">
          File Value
        </span>
      </div>

      {/* Grouped rows */}
      {Array.from(groups.entries()).map(([group, groupRows]) => (
        <div key={group}>
          {/* Group header */}
          <div className="px-4 py-2 bg-secondary/50 border-b border-border">
            <span className="font-mono text-xs text-primary uppercase tracking-wider">
              {group}
            </span>
            <span className="font-mono text-xs text-text-tertiary ml-2">
              ({groupRows.length})
            </span>
          </div>

          {/* Token rows */}
          {groupRows.map((row) => (
            <div key={row.path} className="border-b border-border-subtle">
              <SyncTokenRow
                path={row.path}
                status={row.status}
                editorToken={row.editorToken}
                fileToken={row.fileToken}
                resolution={resolutions[row.path]}
                onResolve={onResolve}
                onUnresolve={onUnresolve}
              />
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}
