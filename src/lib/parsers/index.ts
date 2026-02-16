import type { FlatToken } from '@/lib/flatten-tokens'
import { parseCss } from './css-parser'
import { parseScss } from './scss-parser'
import { parseW3CJSON } from './w3c-json-parser'
import { parseFigmaJSON, isFigmaFormat } from './figma-parser'

export type ImportFormat = 'css' | 'scss' | 'figma-json' | 'w3c-json'

export interface ParseResult {
  tokens: FlatToken[]
  format: ImportFormat
  error?: string
  warnings: string[]
}

/**
 * Auto-detect format from file extension and parse content.
 */
export function parseFile(fileName: string, content: string): ParseResult {
  const ext = fileName.split('.').pop()?.toLowerCase() || ''
  const warnings: string[] = []

  try {
    if (ext === 'css') {
      const tokens = parseCss(content)
      if (tokens.length === 0) {
        return { tokens: [], format: 'css', error: 'No CSS custom properties found in this file.', warnings }
      }
      return { tokens, format: 'css', warnings }
    }

    if (ext === 'scss') {
      const tokens = parseScss(content)
      if (tokens.length === 0) {
        return { tokens: [], format: 'scss', error: 'No SCSS variables found in this file.', warnings }
      }
      return { tokens, format: 'scss', warnings }
    }

    if (ext === 'json') {
      // Detect whether it's Figma or W3C format
      let data: Record<string, unknown>
      try {
        data = JSON.parse(content)
      } catch {
        return { tokens: [], format: 'w3c-json', error: 'Invalid JSON format.', warnings }
      }

      if (isFigmaFormat(data)) {
        const tokens = parseFigmaJSON(content)
        if (tokens.length === 0) {
          return { tokens: [], format: 'figma-json', error: 'No variables found in this Figma export.', warnings }
        }
        return { tokens, format: 'figma-json', warnings }
      } else {
        const tokens = parseW3CJSON(content)
        if (tokens.length === 0) {
          return { tokens: [], format: 'w3c-json', error: 'No design tokens found in this JSON file.', warnings }
        }
        return { tokens, format: 'w3c-json', warnings }
      }
    }

    return {
      tokens: [],
      format: 'css',
      error: `Unsupported file type ".${ext}". Supported formats: .json (Figma or W3C), .css, .scss`,
      warnings,
    }
  } catch (err) {
    return {
      tokens: [],
      format: 'css',
      error: err instanceof Error ? err.message : 'Failed to parse file.',
      warnings,
    }
  }
}
