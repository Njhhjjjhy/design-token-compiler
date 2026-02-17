import { useState, useMemo } from 'react'
import { useTokenStore } from '@/store/useTokenStore'
import { resolveTokens } from '@/lib/resolver'
import { BrowserHeader, type BrowserTab } from '@/components/browser/BrowserHeader'
import { ColorGrid } from '@/components/browser/ColorGrid'
import { SpacingScale } from '@/components/browser/SpacingScale'
import { TypographySpecimens } from '@/components/browser/TypographySpecimens'
import { ShadowSamples } from '@/components/browser/ShadowSamples'
import type { ResolvedToken } from '@/types'

export function BrowserView() {
  const activeSet = useTokenStore((s) => s.getActiveTokenSet())
  const [activeTab, setActiveTab] = useState<BrowserTab>('colors')
  const [activeMode, setActiveMode] = useState<string | null>(activeSet?.activeMode || null)

  const resolved = useMemo(() => {
    if (!activeSet) return null
    return resolveTokens(activeSet, activeMode || undefined)
  }, [activeSet, activeMode])

  const grouped = useMemo(() => {
    if (!resolved) return { colors: [], spacing: [], typography: [], shadows: [] }
    const entries = Object.entries(resolved.tokens) as [string, ResolvedToken][]
    return {
      colors: entries.filter(([, t]) => t.type === 'color'),
      spacing: entries.filter(([, t]) => t.type === 'dimension'),
      typography: entries.filter(([, t]) =>
        t.type === 'typography' || t.type === 'fontFamily' || t.type === 'fontWeight'
      ),
      shadows: entries.filter(([, t]) => t.type === 'shadow'),
    }
  }, [resolved])

  const tabCounts: Record<BrowserTab, number> = {
    colors: grouped.colors.length,
    spacing: grouped.spacing.length,
    typography: grouped.typography.length,
    shadows: grouped.shadows.length,
  }

  if (!activeSet) {
    return (
      <div className="p-8">
        <h2 className="section-title text-primary mb-6">TOKEN BROWSER</h2>
        <p className="font-mono text-sm text-text-secondary">
          No token set loaded. Select a token set from the dashboard.
        </p>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      <BrowserHeader
        activeTab={activeTab}
        onTabChange={setActiveTab}
        tabCounts={tabCounts}
        modes={activeSet.modes}
        activeMode={activeMode}
        onModeChange={setActiveMode}
      />
      <div className="flex-1 overflow-auto px-8 py-6">
        {activeTab === 'colors' && <ColorGrid tokens={grouped.colors} />}
        {activeTab === 'spacing' && <SpacingScale tokens={grouped.spacing} />}
        {activeTab === 'typography' && <TypographySpecimens tokens={grouped.typography} />}
        {activeTab === 'shadows' && <ShadowSamples tokens={grouped.shadows} />}
      </div>
    </div>
  )
}
