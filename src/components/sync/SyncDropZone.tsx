import { useState, useCallback, useRef } from 'react'
import { Upload, AlertTriangle, Loader2 } from 'lucide-react'

const ALLOWED_EXTENSIONS = ['.json', '.css', '.scss']
const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5 MB

function isAllowedFileType(fileName: string): boolean {
  const lower = fileName.toLowerCase()
  return ALLOWED_EXTENSIONS.some((ext) => lower.endsWith(ext))
}

interface SyncDropZoneProps {
  onFileLoaded: (fileName: string, content: string) => void
}

export function SyncDropZone({ onFileLoaded }: SyncDropZoneProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [fileError, setFileError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFile = useCallback((file: File) => {
    if (!isAllowedFileType(file.name)) {
      setFileError(`Unsupported file type. Accepted formats: ${ALLOWED_EXTENSIONS.join(', ')}`)
      return
    }
    if (file.size > MAX_FILE_SIZE) {
      setFileError(`File too large (${(file.size / 1024 / 1024).toFixed(1)} MB). Maximum size is 5 MB.`)
      return
    }
    setFileError(null)
    setIsLoading(true)
    const reader = new FileReader()
    reader.onload = (e) => {
      const content = e.target?.result as string
      if (content) {
        onFileLoaded(file.name, content)
      }
      setIsLoading(false)
    }
    reader.onerror = () => {
      setFileError('Failed to read file.')
      setIsLoading(false)
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
        tabIndex={0}
        role="button"
        aria-label="Drop a file to compare, or press Enter to browse"
        aria-busy={isLoading}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            fileInputRef.current?.click()
          }
        }}
        className={`
          w-full max-w-lg p-12 border-2 border-dashed rounded-lg text-center transition-colors
          ${isDragging
            ? 'border-primary bg-primary/5'
            : 'border-border hover:border-text-tertiary'
          }
        `}
      >
        {isLoading ? (
          <div aria-live="polite">
            <Loader2 className="w-10 h-10 mx-auto mb-4 text-primary animate-spin" aria-hidden="true" />
            <p className="font-mono text-sm text-white mb-2">
              Parsing file...
            </p>
          </div>
        ) : (
          <>
            <Upload className={`w-10 h-10 mx-auto mb-4 ${isDragging ? 'text-primary' : 'text-text-tertiary'}`} />

            <p className="font-mono text-sm text-white mb-2">
              Drop a file to compare
            </p>

            <p className="font-mono text-xs text-text-secondary mb-6">
              or click to browse
            </p>

            <label htmlFor="sync-file-input" className="inline-flex items-center gap-2 px-4 py-2 bg-surface-elevated border border-border hover:border-primary transition-colors font-mono text-xs text-white cursor-pointer">
              Choose File
              <input
                ref={fileInputRef}
                id="sync-file-input"
                type="file"
                accept=".json,.css,.scss"
                onChange={handleFileInput}
                className="sr-only"
              />
            </label>

            <div className="mt-6 font-mono text-xs text-text-tertiary text-left max-w-xs mx-auto space-y-1">
              <p className="text-text-secondary mb-2">Supported formats:</p>
              <p><span className="text-text-secondary">.json</span> -- W3C Design Tokens or Figma variables export</p>
              <p><span className="text-text-secondary">.css</span> -- CSS custom properties (--variable: value)</p>
              <p><span className="text-text-secondary">.scss</span> -- SCSS variables ($variable: value)</p>
            </div>
          </>
        )}

        {fileError && (
          <div className="mt-4 flex items-center gap-2 text-left" role="alert">
            <AlertTriangle className="w-4 h-4 text-error flex-shrink-0" aria-hidden="true" />
            <p className="font-mono text-xs text-error">{fileError}</p>
          </div>
        )}
      </div>
    </div>
  )
}
