import { useState, useMemo } from 'react'
import { Copy, Check, Download } from 'lucide-react'
import type { Component, ResolvedTokenMap } from '@/types'
import { compileWebReact, compileIosSwift, compileAndroidCompose } from '@/lib/component-compilers'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism'

type Platform = 'web' | 'ios' | 'android'
type WebTab = 'tsx' | 'css'

interface CodeTabProps {
  component: Component
  resolvedTokens: ResolvedTokenMap
}

function useCopy(text: string) {
  const [copied, setCopied] = useState(false)
  function copy() {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    })
  }
  return { copied, copy }
}

function downloadFile(filename: string, content: string) {
  const blob = new Blob([content], { type: 'text/plain' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export function CodeTab({ component, resolvedTokens }: CodeTabProps) {
  const [platform, setPlatform] = useState<Platform>('web')
  const [webTab, setWebTab] = useState<WebTab>('tsx')

  const webOutput = useMemo(() => compileWebReact(component, resolvedTokens), [component, resolvedTokens])
  const iosOutput = useMemo(() => compileIosSwift(component, resolvedTokens), [component, resolvedTokens])
  const androidOutput = useMemo(() => compileAndroidCompose(component, resolvedTokens), [component, resolvedTokens])

  const currentCode =
    platform === 'web'
      ? (webTab === 'tsx' ? webOutput.tsx : webOutput.css)
      : platform === 'ios'
      ? iosOutput
      : androidOutput

  const { copied, copy } = useCopy(currentCode)

  const fileName =
    platform === 'web'
      ? webTab === 'tsx' ? `${component.id}.tsx` : `${component.id}.css`
      : platform === 'ios'
      ? `${component.id.split('-').map((s) => s.charAt(0).toUpperCase() + s.slice(1)).join('')}.swift`
      : `${component.id.split('-').map((s) => s.charAt(0).toUpperCase() + s.slice(1)).join('')}.kt`

  const language =
    platform === 'ios' ? 'swift'
    : platform === 'android' ? 'kotlin'
    : webTab === 'tsx' ? 'tsx'
    : 'css'

  return (
    <div className="flex flex-col h-full">
      {/* Platform tabs */}
      <div className="flex items-center gap-0 border-b border-border px-4">
        {(['web', 'ios', 'android'] as Platform[]).map((p) => (
          <button
            key={p}
            onClick={() => setPlatform(p)}
            className={`
              px-4 py-3 font-mono text-xs tracking-wider uppercase transition-colors
              ${platform === p ? 'text-primary border-b-2 border-primary -mb-px' : 'text-text-tertiary hover:text-text-secondary'}
            `}
          >
            {p === 'web' ? 'Web' : p === 'ios' ? 'iOS' : 'Android'}
          </button>
        ))}
        <div className="ml-auto flex items-center gap-2 py-2">
          <button
            onClick={copy}
            className="flex items-center gap-1.5 px-2.5 py-1.5 border border-border rounded font-mono text-xs text-text-secondary hover:text-white hover:border-border-strong transition-colors"
            aria-label="Copy code"
          >
            {copied ? <Check className="w-3 h-3 text-success" /> : <Copy className="w-3 h-3" />}
            {copied ? 'Copied' : 'Copy'}
          </button>
          <button
            onClick={() => downloadFile(fileName, currentCode)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 border border-border rounded font-mono text-xs text-text-secondary hover:text-white hover:border-border-strong transition-colors"
            aria-label={`Download ${fileName}`}
          >
            <Download className="w-3 h-3" />
            {fileName}
          </button>
        </div>
      </div>

      {/* Web sub-tabs */}
      {platform === 'web' && (
        <div className="flex items-center gap-0 border-b border-border/50 px-4 bg-surface-elevated/20">
          {(['tsx', 'css'] as WebTab[]).map((t) => (
            <button
              key={t}
              onClick={() => setWebTab(t)}
              className={`
                px-3 py-2 font-mono text-xs tracking-wider transition-colors
                ${webTab === t ? 'text-white' : 'text-text-tertiary hover:text-text-secondary'}
              `}
            >
              {t}
            </button>
          ))}
        </div>
      )}

      {/* Code */}
      <div className="flex-1 overflow-auto">
        <SyntaxHighlighter
          language={language}
          style={vscDarkPlus}
          showLineNumbers
          customStyle={{
            margin: 0,
            borderRadius: 0,
            background: 'transparent',
            fontSize: '12px',
            lineHeight: '1.6',
          }}
        >
          {currentCode}
        </SyntaxHighlighter>
      </div>
    </div>
  )
}
