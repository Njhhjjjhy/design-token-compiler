import { useState, useRef, useEffect } from 'react'
import { useFocusTrap } from '@/hooks/useFocusTrap'
import { Trash2, Check, AlertTriangle } from 'lucide-react'
import type { Token, TokenValue } from '@/types'
import { useTokenStore } from '@/store/useTokenStore'

const typeDisplayNames: Record<string, string> = {
  color: 'color',
  dimension: 'spacing',
  fontFamily: 'font',
  fontWeight: 'weight',
  duration: 'duration',
  cubicBezier: 'easing',
  number: 'number',
  typography: 'type',
  shadow: 'shadow',
  border: 'border',
}

const typeDescriptions: Record<string, string> = {
  color: 'Color values (hex, rgb, hsl)',
  dimension: 'Spacing and size values (px, rem, em)',
  fontFamily: 'Font family names',
  fontWeight: 'Font weight values (100-900, bold, etc.)',
  duration: 'Animation duration (ms, s)',
  cubicBezier: 'Easing curve for animations',
  number: 'Unitless numeric values',
  typography: 'Combined type styles (family, size, weight, etc.)',
  shadow: 'Box shadow definitions',
  border: 'Border style definitions',
  gradient: 'Color gradient values',
  strokeStyle: 'Stroke/outline style values',
  transition: 'Transition definitions',
}

interface TokenValueNodeProps {
  token: Token
  depth: number
  activeMode: string | null
  modeOverrides: Record<string, TokenValue>
}

