import { Plus, Clock, Layers } from 'lucide-react'
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
}: EditorHeaderProps) {
  const modeEntries = Object.values(modes)
  const hasModes = modeEntries.length > 0

  return (
    <div className="flex items-center justify-between pb-6 border-b border-border-default">
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
  )
}
