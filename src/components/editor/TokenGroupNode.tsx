import { useState } from 'react'
import { ChevronRight } from 'lucide-react'
import type { TokenGroup } from '@/types'
import { TokenTreeNode } from './TokenTreeNode'

interface TokenGroupNodeProps {
  group: TokenGroup
  groupKey: string
  depth: number
}

export function TokenGroupNode({ group, groupKey, depth }: TokenGroupNodeProps) {
  // Top-level groups start expanded, nested groups start collapsed
  const [isExpanded, setIsExpanded] = useState(depth === 0)
  const paddingLeft = depth * 16

  const toggleExpand = () => {
    setIsExpanded(!isExpanded)
  }

  return (
    <div>
      {/* Group Header */}
      <button
        onClick={toggleExpand}
        className="w-full flex items-center gap-2 py-2 hover:bg-white/5 transition-colors text-left"
        style={{ paddingLeft: `${paddingLeft}px` }}
      >
        <ChevronRight
          className={`w-4 h-4 text-text-secondary transition-transform duration-200 ${
            isExpanded ? 'rotate-90' : ''
          }`}
        />
        <span className="font-mono text-sm font-semibold text-text-primary">
          {groupKey}
        </span>
        <span className="text-xs text-text-tertiary font-mono">
          ({Object.keys(group.tokens).length})
        </span>
      </button>

      {/* Children (when expanded) */}
      {isExpanded && (
        <div>
          {Object.entries(group.tokens).map(([key, item]) => (
            <TokenTreeNode
              key={key}
              itemKey={key}
              item={item}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  )
}
