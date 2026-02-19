import { useMemo } from 'react'
import type { Component, TokenBinding, ResolvedTokenMap } from '@/types'

interface ComponentPreviewProps {
  component: Component
  resolvedTokens: ResolvedTokenMap
  activeState: string
  activeVariant: string | null
}

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
    // Convert cssProperty to a CSS var name: 'background-color' -> '--preview-container-backgroundColor'
    const prop = binding.cssProperty.replace(/-([a-z])/g, (_, c) => c.toUpperCase())
    const varName = `--preview-${binding.partId}-${prop}`
    vars[varName] = String(token.resolvedValue)
  }
  return vars
}

// ---- Preview templates ----

function ButtonPreview({ cssVars }: { cssVars: Record<string, string> }) {
  return (
    <div style={cssVars as React.CSSProperties}>
      <button
        style={{
          backgroundColor: 'var(--preview-container-backgroundColor, #f40c3f)',
          color: 'var(--preview-label-color, #fff)',
          borderRadius: 'var(--preview-container-borderRadius, 6px)',
          padding: '8px 16px',
          border: `1px solid var(--preview-container-borderColor, transparent)`,
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
          backgroundColor: 'var(--preview-container-backgroundColor, #f40c3f20)',
          color: 'var(--preview-label-color, #f40c3f)',
          borderRadius: 'var(--preview-container-borderRadius, 4px)',
          padding: '2px 8px',
          fontFamily: 'monospace',
          fontSize: '11px',
          fontWeight: 600,
          letterSpacing: '0.05em',
          textTransform: 'uppercase' as const,
          border: '1px solid var(--preview-container-borderColor, #f40c3f30)',
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
          border: '2px solid var(--preview-indicator-borderColor, #f40c3f)',
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
  const cssVars = useMemo(
    () => deriveCssVars(component, resolvedTokens, activeState, activeVariant),
    [component, resolvedTokens, activeState, activeVariant]
  )

  return (
    <div className="flex items-center justify-center min-h-[120px] p-8 bg-surface-elevated/30 rounded border border-border">
      {renderAtomPreview(component, cssVars, activeVariant)}
    </div>
  )
}
