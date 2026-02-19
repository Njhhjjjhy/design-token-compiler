import { useMemo } from 'react'
import type { Component, ResolvedTokenMap } from '@/types'

interface ComponentPreviewProps {
  component: Component
  resolvedTokens: ResolvedTokenMap
  activeState: string
  activeVariant: string | null
}

// ---- Binding-driven CSS vars (when user has explicit bindings) ----

function deriveCssVars(
  component: Component,
  resolvedTokens: ResolvedTokenMap,
  activeState: string,
  activeVariant: string | null
): Record<string, string> {
  const vars: Record<string, string> = {}
  for (const binding of component.bindings) {
    if (binding.stateId !== activeState) continue
    if (binding.variantId !== null && binding.variantId !== activeVariant) continue
    const token = resolvedTokens[binding.tokenPath]
    if (!token) continue
    const prop = binding.cssProperty.replace(/-([a-z])/g, (_, c: string) => c.toUpperCase())
    const varName = `--preview-${binding.partId}-${prop}`
    vars[varName] = String(token.resolvedValue)
  }
  return vars
}

// ---- Auto-detection: derive preview colors from the user's token set ----

interface DetectedColor {
  path: string
  value: string
}

function isColorString(value: unknown): boolean {
  if (typeof value !== 'string') return false
  const v = value.trim()
  return v.startsWith('#') || v.startsWith('rgb') || v.startsWith('hsl')
}

function collectColors(resolvedTokens: ResolvedTokenMap): DetectedColor[] {
  const result: DetectedColor[] = []
  for (const [path, token] of Object.entries(resolvedTokens)) {
    if (token.type === 'color' && isColorString(token.resolvedValue)) {
      result.push({ path: path.toLowerCase(), value: String(token.resolvedValue) })
    }
  }
  return result
}

function findColor(
  colors: DetectedColor[],
  patterns: string[],
  excludePatterns?: string[]
): DetectedColor | null {
  for (const pattern of patterns) {
    const found = colors.find((c) => {
      const segments = c.path.split('.')
      const hasMatch = segments.some((s) => s.includes(pattern))
      if (!hasMatch) return false
      if (excludePatterns) {
        return !segments.some((s) => excludePatterns.some((e) => s.includes(e)))
      }
      return true
    })
    if (found) return found
  }
  return null
}

function isLightColor(color: string): boolean {
  if (!color.startsWith('#')) return false
  const hex = color.replace('#', '')
  let r: number, g: number, b: number
  if (hex.length === 3) {
    r = parseInt(hex[0] + hex[0], 16)
    g = parseInt(hex[1] + hex[1], 16)
    b = parseInt(hex[2] + hex[2], 16)
  } else if (hex.length >= 6) {
    r = parseInt(hex.substring(0, 2), 16)
    g = parseInt(hex.substring(2, 4), 16)
    b = parseInt(hex.substring(4, 6), 16)
  } else {
    return false
  }
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.5
}

function contrastText(bg: string): string {
  if (bg === 'transparent') return '#ccc'
  return isLightColor(bg) ? '#000' : '#fff'
}

const INTERACTIVE_IDS = ['button', 'button-icon', 'badge', 'badge-dot', 'tag', 'link']
const INPUT_IDS = ['input-text', 'input-select', 'checkbox', 'radio']

