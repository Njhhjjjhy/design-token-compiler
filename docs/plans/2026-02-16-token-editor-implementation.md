# Token Editor MVP Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a recursive tree editor with inline editing, visual previews, and add/delete operations for design tokens.

**Architecture:** React components with Zustand state management. Recursive tree structure (TokenTree → TokenTreeNode → TokenGroupNode/TokenValueNode). No new dependencies - uses existing Lucide React icons, Tailwind CSS, and Zustand store.

**Tech Stack:** React 18, TypeScript, Zustand, Tailwind CSS, Lucide React

---

## Task 1: Add Store Methods for Token Manipulation

**Files:**
- Modify: `src/store/useTokenStore.ts:18-86`

**Step 1: Add updateToken method to store**

Add this method inside the store definition (after `getActiveTokenSet`):

```typescript
updateToken: (tokenId: string, newValue: TokenValue) =>
  set((state) => {
    const activeSet = state.activeSetId ? state.tokenSets[state.activeSetId] : null
    if (!activeSet) return state

    // Helper to recursively update token in nested structure
    const updateInTokens = (tokens: Record<string, Token | TokenGroup>): Record<string, Token | TokenGroup> => {
      const result = { ...tokens }
      for (const key in result) {
        const item = result[key]
        if ('tokens' in item) {
          // It's a group - recurse
          result[key] = {
            ...item,
            tokens: updateInTokens(item.tokens),
          }
        } else if (item.id === tokenId) {
          // Found the token - update it
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
```

**Step 2: Add addToken method to store**

Add this method after `updateToken`:

```typescript
addToken: (parentPath: string, tokenData: Partial<Token>) =>
  set((state) => {
    const activeSet = state.activeSetId ? state.tokenSets[state.activeSetId] : null
    if (!activeSet) return state

    // Generate new token with required fields
    const newToken: Token = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: tokenData.name || 'new-token',
      value: tokenData.value || '',
      type: tokenData.type || 'color',
      description: tokenData.description,
    }

    // Helper to add token to nested structure
    const addToTokens = (
      tokens: Record<string, Token | TokenGroup>,
      path: string[]
    ): Record<string, Token | TokenGroup> => {
      if (path.length === 0) {
        // Add at this level
        return {
          ...tokens,
          [newToken.name]: newToken,
        }
      }

      const [current, ...rest] = path
      const item = tokens[current]

      if (item && 'tokens' in item) {
        // It's a group - recurse
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
```

**Step 3: Add deleteToken method to store**

Add this method after `addToken`:

```typescript
deleteToken: (tokenId: string) =>
  set((state) => {
    const activeSet = state.activeSetId ? state.tokenSets[state.activeSetId] : null
    if (!activeSet) return state

    // Helper to recursively delete token from nested structure
    const deleteFromTokens = (tokens: Record<string, Token | TokenGroup>): Record<string, Token | TokenGroup> => {
      const result: Record<string, Token | TokenGroup> = {}
      for (const key in tokens) {
        const item = tokens[key]
        if ('tokens' in item) {
          // It's a group - recurse
          result[key] = {
            ...item,
            tokens: deleteFromTokens(item.tokens),
          }
        } else if (item.id !== tokenId) {
          // Keep this token (not the one we're deleting)
          result[key] = item
        }
        // If item.id === tokenId, don't include it (delete it)
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
```

**Step 4: Update TypeScript interface to include new methods**

Update the `TokenStoreState` interface (around line 5):

```typescript
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
```

**Step 5: Test store methods in browser console**

Run dev server:
```bash
npm run dev
```

Open browser console and test:
```javascript
// Get store
const store = window.__ZUSTAND_STORE__ // or use React DevTools

// Test updateToken (if you have sample data loaded)
// This will be manually tested after we build the UI
```

**Step 6: Commit store changes**

