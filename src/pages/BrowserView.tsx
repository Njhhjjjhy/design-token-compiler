import { useState, useMemo, useCallback } from 'react'
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
  const storeSetActiveMode = useTokenStore((s) => s.setActiveMode)
  const [activeTab, setActiveTab] = useState<BrowserTab>('colors')
  const [searchQuery, setSearchQuery] = useState('')
  const activeMode = activeSet?.activeMode ?? null
  const handleModeChange = useCallback(
    (modeId: string) => {
      if (activeSet) storeSetActiveMode(activeSet.id, modeId)
    },
    [activeSet, storeSetActiveMode]
  )

  const resolved = useMemo(() => {
    if (!activeSet) return null
    return resolveTokens(activeSet, activeMode || undefined)
  }, [activeSet, activeMode])

  const grouped = useMemo(() => {
    if (!resolved) return { colors: [], spacing: [], typography: [], shadows: [] }
    const entries = Object.entries(resolved.tokens) as [string, ResolvedToken][]
    const isFontDimension = (path: string) => path.startsWith('font.')
    return {
      colors: entries.filter(([, t]) => t.type === 'color'),
      spacing: entries.filter(([path, t]) => t.type === 'dimension' && !isFontDimension(path)),
      typography: entries.filter(([path, t]) =>
        t.type === 'typography' || t.type === 'fontFamily' || t.type === 'fontWeight'
        || (t.type === 'dimension' && isFontDimension(path))
      ),
      shadows: entries.filter(([, t]) => t.type === 'shadow'),
    }
  }, [resolved])

  const filtered = useMemo(() => {
    if (!searchQuery) return grouped
    const q = searchQuery.toLowerCase()
    const match = ([path]: [string, ResolvedToken]) => path.toLowerCase().includes(q)
    return {
      colors: grouped.colors.filter(match),
      spacing: grouped.spacing.filter(match),
      typography: grouped.typography.filter(match),
      shadows: grouped.shadows.filter(match),
    }
  }, [grouped, searchQuery])

  const tabCounts: Record<BrowserTab, number> = {
    colors: filtered.colors.length,
    spacing: filtered.spacing.length,
    typography: filtered.typography.length,
    shadows: filtered.shadows.length,
  }

  if (!activeSet) {
    return (
      <div className="p-8">
        <h2 className="section-title text-primary mb-6">TOKEN BROWSER</h2>
        <p className="font-mono text-sm text-text-secondary">
          No token set selected. Go to the Dashboard to create or import one.
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
        onModeChange={handleModeChange}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />
      <div
        className="flex-1 overflow-auto px-8 py-6"
        role="tabpanel"
        id={`browser-tabpanel-${activeTab}`}
        aria-labelledby={`browser-tab-${activeTab}`}
      >
        {activeTab === 'colors' && <ColorGrid tokens={filtered.colors} />}
        {activeTab === 'spacing' && <SpacingScale tokens={filtered.spacing} />}
        {activeTab === 'typography' && <TypographySpecimens tokens={filtered.typography} />}
        {activeTab === 'shadows' && <ShadowSamples tokens={filtered.shadows} />}
      </div>
    </div>
  )
}
