import type { Component } from '@/types'

interface AnatomyTabProps {
  component: Component
}

export function AnatomyTab({ component }: AnatomyTabProps) {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h3 className="font-mono text-xs text-text-tertiary tracking-widest uppercase mb-4">Parts</h3>
        <div className="space-y-2">
          {component.parts.map((part, index) => (
            <div
              key={part.id}
              className="flex items-start gap-4 p-3 border border-border rounded bg-surface-elevated"
            >
              <div className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-full bg-primary/10 border border-primary/30">
                <span className="font-mono text-xs text-primary">{index + 1}</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-3">
                  <span className="font-mono text-sm text-white">{part.id}</span>
                  <span className="text-xs text-text-secondary">{part.name}</span>
                </div>
                {part.description && (
                  <p className="font-mono text-xs text-text-tertiary mt-0.5">{part.description}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 className="font-mono text-xs text-text-tertiary tracking-widest uppercase mb-4">States</h3>
        <div className="flex flex-wrap gap-2">
          {component.states.map((state) => (
            <div
              key={state.id}
              className="px-3 py-1.5 border border-border rounded font-mono text-xs text-text-secondary bg-surface-elevated"
            >
              {state.id}
            </div>
          ))}
        </div>
      </div>

      {component.variants.length > 0 && (
        <div>
          <h3 className="font-mono text-xs text-text-tertiary tracking-widest uppercase mb-4">Variants</h3>
          {(['appearance', 'size', 'type'] as const).map((category) => {
            const categoryVariants = component.variants.filter((v) => v.category === category)
            if (categoryVariants.length === 0) return null
            return (
              <div key={category} className="mb-4">
                <p className="font-mono text-xs text-text-tertiary mb-2 capitalize">{category}</p>
                <div className="flex flex-wrap gap-2">
                  {categoryVariants.map((variant) => (
                    <div
                      key={variant.id}
                      className="px-3 py-1.5 border border-border rounded font-mono text-xs text-text-secondary bg-surface-elevated"
                    >
                      {variant.id}
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
