import { AnimatePresence, motion } from 'framer-motion'
import { ChevronRight } from 'lucide-react'
import { motionConfig } from '@/lib/motion'
import type { TokenGroup, TokenValue } from '@/types'
import { TokenTreeNode } from './TokenTreeNode'
import { useTreeNavigationContext } from './TreeNavigationContext'
import { sanitizeNodeId } from '@/lib/build-visible-node-list'

interface TokenGroupNodeProps {
  group: TokenGroup
  groupKey: string
  depth: number
  activeMode: string | null
  modeOverrides: Record<string, TokenValue>
  path?: string
}

export function TokenGroupNode({ group, groupKey, depth, activeMode, modeOverrides, path }: TokenGroupNodeProps) {
  const groupPath = path || groupKey
  const { expandedGroups, toggleGroup, focusedNodeId } = useTreeNavigationContext()
  const isExpanded = expandedGroups.has(groupPath)
  const isFocused = focusedNodeId === groupPath
  const paddingLeft = depth * 16

  return (
    <div
      role="treeitem"
      aria-expanded={isExpanded}
      id={sanitizeNodeId(groupPath)}
      data-node-id={groupPath}
    >
      {/* Group Header */}
      <button
        onClick={() => toggleGroup(groupPath)}
        aria-expanded={isExpanded}
        tabIndex={-1}
        className={`w-full flex items-center gap-2 py-2 hover:bg-white/5 transition-colors text-left ${
          isFocused ? 'outline outline-2 outline-primary outline-offset-[-2px] rounded' : ''
        }`}
        style={{ paddingLeft: `${paddingLeft}px` }}
      >
        <ChevronRight
          className={`w-4 h-4 text-text-secondary transition-transform duration-200 ${
            isExpanded ? 'rotate-90' : ''
          }`}
        />
        <span className="font-mono text-sm font-semibold text-white">
          {groupKey}
        </span>
        <span className="text-xs text-text-tertiary font-mono">
          ({Object.keys(group.tokens).length})
        </span>
      </button>

      {/* Children (when expanded) */}
      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            role="group"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={motionConfig.collapse}
            style={{ overflow: 'hidden' }}
          >
            {Object.entries(group.tokens).map(([key, item]) => (
              <TokenTreeNode
                key={key}
                itemKey={key}
                item={item}
                depth={depth + 1}
                activeMode={activeMode}
                modeOverrides={modeOverrides}
                parentPath={groupPath}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