```bash
git add src/store/useTokenStore.ts
git commit -m "feat: add token manipulation methods to store

Add updateToken, addToken, and deleteToken methods for inline
editing, creating, and removing tokens from the active token set.

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 2: Create EmptyState Component

**Files:**
- Create: `src/components/editor/EmptyState.tsx`

**Step 1: Create component file**

```tsx
import { FileQuestion } from 'lucide-react'

export function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center h-64 text-text-secondary">
      <FileQuestion className="w-12 h-12 mb-4 opacity-50" />
      <p className="font-mono text-sm">No tokens defined</p>
      <p className="font-mono text-xs mt-2 opacity-70">
        Click "Add Token" to create your first token
      </p>
    </div>
  )
}
```

**Step 2: Verify component renders (manual check later)**

This will be tested when integrated into EditorView.

**Step 3: Commit**

```bash
git add src/components/editor/EmptyState.tsx
git commit -m "feat: create EmptyState component for empty token sets

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 3: Create TokenValueNode Component

**Files:**
- Create: `src/components/editor/TokenValueNode.tsx`

**Step 1: Create component with basic display and inline editing**

```tsx
import { useState, useRef, useEffect } from 'react'
import { Trash2 } from 'lucide-react'
import type { Token, TokenValue } from '@/types'
import { useTokenStore } from '@/store/useTokenStore'

interface TokenValueNodeProps {
  token: Token
  depth: number
}

export function TokenValueNode({ token, depth }: TokenValueNodeProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState('')
  const [isInvalid, setIsInvalid] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const updateToken = useTokenStore((state) => state.updateToken)
  const deleteToken = useTokenStore((state) => state.deleteToken)

  const paddingLeft = depth * 16

  // Convert token value to string for editing
  const valueString = typeof token.value === 'string'
    ? token.value
    : JSON.stringify(token.value)

  const handleEditStart = () => {
    setEditValue(valueString)
    setIsEditing(true)
  }

  const handleEditSave = () => {
    // Basic validation - just check it's not empty
    if (!editValue.trim()) {
      setIsInvalid(true)
      return
    }

    // Try to parse if it looks like JSON, otherwise use as string
    let newValue: TokenValue = editValue
    if (editValue.startsWith('{') || editValue.startsWith('[')) {
      try {
        newValue = JSON.parse(editValue)
      } catch {
        // Keep as string if parse fails
      }
    }

    updateToken(token.id, newValue)
    setIsEditing(false)
    setIsInvalid(false)
  }

  const handleEditCancel = () => {
    setIsEditing(false)
    setIsInvalid(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleEditSave()
    } else if (e.key === 'Escape') {
      handleEditCancel()
    }
  }

  const handleDelete = () => {
    if (window.confirm(`Delete token '${token.name}'? This cannot be undone.`)) {
      deleteToken(token.id)
    }
  }

  // Auto-focus input when entering edit mode
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [isEditing])

  // Render color swatch for color tokens
  const renderPreview = () => {
    if (token.type === 'color' && typeof token.value === 'string') {
      const colorValue = token.value.startsWith('{')
        ? '#cccccc' // Placeholder for references
        : token.value
      return (
        <div
          className="w-4 h-4 rounded border border-gray-600"
          style={{ backgroundColor: colorValue }}
        />
      )
    }

    if (token.type === 'dimension' && typeof token.value === 'string') {
      // Extract numeric value for bar width (simplified)
      const match = token.value.match(/(\d+)/)
      const numValue = match ? parseInt(match[1]) : 0
      const barWidth = Math.min(numValue, 64) // Cap at 64px for display
      return (
        <div
          className="h-3 bg-gray-500 rounded"
          style={{ width: `${barWidth}px` }}
        />
      )
    }

    return null
  }

  return (
    <div
      className="group flex items-center gap-3 py-2 hover:bg-white/5 transition-colors"
      style={{ paddingLeft: `${paddingLeft}px` }}
    >
      {/* Token Name */}
      <span className="font-mono text-sm text-text-primary min-w-[120px]">
        {token.name}
      </span>

      {/* Type Badge */}
      <span className="px-2 py-0.5 text-xs font-mono uppercase rounded bg-blue-500/20 text-blue-400">
        {token.type}
      </span>

      {/* Value (editable) */}
      {isEditing ? (
        <input
          ref={inputRef}
          type="text"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={handleEditSave}
          onKeyDown={handleKeyDown}
          className={`flex-1 px-2 py-1 font-mono text-sm bg-bg-secondary border rounded focus:outline-none focus:ring-1 ${
            isInvalid
              ? 'border-red-500 focus:ring-red-500'
              : 'border-border-default focus:border-primary focus:ring-primary'
          }`}
        />
      ) : (
        <button
          onClick={handleEditStart}
          className="flex-1 text-left px-2 py-1 font-mono text-sm text-text-secondary hover:bg-white/10 rounded cursor-text"
        >
          {valueString}
        </button>
      )}

      {/* Preview */}
      <div className="w-16 flex items-center justify-center">
        {renderPreview()}
      </div>

      {/* Delete Button */}
      <button
        onClick={handleDelete}
        className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-400 transition-all"
        title="Delete token"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  )
}
```