export function TokenValueNode({ token, depth, activeMode, modeOverrides }: TokenValueNodeProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState('')
  const [isInvalid, setIsInvalid] = useState(false)
  const [saveLabel, setSaveLabel] = useState<string | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const cancelledRef = useRef(false)
  const savedViaEnterRef = useRef(false)
  const saveTimerRef = useRef<ReturnType<typeof setTimeout>>()
  const deleteTrap = useFocusTrap(showDeleteConfirm, () => setShowDeleteConfirm(false))
  const updateToken = useTokenStore((state) => state.updateToken)
  const deleteToken = useTokenStore((state) => state.deleteToken)
  const updateModeOverride = useTokenStore((state) => state.updateModeOverride)
  const removeModeOverride = useTokenStore((state) => state.removeModeOverride)
  const activeSetId = useTokenStore((state) => state.activeSetId)

  const paddingLeft = depth * 16

  // Determine whether this token has a mode override
  const hasOverride = activeMode !== null && token.id in modeOverrides
  const displayValue: TokenValue = hasOverride ? modeOverrides[token.id] : token.value

  // Convert displayed value to string for editing
  const valueString = typeof displayValue === 'string'
    ? displayValue
    : JSON.stringify(displayValue)

  // Human-readable summary for complex object values
  const displayString = typeof displayValue === 'object' && displayValue !== null
    ? Object.values(displayValue as Record<string, unknown>).filter(Boolean).join(', ')
    : valueString

  // Base value string (for showing "inherited from" hint)
  const baseValueString = typeof token.value === 'string'
    ? token.value
    : JSON.stringify(token.value)

  const handleEditStart = () => {
    setEditValue(valueString)
    setIsEditing(true)
  }

  const handleEditSave = () => {
    if (cancelledRef.current) {
      cancelledRef.current = false
      return
    }
    if (!editValue.trim()) {
      setIsInvalid(true)
      return
    }

    let newValue: TokenValue = editValue
    if (editValue.startsWith('{') || editValue.startsWith('[')) {
      try {
        newValue = JSON.parse(editValue)
      } catch {
        // Keep as string if parse fails
      }
    }

    if (activeMode && activeSetId) {
      // Editing in mode context -- update mode override
      updateModeOverride(activeSetId, activeMode, token.id, newValue)
    } else {
      updateToken(token.id, newValue)
    }
    setIsEditing(false)
    setIsInvalid(false)

    // Flash save indicator with context-aware label
    setSaveLabel(savedViaEnterRef.current ? 'Saved' : 'Auto-saved')
    savedViaEnterRef.current = false
    clearTimeout(saveTimerRef.current)
    saveTimerRef.current = setTimeout(() => setSaveLabel(null), 1500)
  }

  const handleEditCancel = () => {
    cancelledRef.current = true
    setIsEditing(false)
    setIsInvalid(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      savedViaEnterRef.current = true
      handleEditSave()
    } else if (e.key === 'Escape') {
      handleEditCancel()
    }
  }

  const handleDelete = () => {
    if (activeMode && activeSetId && hasOverride) {
      // In mode context, "delete" removes the override
      removeModeOverride(activeSetId, activeMode, token.id)
    } else if (!activeMode) {
      setShowDeleteConfirm(true)
    }
  }

  const handleConfirmDelete = () => {
    deleteToken(token.id)
    setShowDeleteConfirm(false)
  }

  // Auto-focus input when entering edit mode
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [isEditing])

  // Cleanup save indicator timer
  useEffect(() => {
    return () => clearTimeout(saveTimerRef.current)
  }, [])


  // Render color swatch for color tokens
  const renderPreview = () => {
    const previewValue = typeof displayValue === 'string' ? displayValue : String(displayValue)

    if (token.type === 'color' && typeof previewValue === 'string') {
      if (previewValue.startsWith('{')) {
        return (
          <div
            className="w-4 h-4 rounded border border-dashed border-warning"
            role="img"
            aria-label="Unresolved color reference"
          />
        )
      }
      return (
        <div
          className="w-4 h-4 rounded border border-border"
          style={{ backgroundColor: previewValue }}
          role="img"
          aria-label={`Color: ${previewValue}`}
        />
      )
    }

    if (token.type === 'dimension' && typeof previewValue === 'string') {
      const match = previewValue.match(/(\d+)/)
      const numValue = match ? parseInt(match[1]) : 0
      const barWidth = Math.min(numValue, 64)
      return (
        <div
          className="h-3 bg-text-tertiary rounded"
          style={{ width: `${barWidth}px` }}
          role="img"
          aria-label={`Spacing: ${previewValue}`}
        />
      )
    }

    return null
  }

  return (
    <div
      role="treeitem"
      className="group flex items-center gap-3 py-2 hover:bg-white/5 transition-colors"
      style={{ paddingLeft: `${paddingLeft}px` }}
    >
      {/* Token Name */}
      <span className="font-mono text-sm text-white min-w-[120px]">
        {token.name}
      </span>

      {/* Type Badge */}
      <span
        className="px-2 py-0.5 text-xs font-mono uppercase rounded bg-info/20 text-info"
        title={typeDescriptions[token.type] || token.type}
      >
        {typeDisplayNames[token.type] || token.type}
      </span>

      {/* Override indicator */}
      {activeMode && hasOverride && (
        <span className="px-1.5 py-0.5 text-mini font-mono uppercase rounded bg-warning/20 text-warning">
          override
        </span>
      )}

      {/* Value (editable) */}
      {isEditing ? (
        <div className="flex-1">
          <input
            ref={inputRef}
            type="text"
            value={editValue}
            onChange={(e) => { setEditValue(e.target.value); setIsInvalid(false) }}
            onBlur={handleEditSave}
            onKeyDown={handleKeyDown}
            aria-invalid={isInvalid}
            aria-label={`Edit value for ${token.name}`}
            aria-describedby={isInvalid ? `error-${token.id}` : undefined}
            placeholder="Value or {reference.path}"
            className={`w-full px-2 py-1 font-mono text-sm bg-surface-elevated border rounded focus:outline-none focus:ring-1 ${
              isInvalid
                ? 'border-error focus:ring-error'
                : 'border-border focus:border-primary focus:ring-primary'
            }`}
          />
          {isInvalid && (
            <p id={`error-${token.id}`} role="alert" className="font-mono text-xs text-error mt-1">Value cannot be empty</p>
          )}
        </div>
      ) : (
        <button
          onClick={handleEditStart}
          className={`flex-1 text-left px-2 py-1 font-mono text-sm rounded cursor-text ${
            activeMode && !hasOverride
              ? 'text-text-tertiary hover:bg-white/10'
              : 'text-text-secondary hover:bg-white/10'
          }`}
          title={activeMode && hasOverride ? `Base: ${baseValueString}` : (displayString !== valueString ? valueString : undefined)}
        >
          {displayString}
        </button>
      )}

      {/* Preview */}
      <div className="w-16 flex items-center justify-center">
        {renderPreview()}
      </div>

      {/* Save indicator */}
      <span
        className={`flex items-center gap-1 font-mono text-xs text-success transition-opacity duration-300 min-w-[80px] ${
          saveLabel ? 'opacity-100' : 'opacity-0'
        }`}
        aria-live="polite"
      >
        <Check className="w-3 h-3" />
        {saveLabel || 'Saved'}
      </span>

      {/* Delete / Remove Override Button */}
      <button
        onClick={handleDelete}
        className="opacity-0 group-hover:opacity-100 focus:opacity-100 p-1 hover:text-error transition-all"
        title={activeMode && hasOverride ? 'Remove override' : 'Delete token'}
        aria-label={activeMode && hasOverride ? 'Remove override' : 'Delete token'}
      >
        <Trash2 className="w-4 h-4" />
      </button>

      {showDeleteConfirm && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-modal"
          onClick={(e) => { if (e.target === e.currentTarget) setShowDeleteConfirm(false) }}
        >
          <div
            ref={deleteTrap.dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-token-confirm-title"
            className="bg-surface border border-border rounded-lg p-6 w-full max-w-sm"
            onKeyDown={deleteTrap.handleKeyDown}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-error/10 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-5 h-5 text-error" />
              </div>
              <h3 id="delete-token-confirm-title" className="font-mono text-sm font-semibold text-white">
                Delete Token?
              </h3>
            </div>
            <p className="font-mono text-xs text-text-secondary mb-6 ml-[52px]">
              Delete token '{token.name}'? This cannot be undone.
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 font-mono text-xs text-text-secondary hover:bg-white/10 rounded transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-4 py-2 bg-error hover:bg-error/90 text-white font-mono text-xs rounded transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
