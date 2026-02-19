import { useState, useRef, useEffect, useMemo } from 'react'
import { Search, X, ChevronDown } from 'lucide-react'
import type { ResolvedToken, ResolvedTokenMap } from '@/types'

interface TokenPickerProps {
  value: string | null          // currently bound token path
  resolvedTokens: ResolvedTokenMap
  onSelect: (tokenPath: string) => void
  onClear: () => void
  placeholder?: string
}

function TokenSwatch({ token }: { token: ResolvedToken }) {
  if (token.type === 'color') {
    return (
      <span
        className="w-4 h-4 rounded-sm flex-shrink-0 border border-white/20"
        style={{ backgroundColor: String(token.resolvedValue) }}
        aria-hidden="true"
      />
    )
  }
  if (token.type === 'dimension') {
    return (
      <span
        className="w-4 h-2 flex-shrink-0 bg-text-secondary rounded-sm"
        style={{ width: `${Math.min(parseInt(String(token.resolvedValue)) / 4, 16)}px`, minWidth: '2px' }}
        aria-hidden="true"
      />
    )
  }
  return <span className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
}

export function TokenPicker({ value, resolvedTokens, onSelect, onClear, placeholder = 'Bind token...' }: TokenPickerProps) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const currentToken = value ? resolvedTokens[value] : null

  const filtered = useMemo(() => {
    const entries = Object.entries(resolvedTokens) as [string, ResolvedToken][]
    if (!query) return entries.slice(0, 50)
    const q = query.toLowerCase()
    return entries.filter(([path]) => path.toLowerCase().includes(q)).slice(0, 50)
  }, [resolvedTokens, query])

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50)
    } else {
      setQuery('')
    }
  }, [open])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [open])

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`
          w-full flex items-center gap-2 px-2.5 py-1.5 text-left
          border rounded text-xs font-mono transition-colors
          ${value
            ? 'border-primary/30 bg-primary/5 text-white hover:border-primary/60'
            : 'border-border bg-surface-elevated text-text-tertiary hover:border-border-strong hover:text-text-secondary'
          }
        `}
      >
        {currentToken && <TokenSwatch token={currentToken} />}
        <span className="flex-1 truncate">
          {value || placeholder}
        </span>
        {value ? (
          <span
            role="button"
            tabIndex={0}
            onClick={(e) => { e.stopPropagation(); onClear() }}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.stopPropagation(); onClear() } }}
            className="text-text-tertiary hover:text-white transition-colors"
            aria-label="Clear binding"
          >
            <X className="w-3 h-3" />
          </span>
        ) : (
          <ChevronDown className="w-3 h-3 text-text-tertiary" />
        )}
      </button>

      {open && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-surface border border-border rounded shadow-xl">
          <div className="flex items-center gap-2 px-2.5 py-2 border-b border-border">
            <Search className="w-3 h-3 text-text-tertiary flex-shrink-0" />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search tokens..."
              className="flex-1 bg-transparent font-mono text-xs text-white placeholder-text-tertiary outline-none"
            />
          </div>
          <div className="max-h-48 overflow-y-auto">
            {filtered.length === 0 ? (
              <div className="px-3 py-2 font-mono text-xs text-text-tertiary">No tokens found</div>
            ) : (
              filtered.map(([path, token]) => (
                <button
                  key={path}
                  type="button"
                  onClick={() => { onSelect(path); setOpen(false) }}
                  className={`
                    w-full flex items-center gap-2 px-2.5 py-1.5 text-left
                    font-mono text-xs transition-colors
                    ${path === value
                      ? 'bg-primary/10 text-primary'
                      : 'text-text-secondary hover:bg-surface-elevated hover:text-white'
                    }
                  `}
                >
                  <TokenSwatch token={token} />
                  <span className="flex-1 truncate">{path}</span>
                  <span className="text-text-tertiary flex-shrink-0 truncate max-w-[80px]">
                    {String(token.resolvedValue).substring(0, 12)}
                  </span>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
