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
        'color.semantic.border': '#d1d5db',
        'color.semantic.text-primary': '#1a1a1a',
        'color.semantic.text-secondary': '#6b7280',
        'color.component.button-primary-bg': '#2563eb',
        'color.component.button-primary-text': '#ffffff',
        'color.component.card-background': '#f8f9fa',
        'color.component.card-border': '#d1d5db',
        'shadow.semantic.elevation-low': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        'shadow.semantic.elevation-mid': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)',
        'shadow.semantic.elevation-high': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)',
      },
    },
    dark: {
      id: 'dark',
      name: 'Dark Mode',
      overrides: {
        'color.semantic.background': '#1a1a1a',
        'color.semantic.surface': '#2d2d2d',
        'color.semantic.primary': '#60a5fa',
        'color.semantic.error': '#f87171',
        'color.semantic.border': '#4b5563',
        'color.semantic.text-primary': '#f9fafb',
        'color.semantic.text-secondary': '#9ca3af',
        'color.component.button-primary-bg': '#60a5fa',
        'color.component.button-primary-text': '#111827',
        'color.component.card-background': '#2d2d2d',
        'color.component.card-border': '#4b5563',
        'shadow.semantic.elevation-low': '0 1px 2px 0 rgba(0, 0, 0, 0.3)',
        'shadow.semantic.elevation-mid': '0 4px 6px -1px rgba(0, 0, 0, 0.4), 0 2px 4px -2px rgba(0, 0, 0, 0.3)',
        'shadow.semantic.elevation-high': '0 10px 15px -3px rgba(0, 0, 0, 0.5), 0 4px 6px -4px rgba(0, 0, 0, 0.4)',
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
    font: {
      id: 'font-group',
      name: 'Typography',
      tokens: {
        primitive: {
          id: 'font-primitive-group',
          name: 'Primitive Typography',
          tokens: {
            'family-sans': {
              id: nanoid(),
              name: 'Font Family Sans',
              type: 'fontFamily',
              value: 'Inter, system-ui, sans-serif',
            },
            'family-mono': {
              id: nanoid(),
              name: 'Font Family Mono',
              type: 'fontFamily',
              value: 'JetBrains Mono, monospace',
            },
            'family-serif': {
              id: nanoid(),
              name: 'Font Family Serif',
              type: 'fontFamily',
              value: 'Instrument Serif, Georgia, serif',
            },
            'weight-regular': {
              id: nanoid(),
              name: 'Font Weight Regular',
              type: 'fontWeight',
              value: '400',
            },
            'weight-medium': {
              id: nanoid(),
              name: 'Font Weight Medium',
              type: 'fontWeight',
              value: '500',
            },
            'weight-semibold': {
              id: nanoid(),
              name: 'Font Weight Semibold',
              type: 'fontWeight',
              value: '600',
            },
            'weight-bold': {
              id: nanoid(),
              name: 'Font Weight Bold',
              type: 'fontWeight',
              value: '700',
            },
            'size-xs': { id: nanoid(), name: 'Font Size XS', type: 'dimension', value: '12px' },
            'size-sm': { id: nanoid(), name: 'Font Size SM', type: 'dimension', value: '14px' },
            'size-base': { id: nanoid(), name: 'Font Size Base', type: 'dimension', value: '16px' },
            'size-lg': { id: nanoid(), name: 'Font Size LG', type: 'dimension', value: '20px' },
            'size-xl': { id: nanoid(), name: 'Font Size XL', type: 'dimension', value: '24px' },
            'size-2xl': { id: nanoid(), name: 'Font Size 2XL', type: 'dimension', value: '32px' },
          },
        },
        semantic: {
          id: 'font-semantic-group',
          name: 'Semantic Typography',
          tokens: {
            'body-family': {
              id: nanoid(),
              name: 'Body Font Family',
              type: 'fontFamily',
              value: '{font.primitive.family-sans}',
              description: 'Default body text font',
            },
            'heading-family': {
              id: nanoid(),
              name: 'Heading Font Family',
              type: 'fontFamily',
              value: '{font.primitive.family-serif}',
              description: 'Heading font',
            },
            'code-family': {
              id: nanoid(),
              name: 'Code Font Family',
              type: 'fontFamily',
              value: '{font.primitive.family-mono}',
              description: 'Code and data font',
            },
            'body-size': {
              id: nanoid(),
              name: 'Body Font Size',
              type: 'dimension',
              value: '{font.primitive.size-base}',
              description: 'Default body text size',
            },
            'caption-size': {
              id: nanoid(),
              name: 'Caption Font Size',
              type: 'dimension',
              value: '{font.primitive.size-xs}',
              description: 'Caption and helper text size',
            },
          },
        },
        component: {
          id: 'font-component-group',
          name: 'Component Typography',
          tokens: {
            'button-size': {
              id: nanoid(),
              name: 'Button Font Size',
              type: 'dimension',
              value: '{font.primitive.size-sm}',
            },
            'button-weight': {
              id: nanoid(),
              name: 'Button Font Weight',
              type: 'fontWeight',
              value: '{font.primitive.weight-medium}',
            },
            'heading-weight': {
              id: nanoid(),
              name: 'Heading Font Weight',
              type: 'fontWeight',
              value: '{font.primitive.weight-semibold}',
            },
          },
        },
      },
    },
    shadow: {
      id: 'shadow-group',
      name: 'Shadows',
      tokens: {
        primitive: {
          id: 'shadow-primitive-group',
          name: 'Primitive Shadows',
          tokens: {
            sm: {
              id: nanoid(),
              name: 'Shadow SM',
              type: 'shadow',
              value: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
            },
            md: {
              id: nanoid(),
              name: 'Shadow MD',
              type: 'shadow',
              value: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)',
            },
            lg: {
              id: nanoid(),
              name: 'Shadow LG',
              type: 'shadow',
              value: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)',
            },
            xl: {
              id: nanoid(),
              name: 'Shadow XL',
              type: 'shadow',
              value: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
            },
          },
        },
        semantic: {
          id: 'shadow-semantic-group',
          name: 'Semantic Shadows',
          tokens: {
            'elevation-low': {
              id: nanoid(),
              name: 'Elevation Low',
              type: 'shadow',
              value: '{shadow.primitive.sm}',
              description: 'Subtle elevation for cards',
            },
            'elevation-mid': {
              id: nanoid(),
              name: 'Elevation Mid',
              type: 'shadow',
              value: '{shadow.primitive.md}',
              description: 'Medium elevation for dropdowns',
            },
            'elevation-high': {
              id: nanoid(),
              name: 'Elevation High',
              type: 'shadow',
              value: '{shadow.primitive.lg}',
              description: 'High elevation for modals',
            },
          },
        },
        component: {
          id: 'shadow-component-group',
          name: 'Component Shadows',
          tokens: {
            'card-shadow': {
              id: nanoid(),
              name: 'Card Shadow',
              type: 'shadow',
              value: '{shadow.semantic.elevation-low}',
            },
            'dropdown-shadow': {
              id: nanoid(),
              name: 'Dropdown Shadow',
              type: 'shadow',
              value: '{shadow.semantic.elevation-mid}',
            },
            'modal-shadow': {
              id: nanoid(),
              name: 'Modal Shadow',
              type: 'shadow',
              value: '{shadow.semantic.elevation-high}',
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
