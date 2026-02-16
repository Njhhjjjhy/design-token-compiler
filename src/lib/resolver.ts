import type {
  Token,
  TokenGroup,
  TokenSet,
  TokenValue,
  ResolvedToken,
  ResolvedTokenMap,
  ResolutionResult,
  ResolutionError,
} from '@/types'
import { flattenTokens } from '@/lib/flatten-tokens'

// ============================================================================
// REFERENCE DETECTION
// ============================================================================

const REFERENCE_REGEX = /^\{([^}]+)\}$/
const REFERENCE_IN_STRING_REGEX = /\{([^}]+)\}/g

/**
 * Check if a value is a reference to another token
 */
function isReference(value: TokenValue): boolean {
  if (typeof value !== 'string') return false
  return REFERENCE_REGEX.test(value)
}

/**
 * Extract reference path from a reference string
 * Example: "{color.primary}" -> "color.primary"
 */
function extractReferencePath(value: string): string | null {
  const match = value.match(REFERENCE_REGEX)
  return match ? match[1] : null
}

/**
 * Check if a value contains embedded references
 * Example: "1px solid {color.border}" contains a reference
 */
function hasEmbeddedReferences(value: TokenValue): boolean {
  if (typeof value !== 'string') return false
  // Create a new regex instance to avoid state issues with the global flag
  const regex = /\{([^}]+)\}/g
  return regex.test(value)
}

// ============================================================================
// MODE APPLICATION
// ============================================================================

/**
 * Apply mode overrides to tokens
 */
function applyModeOverrides(
  tokens: Record<string, Token>,
  modeOverrides: Record<string, TokenValue>
): Record<string, Token> {
  const tokensWithModes = { ...tokens }

  for (const [tokenPath, overrideValue] of Object.entries(modeOverrides)) {
    if (tokensWithModes[tokenPath]) {
      tokensWithModes[tokenPath] = {
        ...tokensWithModes[tokenPath],
        value: overrideValue,
      }
    }
  }

  return tokensWithModes
}

// ============================================================================
// RESOLUTION LOGIC
// ============================================================================

/**
 * Resolve a single token's value, following references
 */
function resolveTokenValue(
  tokenPath: string,
  tokens: Record<string, Token>,
  resolved: Map<string, ResolvedToken>,
  visiting: Set<string>,
  errors: ResolutionError[]
): TokenValue {
  // Check if already resolved
  if (resolved.has(tokenPath)) {
    const resolvedToken = resolved.get(tokenPath)!
    if (resolvedToken.error) {
      throw new Error(resolvedToken.error)
    }
    return resolvedToken.resolvedValue
  }

  // Get the token
  const token = tokens[tokenPath]
  if (!token) {
    errors.push({
      tokenId: token?.id || tokenPath,
      tokenPath,
      error: 'missing_reference',
      message: `Token "${tokenPath}" not found`,
    })
    throw new Error(`Token "${tokenPath}" not found`)
  }

  // Check for circular reference
  if (visiting.has(tokenPath)) {
    const circular = Array.from(visiting).concat([tokenPath])
    errors.push({
      tokenId: token.id,
      tokenPath,
      error: 'circular_reference',
      message: `Circular reference detected: ${circular.join(' -> ')}`,
    })
    throw new Error(`Circular reference detected: ${circular.join(' -> ')}`)
  }

  visiting.add(tokenPath)

  try {
    let value = token.$value || token.value

    // Handle reference values
    if (isReference(value)) {
      const referencePath = extractReferencePath(value as string)
      if (!referencePath) {
        throw new Error(`Invalid reference format: ${value}`)
      }

      // Resolve the referenced token
      const resolvedValue = resolveTokenValue(
        referencePath,
        tokens,
        resolved,
        visiting,
        errors
      )

      const resolvedToken: ResolvedToken = {
        ...token,
        resolvedValue,
        hasReference: true,
        referencePath: [referencePath],
      }

      resolved.set(tokenPath, resolvedToken)
      visiting.delete(tokenPath)
      return resolvedValue
    }

    // Handle embedded references in strings
    if (hasEmbeddedReferences(value)) {
      const stringValue = value as string
      let resolvedString = stringValue

      // Create new regex instance for matchAll
      const regex = /\{([^}]+)\}/g
      const matches = stringValue.matchAll(regex)
      const referencePaths: string[] = []

      for (const match of matches) {
        const referencePath = match[1]
        referencePaths.push(referencePath)

        const resolvedValue = resolveTokenValue(
          referencePath,
          tokens,
          resolved,
          visiting,
          errors
        )

        resolvedString = resolvedString.replace(match[0], String(resolvedValue))
      }

      const resolvedToken: ResolvedToken = {
        ...token,
        resolvedValue: resolvedString,
        hasReference: true,
        referencePath: referencePaths,
      }

      resolved.set(tokenPath, resolvedToken)
      visiting.delete(tokenPath)
      return resolvedString
    }

    // No reference, value is literal
    const resolvedToken: ResolvedToken = {
      ...token,
      resolvedValue: value,
      hasReference: false,
    }

    resolved.set(tokenPath, resolvedToken)
    visiting.delete(tokenPath)
    return value
  } catch (error) {
    const resolvedToken: ResolvedToken = {
      ...token,
      resolvedValue: token.value,
      hasReference: isReference(token.value) || hasEmbeddedReferences(token.value),
      error: error instanceof Error ? error.message : String(error),
    }

    resolved.set(tokenPath, resolvedToken)
    visiting.delete(tokenPath)
    throw error
  }
}

