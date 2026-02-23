import { useMemo } from 'react'
import { Plus, X, User, ChevronDown } from 'lucide-react'
import type { Component, ResolvedTokenMap, TokenType } from '@/types'

interface ComponentPreviewProps {
  component: Component
  resolvedTokens: ResolvedTokenMap
  activeState: string
  activeVariants: Record<string, string>
}

// ---- Binding-driven CSS vars (when user has explicit bindings) ----

function deriveCssVars(
  component: Component,
  resolvedTokens: ResolvedTokenMap,
  activeState: string,
  activeVariants: Record<string, string>
): Record<string, string> {
  const activeVariantValues = new Set(Object.values(activeVariants))
  const vars: Record<string, string> = {}
  for (const binding of component.bindings) {
    if (binding.stateId !== activeState) continue
    if (binding.variantId !== null && !activeVariantValues.has(binding.variantId)) continue
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
  activeVariants: Record<string, string>
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

  const appearanceVariant = activeVariants['appearance'] || null

  if (isInteractive) {
    // Pick color based on active appearance variant
    let bg = mainColor
    if (appearanceVariant === 'secondary') {
      bg = secondary?.value || '#6b7280'
    } else if (appearanceVariant === 'ghost' || appearanceVariant === 'outlined') {
      bg = 'transparent'
    } else if (appearanceVariant === 'destructive' || appearanceVariant === 'error') {
      bg = destructive?.value || '#dc2626'
    } else if (appearanceVariant === 'success') {
      bg = success?.value || '#22c55e'
    } else if (appearanceVariant === 'warning') {
      bg = warning?.value || '#f59e0b'
    } else if (appearanceVariant === 'neutral') {
      bg = neutral?.value || '#6b7280'
    } else if (appearanceVariant === 'filled') {
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

    // Links are text-only -- label color should be the primary color, not contrast-white
    if (component.id === 'link') {
      vars['--preview-label-color'] = mainColor
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
    // Content / container components (card, etc.)
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
  activeVariants: Record<string, string>
}

const BUTTON_SIZES: Record<string, { padding: string; fontSize: string; spinnerSize: string }> = {
  'size-sm': { padding: '4px 10px', fontSize: '12px', spinnerSize: '12px' },
  'size-md': { padding: '8px 16px', fontSize: '14px', spinnerSize: '14px' },
  'size-lg': { padding: '12px 24px', fontSize: '16px', spinnerSize: '16px' },
}

function ButtonPreview({ cssVars, activeState, activeVariants }: PreviewProps) {
  const isLoading = activeState === 'loading'
  const sizeKey = activeVariants['size'] || 'size-md'
  const size = BUTTON_SIZES[sizeKey] || BUTTON_SIZES['size-md']
  return (
    <div style={cssVars as React.CSSProperties}>
      <button
        style={{
          backgroundColor: 'var(--preview-container-backgroundColor, #555)',
          color: 'var(--preview-label-color, #fff)',
          borderRadius: 'var(--preview-container-borderRadius, 6px)',
          padding: size.padding,
          border: '1px solid var(--preview-container-borderColor, transparent)',
          fontFamily: PREVIEW_SANS,
          fontSize: size.fontSize,
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
              width: size.spinnerSize,
              height: size.spinnerSize,
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

const ICON_BUTTON_SIZES: Record<string, { box: string; icon: number }> = {
  'size-sm': { box: '28px', icon: 14 },
  'size-md': { box: '36px', icon: 16 },
  'size-lg': { box: '48px', icon: 22 },
}

function IconButtonPreview({ cssVars, activeState, activeVariants }: PreviewProps) {
  const sizeKey = activeVariants['size'] || 'size-md'
  const size = ICON_BUTTON_SIZES[sizeKey] || ICON_BUTTON_SIZES['size-md']
  return (
    <div style={cssVars as React.CSSProperties}>
      <button
        style={{
          backgroundColor: 'var(--preview-container-backgroundColor, #555)',
          color: 'var(--preview-label-color, #fff)',
          borderRadius: 'var(--preview-container-borderRadius, 6px)',
          width: size.box,
          height: size.box,
          padding: 0,
          border: '1px solid var(--preview-container-borderColor, transparent)',
          cursor: activeState === 'disabled' ? 'not-allowed' : 'pointer',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: 'var(--preview-container-boxShadow, none)',
        }}
      >
        <Plus size={size.icon} />
      </button>
    </div>
  )
}

const BADGE_SIZES: Record<string, { padding: string; fontSize: string }> = {
  'size-sm': { padding: '1px 6px', fontSize: '10px' },
  'size-md': { padding: '2px 8px', fontSize: '11px' },
}

function BadgePreview({ cssVars, activeVariants }: PreviewProps) {
  const sizeKey = activeVariants['size'] || 'size-md'
  const size = BADGE_SIZES[sizeKey] || BADGE_SIZES['size-md']
  return (
    <div style={cssVars as React.CSSProperties}>
      <span
        style={{
          backgroundColor: 'var(--preview-container-backgroundColor, #55555520)',
          color: 'var(--preview-label-color, #aaa)',
          borderRadius: 'var(--preview-container-borderRadius, 4px)',
          padding: size.padding,
          fontFamily: PREVIEW_SANS,
          fontSize: size.fontSize,
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

function BadgeDotPreview({ cssVars }: PreviewProps) {
  return (
    <div style={cssVars as React.CSSProperties}>
      <span
        style={{
          width: '10px',
          height: '10px',
          borderRadius: '50%',
          backgroundColor: 'var(--preview-dot-backgroundColor, #555)',
          display: 'inline-block',
        }}
      />
    </div>
  )
}

const TAG_SIZES: Record<string, { padding: string; fontSize: string; iconSize: number }> = {
  'size-sm': { padding: '2px 8px', fontSize: '11px', iconSize: 10 },
  'size-md': { padding: '4px 10px', fontSize: '12px', iconSize: 12 },
}

function TagPreview({ cssVars, activeState, activeVariants }: PreviewProps) {
  const isSelected = activeState === 'selected'
  const sizeKey = activeVariants['size'] || 'size-md'
  const size = TAG_SIZES[sizeKey] || TAG_SIZES['size-md']
  return (
    <div style={cssVars as React.CSSProperties}>
      <span
        style={{
          backgroundColor: isSelected
            ? 'var(--preview-container-backgroundColor, #555)'
            : 'transparent',
          color: 'var(--preview-label-color, #ccc)',
          borderRadius: 'var(--preview-container-borderRadius, 12px)',
          padding: size.padding,
          fontFamily: PREVIEW_SANS,
          fontSize: size.fontSize,
          fontWeight: 500,
          border: '1px solid var(--preview-container-borderColor, #555)',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          cursor: activeState === 'disabled' ? 'not-allowed' : 'pointer',
        }}
      >
        Category
        <X size={size.iconSize} style={{ opacity: 0.6 }} />
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

const AVATAR_SIZES: Record<string, { box: string; icon: number; spinner: string }> = {
  'size-sm': { box: '24px', icon: 12, spinner: '10px' },
  'size-md': { box: '32px', icon: 16, spinner: '14px' },
  'size-lg': { box: '40px', icon: 20, spinner: '18px' },
  'size-xl': { box: '56px', icon: 28, spinner: '24px' },
}

function AvatarPreview({ cssVars, activeState, activeVariants }: PreviewProps) {
  const isLoading = activeState === 'loading'
  const sizeKey = activeVariants['size'] || 'size-lg'
  const size = AVATAR_SIZES[sizeKey] || AVATAR_SIZES['size-lg']
  return (
    <div style={cssVars as React.CSSProperties}>
      <div
        style={{
          width: size.box,
          height: size.box,
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
              width: size.spinner,
              height: size.spinner,
              border: '2px solid #888',
              borderTopColor: 'transparent',
              borderRadius: '50%',
              display: 'inline-block',
              animation: 'spin 0.8s linear infinite',
            }}
          />
        ) : (
          <User size={size.icon} style={{ color: 'var(--preview-label-color, #888)' }} />
        )}
      </div>
    </div>
  )
}

function DividerPreview({ cssVars, activeVariants }: PreviewProps) {
  const typeVariant = activeVariants['type'] || null
  const isVertical = typeVariant === 'vertical'
  const hasLabel = typeVariant === 'with-label'

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

const INPUT_SIZES: Record<string, { padding: string; fontSize: string; labelSize: string }> = {
  'size-sm': { padding: '6px 10px', fontSize: '12px', labelSize: '11px' },
  'size-md': { padding: '8px 12px', fontSize: '14px', labelSize: '12px' },
  'size-lg': { padding: '10px 14px', fontSize: '16px', labelSize: '13px' },
}

function SelectPreview({ cssVars, activeState, activeVariants }: PreviewProps) {
  const isOpen = activeState === 'open'
  const isFocus = activeState === 'focus'
  const sizeKey = activeVariants['size'] || 'size-md'
  const size = INPUT_SIZES[sizeKey] || INPUT_SIZES['size-md']
  return (
    <div style={{ ...cssVars as React.CSSProperties, display: 'flex', flexDirection: 'column' as const, gap: '6px' }}>
      <label style={{ fontFamily: PREVIEW_SANS, fontSize: size.labelSize, color: 'var(--preview-label-color, #aaa)' }}>
        Label
      </label>
      <div
        style={{
          backgroundColor: 'var(--preview-container-backgroundColor, #1a0a0a)',
          border: '1px solid var(--preview-container-borderColor, #3d1515)',
          borderRadius: 'var(--preview-container-borderRadius, 6px)',
          padding: size.padding,
          fontFamily: PREVIEW_SANS,
          fontSize: size.fontSize,
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

function InputTextPreview({ cssVars, activeState, activeVariants }: PreviewProps) {
  const isFilled = activeState === 'filled'
  const isFocus = activeState === 'focus'
  const sizeKey = activeVariants['size'] || 'size-md'
  const size = INPUT_SIZES[sizeKey] || INPUT_SIZES['size-md']
  return (
    <div style={{ ...cssVars as React.CSSProperties, display: 'flex', flexDirection: 'column' as const, gap: '6px' }}>
      <label style={{ fontFamily: PREVIEW_SANS, fontSize: size.labelSize, color: 'var(--preview-label-color, #aaa)' }}>
        Label
      </label>
      <div
        style={{
          backgroundColor: 'var(--preview-container-backgroundColor, #1a0a0a)',
          border: '1px solid var(--preview-container-borderColor, #3d1515)',
          borderRadius: 'var(--preview-container-borderRadius, 6px)',
          padding: size.padding,
          fontFamily: PREVIEW_SANS,
          fontSize: size.fontSize,
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
  activeVariants: Record<string, string>
) {
  const props: PreviewProps = { cssVars, activeState, activeVariants }
  switch (component.id) {
    case 'button':
      return <ButtonPreview {...props} />
    case 'button-icon':
      return <IconButtonPreview {...props} />
    case 'badge':
      return <BadgePreview {...props} />
    case 'badge-dot':
      return <BadgeDotPreview {...props} />
    case 'tag':
      return <TagPreview {...props} />
    case 'link':
      return <LinkPreview {...props} />
    case 'avatar':
      return <AvatarPreview {...props} />
    case 'divider':
      return <DividerPreview {...props} />
    case 'input-text':
      return <InputTextPreview {...props} />
    case 'input-select':
      return <SelectPreview {...props} />
    case 'checkbox':
      return <CheckboxPreview {...props} />
    case 'radio':
      return <RadioPreview {...props} />
    case 'card':
      return <CardPreview {...props} />
    default:
      return <GenericPreview component={component} cssVars={cssVars} />
  }
}

export function ComponentPreview({ component, resolvedTokens, activeState, activeVariants }: ComponentPreviewProps) {
  const hasBindings = component.bindings.length > 0

  const cssVars = useMemo(
    () => hasBindings
      ? deriveCssVars(component, resolvedTokens, activeState, activeVariants)
      : autoDeriveCssVars(component, resolvedTokens, activeState, activeVariants),
    [component, resolvedTokens, activeState, activeVariants, hasBindings]
  )

  // Apply CSS filter-based state transforms when no explicit bindings
  const stateStyle = hasBindings ? undefined : STATE_STYLES[activeState]

  return (
    <div className="relative flex items-center justify-center min-h-[120px] p-8 bg-surface-elevated/30 rounded border border-border">
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      <div style={stateStyle} className="transition-all duration-150">
        {renderAtomPreview(component, cssVars, activeState, activeVariants)}
      </div>
      {!hasBindings && (
        <span className="absolute bottom-2 right-3 font-mono text-[10px] text-text-tertiary/60">
          unbound -- add tokens to customize
        </span>
      )}
    </div>
  )
}
