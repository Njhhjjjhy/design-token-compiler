# Browser, Dashboard & Versioning Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Create a feature branch `feat/browser-dashboard-versioning` before starting. Each task ends with a commit.

**Goal:** Build a dashboard landing page, visual token browser (colors, spacing, typography, shadows), and manual version snapshots with restore.

**Architecture:** Dashboard is the new default view showing token set cards with quick actions. Browser resolves tokens via the existing resolver and renders type-specific visualizations. Versioning stores deep-cloned token snapshots in Zustand with localStorage persistence.

**Tech Stack:** React 18, TypeScript, Zustand, Tailwind CSS, Lucide React, date-fns (already installed)

**Design doc:** `docs/plans/2026-02-16-browser-dashboard-versioning-design.md`

---

## Phase A: Dashboard

### Task 1: Add 'dashboard' to ViewMode type

**Files:**
- Modify: `src/types/index.ts`

**Step 1:** In `src/types/index.ts`, change line 221 from:

```typescript
export type ViewMode = 'editor' | 'browser' | 'compiler' | 'sync'
```

to:

```typescript
export type ViewMode = 'dashboard' | 'editor' | 'browser' | 'compiler' | 'sync'
```

**Step 2:** Verify: `npm run build`
Expected: Build succeeds (no code references `ViewMode` exhaustively yet).

**Step 3:** Commit:

```bash
git add src/types/index.ts
git commit -m "feat: add dashboard to ViewMode type"
```

---

### Task 2: Update Header navigation

**Files:**
- Modify: `src/components/Header.tsx`

**Step 1:** Change the `NavItem` type (line 3) from:

```typescript
type NavItem = 'editor' | 'browser' | 'compiler' | 'sync'
```

to:

```typescript
type NavItem = 'dashboard' | 'editor' | 'browser' | 'compiler' | 'sync'
```

**Step 2:** Update the `navItems` array (line 16) to add Dashboard as the first item:

```typescript
const navItems: { id: NavItem; label: string }[] = [
  { id: 'dashboard', label: 'HOME' },
  { id: 'editor', label: 'EDITOR' },
  { id: 'browser', label: 'BROWSER' },
  { id: 'compiler', label: 'COMPILER' },
  { id: 'sync', label: 'SYNC' },
]
```

**Step 3:** Verify: `npm run build`

**Step 4:** Commit:

```bash
git add src/components/Header.tsx
git commit -m "feat: add HOME nav item to Header"
```

---

### Task 3: Create DashboardView placeholder and wire into App

**Files:**
- Create: `src/pages/DashboardView.tsx`
- Modify: `src/App.tsx`
- Modify: `src/store/useTokenStore.ts`

**Step 1:** Create `src/pages/DashboardView.tsx`:

```typescript
export function DashboardView() {
  return (
    <div className="p-8">
      <h2 className="section-title text-primary mb-6">DASHBOARD</h2>
      <p className="font-mono text-sm text-text-secondary">
        Dashboard placeholder — will be built in the next task.
      </p>
    </div>
  )
}
```

**Step 2:** In `src/App.tsx`, add the import at the top:

```typescript
import { DashboardView } from './pages/DashboardView'
```

Add the case in `renderView()` switch (before `case 'editor'`):

```typescript
case 'dashboard':
  return <DashboardView />
```

Change the default case from `<EditorView />` to `<DashboardView />`.

**Step 3:** In `src/store/useTokenStore.ts`, change line 58 from:

```typescript
activeView: 'editor',
```

to:

```typescript
activeView: 'dashboard',
```

**Step 4:** Verify: `npm run build`
Expected: App starts with Dashboard placeholder. HOME nav item is active.

**Step 5:** Commit:

```bash
git add src/pages/DashboardView.tsx src/App.tsx src/store/useTokenStore.ts
git commit -m "feat: wire DashboardView as default landing page"
```

---

### Task 4: TokenSetCard component

**Files:**
- Create: `src/components/dashboard/TokenSetCard.tsx`

**Step 1:** Create `src/components/dashboard/TokenSetCard.tsx`:

