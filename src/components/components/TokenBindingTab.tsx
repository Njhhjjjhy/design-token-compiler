import type { Component, TokenBinding, ResolvedTokenMap } from '@/types'
import { TokenPicker } from './TokenPicker'

interface TokenBindingTabProps {
  component: Component
  resolvedTokens: ResolvedTokenMap
  onAddBinding: (binding: Omit<TokenBinding, 'id'>) => void
  onUpdateBinding: (bindingId: string, updates: Partial<Pick<TokenBinding, 'tokenPath' | 'cssProperty'>>) => void
  onRemoveBinding: (bindingId: string) => void
}

// Common CSS properties per part type
const CSS_PROPERTY_SUGGESTIONS: Record<string, string[]> = {
  container: ['background-color', 'border-color', 'border-radius', 'box-shadow', 'outline-color'],
  label: ['color', 'font-size', 'font-weight', 'font-family', 'line-height', 'letter-spacing'],
  text: ['color', 'font-size', 'font-weight', 'font-family', 'line-height'],
  'input-field': ['background-color', 'border-color', 'color', 'border-radius'],
  'icon-leading': ['color', 'width', 'height'],
  'icon-trailing': ['color', 'width', 'height'],
  indicator: ['background-color', 'border-color', 'color'],
  spinner: ['color'],
  line: ['background-color', 'height', 'width'],
  dot: ['background-color', 'width', 'height', 'border-radius'],
}

function getDefaultCssProperty(partId: string): string {
  const suggestions = CSS_PROPERTY_SUGGESTIONS[partId]
  return suggestions?.[0] || 'color'
}

// Generate a canonical key for a binding slot
function slotKey(partId: string, stateId: string, variantId: string | null) {
  return `${partId}__${stateId}__${variantId ?? '_'}`
}

export function TokenBindingTab({ component, resolvedTokens, onAddBinding, onUpdateBinding, onRemoveBinding }: TokenBindingTabProps) {
  // Build a map of existing bindings by slot key
  const bindingBySlot = new Map<string, TokenBinding>()
  for (const b of component.bindings) {
    bindingBySlot.set(slotKey(b.partId, b.stateId, b.variantId), b)
  }

  const hasTokens = Object.keys(resolvedTokens).length > 0

  function handleSelect(partId: string, stateId: string, variantId: string | null, tokenPath: string, cssProperty: string) {
    const key = slotKey(partId, stateId, variantId)
    const existing = bindingBySlot.get(key)
    if (existing) {
      onUpdateBinding(existing.id, { tokenPath })
    } else {
      onAddBinding({ partId, stateId, variantId, tokenPath, cssProperty })
    }
  }

  function handleClear(partId: string, stateId: string, variantId: string | null) {
    const key = slotKey(partId, stateId, variantId)
    const existing = bindingBySlot.get(key)
    if (existing) onRemoveBinding(existing.id)
  }

  if (!hasTokens) {
    return (
      <div className="p-6 flex items-center justify-center">
        <p className="font-mono text-sm text-text-tertiary text-center">
          No active token set.<br />
          <span className="text-text-tertiary/60">Activate a token set from the Dashboard to bind tokens.</span>
        </p>
      </div>
    )
  }

  return (
    <div className="overflow-auto">
      <table className="w-full text-xs font-mono">
        <thead>
          <tr className="border-b border-border">
            <th className="px-4 py-2.5 text-left text-text-tertiary font-normal tracking-wider uppercase w-[140px]">Part</th>
            <th className="px-4 py-2.5 text-left text-text-tertiary font-normal tracking-wider uppercase w-[100px]">State</th>
            <th className="px-4 py-2.5 text-left text-text-tertiary font-normal tracking-wider uppercase w-[100px]">Variant</th>
            <th className="px-4 py-2.5 text-left text-text-tertiary font-normal tracking-wider uppercase w-[140px]">CSS Property</th>
            <th className="px-4 py-2.5 text-left text-text-tertiary font-normal tracking-wider uppercase">Token</th>
          </tr>
        </thead>
        <tbody>
          {component.parts.flatMap((part) =>
            component.states.map((state) => {
              const key = slotKey(part.id, state.id, null)
              const existing = bindingBySlot.get(key)
              const defaultCss = getDefaultCssProperty(part.id)
              return (
                <tr key={key} className="border-b border-border/50 hover:bg-surface-elevated/30 transition-colors">
                  <td className="px-4 py-2 text-white">{part.id}</td>
                  <td className="px-4 py-2 text-text-secondary">{state.id}</td>
                  <td className="px-4 py-2 text-text-tertiary">—</td>
                  <td className="px-4 py-2 text-text-secondary">{existing?.cssProperty || defaultCss}</td>
                  <td className="px-4 py-2">
                    <TokenPicker
                      value={existing?.tokenPath || null}
                      resolvedTokens={resolvedTokens}
                      onSelect={(tokenPath) => handleSelect(part.id, state.id, null, tokenPath, existing?.cssProperty || defaultCss)}
                      onClear={() => handleClear(part.id, state.id, null)}
                    />
                  </td>
                </tr>
              )
            })
          )}
        </tbody>
      </table>
    </div>
  )
}
