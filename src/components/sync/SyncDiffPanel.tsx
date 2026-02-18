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
      <table className="w-full" aria-label="Token comparison">
        <thead className="sticky top-0 z-sticky">
          <tr className="bg-surface border-b border-border">
            <th scope="col" className="text-left px-4 py-2 font-mono text-xs text-text-tertiary uppercase tracking-wider font-normal min-w-[180px]">
              Token
            </th>
            <th scope="col" className="text-left px-1 py-2 font-mono text-xs text-text-tertiary uppercase tracking-wider font-normal min-w-[80px]">
              Status
            </th>
            <th scope="col" className="text-left px-1 py-2 font-mono text-xs text-text-tertiary uppercase tracking-wider font-normal">
              Editor Value
            </th>
            <th scope="col" className="px-1 py-2 w-[72px]">
              <span className="sr-only">Resolution</span>
            </th>
            <th scope="col" className="text-left px-1 py-2 font-mono text-xs text-text-tertiary uppercase tracking-wider font-normal">
              File Value
            </th>
          </tr>
        </thead>
        <tbody>
          {Array.from(groups.entries()).map(([group, groupRows]) => (
            <>
              <tr key={`group-${group}`}>
                <td colSpan={5} className="px-4 py-2 bg-secondary/50 border-b border-border">
                  <span className="font-mono text-xs text-primary uppercase tracking-wider">
                    {group}
                  </span>
                  <span className="font-mono text-xs text-text-tertiary ml-2">
                    ({groupRows.length})
                  </span>
                </td>
              </tr>
              {groupRows.map((row) => (
                <SyncTokenRow
                  key={row.path}
                  path={row.path}
                  status={row.status}
                  editorToken={row.editorToken}
                  fileToken={row.fileToken}
                  resolution={resolutions[row.path]}
                  onResolve={onResolve}
                  onUnresolve={onUnresolve}
                />
              ))}
            </>
          ))}
        </tbody>
      </table>
    </div>
  )
}
