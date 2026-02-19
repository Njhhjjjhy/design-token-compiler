import type { Component, ResolvedTokenMap } from '@/types'

function tokenPathToSwift(tokenPath: string): string {
  // 'color.interactive.default' -> 'DesignTokens.Color.interactiveDefault'
  const parts = tokenPath.split('.')
  const category = parts[0].charAt(0).toUpperCase() + parts[0].slice(1)
  const rest = parts
    .slice(1)
    .map((s, i) => i === 0 ? s : s.charAt(0).toUpperCase() + s.slice(1))
    .join('')
  return `DesignTokens.${category}.${rest}`
}

function componentNameToSwift(id: string): string {
  return id.split('-').map((s) => s.charAt(0).toUpperCase() + s.slice(1)).join('')
}

export function compileIosSwift(component: Component, resolvedTokens: ResolvedTokenMap): string {
  const name = componentNameToSwift(component.id)
  const appearanceVariants = component.variants.filter((v) => v.category === 'appearance')
  const sizeVariants = component.variants.filter((v) => v.category === 'size')
  const hasLabel = component.parts.some((p) => p.id === 'label' || p.id === 'text')
  const hasChildren = hasLabel

  const variantEnum = appearanceVariants.length > 0
    ? `
    enum Variant {
        ${appearanceVariants.map((v) => `case ${v.id.replace(/-([a-z])/g, (_, c) => c.toUpperCase())}`).join('\n        ')}
    }
`
    : ''

  const sizeEnum = sizeVariants.length > 0
    ? `
    enum Size {
        ${sizeVariants.map((v) => `case ${v.id.replace('size-', '')}`).join('\n        ')}
    }
`
    : ''

  const baseBindings = component.bindings.filter((b) => b.stateId === 'default' && b.variantId === null)
  const modifiers = baseBindings.map((b) => {
    const token = resolvedTokens[b.tokenPath]
    const swiftToken = tokenPathToSwift(b.tokenPath)
    const comment = token ? ` // ${String(token.resolvedValue).substring(0, 20)}` : ''
    if (b.cssProperty === 'background-color') return `            .background(${swiftToken})${comment}`
    if (b.cssProperty === 'color') return `            .foregroundColor(${swiftToken})${comment}`
    if (b.cssProperty === 'border-radius') return `            .cornerRadius(${swiftToken})${comment}`
    if (b.cssProperty === 'font-size') return `            .font(.system(size: ${swiftToken}))${comment}`
    return `            // ${b.cssProperty}: ${swiftToken}${comment}`
  })

  return `import SwiftUI

/// ${component.name}
/// ${component.description}
///
/// Usage guidelines: ${component.usageGuidelines}
struct ${name}: View {
    ${appearanceVariants.length > 0 ? `var variant: Variant = .${appearanceVariants[0].id.replace(/-([a-z])/g, (_, c) => c.toUpperCase())}` : ''}
    ${sizeVariants.length > 0 ? `var size: Size = .${sizeVariants.find((v) => v.id === 'size-md')?.id.replace('size-', '') || 'md'}` : ''}
    ${hasChildren ? 'var label: String' : ''}
    var isDisabled: Bool = false
    ${variantEnum}${sizeEnum}
    var body: some View {
        ${hasLabel ? `Text(label)` : 'Rectangle()'}
${modifiers.join('\n')}
            .opacity(isDisabled ? 0.4 : 1.0)
    }
}

#Preview {
    VStack(spacing: 16) {
        ${name}(${hasChildren ? `label: "${name} Preview"` : ''})
    }
    .padding()
    .background(Color.black)
}
`.trim()
}
