import type { ViewMode } from '@/types'

export type TooltipPlacement = 'top' | 'bottom' | 'left' | 'right' | 'center'

export interface TourStep {
  id: string
  target: string | null          // data-tour="..." selector, null = centered
  view: ViewMode | null          // navigate to this view, null = stay on current
  placement: TooltipPlacement
  title: string
  description: string
  expandedDetail?: string        // progressive detail, shown on "Learn more" click
  isFinal?: boolean              // last step shows action buttons instead of Next
}

export const TOUR_STEPS: TourStep[] = [
  {
    id: 'welcome',
    target: null,
    view: null,
    placement: 'center',
    title: 'Welcome to Token Compiler',
    description: 'A tool that turns your design decisions into files developers can use directly in code. Let\'s walk through how it works.',
    expandedDetail: 'Design tokens are the named values behind your designs -- colors like \'brand-red\', spacing like \'padding-large\', fonts like \'heading-style\'. This app helps you organize them and export them in formats your dev team needs.',
  },
  {
    id: 'getting-tokens',
    target: null,
    view: null,
    placement: 'center',
    title: 'Getting Your Tokens',
    description: 'First, you need to get your design values out of Figma. There are three ways:',
    expandedDetail: 'Figma Variables: Export your variables from Figma\'s native Variables panel as JSON.\n\nTokens Studio plugin: If your team uses Tokens Studio (formerly Figma Tokens), export from the plugin.\n\nManual files: You can also use existing CSS, SCSS, or JSON token files your team already has.',
  },
  {
    id: 'dashboard',
    target: 'dashboard-grid',
    view: 'dashboard',
    placement: 'top',
    title: 'The Dashboard',
    description: 'This is your home base. Each card represents a token set -- a collection of related design values.',
    expandedDetail: 'Think of a token set like a Figma library. It holds all the colors, spacing, typography, and other values for a project or brand.',
  },
  {
    id: 'creating-importing',
    target: 'dashboard-actions',
    view: 'dashboard',
    placement: 'bottom',
    title: 'Creating or Importing',
    description: 'Start by creating a new empty set, or import a file you exported from Figma.',
    expandedDetail: 'Click \'Import\' to load a JSON, CSS, or SCSS file. The app will automatically detect the format and organize your tokens into groups.',
  },
  {
    id: 'try-demo',
    target: 'dashboard-sample',
    view: 'dashboard',
    placement: 'bottom',
    title: 'Try the Demo',
    description: 'Want to explore first? Load the sample token set -- it includes realistic colors, spacing, typography, and shadows you can play with.',
  },
  {
    id: 'editor',
    target: 'editor-tree',
    view: 'editor',
    placement: 'right',
    title: 'The Editor',
    description: 'This is where you organize and edit your tokens. Your values are arranged in a tree -- groups contain tokens, just like folders contain files.',
    expandedDetail: 'Click any value to edit it. You can change colors, adjust spacing, update font settings, or add entirely new tokens.',
  },
  {
    id: 'editing-token',
    target: 'editor-tree',
    view: 'editor',
    placement: 'left',
    title: 'Editing a Token',
    description: 'Click any token to edit its value. Changes are saved automatically.',
    expandedDetail: 'Tokens can reference other tokens -- for example, \'button-background\' can point to \'brand-primary\'. When you update \'brand-primary\', everything that references it updates too.',
  },
  {
    id: 'browser',
    target: 'browser-content',
    view: 'browser',
    placement: 'top',
    title: 'The Browser',
    description: 'The Browser gives you a visual preview of all your tokens -- see your colors as swatches, spacing as scales, typography as live specimens.',
    expandedDetail: 'This is great for reviewing your design system at a glance and sharing previews with your team.',
  },
  {
    id: 'compiler',
    target: 'compiler-formats',
    view: 'compiler',
    placement: 'bottom',
    title: 'Exporting for Developers',
    description: 'This is where the magic happens. Choose a format and the app creates a file your developer can drop straight into their codebase.',
    expandedDetail: 'Each format serves a different tech stack: CSS for web, SCSS for Sass projects, TypeScript for React/JS apps, Tailwind for Tailwind CSS setups, and JSON formats for design tool integrations.',
  },
  {
    id: 'sync',
    target: 'sync-dropzone',
    view: 'sync',
    placement: 'top',
    title: 'Keeping Things in Sync',
    description: 'Updated your Figma file? Drop the new export here and the app will show you exactly what changed -- new tokens, removed tokens, and value differences.',
    expandedDetail: 'You can choose which changes to accept, one by one, so nothing gets overwritten by accident.',
  },
  {
    id: 'versions',
    target: 'editor-versions-btn',
    view: 'editor',
    placement: 'bottom',
    title: 'Version History',
    description: 'Every time you make a change, a version snapshot is saved. You can go back to any previous version if something goes wrong.',
  },
  {
    id: 'ready',
    target: null,
    view: null,
    placement: 'center',
    title: 'You\'re Ready!',
    description: 'That\'s it! You can revisit this guide anytime from the help button in the top bar. Start by loading the sample data or importing your own tokens.',
    isFinal: true,
  },
]
