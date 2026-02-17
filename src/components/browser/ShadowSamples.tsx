import type { ResolvedToken } from '@/types'

interface ShadowSamplesProps {
  tokens: [string, ResolvedToken][]
}

export function ShadowSamples({ tokens }: ShadowSamplesProps) {
  if (tokens.length === 0) {
    return (
      <div className="flex items-center justify-center py-24">
        <p className="font-mono text-sm text-text-secondary">No shadow tokens found.</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {tokens.map(([path, token]) => {
        const value = String(token.resolvedValue)
        const shortPath = path.split('.').slice(-2).join('.')

        return (
          <div key={path} className="border border-border-subtle p-5">
            <p className="font-mono text-xs text-text-secondary mb-4" title={path}>{shortPath}</p>
            <div className="flex items-center justify-center py-8">
              <div className="w-24 h-24 bg-surface-elevated rounded" style={{ boxShadow: value }} />
            </div>
            <p className="font-mono text-xs text-text-tertiary mt-4 break-all">{value}</p>
          </div>
        )
      })}
    </div>
  )
}
