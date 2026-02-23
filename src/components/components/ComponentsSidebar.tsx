import type { Component } from '@/types'

interface ComponentsSidebarProps {
  components: Component[]
  selectedId: string | null
  onSelect: (id: string) => void
}

function getBindingCoverage(component: Component): { bound: number; total: number } {
  // Total binding slots = parts × states (simplified: count unique part+state combos)
  const total = component.parts.length * component.states.length
  const bound = component.bindings.length
  return { bound, total }
}

export function ComponentsSidebar({ components, selectedId, onSelect }: ComponentsSidebarProps) {
  const atoms = components.filter((c) => c.atomicLevel === 'atom')

  return (
    <aside className="w-64 flex-shrink-0 border-r border-border flex flex-col min-h-full">
      <div className="px-4 py-3 border-b border-border">
        <span className="font-mono text-xs text-text-tertiary tracking-widest uppercase">Atoms</span>
      </div>
      <nav className="flex-1 overflow-y-auto">
        {atoms.map((component) => {
          const { bound, total } = getBindingCoverage(component)
          const isSelected = selectedId === component.id
          return (
            <button
              key={component.id}
              onClick={() => onSelect(component.id)}
              className={`
                w-full flex items-center justify-between px-4 py-2.5 text-left
                transition-colors
                ${isSelected
                  ? 'bg-surface-elevated text-white'
                  : 'text-text-secondary hover:text-white hover:bg-surface-elevated/50'
                }
              `}
            >
              <span className="font-mono text-sm">{component.id}</span>
              <span className={`
                font-mono text-xs px-1.5 py-0.5 rounded
                ${bound === 0 ? 'text-text-tertiary bg-surface-elevated' : 'text-primary bg-primary/10'}
              `}>
                {bound}/{total}
              </span>
            </button>
          )
        })}
      </nav>
      <div className="px-4 py-3 border-t border-border">
        <span className="font-mono text-xs text-text-tertiary">Molecules — coming soon</span>
      </div>
    </aside>
  )
}
