import { Plus, Clock, Layers, Search, ChevronsUpDown } from 'lucide-react'
import type { ModeMap } from '@/types'

interface EditorHeaderProps {
  onAddToken: () => void
  onOpenVersions: () => void
  onOpenModes: () => void
  onExpandAll: () => void
  onCollapseAll: () => void
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
  onExpandAll,
  onCollapseAll,
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
    <div className="pb-6 border-b border-border">
      <div className="flex items-center justify-between">
      <div className="flex items-center gap-4">
        <h2 className="section-title text-primary">TOKEN EDITOR</h2>
        {hasModes && (
          <div className="flex border border-border" role="radiogroup" aria-label="Token mode">
            <button
              role="radio"
              aria-checked={activeMode === null}
              onClick={() => onModeChange(null)}
              className={`px-3 py-1 font-mono text-xs transition-colors ${
                activeMode === null ? 'bg-surface-elevated text-white' : 'text-text-secondary hover:text-white'
              }`}
              aria-label="Base: default token values with no mode overrides"
            >
              BASE
            </button>
            {modeEntries.map((mode) => (
              <button
                key={mode.id}
                role="radio"
                aria-checked={activeMode === mode.id}
                onClick={() => onModeChange(mode.id)}
                className={`px-3 py-1 font-mono text-xs transition-colors border-l border-border ${
                  activeMode === mode.id ? 'bg-surface-elevated text-white' : 'text-text-secondary hover:text-white'
                }`}
                aria-label={`${mode.name}: view tokens with ${mode.name} overrides applied`}
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
          aria-label="Modes: manage alternate token value sets (e.g. dark mode, compact)"
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
          aria-label="Versions: save and restore token snapshots"
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
      <div className="flex items-center gap-3 mt-4">
        <div className="relative max-w-xs flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-tertiary" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Filter tokens..."
            aria-label="Filter tokens"
            className="w-full pl-9 pr-3 py-1.5 bg-surface-sunken border border-border font-mono text-xs text-white placeholder:text-text-tertiary focus:outline-none focus:border-primary transition-colors"
          />
        </div>
        <div className="flex border border-border">
          <button
            onClick={onExpandAll}
            className="flex items-center gap-1 px-2 py-1 font-mono text-mini text-text-secondary hover:text-white transition-colors"
            aria-label="Expand all groups"
          >
            <ChevronsUpDown className="w-3 h-3" />
            Expand
          </button>
          <button
            onClick={onCollapseAll}
            className="px-2 py-1 font-mono text-mini text-text-secondary hover:text-white border-l border-border transition-colors"
            aria-label="Collapse all groups"
          >
            Collapse
          </button>
        </div>
      </div>
    </div>
  )
}
