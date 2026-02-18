import type { TokenSet } from '@/types'
import type { TokenValue } from '@/types'
import { TokenTreeNode } from './TokenTreeNode'
import { EmptyState } from './EmptyState'

interface TokenTreeProps {
  tokenSet: TokenSet
  activeMode: string | null
}

export function TokenTree({ tokenSet, activeMode }: TokenTreeProps) {
  const hasTokens = Object.keys(tokenSet.tokens).length > 0

  if (!hasTokens) {
    return <EmptyState />
  }

  const modeOverrides: Record<string, TokenValue> = activeMode
    ? tokenSet.modes[activeMode]?.overrides ?? {}
    : {}

  return (
    <div className="space-y-1">
      {Object.entries(tokenSet.tokens).map(([key, item]) => (
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
