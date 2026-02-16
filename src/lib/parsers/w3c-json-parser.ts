import type { FlatToken } from '@/lib/flatten-tokens'

/**
 * Parse W3C Design Tokens Community Group JSON format.
 *
 * Recognizes token objects by the presence of "$value" property.
 * Recursively traverses nested groups.
 */
export function parseW3CJSON(content: string): FlatToken[] {
  let data: Record<string, unknown>
  try {
    data = JSON.parse(content)
  } catch {
    throw new Error('Invalid JSON format')
  }

  const tokens: FlatToken[] = []
  traverseW3C(data, '', tokens)
  return tokens
}

function traverseW3C(
  obj: Record<string, unknown>,
  prefix: string,
  tokens: FlatToken[]
): void {
  for (const [key, value] of Object.entries(obj)) {
    // Skip $extensions and other $ metadata at the root
    if (key.startsWith('$')) continue

    const path = prefix ? `${prefix}.${key}` : key

    if (typeof value === 'object' && value !== null) {
      const record = value as Record<string, unknown>

      // Check if this is a token (has $value)
      if ('$value' in record) {
        const tokenValue = record.$value
        const tokenType = (record.$type as string) || 'color'

        tokens.push({
          path,
          name: key,
          value: typeof tokenValue === 'string' ? tokenValue : JSON.stringify(tokenValue),
          type: tokenType,
        })
      } else {
        // It's a group — recurse
        traverseW3C(record, path, tokens)
      }
    }
  }
}
