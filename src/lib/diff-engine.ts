import type { FlatToken } from '@/lib/flatten-tokens'

export type DiffStatus = 'same' | 'different' | 'editor_only' | 'file_only'

export interface DiffRow {
  path: string
  status: DiffStatus
  editorToken?: FlatToken
  fileToken?: FlatToken
  group: string // top-level category for grouping (e.g., "color", "spacing")
}

export interface DiffResult {
  rows: DiffRow[]
  stats: {
    same: number
    different: number
    editorOnly: number
    fileOnly: number
    total: number
  }
}

/**
 * Normalize a value for comparison.
 * - Lowercase hex colors
 * - Trim whitespace
 */
function normalizeValue(value: string): string {
  let normalized = value.trim()

  // Lowercase hex colors
  if (/^#[0-9a-fA-F]{3,8}$/.test(normalized)) {
    normalized = normalized.toLowerCase()
  }

  return normalized
}

/**
 * Compare editor tokens against imported file tokens.
 * Returns a categorized list of all tokens from both sides.
 */
export function diffTokens(
  editorTokens: FlatToken[],
  fileTokens: FlatToken[]
): DiffResult {
  const editorMap = new Map<string, FlatToken>()
  const fileMap = new Map<string, FlatToken>()

  editorTokens.forEach((t) => editorMap.set(t.path, t))
  fileTokens.forEach((t) => fileMap.set(t.path, t))

  // Collect all unique paths
  const allPaths = new Set<string>([
    ...editorMap.keys(),
    ...fileMap.keys(),
  ])

  const rows: DiffRow[] = []
  let same = 0
  let different = 0
  let editorOnly = 0
  let fileOnly = 0

  for (const path of allPaths) {
    const editorToken = editorMap.get(path)
    const fileToken = fileMap.get(path)
    const group = path.split('.')[0]

    if (editorToken && fileToken) {
      // Both sides have this token — compare values
      const editorNorm = normalizeValue(editorToken.value)
      const fileNorm = normalizeValue(fileToken.value)

      if (editorNorm === fileNorm) {
        rows.push({ path, status: 'same', editorToken, fileToken, group })
        same++
      } else {
        rows.push({ path, status: 'different', editorToken, fileToken, group })
        different++
      }
    } else if (editorToken) {
      rows.push({ path, status: 'editor_only', editorToken, group })
      editorOnly++
    } else if (fileToken) {
      rows.push({ path, status: 'file_only', fileToken, group })
      fileOnly++
    }
  }

  // Sort: different first, then editor_only, then file_only, then same
  // Within each status, sort by path
  const statusOrder: Record<DiffStatus, number> = {
    different: 0,
    editor_only: 1,
    file_only: 2,
    same: 3,
  }

  rows.sort((a, b) => {
    // First by group
    const groupCmp = a.group.localeCompare(b.group)
    if (groupCmp !== 0) return groupCmp
    // Then by status
    const statusCmp = statusOrder[a.status] - statusOrder[b.status]
    if (statusCmp !== 0) return statusCmp
    // Then by path
    return a.path.localeCompare(b.path)
  })

  return {
    rows,
    stats: {
      same,
      different,
      editorOnly,
      fileOnly,
      total: same + different + editorOnly + fileOnly,
    },
  }
}