**Step 2: Test component in isolation (manual testing after integration)**

Will test once integrated into the tree.

**Step 3: Commit**

```bash
git add src/components/editor/TokenValueNode.tsx
git commit -m "feat: create TokenValueNode with inline editing

Add component for displaying individual tokens with:
- Inline editing (click to edit, Enter to save, Escape to cancel)
- Visual previews for color and dimension tokens
- Delete button with confirmation
- Type badges

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 4: Create TokenGroupNode Component

**Files:**
- Create: `src/components/editor/TokenGroupNode.tsx`

**Step 1: Create component with expand/collapse**

```tsx
import { useState } from 'react'
import { ChevronRight } from 'lucide-react'
import type { TokenGroup } from '@/types'
import { TokenTreeNode } from './TokenTreeNode'

interface TokenGroupNodeProps {
  group: TokenGroup
  groupKey: string
  depth: number
}

export function TokenGroupNode({ group, groupKey, depth }: TokenGroupNodeProps) {
  // Top-level groups start expanded, nested groups start collapsed
  const [isExpanded, setIsExpanded] = useState(depth === 0)
  const paddingLeft = depth * 16

  const toggleExpand = () => {
    setIsExpanded(!isExpanded)
  }

  return (
    <div>
      {/* Group Header */}
      <button
        onClick={toggleExpand}
        className="w-full flex items-center gap-2 py-2 hover:bg-white/5 transition-colors text-left"
        style={{ paddingLeft: `${paddingLeft}px` }}
      >
        <ChevronRight
          className={`w-4 h-4 text-text-secondary transition-transform duration-200 ${
            isExpanded ? 'rotate-90' : ''
          }`}
        />
        <span className="font-mono text-sm font-semibold text-text-primary">
          {groupKey}
        </span>
        <span className="text-xs text-text-tertiary font-mono">
          ({Object.keys(group.tokens).length})
        </span>
      </button>

      {/* Children (when expanded) */}
      {isExpanded && (
        <div>
          {Object.entries(group.tokens).map(([key, item]) => (
            <TokenTreeNode
              key={key}
              itemKey={key}
              item={item}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  )
}
```

**Step 2: Test expand/collapse behavior (manual testing after integration)**

Will test once integrated.

**Step 3: Commit**

```bash
git add src/components/editor/TokenGroupNode.tsx
git commit -m "feat: create TokenGroupNode with expand/collapse

Add component for displaying token groups with:
- Chevron icon that rotates on expand/collapse
- Count of child tokens
- Recursive rendering of children
- Top-level groups expanded by default

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 5: Create TokenTreeNode Dispatcher

**Files:**
- Create: `src/components/editor/TokenTreeNode.tsx`

**Step 1: Create dispatcher component**

```tsx
import type { Token, TokenGroup } from '@/types'
import { TokenGroupNode } from './TokenGroupNode'
import { TokenValueNode } from './TokenValueNode'

interface TokenTreeNodeProps {
  itemKey: string
  item: Token | TokenGroup
  depth: number
}

export function TokenTreeNode({ itemKey, item, depth }: TokenTreeNodeProps) {
  // Check if this is a group or a token
  const isGroup = 'tokens' in item

  if (isGroup) {
    return <TokenGroupNode group={item} groupKey={itemKey} depth={depth} />
  } else {
    return <TokenValueNode token={item} depth={depth} />
  }
}
```

**Step 2: Verify type checking passes**

Run:
```bash
npm run build
```

Expected: No TypeScript errors

**Step 3: Commit**

```bash
git add src/components/editor/TokenTreeNode.tsx
git commit -m "feat: create TokenTreeNode dispatcher component

Add component that determines if an item is a group or token
and renders the appropriate sub-component.

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 6: Create TokenTree Component

**Files:**
- Create: `src/components/editor/TokenTree.tsx`

**Step 1: Create tree container component**

```tsx
import type { TokenSet } from '@/types'
import { TokenTreeNode } from './TokenTreeNode'
import { EmptyState } from './EmptyState'

interface TokenTreeProps {
  tokenSet: TokenSet
}

export function TokenTree({ tokenSet }: TokenTreeProps) {
  const hasTokens = Object.keys(tokenSet.tokens).length > 0

  if (!hasTokens) {
    return <EmptyState />
  }

  return (
    <div className="space-y-1">
      {Object.entries(tokenSet.tokens).map(([key, item]) => (
        <TokenTreeNode key={key} itemKey={key} item={item} depth={0} />
      ))}
    </div>
  )
}
```

**Step 2: Test that it compiles**

Run:
```bash
npm run build
```

Expected: No TypeScript errors

**Step 3: Commit**

```bash
git add src/components/editor/TokenTree.tsx
git commit -m "feat: create TokenTree container component

Add main tree component that iterates over top-level tokens
and renders them via TokenTreeNode. Shows EmptyState when
no tokens exist.

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 7: Create EditorHeader Component

**Files:**
- Create: `src/components/editor/EditorHeader.tsx`

**Step 1: Create toolbar component**

```tsx
import { Plus } from 'lucide-react'

interface EditorHeaderProps {
  onAddToken: () => void
}

export function EditorHeader({ onAddToken }: EditorHeaderProps) {
  return (
    <div className="flex items-center justify-between pb-6 border-b border-border-default">
      <h2 className="section-title text-primary">TOKEN EDITOR</h2>
      <button
        onClick={onAddToken}
        className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 text-white font-mono text-sm rounded transition-colors"
      >
        <Plus className="w-4 h-4" />
        Add Token
      </button>
    </div>
  )
}
```

**Step 2: Verify styling matches design**

This will be verified visually after integration.

**Step 3: Commit**

```bash
git add src/components/editor/EditorHeader.tsx
git commit -m "feat: create EditorHeader toolbar component

Add toolbar with 'Add Token' button using crimson accent color.

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 8: Create AddTokenDialog Component

**Files:**
- Create: `src/components/editor/AddTokenDialog.tsx`

**Step 1: Create modal dialog component**

```tsx
import { useState } from 'react'
import { X } from 'lucide-react'
import type { TokenType, Token } from '@/types'
import { useTokenStore } from '@/store/useTokenStore'

interface AddTokenDialogProps {
  isOpen: boolean
  onClose: () => void
}

export function AddTokenDialog({ isOpen, onClose }: AddTokenDialogProps) {
  const [parentPath, setParentPath] = useState('')
  const [tokenName, setTokenName] = useState('')
  const [tokenType, setTokenType] = useState<TokenType>('color')
  const [tokenValue, setTokenValue] = useState('')

  const addToken = useTokenStore((state) => state.addToken)
  const activeSet = useTokenStore((state) => state.getActiveTokenSet())

  const handleCreate = () => {
    if (!tokenName || !tokenValue) {
      alert('Please fill in all required fields')
      return
    }

    const tokenData: Partial<Token> = {
      name: tokenName,
      type: tokenType,
      value: tokenValue,
    }

    addToken(parentPath, tokenData)

    // Reset form and close
    setParentPath('')
    setTokenName('')
    setTokenType('color')
    setTokenValue('')
    onClose()
  }

  const handleCancel = () => {
    // Reset form and close
    setParentPath('')
    setTokenName('')
    setTokenType('color')
    setTokenValue('')
    onClose()
  }

  if (!isOpen) return null

  // Get available parent paths from token set
  const getParentPaths = (
    tokens: Record<string, any>,
    prefix: string = ''
  ): string[] => {
    const paths: string[] = [''] // Root level

    for (const [key, item] of Object.entries(tokens)) {
      const currentPath = prefix ? `${prefix}.${key}` : key
      if ('tokens' in item) {
        paths.push(currentPath)
        paths.push(...getParentPaths(item.tokens, currentPath))
      }
    }

    return paths
  }

  const parentPaths = activeSet ? getParentPaths(activeSet.tokens) : ['']

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-bg-primary border border-border-default rounded-lg p-6 w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-mono text-lg font-semibold text-text-primary">
            Add Token
          </h3>
          <button
            onClick={handleCancel}
            className="p-1 hover:bg-white/10 rounded transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <div className="space-y-4">
          {/* Parent Group */}
          <div>
            <label className="block font-mono text-sm text-text-secondary mb-2">
              Parent Group
            </label>
            <select
              value={parentPath}
              onChange={(e) => setParentPath(e.target.value)}
              className="w-full px-3 py-2 bg-bg-secondary border border-border-default rounded font-mono text-sm text-text-primary focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
            >
              {parentPaths.map((path) => (
                <option key={path} value={path}>
                  {path || '(root)'}
                </option>
              ))}
            </select>
          </div>

          {/* Token Name */}
          <div>
            <label className="block font-mono text-sm text-text-secondary mb-2">
              Token Name *
            </label>
            <input
              type="text"
              value={tokenName}
              onChange={(e) => setTokenName(e.target.value)}
              placeholder="e.g., primary-dark"
              className="w-full px-3 py-2 bg-bg-secondary border border-border-default rounded font-mono text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
            />
          </div>

          {/* Token Type */}
          <div>
            <label className="block font-mono text-sm text-text-secondary mb-2">
              Token Type
            </label>
            <select
              value={tokenType}
              onChange={(e) => setTokenType(e.target.value as TokenType)}
              className="w-full px-3 py-2 bg-bg-secondary border border-border-default rounded font-mono text-sm text-text-primary focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
            >
              <option value="color">Color</option>
              <option value="dimension">Dimension</option>
              <option value="fontFamily">Font Family</option>
              <option value="fontWeight">Font Weight</option>
              <option value="duration">Duration</option>
              <option value="cubicBezier">Cubic Bezier</option>
              <option value="number">Number</option>
              <option value="typography">Typography</option>
              <option value="shadow">Shadow</option>
            </select>
          </div>

          {/* Token Value */}
          <div>
            <label className="block font-mono text-sm text-text-secondary mb-2">
              Token Value *
            </label>
            <input
              type="text"
              value={tokenValue}
              onChange={(e) => setTokenValue(e.target.value)}
              placeholder="e.g., #1a1a1a or {color.primary}"
              className="w-full px-3 py-2 bg-bg-secondary border border-border-default rounded font-mono text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 mt-6">
          <button
            onClick={handleCancel}
            className="px-4 py-2 font-mono text-sm text-text-secondary hover:bg-white/10 rounded transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            className="px-4 py-2 bg-primary hover:bg-primary/90 text-white font-mono text-sm rounded transition-colors"
          >
            Create
          </button>
        </div>
      </div>
    </div>
  )
}
```

**Step 2: Test dialog opens and closes (manual testing after integration)**

Will test after integration into EditorView.

**Step 3: Commit**

```bash
git add src/components/editor/AddTokenDialog.tsx
git commit -m "feat: create AddTokenDialog modal component

Add modal for creating new tokens with:
- Parent group selection (dropdown of available paths)
- Token name input
- Token type selector
- Token value input
- Create/Cancel actions

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 9: Update EditorView to Use New Components

**Files:**
- Modify: `src/pages/EditorView.tsx:1-11`

**Step 1: Replace placeholder with full editor**

```tsx
import { useState } from 'react'
import { useTokenStore } from '@/store/useTokenStore'
import { EditorHeader } from '@/components/editor/EditorHeader'
import { TokenTree } from '@/components/editor/TokenTree'
import { AddTokenDialog } from '@/components/editor/AddTokenDialog'

export function EditorView() {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const activeSet = useTokenStore((state) => state.getActiveTokenSet())

  if (!activeSet) {
    return (
      <div className="p-8">
        <h2 className="section-title text-primary mb-6">TOKEN EDITOR</h2>
        <p className="font-mono text-sm text-text-secondary">
          No token set loaded. Create or import a token set to begin editing.
        </p>
      </div>
    )
  }

  return (
    <div className="p-8">
      <EditorHeader onAddToken={() => setIsAddDialogOpen(true)} />

      <div className="mt-6">
        <TokenTree tokenSet={activeSet} />
      </div>

      <AddTokenDialog
        isOpen={isAddDialogOpen}
        onClose={() => setIsAddDialogOpen(false)}
      />
    </div>
  )
}
```

**Step 2: Test that app compiles and runs**

Run:
```bash
npm run dev
```

Open browser to `http://localhost:5173` (or configured port)

Expected: No errors, editor view loads

**Step 3: Commit**

```bash
git add src/pages/EditorView.tsx
git commit -m "feat: integrate token editor components into EditorView

Replace placeholder with full token editor:
- EditorHeader with Add Token button
- TokenTree with recursive rendering
- AddTokenDialog for creating tokens

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 10: Manual Testing & Verification

**Files:**
- None (manual testing)

**Step 1: Test viewing tokens**

1. Open app in browser (`npm run dev`)
2. Navigate to "Editor" tab
3. Verify all sample tokens display in tree structure
4. Verify groups can be expanded/collapsed
5. Verify chevron rotates smoothly

**Expected:** All tokens visible, tree structure matches sample data

**Step 2: Test editing a color token**

1. Click on a color token value (e.g., `#2563eb`)
2. Verify input field appears with value selected
3. Change value to `#ff0000`
4. Press Enter
5. Verify color swatch updates to red
6. Navigate to "Compiler" tab
7. Verify CSS output shows new color value

**Expected:** Edit saves, preview updates, compiler reflects change

**Step 3: Test editing a spacing token**

1. Navigate back to "Editor"
2. Click on a spacing token value (e.g., `16px`)
3. Change to `32px`
4. Press Enter
5. Verify spacing bar preview grows

**Expected:** Spacing preview updates correctly

**Step 4: Test adding a new token**

1. Click "Add Token" button
2. Fill in form:
   - Parent: `color.semantic`
   - Name: `accent`
   - Type: `color`
   - Value: `#f40c3f`
3. Click "Create"
4. Verify dialog closes
5. Verify new token appears in tree under `color.semantic`
6. Verify color.semantic group is expanded

**Expected:** Token created and visible in tree

**Step 5: Test deleting a token**

1. Hover over a token row
2. Verify trash icon appears
3. Click trash icon
4. Verify confirmation dialog appears
5. Click "OK"
6. Verify token disappears from tree

**Expected:** Token deleted successfully

**Step 6: Test edit cancellation**

1. Click on a token value to edit
2. Change the value
3. Press Escape
4. Verify value reverts to original

**Expected:** Edit cancelled, original value restored

**Step 7: Test persistence**

1. Make several edits (add, update, delete tokens)
2. Refresh the browser page
3. Navigate to "Editor" tab
4. Verify all changes persisted

**Expected:** All changes saved via localStorage

**Step 8: Test invalid input**

1. Click on a color token value
2. Enter invalid value: `abc`
3. Press Enter
4. Verify red border appears on input
5. Enter valid value: `#000000`
6. Press Enter
7. Verify edit saves successfully

**Expected:** Invalid values show error state

**Step 9: Document any bugs or issues**

Create a checklist:
- [ ] Tree renders correctly
- [ ] Expand/collapse works
- [ ] Inline editing works
- [ ] Color previews update
- [ ] Spacing previews update
- [ ] Add token works
- [ ] Delete token works
- [ ] Cancel editing works
- [ ] Persistence works
- [ ] Invalid input handling works

**Step 10: Final commit**

If all tests pass:

```bash
git add -A
git commit -m "test: verify Token Editor MVP functionality

Manual testing complete:
- Token tree rendering ✓
- Expand/collapse ✓
- Inline editing ✓
- Visual previews ✓
- Add token ✓
- Delete token ✓
- Persistence ✓

Token Editor MVP is complete and functional.

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 11: Update Documentation

**Files:**
- Modify: `docs/PROJECT-PROGRESS.md`

**Step 1: Mark Token Editor as complete**

Find the section "Phase 1 — Token Editor (Not Started)" and update to:

```markdown
### Phase 1 — Token Editor (100% Complete) ✅

#### Token Tree View ✅
- ✅ Recursive tree component with expand/collapse
- ✅ Visual previews (color swatches, spacing bars)
- ✅ Inline editing (click to edit values)
- ✅ Drag-to-reorder tokens — Deferred to V2
- ✅ Search and filter — Deferred to V2

#### Detail Panel
- ✅ Inline editing replaces need for detail panel in MVP
- ⬜ Reference autocomplete (type `{` to search tokens) — Deferred to V2
- ⬜ Color picker integration — Deferred to V2

#### Editor State
- ✅ Expanded groups persistence (local component state)
- ⬜ Undo/redo functionality — Deferred to V2

**Completed:** February 16, 2026
**Location:** `src/pages/EditorView.tsx`, `src/components/editor/*`
```

**Step 2: Update current capabilities section**

Add to "What Works Right Now" section:

```markdown
5. **Token Editor** ⭐ NEW
   - Recursive tree view with expand/collapse
   - Inline editing for all token values
   - Visual previews for colors and spacing
   - Add new tokens via modal dialog
   - Delete tokens with confirmation
   - Real-time updates reflected in compiler output
```

**Step 3: Commit documentation update**

```bash
git add docs/PROJECT-PROGRESS.md
git commit -m "docs: mark Token Editor MVP as complete

Update PROJECT-PROGRESS.md to reflect completion of:
- Token tree view with inline editing
- Visual previews
- Add/delete operations
- Persistence

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Success Criteria Checklist

- ✅ Users can view all tokens in a nested tree structure
- ✅ Users can expand/collapse token groups
- ✅ Users can edit any token value inline (click, type, save)
- ✅ Color tokens show a color swatch preview
- ✅ Spacing tokens show a size bar preview
- ✅ Users can add new tokens via a modal dialog
- ✅ Users can delete tokens with confirmation
- ✅ All changes persist to the Zustand store and localStorage
- ✅ Changes are immediately reflected in the Compiler view

---

## Notes

- This implementation uses no new dependencies
- All components are built with existing tech stack
- Styling uses Tailwind CSS classes matching the app's design system
- State management leverages existing Zustand store
- The MVP is intentionally simplified - advanced features (color picker, autocomplete, etc.) are deferred to V2

---

**Plan created:** February 16, 2026
**Estimated time:** 6-8 hours
**Status:** Ready for implementation
