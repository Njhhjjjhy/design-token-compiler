import { Plus, Clock, Layers, Search } from 'lucide-react'
import type { ModeMap } from '@/types'

interface EditorHeaderProps {
  onAddToken: () => void
  onOpenVersions: () => void
  onOpenModes: () => void
  versionCount: number
  modeCount: number
  modes: ModeMap
  activeMode: string | null
  onModeChange: (modeId: string | null) => void
  searchQuery: string
  onSearchChange: (query: string) => void
}

export function EditorHeader({
  onAddToken,
  onOpenVersions,
  onOpenModes,
  versionCount,
  modeCount,
  modes,
  activeMode,
  onModeChange,
  searchQuery,
  onSearchChange,
}: EditorHeaderProps) {
  const modeEntries = Object.values(modes)
  const hasModes = modeEntries.length > 0

  return (
    <div className="pb-6 border-b border-border-default">
      <div className="flex items-center justify-between">
      <div className="flex items-center gap-4">
        <h2 className="section-title text-primary">TOKEN EDITOR</h2>
        {hasModes && (
          <div className="flex border border-border">
            <button
              onClick={() => onModeChange(null)}
              className={`px-3 py-1 font-mono text-xs transition-colors ${
                activeMode === null ? 'bg-surface-elevated text-white' : 'text-text-secondary hover:text-white'
              }`}
            >
              BASE
            </button>
            {modeEntries.map((mode, i) => (
              <button
                key={mode.id}
                onClick={() => onModeChange(mode.id)}
                className={`px-3 py-1 font-mono text-xs transition-colors border-l border-border ${
                  activeMode === mode.id ? 'bg-surface-elevated text-white' : 'text-text-secondary hover:text-white'
                }`}
              >
                {mode.name.toUpperCase()}
              </button>
            ))}
          </div>
        )}
      </div>
      <div className="flex gap-3">
        <button
          onClick={onOpenModes}
          className="flex items-center gap-2 px-4 py-2 bg-surface-elevated border border-border hover:border-primary text-white font-mono text-sm transition-colors"
        >
          <Layers className="w-4 h-4" />
          Modes
          {modeCount > 0 && (
            <span className="text-text-secondary">({modeCount})</span>
          )}
        </button>
        <button
          onClick={onOpenVersions}
          className="flex items-center gap-2 px-4 py-2 bg-surface-elevated border border-border hover:border-primary text-white font-mono text-sm transition-colors"
        >
          <Clock className="w-4 h-4" />
          Versions
          {versionCount > 0 && (
            <span className="text-text-secondary">({versionCount})</span>
          )}
        </button>
        <button
          onClick={onAddToken}
          className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 text-white font-mono text-sm rounded transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Token
        </button>
      </div>
      </div>
      <div className="relative mt-4 max-w-xs">
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
  )
}
