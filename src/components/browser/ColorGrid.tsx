import type { ResolvedToken } from '@/types'

interface ColorGridProps {
  tokens: [string, ResolvedToken][]
}

function getLuminance(hex: string): number {
  const rgb = hexToRgb(hex)
  if (!rgb) return 0
  const [r, g, b] = [rgb.r, rgb.g, rgb.b].map((c) => {
    const s = c / 255
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4)
  })
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

function getContrastRatio(hex1: string, hex2: string): number {
  const l1 = getLuminance(hex1)
  const l2 = getLuminance(hex2)
  const lighter = Math.max(l1, l2)
  const darker = Math.min(l1, l2)
  return (lighter + 0.05) / (darker + 0.05)
}

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const clean = hex.replace('#', '')
  if (clean.length < 6) return null
  const r = parseInt(clean.substring(0, 2), 16)
  const g = parseInt(clean.substring(2, 4), 16)
  const b = parseInt(clean.substring(4, 6), 16)
  if (isNaN(r) || isNaN(g) || isNaN(b)) return null
  return { r, g, b }
}

function groupByCategory(tokens: [string, ResolvedToken][]): Map<string, [string, ResolvedToken][]> {
  const groups = new Map<string, [string, ResolvedToken][]>()
  for (const entry of tokens) {
    const parts = entry[0].split('.')
    const category = parts.length > 1 ? parts[1] : parts[0]
    const existing = groups.get(category) || []
    existing.push(entry)
    groups.set(category, existing)
  }
  return groups
}

export function ColorGrid({ tokens }: ColorGridProps) {
  if (tokens.length === 0) {
    return (
      <div className="flex items-center justify-center py-24">
        <p className="font-mono text-sm text-text-secondary">No color tokens found.</p>
      </div>
    )
  }

  const groups = groupByCategory(tokens)

  return (
    <div className="space-y-8">
      {Array.from(groups.entries()).map(([category, categoryTokens]) => (
        <div key={category}>
          <h3 className="font-mono text-xs text-primary uppercase tracking-wider mb-4">
            {category}
            <span className="text-text-tertiary ml-2">({categoryTokens.length})</span>
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {categoryTokens.map(([path, token]) => {
              const value = String(token.resolvedValue)
              const isValidHex = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/.test(value)
              const contrastWhite = isValidHex ? getContrastRatio(value, '#ffffff') : 0
              const contrastBlack = isValidHex ? getContrastRatio(value, '#000000') : 0
              const shortPath = path.split('.').slice(-2).join('.')

              return (
                <div key={path} className="border border-border-subtle">
                  <div className="h-20 border-b border-border-subtle" style={{ backgroundColor: isValidHex ? value : '#000' }} />
                  <div className="p-2.5">
                    <p className="font-mono text-xs text-white truncate" title={path}>{shortPath}</p>
                    <p className="font-mono text-xs text-text-secondary mt-0.5">{value}</p>
                    {isValidHex && (
                      <div className="flex gap-2 mt-1.5">
                        <span className={`font-mono text-xs ${contrastWhite >= 4.5 ? 'text-success' : contrastWhite >= 3 ? 'text-warning' : 'text-error'}`}>
                          W {contrastWhite.toFixed(1)}
                        </span>
                        <span className={`font-mono text-xs ${contrastBlack >= 4.5 ? 'text-success' : contrastBlack >= 3 ? 'text-warning' : 'text-error'}`}>
                          B {contrastBlack.toFixed(1)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
