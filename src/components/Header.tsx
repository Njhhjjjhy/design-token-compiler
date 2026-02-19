import { Sun, Moon, HelpCircle } from 'lucide-react'
import type { ViewMode } from '@/types'

type NavItem = ViewMode
type Theme = 'light' | 'dark'

interface HeaderProps {
  activeView: NavItem
  onViewChange: (view: NavItem) => void
  activeSetName?: string
  activeModeName?: string | null
  syncStatus?: {
    status: 'synced' | 'conflicts' | 'unsynced'
    count?: number
  }
  theme: Theme
  onToggleTheme: () => void
  onStartTour?: () => void
}

export function Header({ activeView, onViewChange, activeSetName, activeModeName, syncStatus, theme, onToggleTheme, onStartTour }: HeaderProps) {
  const navItems: { id: NavItem; label: string; shortcut: string }[] = [
    { id: 'dashboard', label: 'HOME', shortcut: 'Meta+1' },
    { id: 'editor', label: 'EDITOR', shortcut: 'Meta+2' },
    { id: 'browser', label: 'BROWSER', shortcut: 'Meta+3' },
    { id: 'components', label: 'COMPONENTS', shortcut: 'Meta+4' },
    { id: 'compiler', label: 'COMPILER', shortcut: 'Meta+5' },
    { id: 'sync', label: 'SYNC', shortcut: 'Meta+6' },
  ]

  const statusColors = {
    synced: 'bg-success',
    conflicts: 'bg-warning',
    unsynced: 'bg-error',
  }

  const statusText = {
    synced: 'SYNCED',
    conflicts: `${syncStatus?.count || 0} CONFLICTS`,
    unsynced: 'UNSYNCED',
  }

  return (
    <header className="h-16 flex items-center compartment-border bg-surface">
      {/* Logo */}
      <div className="w-16 h-16 flex items-center justify-center border-r border-border">
        <div className="w-8 h-8 bg-primary" style={{ clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' }} />
      </div>

      {/* App Title + Active Set */}
      <div className="px-6 py-3 border-r border-border min-w-[240px]">
        <h1 className="monospace-label text-white mb-1">TOKEN COMPILER</h1>
        {activeSetName && (
          <div className="flex items-center gap-2 text-xs font-mono text-text-secondary">
            <span>{activeSetName}</span>
            {activeModeName && (
              <span className="px-1.5 py-0.5 bg-surface-elevated border border-border text-text-tertiary text-mini uppercase" aria-label={`Active mode: ${activeModeName}`}>
                {activeModeName}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 flex items-center h-full border-r border-border">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onViewChange(item.id)}
            aria-current={activeView === item.id ? 'page' : undefined}
            aria-keyshortcuts={item.shortcut}
            className={`
              relative h-full px-6 font-mono text-nav tracking-wider
              transition-colors hover:text-white
              ${activeView === item.id ? 'text-primary' : 'text-text-secondary'}
            `}
          >
            {item.label}
            {activeView === item.id && (
              <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-primary" />
            )}
          </button>
        ))}
      </nav>

      {/* Sync Status */}
      {syncStatus && (
        <div className="px-6 flex items-center gap-3">
          <div className={`w-2 h-2 rounded-full ${statusColors[syncStatus.status]}`} aria-hidden="true" />
          <span className="monospace-label text-text-secondary">
            {statusText[syncStatus.status]}
          </span>
        </div>
      )}

      {/* Help Button */}
      <div className="px-4 flex items-center border-l border-border h-full">
        <button
          onClick={onStartTour}
          className="p-2 text-text-secondary hover:text-white transition-colors"
          aria-label="Start guided tour"
        >
          <HelpCircle className="w-4 h-4" />
        </button>
      </div>

      {/* Theme Toggle */}
      <div className="px-4 flex items-center border-l border-border h-full">
        <button
          onClick={onToggleTheme}
          className="p-2 text-text-secondary hover:text-white transition-colors"
          aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>
      </div>
    </header>
  )
}
