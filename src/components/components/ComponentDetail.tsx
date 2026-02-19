import { useState } from 'react'
import { motion } from 'framer-motion'
import type { Component, ResolvedTokenMap, TokenBinding } from '@/types'
import { tabVariants, motionConfig } from '@/lib/motion'
import { OverviewTab } from './OverviewTab'
import { AnatomyTab } from './AnatomyTab'
import { TokenBindingTab } from './TokenBindingTab'
import { CodeTab } from './CodeTab'

type DetailTab = 'overview' | 'anatomy' | 'tokens' | 'code'

interface ComponentDetailProps {
  component: Component
  resolvedTokens: ResolvedTokenMap
  onAddBinding: (binding: Omit<TokenBinding, 'id'>) => void
  onUpdateBinding: (bindingId: string, updates: Partial<Pick<TokenBinding, 'tokenPath' | 'cssProperty'>>) => void
  onRemoveBinding: (bindingId: string) => void
  onUpdateMeta: (updates: Partial<Pick<Component, 'description' | 'usageGuidelines'>>) => void
}

export function ComponentDetail({
  component,
  resolvedTokens,
  onAddBinding,
  onUpdateBinding,
  onRemoveBinding,
  onUpdateMeta,
}: ComponentDetailProps) {
  const [activeTab, setActiveTab] = useState<DetailTab>('overview')

  const tabs: { id: DetailTab; label: string }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'anatomy', label: 'Anatomy' },
    { id: 'tokens', label: 'Tokens' },
    { id: 'code', label: 'Code' },
  ]

  const boundCount = component.bindings.length

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* Component header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border">
        <div>
          <h2 className="font-mono text-base text-white">{component.id}</h2>
          <p className="font-mono text-xs text-text-tertiary mt-0.5">{component.name} — {component.atomicLevel}</p>
        </div>
        <div className="font-mono text-xs text-text-tertiary">
          {boundCount} binding{boundCount !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex items-center border-b border-border px-6">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`
              relative px-4 py-3 font-mono text-xs tracking-wider uppercase transition-colors
              ${activeTab === tab.id ? 'text-white' : 'text-text-tertiary hover:text-text-secondary'}
            `}
          >
            {tab.label}
            {activeTab === tab.id && (
              <motion.div
                layoutId="component-detail-tab-indicator"
                className="absolute bottom-0 left-0 right-0 h-[2px] bg-primary"
              />
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-auto">
        <motion.div
          key={activeTab}
          variants={tabVariants}
          initial="initial"
          animate="animate"
          transition={motionConfig.enter}
          className="h-full"
        >
          {activeTab === 'overview' && (
            <OverviewTab
              component={component}
              resolvedTokens={resolvedTokens}
              onUpdateMeta={onUpdateMeta}
            />
          )}
          {activeTab === 'anatomy' && (
            <AnatomyTab component={component} />
          )}
          {activeTab === 'tokens' && (
            <TokenBindingTab
              component={component}
              resolvedTokens={resolvedTokens}
              onAddBinding={onAddBinding}
              onUpdateBinding={onUpdateBinding}
              onRemoveBinding={onRemoveBinding}
            />
          )}
          {activeTab === 'code' && (
            <CodeTab component={component} resolvedTokens={resolvedTokens} />
          )}
        </motion.div>
      </div>
    </div>
  )
}