function autoDeriveCssVars(
  component: Component,
  resolvedTokens: ResolvedTokenMap,
  activeState: string,
  activeVariant: string | null
): Record<string, string> {
  const vars: Record<string, string> = {}
  const colors = collectColors(resolvedTokens)
  if (colors.length === 0) return vars

  // Find semantic colors by token path patterns
  const primary = findColor(colors, ['primary', 'accent', 'brand'], ['on', 'foreground', 'fg', 'text'])
    || colors[0]
  const secondary = findColor(colors, ['secondary', 'muted'], ['on', 'foreground', 'fg', 'text'])
  const destructive = findColor(colors, ['destructive', 'danger', 'error', 'red'], ['on', 'foreground', 'fg', 'text'])
  const success = findColor(colors, ['success', 'green'], ['on', 'foreground', 'fg', 'text'])
  const warning = findColor(colors, ['warning', 'amber', 'orange'], ['on', 'foreground', 'fg', 'text'])
  const neutral = findColor(colors, ['neutral', 'gray', 'grey'], ['on', 'foreground', 'fg', 'text'])
  const surface = findColor(colors, ['surface', 'background', 'bg'], ['on', 'foreground', 'fg', 'text'])
  const textColor = findColor(colors, ['text', 'foreground', 'fg', 'on-surface', 'on-background'], ['background', 'bg', 'surface'])
  const borderColor = findColor(colors, ['border', 'outline', 'divider', 'separator'])

  const mainColor = primary?.value || '#555'
  const surfaceVal = surface?.value || '#1a0a0a'
  const textVal = textColor?.value || '#ccc'
  const borderVal = borderColor?.value || '#3d1515'

  const isInteractive = INTERACTIVE_IDS.includes(component.id)
  const isInput = INPUT_IDS.includes(component.id)

  if (isInteractive) {
    // Pick color based on active appearance variant
    let bg = mainColor
    if (activeVariant === 'secondary' && secondary) {
      bg = secondary.value
    } else if (activeVariant === 'ghost' || activeVariant === 'outlined') {
      bg = 'transparent'
    } else if (activeVariant === 'destructive' || activeVariant === 'error') {
      bg = destructive?.value || '#dc2626'
    } else if (activeVariant === 'success') {
      bg = success?.value || '#22c55e'
    } else if (activeVariant === 'warning') {
      bg = warning?.value || '#f59e0b'
    } else if (activeVariant === 'neutral') {
      bg = neutral?.value || '#6b7280'
    } else if (activeVariant === 'filled') {
      bg = mainColor
    }

    const fg = bg === 'transparent' ? mainColor : contrastText(bg)
    vars['--preview-container-backgroundColor'] = bg
    vars['--preview-container-borderColor'] = bg === 'transparent' ? mainColor : 'transparent'
    vars['--preview-label-color'] = fg
    vars['--preview-indicator-borderColor'] = mainColor
    vars['--preview-indicator-backgroundColor'] = mainColor
    vars['--preview-dot-backgroundColor'] = bg === 'transparent' ? mainColor : bg
  } else if (isInput) {
    vars['--preview-container-backgroundColor'] = surfaceVal
    vars['--preview-container-borderColor'] = borderVal
    vars['--preview-label-color'] = textVal
    vars['--preview-placeholder-color'] = textVal + '80'
    vars['--preview-helperText-color'] = textVal + '60'
    vars['--preview-indicator-borderColor'] = borderVal
    vars['--preview-indicator-backgroundColor'] = 'transparent'

    // State-specific overrides for inputs
    if (activeState === 'focus') {
      vars['--preview-container-borderColor'] = mainColor
    } else if (activeState === 'error') {
      const errColor = destructive?.value || '#dc2626'
      vars['--preview-container-borderColor'] = errColor
      vars['--preview-helperText-color'] = errColor
    } else if (activeState === 'checked' || activeState === 'selected') {
      vars['--preview-indicator-backgroundColor'] = mainColor
      vars['--preview-indicator-borderColor'] = mainColor
    }
  } else {
    // Content / container components (card, text-heading, text-body, etc.)
    vars['--preview-container-backgroundColor'] = surfaceVal
    vars['--preview-container-borderColor'] = borderVal
    vars['--preview-text-color'] = textVal
    vars['--preview-label-color'] = textVal
  }

  return vars
}

// State-based CSS transforms (used when no explicit bindings)
const STATE_STYLES: Record<string, React.CSSProperties> = {
  default: {},
  hover: { filter: 'brightness(1.2)' },
  pressed: { filter: 'brightness(0.8)', transform: 'scale(0.97)' },
  active: { filter: 'brightness(0.85)' },
  disabled: { filter: 'grayscale(0.8) brightness(0.6)', opacity: 0.4 },
  loading: { opacity: 0.6 },
  focus: {},
  filled: {},
  checked: {},
  selected: {},
  error: {},
  open: {},
  indeterminate: {},
  visited: { filter: 'brightness(0.9) saturate(0.7)' },
}

// ---- Preview templates ----

