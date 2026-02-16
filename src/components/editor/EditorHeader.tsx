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
