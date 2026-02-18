import { useMemo } from 'react'
import type { Token, TokenGroup, TokenSet, TokenValue } from '@/types'
import { TokenTreeNode } from './TokenTreeNode'
import { EmptyState } from './EmptyState'

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

  const visibleTokens = useMemo(() => {
    if (!searchQuery) return tokenSet.tokens
    return filterTree(tokenSet.tokens, searchQuery.toLowerCase())
  }, [tokenSet.tokens, searchQuery])

  if (!hasTokens) {
    return <EmptyState />
  }

  const modeOverrides: Record<string, TokenValue> = activeMode
    ? tokenSet.modes[activeMode]?.overrides ?? {}
    : {}

  if (searchQuery && Object.keys(visibleTokens).length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="font-mono text-sm text-text-secondary">No tokens match "{searchQuery}"</p>
      </div>
    )
  }

  return (
    <div className="space-y-1" role="tree" aria-label="Token tree">
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
  )
}
