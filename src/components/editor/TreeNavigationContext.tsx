import { createContext, useContext } from 'react'

export interface TreeNavigationContextValue {
  focusedNodeId: string | null
  isEditing: boolean
  setIsEditing: (editing: boolean) => void
  expandedGroups: Set<string>
  toggleGroup: (groupPath: string) => void
  returnFocusToTree: () => void
}

const TreeNavigationContext = createContext<TreeNavigationContextValue | null>(null)

export const TreeNavigationProvider = TreeNavigationContext.Provider

export function useTreeNavigationContext(): TreeNavigationContextValue {
  const ctx = useContext(TreeNavigationContext)
  if (!ctx) {
    throw new Error('useTreeNavigationContext must be used within TreeNavigationProvider')
  }
  return ctx
}