```typescript
import { Pencil, Eye, Download, Clock } from 'lucide-react'
import { format } from 'date-fns'
import type { TokenSet, Token, TokenGroup } from '@/types'

interface TokenSetCardProps {
  tokenSet: TokenSet
  versionCount: number
  onEdit: () => void
  onBrowse: () => void
  onExport: () => void
  onVersions: () => void
}

function countTokensByType(tokens: Record<string, Token | TokenGroup>): Record<string, number> {
  const counts: Record<string, number> = {}
  function traverse(node: Record<string, Token | TokenGroup>) {
    for (const value of Object.values(node)) {
      if ('tokens' in value) {
        traverse(value.tokens)
      } else {
        counts[value.type] = (counts[value.type] || 0) + 1
      }
    }
  }
  traverse(tokens)
  return counts
}

function extractColorPreviews(tokens: Record<string, Token | TokenGroup>, max = 8): string[] {
  const colors: string[] = []
  function traverse(node: Record<string, Token | TokenGroup>) {
    if (colors.length >= max) return
    for (const value of Object.values(node)) {
      if (colors.length >= max) return
      if ('tokens' in value) {
        traverse(value.tokens)
      } else if (value.type === 'color' && typeof value.value === 'string' && value.value.startsWith('#')) {
        colors.push(value.value)
      }
    }
  }
  traverse(tokens)
  return colors
}

export function TokenSetCard({
  tokenSet,
  versionCount,
  onEdit,
  onBrowse,
  onExport,
  onVersions,
}: TokenSetCardProps) {
  const typeCounts = countTokensByType(tokenSet.tokens)
  const colorPreviews = extractColorPreviews(tokenSet.tokens)
  const totalTokens = Object.values(typeCounts).reduce((sum, count) => sum + count, 0)

  const typeLabels: [string, string][] = [
    ['color', 'colors'],
    ['dimension', 'spacing'],
    ['typography', 'typography'],
    ['shadow', 'shadows'],
    ['fontFamily', 'fonts'],
    ['fontWeight', 'weights'],
    ['number', 'numbers'],
    ['duration', 'durations'],
    ['border', 'borders'],
  ]

  const activeCounts = typeLabels
    .filter(([type]) => typeCounts[type])
    .map(([type, label]) => `${typeCounts[type]} ${label}`)

  return (
    <div className="border border-border bg-surface hover:border-primary/40 transition-colors">
      {colorPreviews.length > 0 && (
        <div className="flex h-2">
          {colorPreviews.map((color, i) => (
            <div key={i} className="flex-1" style={{ backgroundColor: color }} />
          ))}
        </div>
      )}

      <div className="p-5">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h3 className="font-mono text-sm text-white font-medium">{tokenSet.name}</h3>
            <p className="font-mono text-xs text-text-tertiary mt-1">{totalTokens} tokens</p>
          </div>
          {tokenSet.activeMode && (
            <span className="px-2 py-0.5 bg-surface-elevated border border-border font-mono text-xs text-text-secondary">
              {tokenSet.activeMode.toUpperCase()}
            </span>
          )}
        </div>

        <p className="font-mono text-xs text-text-secondary mb-4">
          {activeCounts.join(' · ') || 'Empty set'}
        </p>

        <div className="flex items-center justify-between pt-3 border-t border-border-subtle">
          <span className="font-mono text-xs text-text-tertiary">
            {format(tokenSet.metadata.updatedAt, 'MMM d, yyyy')}
          </span>
          <div className="flex gap-1">
            <button onClick={onEdit} className="p-1.5 text-text-tertiary hover:text-white hover:bg-white/5 transition-colors" title="Edit tokens">
              <Pencil className="w-3.5 h-3.5" />
            </button>
            <button onClick={onBrowse} className="p-1.5 text-text-tertiary hover:text-white hover:bg-white/5 transition-colors" title="Browse tokens">
              <Eye className="w-3.5 h-3.5" />
            </button>
            <button onClick={onExport} className="p-1.5 text-text-tertiary hover:text-white hover:bg-white/5 transition-colors" title="Export tokens">
              <Download className="w-3.5 h-3.5" />
            </button>
            {versionCount > 0 && (
              <button onClick={onVersions} className="p-1.5 text-text-tertiary hover:text-white hover:bg-white/5 transition-colors flex items-center gap-1" title="Version history">
                <Clock className="w-3.5 h-3.5" />
                <span className="font-mono text-xs">{versionCount}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
```

**Step 2:** Verify: `npm run build`

**Step 3:** Commit:

```bash
git add src/components/dashboard/TokenSetCard.tsx
git commit -m "feat: add TokenSetCard component for dashboard"
```

---

### Task 5: DashboardView full implementation

**Files:**
- Modify: `src/pages/DashboardView.tsx`

**Step 1:** Replace the full content of `src/pages/DashboardView.tsx`:

