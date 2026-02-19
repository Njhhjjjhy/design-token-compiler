import { useState } from 'react'
import { motion } from 'framer-motion'
import { X, Plus, Pencil, Trash2, Check } from 'lucide-react'
import { motionConfig } from '@/lib/motion'
import { nanoid } from 'nanoid'
import { useTokenStore } from '@/store/useTokenStore'
import type { Mode } from '@/types'

interface ModePanelProps {
  isOpen: boolean
  onClose: () => void
}

export function ModePanel({ isOpen, onClose }: ModePanelProps) {
  const [newModeName, setNewModeName] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState('')

  const activeSetId = useTokenStore((s) => s.activeSetId)
  const activeSet = useTokenStore((s) => s.getActiveTokenSet())
  const addMode = useTokenStore((s) => s.addMode)
  const renameMode = useTokenStore((s) => s.renameMode)
  const deleteMode = useTokenStore((s) => s.deleteMode)

  if (!activeSet || !activeSetId) return null

  const modes = Object.values(activeSet.modes)

  const handleAdd = () => {
    const name = newModeName.trim()
    if (!name) return
    const mode: Mode = {
      id: nanoid(),
      name,
      overrides: {},
      isDefault: modes.length === 0,
    }
    addMode(activeSetId, mode)
    setNewModeName('')
  }

  const handleStartRename = (mode: Mode) => {
    setEditingId(mode.id)
    setEditingName(mode.name)
  }

  const handleConfirmRename = () => {
    if (!editingId) return
    const name = editingName.trim()
    if (name) {
      renameMode(activeSetId, editingId, name)
    }
    setEditingId(null)
    setEditingName('')
  }

  const handleDelete = (modeId: string) => {
    const mode = activeSet.modes[modeId]
    if (!mode) return
    const overrideCount = Object.keys(mode.overrides).length
    const msg = overrideCount > 0
      ? `Delete mode "${mode.name}" and its ${overrideCount} override${overrideCount !== 1 ? 's' : ''}? This cannot be undone.`
      : `Delete mode "${mode.name}"? This cannot be undone.`
    if (!confirm(msg)) return
    deleteMode(activeSetId, modeId)
  }

  return (
    <motion.div
      className="fixed inset-y-0 right-0 w-sidebar bg-surface border-l border-border z-modal flex flex-col shadow-2xl"
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={motionConfig.slide}
    >
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <h3 className="section-title text-primary">MODES</h3>
        <button onClick={onClose} className="p-1 text-text-tertiary hover:text-white transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="px-4 py-3 border-b border-border">
        <div className="flex gap-2">
          <input
            type="text"
            value={newModeName}
            onChange={(e) => setNewModeName(e.target.value)}
            placeholder="Mode name (e.g. dark)"
            className="flex-1 px-3 py-1.5 bg-surface-elevated border border-border font-mono text-xs text-white placeholder:text-text-tertiary focus:border-primary focus:outline-none"
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          />
          <button onClick={handleAdd} className="flex items-center gap-1.5 px-3 py-1.5 bg-primary hover:bg-primary/90 text-white font-mono text-xs transition-colors">
            <Plus className="w-3.5 h-3.5" />
            ADD
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        {modes.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <p className="font-mono text-xs text-text-secondary">No modes created yet.</p>
          </div>
        ) : (
          modes.map((mode) => {
            const overrideCount = Object.keys(mode.overrides).length
            const isEditing = editingId === mode.id

            return (
              <div
                key={mode.id}
                className="px-4 py-3 border-b border-border hover:bg-surface-elevated/50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    {isEditing ? (
                      <div className="flex items-center gap-1 flex-1">
                        <input
                          type="text"
                          value={editingName}
                          onChange={(e) => setEditingName(e.target.value)}
                          className="flex-1 px-2 py-0.5 bg-surface-elevated border border-border font-mono text-xs text-white focus:border-primary focus:outline-none"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleConfirmRename()
                            if (e.key === 'Escape') setEditingId(null)
                          }}
                          autoFocus
                        />
                        <button
                          onClick={handleConfirmRename}
                          className="p-1 text-text-tertiary hover:text-white transition-colors"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <>
                        <span className="font-mono text-xs text-white truncate">{mode.name}</span>
                        {mode.isDefault && (
                          <span className="px-1.5 py-0.5 bg-primary/20 text-primary font-mono text-mini leading-none">
                            DEFAULT
                          </span>
                        )}
                      </>
                    )}
                  </div>

                  {!isEditing && (
                    <div className="flex items-center gap-1 ml-2 shrink-0">
                      <button
                        onClick={() => handleStartRename(mode)}
                        className="p-1 text-text-tertiary hover:text-white transition-colors"
                        title="Rename mode"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(mode.id)}
                        className="p-1 text-text-tertiary hover:text-error transition-colors"
                        title="Delete mode"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>

                {!isEditing && (
                  <p className="font-mono text-mini text-text-tertiary mt-1">
                    {overrideCount} override{overrideCount !== 1 ? 's' : ''}
                  </p>
                )}
              </div>
            )
          })
        )}
      </div>

      {modes.length > 0 && (
        <div className="px-4 py-2 border-t border-border">
          <p className="font-mono text-xs text-text-tertiary">
            {modes.length} mode{modes.length !== 1 ? 's' : ''}
          </p>
        </div>
      )}
    </motion.div>
  )
}