// ============================================================================
// CIRCULAR REFERENCE DETECTION
// ============================================================================

/**
 * Detect all circular references in the token set
 */
function detectCircularReferences(
  tokens: Record<string, Token>
): string[][] {
  const circular: string[][] = []
  const visited = new Set<string>()

  function detectCircular(
    tokenPath: string,
    path: string[] = []
  ): void {
    if (visited.has(tokenPath)) return
    if (path.includes(tokenPath)) {
      const cycle = path.slice(path.indexOf(tokenPath)).concat([tokenPath])
      circular.push(cycle)
      return
    }

    const token = tokens[tokenPath]
    if (!token) return

    const value = token.$value || token.value

    if (isReference(value)) {
      const referencePath = extractReferencePath(value as string)
      if (referencePath) {
        detectCircular(referencePath, [...path, tokenPath])
      }
    } else if (hasEmbeddedReferences(value)) {
      const stringValue = value as string
      // Create new regex instance for matchAll
      const regex = /\{([^}]+)\}/g
      const matches = stringValue.matchAll(regex)

      for (const match of matches) {
        const referencePath = match[1]
        detectCircular(referencePath, [...path, tokenPath])
      }
    }

    visited.add(tokenPath)
  }

  for (const tokenPath of Object.keys(tokens)) {
    detectCircular(tokenPath)
  }

  return circular
}

// ============================================================================
// MAIN RESOLVER
// ============================================================================

/**
 * Resolve all tokens in a token set, applying mode overrides if specified
 */
export function resolveTokens(
  tokenSet: TokenSet,
  modeId?: string
): ResolutionResult {
  const errors: ResolutionError[] = []
  const resolved = new Map<string, ResolvedToken>()

  // Flatten the token hierarchy
  let flatTokens = flattenTokens(tokenSet.tokens)

  // Apply mode overrides if specified
  if (modeId && tokenSet.modes[modeId]) {
    flatTokens = applyModeOverrides(flatTokens, tokenSet.modes[modeId].overrides)
  }

  // Detect circular references first
  const circular = detectCircularReferences(flatTokens)

  // Resolve each token
  for (const tokenPath of Object.keys(flatTokens)) {
    try {
      resolveTokenValue(tokenPath, flatTokens, resolved, new Set(), errors)
    } catch (error) {
      // Error already captured in resolveTokenValue
    }
  }

  // Convert Map to Record
  const resolvedTokens: ResolvedTokenMap = {}
  resolved.forEach((token, path) => {
    resolvedTokens[path] = token
  })

  return {
    tokens: resolvedTokens,
    errors,
    circular,
  }
}

/**
 * Get a flattened map of all tokens (without resolution)
 */
export function getFlattenedTokens(
  tokenSet: TokenSet,
  modeId?: string
): Record<string, Token> {
  let flatTokens = flattenTokens(tokenSet.tokens)

  if (modeId && tokenSet.modes[modeId]) {
    flatTokens = applyModeOverrides(flatTokens, tokenSet.modes[modeId].overrides)
  }

  return flatTokens
}

/**
 * Validate a single token reference
 */
export function validateReference(
  referencePath: string,
  tokens: Record<string, Token>
): { valid: boolean; error?: string } {
  if (!tokens[referencePath]) {
    return {
      valid: false,
      error: `Token "${referencePath}" not found`,
    }
  }

  return { valid: true }
}
