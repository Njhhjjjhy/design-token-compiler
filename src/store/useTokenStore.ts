import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { AppState, Mode, Token, TokenGroup, TokenSet, TokenValue, Version, ViewMode } from '@/types'
import type { FlatToken } from '@/lib/flatten-tokens'
import type { DiffResult } from '@/lib/diff-engine'
import type { ImportFormat } from '@/lib/parsers'
import { flattenTokens, toFlatTokenList } from '@/lib/flatten-tokens'
import { parseFile } from '@/lib/parsers'
import { diffTokens } from '@/lib/diff-engine'

interface TokenStoreState extends AppState {
  // UI State
  activeView: ViewMode
  setActiveView: (view: ViewMode) => void

  // Token Set Management
  addTokenSet: (tokenSet: TokenSet) => void
  updateTokenSet: (id: string, tokenSet: Partial<TokenSet>) => void
  deleteTokenSet: (id: string) => void
  setActiveSet: (id: string | null) => void

  // Token Manipulation
  updateToken: (tokenId: string, newValue: TokenValue) => void
  addToken: (parentPath: string, tokenData: Partial<Token>) => void
  deleteToken: (tokenId: string) => void

  // Mode Management
  setActiveMode: (setId: string, modeId: string | null) => void
  addMode: (setId: string, mode: Mode) => void
  renameMode: (setId: string, modeId: string, newName: string) => void
  updateModeOverride: (setId: string, modeId: string, tokenIdOrPath: string, value: TokenValue) => void
  removeModeOverride: (setId: string, modeId: string, tokenIdOrPath: string) => void
  deleteMode: (setId: string, modeId: string) => void

  // Helpers
  getActiveTokenSet: () => TokenSet | null

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

  // Version state
  versions: Record<string, Version[]>

  // Version actions
  saveVersion: (name?: string) => void
  restoreVersion: (setId: string, versionId: string) => void
  deleteVersion: (setId: string, versionId: string) => void
  getVersionsForActiveSet: () => Version[]
}

function countTokensInTree(tokens: Record<string, Token | TokenGroup>): number {
  let count = 0
  for (const value of Object.values(tokens)) {
    if ('tokens' in value) {
      count += countTokensInTree(value.tokens)
    } else {
      count++
    }
  }
  return count
}

