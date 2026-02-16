/**
 * Test data and manual validation for the token resolver
 * Run this file to verify the resolver works correctly
 */

import type { TokenSet } from '@/types'
import { resolveTokens, detectCircularReferences, getFlattenedTokens } from './resolver'

// Test data: A token set with various reference scenarios
const testTokenSet: TokenSet = {
  id: 'test-set',
  name: 'Test Token Set',
  metadata: {
    createdAt: Date.now(),
    updatedAt: Date.now(),
    version: '1.0.0',
  },
  activeMode: 'light',
  modes: {
    light: {
      id: 'light',
      name: 'Light',
      isDefault: true,
      overrides: {
        'color.background': '#ffffff',
        'color.text': '#000000',
      },
    },
    dark: {
      id: 'dark',
      name: 'Dark',
      overrides: {
        'color.background': '#000000',
        'color.text': '#ffffff',
      },
    },
  },
  tokens: {
    color: {
      id: 'color-group',
      name: 'Colors',
      tokens: {
        primary: {
          id: 'color-primary',
          name: 'Primary',
          type: 'color',
          value: '#f40c3f',
        },
        secondary: {
          id: 'color-secondary',
          name: 'Secondary',
          type: 'color',
          value: '#160000',
        },
        background: {
          id: 'color-background',
          name: 'Background',
          type: 'color',
          value: '#ffffff', // Will be overridden by mode
        },
        text: {
          id: 'color-text',
          name: 'Text',
          type: 'color',
          value: '#000000', // Will be overridden by mode
        },
        // Reference to another color
        accent: {
          id: 'color-accent',
          name: 'Accent',
          type: 'color',
          value: '{color.primary}',
        },
      },
    },
    spacing: {
      id: 'spacing-group',
      name: 'Spacing',
      tokens: {
        base: {
          id: 'spacing-base',
          name: 'Base',
          type: 'dimension',
          value: '8px',
        },
        small: {
          id: 'spacing-small',
          name: 'Small',
          type: 'dimension',
          value: '{spacing.base}',
        },
        medium: {
          id: 'spacing-medium',
          name: 'Medium',
          type: 'dimension',
          value: '16px',
        },
      },
    },
    border: {
      id: 'border-group',
      name: 'Border',
      tokens: {
        primary: {
          id: 'border-primary',
          name: 'Primary Border',
          type: 'border',
          // Embedded reference
          value: '1px solid {color.primary}',
        },
        secondary: {
          id: 'border-secondary',
          name: 'Secondary Border',
          type: 'border',
          // Multiple embedded references
          value: '{spacing.small} solid {color.secondary}',
        },
      },
    },
  },
}

// Test: Basic resolution
console.log('=== TEST 1: Basic Resolution (Light Mode) ===')
const lightResult = resolveTokens(testTokenSet, 'light')
console.log('Resolved tokens:', lightResult.tokens)
console.log('Errors:', lightResult.errors)
console.log('Circular:', lightResult.circular)
console.log('')

// Expected results:
// - color.accent should resolve to #f40c3f (from color.primary)
// - spacing.small should resolve to 8px (from spacing.base)
// - border.primary should resolve to "1px solid #f40c3f"
// - border.secondary should resolve to "8px solid #160000"
// - color.background should be #ffffff (light mode override)

// Test: Dark mode
console.log('=== TEST 2: Dark Mode Resolution ===')
const darkResult = resolveTokens(testTokenSet, 'dark')
console.log('Background (dark):', darkResult.tokens['color.background']?.resolvedValue)
console.log('Text (dark):', darkResult.tokens['color.text']?.resolvedValue)
console.log('')

// Expected:
// - color.background should be #000000 (dark mode override)
// - color.text should be #ffffff (dark mode override)

// Test: Circular reference detection
const circularTokenSet: TokenSet = {
  id: 'circular-test',
  name: 'Circular Test',
  metadata: {
    createdAt: Date.now(),
    updatedAt: Date.now(),
    version: '1.0.0',
  },
  activeMode: null,
  modes: {},
  tokens: {
    a: {
      id: 'token-a',
      name: 'Token A',
      type: 'color',
      value: '{b}',
    },
    b: {
      id: 'token-b',
      name: 'Token B',
      type: 'color',
      value: '{c}',
    },
    c: {
      id: 'token-c',
      name: 'Token C',
      type: 'color',
      value: '{a}',
    },
  },
}

console.log('=== TEST 3: Circular Reference Detection ===')
const circularResult = resolveTokens(circularTokenSet)
console.log('Circular references found:', circularResult.circular)
console.log('Errors:', circularResult.errors)
console.log('')

// Expected:
// - Should detect circular reference: a -> b -> c -> a

// Test: Missing reference
const missingRefTokenSet: TokenSet = {
  id: 'missing-test',
  name: 'Missing Reference Test',
  metadata: {
    createdAt: Date.now(),
    updatedAt: Date.now(),
    version: '1.0.0',
  },
  activeMode: null,
  modes: {},
  tokens: {
    valid: {
      id: 'token-valid',
      name: 'Valid Token',
      type: 'color',
      value: '#ff0000',
    },
    invalid: {
      id: 'token-invalid',
      name: 'Invalid Token',
      type: 'color',
      value: '{nonexistent.token}',
    },
  },
}

console.log('=== TEST 4: Missing Reference Detection ===')
const missingResult = resolveTokens(missingRefTokenSet)
console.log('Errors:', missingResult.errors)
console.log('')

// Expected:
// - Should detect missing reference error for {nonexistent.token}

console.log('=== All tests complete ===')