function ButtonPreview({ cssVars }: { cssVars: Record<string, string> }) {
  return (
    <div style={cssVars as React.CSSProperties}>
      <button
        style={{
          backgroundColor: 'var(--preview-container-backgroundColor, #555)',
          color: 'var(--preview-label-color, #fff)',
          borderRadius: 'var(--preview-container-borderRadius, 6px)',
          padding: '8px 16px',
          border: '1px solid var(--preview-container-borderColor, transparent)',
          fontFamily: 'monospace',
          fontSize: '14px',
          fontWeight: 500,
          cursor: 'pointer',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
        }}
      >
        Button Label
      </button>
    </div>
  )
}

function BadgePreview({ cssVars }: { cssVars: Record<string, string> }) {
  return (
    <div style={cssVars as React.CSSProperties}>
      <span
        style={{
          backgroundColor: 'var(--preview-container-backgroundColor, #55555520)',
          color: 'var(--preview-label-color, #aaa)',
          borderRadius: 'var(--preview-container-borderRadius, 4px)',
          padding: '2px 8px',
          fontFamily: 'monospace',
          fontSize: '11px',
          fontWeight: 600,
          letterSpacing: '0.05em',
          textTransform: 'uppercase' as const,
          border: '1px solid var(--preview-container-borderColor, #55555530)',
        }}
      >
        Status
      </span>
    </div>
  )
}

function InputTextPreview({ cssVars }: { cssVars: Record<string, string> }) {
  return (
    <div style={{ ...cssVars as React.CSSProperties, display: 'flex', flexDirection: 'column' as const, gap: '6px' }}>
      <label style={{ fontFamily: 'monospace', fontSize: '12px', color: 'var(--preview-label-color, #aaa)' }}>
        Label
      </label>
      <div
        style={{
          backgroundColor: 'var(--preview-container-backgroundColor, #1a0a0a)',
          border: '1px solid var(--preview-container-borderColor, #3d1515)',
          borderRadius: 'var(--preview-container-borderRadius, 6px)',
          padding: '8px 12px',
          fontFamily: 'monospace',
          fontSize: '14px',
          color: 'var(--preview-placeholder-color, #666)',
        }}
      >
        Placeholder text
      </div>
      <span style={{ fontFamily: 'monospace', fontSize: '11px', color: 'var(--preview-helperText-color, #666)' }}>
        Helper text
      </span>
    </div>
  )
}

function CheckboxPreview({ cssVars }: { cssVars: Record<string, string> }) {
  return (
    <div style={{ ...cssVars as React.CSSProperties, display: 'flex', alignItems: 'center', gap: '10px' }}>
      <div
        style={{
          width: '18px',
          height: '18px',
          borderRadius: 'var(--preview-indicator-borderRadius, 4px)',
          border: '2px solid var(--preview-indicator-borderColor, #777)',
          backgroundColor: 'var(--preview-indicator-backgroundColor, transparent)',
          flexShrink: 0,
        }}
      />
      <span style={{ fontFamily: 'monospace', fontSize: '14px', color: 'var(--preview-label-color, #ccc)' }}>
        Checkbox label
      </span>
    </div>
  )
}

function CardPreview({ cssVars }: { cssVars: Record<string, string> }) {
  return (
    <div
      style={{
        ...cssVars as React.CSSProperties,
        backgroundColor: 'var(--preview-container-backgroundColor, #1a0a0a)',
        border: '1px solid var(--preview-container-borderColor, #3d1515)',
        borderRadius: 'var(--preview-container-borderRadius, 8px)',
        boxShadow: 'var(--preview-container-boxShadow, none)',
        overflow: 'hidden',
        width: '200px',
      }}
    >
      <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--preview-container-borderColor, #3d1515)' }}>
        <span style={{ fontFamily: 'monospace', fontSize: '13px', fontWeight: 600, color: '#fff' }}>Card Header</span>
      </div>
      <div style={{ padding: '12px 16px' }}>
        <span style={{ fontFamily: 'monospace', fontSize: '12px', color: '#888' }}>Card body content goes here.</span>
      </div>
    </div>
  )
}

function TextHeadingPreview({ cssVars, activeVariant }: { cssVars: Record<string, string>; activeVariant: string | null }) {
  const level = activeVariant || 'h2'
  const sizes: Record<string, string> = { h1: '32px', h2: '24px', h3: '20px', h4: '18px', h5: '16px', h6: '14px' }
  const weights: Record<string, number> = { h1: 700, h2: 700, h3: 600, h4: 600, h5: 500, h6: 500 }
  return (
    <div style={cssVars as React.CSSProperties}>
      <span style={{
        display: 'block',
        fontFamily: 'var(--preview-text-fontFamily, serif)',
        fontSize: `var(--preview-text-fontSize, ${sizes[level] || '24px'})`,
        fontWeight: `var(--preview-text-fontWeight, ${weights[level] || 700})` as React.CSSProperties['fontWeight'],
        color: 'var(--preview-text-color, #fff)',
        lineHeight: 1.2,
      }}>
        {level.toUpperCase()} Heading Text
      </span>
    </div>
  )
}

