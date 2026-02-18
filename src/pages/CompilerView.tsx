import { useState, useMemo } from 'react'
import { useTokenStore } from '@/store/useTokenStore'
import { resolveTokens } from '@/lib/resolver'
import { compileToCssWithModes } from '@/lib/compilers/css'
import { compileToScssWithModes } from '@/lib/compilers/scss'
import { compileToTypeScriptWithModes } from '@/lib/compilers/typescript'
import { compileToTailwindWithModes } from '@/lib/compilers/tailwind'
import { compileToW3CJSONWithModes } from '@/lib/compilers/json-w3c'
import { compileToStyleDictionaryWithModes } from '@/lib/compilers/style-dictionary'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism'
import { Check, Copy, Download, Package } from 'lucide-react'
import JSZip from 'jszip'
import { saveAs } from 'file-saver'

type CompilerFormat = 'css' | 'scss' | 'typescript' | 'tailwind' | 'json-w3c' | 'style-dictionary'

const formatDescriptions: Record<CompilerFormat, string> = {
  css: 'CSS custom properties with light/dark mode via prefers-color-scheme',
  scss: 'SCSS variables and mixins for preprocessor-based workflows',
  typescript: 'Typed constants for type-safe token access in TS/JS projects',
  tailwind: 'Tailwind CSS config extending the default theme with your tokens',
  'json-w3c': 'W3C Design Tokens Community Group format for cross-tool compatibility',
  'style-dictionary': 'Style Dictionary format for multi-platform token pipelines',
}

interface CompilerOutput {
  format: CompilerFormat
  code: string
  language: string
  fileName: string
  mimeType: string
}

