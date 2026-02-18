import { Sun, Moon } from 'lucide-react'

type NavItem = 'dashboard' | 'editor' | 'browser' | 'compiler' | 'sync'
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
}

export function Header({ activeView, onViewChange, activeSetName, activeModeName, syncStatus, theme, onToggleTheme }: HeaderProps) {
  const navItems: { id: NavItem; label: string }[] = [
    { id: 'dashboard', label: 'HOME' },
    { id: 'editor', label: 'EDITOR' },
    { id: 'browser', label: 'BROWSER' },
    { id: 'compiler', label: 'COMPILER' },
    { id: 'sync', label: 'SYNC' },
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
              <span className="px-1.5 py-0.5 bg-surface-elevated border border-border text-text-tertiary text-mini uppercase">
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
