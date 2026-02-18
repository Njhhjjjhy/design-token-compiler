import { useState, useCallback, useMemo, useEffect } from 'react'
import type { Token, TokenGroup } from '@/types'
import { buildVisibleNodeList, sanitizeNodeId, type TreeNodeDescriptor } from '@/lib/build-visible-node-list'

interface TreeNavigationCallbacks {
  toggleGroup: (path: string) => void
  expandGroup: (path: string) => void
  collapseGroup: (path: string) => void
}

export function useTreeNavigation(
  tokens: Record<string, Token | TokenGroup>,
  expandedGroups: Set<string>,
  callbacks: TreeNavigationCallbacks,
  isEditing: boolean,
  treeRef: React.RefObject<HTMLDivElement | null>
) {
  const [focusedNodeId, setFocusedNodeId] = useState<string | null>(null)

  const visibleNodes = useMemo(
    () => buildVisibleNodeList(tokens, expandedGroups),
    [tokens, expandedGroups]
  )

  // Reset focused node if it gets filtered out
  useEffect(() => {
    if (focusedNodeId && !visibleNodes.some((n) => n.nodeId === focusedNodeId)) {
      setFocusedNodeId(visibleNodes.length > 0 ? visibleNodes[0].nodeId : null)
    }
  }, [visibleNodes, focusedNodeId])

  // Scroll the focused node into view
  useEffect(() => {
    if (focusedNodeId && treeRef.current) {
      const el = treeRef.current.querySelector(`[data-node-id="${CSS.escape(focusedNodeId)}"]`) as HTMLElement
      el?.scrollIntoView({ block: 'nearest' })
    }
  }, [focusedNodeId, treeRef])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (isEditing) return

    const currentIndex = visibleNodes.findIndex((n) => n.nodeId === focusedNodeId)
    const currentNode: TreeNodeDescriptor | null = currentIndex >= 0 ? visibleNodes[currentIndex] : null

    switch (e.key) {
      case 'ArrowDown': {
        e.preventDefault()
        const next = currentIndex + 1
        if (next < visibleNodes.length) {
          setFocusedNodeId(visibleNodes[next].nodeId)
        }
        break
      }
      case 'ArrowUp': {
        e.preventDefault()
        const prev = currentIndex - 1
        if (prev >= 0) {
          setFocusedNodeId(visibleNodes[prev].nodeId)
        }
        break
      }
      case 'ArrowRight': {
        e.preventDefault()
        if (currentNode?.kind === 'group') {
          if (!expandedGroups.has(currentNode.path)) {
            callbacks.expandGroup(currentNode.path)
          } else {
            // Already open, move to first child
            const next = currentIndex + 1
            if (next < visibleNodes.length && visibleNodes[next].parentPath === currentNode.path) {
              setFocusedNodeId(visibleNodes[next].nodeId)
            }
          }
        }
        break
      }
      case 'ArrowLeft': {
        e.preventDefault()
        if (currentNode?.kind === 'group' && expandedGroups.has(currentNode.path)) {
          callbacks.collapseGroup(currentNode.path)
        } else if (currentNode?.parentPath) {
          const parent = visibleNodes.find((n) => n.path === currentNode.parentPath)
          if (parent) setFocusedNodeId(parent.nodeId)
        }
        break
      }
      case 'Home': {
        e.preventDefault()
        if (visibleNodes.length > 0) {
          setFocusedNodeId(visibleNodes[0].nodeId)
        }
        break
      }
      case 'End': {
        e.preventDefault()
        if (visibleNodes.length > 0) {
          setFocusedNodeId(visibleNodes[visibleNodes.length - 1].nodeId)
        }
        break
      }
      case 'Enter':
      case ' ': {
        e.preventDefault()
        if (currentNode?.kind === 'group') {
          callbacks.toggleGroup(currentNode.path)
        } else if (currentNode?.kind === 'value') {
          // Programmatically click the edit trigger
          const nodeEl = treeRef.current?.querySelector(`[data-node-id="${CSS.escape(currentNode.nodeId)}"]`)
          const editBtn = nodeEl?.querySelector('[data-role="edit-trigger"]') as HTMLElement
          editBtn?.click()
        }
        break
      }
    }
  }, [focusedNodeId, visibleNodes, expandedGroups, isEditing, callbacks, treeRef])

  const activedescendant = focusedNodeId ? sanitizeNodeId(focusedNodeId) : undefined

  return { focusedNodeId, setFocusedNodeId, handleKeyDown, visibleNodes, activedescendant }
}