export function CompilerView() {
  const tokenSets = useTokenStore((state) => state.tokenSets)
  const activeSetId = useTokenStore((state) => state.activeSetId)
  const [activeFormat, setActiveFormat] = useState<CompilerFormat>('css')
  const [copied, setCopied] = useState(false)
  const [showErrors, setShowErrors] = useState(false)

  const activeSet = activeSetId ? tokenSets[activeSetId] : null

  if (!activeSet) {
    return (
      <div className="p-8">
        <h2 className="section-title text-primary mb-6">COMPILER</h2>
        <p className="font-mono text-sm text-text-secondary">
          No token set selected. Go to the Dashboard to create or import one.
        </p>
      </div>
    )
  }

  // Resolve tokens for default (light) and alternate (dark) modes
  const modeEntries = Object.values(activeSet.modes)
  const defaultMode = modeEntries.find((m) => m.isDefault) || modeEntries[0]
  const altMode = modeEntries.find((m) => m.id !== defaultMode?.id)

  const lightResult = resolveTokens(activeSet, defaultMode?.id)
  const darkResult = altMode ? resolveTokens(activeSet, altMode.id) : lightResult

  // Memoize compilation to avoid recomputing on every render
  const outputs = useMemo<Record<CompilerFormat, CompilerOutput>>(() => ({
    css: {
      format: 'css',
      code: compileToCssWithModes(lightResult.tokens, darkResult.tokens, {
        includeComments: true,
        prettify: true,
      }),
      language: 'css',
      fileName: 'tokens.css',
      mimeType: 'text/css',
    },
    scss: {
      format: 'scss',
      code: compileToScssWithModes(lightResult.tokens, darkResult.tokens, {
        includeComments: true,
        prettify: true,
      }),
      language: 'scss',
      fileName: 'tokens.scss',
      mimeType: 'text/x-scss',
    },
    typescript: {
      format: 'typescript',
      code: compileToTypeScriptWithModes(lightResult.tokens, darkResult.tokens, {
        includeComments: true,
        prettify: true,
      }),
      language: 'typescript',
      fileName: 'tokens.ts',
      mimeType: 'text/typescript',
    },
    tailwind: {
      format: 'tailwind',
      code: compileToTailwindWithModes(lightResult.tokens, darkResult.tokens, {
        includeComments: true,
        prettify: true,
      }),
      language: 'javascript',
      fileName: 'tailwind.config.js',
      mimeType: 'text/javascript',
    },
    'json-w3c': {
      format: 'json-w3c',
      code: compileToW3CJSONWithModes(lightResult.tokens, darkResult.tokens, {
        prettify: true,
      }),
      language: 'json',
      fileName: 'tokens.w3c.json',
      mimeType: 'application/json',
    },
    'style-dictionary': {
      format: 'style-dictionary',
      code: compileToStyleDictionaryWithModes(lightResult.tokens, darkResult.tokens, {
        prettify: true,
      }),
      language: 'json',
      fileName: 'tokens.sd.json',
      mimeType: 'application/json',
    },
  }), [lightResult.tokens, darkResult.tokens])

  const currentOutput = outputs[activeFormat]

  const handleCopy = async () => {
    await navigator.clipboard.writeText(currentOutput.code)
    setCopied(true)
    setTimeout(() => setCopied(false), 3000)
  }

  const handleDownload = () => {
    const blob = new Blob([currentOutput.code], { type: currentOutput.mimeType })
    saveAs(blob, currentOutput.fileName)
  }

  const handleDownloadAll = async () => {
    const zip = new JSZip()

    // Add all compiled files to zip
    Object.values(outputs).forEach((output) => {
      zip.file(output.fileName, output.code)
    })

    // Generate and download zip
    const content = await zip.generateAsync({ type: 'blob' })
    saveAs(content, `${activeSet.name.toLowerCase().replace(/\s+/g, '-')}-tokens.zip`)
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-border">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="section-title text-primary mb-2">COMPILER</h2>
            <p className="font-mono text-xs text-text-secondary">
              {activeSet.name} → Multi-Format Export
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleCopy}
              aria-label={`Copy ${activeFormat} code to clipboard`}
              className="flex items-center gap-2 px-4 py-2 bg-surface-elevated border border-border hover:border-primary transition-colors font-mono text-xs text-white"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4" aria-hidden="true" />
                  COPIED
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" aria-hidden="true" />
                  COPY
                </>
              )}
            </button>
            <span className="sr-only" aria-live="polite">{copied ? 'Code copied to clipboard' : ''}</span>
            <button
              onClick={handleDownload}
              className="flex items-center gap-2 px-4 py-2 bg-surface-elevated border border-border hover:border-primary transition-colors font-mono text-xs text-white"
            >
              <Download className="w-4 h-4" />
              DOWNLOAD
            </button>
            <button
              onClick={handleDownloadAll}
              className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-opacity-90 transition-colors font-mono text-xs text-white"
            >
              <Package className="w-4 h-4" />
              DOWNLOAD ALL
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="mt-4 flex items-center gap-4 font-mono text-xs">
          <div>
            <span className="text-text-secondary">TOKENS:</span>{' '}
            <span className="text-white">{Object.keys(lightResult.tokens).length}</span>
          </div>
          {lightResult.errors.length > 0 ? (
            <button
              onClick={() => setShowErrors(!showErrors)}
              className="hover:underline"
            >
              <span className="text-text-secondary">ERRORS:</span>{' '}
              <span className="text-error">{lightResult.errors.length}</span>
              <span className="text-text-tertiary ml-1">{showErrors ? '(hide)' : '(show)'}</span>
            </button>
          ) : (
            <div>
              <span className="text-text-secondary">ERRORS:</span>{' '}
              <span className="text-success">0</span>
            </div>
          )}
          <span className="text-border">|</span>
          <div className="text-text-tertiary">
            {(currentOutput.code.length / 1024).toFixed(1)} KB
          </div>
        </div>
      </div>

      {/* Error List */}
      {showErrors && lightResult.errors.length > 0 && (
        <div className="border-b border-border bg-surface-sunken px-6 py-3 space-y-1">
          {lightResult.errors.map((err, i) => (
            <div key={i} className="flex items-baseline gap-3 font-mono text-xs">
              <span className="text-error uppercase">{err.error.replace('_', ' ')}</span>
              <span className="text-white">{err.tokenPath}</span>
              <span className="text-text-tertiary">{err.message}</span>
            </div>
          ))}
        </div>
      )}

      {/* Format Tabs */}
      {(() => {
        const formats: CompilerFormat[] = ['css', 'scss', 'typescript', 'tailwind', 'json-w3c', 'style-dictionary']
        return (
          <div className="flex border-b border-border bg-surface overflow-x-auto" role="tablist" aria-label="Output formats">
            {formats.map((format, index) => (
              <button
                key={format}
                id={`compiler-tab-${format}`}
                role="tab"
                aria-selected={activeFormat === format}
                aria-controls="compiler-tabpanel"
                tabIndex={activeFormat === format ? 0 : -1}
                onClick={() => setActiveFormat(format)}
                onKeyDown={(e) => {
                  if (e.key === 'ArrowRight') { e.preventDefault(); setActiveFormat(formats[(index + 1) % formats.length]) }
                  else if (e.key === 'ArrowLeft') { e.preventDefault(); setActiveFormat(formats[(index - 1 + formats.length) % formats.length]) }
                }}
                className={`
                  relative px-6 py-3 font-mono text-xs uppercase tracking-wider transition-colors whitespace-nowrap
                  ${activeFormat === format ? 'text-primary' : 'text-text-secondary hover:text-white'}
                `}
              >
                {format === 'css' && 'CSS'}
                {format === 'scss' && 'SCSS'}
                {format === 'typescript' && 'TypeScript'}
                {format === 'tailwind' && 'Tailwind'}
                {format === 'json-w3c' && 'JSON (W3C)'}
                {format === 'style-dictionary' && 'Style Dictionary'}
                {activeFormat === format && (
                  <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-primary" />
                )}
              </button>
            ))}
          </div>
        )
      })()}

      {/* Format Description */}
      <div className="px-6 py-2 border-b border-border bg-surface-sunken">
        <p className="font-mono text-xs text-text-tertiary">
          {formatDescriptions[activeFormat]}
        </p>
      </div>

      {/* Code Output */}
      <div className="flex-1 overflow-auto bg-code-bg" role="tabpanel" id="compiler-tabpanel" aria-labelledby={`compiler-tab-${activeFormat}`} aria-label={`Generated ${activeFormat} code`}>
        <SyntaxHighlighter
          language={currentOutput.language}
          style={vscDarkPlus}
          showLineNumbers
          customStyle={{
            margin: 0,
            padding: '24px',
            background: 'transparent',
            fontSize: '13px',
            fontFamily: 'JetBrains Mono, monospace',
          }}
          lineNumberStyle={{
            color: 'rgb(var(--color-text-tertiary))',
            paddingRight: '24px',
            userSelect: 'none',
          }}
        >
          {currentOutput.code}
        </SyntaxHighlighter>
      </div>
    </div>
  )
}
