import { useState, useCallback } from 'react'
import { Upload } from 'lucide-react'

interface SyncDropZoneProps {
  onFileLoaded: (fileName: string, content: string) => void
}

export function SyncDropZone({ onFileLoaded }: SyncDropZoneProps) {
  const [isDragging, setIsDragging] = useState(false)

  const handleFile = useCallback((file: File) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const content = e.target?.result as string
      if (content) {
        onFileLoaded(file.name, content)
      }
    }
    reader.readAsText(file)
  }, [onFileLoaded])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }, [handleFile])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback(() => {
    setIsDragging(false)
  }, [])

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
  }, [handleFile])

  return (
    <div className="flex-1 flex items-center justify-center p-12">
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`
          w-full max-w-lg p-12 border-2 border-dashed rounded-lg text-center transition-colors
          ${isDragging
            ? 'border-primary bg-primary/5'
            : 'border-border hover:border-text-tertiary'
          }
        `}
      >
        <Upload className={`w-10 h-10 mx-auto mb-4 ${isDragging ? 'text-primary' : 'text-text-tertiary'}`} />

        <p className="font-mono text-sm text-white mb-2">
          Drop a file to compare
        </p>

        <p className="font-mono text-xs text-text-secondary mb-6">
          or click to browse
        </p>

        <label className="inline-flex items-center gap-2 px-4 py-2 bg-surface-elevated border border-border hover:border-primary transition-colors font-mono text-xs text-white cursor-pointer">
          Choose File
          <input
            type="file"
            accept=".json,.css,.scss"
            onChange={handleFileInput}
            className="hidden"
          />
        </label>

        <p className="mt-6 font-mono text-xs text-text-tertiary">
          Supported: .json (Figma or W3C) · .css · .scss
        </p>
      </div>
    </div>
  )
}
