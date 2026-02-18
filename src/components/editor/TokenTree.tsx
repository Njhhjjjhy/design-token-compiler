import { useMemo, useState, useCallback, useRef } from 'react'
import type { Token, TokenGroup, TokenSet, TokenValue } from '@/types'
import { TokenTreeNode } from './TokenTreeNode'
import { EmptyState } from './EmptyState'
import { TreeNavigationProvider, type TreeNavigationContextValue } from './TreeNavigationContext'
import { useTreeNavigation } from '@/hooks/useTreeNavigation'

const STORAGE_KEY = 'dtc-expanded-groups'

function getExpandedGroupsFromStorage(): Set<string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? new Set(JSON.parse(raw)) : new Set()
  } catch {
    return new Set()
  }
}

function saveExpandedGroupsToStorage(groups: Set<string>) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...groups]))
  } catch {
    // Ignore quota errors
  }
}

function filterTree(
  tokens: Record<string, Token | TokenGroup>,
  query: string,
  parentPath: string = ''
): Record<string, Token | TokenGroup> {
  const result: Record<string, Token | TokenGroup> = {}
  for (const [key, item] of Object.entries(tokens)) {
    const path = parentPath ? `${parentPath}.${key}` : key
    if ('tokens' in item) {
      const filtered = filterTree(item.tokens, query, path)
      if (Object.keys(filtered).length > 0) {
        result[key] = { ...item, tokens: filtered }
      }
    } else {
      if (path.toLowerCase().includes(query)) {
        result[key] = item
      }
    }
  }
  return result
}

interface TokenTreeProps {
  tokenSet: TokenSet
  activeMode: string | null
  searchQuery?: string
}

export function TokenTree({ tokenSet, activeMode, searchQuery = '' }: TokenTreeProps) {
  const hasTokens = Object.keys(tokenSet.tokens).length > 0
  const treeRef = useRef<HTMLDivElement>(null)
  const [isEditing, setIsEditing] = useState(false)

  // Lifted expand state
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(() => {
    const saved = getExpandedGroupsFromStorage()
    if (saved.size === 0) {
      for (const [key, item] of Object.entries(tokenSet.tokens)) {
        if ('tokens' in item) saved.add(key)
      }
    }
    return saved
  })

  const toggleGroup = useCallback((path: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev)
      if (next.has(path)) next.delete(path)
      else next.add(path)
      saveExpandedGroupsToStorage(next)
      return next
    })
  }, [])

  const expandGroup = useCallback((path: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev)
      next.add(path)
      saveExpandedGroupsToStorage(next)
      return next
    })
  }, [])

  const collapseGroup = useCallback((path: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev)
      next.delete(path)
      saveExpandedGroupsToStorage(next)
      return next
    })
  }, [])

  const returnFocusToTree = useCallback(() => {
    treeRef.current?.focus()
  }, [])

  const visibleTokens = useMemo(() => {
    if (!searchQuery) return tokenSet.tokens
    return filterTree(tokenSet.tokens, searchQuery.toLowerCase())
  }, [tokenSet.tokens, searchQuery])

  const modeOverrides: Record<string, TokenValue> = activeMode
    ? tokenSet.modes[activeMode]?.overrides ?? {}
    : {}

  const { focusedNodeId, setFocusedNodeId, handleKeyDown, activedescendant } = useTreeNavigation(
    visibleTokens,
    expandedGroups,
    { toggleGroup, expandGroup, collapseGroup },
    isEditing,
    treeRef
  )

  const ctxValue: TreeNavigationContextValue = useMemo(() => ({
    focusedNodeId,
    isEditing,
    setIsEditing,
    expandedGroups,
    toggleGroup,
    returnFocusToTree,
  }), [focusedNodeId, isEditing, expandedGroups, toggleGroup, returnFocusToTree])

  if (!hasTokens) {
    return <EmptyState />
  }

  if (searchQuery && Object.keys(visibleTokens).length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="font-mono text-sm text-text-secondary">No tokens match "{searchQuery}"</p>
      </div>
    )
  }

  return (
    <TreeNavigationProvider value={ctxValue}>
      <div
        ref={treeRef}
        className="space-y-1 focus:outline-none"
        role="tree"
        aria-label="Token tree"
        tabIndex={0}
        aria-activedescendant={activedescendant}
        onKeyDown={handleKeyDown}
        onFocus={() => {
          if (!focusedNodeId) {
            setFocusedNodeId(null)
          }
        }}
      >
        {Object.entries(visibleTokens).map(([key, item]) => (
          <TokenTreeNode
            key={key}
            itemKey={key}
            item={item}
            depth={0}
            activeMode={activeMode}
            modeOverrides={modeOverrides}
          />
        ))}
      </div>
    </TreeNavigationProvider>
  )
}
