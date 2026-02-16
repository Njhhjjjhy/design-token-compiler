# Sync & Diff Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a two-panel diff view that lets users import Figma JSON, W3C JSON, CSS, or SCSS files and compare them against editor tokens with visual conflict resolution.

**Architecture:** Four file parsers convert external formats into flat token maps. A diff engine compares them against the editor's flattened tokens. React components render a two-panel side-by-side view with color-coded rows and resolution controls. Zustand manages import/diff/resolution state.

**Tech Stack:** React 18, TypeScript, Zustand, Tailwind CSS, Lucide React, `diff` npm package (already installed)

**Design doc:** `docs/plans/2026-02-16-sync-and-diff-design.md`

---

## Task 1: Flatten Tokens Utility

The resolver already has a private `flattenTokens` function. Extract it to a shared utility so both the resolver and diff engine can use it.

**Files:**
- Create: `src/lib/flatten-tokens.ts`
- Modify: `src/lib/resolver.ts`

**Step 1: Create the shared flatten utility**

```typescript
// src/lib/flatten-tokens.ts
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
```

**Step 2: Update resolver.ts to import from the shared utility**

In `src/lib/resolver.ts`, remove the private `flattenTokens` function (lines 54-73) and replace with an import:

```typescript
import { flattenTokens } from '@/lib/flatten-tokens'
```

Remove the existing `flattenTokens` function body. Keep all other code identical — the imported function has the same signature.

**Step 3: Verify the app still works**

Run: `npm run dev`
Expected: App starts without errors, compiler view still shows output, editor still works.

**Step 4: Commit**

```bash
git add src/lib/flatten-tokens.ts src/lib/resolver.ts
git commit -m "refactor: extract flattenTokens to shared utility"
```

---

## Task 2: CSS Parser

Parse CSS custom properties back into a flat token map. This is the reverse of what `src/lib/compilers/css.ts` does.

The CSS compiler outputs: `--color-semantic-primary: #2563eb;`
The parser converts back: path `color.semantic.primary`, value `#2563eb`

**Files:**
- Create: `src/lib/parsers/css-parser.ts`

**Step 1: Create the CSS parser**

```typescript
// src/lib/parsers/css-parser.ts
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
```

**Step 2: Verify manually**

Run: `npm run dev`
Expected: No compile errors. (Parser not wired to UI yet — that comes in later tasks.)

**Step 3: Commit**

```bash
git add src/lib/parsers/css-parser.ts
git commit -m "feat: add CSS parser for sync imports"
```

---

## Task 3: SCSS Parser

Parse SCSS variables back into flat tokens. Reverse of `src/lib/compilers/scss.ts`.

The SCSS compiler outputs: `$color-semantic-primary: #2563eb;`
The parser converts back: path `color.semantic.primary`, value `#2563eb`

**Files:**
- Create: `src/lib/parsers/scss-parser.ts`

**Step 1: Create the SCSS parser**

```typescript
// src/lib/parsers/scss-parser.ts
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
```

**Step 2: Commit**

```bash
git add src/lib/parsers/scss-parser.ts
git commit -m "feat: add SCSS parser for sync imports"
```

---

## Task 4: W3C Design Tokens JSON Parser

Parse W3C DTCG format JSON (the same format the compiler outputs in `json-w3c.ts`).

Structure: `{ "color": { "primary": { "$value": "#f40c3f", "$type": "color" } } }`

**Files:**
- Create: `src/lib/parsers/w3c-json-parser.ts`

**Step 1: Create the W3C JSON parser**

```typescript
// src/lib/parsers/w3c-json-parser.ts
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
```

**Step 2: Commit**

```bash
git add src/lib/parsers/w3c-json-parser.ts
git commit -m "feat: add W3C Design Tokens JSON parser"
```

---

## Task 5: Figma Variables JSON Parser

Parse Figma's exported Variables JSON format. Figma exports variables in a specific structure with `variables` and `variableCollections` arrays.

**Files:**
- Create: `src/lib/parsers/figma-parser.ts`

**Step 1: Create the Figma parser**

```typescript
// src/lib/parsers/figma-parser.ts
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
```

**Step 2: Commit**

```bash
git add src/lib/parsers/figma-parser.ts
git commit -m "feat: add Figma Variables JSON parser"
```

---

## Task 6: Format Detection & Parse Orchestrator

Create a single entry point that auto-detects the file format and calls the right parser.

**Files:**
- Create: `src/lib/parsers/index.ts`

**Step 1: Create the parse orchestrator**

```typescript
// src/lib/parsers/index.ts
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
```

**Step 2: Commit**

