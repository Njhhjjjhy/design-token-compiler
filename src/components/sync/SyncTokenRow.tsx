import type { FlatToken } from '@/lib/flatten-tokens'
import type { DiffStatus } from '@/lib/diff-engine'
import { ArrowLeft, ArrowRight, Check, Minus, Plus, Equal, AlertTriangle, ArrowRightFromLine, ArrowLeftFromLine, Undo2 } from 'lucide-react'

interface SyncTokenRowProps {
  path: string
  status: DiffStatus
  editorToken?: FlatToken
  fileToken?: FlatToken
  resolution?: 'editor' | 'imported' | 'discard' | 'add'
  onResolve: (path: string, choice: 'editor' | 'imported' | 'discard' | 'add') => void
  onUnresolve?: (path: string) => void
}

export function SyncTokenRow({
  path,
  status,
  editorToken,
  fileToken,
  resolution,
  onResolve,
  onUnresolve,
}: SyncTokenRowProps) {
  const statusColors: Record<DiffStatus, string> = {
    same: 'border-l-success/30',
    different: 'border-l-warning/80',
    editor_only: 'border-l-info/80',
    file_only: 'border-l-primary/80',
  }

  const statusBg: Record<DiffStatus, string> = {
    same: '',
    different: 'bg-warning/5',
    editor_only: 'bg-info/5',
    file_only: 'bg-primary/5',
  }

  const statusLabels: Record<DiffStatus, string> = {
    same: 'Same',
    different: 'Different',
    editor_only: 'Editor only',
    file_only: 'File only',
  }

  const statusLabelColors: Record<DiffStatus, string> = {
    same: 'text-success',
    different: 'text-warning',
    editor_only: 'text-info',
    file_only: 'text-primary',
  }

  const shortPath = path.split('.').slice(1).join('.') || path

  return (
    <tr className={`border-l-2 ${statusColors[status]} ${statusBg[status]} ${resolution ? 'opacity-70' : ''} border-b border-border-subtle`}>
      <td className="px-4 py-2">
        <span className="font-mono text-xs text-text-secondary min-w-[180px] truncate block" title={path}>
          {shortPath}
        </span>
      </td>

      <td className="px-1 py-2">
        <span className={`font-mono text-xs uppercase ${statusLabelColors[status]} flex items-center gap-1`}>
          {status === 'same' && <Equal className="w-3 h-3" />}
          {status === 'different' && <AlertTriangle className="w-3 h-3" />}
          {status === 'editor_only' && <ArrowLeftFromLine className="w-3 h-3" />}
          {status === 'file_only' && <ArrowRightFromLine className="w-3 h-3" />}
          {statusLabels[status]}
        </span>
      </td>

      <td className="px-1 py-2">
        <div className="flex items-center gap-2 min-w-0">
          {editorToken ? (
            <>
              {renderPreview(editorToken)}
              <span className={`font-mono text-xs truncate ${resolution === 'imported' ? 'line-through text-text-tertiary' : 'text-white'}`}>
                {editorToken.value}
              </span>
            </>
          ) : (
            <span className="font-mono text-xs text-text-tertiary italic">&mdash;</span>
          )}
        </div>
      </td>

      <td className="px-1 py-2">
        <div className="flex items-center gap-1">
          {status === 'different' && (
            <>
              <button
                onClick={() => onResolve(path, 'editor')}
                className={`flex items-center gap-1 px-1.5 py-0.5 rounded font-mono text-[10px] transition-colors ${
                  resolution === 'editor'
                    ? 'bg-info/20 text-info'
                    : 'text-text-tertiary hover:text-white hover:bg-white/5'
                }`}
                aria-label="Keep editor value"
              >
                <ArrowLeft className="w-3 h-3" />
                Keep editor
              </button>
              <button
                onClick={() => onResolve(path, 'imported')}
                className={`flex items-center gap-1 px-1.5 py-0.5 rounded font-mono text-[10px] transition-colors ${
                  resolution === 'imported'
                    ? 'bg-primary/20 text-primary'
                    : 'text-text-tertiary hover:text-white hover:bg-white/5'
                }`}
                aria-label="Keep imported value"
              >
                Keep imported
                <ArrowRight className="w-3 h-3" />
              </button>
            </>
          )}
          {status === 'editor_only' && (
            <>
              <button
                onClick={() => onResolve(path, 'editor')}
                className={`flex items-center gap-1 px-1.5 py-0.5 rounded font-mono text-[10px] transition-colors ${
                  resolution === 'editor'
                    ? 'bg-success/20 text-success'
                    : 'text-text-tertiary hover:text-white hover:bg-white/5'
                }`}
                aria-label="Keep in editor"
              >
                <Check className="w-3 h-3" />
                Keep
              </button>
              <button
                onClick={() => onResolve(path, 'discard')}
                className={`flex items-center gap-1 px-1.5 py-0.5 rounded font-mono text-[10px] transition-colors ${
                  resolution === 'discard'
                    ? 'bg-error/20 text-error'
                    : 'text-text-tertiary hover:text-white hover:bg-white/5'
                }`}
                aria-label="Remove from editor"
              >
                <Minus className="w-3 h-3" />
                Remove
              </button>
            </>
          )}
          {status === 'file_only' && (
            <>
              <button
                onClick={() => onResolve(path, 'add')}
                className={`flex items-center gap-1 px-1.5 py-0.5 rounded font-mono text-[10px] transition-colors ${
                  resolution === 'add'
                    ? 'bg-success/20 text-success'
                    : 'text-text-tertiary hover:text-white hover:bg-white/5'
                }`}
                aria-label="Add to editor"
              >
                <Plus className="w-3 h-3" />
                Add
              </button>
              <button
                onClick={() => onResolve(path, 'discard')}
                className={`flex items-center gap-1 px-1.5 py-0.5 rounded font-mono text-[10px] transition-colors ${
                  resolution === 'discard'
                    ? 'bg-error/20 text-error'
                    : 'text-text-tertiary hover:text-white hover:bg-white/5'
                }`}
                aria-label="Ignore"
              >
                <Minus className="w-3 h-3" />
                Ignore
              </button>
            </>
          )}
          {status === 'same' && (
            <Check className="w-3 h-3 text-success/40" />
          )}
          {resolution && onUnresolve && (
            <button
              onClick={() => onUnresolve(path)}
              className="ml-1 p-0.5 rounded text-text-tertiary hover:text-white hover:bg-white/5 transition-colors"
              aria-label="Undo resolution"
              title="Undo"
            >
              <Undo2 className="w-3 h-3" />
            </button>
          )}
        </div>
      </td>

      <td className="px-1 py-2">
        <div className="flex items-center gap-2 min-w-0">
          {fileToken ? (
            <>
              {renderPreview(fileToken)}
              <span className={`font-mono text-xs truncate ${resolution === 'editor' ? 'line-through text-text-tertiary' : 'text-white'}`}>
                {fileToken.value}
              </span>
            </>
          ) : (
            <span className="font-mono text-xs text-text-tertiary italic">&mdash;</span>
          )}
        </div>
      </td>
    </tr>
  )
}

/**
 * Render a small visual preview for a token value.
 */
function renderPreview(token: FlatToken) {
  if (token.type === 'color' && !token.value.startsWith('{')) {
    return (
      <div
        className="w-3 h-3 rounded-sm border border-white/20 flex-shrink-0"
        style={{ backgroundColor: token.value }}
        role="img"
        aria-label={`Color: ${token.value}`}
      />
    )
  }

  if (token.type === 'dimension') {
    const match = token.value.match(/(\d+)/)
    const numValue = match ? parseInt(match[1]) : 0
    const barWidth = Math.min(numValue, 48)
    return (
      <div
        className="h-2 bg-text-tertiary rounded-sm flex-shrink-0"
        style={{ width: `${barWidth}px` }}
        role="img"
        aria-label={`Dimension: ${token.value}`}
      />
    )
  }

  return null
}