```typescript
import { Plus, Upload } from 'lucide-react'
import { nanoid } from 'nanoid'
import { useTokenStore } from '@/store/useTokenStore'
import { TokenSetCard } from '@/components/dashboard/TokenSetCard'
import type { TokenSet, ViewMode } from '@/types'
import { useCallback, useRef } from 'react'

export function DashboardView() {
  const tokenSets = useTokenStore((s) => s.tokenSets)
  const addTokenSet = useTokenStore((s) => s.addTokenSet)
  const setActiveSet = useTokenStore((s) => s.setActiveSet)
  const setActiveView = useTokenStore((s) => s.setActiveView)
  const versions = useTokenStore((s) => s.versions)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const sets = Object.values(tokenSets)

  const navigateTo = useCallback((setId: string, view: ViewMode) => {
    setActiveSet(setId)
    setActiveView(view)
  }, [setActiveSet, setActiveView])

  const handleNewSet = useCallback(() => {
    const newSet: TokenSet = {
      id: nanoid(),
      name: 'Untitled Token Set',
      tokens: {},
      modes: {},
      activeMode: null,
      metadata: {
        createdAt: Date.now(),
        updatedAt: Date.now(),
        version: '1.0.0',
      },
    }
    addTokenSet(newSet)
    setActiveView('editor')
  }, [addTokenSet, setActiveView])

  const handleImportFile = useCallback(() => {
    fileInputRef.current?.click()
  }, [])

  const handleFileSelected = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (ev) => {
      const content = ev.target?.result as string
      if (!content) return

      const newSet: TokenSet = {
        id: nanoid(),
        name: file.name.replace(/\.[^.]+$/, ''),
        tokens: {},
        modes: {},
        activeMode: null,
        metadata: {
          createdAt: Date.now(),
          updatedAt: Date.now(),
          version: '1.0.0',
        },
      }
      addTokenSet(newSet)
      setActiveView('sync')
    }
    reader.readAsText(file)
    e.target.value = ''
  }, [addTokenSet, setActiveView])

  if (sets.length === 0) {
    return (
      <div className="p-8">
        <h2 className="section-title text-primary mb-8">DASHBOARD</h2>
        <div className="flex flex-col items-center justify-center py-24">
          <h3 className="font-mono text-lg text-white mb-3">Create Your First Token Set</h3>
          <p className="font-mono text-sm text-text-secondary mb-8 max-w-md text-center">
            A token set is a collection of design tokens — colors, spacing, typography, and more — that define your design system.
          </p>
          <div className="flex gap-4">
            <button onClick={handleNewSet} className="flex items-center gap-2 px-6 py-3 bg-primary hover:bg-primary/90 text-white font-mono text-sm transition-colors">
              <Plus className="w-4 h-4" />
              New Token Set
            </button>
            <button onClick={handleImportFile} className="flex items-center gap-2 px-6 py-3 bg-surface-elevated border border-border hover:border-primary text-white font-mono text-sm transition-colors">
              <Upload className="w-4 h-4" />
              Import File
            </button>
          </div>
        </div>
        <input ref={fileInputRef} type="file" accept=".json,.css,.scss" onChange={handleFileSelected} className="hidden" />
      </div>
    )
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <h2 className="section-title text-primary">DASHBOARD</h2>
        <div className="flex gap-3">
          <button onClick={handleNewSet} className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 text-white font-mono text-xs transition-colors">
            <Plus className="w-4 h-4" />
            NEW SET
          </button>
          <button onClick={handleImportFile} className="flex items-center gap-2 px-4 py-2 bg-surface-elevated border border-border hover:border-primary text-white font-mono text-xs transition-colors">
            <Upload className="w-4 h-4" />
            IMPORT
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sets.map((tokenSet) => (
          <TokenSetCard
            key={tokenSet.id}
            tokenSet={tokenSet}
            versionCount={versions?.[tokenSet.id]?.length || 0}
            onEdit={() => navigateTo(tokenSet.id, 'editor')}
            onBrowse={() => navigateTo(tokenSet.id, 'browser')}
            onExport={() => navigateTo(tokenSet.id, 'compiler')}
            onVersions={() => navigateTo(tokenSet.id, 'editor')}
          />
        ))}
      </div>

      <input ref={fileInputRef} type="file" accept=".json,.css,.scss" onChange={handleFileSelected} className="hidden" />
    </div>
  )
}
```

**Step 2:** Verify: `npm run build`

**Step 3:** Commit:

```bash
git add src/pages/DashboardView.tsx
git commit -m "feat: implement DashboardView with token set grid and actions"
```

---

### Task 6: Dashboard build verification

**Step 1:** Run: `npm run build`
Expected: Build succeeds. Dashboard shows as landing page with token set cards.

**Step 2:** If build fails, fix TypeScript errors and commit:

```bash
git add -A
git commit -m "fix: resolve Dashboard build errors"
```

---

## Phase B: Token Browser

### Task 7: BrowserHeader component

**Files:**
- Create: `src/components/browser/BrowserHeader.tsx`

**Step 1:** Create `src/components/browser/BrowserHeader.tsx`:

```typescript
import type { ModeMap } from '@/types'

export type BrowserTab = 'colors' | 'spacing' | 'typography' | 'shadows'

interface BrowserHeaderProps {
  activeTab: BrowserTab
  onTabChange: (tab: BrowserTab) => void
  tabCounts: Record<BrowserTab, number>
  modes: ModeMap
  activeMode: string | null
  onModeChange: (modeId: string) => void
}

export function BrowserHeader({
  activeTab,
  onTabChange,
  tabCounts,
  modes,
  activeMode,
  onModeChange,
}: BrowserHeaderProps) {
  const tabs: { id: BrowserTab; label: string }[] = [
    { id: 'colors', label: 'COLORS' },
    { id: 'spacing', label: 'SPACING' },
    { id: 'typography', label: 'TYPOGRAPHY' },
    { id: 'shadows', label: 'SHADOWS' },
  ]

  const modeEntries = Object.values(modes)
  const hasModes = modeEntries.length > 0

  return (
    <div className="px-8 pt-8 pb-0">
      <div className="flex items-center justify-between mb-6">
        <h2 className="section-title text-primary">TOKEN BROWSER</h2>
        {hasModes && (
          <div className="flex border border-border">
            {modeEntries.map((mode) => (
              <button
                key={mode.id}
                onClick={() => onModeChange(mode.id)}
                className={`px-3 py-1 font-mono text-xs transition-colors ${
                  activeMode === mode.id ? 'bg-surface-elevated text-white' : 'text-text-secondary hover:text-white'
                } ${mode.id !== modeEntries[0].id ? 'border-l border-border' : ''}`}
              >
                {mode.name.toUpperCase()}
              </button>
            ))}
          </div>
        )}
      </div>
      <div className="flex border-b border-border">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`relative px-5 py-3 font-mono text-xs tracking-wider transition-colors ${
              activeTab === tab.id ? 'text-white' : 'text-text-secondary hover:text-white'
            }`}
          >
            {tab.label}
            <span className="text-text-tertiary ml-1.5">({tabCounts[tab.id]})</span>
            {activeTab === tab.id && (
              <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-primary" />
            )}
          </button>
        ))}
      </div>
    </div>
  )
}
```

