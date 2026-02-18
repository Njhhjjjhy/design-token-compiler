import { useState } from 'react'
import { X } from 'lucide-react'
import type { TokenType, Token, TokenGroup } from '@/types'
import { useTokenStore } from '@/store/useTokenStore'
import { useFocusTrap } from '@/hooks/useFocusTrap'

interface AddTokenDialogProps {
  isOpen: boolean
  onClose: () => void
}

export function AddTokenDialog({ isOpen, onClose }: AddTokenDialogProps) {
  const [parentPath, setParentPath] = useState('')
  const [tokenName, setTokenName] = useState('')
  const [tokenType, setTokenType] = useState<TokenType>('color')
  const [tokenValue, setTokenValue] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const addToken = useTokenStore((state) => state.addToken)
  const activeSet = useTokenStore((state) => state.getActiveTokenSet())

  const handleCancel = () => {
    setParentPath('')
    setTokenName('')
    setTokenType('color')
    setTokenValue('')
    onClose()
  }

  const { dialogRef, handleKeyDown } = useFocusTrap(isOpen, handleCancel)

  // Check if a sibling with the same name exists at the target path
  const getSiblingsAtPath = (path: string): Record<string, Token | TokenGroup> => {
    if (!activeSet) return {}
    if (!path) return activeSet.tokens
    const parts = path.split('.')
    let node: Record<string, Token | TokenGroup> = activeSet.tokens
    for (const part of parts) {
      const child = node[part]
      if (child && 'tokens' in child) {
        node = child.tokens
      } else {
        return {}
      }
    }
    return node
  }

  const trimmedName = tokenName.trim()
  const isDuplicate = trimmedName !== '' && trimmedName in getSiblingsAtPath(parentPath)

  const handleCreate = () => {
    const trimmedValue = tokenValue.trim()

    if (!trimmedName || !trimmedValue) {
      alert('Please fill in all required fields')
      return
    }

    if (isDuplicate || isSubmitting) {
      return
    }

    setIsSubmitting(true)

    const tokenData: Partial<Token> = {
      name: trimmedName,
      type: tokenType,
      value: trimmedValue,
    }

    addToken(parentPath, tokenData)

    // Reset form and close
    setParentPath('')
    setTokenName('')
    setTokenType('color')
    setTokenValue('')
    setIsSubmitting(false)
    onClose()
  }

  if (!isOpen) return null

  // Get available parent paths from token set with depth info for visual hierarchy
  const getParentPaths = (
    tokens: Record<string, any>,
    prefix: string = '',
    depth: number = 0
  ): { path: string; label: string; depth: number }[] => {
    const paths: { path: string; label: string; depth: number }[] = []

    for (const [key, item] of Object.entries(tokens)) {
      const currentPath = prefix ? `${prefix}.${key}` : key
      if ('tokens' in item) {
        paths.push({ path: currentPath, label: key, depth })
        paths.push(...getParentPaths(item.tokens, currentPath, depth + 1))
      }
    }

    return paths
  }

  const parentPathItems = activeSet ? getParentPaths(activeSet.tokens) : []

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-modal"
      onClick={(e) => { if (e.target === e.currentTarget) handleCancel() }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-token-dialog-title"
        aria-describedby="add-token-dialog-desc"
        className="bg-surface border border-border rounded-lg p-6 w-full max-w-md"
        onKeyDown={handleKeyDown}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h3 id="add-token-dialog-title" className="font-mono text-lg font-semibold text-white">
            Add Token
          </h3>
          <button
            onClick={handleCancel}
            className="p-1 hover:bg-white/10 rounded transition-colors"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p id="add-token-dialog-desc" className="sr-only">
          Fill in the name, type, and value to create a new design token. Use reference syntax to link to other tokens.
        </p>

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
              className="w-full px-3 py-2 bg-surface-elevated border border-border rounded font-mono text-sm text-white focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
            >
              <option value="">(root)</option>
              {parentPathItems.map((item) => (
                <option key={item.path} value={item.path}>
                  {'\u00A0\u00A0'.repeat(item.depth) + (item.depth > 0 ? '\u2514 ' : '') + item.label}
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
              aria-required="true"
              aria-invalid={isDuplicate}
              aria-describedby={isDuplicate ? 'duplicate-error' : undefined}
              className={`w-full px-3 py-2 bg-surface-elevated border rounded font-mono text-sm text-white placeholder:text-text-tertiary focus:outline-none focus:ring-1 ${
                isDuplicate
                  ? 'border-error focus:ring-error focus:border-error'
                  : 'border-border focus:ring-primary focus:border-primary'
              }`}
            />
            {isDuplicate && (
              <p id="duplicate-error" role="alert" className="mt-1 font-mono text-xs text-error">
                A token named "{trimmedName}" already exists at this path.
              </p>
            )}
          </div>

          {/* Token Type */}
          <div>
            <label className="block font-mono text-sm text-text-secondary mb-2">
              Token Type
            </label>
            <select
              value={tokenType}
              onChange={(e) => setTokenType(e.target.value as TokenType)}
              className="w-full px-3 py-2 bg-surface-elevated border border-border rounded font-mono text-sm text-white focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
            >
              <option value="color">Color</option>
              <option value="dimension">Spacing</option>
              <option value="fontFamily">Font</option>
              <option value="fontWeight">Font Weight</option>
              <option value="duration">Duration</option>
              <option value="cubicBezier">Easing</option>
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
              className="w-full px-3 py-2 bg-surface-elevated border border-border rounded font-mono text-sm text-white placeholder:text-text-tertiary focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
            />
            <p className="mt-1.5 font-mono text-xs text-text-tertiary">
              Use <span className="text-text-secondary">{'{group.token}'}</span> syntax to reference another token's value.
            </p>
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
            disabled={isSubmitting}
            className="px-4 py-2 bg-primary hover:bg-primary/90 text-white font-mono text-sm rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Creating...' : 'Create'}
          </button>
        </div>
      </div>
    </div>
  )
}
