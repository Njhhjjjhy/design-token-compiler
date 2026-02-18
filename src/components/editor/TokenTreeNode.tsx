import type { Token, TokenGroup, TokenValue } from '@/types'
import { TokenGroupNode } from './TokenGroupNode'
import { TokenValueNode } from './TokenValueNode'

interface TokenTreeNodeProps {
  itemKey: string
  item: Token | TokenGroup
  depth: number
  activeMode: string | null
  modeOverrides: Record<string, TokenValue>
}

export function TokenTreeNode({ itemKey, item, depth, activeMode, modeOverrides }: TokenTreeNodeProps) {
  const isGroup = 'tokens' in item

  if (isGroup) {
    return (
      <TokenGroupNode
        group={item}
        groupKey={itemKey}
        depth={depth}
        activeMode={activeMode}
        modeOverrides={modeOverrides}
      />
    )
  } else {
    return (
      <TokenValueNode
        token={item}
        depth={depth}
        activeMode={activeMode}
        modeOverrides={modeOverrides}
      />
    )
  }
}
