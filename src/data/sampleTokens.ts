import { nanoid } from 'nanoid'
import type { TokenSet } from '@/types'

/**
 * Sample token set following the three-tier structure:
 * - Primitive: Raw values (blue-600, spacing-4)
 * - Semantic: Meaning (primary-color, content-gap)
 * - Component: Usage (button-background, card-border)
 */
export const createSampleTokenSet = (): TokenSet => ({
  id: nanoid(),
  name: 'Sample Design System',
  metadata: {
    createdAt: Date.now(),
    updatedAt: Date.now(),
    version: '1.0.0',
  },
  activeMode: 'light',
  modes: {
    light: {
      id: 'light',
      name: 'Light Mode',
      isDefault: true,
      overrides: {
        'color.semantic.background': '#ffffff',
        'color.semantic.surface': '#f8f9fa',
        'color.semantic.text-primary': '#1a1a1a',
        'color.semantic.text-secondary': '#6b7280',
      },
    },
    dark: {
      id: 'dark',
      name: 'Dark Mode',
      overrides: {
        'color.semantic.background': '#1a1a1a',
        'color.semantic.surface': '#2d2d2d',
        'color.semantic.text-primary': '#ffffff',
        'color.semantic.text-secondary': '#9ca3af',
      },
    },
  },
  tokens: {
    color: {
      id: 'color-group',
      name: 'Colors',
      tokens: {
        primitive: {
          id: 'color-primitive-group',
          name: 'Primitive Colors',
          tokens: {
            // Red scale
            red: {
              id: 'color-primitive-red-group',
              name: 'Red',
              tokens: {
                '50': { id: nanoid(), name: 'Red 50', type: 'color', value: '#fef2f2' },
                '100': { id: nanoid(), name: 'Red 100', type: 'color', value: '#fee2e2' },
                '500': { id: nanoid(), name: 'Red 500', type: 'color', value: '#ef4444' },
                '600': { id: nanoid(), name: 'Red 600', type: 'color', value: '#dc2626' },
                '900': { id: nanoid(), name: 'Red 900', type: 'color', value: '#7f1d1d' },
              },
            },
            // Blue scale
            blue: {
              id: 'color-primitive-blue-group',
              name: 'Blue',
              tokens: {
                '50': { id: nanoid(), name: 'Blue 50', type: 'color', value: '#eff6ff' },
                '100': { id: nanoid(), name: 'Blue 100', type: 'color', value: '#dbeafe' },
                '500': { id: nanoid(), name: 'Blue 500', type: 'color', value: '#3b82f6' },
                '600': { id: nanoid(), name: 'Blue 600', type: 'color', value: '#2563eb' },
                '900': { id: nanoid(), name: 'Blue 900', type: 'color', value: '#1e3a8a' },
              },
            },
            // Gray scale
            gray: {
              id: 'color-primitive-gray-group',
              name: 'Gray',
              tokens: {
                '50': { id: nanoid(), name: 'Gray 50', type: 'color', value: '#f9fafb' },
                '100': { id: nanoid(), name: 'Gray 100', type: 'color', value: '#f3f4f6' },
                '300': { id: nanoid(), name: 'Gray 300', type: 'color', value: '#d1d5db' },
                '500': { id: nanoid(), name: 'Gray 500', type: 'color', value: '#6b7280' },
                '700': { id: nanoid(), name: 'Gray 700', type: 'color', value: '#374151' },
                '900': { id: nanoid(), name: 'Gray 900', type: 'color', value: '#111827' },
              },
            },
          },
        },
        semantic: {
          id: 'color-semantic-group',
          name: 'Semantic Colors',
          tokens: {
            primary: {
              id: nanoid(),
              name: 'Primary',
              type: 'color',
              value: '{color.primitive.blue.600}',
              description: 'Primary brand color',
            },
            error: {
              id: nanoid(),
              name: 'Error',
              type: 'color',
              value: '{color.primitive.red.600}',
              description: 'Error and destructive actions',
            },
            background: {
              id: nanoid(),
              name: 'Background',
              type: 'color',
              value: '#ffffff',
              description: 'Page background (overridden by theme)',
            },
            surface: {
              id: nanoid(),
              name: 'Surface',
              type: 'color',
              value: '#f8f9fa',
              description: 'Card and panel backgrounds',
            },
            border: {
              id: nanoid(),
              name: 'Border',
              type: 'color',
              value: '{color.primitive.gray.300}',
              description: 'Default border color',
            },
            'text-primary': {
              id: nanoid(),
              name: 'Text Primary',
              type: 'color',
              value: '#1a1a1a',
              description: 'Primary text color',
            },
            'text-secondary': {
              id: nanoid(),
              name: 'Text Secondary',
              type: 'color',
              value: '{color.primitive.gray.500}',
              description: 'Secondary text color',
            },
          },
        },
        component: {
          id: 'color-component-group',
          name: 'Component Colors',
          tokens: {
            'button-primary-bg': {
              id: nanoid(),
              name: 'Button Primary Background',
              type: 'color',
              value: '{color.semantic.primary}',
            },
            'button-primary-text': {
              id: nanoid(),
              name: 'Button Primary Text',
              type: 'color',
              value: '#ffffff',
            },
            'card-background': {
              id: nanoid(),
              name: 'Card Background',
              type: 'color',
              value: '{color.semantic.surface}',
            },
            'card-border': {
              id: nanoid(),
              name: 'Card Border',
              type: 'color',
              value: '{color.semantic.border}',
            },
          },
        },
      },
    },
    spacing: {
      id: 'spacing-group',
      name: 'Spacing',
      tokens: {
        primitive: {
          id: 'spacing-primitive-group',
          name: 'Primitive Spacing',
          tokens: {
            '1': { id: nanoid(), name: 'Spacing 1', type: 'dimension', value: '4px' },
            '2': { id: nanoid(), name: 'Spacing 2', type: 'dimension', value: '8px' },
            '3': { id: nanoid(), name: 'Spacing 3', type: 'dimension', value: '12px' },
            '4': { id: nanoid(), name: 'Spacing 4', type: 'dimension', value: '16px' },
            '6': { id: nanoid(), name: 'Spacing 6', type: 'dimension', value: '24px' },
            '8': { id: nanoid(), name: 'Spacing 8', type: 'dimension', value: '32px' },
            '12': { id: nanoid(), name: 'Spacing 12', type: 'dimension', value: '48px' },
            '16': { id: nanoid(), name: 'Spacing 16', type: 'dimension', value: '64px' },
          },
        },
        semantic: {
          id: 'spacing-semantic-group',
          name: 'Semantic Spacing',
          tokens: {
            'content-gap': {
              id: nanoid(),
              name: 'Content Gap',
              type: 'dimension',
              value: '{spacing.primitive.4}',
              description: 'Default gap between content blocks',
            },
            'section-gap': {
              id: nanoid(),
              name: 'Section Gap',
              type: 'dimension',
              value: '{spacing.primitive.12}',
              description: 'Gap between major sections',
            },
          },
        },
        component: {
          id: 'spacing-component-group',
          name: 'Component Spacing',
          tokens: {
            'button-padding-x': {
              id: nanoid(),
              name: 'Button Padding Horizontal',
              type: 'dimension',
              value: '{spacing.primitive.4}',
            },
            'button-padding-y': {
              id: nanoid(),
              name: 'Button Padding Vertical',
              type: 'dimension',
              value: '{spacing.primitive.2}',
            },
            'card-padding': {
              id: nanoid(),
              name: 'Card Padding',
              type: 'dimension',
              value: '{spacing.primitive.6}',
            },
          },
        },
      },
    },
    border: {
      id: 'border-group',
      name: 'Borders',
      tokens: {
        component: {
          id: 'border-component-group',
          name: 'Component Borders',
          tokens: {
            'card-border': {
              id: nanoid(),
              name: 'Card Border',
              type: 'border',
              value: '1px solid {color.component.card-border}',
              description: 'Standard card border',
            },
            'button-border': {
              id: nanoid(),
              name: 'Button Border',
              type: 'border',
              value: '2px solid {color.semantic.primary}',
              description: 'Primary button border',
            },
          },
        },
      },
    },
  },
})
