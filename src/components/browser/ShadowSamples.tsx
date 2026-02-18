import { useState } from 'react'
import type { ResolvedToken } from '@/types'
import { CopyableValue } from './CopyableValue'

const canHover = window.matchMedia('(hover: hover)').matches

interface ShadowSamplesProps {
  tokens: [string, ResolvedToken][]
}

export function ShadowSamples({ tokens }: ShadowSamplesProps) {
  const [activePath, setActivePath] = useState<string | null>(null)

  if (tokens.length === 0) {
    return (
      <div className="flex items-center justify-center py-24" role="status">
        <p className="font-mono text-sm text-text-secondary">No shadow tokens found.</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 tablet:grid-cols-2 desktop:grid-cols-3 large:grid-cols-4 gap-4 tablet:gap-6 desktop:gap-8 large:gap-10">
      {tokens.map(([path, token]) => {
        const value = String(token.resolvedValue)
        const shortPath = path.split('.').slice(-2).join('.')
        const isActive = activePath === path

        return (
          <div
            key={path}
            className="border border-border-subtle p-4 tablet:p-5 cursor-default focus:outline-none focus:ring-2 focus:ring-primary"
            tabIndex={0}
            role="button"
            aria-label={`Shadow preview: ${shortPath}`}
            onMouseEnter={() => { if (canHover) setActivePath(path) }}
            onMouseLeave={() => { if (canHover) setActivePath(null) }}
            onFocus={() => { if (canHover) setActivePath(path) }}
            onBlur={() => { if (canHover) setActivePath(null) }}
            onClick={() => { if (!canHover) setActivePath(prev => prev === path ? null : path) }}
            onKeyDown={(e) => { if (!canHover && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); setActivePath(prev => prev === path ? null : path) } }}
          >
            <p className="font-mono text-xs text-text-secondary mb-4" title={path}>{shortPath}</p>
            <div className="flex items-center justify-center py-8">
              <div
                className="w-20 h-20 tablet:w-24 tablet:h-24 large:w-28 large:h-28 bg-surface-elevated rounded transition-all duration-200 ease-out"
                role="img"
                aria-label={`Shadow: ${value}`}
                style={{
                  boxShadow: isActive ? `${value}, 0 8px 24px rgba(0,0,0,0.3)` : value,
                  transform: isActive ? 'translateY(-4px)' : 'none',
                }}
              />
            </div>
            <CopyableValue value={value} className="font-mono text-xs text-text-tertiary mt-4 break-all block" />
          </div>
        )
      })}
    </div>
  )
}
