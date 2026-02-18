import { Search } from 'lucide-react'
import type { ModeMap } from '@/types'

export type BrowserTab = 'colors' | 'spacing' | 'typography' | 'shadows'

interface BrowserHeaderProps {
  activeTab: BrowserTab
  onTabChange: (tab: BrowserTab) => void
  tabCounts: Record<BrowserTab, number>
  modes: ModeMap
  activeMode: string | null
  onModeChange: (modeId: string) => void
  searchQuery: string
  onSearchChange: (query: string) => void
}

export function BrowserHeader({
  activeTab,
  onTabChange,
  tabCounts,
  modes,
  activeMode,
  onModeChange,
  searchQuery,
  onSearchChange,
}: BrowserHeaderProps) {
  const tabs: { id: BrowserTab; label: string }[] = [
    { id: 'colors', label: 'COLORS' },
    { id: 'spacing', label: 'SPACING' },
    { id: 'typography', label: 'TYPOGRAPHY' },
    { id: 'shadows', label: 'SHADOWS' },
  ]

  const modeEntries = Object.values(modes)
  const hasModes = modeEntries.length > 0

  return (
    <div className="px-8 pt-8 pb-0">
      <div className="flex items-center justify-between mb-6">
        <h2 className="section-title text-primary">TOKEN BROWSER</h2>
        {hasModes && (
          <div className="flex border border-border">
            {modeEntries.map((mode, i) => (
              <button
                key={mode.id}
                onClick={() => onModeChange(mode.id)}
                className={`px-3 py-1 font-mono text-xs transition-colors ${
                  activeMode === mode.id ? 'bg-surface-elevated text-white' : 'text-text-secondary hover:text-white'
                } ${i > 0 ? 'border-l border-border' : ''}`}
              >
                {mode.name.toUpperCase()}
              </button>
            ))}
          </div>
        )}
      </div>
      <div className="flex items-center gap-4 mb-4">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-tertiary" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Filter tokens..."
            className="w-full pl-9 pr-3 py-1.5 bg-surface-sunken border border-border font-mono text-xs text-white placeholder:text-text-tertiary focus:outline-none focus:border-primary transition-colors"
          />
        </div>
      </div>
      <div className="flex border-b border-border" role="tablist">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            role="tab"
            aria-selected={activeTab === tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`relative px-5 py-3 font-mono text-xs tracking-wider transition-colors ${
              activeTab === tab.id ? 'text-white' : 'text-text-secondary hover:text-white'
            }`}
          >
            {tab.label}
            <span className="text-text-tertiary ml-1.5">({tabCounts[tab.id]})</span>
            {activeTab === tab.id && (
              <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-primary" />
            )}
          </button>
        ))}
      </div>
    </div>
  )
}