**Step 2:** Verify: `npm run build`

**Step 3:** Commit:

```bash
git add src/components/browser/BrowserHeader.tsx
git commit -m "feat: add BrowserHeader with tabs and mode switcher"
```

---

### Task 8: ColorGrid component

**Files:**
- Create: `src/components/browser/ColorGrid.tsx`

**Step 1:** Create `src/components/browser/ColorGrid.tsx`:

```typescript
import type { ResolvedToken } from '@/types'

interface ColorGridProps {
  tokens: [string, ResolvedToken][]
}

function getLuminance(hex: string): number {
  const rgb = hexToRgb(hex)
  if (!rgb) return 0
  const [r, g, b] = [rgb.r, rgb.g, rgb.b].map((c) => {
    const s = c / 255
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4)
  })
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

function getContrastRatio(hex1: string, hex2: string): number {
  const l1 = getLuminance(hex1)
  const l2 = getLuminance(hex2)
  const lighter = Math.max(l1, l2)
  const darker = Math.min(l1, l2)
  return (lighter + 0.05) / (darker + 0.05)
}

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const clean = hex.replace('#', '')
  if (clean.length < 6) return null
  const r = parseInt(clean.substring(0, 2), 16)
  const g = parseInt(clean.substring(2, 4), 16)
  const b = parseInt(clean.substring(4, 6), 16)
  if (isNaN(r) || isNaN(g) || isNaN(b)) return null
  return { r, g, b }
}

function groupByCategory(tokens: [string, ResolvedToken][]): Map<string, [string, ResolvedToken][]> {
  const groups = new Map<string, [string, ResolvedToken][]>()
  for (const entry of tokens) {
    const parts = entry[0].split('.')
    const category = parts.length > 1 ? parts[1] : parts[0]
    const existing = groups.get(category) || []
    existing.push(entry)
    groups.set(category, existing)
  }
  return groups
}

export function ColorGrid({ tokens }: ColorGridProps) {
  if (tokens.length === 0) {
    return (
      <div className="flex items-center justify-center py-24">
        <p className="font-mono text-sm text-text-secondary">No color tokens found.</p>
      </div>
    )
  }

  const groups = groupByCategory(tokens)

  return (
    <div className="space-y-8">
      {Array.from(groups.entries()).map(([category, categoryTokens]) => (
        <div key={category}>
          <h3 className="font-mono text-xs text-primary uppercase tracking-wider mb-4">
            {category}
            <span className="text-text-tertiary ml-2">({categoryTokens.length})</span>
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {categoryTokens.map(([path, token]) => {
              const value = String(token.resolvedValue)
              const isValidHex = /^#[0-9a-fA-F]{3,8}$/.test(value)
              const contrastWhite = isValidHex ? getContrastRatio(value, '#ffffff') : 0
              const contrastBlack = isValidHex ? getContrastRatio(value, '#000000') : 0
              const shortPath = path.split('.').slice(-2).join('.')

              return (
                <div key={path} className="border border-border-subtle">
                  <div className="h-20 border-b border-border-subtle" style={{ backgroundColor: isValidHex ? value : '#000' }} />
                  <div className="p-2.5">
                    <p className="font-mono text-xs text-white truncate" title={path}>{shortPath}</p>
                    <p className="font-mono text-xs text-text-secondary mt-0.5">{value}</p>
                    {isValidHex && (
                      <div className="flex gap-2 mt-1.5">
                        <span className={`font-mono text-xs ${contrastWhite >= 4.5 ? 'text-success' : contrastWhite >= 3 ? 'text-warning' : 'text-error'}`}>
                          W {contrastWhite.toFixed(1)}
                        </span>
                        <span className={`font-mono text-xs ${contrastBlack >= 4.5 ? 'text-success' : contrastBlack >= 3 ? 'text-warning' : 'text-error'}`}>
                          B {contrastBlack.toFixed(1)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
```

**Step 2:** Verify: `npm run build`

**Step 3:** Commit:

```bash
git add src/components/browser/ColorGrid.tsx
git commit -m "feat: add ColorGrid component with contrast ratios"
```

---

### Task 9: SpacingScale component

**Files:**
- Create: `src/components/browser/SpacingScale.tsx`

**Step 1:** Create `src/components/browser/SpacingScale.tsx`:

```typescript
import type { ResolvedToken } from '@/types'

interface SpacingScaleProps {
  tokens: [string, ResolvedToken][]
}

function parseToPixels(value: string): number {
  const str = String(value).trim()
  const match = str.match(/^(-?\d+\.?\d*)(px|rem|em|pt)?$/)
  if (!match) return 0
  const num = parseFloat(match[1])
  const unit = match[2] || 'px'
  switch (unit) {
    case 'rem':
    case 'em':
      return num * 16
    case 'pt':
      return num * 1.333
    default:
      return num
  }
}

export function SpacingScale({ tokens }: SpacingScaleProps) {
  if (tokens.length === 0) {
    return (
      <div className="flex items-center justify-center py-24">
        <p className="font-mono text-sm text-text-secondary">No spacing tokens found.</p>
      </div>
    )
  }

  const sorted = [...tokens].sort((a, b) => {
    return parseToPixels(String(a[1].resolvedValue)) - parseToPixels(String(b[1].resolvedValue))
  })

  const maxPx = Math.max(...sorted.map(([, t]) => parseToPixels(String(t.resolvedValue))), 1)

  return (
    <div className="space-y-1">
      {sorted.map(([path, token]) => {
        const value = String(token.resolvedValue)
        const px = parseToPixels(value)
        const widthPercent = Math.max((px / maxPx) * 100, 1)
        const shortPath = path.split('.').slice(-2).join('.')

        return (
          <div key={path} className="flex items-center gap-4 py-2 px-4 border-b border-border-subtle">
            <span className="font-mono text-xs text-text-secondary min-w-[160px] truncate" title={path}>{shortPath}</span>
            <div className="flex-1">
              <div className="h-4 bg-primary/30 border border-primary/50 rounded-sm" style={{ width: `${widthPercent}%` }} />
            </div>
            <span className="font-mono text-xs text-white min-w-[60px] text-right">{value}</span>
            {!value.endsWith('px') && (
              <span className="font-mono text-xs text-text-tertiary min-w-[50px] text-right">{px}px</span>
            )}
          </div>
        )
      })}
    </div>
  )
}
```