export const useTokenStore = create<TokenStoreState>()(
  persist(
    (set, get) => ({
      // Initial state
      tokenSets: {},
      activeSetId: null,
      syncResults: {},
      versions: {},
      activeView: 'dashboard',

      // Sync initial state
      importedFileName: null,
      importedFormat: null,
      importedTokens: [],
      importError: null,
      diffResult: null,
      resolutions: {},
      syncFilter: 'all',

      // UI Actions
      setActiveView: (view) => set({ activeView: view }),

      // Token Set Actions
      addTokenSet: (tokenSet) =>
        set((state) => ({
          tokenSets: {
            ...state.tokenSets,
            [tokenSet.id]: tokenSet,
          },
          activeSetId: tokenSet.id,
        })),

      updateTokenSet: (id, updates) =>
        set((state) => {
          const existingSet = state.tokenSets[id]
          if (!existingSet) return state

          return {
            tokenSets: {
              ...state.tokenSets,
              [id]: {
                ...existingSet,
                ...updates,
                metadata: {
                  ...existingSet.metadata,
                  updatedAt: Date.now(),
                },
              },
            },
          }
        }),

      deleteTokenSet: (id) =>
        set((state) => {
          const { [id]: removed, ...remaining } = state.tokenSets
          return {
            tokenSets: remaining,
            activeSetId: state.activeSetId === id ? null : state.activeSetId,
          }
        }),

      setActiveSet: (id) => set({ activeSetId: id }),

      // Token Manipulation
      updateToken: (tokenId, newValue) =>
        set((state) => {
          const activeSet = state.activeSetId ? state.tokenSets[state.activeSetId] : null
          if (!activeSet) return state

          const updateInTokens = (tokens: Record<string, Token | TokenGroup>): Record<string, Token | TokenGroup> => {
            const result = { ...tokens }
            for (const key in result) {
              const item = result[key]
              if ('tokens' in item) {
                result[key] = {
                  ...item,
                  tokens: updateInTokens(item.tokens),
                }
              } else if (item.id === tokenId) {
                result[key] = {
                  ...item,
                  value: newValue,
                }
              }
            }
            return result
          }

          return {
            tokenSets: {
              ...state.tokenSets,
              [activeSet.id]: {
                ...activeSet,
                tokens: updateInTokens(activeSet.tokens),
                metadata: {
                  ...activeSet.metadata,
                  updatedAt: Date.now(),
                },
              },
            },
          }
        }),

      addToken: (parentPath, tokenData) =>
        set((state) => {
          const activeSet = state.activeSetId ? state.tokenSets[state.activeSetId] : null
          if (!activeSet) return state

          const newToken: Token = {
            id: `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
            name: tokenData.name || 'new-token',
            value: tokenData.value || '',
            type: tokenData.type || 'color',
            description: tokenData.description,
          }

          const addToTokens = (
            tokens: Record<string, Token | TokenGroup>,
            path: string[]
          ): Record<string, Token | TokenGroup> => {
            if (path.length === 0) {
              return {
                ...tokens,
                [newToken.name]: newToken,
              }
            }

            const [current, ...rest] = path
            const item = tokens[current]

            if (item && 'tokens' in item) {
              return {
                ...tokens,
                [current]: {
                  ...item,
                  tokens: addToTokens(item.tokens, rest),
                },
              }
            }

            return tokens
          }

          const pathParts = parentPath.split('.').filter(Boolean)

          return {
            tokenSets: {
              ...state.tokenSets,
              [activeSet.id]: {
                ...activeSet,
                tokens: addToTokens(activeSet.tokens, pathParts),
                metadata: {
                  ...activeSet.metadata,
                  updatedAt: Date.now(),
                },
              },
            },
          }
        }),

      deleteToken: (tokenId) =>
        set((state) => {
          const activeSet = state.activeSetId ? state.tokenSets[state.activeSetId] : null
          if (!activeSet) return state

          const deleteFromTokens = (tokens: Record<string, Token | TokenGroup>): Record<string, Token | TokenGroup> => {
            const result: Record<string, Token | TokenGroup> = {}
            for (const key in tokens) {
              const item = tokens[key]
              if ('tokens' in item) {
                result[key] = {
                  ...item,
                  tokens: deleteFromTokens(item.tokens),
                }
              } else if (item.id !== tokenId) {
                result[key] = item
              }
            }
            return result
          }

          return {
            tokenSets: {
              ...state.tokenSets,
              [activeSet.id]: {
                ...activeSet,
                tokens: deleteFromTokens(activeSet.tokens),
                metadata: {
                  ...activeSet.metadata,
                  updatedAt: Date.now(),
                },
              },
            },
          }
        }),

      // Helpers
      getActiveTokenSet: () => {
        const state = get()
        if (!state.activeSetId) return null
        return state.tokenSets[state.activeSetId] || null
      },

      // Mode Management
      setActiveMode: (setId, modeId) =>
        set((state) => {
          const tokenSet = state.tokenSets[setId]
          if (!tokenSet) return state
          return {
            tokenSets: {
              ...state.tokenSets,
              [setId]: {
                ...tokenSet,
                activeMode: modeId,
                metadata: { ...tokenSet.metadata, updatedAt: Date.now() },
              },
            },
          }
        }),

      addMode: (setId, mode) =>
        set((state) => {
          const tokenSet = state.tokenSets[setId]
          if (!tokenSet) return state
          const isFirst = Object.keys(tokenSet.modes).length === 0
          return {
            tokenSets: {
              ...state.tokenSets,
              [setId]: {
                ...tokenSet,
                modes: { ...tokenSet.modes, [mode.id]: mode },
                activeMode: isFirst ? mode.id : tokenSet.activeMode,
                metadata: { ...tokenSet.metadata, updatedAt: Date.now() },
              },
            },
          }
        }),

      renameMode: (setId, modeId, newName) =>
        set((state) => {
          const tokenSet = state.tokenSets[setId]
          const mode = tokenSet?.modes[modeId]
          if (!tokenSet || !mode) return state
          return {
            tokenSets: {
              ...state.tokenSets,
              [setId]: {
                ...tokenSet,
                modes: {
                  ...tokenSet.modes,
                  [modeId]: { ...mode, name: newName },
                },
                metadata: { ...tokenSet.metadata, updatedAt: Date.now() },
              },
            },
          }
        }),

      updateModeOverride: (setId, modeId, tokenIdOrPath, value) =>
        set((state) => {
          const tokenSet = state.tokenSets[setId]
          const mode = tokenSet?.modes[modeId]
          if (!tokenSet || !mode) return state
          return {
            tokenSets: {
              ...state.tokenSets,
              [setId]: {
                ...tokenSet,
                modes: {
                  ...tokenSet.modes,
                  [modeId]: {
                    ...mode,
                    overrides: { ...mode.overrides, [tokenIdOrPath]: value },
                  },
                },
                metadata: { ...tokenSet.metadata, updatedAt: Date.now() },
              },
            },
          }
        }),

      removeModeOverride: (setId, modeId, tokenIdOrPath) =>
        set((state) => {
          const tokenSet = state.tokenSets[setId]
          const mode = tokenSet?.modes[modeId]
          if (!tokenSet || !mode) return state
          const { [tokenIdOrPath]: _removed, ...remainingOverrides } = mode.overrides
          return {
            tokenSets: {
              ...state.tokenSets,
              [setId]: {
                ...tokenSet,
                modes: {
                  ...tokenSet.modes,
                  [modeId]: { ...mode, overrides: remainingOverrides },
                },
                metadata: { ...tokenSet.metadata, updatedAt: Date.now() },
              },
            },
          }
        }),

      deleteMode: (setId, modeId) =>
        set((state) => {
          const tokenSet = state.tokenSets[setId]
          if (!tokenSet) return state
          const { [modeId]: _removed, ...remainingModes } = tokenSet.modes
          const modeIds = Object.keys(remainingModes)
          const newActiveMode = tokenSet.activeMode === modeId
            ? (modeIds[0] || null)
            : tokenSet.activeMode
          return {
            tokenSets: {
              ...state.tokenSets,
              [setId]: {
                ...tokenSet,
                modes: remainingModes,
                activeMode: newActiveMode,
                metadata: { ...tokenSet.metadata, updatedAt: Date.now() },
              },
            },
          }
        }),

      // Sync actions
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

        // Start with current tokens
        let updatedTokens = { ...activeSet.tokens }

        for (const row of state.diffResult.rows) {
          const resolution = state.resolutions[row.path]

          if (row.status === 'different' && resolution === 'imported' && row.fileToken) {
            updatedTokens = updateTokenInTree(updatedTokens, row.path, row.fileToken.value)
          }

          if (row.status === 'editor_only' && resolution === 'discard') {
            updatedTokens = removeTokenFromTree(updatedTokens, row.path)
          }

          if (row.status === 'file_only' && resolution === 'add' && row.fileToken) {
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

      saveVersion: (name) => {
        const state = get()
        const activeSet = state.activeSetId ? state.tokenSets[state.activeSetId] : null
        if (!activeSet) return

        const setVersions = state.versions[activeSet.id] || []
        const versionNumber = setVersions.length + 1

        const version: Version = {
          id: `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
          name: name || `v${versionNumber} — ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`,
          timestamp: Date.now(),
          tokenSnapshot: JSON.parse(JSON.stringify(activeSet.tokens)),
          tokenCount: countTokensInTree(activeSet.tokens),
        }

        const updated = [...setVersions, version]
        if (updated.length > 50) {
          updated.splice(0, updated.length - 50)
        }

        set({
          versions: {
            ...state.versions,
            [activeSet.id]: updated,
          },
        })
      },

      restoreVersion: (setId, versionId) => {
        const state = get()
        const tokenSet = state.tokenSets[setId]
        const setVersions = state.versions[setId] || []
        const version = setVersions.find((v) => v.id === versionId)

        if (!tokenSet || !version) return

        const currentVersions = state.versions[setId] || []
        const autoSave: Version = {
          id: `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
          name: `Before restore — ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`,
          timestamp: Date.now(),
          tokenSnapshot: JSON.parse(JSON.stringify(tokenSet.tokens)),
          tokenCount: countTokensInTree(tokenSet.tokens),
        }

        const updatedVersions = [...currentVersions, autoSave]
        if (updatedVersions.length > 50) {
          updatedVersions.splice(0, updatedVersions.length - 50)
        }

        set({
          tokenSets: {
            ...state.tokenSets,
            [setId]: {
              ...tokenSet,
              tokens: JSON.parse(JSON.stringify(version.tokenSnapshot)),
              metadata: { ...tokenSet.metadata, updatedAt: Date.now() },
            },
          },
          versions: {
            ...state.versions,
            [setId]: updatedVersions,
          },
        })
      },

      deleteVersion: (setId, versionId) => {
        const state = get()
        const setVersions = state.versions[setId] || []
        set({
          versions: {
            ...state.versions,
            [setId]: setVersions.filter((v) => v.id !== versionId),
          },
        })
      },

      getVersionsForActiveSet: () => {
        const state = get()
        if (!state.activeSetId) return []
        return state.versions[state.activeSetId] || []
      },
    }),
    {
      name: 'token-compiler-storage',
      version: 1,
    }
  )
)

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
    return {
      ...tokens,
      [first]: { ...existing, tokens: addTokenToTree(existing.tokens, rest.join('.'), flatToken) },
    }
  }

  const newGroup: TokenGroup = {
    id: `group-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
    name: first,
    tokens: addTokenToTree({}, rest.join('.'), flatToken),
  }

  return { ...tokens, [first]: newGroup }
}
