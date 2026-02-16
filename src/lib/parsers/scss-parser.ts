import type { FlatToken } from '@/lib/flatten-tokens'

/**
 * Parse SCSS variable declarations into flat tokens.
 *
 * Input format:
 *   $color-primary: #f40c3f;
 *   $spacing-4: 16px;
 *
 * Skips maps ($dark-mode-tokens: (...)) and mixins.
 */
export function parseScss(content: string): FlatToken[] {
  const tokens: FlatToken[] = []

  // Match SCSS variable declarations: $name: value;
  // Skip map declarations (value starts with "(")
  const varRegex = /^\$([a-zA-Z0-9-]+)\s*:\s*([^;(]+);/gm
  let match: RegExpExecArray | null

  while ((match = varRegex.exec(content)) !== null) {
    const rawName = match[1].trim()
    const value = match[2].trim()

    // Convert kebab-case to dot notation
    const path = rawName.replace(/-/g, '.')

    tokens.push({
      path,
      name: path.split('.').pop() || rawName,
      value,
      type: inferTokenType(value),
    })
  }

  return tokens
}

/**
 * Infer token type from a SCSS value string.
 */
function inferTokenType(value: string): string {
  if (value.startsWith('#') || value.startsWith('rgb') || value.startsWith('hsl')) {
    return 'color'
  }
  if (/^-?\d+(\.\d+)?(px|rem|em|%|vh|vw|pt|cm|mm|in)$/.test(value)) {
    return 'dimension'
  }
  if (/^-?\d+(\.\d+)?$/.test(value)) {
    return 'number'
  }
  if (/^-?\d+(\.\d+)?(ms|s)$/.test(value)) {
    return 'duration'
  }
  if (value.includes(',') || /^['"]/.test(value)) {
    return 'fontFamily'
  }
  return 'color'
}
