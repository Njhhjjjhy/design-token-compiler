import type { ResolvedTokenMap, CompilationOptions, TokenType } from '@/types'

/**
 * Convert internal token type to W3C DTCG type
 */
function toW3CType(type: TokenType): string {
  const typeMap: Record<TokenType, string> = {
    color: 'color',
    dimension: 'dimension',
    fontFamily: 'fontFamily',
    fontWeight: 'fontWeight',
    duration: 'duration',
    cubicBezier: 'cubicBezier',
    number: 'number',
    strokeStyle: 'strokeStyle',
    border: 'border',
    transition: 'transition',
    shadow: 'shadow',
    gradient: 'gradient',
    typography: 'typography',
  }

  return typeMap[type] || type
}

/**
 * Build nested W3C DTCG object structure from flat token paths
 */
function buildW3CObject(tokens: ResolvedTokenMap): Record<string, unknown> {
  const result: Record<string, unknown> = {}

  Object.entries(tokens).forEach(([path, token]) => {
    const parts = path.split('.')
    let current: Record<string, unknown> = result

    parts.forEach((part, index) => {
      if (index === parts.length - 1) {
        // Last part: create W3C token object
        current[part] = {
          $value: token.resolvedValue,
          $type: toW3CType(token.type),
          ...(token.description && { $description: token.description }),
        }
      } else {
        // Create nested group if it doesn't exist
        if (!current[part] || typeof current[part] !== 'object') {
          current[part] = {}
        }
        current = current[part] as Record<string, unknown>
      }
    })
  })

  return result
}

/**
 * Compile resolved tokens to W3C Design Tokens Community Group JSON format
 */
export function compileToW3CJSON(
  tokens: ResolvedTokenMap,
  options: CompilationOptions = {}
): string {
  const { prettify = true } = options

  const nested = buildW3CObject(tokens)

  // Stringify with appropriate formatting
  const json = prettify
    ? JSON.stringify(nested, null, 2)
    : JSON.stringify(nested)

  return json
}

/**
 * Compile tokens with mode support
 * Generates W3C format with $extensions for theme modes
 */
export function compileToW3CJSONWithModes(
  lightTokens: ResolvedTokenMap,
  darkTokens: ResolvedTokenMap,
  options: CompilationOptions = {}
): string {
  const { prettify = true } = options

  // Build base tokens (light mode)
  const baseTokens = buildW3CObject(lightTokens)

  // Find dark mode overrides
  const darkPaths = Object.keys(darkTokens).sort()
  const overrides: Record<string, unknown> = {}

  darkPaths.forEach((path) => {
    const darkValue = darkTokens[path].resolvedValue
    const lightValue = lightTokens[path]?.resolvedValue

    if (darkValue !== lightValue) {
      const parts = path.split('.')
      let current: Record<string, unknown> = overrides

      parts.forEach((part, index) => {
        if (index === parts.length - 1) {
          current[part] = {
            $value: darkValue,
            $type: toW3CType(darkTokens[path].type),
          }
        } else {
          if (!current[part] || typeof current[part] !== 'object') {
            current[part] = {}
          }
          current = current[part] as Record<string, unknown>
        }
      })
    }
  })

  // Combine with modes extension
  const result = {
    ...baseTokens,
    $extensions: {
      'com.design-token-compiler.modes': {
        light: {
          $description: 'Light mode (default)',
        },
        dark: {
          $description: 'Dark mode',
          $tokens: overrides,
        },
      },
    },
  }

  // Stringify with appropriate formatting
  const json = prettify
    ? JSON.stringify(result, null, 2)
    : JSON.stringify(result)

  return json
}
