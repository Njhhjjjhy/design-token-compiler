import type { Token, TokenGroup, TokenValue } from '@/types'
import { TokenGroupNode } from './TokenGroupNode'
import { TokenValueNode } from './TokenValueNode'

interface TokenTreeNodeProps {
  itemKey: string
  item: Token | TokenGroup
  depth: number
  activeMode: string | null
  modeOverrides: Record<string, TokenValue>
  parentPath?: string
}

export function TokenTreeNode({ itemKey, item, depth, activeMode, modeOverrides, parentPath = '' }: TokenTreeNodeProps) {
  const isGroup = 'tokens' in item
  const fullPath = parentPath ? `${parentPath}.${itemKey}` : itemKey

  if (isGroup) {
    return (
      <TokenGroupNode
        group={item}
        groupKey={itemKey}
        depth={depth}
        activeMode={activeMode}
        modeOverrides={modeOverrides}
        path={fullPath}
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