```bash
git add src/lib/parsers/index.ts
git commit -m "feat: add format detection and parse orchestrator"
```

---

## Task 7: Diff Engine

Compare two flat token lists and categorize each token as same/different/editor-only/file-only.

**Files:**
- Create: `src/lib/diff-engine.ts`

**Step 1: Create the diff engine**

```typescript
// src/lib/diff-engine.ts
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
```

**Step 2: Commit**

```bash
git add src/lib/diff-engine.ts
git commit -m "feat: add diff engine for token comparison"
```

---

## Task 8: Sync Store State

Add sync-related state and actions to the Zustand store.

**Files:**
- Modify: `src/store/useTokenStore.ts`

**Step 1: Add sync types and state to the store**

Add imports at the top of `useTokenStore.ts`:

```typescript
import type { AppState, Token, TokenGroup, TokenSet, TokenValue, ViewMode } from '@/types'
import type { FlatToken } from '@/lib/flatten-tokens'
import type { DiffResult, DiffRow } from '@/lib/diff-engine'
import type { ImportFormat } from '@/lib/parsers'
import { flattenTokens, toFlatTokenList } from '@/lib/flatten-tokens'
import { parseFile } from '@/lib/parsers'
import { diffTokens } from '@/lib/diff-engine'
```

Add these fields and methods to the store interface (`TokenStoreState`):

```typescript
// Sync state
importedFileName: string | null
importedFormat: ImportFormat | null
importedTokens: FlatToken[]
importError: string | null
diffResult: DiffResult | null
resolutions: Record<string, 'editor' | 'imported' | 'discard' | 'add'>
syncFilter: 'all' | 'differences'

// Sync actions
importFile: (fileName: string, content: string) => void
clearImport: () => void
resolveToken: (path: string, choice: 'editor' | 'imported' | 'discard' | 'add') => void
setSyncFilter: (filter: 'all' | 'differences') => void
applyToEditor: () => void
getUnresolvedCount: () => number
getResolvedCount: () => number
getTotalConflicts: () => number
```

Add the initial state values:

```typescript
importedFileName: null,
importedFormat: null,
importedTokens: [],
importError: null,
diffResult: null,
resolutions: {},
syncFilter: 'all',
```

Add the action implementations:

```typescript
importFile: (fileName, content) => {
  const result = parseFile(fileName, content)

  if (result.error) {
    set({
      importedFileName: fileName,
      importedFormat: result.format,
      importedTokens: [],
      importError: result.error,
      diffResult: null,
      resolutions: {},
    })
    return
  }

  // Get current editor tokens as flat list
  const state = get()
  const activeSet = state.activeSetId ? state.tokenSets[state.activeSetId] : null
  if (!activeSet) {
    set({ importError: 'No token set loaded. Create or import a token set first.' })
    return
  }

  const editorFlat = flattenTokens(activeSet.tokens)
  const editorFlatList = toFlatTokenList(editorFlat)
  const diff = diffTokens(editorFlatList, result.tokens)

  set({
    importedFileName: fileName,
    importedFormat: result.format,
    importedTokens: result.tokens,
    importError: null,
    diffResult: diff,
    resolutions: {},
  })
},

clearImport: () => set({
  importedFileName: null,
  importedFormat: null,
  importedTokens: [],
  importError: null,
  diffResult: null,
  resolutions: {},
  syncFilter: 'all',
}),

resolveToken: (path, choice) =>
  set((state) => ({
    resolutions: { ...state.resolutions, [path]: choice },
  })),

setSyncFilter: (filter) => set({ syncFilter: filter }),

applyToEditor: () => {
  const state = get()
  const activeSet = state.activeSetId ? state.tokenSets[state.activeSetId] : null
  if (!activeSet || !state.diffResult) return

  // Build a map of imported tokens by path
  const importedMap = new Map<string, FlatToken>()
  state.importedTokens.forEach((t) => importedMap.set(t.path, t))

  // Start with current tokens
  let updatedTokens = { ...activeSet.tokens }

  for (const row of state.diffResult.rows) {
    const resolution = state.resolutions[row.path]

    if (row.status === 'different' && resolution === 'imported' && row.fileToken) {
      // Replace editor value with imported value
      updatedTokens = updateTokenInTree(updatedTokens, row.path, row.fileToken.value)
    }

    if (row.status === 'editor_only' && resolution === 'discard') {
      // Remove from editor
      updatedTokens = removeTokenFromTree(updatedTokens, row.path)
    }

    if (row.status === 'file_only' && resolution === 'add' && row.fileToken) {
      // Add imported token to editor
      updatedTokens = addTokenToTree(updatedTokens, row.path, row.fileToken)
    }
  }

  set({
    tokenSets: {
      ...state.tokenSets,
      [activeSet.id]: {
        ...activeSet,
        tokens: updatedTokens,
        metadata: { ...activeSet.metadata, updatedAt: Date.now() },
      },
    },
    // Clear sync state after applying
    importedFileName: null,
    importedFormat: null,
    importedTokens: [],
    importError: null,
    diffResult: null,
    resolutions: {},
  })
},

getUnresolvedCount: () => {
  const state = get()
  if (!state.diffResult) return 0
  const conflicts = state.diffResult.rows.filter((r) => r.status !== 'same')
  const resolved = Object.keys(state.resolutions).length
  return conflicts.length - resolved
},

getResolvedCount: () => {
  return Object.keys(get().resolutions).length
},

getTotalConflicts: () => {
  const state = get()
  if (!state.diffResult) return 0
  return state.diffResult.rows.filter((r) => r.status !== 'same').length
},
```

