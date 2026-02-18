import { AlertTriangle } from 'lucide-react'
import { useTokenStore } from '@/store/useTokenStore'
import { SyncDropZone } from '@/components/sync/SyncDropZone'
import { SyncHeader } from '@/components/sync/SyncHeader'
import { SyncDiffPanel } from '@/components/sync/SyncDiffPanel'
import { saveAs } from 'file-saver'

export function SyncView() {
  const activeSet = useTokenStore((s) => s.getActiveTokenSet())
  const importedFileName = useTokenStore((s) => s.importedFileName)
  const importedFormat = useTokenStore((s) => s.importedFormat)
  const importError = useTokenStore((s) => s.importError)
  const diffResult = useTokenStore((s) => s.diffResult)
  const resolutions = useTokenStore((s) => s.resolutions)
  const syncFilter = useTokenStore((s) => s.syncFilter)
  const importFile = useTokenStore((s) => s.importFile)
  const clearImport = useTokenStore((s) => s.clearImport)
  const resolveToken = useTokenStore((s) => s.resolveToken)
  const unresolveToken = useTokenStore((s) => s.unresolveToken)
  const resolveAllAs = useTokenStore((s) => s.resolveAllAs)
  const setSyncFilter = useTokenStore((s) => s.setSyncFilter)
  const applyToEditor = useTokenStore((s) => s.applyToEditor)
  const resolvedCount = useTokenStore((s) => s.getResolvedCount())
  const totalConflicts = useTokenStore((s) => s.getTotalConflicts())

  // No token set loaded
  if (!activeSet) {
    return (
      <div className="p-8">
        <h2 className="section-title text-primary mb-6">COMPARE & MERGE</h2>
        <p className="font-mono text-sm text-text-secondary">
          No token set selected. Go to the Dashboard to create or import one.
        </p>
      </div>
    )
  }

  // Export merged tokens as JSON
  const handleExport = () => {
    if (!diffResult) return

    // Build merged token map from diff results + resolutions
    const merged: Record<string, { path: string; value: string; type: string }> = {}

    for (const row of diffResult.rows) {
      const resolution = resolutions[row.path]

      if (row.status === 'same' && row.editorToken) {
        merged[row.path] = row.editorToken
      } else if (row.status === 'different') {
        if (resolution === 'imported' && row.fileToken) {
          merged[row.path] = row.fileToken
        } else if (row.editorToken) {
          merged[row.path] = row.editorToken
        }
      } else if (row.status === 'editor_only' && resolution !== 'discard' && row.editorToken) {
        merged[row.path] = row.editorToken
      } else if (row.status === 'file_only' && resolution === 'add' && row.fileToken) {
        merged[row.path] = row.fileToken
      }
    }

    const json = JSON.stringify(merged, null, 2)
    const blob = new Blob([json], { type: 'application/json' })
    saveAs(blob, `${activeSet.name.toLowerCase().replace(/\s+/g, '-')}-merged.json`)
  }

  // Error state
  if (importError && !diffResult) {
    return (
      <div className="h-full flex flex-col">
        <div className="p-6 border-b border-border">
          <div className="flex items-center justify-between">
            <h2 className="section-title text-primary">COMPARE & MERGE</h2>
            <button
              onClick={clearImport}
              className="px-4 py-2 bg-surface-elevated border border-border hover:border-primary transition-colors font-mono text-xs text-white"
            >
              TRY AGAIN
            </button>
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center p-12">
          <div className="max-w-md">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-8 h-8 rounded-full bg-error/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <AlertTriangle className="w-4 h-4 text-error" />
              </div>
              <div>
                <p className="font-mono text-sm text-error mb-1">Import failed</p>
                <p className="font-mono text-xs text-text-secondary">{importError}</p>
              </div>
            </div>
            {importedFileName && (
              <p className="font-mono text-xs text-text-tertiary mb-4 ml-11">
                File: {importedFileName}
              </p>
            )}
            <div className="ml-11 p-3 bg-surface-elevated border border-border rounded">
              <p className="font-mono text-xs text-text-secondary mb-2">Supported formats:</p>
              <ul className="font-mono text-xs text-text-tertiary space-y-1">
                <li>.json -- W3C Design Token format or Figma variables export</li>
                <li>.css -- CSS custom properties (--variable: value)</li>
                <li>.scss -- SCSS variables ($variable: value)</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // No file imported yet — show drop zone
  if (!diffResult) {
    return (
      <div className="h-full flex flex-col">
        <div className="p-6 border-b border-border">
          <h2 className="section-title text-primary">COMPARE & MERGE</h2>
          <p className="font-mono text-xs text-text-secondary mt-2">
            Compare {activeSet.name} against an external file
          </p>
        </div>
        <SyncDropZone onFileLoaded={importFile} />
      </div>
    )
  }

  // Diff view
  return (
    <div className="h-full flex flex-col">
      <SyncHeader
        fileName={importedFileName || ''}
        format={importedFormat || 'unknown'}
        diffResult={diffResult}
        filter={syncFilter}
        onFilterChange={setSyncFilter}
        onClear={clearImport}
        onApply={applyToEditor}
        onExport={handleExport}
        onResolveAll={resolveAllAs}
        resolvedCount={resolvedCount}
        totalConflicts={totalConflicts}
      />
      <SyncDiffPanel
        diffResult={diffResult}
        resolutions={resolutions}
        filter={syncFilter}
        onResolve={resolveToken}
        onUnresolve={unresolveToken}
      />
    </div>
  )
}
