import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { AppState, Token, TokenGroup, TokenSet, TokenValue, ViewMode } from '@/types'

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

  // Helpers
  getActiveTokenSet: () => TokenSet | null
}

export const useTokenStore = create<TokenStoreState>()(
  persist(
    (set, get) => ({
      // Initial state
      tokenSets: {},
      activeSetId: null,
      versionHistory: {},
      syncResults: {},
      activeView: 'editor',

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
    }),
    {
      name: 'token-compiler-storage',
      version: 1,
    }
  )
)
