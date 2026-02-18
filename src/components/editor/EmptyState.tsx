import { FileQuestion } from 'lucide-react'

export function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center h-64 text-text-secondary">
      <FileQuestion className="w-12 h-12 mb-4 opacity-50" aria-hidden="true" />
      <p className="font-mono text-sm">No tokens defined</p>
      <p className="font-mono text-xs mt-2 opacity-70">
        Use the Add Token button in the header above to get started
      </p>
    </div>
  )
}
