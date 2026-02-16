import type { FlatToken } from '@/lib/flatten-tokens'

/**
 * Parse CSS custom properties into flat tokens.
 * Handles :root blocks and [data-theme] blocks.
 *
 * Input format:
 *   :root { --color-primary: #f40c3f; --spacing-4: 16px; }
 *
 * Output: FlatToken[] with paths like "color.primary", "spacing.4"
 */
export function parseCss(content: string): FlatToken[] {
  const tokens: FlatToken[] = []

  // Match all CSS custom property declarations: --name: value;
  const varRegex = /--([a-zA-Z0-9-]+)\s*:\s*([^;]+);/g
  let match: RegExpExecArray | null

  while ((match = varRegex.exec(content)) !== null) {
    const rawName = match[1].trim()
    const value = match[2].trim()

    // Convert kebab-case to dot notation: "color-semantic-primary" -> "color.semantic.primary"
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
 * Infer token type from a CSS value string.
 */
function inferTokenType(value: string): string {
  // Color patterns
  if (value.startsWith('#') || value.startsWith('rgb') || value.startsWith('hsl')) {
    return 'color'
  }
  // Dimension patterns
  if (/^-?\d+(\.\d+)?(px|rem|em|%|vh|vw|pt|cm|mm|in)$/.test(value)) {
    return 'dimension'
  }
  // Number
  if (/^-?\d+(\.\d+)?$/.test(value)) {
    return 'number'
  }
  // Duration
  if (/^-?\d+(\.\d+)?(ms|s)$/.test(value)) {
    return 'duration'
  }
  // Font family (quoted or comma-separated)
  if (value.includes(',') || /^['"]/.test(value)) {
    return 'fontFamily'
  }
  // Default
  return 'color'
}
