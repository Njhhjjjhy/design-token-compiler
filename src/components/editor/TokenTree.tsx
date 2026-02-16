import type { TokenSet } from '@/types'
import { TokenTreeNode } from './TokenTreeNode'
import { EmptyState } from './EmptyState'

interface TokenTreeProps {
  tokenSet: TokenSet
}

export function TokenTree({ tokenSet }: TokenTreeProps) {
  const hasTokens = Object.keys(tokenSet.tokens).length > 0

  if (!hasTokens) {
    return <EmptyState />
  }

  return (
    <div className="space-y-1">
      {Object.entries(tokenSet.tokens).map(([key, item]) => (
        <TokenTreeNode key={key} itemKey={key} item={item} depth={0} />
      ))}
    </div>
  )
}
