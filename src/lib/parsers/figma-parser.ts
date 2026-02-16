import type { FlatToken } from '@/lib/flatten-tokens'

/**
 * Figma Variable export structure (simplified).
 * Figma exports JSON with this shape:
 * {
 *   "variables": [
 *     {
 *       "name": "color/primary/500",
 *       "type": "COLOR",
 *       "resolvedValuesByMode": {
 *         "<modeId>": { "resolvedValue": { "r": 0.96, "g": 0.05, "b": 0.25, "a": 1 } }
 *       }
 *     }
 *   ],
 *   "variableCollections": [...]
 * }
 */

interface FigmaVariable {
  name: string
  type: string
  resolvedValuesByMode: Record<string, {
    resolvedValue: unknown
  }>
}

interface FigmaExport {
  variables: FigmaVariable[]
  variableCollections?: unknown[]
}

/**
 * Parse Figma Variables JSON export into flat tokens.
 *
 * Figma uses "/" as path separator (e.g., "color/primary/500").
 * We convert to dot notation: "color.primary.500".
 *
 * Figma color values are RGBA objects { r, g, b, a } with 0-1 ranges.
 * We convert to hex strings.
 */
export function parseFigmaJSON(content: string): FlatToken[] {
  let data: FigmaExport
  try {
    data = JSON.parse(content)
  } catch {
    throw new Error('Invalid JSON format')
  }

  if (!data.variables || !Array.isArray(data.variables)) {
    throw new Error('Not a valid Figma Variables export (missing "variables" array)')
  }

  const tokens: FlatToken[] = []

  for (const variable of data.variables) {
    // Convert Figma path separator "/" to dots
    const path = variable.name.replace(/\//g, '.')
    const name = path.split('.').pop() || variable.name

    // Get the first mode's resolved value
    const modeIds = Object.keys(variable.resolvedValuesByMode || {})
    if (modeIds.length === 0) continue

    const resolved = variable.resolvedValuesByMode[modeIds[0]]?.resolvedValue
    if (resolved === undefined || resolved === null) continue

    const type = figmaTypeToTokenType(variable.type)
    const value = convertFigmaValue(resolved, variable.type)

    tokens.push({ path, name, value, type })
  }

  return tokens
}

/**
 * Convert Figma variable type to our token type.
 */
function figmaTypeToTokenType(figmaType: string): string {
  switch (figmaType.toUpperCase()) {
    case 'COLOR': return 'color'
    case 'FLOAT': return 'number'
    case 'STRING': return 'fontFamily'
    case 'BOOLEAN': return 'number'
    default: return 'color'
  }
}

/**
 * Convert a Figma resolved value to a string.
 *
 * Figma colors are { r, g, b, a } with 0-1 ranges.
 * We convert to hex.
 */
function convertFigmaValue(value: unknown, type: string): string {
  if (typeof value === 'string') return value
  if (typeof value === 'number') return String(value)
  if (typeof value === 'boolean') return value ? '1' : '0'

  // Handle Figma color objects
  if (type.toUpperCase() === 'COLOR' && typeof value === 'object' && value !== null) {
    const color = value as { r: number; g: number; b: number; a: number }
    const r = Math.round((color.r ?? 0) * 255)
    const g = Math.round((color.g ?? 0) * 255)
    const b = Math.round((color.b ?? 0) * 255)

    const hex = `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`

    // Include alpha if not fully opaque
    if (color.a !== undefined && color.a < 1) {
      const a = Math.round(color.a * 255)
      return `${hex}${a.toString(16).padStart(2, '0')}`
    }

    return hex
  }

  return JSON.stringify(value)
}

/**
 * Check if a parsed JSON object looks like a Figma Variables export.
 */
export function isFigmaFormat(data: Record<string, unknown>): boolean {
  return Array.isArray(data.variables)
}
