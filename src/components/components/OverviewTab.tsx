import { useState } from 'react'
import { Edit2, Check } from 'lucide-react'
import type { Component, ResolvedTokenMap } from '@/types'
import { ComponentPreview } from './ComponentPreview'

interface OverviewTabProps {
  component: Component
  resolvedTokens: ResolvedTokenMap
  onUpdateMeta: (updates: Partial<Pick<Component, 'description' | 'usageGuidelines'>>) => void
}

export function OverviewTab({ component, resolvedTokens, onUpdateMeta }: OverviewTabProps) {
  const [activeState, setActiveState] = useState(component.states[0]?.id || 'default')
  const [activeVariants, setActiveVariants] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {}
    for (const v of component.variants) {
      if (!(v.category in initial)) {
        initial[v.category] = v.id
      }
    }
    return initial
  })
  const [editingDescription, setEditingDescription] = useState(false)
  const [editingGuidelines, setEditingGuidelines] = useState(false)
  const [descValue, setDescValue] = useState(component.description)
  const [guideValue, setGuideValue] = useState(component.usageGuidelines)

  // Group variants by category, preserving definition order
  const variantCategories: { category: string; variants: typeof component.variants }[] = []
  for (const v of component.variants) {
    const existing = variantCategories.find((g) => g.category === v.category)
    if (existing) {
      existing.variants.push(v)
    } else {
      variantCategories.push({ category: v.category, variants: [v] })
    }
  }

  return (
    <div className="p-6 space-y-6">
      {/* Preview */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          {component.states.map((state) => (
            <button
              key={state.id}
              onClick={() => setActiveState(state.id)}
              className={`
                px-2.5 py-1 font-mono text-xs rounded border transition-colors
                ${activeState === state.id
                  ? 'border-primary/60 text-primary bg-primary/10'
                  : 'border-border text-text-tertiary hover:text-text-secondary hover:border-border-strong'
                }
              `}
            >
              {state.id}
            </button>
          ))}
          {variantCategories.map((group) => (
            <span key={group.category} className="contents">
              <div className="w-px h-4 bg-border mx-1" />
              {group.variants.map((variant) => (
                <button
                  key={variant.id}
                  onClick={() => setActiveVariants(prev => ({ ...prev, [variant.category]: variant.id }))}
                  className={`
                    px-2.5 py-1 font-mono text-xs rounded border transition-colors
                    ${activeVariants[variant.category] === variant.id
                      ? 'border-primary/60 text-primary bg-primary/10'
                      : 'border-border text-text-tertiary hover:text-text-secondary hover:border-border-strong'
                    }
                  `}
                >
                  {variant.id}
                </button>
              ))}
            </span>
          ))}
        </div>
        <ComponentPreview
          component={component}
          resolvedTokens={resolvedTokens}
          activeState={activeState}
          activeVariants={activeVariants}
        />
      </div>

      {/* Description */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-mono text-xs text-text-tertiary tracking-widest uppercase">Description</h3>
          <button
            onClick={() => {
              if (editingDescription) {
                onUpdateMeta({ description: descValue })
              }
              setEditingDescription(!editingDescription)
            }}
            className="p-1 text-text-tertiary hover:text-white transition-colors"
            aria-label={editingDescription ? 'Save description' : 'Edit description'}
          >
            {editingDescription ? <Check className="w-3 h-3" /> : <Edit2 className="w-3 h-3" />}
          </button>
        </div>
        {editingDescription ? (
          <textarea
            value={descValue}
            onChange={(e) => setDescValue(e.target.value)}
            rows={3}
            className="w-full bg-surface-elevated border border-border rounded px-3 py-2 font-mono text-sm text-white resize-none focus:outline-none focus:border-primary/60"
          />
        ) : (
          <p className="font-mono text-sm text-text-secondary leading-relaxed">{component.description}</p>
        )}
      </div>

      {/* Usage Guidelines */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-mono text-xs text-text-tertiary tracking-widest uppercase">When to Use</h3>
          <button
            onClick={() => {
              if (editingGuidelines) {
                onUpdateMeta({ usageGuidelines: guideValue })
              }
              setEditingGuidelines(!editingGuidelines)
            }}
            className="p-1 text-text-tertiary hover:text-white transition-colors"
            aria-label={editingGuidelines ? 'Save guidelines' : 'Edit guidelines'}
          >
            {editingGuidelines ? <Check className="w-3 h-3" /> : <Edit2 className="w-3 h-3" />}
          </button>
        </div>
        {editingGuidelines ? (
          <textarea
            value={guideValue}
            onChange={(e) => setGuideValue(e.target.value)}
            rows={4}
            className="w-full bg-surface-elevated border border-border rounded px-3 py-2 font-mono text-sm text-white resize-none focus:outline-none focus:border-primary/60"
          />
        ) : (
          <p className="font-mono text-sm text-text-secondary leading-relaxed">{component.usageGuidelines}</p>
        )}
      </div>
    </div>
  )
}
