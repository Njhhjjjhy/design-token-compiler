import type { ResolvedTokenMap, CompilationOptions } from '@/types'

/**
 * Build nested Style Dictionary object structure from flat token paths
 */
function buildStyleDictionaryObject(tokens: ResolvedTokenMap): Record<string, unknown> {
  const result: Record<string, unknown> = {}

  Object.entries(tokens).forEach(([path, token]) => {
    const parts = path.split('.')
    let current: Record<string, unknown> = result

    parts.forEach((part, index) => {
      if (index === parts.length - 1) {
        // Last part: create Style Dictionary token object
        current[part] = {
          value: token.resolvedValue,
          type: token.type,
          ...(token.description && { comment: token.description }),
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
 * Compile resolved tokens to Style Dictionary JSON format
 */
export function compileToStyleDictionary(
  tokens: ResolvedTokenMap,
  options: CompilationOptions = {}
): string {
  const { prettify = true } = options

  const nested = buildStyleDictionaryObject(tokens)

  // Stringify with appropriate formatting
  const json = prettify
    ? JSON.stringify(nested, null, 2)
    : JSON.stringify(nested)

  return json
}

/**
 * Compile tokens with mode support
 * Generates separate Style Dictionary files for each theme
 */
export function compileToStyleDictionaryWithModes(
  lightTokens: ResolvedTokenMap,
  darkTokens: ResolvedTokenMap,
  options: CompilationOptions = {}
): string {
  const { prettify = true } = options

  // Build both light and dark token objects
  const lightNested = buildStyleDictionaryObject(lightTokens)
  const darkNested = buildStyleDictionaryObject(darkTokens)

  // Style Dictionary typically uses separate files for themes
  // We'll output a combined structure with theme keys
  const result = {
    light: lightNested,
    dark: darkNested,
  }

  // Stringify with appropriate formatting
  const json = prettify
    ? JSON.stringify(result, null, 2)
    : JSON.stringify(result)

  return json
}

/**
 * Generate Style Dictionary config file
 * This is a helper to create the config.json file that Style Dictionary needs
 */
export function generateStyleDictionaryConfig(
  outputFormats: string[] = ['css', 'scss', 'js']
): string {
  const config = {
    source: ['tokens/**/*.json'],
    platforms: {
      css: {
        transformGroup: 'css',
        buildPath: 'build/css/',
        files: [
          {
            destination: 'variables.css',
            format: 'css/variables',
          },
        ],
      },
      scss: {
        transformGroup: 'scss',
        buildPath: 'build/scss/',
        files: [
          {
            destination: 'variables.scss',
            format: 'scss/variables',
          },
        ],
      },
      js: {
        transformGroup: 'js',
        buildPath: 'build/js/',
        files: [
          {
            destination: 'tokens.js',
            format: 'javascript/es6',
          },
        ],
      },
    },
  }

  return JSON.stringify(config, null, 2)
}
