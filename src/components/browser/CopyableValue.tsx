import { useState, useCallback, type ReactNode } from 'react'

interface CopyableValueProps {
  value: string
  className?: string
  children?: ReactNode
}

export function CopyableValue({ value, className = '', children }: CopyableValueProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(value).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    })
  }, [value])

  return (
    <button
      type="button"
      onClick={handleCopy}
      className={`text-left cursor-pointer transition-colors hover:text-primary ${copied ? 'text-success hover:text-success' : ''} ${className}`}
      title={copied ? 'Copied!' : 'Click to copy'}
    >
      {copied ? 'Copied!' : (children || value)}
    </button>
  )
}