function TextBodyPreview({ cssVars, activeVariant }: { cssVars: Record<string, string>; activeVariant: string | null }) {
  const sizes: Record<string, string> = {
    'size-lg': '18px', 'size-md': '14px', 'size-sm': '12px',
    caption: '11px', overline: '11px',
  }
  const variant = activeVariant || 'size-md'
  const isOverline = variant === 'overline'
  return (
    <div style={cssVars as React.CSSProperties}>
      <span style={{
        display: 'block',
        fontFamily: 'var(--preview-text-fontFamily, sans-serif)',
        fontSize: `var(--preview-text-fontSize, ${sizes[variant] || '14px'})`,
        fontWeight: 'var(--preview-text-fontWeight, 400)' as React.CSSProperties['fontWeight'],
        color: 'var(--preview-text-color, #ccc)',
        textTransform: isOverline ? 'uppercase' : 'none',
        letterSpacing: isOverline ? '0.1em' : 'normal',
        lineHeight: 1.5,
      }}>
        {isOverline ? 'OVERLINE TEXT' : 'The quick brown fox jumps over the lazy dog.'}
      </span>
    </div>
  )
}

function GenericPreview({ component, cssVars }: { component: Component; cssVars: Record<string, string> }) {
  return (
    <div style={cssVars as React.CSSProperties}>
      <div
        style={{
          padding: '12px 16px',
          border: '1px solid var(--preview-container-borderColor, #3d1515)',
          borderRadius: 'var(--preview-container-borderRadius, 6px)',
          backgroundColor: 'var(--preview-container-backgroundColor, #1a0a0a)',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
        }}
      >
        <span style={{
          fontFamily: 'monospace',
          fontSize: '13px',
          color: 'var(--preview-label-color, #ccc)',
        }}>
          {component.name}
        </span>
      </div>
    </div>
  )
}

function renderAtomPreview(component: Component, cssVars: Record<string, string>, activeVariant: string | null) {
  switch (component.id) {
    case 'button':
    case 'button-icon':
      return <ButtonPreview cssVars={cssVars} />
    case 'badge':
    case 'badge-dot':
      return <BadgePreview cssVars={cssVars} />
    case 'input-text':
    case 'input-select':
      return <InputTextPreview cssVars={cssVars} />
    case 'checkbox':
    case 'radio':
      return <CheckboxPreview cssVars={cssVars} />
    case 'card':
      return <CardPreview cssVars={cssVars} />
    case 'text-heading':
      return <TextHeadingPreview cssVars={cssVars} activeVariant={activeVariant} />
    case 'text-body':
      return <TextBodyPreview cssVars={cssVars} activeVariant={activeVariant} />
    default:
      return <GenericPreview component={component} cssVars={cssVars} />
  }
}

export function ComponentPreview({ component, resolvedTokens, activeState, activeVariant }: ComponentPreviewProps) {
  const hasBindings = component.bindings.length > 0

  const cssVars = useMemo(
    () => hasBindings
      ? deriveCssVars(component, resolvedTokens, activeState, activeVariant)
      : autoDeriveCssVars(component, resolvedTokens, activeState, activeVariant),
    [component, resolvedTokens, activeState, activeVariant, hasBindings]
  )

  // Apply CSS filter-based state transforms when no explicit bindings
  const stateStyle = hasBindings ? undefined : STATE_STYLES[activeState]

  return (
    <div className="relative flex items-center justify-center min-h-[120px] p-8 bg-surface-elevated/30 rounded border border-border">
      <div style={stateStyle} className="transition-all duration-150">
        {renderAtomPreview(component, cssVars, activeVariant)}
      </div>
      {!hasBindings && (
        <span className="absolute bottom-2 right-3 font-mono text-[10px] text-text-tertiary/60">
          unbound -- add tokens to customize
        </span>
      )}
    </div>
  )
}
