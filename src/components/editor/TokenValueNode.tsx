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
