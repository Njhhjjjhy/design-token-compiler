import { Pencil, Eye, Download, Clock } from 'lucide-react'
import { format } from 'date-fns'
import type { TokenSet, Token, TokenGroup } from '@/types'

interface TokenSetCardProps {
  tokenSet: TokenSet
  versionCount: number
  onClick: () => void
  onEdit: () => void
  onBrowse: () => void
  onExport: () => void
  onVersions: () => void
}

function countTokensByType(tokens: Record<string, Token | TokenGroup>): Record<string, number> {
  const counts: Record<string, number> = {}
  function traverse(node: Record<string, Token | TokenGroup>) {
    for (const value of Object.values(node)) {
      if ('tokens' in value) {
        traverse(value.tokens)
      } else {
        counts[value.type] = (counts[value.type] || 0) + 1
      }
    }
  }
  traverse(tokens)
  return counts
}

function extractColorPreviews(tokens: Record<string, Token | TokenGroup>, max = 8): string[] {
  const colors: string[] = []
  function traverse(node: Record<string, Token | TokenGroup>) {
    if (colors.length >= max) return
    for (const value of Object.values(node)) {
      if (colors.length >= max) return
      if ('tokens' in value) {
        traverse(value.tokens)
      } else if (value.type === 'color' && typeof value.value === 'string' && value.value.startsWith('#')) {
        colors.push(value.value)
      }
    }
  }
  traverse(tokens)
  return colors
}

export function TokenSetCard({
  tokenSet,
  versionCount,
  onClick,
  onEdit,
  onBrowse,
  onExport,
  onVersions,
}: TokenSetCardProps) {
  const typeCounts = countTokensByType(tokenSet.tokens)
  const colorPreviews = extractColorPreviews(tokenSet.tokens)
  const totalTokens = Object.values(typeCounts).reduce((sum, count) => sum + count, 0)

  const typeLabels: [string, string][] = [
    ['color', 'colors'],
    ['dimension', 'spacing'],
    ['typography', 'typography'],
    ['shadow', 'shadows'],
    ['fontFamily', 'fonts'],
    ['fontWeight', 'weights'],
    ['number', 'numbers'],
    ['duration', 'durations'],
    ['border', 'borders'],
  ]

  const activeCounts = typeLabels
    .filter(([type]) => typeCounts[type])
    .map(([type, label]) => `${typeCounts[type]} ${label}`)

  return (
    <div onClick={onClick} className="border border-border bg-surface hover:border-primary/40 transition-colors cursor-pointer">
      {colorPreviews.length > 0 && (
        <div className="flex h-3">
          {colorPreviews.map((color, i) => (
            <div key={i} className="flex-1" style={{ backgroundColor: color }} />
          ))}
        </div>
      )}

      <div className="p-5">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h3 className="font-mono text-sm text-white font-medium">{tokenSet.name}</h3>
            <p className="font-mono text-xs text-text-tertiary mt-1">{totalTokens} tokens</p>
          </div>
          {tokenSet.activeMode && tokenSet.modes[tokenSet.activeMode] && (
            <span className="px-2 py-0.5 bg-surface-elevated border border-border font-mono text-xs text-text-secondary">
              {tokenSet.modes[tokenSet.activeMode].name.toUpperCase()}
            </span>
          )}
        </div>

        <p className="font-mono text-xs text-text-secondary mb-4">
          {activeCounts.join(' · ') || 'Empty set'}
        </p>

        <div className="flex items-center justify-between pt-3 border-t border-border-subtle">
          <span className="font-mono text-xs text-text-tertiary">
            {format(tokenSet.metadata.updatedAt, 'MMM d, yyyy')}
          </span>
          <div className="flex gap-1">
            <button onClick={(e) => { e.stopPropagation(); onEdit() }} className="flex items-center gap-1 px-1.5 py-1 text-text-tertiary hover:text-white hover:bg-white/5 transition-colors" title="Edit tokens" aria-label="Edit tokens">
              <Pencil className="w-3.5 h-3.5" />
              <span className="font-mono text-[10px]">Edit</span>
            </button>
            <button onClick={(e) => { e.stopPropagation(); onBrowse() }} className="flex items-center gap-1 px-1.5 py-1 text-text-tertiary hover:text-white hover:bg-white/5 transition-colors" title="Browse tokens" aria-label="Browse tokens">
              <Eye className="w-3.5 h-3.5" />
              <span className="font-mono text-[10px]">Browse</span>
            </button>
            <button onClick={(e) => { e.stopPropagation(); onExport() }} className="flex items-center gap-1 px-1.5 py-1 text-text-tertiary hover:text-white hover:bg-white/5 transition-colors" title="Export tokens" aria-label="Export tokens">
              <Download className="w-3.5 h-3.5" />
              <span className="font-mono text-[10px]">Export</span>
            </button>
            {versionCount > 0 && (
              <button onClick={(e) => { e.stopPropagation(); onVersions() }} className="flex items-center gap-1 px-1.5 py-1 text-text-tertiary hover:text-white hover:bg-white/5 transition-colors" title="Version history" aria-label="Version history">
                <Clock className="w-3.5 h-3.5" />
                <span className="font-mono text-[10px]">{versionCount}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
