import { useMemo } from 'react'
import { Plus, X, User, ChevronDown } from 'lucide-react'
import type { Component, ResolvedTokenMap, TokenType } from '@/types'

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

// ---- Auto-detection: derive preview vars from the user's token set ----

interface DetectedToken {
  path: string
  value: string
}

function isColorString(value: unknown): boolean {
  if (typeof value !== 'string') return false
  const v = value.trim()
  return v.startsWith('#') || v.startsWith('rgb') || v.startsWith('hsl')
}

function collectByType(resolvedTokens: ResolvedTokenMap, type: TokenType): DetectedToken[] {
  const result: DetectedToken[] = []
  for (const [path, token] of Object.entries(resolvedTokens)) {
    if (token.type === type) {
      result.push({ path: path.toLowerCase(), value: String(token.resolvedValue) })
    }
  }
  return result
}

function collectColors(resolvedTokens: ResolvedTokenMap): DetectedToken[] {
  const result: DetectedToken[] = []
  for (const [path, token] of Object.entries(resolvedTokens)) {
    if (token.type === 'color' && isColorString(token.resolvedValue)) {
      result.push({ path: path.toLowerCase(), value: String(token.resolvedValue) })
    }
  }
  return result
}

function findToken(
  tokens: DetectedToken[],
  patterns: string[],
  excludePatterns?: string[]
): DetectedToken | null {
  for (const pattern of patterns) {
    const found = tokens.find((t) => {
      const segments = t.path.split('.')
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
  const dimensions = collectByType(resolvedTokens, 'dimension')
  const shadows = collectByType(resolvedTokens, 'shadow')
  const fontFamilies = collectByType(resolvedTokens, 'fontFamily')
  const fontWeights = collectByType(resolvedTokens, 'fontWeight')

  // Find semantic colors by token path patterns
  const primary = findToken(colors, ['primary', 'accent', 'brand'], ['on', 'foreground', 'fg', 'text'])
    || (colors.length > 0 ? colors[0] : null)
  const secondary = findToken(colors, ['secondary', 'muted'], ['on', 'foreground', 'fg', 'text'])
  const destructive = findToken(colors, ['destructive', 'danger', 'error', 'red'], ['on', 'foreground', 'fg', 'text'])
  const success = findToken(colors, ['success', 'green'], ['on', 'foreground', 'fg', 'text'])
  const warning = findToken(colors, ['warning', 'amber', 'orange'], ['on', 'foreground', 'fg', 'text'])
  const neutral = findToken(colors, ['neutral', 'gray', 'grey'], ['on', 'foreground', 'fg', 'text'])
  const surface = findToken(colors, ['surface', 'background', 'bg'], ['on', 'foreground', 'fg', 'text'])
  const textColor = findToken(colors, ['text', 'foreground', 'fg', 'on-surface', 'on-background'], ['background', 'bg', 'surface'])
  const borderColor = findToken(colors, ['border', 'outline', 'divider', 'separator'])

  const mainColor = primary?.value || '#555'
  const surfaceVal = surface?.value || '#1a0a0a'
  const textVal = textColor?.value || '#ccc'
  const borderVal = borderColor?.value || '#3d1515'

  // Detect non-color tokens
  const borderRadius = findToken(dimensions, ['radius', 'rounded', 'corner'])
  const shadowToken = findToken(shadows, ['shadow', 'elevation', 'drop'])
  const fontFamily = findToken(fontFamilies, ['sans', 'body', 'primary', 'default', 'base'])
  const fontWeight = findToken(fontWeights, ['regular', 'normal', 'body', 'default', 'base', 'medium'])

  // Set shared non-color vars when detected
  if (borderRadius) vars['--preview-container-borderRadius'] = borderRadius.value
  if (shadowToken) vars['--preview-container-boxShadow'] = shadowToken.value
  if (fontFamily) vars['--preview-text-fontFamily'] = fontFamily.value
  if (fontWeight) vars['--preview-text-fontWeight'] = fontWeight.value

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

    // State-specific overrides for interactive components
    if (activeState === 'disabled') {
      vars['--preview-container-backgroundColor'] = '#555'
      vars['--preview-container-borderColor'] = 'transparent'
      vars['--preview-label-color'] = '#888'
    } else if (activeState === 'selected') {
      vars['--preview-container-backgroundColor'] = mainColor
      vars['--preview-label-color'] = contrastText(mainColor)
      vars['--preview-container-borderColor'] = mainColor
    }
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
    } else if (activeState === 'filled') {
      vars['--preview-placeholder-color'] = textVal
    } else if (activeState === 'indeterminate') {
      vars['--preview-indicator-backgroundColor'] = mainColor
      vars['--preview-indicator-borderColor'] = mainColor
    } else if (activeState === 'open') {
      vars['--preview-container-borderColor'] = mainColor
    }
  } else {
    // Content / container components (card, text-heading, text-body, etc.)
    vars['--preview-container-backgroundColor'] = surfaceVal
    vars['--preview-container-borderColor'] = borderVal
    vars['--preview-text-color'] = textVal
    vars['--preview-label-color'] = textVal

    // State overrides for cards
    if (activeState === 'hover') {
      vars['--preview-container-borderColor'] = mainColor + '60'
    } else if (activeState === 'selected') {
      vars['--preview-container-borderColor'] = mainColor
    }
  }

  return vars
}

// State-based CSS transforms (fallback when no explicit bindings)
const STATE_STYLES: Record<string, React.CSSProperties> = {
  default: {},
  hover: { filter: 'brightness(1.15)' },
  pressed: { filter: 'brightness(0.85)', transform: 'scale(0.97)' },
  active: { filter: 'brightness(0.9)' },
  disabled: { opacity: 0.5, filter: 'grayscale(0.5)' },
  loading: { opacity: 0.7 },
  focus: { boxShadow: '0 0 0 2px rgba(150, 150, 255, 0.4)', borderRadius: '4px' },
  filled: { filter: 'brightness(1.05)' },
  checked: { filter: 'brightness(1.05)' },
  selected: { filter: 'brightness(1.05)' },
  error: { filter: 'saturate(1.3)' },
  open: { filter: 'brightness(1.05)' },
  indeterminate: { filter: 'brightness(1.02)' },
  visited: { filter: 'brightness(0.9) saturate(0.7)' },
}

// ---- Preview templates ----

const PREVIEW_SANS = 'system-ui, -apple-system, sans-serif'

interface PreviewProps {
  cssVars: Record<string, string>
  activeState: string
}

function ButtonPreview({ cssVars, activeState }: PreviewProps) {
  const isLoading = activeState === 'loading'
  return (
    <div style={cssVars as React.CSSProperties}>
      <button
        style={{
          backgroundColor: 'var(--preview-container-backgroundColor, #555)',
          color: 'var(--preview-label-color, #fff)',
          borderRadius: 'var(--preview-container-borderRadius, 6px)',
          padding: '8px 16px',
          border: '1px solid var(--preview-container-borderColor, transparent)',
          fontFamily: PREVIEW_SANS,
          fontSize: '14px',
          fontWeight: 500,
          cursor: activeState === 'disabled' ? 'not-allowed' : 'pointer',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          boxShadow: 'var(--preview-container-boxShadow, none)',
        }}
      >
        {isLoading && (
          <span
            style={{
              width: '14px',
              height: '14px',
              border: '2px solid currentColor',
              borderTopColor: 'transparent',
              borderRadius: '50%',
              display: 'inline-block',
              animation: 'spin 0.8s linear infinite',
            }}
          />
        )}
        Button Label
      </button>
    </div>
  )
}

function IconButtonPreview({ cssVars, activeState }: PreviewProps) {
  return (
    <div style={cssVars as React.CSSProperties}>
      <button
        style={{
          backgroundColor: 'var(--preview-container-backgroundColor, #555)',
          color: 'var(--preview-label-color, #fff)',
          borderRadius: 'var(--preview-container-borderRadius, 6px)',
          width: '36px',
          height: '36px',
          padding: 0,
          border: '1px solid var(--preview-container-borderColor, transparent)',
          cursor: activeState === 'disabled' ? 'not-allowed' : 'pointer',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: 'var(--preview-container-boxShadow, none)',
        }}
      >
        <Plus size={16} />
      </button>
    </div>
  )
}

function BadgePreview({ cssVars }: PreviewProps) {
  return (
    <div style={cssVars as React.CSSProperties}>
      <span
        style={{
          backgroundColor: 'var(--preview-container-backgroundColor, #55555520)',
          color: 'var(--preview-label-color, #aaa)',
          borderRadius: 'var(--preview-container-borderRadius, 4px)',
          padding: '2px 8px',
          fontFamily: PREVIEW_SANS,
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

function TagPreview({ cssVars, activeState }: PreviewProps) {
  const isSelected = activeState === 'selected'
  return (
    <div style={cssVars as React.CSSProperties}>
      <span
        style={{
          backgroundColor: isSelected
            ? 'var(--preview-container-backgroundColor, #555)'
            : 'transparent',
          color: 'var(--preview-label-color, #ccc)',
          borderRadius: 'var(--preview-container-borderRadius, 12px)',
          padding: '4px 10px',
          fontFamily: PREVIEW_SANS,
          fontSize: '12px',
          fontWeight: 500,
          border: '1px solid var(--preview-container-borderColor, #555)',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          cursor: activeState === 'disabled' ? 'not-allowed' : 'pointer',
        }}
      >
        Category
        <X size={12} style={{ opacity: 0.6 }} />
      </span>
    </div>
  )
}

function LinkPreview({ cssVars, activeState }: PreviewProps) {
  const isVisited = activeState === 'visited'
  const isHover = activeState === 'hover'
  return (
    <div style={cssVars as React.CSSProperties}>
      <span
        style={{
          color: 'var(--preview-label-color, #6ba3f2)',
          fontFamily: PREVIEW_SANS,
          fontSize: '14px',
          textDecoration: isHover ? 'underline' : (isVisited ? 'underline' : 'none'),
          textDecorationStyle: isVisited ? ('dotted' as const) : ('solid' as const),
          cursor: activeState === 'disabled' ? 'not-allowed' : 'pointer',
          opacity: isVisited ? 0.7 : 1,
        }}
      >
        View documentation
      </span>
    </div>
  )
}

function AvatarPreview({ cssVars, activeState }: PreviewProps) {
  const isLoading = activeState === 'loading'
  return (
    <div style={cssVars as React.CSSProperties}>
      <div
        style={{
          width: '40px',
          height: '40px',
          borderRadius: '50%',
          backgroundColor: 'var(--preview-container-backgroundColor, #333)',
          border: '2px solid var(--preview-container-borderColor, #555)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          opacity: isLoading ? 0.5 : 1,
        }}
      >
        {isLoading ? (
          <span
            style={{
              width: '18px',
              height: '18px',
              border: '2px solid #888',
              borderTopColor: 'transparent',
              borderRadius: '50%',
              display: 'inline-block',
              animation: 'spin 0.8s linear infinite',
            }}
          />
        ) : (
          <User size={20} style={{ color: 'var(--preview-label-color, #888)' }} />
        )}
      </div>
    </div>
  )
}

function DividerPreview({ cssVars, activeVariant }: PreviewProps & { activeVariant: string | null }) {
  const isVertical = activeVariant === 'vertical'
  const hasLabel = activeVariant === 'with-label'

  if (isVertical) {
    return (
      <div style={cssVars as React.CSSProperties}>
        <div
          style={{
            width: '1px',
            height: '48px',
            backgroundColor: 'var(--preview-container-borderColor, #555)',
          }}
        />
      </div>
    )
  }

  if (hasLabel) {
    return (
      <div style={{ ...cssVars as React.CSSProperties, display: 'flex', alignItems: 'center', gap: '12px', width: '200px' }}>
        <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--preview-container-borderColor, #555)' }} />
        <span style={{ fontFamily: PREVIEW_SANS, fontSize: '11px', color: 'var(--preview-label-color, #888)', whiteSpace: 'nowrap' }}>
          Section
        </span>
        <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--preview-container-borderColor, #555)' }} />
      </div>
    )
  }

  return (
    <div style={cssVars as React.CSSProperties}>
      <div
        style={{
          width: '200px',
          height: '1px',
          backgroundColor: 'var(--preview-container-borderColor, #555)',
        }}
      />
    </div>
  )
}

function SelectPreview({ cssVars, activeState }: PreviewProps) {
  const isOpen = activeState === 'open'
  const isFocus = activeState === 'focus'
  return (
    <div style={{ ...cssVars as React.CSSProperties, display: 'flex', flexDirection: 'column' as const, gap: '6px' }}>
      <label style={{ fontFamily: PREVIEW_SANS, fontSize: '12px', color: 'var(--preview-label-color, #aaa)' }}>
        Label
      </label>
      <div
        style={{
          backgroundColor: 'var(--preview-container-backgroundColor, #1a0a0a)',
          border: '1px solid var(--preview-container-borderColor, #3d1515)',
          borderRadius: 'var(--preview-container-borderRadius, 6px)',
          padding: '8px 12px',
          fontFamily: PREVIEW_SANS,
          fontSize: '14px',
          color: 'var(--preview-placeholder-color, #666)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          cursor: activeState === 'disabled' ? 'not-allowed' : 'pointer',
          boxShadow: isFocus ? '0 0 0 2px var(--preview-container-borderColor)' : 'none',
        }}
      >
        <span>Select option</span>
        <ChevronDown
          size={14}
          style={{
            transition: 'transform 0.15s',
            transform: isOpen ? 'rotate(180deg)' : 'none',
            opacity: 0.6,
          }}
        />
      </div>
      {activeState === 'error' && (
        <span style={{ fontFamily: PREVIEW_SANS, fontSize: '11px', color: 'var(--preview-helperText-color, #dc2626)' }}>
          Selection required
        </span>
      )}
    </div>
  )
}

function InputTextPreview({ cssVars, activeState }: PreviewProps) {
  const isFilled = activeState === 'filled'
  const isFocus = activeState === 'focus'
  return (
    <div style={{ ...cssVars as React.CSSProperties, display: 'flex', flexDirection: 'column' as const, gap: '6px' }}>
      <label style={{ fontFamily: PREVIEW_SANS, fontSize: '12px', color: 'var(--preview-label-color, #aaa)' }}>
        Label
      </label>
      <div
        style={{
          backgroundColor: 'var(--preview-container-backgroundColor, #1a0a0a)',
          border: '1px solid var(--preview-container-borderColor, #3d1515)',
          borderRadius: 'var(--preview-container-borderRadius, 6px)',
          padding: '8px 12px',
          fontFamily: PREVIEW_SANS,
          fontSize: '14px',
          color: isFilled
            ? 'var(--preview-label-color, #ccc)'
            : 'var(--preview-placeholder-color, #666)',
          boxShadow: isFocus ? '0 0 0 2px var(--preview-container-borderColor)' : 'none',
        }}
      >
        {isFilled ? 'User input value' : 'Placeholder text'}
      </div>
      {activeState === 'error' ? (
        <span style={{ fontFamily: PREVIEW_SANS, fontSize: '11px', color: 'var(--preview-helperText-color, #dc2626)' }}>
          This field is required
        </span>
      ) : (
        <span style={{ fontFamily: PREVIEW_SANS, fontSize: '11px', color: 'var(--preview-helperText-color, #666)' }}>
          Helper text
        </span>
      )}
    </div>
  )
}

function CheckboxPreview({ cssVars, activeState }: PreviewProps) {
  const isChecked = activeState === 'checked'
  const isIndeterminate = activeState === 'indeterminate'
  const showFill = isChecked || isIndeterminate

  return (
    <div style={{ ...cssVars as React.CSSProperties, display: 'flex', alignItems: 'center', gap: '10px' }}>
      <div
        style={{
          width: '18px',
          height: '18px',
          borderRadius: 'var(--preview-indicator-borderRadius, 4px)',
          border: '2px solid var(--preview-indicator-borderColor, #777)',
          backgroundColor: showFill
            ? 'var(--preview-indicator-backgroundColor, #555)'
            : 'transparent',
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#fff',
        }}
      >
        {isChecked && (
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
        {isIndeterminate && (
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M3 6h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        )}
      </div>
      <span style={{ fontFamily: PREVIEW_SANS, fontSize: '14px', color: 'var(--preview-label-color, #ccc)' }}>
        Checkbox label
      </span>
    </div>
  )
}

function RadioPreview({ cssVars, activeState }: PreviewProps) {
  const isSelected = activeState === 'selected'
  return (
    <div style={{ ...cssVars as React.CSSProperties, display: 'flex', alignItems: 'center', gap: '10px' }}>
      <div
        style={{
          width: '18px',
          height: '18px',
          borderRadius: '50%',
          border: '2px solid var(--preview-indicator-borderColor, #777)',
          backgroundColor: 'transparent',
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {isSelected && (
          <div
            style={{
              width: '10px',
              height: '10px',
              borderRadius: '50%',
              backgroundColor: 'var(--preview-indicator-backgroundColor, #555)',
            }}
          />
        )}
      </div>
      <span style={{ fontFamily: PREVIEW_SANS, fontSize: '14px', color: 'var(--preview-label-color, #ccc)' }}>
        Radio label
      </span>
    </div>
  )
}

function CardPreview({ cssVars, activeState }: PreviewProps) {
  return (
    <div
      style={{
        ...cssVars as React.CSSProperties,
        backgroundColor: 'var(--preview-container-backgroundColor, #1a0a0a)',
        border: '1px solid var(--preview-container-borderColor, #3d1515)',
        borderRadius: 'var(--preview-container-borderRadius, 8px)',
        boxShadow: activeState === 'hover'
          ? 'var(--preview-container-boxShadow, 0 4px 12px rgba(0,0,0,0.3))'
          : 'var(--preview-container-boxShadow, none)',
        overflow: 'hidden',
        width: '200px',
      }}
    >
      <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--preview-container-borderColor, #3d1515)' }}>
        <span style={{ fontFamily: PREVIEW_SANS, fontSize: '13px', fontWeight: 600, color: '#fff' }}>Card Header</span>
      </div>
      <div style={{ padding: '12px 16px' }}>
        <span style={{ fontFamily: PREVIEW_SANS, fontSize: '12px', color: '#888' }}>Card body content goes here.</span>
      </div>
    </div>
  )
}

function TextHeadingPreview({ cssVars, activeVariant }: PreviewProps & { activeVariant: string | null }) {
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

function TextBodyPreview({ cssVars, activeVariant }: PreviewProps & { activeVariant: string | null }) {
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
          fontFamily: PREVIEW_SANS,
          fontSize: '13px',
          color: 'var(--preview-label-color, #ccc)',
        }}>
          {component.name}
        </span>
      </div>
    </div>
  )
}

function renderAtomPreview(
  component: Component,
  cssVars: Record<string, string>,
  activeState: string,
  activeVariant: string | null
) {
  switch (component.id) {
    case 'button':
      return <ButtonPreview cssVars={cssVars} activeState={activeState} />
    case 'button-icon':
      return <IconButtonPreview cssVars={cssVars} activeState={activeState} />
    case 'badge':
    case 'badge-dot':
      return <BadgePreview cssVars={cssVars} activeState={activeState} />
    case 'tag':
      return <TagPreview cssVars={cssVars} activeState={activeState} />
    case 'link':
      return <LinkPreview cssVars={cssVars} activeState={activeState} />
    case 'avatar':
      return <AvatarPreview cssVars={cssVars} activeState={activeState} />
    case 'divider':
      return <DividerPreview cssVars={cssVars} activeState={activeState} activeVariant={activeVariant} />
    case 'input-text':
      return <InputTextPreview cssVars={cssVars} activeState={activeState} />
    case 'input-select':
      return <SelectPreview cssVars={cssVars} activeState={activeState} />
    case 'checkbox':
      return <CheckboxPreview cssVars={cssVars} activeState={activeState} />
    case 'radio':
      return <RadioPreview cssVars={cssVars} activeState={activeState} />
    case 'card':
      return <CardPreview cssVars={cssVars} activeState={activeState} />
    case 'text-heading':
      return <TextHeadingPreview cssVars={cssVars} activeState={activeState} activeVariant={activeVariant} />
    case 'text-body':
      return <TextBodyPreview cssVars={cssVars} activeState={activeState} activeVariant={activeVariant} />
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
        {renderAtomPreview(component, cssVars, activeState, activeVariant)}
      </div>
      {!hasBindings && (
        <span className="absolute bottom-2 right-3 font-mono text-[10px] text-text-tertiary/60">
          unbound -- add tokens to customize
        </span>
      )}
    </div>
  )
}