**Step 2: Add tree manipulation helpers**

Add these helper functions above the store definition in the same file:

```typescript
/**
 * Update a token value in the nested tree by dot-separated path.
 */
function updateTokenInTree(
  tokens: Record<string, Token | TokenGroup>,
  path: string,
  newValue: string
): Record<string, Token | TokenGroup> {
  const parts = path.split('.')
  if (parts.length === 1) {
    const token = tokens[parts[0]]
    if (token && !('tokens' in token)) {
      return { ...tokens, [parts[0]]: { ...token, value: newValue } }
    }
    return tokens
  }

  const [first, ...rest] = parts
  const group = tokens[first]
  if (group && 'tokens' in group) {
    return {
      ...tokens,
      [first]: { ...group, tokens: updateTokenInTree(group.tokens, rest.join('.'), newValue) },
    }
  }
  return tokens
}

/**
 * Remove a token from the nested tree by dot-separated path.
 */
function removeTokenFromTree(
  tokens: Record<string, Token | TokenGroup>,
  path: string
): Record<string, Token | TokenGroup> {
  const parts = path.split('.')
  if (parts.length === 1) {
    const { [parts[0]]: _removed, ...rest } = tokens
    return rest
  }

  const [first, ...restParts] = parts
  const group = tokens[first]
  if (group && 'tokens' in group) {
    return {
      ...tokens,
      [first]: { ...group, tokens: removeTokenFromTree(group.tokens, restParts.join('.')) },
    }
  }
  return tokens
}

/**
 * Add a new token to the nested tree by dot-separated path.
 * Creates intermediate groups as needed.
 */
function addTokenToTree(
  tokens: Record<string, Token | TokenGroup>,
  path: string,
  flatToken: FlatToken
): Record<string, Token | TokenGroup> {
  const parts = path.split('.')

  if (parts.length === 1) {
    // Add as direct token
    const newToken: Token = {
      id: `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      name: flatToken.name,
      value: flatToken.value,
      type: flatToken.type as Token['type'],
    }
    return { ...tokens, [parts[0]]: newToken }
  }

  const [first, ...rest] = parts
  const existing = tokens[first]

  if (existing && 'tokens' in existing) {
    // Group exists — recurse into it
    return {
      ...tokens,
      [first]: { ...existing, tokens: addTokenToTree(existing.tokens, rest.join('.'), flatToken) },
    }
  }

  // Group doesn't exist — create it
  const newGroup: TokenGroup = {
    id: `group-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
    name: first,
    tokens: addTokenToTree({}, rest.join('.'), flatToken),
  }

  return { ...tokens, [first]: newGroup }
}
```

**Step 3: Verify the app still works**

Run: `npm run dev`
Expected: App starts without errors. Existing features work. Sync view still shows placeholder (UI components come next).

**Step 4: Commit**

```bash
git add src/store/useTokenStore.ts
git commit -m "feat: add sync state management to store"
```

---

## Task 9: SyncDropZone Component

The empty state shown before any file is imported — a drag-and-drop area with file picker.

**Files:**
- Create: `src/components/sync/SyncDropZone.tsx`

**Step 1: Create the drop zone component**

```typescript
// src/components/sync/SyncDropZone.tsx
import { useState, useCallback } from 'react'
import { Upload } from 'lucide-react'

interface SyncDropZoneProps {
  onFileLoaded: (fileName: string, content: string) => void
}

export function SyncDropZone({ onFileLoaded }: SyncDropZoneProps) {
  const [isDragging, setIsDragging] = useState(false)

  const handleFile = useCallback((file: File) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const content = e.target?.result as string
      if (content) {
        onFileLoaded(file.name, content)
      }
    }
    reader.readAsText(file)
  }, [onFileLoaded])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }, [handleFile])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback(() => {
    setIsDragging(false)
  }, [])

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
  }, [handleFile])

  return (
    <div className="flex-1 flex items-center justify-center p-12">
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`
          w-full max-w-lg p-12 border-2 border-dashed rounded-lg text-center transition-colors
          ${isDragging
            ? 'border-primary bg-primary/5'
            : 'border-border hover:border-text-tertiary'
          }
        `}
      >
        <Upload className={`w-10 h-10 mx-auto mb-4 ${isDragging ? 'text-primary' : 'text-text-tertiary'}`} />

        <p className="font-mono text-sm text-white mb-2">
          Drop a file to compare
        </p>

        <p className="font-mono text-xs text-text-secondary mb-6">
          or click to browse
        </p>

        <label className="inline-flex items-center gap-2 px-4 py-2 bg-surface-elevated border border-border hover:border-primary transition-colors font-mono text-xs text-white cursor-pointer">
          Choose File
          <input
            type="file"
            accept=".json,.css,.scss"
            onChange={handleFileInput}
            className="hidden"
          />
        </label>

        <p className="mt-6 font-mono text-xs text-text-tertiary">
          Supported: .json (Figma or W3C) · .css · .scss
        </p>
      </div>
    </div>
  )
}
```

**Step 2: Commit**

```bash
git add src/components/sync/SyncDropZone.tsx
git commit -m "feat: add SyncDropZone file import component"
```

---

## Task 10: SyncHeader Component

Toolbar showing the imported file info, summary stats, filter toggle, and action buttons.

**Files:**
- Create: `src/components/sync/SyncHeader.tsx`

**Step 1: Create the header component**

```typescript
// src/components/sync/SyncHeader.tsx
import { X, Download, ArrowRightLeft } from 'lucide-react'
import type { DiffResult } from '@/lib/diff-engine'

interface SyncHeaderProps {
  fileName: string
  format: string
  diffResult: DiffResult
  filter: 'all' | 'differences'
  onFilterChange: (filter: 'all' | 'differences') => void
  onClear: () => void
  onApply: () => void
  onExport: () => void
  resolvedCount: number
  totalConflicts: number
}

export function SyncHeader({
  fileName,
  format,
  diffResult,
  filter,
  onFilterChange,
  onClear,
  onApply,
  onExport,
  resolvedCount,
  totalConflicts,
}: SyncHeaderProps) {
  const allResolved = totalConflicts > 0 && resolvedCount >= totalConflicts
  const { stats } = diffResult

  return (
    <div className="p-6 border-b border-border">
      {/* Top row: title, file info, actions */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4">
          <h2 className="section-title text-primary">SYNC & DIFF</h2>
          <div className="flex items-center gap-2 px-3 py-1 bg-surface-elevated border border-border font-mono text-xs">
            <span className="text-text-secondary">{format.toUpperCase()}</span>
            <span className="text-white">{fileName}</span>
            <button
              onClick={onClear}
              className="ml-1 text-text-tertiary hover:text-white transition-colors"
              title="Clear import"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onApply}
            disabled={!allResolved}
            className={`
              flex items-center gap-2 px-4 py-2 font-mono text-xs transition-colors
              ${allResolved
                ? 'bg-primary hover:bg-primary/90 text-white'
                : 'bg-surface-elevated border border-border text-text-tertiary cursor-not-allowed'
              }
            `}
          >
            <ArrowRightLeft className="w-4 h-4" />
            APPLY TO EDITOR
          </button>
          <button
            onClick={onExport}
            disabled={!allResolved}
            className={`
              flex items-center gap-2 px-4 py-2 font-mono text-xs transition-colors
              ${allResolved
                ? 'bg-surface-elevated border border-border hover:border-primary text-white'
                : 'bg-surface-elevated border border-border text-text-tertiary cursor-not-allowed'
              }
            `}
          >
            <Download className="w-4 h-4" />
            EXPORT MERGED
          </button>
        </div>
      </div>

      {/* Stats row */}
      <div className="flex items-center gap-6">
        <div className="flex gap-4 font-mono text-xs">
          <span>
            <span className="text-success">{stats.same}</span>
            <span className="text-text-secondary"> same</span>
          </span>
          <span>
            <span className="text-warning">{stats.different}</span>
            <span className="text-text-secondary"> different</span>
          </span>
          <span>
            <span className="text-info">{stats.editorOnly}</span>
            <span className="text-text-secondary"> editor only</span>
          </span>
          <span>
            <span className="text-primary">{stats.fileOnly}</span>
            <span className="text-text-secondary"> file only</span>
          </span>
        </div>

        <div className="ml-auto flex items-center gap-2">
          {/* Filter toggle */}
          <div className="flex border border-border">
            <button
              onClick={() => onFilterChange('all')}
              className={`px-3 py-1 font-mono text-xs transition-colors ${
                filter === 'all' ? 'bg-surface-elevated text-white' : 'text-text-secondary hover:text-white'
              }`}
            >
              ALL
            </button>
            <button
              onClick={() => onFilterChange('differences')}
              className={`px-3 py-1 font-mono text-xs border-l border-border transition-colors ${
                filter === 'differences' ? 'bg-surface-elevated text-white' : 'text-text-secondary hover:text-white'
              }`}
            >
              DIFFERENCES
            </button>
          </div>

          {/* Resolution progress */}
          {totalConflicts > 0 && (
            <span className="font-mono text-xs text-text-secondary ml-4">
              <span className={allResolved ? 'text-success' : 'text-warning'}>{resolvedCount}</span>
              <span> / {totalConflicts} resolved</span>
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
```

**Step 2: Commit**

```bash
git add src/components/sync/SyncHeader.tsx
git commit -m "feat: add SyncHeader toolbar component"
```

---

## Task 11: SyncTokenRow Component

A single row in the diff view showing a token from one side with its value and visual preview.

**Files:**
- Create: `src/components/sync/SyncTokenRow.tsx`

**Step 1: Create the token row component**

```typescript
// src/components/sync/SyncTokenRow.tsx
import type { FlatToken } from '@/lib/flatten-tokens'
import type { DiffStatus } from '@/lib/diff-engine'
import { ArrowLeft, ArrowRight, Check, Minus, Plus } from 'lucide-react'

interface SyncTokenRowProps {
  path: string
  status: DiffStatus
  editorToken?: FlatToken
  fileToken?: FlatToken
  resolution?: 'editor' | 'imported' | 'discard' | 'add'
  onResolve: (path: string, choice: 'editor' | 'imported' | 'discard' | 'add') => void
}

export function SyncTokenRow({
  path,
  status,
  editorToken,
  fileToken,
  resolution,
  onResolve,
}: SyncTokenRowProps) {
  const statusColors: Record<DiffStatus, string> = {
    same: 'border-l-success/30',
    different: 'border-l-warning/80',
    editor_only: 'border-l-info/80',
    file_only: 'border-l-primary/80',
  }

  const statusBg: Record<DiffStatus, string> = {
    same: '',
    different: 'bg-warning/5',
    editor_only: 'bg-info/5',
    file_only: 'bg-primary/5',
  }

  const statusLabels: Record<DiffStatus, string> = {
    same: 'Same',
    different: 'Different',
    editor_only: 'Editor only',
    file_only: 'File only',
  }

  const statusLabelColors: Record<DiffStatus, string> = {
    same: 'text-success',
    different: 'text-warning',
    editor_only: 'text-info',
    file_only: 'text-primary',
  }

  const shortPath = path.split('.').slice(1).join('.') || path

  return (
    <div className={`border-l-2 ${statusColors[status]} ${statusBg[status]} ${resolution ? 'opacity-70' : ''}`}>
      <div className="flex items-center gap-2 px-4 py-2">
        {/* Token path */}
        <span className="font-mono text-xs text-text-secondary min-w-[180px] truncate" title={path}>
          {shortPath}
        </span>

        {/* Status badge */}
        <span className={`font-mono text-xs uppercase ${statusLabelColors[status]} min-w-[80px]`}>
          {statusLabels[status]}
        </span>

        {/* Editor value */}
        <div className="flex-1 flex items-center gap-2 min-w-0">
          {editorToken ? (
            <>
              {renderPreview(editorToken)}
              <span className={`font-mono text-xs truncate ${resolution === 'imported' ? 'line-through text-text-tertiary' : 'text-white'}`}>
                {editorToken.value}
              </span>
            </>
          ) : (
            <span className="font-mono text-xs text-text-tertiary italic">—</span>
          )}
        </div>

        {/* Resolution controls */}
        <div className="flex items-center gap-1 mx-2">
          {status === 'different' && (
            <>
              <button
                onClick={() => onResolve(path, 'editor')}
                className={`p-1 rounded transition-colors ${
                  resolution === 'editor'
                    ? 'bg-info/20 text-info'
                    : 'text-text-tertiary hover:text-white hover:bg-white/5'
                }`}
                title="Keep editor value"
              >
                <ArrowLeft className="w-3 h-3" />
              </button>
              <button
                onClick={() => onResolve(path, 'imported')}
                className={`p-1 rounded transition-colors ${
                  resolution === 'imported'
                    ? 'bg-primary/20 text-primary'
                    : 'text-text-tertiary hover:text-white hover:bg-white/5'
                }`}
                title="Keep imported value"
              >
                <ArrowRight className="w-3 h-3" />
              </button>
            </>
          )}
          {status === 'editor_only' && (
            <>
              <button
                onClick={() => onResolve(path, 'editor')}
                className={`p-1 rounded transition-colors ${
                  resolution === 'editor'
                    ? 'bg-success/20 text-success'
                    : 'text-text-tertiary hover:text-white hover:bg-white/5'
                }`}
                title="Keep in editor"
              >
                <Check className="w-3 h-3" />
              </button>
              <button
                onClick={() => onResolve(path, 'discard')}
                className={`p-1 rounded transition-colors ${
                  resolution === 'discard'
                    ? 'bg-error/20 text-error'
                    : 'text-text-tertiary hover:text-white hover:bg-white/5'
                }`}
                title="Remove from editor"
              >
                <Minus className="w-3 h-3" />
              </button>
            </>
          )}
          {status === 'file_only' && (
            <>
              <button
                onClick={() => onResolve(path, 'add')}
                className={`p-1 rounded transition-colors ${
                  resolution === 'add'
                    ? 'bg-success/20 text-success'
                    : 'text-text-tertiary hover:text-white hover:bg-white/5'
                }`}
                title="Add to editor"
              >
                <Plus className="w-3 h-3" />
              </button>
              <button
                onClick={() => onResolve(path, 'discard')}
                className={`p-1 rounded transition-colors ${
                  resolution === 'discard'
                    ? 'bg-error/20 text-error'
                    : 'text-text-tertiary hover:text-white hover:bg-white/5'
                }`}
                title="Ignore"
              >
                <Minus className="w-3 h-3" />
              </button>
            </>
          )}
          {status === 'same' && (
            <Check className="w-3 h-3 text-success/40" />
          )}
        </div>

        {/* File value */}
        <div className="flex-1 flex items-center gap-2 min-w-0">
          {fileToken ? (
            <>
              {renderPreview(fileToken)}
              <span className={`font-mono text-xs truncate ${resolution === 'editor' ? 'line-through text-text-tertiary' : 'text-white'}`}>
                {fileToken.value}
              </span>
            </>
          ) : (
            <span className="font-mono text-xs text-text-tertiary italic">—</span>
          )}
        </div>
      </div>
    </div>
  )
}

/**
 * Render a small visual preview for a token value.
 */
function renderPreview(token: FlatToken) {
  if (token.type === 'color' && !token.value.startsWith('{')) {
    return (
      <div
        className="w-3 h-3 rounded-sm border border-white/20 flex-shrink-0"
        style={{ backgroundColor: token.value }}
      />
    )
  }

  if (token.type === 'dimension') {
    const match = token.value.match(/(\d+)/)
    const numValue = match ? parseInt(match[1]) : 0
    const barWidth = Math.min(numValue, 48)
    return (
      <div
        className="h-2 bg-text-tertiary rounded-sm flex-shrink-0"
        style={{ width: `${barWidth}px` }}
      />
    )
  }

  return null
}
```

**Step 2: Commit**

```bash
git add src/components/sync/SyncTokenRow.tsx
git commit -m "feat: add SyncTokenRow diff row component"
```

---

## Task 12: SyncDiffPanel Component

The main two-panel diff view that groups tokens and renders SyncTokenRow for each.

**Files:**
- Create: `src/components/sync/SyncDiffPanel.tsx`

**Step 1: Create the diff panel component**

```typescript
// src/components/sync/SyncDiffPanel.tsx
import type { DiffResult, DiffRow } from '@/lib/diff-engine'
import { SyncTokenRow } from './SyncTokenRow'

interface SyncDiffPanelProps {
  diffResult: DiffResult
  resolutions: Record<string, 'editor' | 'imported' | 'discard' | 'add'>
  filter: 'all' | 'differences'
  onResolve: (path: string, choice: 'editor' | 'imported' | 'discard' | 'add') => void
}

export function SyncDiffPanel({
  diffResult,
  resolutions,
  filter,
  onResolve,
}: SyncDiffPanelProps) {
  // Apply filter
  let rows = diffResult.rows
  if (filter === 'differences') {
    rows = rows.filter((r) => r.status !== 'same')
  }

  // Group rows by top-level category
  const groups = new Map<string, DiffRow[]>()
  for (const row of rows) {
    const existing = groups.get(row.group) || []
    existing.push(row)
    groups.set(row.group, existing)
  }

  if (rows.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-12">
        <p className="font-mono text-sm text-text-secondary">
          {filter === 'differences' ? 'No differences found — all tokens match!' : 'No tokens to compare.'}
        </p>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-auto">
      {/* Column headers */}
      <div className="sticky top-0 z-10 flex items-center gap-2 px-4 py-2 bg-surface border-b border-border">
        <span className="font-mono text-xs text-text-tertiary uppercase tracking-wider min-w-[180px]">
          Token
        </span>
        <span className="font-mono text-xs text-text-tertiary uppercase tracking-wider min-w-[80px]">
          Status
        </span>
        <span className="flex-1 font-mono text-xs text-text-tertiary uppercase tracking-wider">
          Editor Value
        </span>
        <span className="w-[72px]" /> {/* Resolution controls spacer */}
        <span className="flex-1 font-mono text-xs text-text-tertiary uppercase tracking-wider">
          File Value
        </span>
      </div>

      {/* Grouped rows */}
      {Array.from(groups.entries()).map(([group, groupRows]) => (
        <div key={group}>
          {/* Group header */}
          <div className="px-4 py-2 bg-secondary/50 border-b border-border">
            <span className="font-mono text-xs text-primary uppercase tracking-wider">
              {group}
            </span>
            <span className="font-mono text-xs text-text-tertiary ml-2">
              ({groupRows.length})
            </span>
          </div>

          {/* Token rows */}
          {groupRows.map((row) => (
            <div key={row.path} className="border-b border-border-subtle">
              <SyncTokenRow
                path={row.path}
                status={row.status}
                editorToken={row.editorToken}
                fileToken={row.fileToken}
                resolution={resolutions[row.path]}
                onResolve={onResolve}
              />
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}
```

**Step 2: Commit**

```bash
git add src/components/sync/SyncDiffPanel.tsx
git commit -m "feat: add SyncDiffPanel two-column comparison view"
```

---

## Task 13: Wire Up SyncView

Replace the placeholder SyncView with the full implementation that composes all sync components.

**Files:**
- Modify: `src/pages/SyncView.tsx`

**Step 1: Replace SyncView with full implementation**

```typescript
// src/pages/SyncView.tsx
import { useTokenStore } from '@/store/useTokenStore'
import { SyncDropZone } from '@/components/sync/SyncDropZone'
import { SyncHeader } from '@/components/sync/SyncHeader'
import { SyncDiffPanel } from '@/components/sync/SyncDiffPanel'
import { saveAs } from 'file-saver'

export function SyncView() {
  const activeSet = useTokenStore((s) => s.getActiveTokenSet())
  const importedFileName = useTokenStore((s) => s.importedFileName)
  const importedFormat = useTokenStore((s) => s.importedFormat)
  const importError = useTokenStore((s) => s.importError)
  const diffResult = useTokenStore((s) => s.diffResult)
  const resolutions = useTokenStore((s) => s.resolutions)
  const syncFilter = useTokenStore((s) => s.syncFilter)
  const importFile = useTokenStore((s) => s.importFile)
  const clearImport = useTokenStore((s) => s.clearImport)
  const resolveToken = useTokenStore((s) => s.resolveToken)
  const setSyncFilter = useTokenStore((s) => s.setSyncFilter)
  const applyToEditor = useTokenStore((s) => s.applyToEditor)
  const resolvedCount = useTokenStore((s) => s.getResolvedCount())
  const totalConflicts = useTokenStore((s) => s.getTotalConflicts())

  // No token set loaded
  if (!activeSet) {
    return (
      <div className="p-8">
        <h2 className="section-title text-primary mb-6">SYNC & DIFF</h2>
        <p className="font-mono text-sm text-text-secondary">
          No token set loaded. Create or import a token set first.
        </p>
      </div>
    )
  }

  // Export merged tokens as JSON
  const handleExport = () => {
    if (!diffResult) return

    // Build merged token map from diff results + resolutions
    const merged: Record<string, { path: string; value: string; type: string }> = {}

    for (const row of diffResult.rows) {
      const resolution = resolutions[row.path]

      if (row.status === 'same' && row.editorToken) {
        merged[row.path] = row.editorToken
      } else if (row.status === 'different') {
        if (resolution === 'imported' && row.fileToken) {
          merged[row.path] = row.fileToken
        } else if (row.editorToken) {
          merged[row.path] = row.editorToken
        }
      } else if (row.status === 'editor_only' && resolution !== 'discard' && row.editorToken) {
        merged[row.path] = row.editorToken
      } else if (row.status === 'file_only' && resolution === 'add' && row.fileToken) {
        merged[row.path] = row.fileToken
      }
    }

    const json = JSON.stringify(merged, null, 2)
    const blob = new Blob([json], { type: 'application/json' })
    saveAs(blob, `${activeSet.name.toLowerCase().replace(/\s+/g, '-')}-merged.json`)
  }

  // Error state
  if (importError && !diffResult) {
    return (
      <div className="h-full flex flex-col">
        <div className="p-6 border-b border-border">
          <div className="flex items-center justify-between">
            <h2 className="section-title text-primary">SYNC & DIFF</h2>
            <button
              onClick={clearImport}
              className="px-4 py-2 bg-surface-elevated border border-border hover:border-primary transition-colors font-mono text-xs text-white"
            >
              TRY AGAIN
            </button>
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center p-12">
          <div className="text-center">
            <p className="font-mono text-sm text-error mb-2">{importError}</p>
            {importedFileName && (
              <p className="font-mono text-xs text-text-secondary">File: {importedFileName}</p>
            )}
          </div>
        </div>
      </div>
    )
  }

  // No file imported yet — show drop zone
  if (!diffResult) {
    return (
      <div className="h-full flex flex-col">
        <div className="p-6 border-b border-border">
          <h2 className="section-title text-primary">SYNC & DIFF</h2>
          <p className="font-mono text-xs text-text-secondary mt-2">
            Compare {activeSet.name} against an external file
          </p>
        </div>
        <SyncDropZone onFileLoaded={importFile} />
      </div>
    )
  }

  // Diff view
  return (
    <div className="h-full flex flex-col">
      <SyncHeader
        fileName={importedFileName || ''}
        format={importedFormat || 'unknown'}
        diffResult={diffResult}
        filter={syncFilter}
        onFilterChange={setSyncFilter}
        onClear={clearImport}
        onApply={applyToEditor}
        onExport={handleExport}
        resolvedCount={resolvedCount}
        totalConflicts={totalConflicts}
      />
      <SyncDiffPanel
        diffResult={diffResult}
        resolutions={resolutions}
        filter={syncFilter}
        onResolve={resolveToken}
      />
    </div>
  )
}
```

**Step 2: Verify the full feature works**

Run: `npm run dev`

Test these scenarios:
1. Click "SYNC" in the nav — should see drop zone with "Drop a file to compare"
2. Export tokens from the Compiler view as CSS, then import that CSS file in Sync — should show all tokens as "same" (green)
3. Edit a token value in the editor, then re-import the CSS — should show that token as "different" (amber)
4. Try importing an unsupported file type — should show error message
5. Click resolution arrows on different tokens — progress counter should update
6. After resolving all conflicts, "Apply to Editor" should be enabled

**Step 3: Commit**

```bash
git add src/pages/SyncView.tsx
git commit -m "feat: wire up SyncView with full diff and resolution UI"
```

---

## Task 14: Build Verification

Ensure the full app builds without TypeScript or bundler errors.

**Step 1: Run the build**

Run: `npm run build`
Expected: Build succeeds with no errors.

**Step 2: Fix any TypeScript errors**

If there are type errors, fix them. Common issues:
- Missing imports
- Type mismatches between FlatToken and Token
- Zustand persist middleware needing updated type for new state fields

**Step 3: Final commit**

```bash
git add -A
git commit -m "feat: complete Phase 4 — Sync & Diff"
```

---

## Summary

| Task | Description | Files |
|------|-------------|-------|
| 1 | Flatten tokens utility | `src/lib/flatten-tokens.ts`, `src/lib/resolver.ts` |
| 2 | CSS parser | `src/lib/parsers/css-parser.ts` |
| 3 | SCSS parser | `src/lib/parsers/scss-parser.ts` |
| 4 | W3C JSON parser | `src/lib/parsers/w3c-json-parser.ts` |
| 5 | Figma JSON parser | `src/lib/parsers/figma-parser.ts` |
| 6 | Format detection | `src/lib/parsers/index.ts` |
| 7 | Diff engine | `src/lib/diff-engine.ts` |
| 8 | Store sync state | `src/store/useTokenStore.ts` |
| 9 | SyncDropZone | `src/components/sync/SyncDropZone.tsx` |
| 10 | SyncHeader | `src/components/sync/SyncHeader.tsx` |
| 11 | SyncTokenRow | `src/components/sync/SyncTokenRow.tsx` |
| 12 | SyncDiffPanel | `src/components/sync/SyncDiffPanel.tsx` |
| 13 | Wire up SyncView | `src/pages/SyncView.tsx` |
| 14 | Build verification | All files |
