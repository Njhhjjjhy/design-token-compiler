import type { Component, ResolvedTokenMap } from '@/types'

function tokenPathToKotlin(tokenPath: string): string {
  // 'color.interactive.default' -> 'DesignTokens.Color.interactiveDefault'
  const parts = tokenPath.split('.')
  const category = parts[0].charAt(0).toUpperCase() + parts[0].slice(1)
  const rest = parts
    .slice(1)
    .map((s, i) => i === 0 ? s : s.charAt(0).toUpperCase() + s.slice(1))
    .join('')
  return `DesignTokens.${category}.${rest}`
}

function componentNameToKotlin(id: string): string {
  return id.split('-').map((s) => s.charAt(0).toUpperCase() + s.slice(1)).join('')
}

export function compileAndroidCompose(component: Component, resolvedTokens: ResolvedTokenMap): string {
  const name = componentNameToKotlin(component.id)
  const appearanceVariants = component.variants.filter((v) => v.category === 'appearance')
  const sizeVariants = component.variants.filter((v) => v.category === 'size')
  const hasLabel = component.parts.some((p) => p.id === 'label' || p.id === 'text')

  const variantEnum = appearanceVariants.length > 0
    ? `
enum class ${name}Variant {
    ${appearanceVariants.map((v) => v.id.replace(/-([a-z])/g, (_, c) => c.toUpperCase()).replace(/^./, (c) => c.toUpperCase())).join(',\n    ')}
}
`
    : ''

  const sizeEnum = sizeVariants.length > 0
    ? `
enum class ${name}Size {
    ${sizeVariants.map((v) => v.id.replace('size-', '').replace(/^./, (c) => c.toUpperCase())).join(',\n    ')}
}
`
    : ''

  const baseBindings = component.bindings.filter((b) => b.stateId === 'default' && b.variantId === null)

  const bgBinding = baseBindings.find((b) => b.cssProperty === 'background-color')
  const colorBinding = baseBindings.find((b) => b.cssProperty === 'color')
  const radiusBinding = baseBindings.find((b) => b.cssProperty === 'border-radius')

  const bg = bgBinding ? tokenPathToKotlin(bgBinding.tokenPath) : 'DesignTokens.Color.primary'
  const fg = colorBinding ? tokenPathToKotlin(colorBinding.tokenPath) : 'DesignTokens.Color.onPrimary'
  const radius = radiusBinding ? `DesignTokens.Radius.md` : '8.dp'

  const params = [
    hasLabel ? '    label: String' : null,
    appearanceVariants.length > 0 ? `    variant: ${name}Variant = ${name}Variant.${appearanceVariants[0].id.replace(/-([a-z])/g, (_, c) => c.toUpperCase()).replace(/^./, (c) => c.toUpperCase())}` : null,
    sizeVariants.length > 0 ? `    size: ${name}Size = ${name}Size.${(sizeVariants.find((v) => v.id === 'size-md') || sizeVariants[0]).id.replace('size-', '').replace(/^./, (c) => c.toUpperCase())}` : null,
    '    enabled: Boolean = true',
  ].filter(Boolean)

  return `package com.example.designsystem.components

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import com.example.designsystem.tokens.DesignTokens
${variantEnum}${sizeEnum}
/**
 * ${component.name}
 *
 * ${component.description}
 *
 * Usage: ${component.usageGuidelines}
 */
@Composable
fun ${name}(
${params.join(',\n')},
    modifier: Modifier = Modifier
) {
    Surface(
        modifier = modifier,
        shape = RoundedCornerShape(${radius}),
        color = if (enabled) ${bg} else ${bg}.copy(alpha = 0.4f),
        contentColor = ${fg},
    ) {
        ${hasLabel ? `Text(
            text = label,
            modifier = Modifier.padding(horizontal = 16.dp, vertical = 8.dp),
            style = DesignTokens.Typography.bodyMd
        )` : 'Spacer(modifier = Modifier.size(40.dp))'}
    }
}

@Preview
@Composable
fun ${name}Preview() {
    ${name}(${hasLabel ? `label = "${name} Preview"` : ''})
}
`.trim()
}
