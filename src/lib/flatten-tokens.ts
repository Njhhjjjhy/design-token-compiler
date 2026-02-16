import type { Token, TokenGroup } from '@/types'

export interface FlatToken {
  path: string
  name: string
  value: string
  type: string
}

/**
 * Flatten nested token groups into a flat map with dot-notation paths.
 * Returns Record<path, Token> where path is like "color.primary.500"
 */
export function flattenTokens(
  tokens: Record<string, Token | TokenGroup>,
  prefix = ''
): Record<string, Token> {
  const flattened: Record<string, Token> = {}

  for (const [key, value] of Object.entries(tokens)) {
    const path = prefix ? `${prefix}.${key}` : key

    if ('tokens' in value) {
      Object.assign(flattened, flattenTokens(value.tokens, path))
    } else {
      flattened[path] = value
    }
  }

  return flattened
}

/**
 * Convert a flat token map to FlatToken array for the diff engine.
 * Normalizes all values to strings.
 */
export function toFlatTokenList(tokens: Record<string, Token>): FlatToken[] {
  return Object.entries(tokens).map(([path, token]) => ({
    path,
    name: token.name,
    value: typeof token.value === 'string' ? token.value : JSON.stringify(token.value),
    type: token.type,
  }))
}
