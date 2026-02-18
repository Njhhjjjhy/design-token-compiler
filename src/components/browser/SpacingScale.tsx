import { useState } from 'react'
import { ArrowUpDown } from 'lucide-react'
import type { ResolvedToken } from '@/types'
import { CopyableValue } from './CopyableValue'

type SortMode = 'value-asc' | 'value-desc' | 'name'

interface SpacingScaleProps {
  tokens: [string, ResolvedToken][]
}

function parseToPixels(value: string): number {
  const str = String(value).trim()
  const match = str.match(/^(-?\d+\.?\d*)(px|rem|em|pt|%)?$/)
  if (!match) return 0
  const num = parseFloat(match[1])
  const unit = match[2] || 'px'
  switch (unit) {
    case 'rem':
    case 'em':
      return num * 16
    case 'pt':
      return num * 1.333
    case '%':
      return num * 0.16 // rough approximation for display
    default:
      return num
  }
}

const sortLabels: Record<SortMode, string> = {
  'value-asc': 'SMALLEST',
  'value-desc': 'LARGEST',
  name: 'NAME',
}

const sortCycle: SortMode[] = ['value-asc', 'value-desc', 'name']

export function SpacingScale({ tokens }: SpacingScaleProps) {
  const [sortMode, setSortMode] = useState<SortMode>('value-asc')

  if (tokens.length === 0) {
    return (
      <div className="flex items-center justify-center py-24">
        <p className="font-mono text-sm text-text-secondary">No spacing tokens found.</p>
      </div>
    )
  }

  const sorted = [...tokens].sort((a, b) => {
    if (sortMode === 'name') return a[0].localeCompare(b[0])
    const diff = parseToPixels(String(a[1].resolvedValue)) - parseToPixels(String(b[1].resolvedValue))
    return sortMode === 'value-desc' ? -diff : diff
  })

  const maxPx = Math.max(...sorted.map(([, t]) => parseToPixels(String(t.resolvedValue))), 1)

  const cycleSort = () => {
    const idx = sortCycle.indexOf(sortMode)
    setSortMode(sortCycle[(idx + 1) % sortCycle.length])
  }

  return (
    <div>
      <div className="flex items-center justify-end px-4 py-2 border-b border-border">
        <button
          onClick={cycleSort}
          className="flex items-center gap-1.5 px-2 py-1 font-mono text-xs text-text-secondary hover:text-white transition-colors"
        >
          <ArrowUpDown className="w-3 h-3" />
          {sortLabels[sortMode]}
        </button>
      </div>
      <div className="space-y-1">
        {sorted.some(([, t]) => /rem|em/.test(String(t.resolvedValue))) && (
          <div className="px-4 py-1.5 border-b border-border-subtle">
            <p className="font-mono text-mini text-text-tertiary">
              Pixel conversions assume 1rem = 16px (browser default)
            </p>
          </div>
        )}
        {sorted.map(([path, token]) => {
          const value = String(token.resolvedValue)
          const px = parseToPixels(value)
          const widthPercent = Math.max((px / maxPx) * 100, 1)
          const shortPath = path.split('.').slice(-2).join('.')

          return (
            <div key={path} className="flex items-center gap-4 py-2 px-4 border-b border-border-subtle">
              <span className="font-mono text-xs text-text-secondary min-w-[160px] truncate" title={path}>{shortPath}</span>
              <div className="flex-1">
                <div className="h-4 bg-primary/30 border border-primary/50 rounded-sm" style={{ width: `${widthPercent}%` }} role="img" aria-label={`${value} (${px}px)`} />
              </div>
              <CopyableValue value={value} className="font-mono text-xs text-white min-w-[60px] text-right" />
              {!value.endsWith('px') && (
                <span className="font-mono text-xs text-text-tertiary min-w-[50px] text-right">{px}px</span>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
