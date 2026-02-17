import type { ResolvedToken } from '@/types'

interface SpacingScaleProps {
  tokens: [string, ResolvedToken][]
}

function parseToPixels(value: string): number {
  const str = String(value).trim()
  const match = str.match(/^(-?\d+\.?\d*)(px|rem|em|pt)?$/)
  if (!match) return 0
  const num = parseFloat(match[1])
  const unit = match[2] || 'px'
  switch (unit) {
    case 'rem':
    case 'em':
      return num * 16
    case 'pt':
      return num * 1.333
    default:
      return num
  }
}

export function SpacingScale({ tokens }: SpacingScaleProps) {
  if (tokens.length === 0) {
    return (
      <div className="flex items-center justify-center py-24">
        <p className="font-mono text-sm text-text-secondary">No spacing tokens found.</p>
      </div>
    )
  }

  const sorted = [...tokens].sort((a, b) => {
    return parseToPixels(String(a[1].resolvedValue)) - parseToPixels(String(b[1].resolvedValue))
  })

  const maxPx = Math.max(...sorted.map(([, t]) => parseToPixels(String(t.resolvedValue))), 1)

  return (
    <div className="space-y-1">
      {sorted.map(([path, token]) => {
        const value = String(token.resolvedValue)
        const px = parseToPixels(value)
        const widthPercent = Math.max((px / maxPx) * 100, 1)
        const shortPath = path.split('.').slice(-2).join('.')

        return (
          <div key={path} className="flex items-center gap-4 py-2 px-4 border-b border-border-subtle">
            <span className="font-mono text-xs text-text-secondary min-w-[160px] truncate" title={path}>{shortPath}</span>
            <div className="flex-1">
              <div className="h-4 bg-primary/30 border border-primary/50 rounded-sm" style={{ width: `${widthPercent}%` }} />
            </div>
            <span className="font-mono text-xs text-white min-w-[60px] text-right">{value}</span>
            {!value.endsWith('px') && (
              <span className="font-mono text-xs text-text-tertiary min-w-[50px] text-right">{px}px</span>
            )}
          </div>
        )
      })}
    </div>
  )
}