**Step 2:** Verify: `npm run build`

**Step 3:** Commit:

```bash
git add src/components/browser/SpacingScale.tsx
git commit -m "feat: add SpacingScale bar visualization component"
```

---

### Task 10: TypographySpecimens component

**Files:**
- Create: `src/components/browser/TypographySpecimens.tsx`

**Step 1:** Create `src/components/browser/TypographySpecimens.tsx`:

```typescript
import type { ResolvedToken } from '@/types'

interface TypographySpecimensProps {
  tokens: [string, ResolvedToken][]
}

function parseTypographyValue(value: unknown): React.CSSProperties {
  if (typeof value === 'object' && value !== null) {
    const obj = value as Record<string, unknown>
    return {
      fontFamily: obj.fontFamily as string | undefined,
      fontSize: obj.fontSize as string | undefined,
      fontWeight: obj.fontWeight as string | number | undefined,
      lineHeight: obj.lineHeight as string | number | undefined,
      letterSpacing: obj.letterSpacing as string | undefined,
    }
  }
  const str = String(value)
  if (!str.match(/\d/) && str.length > 0) {
    return { fontFamily: str }
  }
  return { fontFamily: str }
}

export function TypographySpecimens({ tokens }: TypographySpecimensProps) {
  if (tokens.length === 0) {
    return (
      <div className="flex items-center justify-center py-24">
        <p className="font-mono text-sm text-text-secondary">No typography tokens found.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {tokens.map(([path, token]) => {
        const styles = parseTypographyValue(token.resolvedValue)
        const shortPath = path.split('.').slice(-2).join('.')
        const rawValue = typeof token.resolvedValue === 'object'
          ? JSON.stringify(token.resolvedValue, null, 2)
          : String(token.resolvedValue)

        const properties: string[] = []
        if (styles.fontFamily) properties.push(`family: ${styles.fontFamily}`)
        if (styles.fontSize) properties.push(`size: ${styles.fontSize}`)
        if (styles.fontWeight) properties.push(`weight: ${styles.fontWeight}`)
        if (styles.lineHeight) properties.push(`line-height: ${styles.lineHeight}`)
        if (styles.letterSpacing) properties.push(`tracking: ${styles.letterSpacing}`)

        return (
          <div key={path} className="border border-border-subtle p-5">
            <p className="font-mono text-xs text-text-secondary mb-3" title={path}>{shortPath}</p>
            <p className="text-white mb-3 break-words" style={styles}>
              The quick brown fox jumps over the lazy dog
            </p>
            <div className="flex flex-wrap gap-x-4 gap-y-1">
              {properties.length > 0 ? (
                properties.map((prop) => (
                  <span key={prop} className="font-mono text-xs text-text-tertiary">{prop}</span>
                ))
              ) : (
                <span className="font-mono text-xs text-text-tertiary">{rawValue}</span>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
```

**Step 2:** Verify: `npm run build`

**Step 3:** Commit:

```bash
git add src/components/browser/TypographySpecimens.tsx
git commit -m "feat: add TypographySpecimens live preview component"
```

---

### Task 11: ShadowSamples component

**Files:**
- Create: `src/components/browser/ShadowSamples.tsx`

**Step 1:** Create `src/components/browser/ShadowSamples.tsx`:

```typescript
import type { ResolvedToken } from '@/types'

interface ShadowSamplesProps {
  tokens: [string, ResolvedToken][]
}

export function ShadowSamples({ tokens }: ShadowSamplesProps) {
  if (tokens.length === 0) {
    return (
      <div className="flex items-center justify-center py-24">
        <p className="font-mono text-sm text-text-secondary">No shadow tokens found.</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {tokens.map(([path, token]) => {
        const value = String(token.resolvedValue)
        const shortPath = path.split('.').slice(-2).join('.')

        return (
          <div key={path} className="border border-border-subtle p-5">
            <p className="font-mono text-xs text-text-secondary mb-4" title={path}>{shortPath}</p>
            <div className="flex items-center justify-center py-8">
              <div className="w-24 h-24 bg-surface-elevated rounded" style={{ boxShadow: value }} />
            </div>
            <p className="font-mono text-xs text-text-tertiary mt-4 break-all">{value}</p>
          </div>
        )
      })}
    </div>
  )
}
```

**Step 2:** Verify: `npm run build`

**Step 3:** Commit:

```bash
git add src/components/browser/ShadowSamples.tsx
git commit -m "feat: add ShadowSamples visual preview component"
```

---

### Task 12: BrowserView full implementation

**Files:**
- Modify: `src/pages/BrowserView.tsx`

**Step 1:** Replace the full content of `src/pages/BrowserView.tsx`:

```typescript
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
```

**Step 2:** Verify: `npm run build`

**Step 3:** Commit:

```bash
git add src/pages/BrowserView.tsx
git commit -m "feat: implement BrowserView with color, spacing, typography, and shadow panels"
```

---

### Task 13: Browser build verification

**Step 1:** Run: `npm run build`
Expected: Build succeeds. Browser shows color grid, spacing bars, typography samples, and shadow previews.

**Step 2:** If build fails, fix TypeScript errors and commit:

```bash
git add -A
git commit -m "fix: resolve Browser build errors"
```

---

## Phase C: Versioning

### Task 14: Update Version type

**Files:**
- Modify: `src/types/index.ts`

**Step 1:** Replace the `Version` and `VersionHistory` interfaces (lines 175-187) with:

```typescript
export interface Version {
  id: string
  name: string
  timestamp: number
  tokenSnapshot: Record<string, Token | TokenGroup>
  tokenCount: number
}
```

Remove the `VersionHistory` interface entirely.

**Step 2:** Also remove `versionHistory` from the `AppState` interface (line 196). Change:

```typescript
export interface AppState {
  tokenSets: Record<string, TokenSet>
  activeSetId: string | null
  versionHistory: Record<string, VersionHistory> // setId -> history
  syncResults: Record<string, SyncResult> // setId -> last sync
}
```

to:

```typescript
export interface AppState {
  tokenSets: Record<string, TokenSet>
  activeSetId: string | null
  syncResults: Record<string, SyncResult> // setId -> last sync
}
```

**Step 3:** Verify: `npm run build`

**Step 4:** Commit:

```bash
git add src/types/index.ts
git commit -m "refactor: simplify Version type for snapshot storage"
```

---

### Task 15: Add version state and actions to store

**Files:**
- Modify: `src/store/useTokenStore.ts`

**Step 1:** Add `Version` to the import from types:

```typescript
import type { AppState, Token, TokenGroup, TokenSet, TokenValue, Version, ViewMode } from '@/types'
```

**Step 2:** Add to the `TokenStoreState` interface (after the sync actions):

```typescript
// Version state
versions: Record<string, Version[]>

// Version actions
saveVersion: (name?: string) => void
restoreVersion: (setId: string, versionId: string) => void
deleteVersion: (setId: string, versionId: string) => void
getVersionsForActiveSet: () => Version[]
```

**Step 3:** Add `countTokensInTree` helper function above the store definition (near the other tree helpers):

```typescript
function countTokensInTree(tokens: Record<string, Token | TokenGroup>): number {
  let count = 0
  for (const value of Object.values(tokens)) {
    if ('tokens' in value) {
      count += countTokensInTree(value.tokens)
    } else {
      count++
    }
  }
  return count
}
```

**Step 4:** Add initial state (after `syncFilter: 'all'`):

```typescript
versions: {},
```

**Step 5:** Remove the existing `versionHistory: {},` line from the initial state if it exists.

**Step 6:** Add the action implementations (after `getTotalConflicts`):

```typescript
saveVersion: (name) => {
  const state = get()
  const activeSet = state.activeSetId ? state.tokenSets[state.activeSetId] : null
  if (!activeSet) return

  const setVersions = state.versions[activeSet.id] || []
  const versionNumber = setVersions.length + 1

  const version: Version = {
    id: `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
    name: name || `v${versionNumber} — ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`,
    timestamp: Date.now(),
    tokenSnapshot: JSON.parse(JSON.stringify(activeSet.tokens)),
    tokenCount: countTokensInTree(activeSet.tokens),
  }

  const updated = [...setVersions, version]
  if (updated.length > 50) {
    updated.splice(0, updated.length - 50)
  }

  set({
    versions: {
      ...state.versions,
      [activeSet.id]: updated,
    },
  })
},

