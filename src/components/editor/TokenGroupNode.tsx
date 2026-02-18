import { useState, useCallback } from 'react'
import { ChevronRight } from 'lucide-react'
import type { TokenGroup, TokenValue } from '@/types'
import { TokenTreeNode } from './TokenTreeNode'

const STORAGE_KEY = 'dtc-expanded-groups'

function getExpandedGroups(): Set<string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? new Set(JSON.parse(raw)) : new Set()
  } catch {
    return new Set()
  }
}

function saveExpandedGroups(groups: Set<string>) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...groups]))
  } catch {
    // Ignore quota errors
  }
}

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
  const [isExpanded, setIsExpanded] = useState(() => {
    const saved = getExpandedGroups()
    if (saved.has(groupPath)) return true
    if (saved.size === 0) return depth === 0
    return false
  })
  const paddingLeft = depth * 16

  const toggleExpand = useCallback(() => {
    setIsExpanded((prev) => {
      const next = !prev
      const groups = getExpandedGroups()
      if (next) {
        groups.add(groupPath)
      } else {
        groups.delete(groupPath)
      }
      saveExpandedGroups(groups)
      return next
    })
  }, [groupPath])

  return (
    <div role="treeitem" aria-expanded={isExpanded}>
      {/* Group Header */}
      <button
        onClick={toggleExpand}
        aria-expanded={isExpanded}
        className="w-full flex items-center gap-2 py-2 hover:bg-white/5 transition-colors text-left"
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
      {isExpanded && (
        <div role="group">
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
        </div>
      )}
    </div>
  )
}
