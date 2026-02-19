import { useMemo } from 'react'
import { useTokenStore } from '@/store/useTokenStore'
import { resolveTokens } from '@/lib/resolver'
import { ComponentsSidebar } from '@/components/components/ComponentsSidebar'
import { ComponentDetail } from '@/components/components/ComponentDetail'
import type { TokenBinding, Component } from '@/types'

export function ComponentsView() {
  const components = useTokenStore((s) => s.components)
  const selectedComponentId = useTokenStore((s) => s.selectedComponentId)
  const setSelectedComponent = useTokenStore((s) => s.setSelectedComponent)
  const addBinding = useTokenStore((s) => s.addBinding)
  const updateBinding = useTokenStore((s) => s.updateBinding)
  const removeBinding = useTokenStore((s) => s.removeBinding)
  const updateComponentMeta = useTokenStore((s) => s.updateComponentMeta)
  const activeSet = useTokenStore((s) => s.getActiveTokenSet())

  const resolvedTokens = useMemo(() => {
    if (!activeSet) return {}
    const result = resolveTokens(activeSet, activeSet.activeMode || undefined)
    return result.tokens
  }, [activeSet])

  const selectedComponent = components.find((c) => c.id === selectedComponentId) || components[0] || null

  // Auto-select first component if none selected
  if (!selectedComponentId && components.length > 0) {
    setSelectedComponent(components[0].id)
  }

  return (
    <div className="flex min-h-[calc(100vh-10rem)]">
      <ComponentsSidebar
        components={components}
        selectedId={selectedComponent?.id || null}
        onSelect={setSelectedComponent}
      />

      {selectedComponent ? (
        <ComponentDetail
          component={selectedComponent}
          resolvedTokens={resolvedTokens}
          onAddBinding={(binding) => addBinding(selectedComponent.id, binding)}
          onUpdateBinding={(bindingId, updates) => updateBinding(selectedComponent.id, bindingId, updates)}
          onRemoveBinding={(bindingId) => removeBinding(selectedComponent.id, bindingId)}
          onUpdateMeta={(updates) => updateComponentMeta(selectedComponent.id, updates)}
        />
      ) : (
        <div className="flex-1 flex items-center justify-center">
          <p className="font-mono text-sm text-text-tertiary">Select a component to get started</p>
        </div>
      )}
    </div>
  )
}