restoreVersion: (setId, versionId) => {
  const state = get()
  const tokenSet = state.tokenSets[setId]
  const setVersions = state.versions[setId] || []
  const version = setVersions.find((v) => v.id === versionId)

  if (!tokenSet || !version) return

  const currentVersions = state.versions[setId] || []
  const autoSave: Version = {
    id: `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
    name: `Before restore — ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`,
    timestamp: Date.now(),
    tokenSnapshot: JSON.parse(JSON.stringify(tokenSet.tokens)),
    tokenCount: countTokensInTree(tokenSet.tokens),
  }

  set({
    tokenSets: {
      ...state.tokenSets,
      [setId]: {
        ...tokenSet,
        tokens: JSON.parse(JSON.stringify(version.tokenSnapshot)),
        metadata: { ...tokenSet.metadata, updatedAt: Date.now() },
      },
    },
    versions: {
      ...state.versions,
      [setId]: [...currentVersions, autoSave],
    },
  })
},

deleteVersion: (setId, versionId) => {
  const state = get()
  const setVersions = state.versions[setId] || []
  set({
    versions: {
      ...state.versions,
      [setId]: setVersions.filter((v) => v.id !== versionId),
    },
  })
},

getVersionsForActiveSet: () => {
  const state = get()
  if (!state.activeSetId) return []
  return state.versions[state.activeSetId] || []
},
```

**Step 7:** Verify: `npm run build`

**Step 8:** Commit:

```bash
git add src/store/useTokenStore.ts
git commit -m "feat: add version management state and actions to store"
```

---

### Task 16: VersionEntry component

**Files:**
- Create: `src/components/versioning/VersionEntry.tsx`

**Step 1:** Create `src/components/versioning/VersionEntry.tsx`:

```typescript
import { RotateCcw, Trash2 } from 'lucide-react'
import { format } from 'date-fns'
import type { Version } from '@/types'

interface VersionEntryProps {
  version: Version
  onRestore: () => void
  onDelete: () => void
}

export function VersionEntry({ version, onRestore, onDelete }: VersionEntryProps) {
  return (
    <div className="flex items-center gap-3 px-4 py-3 border-b border-border-subtle hover:bg-white/[0.02] transition-colors">
      <div className="w-2 h-2 rounded-full bg-primary/60 flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="font-mono text-xs text-white truncate">{version.name}</p>
        <p className="font-mono text-xs text-text-tertiary mt-0.5">
          {format(version.timestamp, 'MMM d, yyyy · h:mm a')}
          <span className="ml-2">{version.tokenCount} tokens</span>
        </p>
      </div>
      <div className="flex gap-1 flex-shrink-0">
        <button onClick={onRestore} className="p-1.5 text-text-tertiary hover:text-success hover:bg-success/10 transition-colors rounded" title="Restore this version">
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
        <button onClick={onDelete} className="p-1.5 text-text-tertiary hover:text-error hover:bg-error/10 transition-colors rounded" title="Delete this version">
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  )
}
```

**Step 2:** Verify: `npm run build`

**Step 3:** Commit:

```bash
git add src/components/versioning/VersionEntry.tsx
git commit -m "feat: add VersionEntry timeline row component"
```

---

### Task 17: VersionPanel component

**Files:**
- Create: `src/components/versioning/VersionPanel.tsx`

**Step 1:** Create `src/components/versioning/VersionPanel.tsx`:

```typescript
import { useState } from 'react'
import { X, Save } from 'lucide-react'
import { useTokenStore } from '@/store/useTokenStore'
import { VersionEntry } from './VersionEntry'

interface VersionPanelProps {
  isOpen: boolean
  onClose: () => void
}

export function VersionPanel({ isOpen, onClose }: VersionPanelProps) {
  const [versionName, setVersionName] = useState('')
  const activeSetId = useTokenStore((s) => s.activeSetId)
  const versions = useTokenStore((s) => s.getVersionsForActiveSet())
  const saveVersion = useTokenStore((s) => s.saveVersion)
  const restoreVersion = useTokenStore((s) => s.restoreVersion)
  const deleteVersion = useTokenStore((s) => s.deleteVersion)

  if (!isOpen) return null

  const handleSave = () => {
    saveVersion(versionName.trim() || undefined)
    setVersionName('')
  }

  const handleRestore = (versionId: string) => {
    if (!activeSetId) return
    if (!confirm('This will replace your current tokens. A backup will be saved automatically.')) return
    restoreVersion(activeSetId, versionId)
  }

  const handleDelete = (versionId: string) => {
    if (!activeSetId) return
    if (!confirm('Delete this version? This cannot be undone.')) return
    deleteVersion(activeSetId, versionId)
  }

  const sortedVersions = [...versions].reverse()

  return (
    <div className="fixed inset-y-0 right-0 w-80 bg-surface border-l border-border z-50 flex flex-col shadow-2xl">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <h3 className="section-title text-primary">VERSIONS</h3>
        <button onClick={onClose} className="p-1 text-text-tertiary hover:text-white transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="px-4 py-3 border-b border-border">
        <div className="flex gap-2">
          <input
            type="text"
            value={versionName}
            onChange={(e) => setVersionName(e.target.value)}
            placeholder="Version name (optional)"
            className="flex-1 px-3 py-1.5 bg-surface-elevated border border-border font-mono text-xs text-white placeholder:text-text-tertiary focus:border-primary focus:outline-none"
            onKeyDown={(e) => e.key === 'Enter' && handleSave()}
          />
          <button onClick={handleSave} className="flex items-center gap-1.5 px-3 py-1.5 bg-primary hover:bg-primary/90 text-white font-mono text-xs transition-colors">
            <Save className="w-3.5 h-3.5" />
            SAVE
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        {sortedVersions.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <p className="font-mono text-xs text-text-secondary">No versions saved yet.</p>
          </div>
        ) : (
          sortedVersions.map((version) => (
            <VersionEntry
              key={version.id}
              version={version}
              onRestore={() => handleRestore(version.id)}
              onDelete={() => handleDelete(version.id)}
            />
          ))
        )}
      </div>

      {sortedVersions.length > 0 && (
        <div className="px-4 py-2 border-t border-border">
          <p className="font-mono text-xs text-text-tertiary">
            {sortedVersions.length} version{sortedVersions.length !== 1 ? 's' : ''} · max 50
          </p>
        </div>
      )}
    </div>
  )
}
```

**Step 2:** Verify: `npm run build`

**Step 3:** Commit:

```bash
git add src/components/versioning/VersionPanel.tsx
git commit -m "feat: add VersionPanel slide-in with save and restore"
```

---

### Task 18: Update EditorHeader with Versions button

**Files:**
- Modify: `src/components/editor/EditorHeader.tsx`

**Step 1:** Replace the full content of `src/components/editor/EditorHeader.tsx`:

```typescript
import { Plus, Clock } from 'lucide-react'

interface EditorHeaderProps {
  onAddToken: () => void
  onOpenVersions: () => void
  versionCount: number
}

export function EditorHeader({ onAddToken, onOpenVersions, versionCount }: EditorHeaderProps) {
  return (
    <div className="flex items-center justify-between pb-6 border-b border-border-default">
      <h2 className="section-title text-primary">TOKEN EDITOR</h2>
      <div className="flex gap-3">
        <button
          onClick={onOpenVersions}
          className="flex items-center gap-2 px-4 py-2 bg-surface-elevated border border-border hover:border-primary text-white font-mono text-sm transition-colors"
        >
          <Clock className="w-4 h-4" />
          Versions
          {versionCount > 0 && (
            <span className="text-text-secondary">({versionCount})</span>
          )}
        </button>
        <button
          onClick={onAddToken}
          className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 text-white font-mono text-sm rounded transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Token
        </button>
      </div>
    </div>
  )
}
```

**Step 2:** Verify: `npm run build`

**Step 3:** Commit:

```bash
git add src/components/editor/EditorHeader.tsx
git commit -m "feat: add Versions button to EditorHeader"
```

---

### Task 19: Wire VersionPanel into EditorView

**Files:**
- Modify: `src/pages/EditorView.tsx`

**Step 1:** Replace the full content of `src/pages/EditorView.tsx`:

```typescript
import { useState } from 'react'
import { useTokenStore } from '@/store/useTokenStore'
import { EditorHeader } from '@/components/editor/EditorHeader'
import { TokenTree } from '@/components/editor/TokenTree'
import { AddTokenDialog } from '@/components/editor/AddTokenDialog'
import { VersionPanel } from '@/components/versioning/VersionPanel'

export function EditorView() {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isVersionPanelOpen, setIsVersionPanelOpen] = useState(false)
  const activeSet = useTokenStore((state) => state.getActiveTokenSet())
  const versionCount = useTokenStore((s) => s.getVersionsForActiveSet().length)

  if (!activeSet) {
    return (
      <div className="p-8">
        <h2 className="section-title text-primary mb-6">TOKEN EDITOR</h2>
        <p className="font-mono text-sm text-text-secondary">
          No token set loaded. Create or import a token set to begin editing.
        </p>
      </div>
    )
  }

  return (
    <div className="p-8">
      <EditorHeader
        onAddToken={() => setIsAddDialogOpen(true)}
        onOpenVersions={() => setIsVersionPanelOpen(true)}
        versionCount={versionCount}
      />
      <div className="mt-6">
        <TokenTree tokenSet={activeSet} />
      </div>
      <AddTokenDialog
        isOpen={isAddDialogOpen}
        onClose={() => setIsAddDialogOpen(false)}
      />
      <VersionPanel
        isOpen={isVersionPanelOpen}
        onClose={() => setIsVersionPanelOpen(false)}
      />
    </div>
  )
}
```

**Step 2:** Verify: `npm run build`

**Step 3:** Commit:

```bash
git add src/pages/EditorView.tsx
git commit -m "feat: wire VersionPanel into EditorView"
```

---

### Task 20: Final build verification

**Step 1:** Run: `npm run build`
Expected: Build succeeds with no errors.

**Step 2:** If any errors, fix them and commit:

```bash
git add -A
git commit -m "fix: resolve Phase 5 build errors"
```

**Step 3:** Use `superpowers:finishing-a-development-branch` to complete the work.

---

## Summary

| Task | Phase | Description | Files |
|------|-------|-------------|-------|
| 1 | A | Add `dashboard` to ViewMode | `types/index.ts` |
| 2 | A | Update Header nav | `Header.tsx` |
| 3 | A | DashboardView placeholder + App wiring | `DashboardView.tsx`, `App.tsx`, `useTokenStore.ts` |
| 4 | A | TokenSetCard component | `dashboard/TokenSetCard.tsx` |
| 5 | A | DashboardView full implementation | `DashboardView.tsx` |
| 6 | A | Dashboard build verification | — |
| 7 | B | BrowserHeader tabs + mode switcher | `browser/BrowserHeader.tsx` |
| 8 | B | ColorGrid with contrast ratios | `browser/ColorGrid.tsx` |
| 9 | B | SpacingScale bar visualization | `browser/SpacingScale.tsx` |
| 10 | B | TypographySpecimens live preview | `browser/TypographySpecimens.tsx` |
| 11 | B | ShadowSamples visual preview | `browser/ShadowSamples.tsx` |
| 12 | B | BrowserView full implementation | `BrowserView.tsx` |
| 13 | B | Browser build verification | — |
| 14 | C | Update Version type | `types/index.ts` |
| 15 | C | Version store state + actions | `useTokenStore.ts` |
| 16 | C | VersionEntry timeline row | `versioning/VersionEntry.tsx` |
| 17 | C | VersionPanel slide-in panel | `versioning/VersionPanel.tsx` |
| 18 | C | EditorHeader versions button | `EditorHeader.tsx` |
| 19 | C | Wire VersionPanel into EditorView | `EditorView.tsx` |
| 20 | C | Final build verification | — |
