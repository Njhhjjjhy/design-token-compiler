import type { Token, TokenGroup } from '@/types'

export interface TreeNodeDescriptor {
  nodeId: string
  kind: 'group' | 'value'
  path: string
  parentPath: string | null
  depth: number
}

export function buildVisibleNodeList(
  tokens: Record<string, Token | TokenGroup>,
  expandedGroups: Set<string>,
  parentPath: string | null = null,
  depth: number = 0
): TreeNodeDescriptor[] {
  const result: TreeNodeDescriptor[] = []

  for (const [key, item] of Object.entries(tokens)) {
    const path = parentPath ? `${parentPath}.${key}` : key

    if ('tokens' in item) {
      result.push({
        nodeId: path,
        kind: 'group',
        path,
        parentPath,
        depth,
      })
      if (expandedGroups.has(path)) {
        result.push(...buildVisibleNodeList(item.tokens, expandedGroups, path, depth + 1))
      }
    } else {
      result.push({
        nodeId: item.id,
        kind: 'value',
        path,
        parentPath,
        depth,
      })
    }
  }

  return result
}

export function sanitizeNodeId(nodeId: string): string {
  return `treenode-${nodeId.replace(/\./g, '-')}`
}
