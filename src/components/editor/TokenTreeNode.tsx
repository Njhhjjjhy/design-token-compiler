import type { Token, TokenGroup } from '@/types'
import { TokenGroupNode } from './TokenGroupNode'
import { TokenValueNode } from './TokenValueNode'

interface TokenTreeNodeProps {
  itemKey: string
  item: Token | TokenGroup
  depth: number
}

export function TokenTreeNode({ itemKey, item, depth }: TokenTreeNodeProps) {
  // Check if this is a group or a token
  const isGroup = 'tokens' in item

  if (isGroup) {
    return <TokenGroupNode group={item} groupKey={itemKey} depth={depth} />
  } else {
    return <TokenValueNode token={item} depth={depth} />
  }
}
