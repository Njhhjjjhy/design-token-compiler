import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { AppState, TokenSet, ViewMode } from '@/types'

interface TokenStoreState extends AppState {
  // UI State
  activeView: ViewMode
  setActiveView: (view: ViewMode) => void

  // Token Set Management
  addTokenSet: (tokenSet: TokenSet) => void
  updateTokenSet: (id: string, tokenSet: Partial<TokenSet>) => void
  deleteTokenSet: (id: string) => void
  setActiveSet: (id: string | null) => void

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
