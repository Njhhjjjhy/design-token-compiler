import { nanoid } from 'nanoid'
import type { Token, TokenGroup, TokenSet, TokenValue } from '@/types'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function tok(name: string, value: string, type: Token['type']): Token {
  return { id: nanoid(), name, value, type }
}

function grp(name: string, tokens: Record<string, Token | TokenGroup>): TokenGroup {
  return { id: nanoid(), name, tokens }
}

// Track dark-mode overrides as we build tokens
const darkOverrides: Record<string, TokenValue> = {}

function colorTok(name: string, light: string, dark?: string): Token {
  const token = tok(name, `#${light}`, 'color')
  if (dark && dark !== light) {
    darkOverrides[token.id] = `#${dark}`
  }
  return token
}

function dimTok(name: string, value: number): Token {
  return tok(name, `${value}px`, 'dimension')
}

// ---------------------------------------------------------------------------
// Color groups
// ---------------------------------------------------------------------------

function buildColorGroup(): TokenGroup {
  const brand = grp('brand', {
    'amber': colorTok('amber', 'FBB931'),
    'orange': colorTok('orange', 'FF9424'),
  })

  const interaction = grp('interaction', {
    'interactionError': colorTok('interactionError', 'D03131', 'FF5A5A'),
    'interactionSuccess': colorTok('interactionSuccess', '19B64E'),
    'interactionDisabled': colorTok('interactionDisabled', '8E8F8F', 'B8BABB'),
    'interactionHyperlink': colorTok('interactionHyperlink', '1282C0', '5BCBFF'),
  })

  const base = grp('base', {
    'black': colorTok('black', '1E1F20', 'FEFEFE'),
    'white': colorTok('white', 'FEFEFE', '1E1F20'),
    'background': colorTok('background', 'F9F9F9', '2B2D31'),
  })

  const neutral = grp('neutral', {
    '50': colorTok('50', 'FFFFFF', '25272C'),
    '100': colorTok('100', 'EDEEF1', '383A42'),
    '200': colorTok('200', 'D8DBDF', '40444C'),
    '300': colorTok('300', 'B6BAC3', '4A4E5A'),
    '400': colorTok('400', '8E95A2', '5B616E'),
    '500': colorTok('500', '6B7280'),
    '600': colorTok('600', '5B616E', '8E95A2'),
    '700': colorTok('700', '4A4E5A', 'B6BAC3'),
    '800': colorTok('800', '40444C', 'D8DBDF'),
    '900': colorTok('900', '383A42', 'EDEEF1'),
    '950': colorTok('950', '25272C', 'FFFFFF'),
  })

  const amber = grp('amber', {
    '50': colorTok('50', 'FFFBEC'),
    '100': colorTok('100', 'FEF2C9'),
    '200': colorTok('200', 'FCE590'),
    '300': colorTok('300', 'FBD259'),
    '400': colorTok('400', 'FBB931'),
    '500': colorTok('500', 'FFB111'),
    '600': colorTok('600', 'F5A500'),
    '700': colorTok('700', 'E79B00'),
    '800': colorTok('800', 'D79000'),
    '900': colorTok('900', 'BB7D00'),
    '950': colorTok('950', 'A36D00'),
  })

  const orange = grp('orange', {
    '50': colorTok('50', 'FFF7EE'),
    '100': colorTok('100', 'FFEDD6'),
    '200': colorTok('200', 'FDD6AD'),
    '300': colorTok('300', 'FBB979'),
    '400': colorTok('400', 'FF9424'),
    '500': colorTok('500', 'FF8505'),
    '600': colorTok('600', 'EF7A00'),
    '700': colorTok('700', 'E37400'),
    '800': colorTok('800', 'CF6A00'),
    '900': colorTok('900', 'B95F00'),
    '950': colorTok('950', 'A05200'),
  })

  const green = grp('green', {
    '50': colorTok('50', 'F0FDF4'),
    '100': colorTok('100', 'DDFCE8'),
    '200': colorTok('200', 'BDF6D1'),
    '300': colorTok('300', '8EE5AD'),
    '400': colorTok('400', '52DC83'),
    '500': colorTok('500', '19B64E'),
    '600': colorTok('600', '12A443'),
    '700': colorTok('700', '12953E'),
    '800': colorTok('800', '0F7D34'),
    '900': colorTok('900', '0C6C2D'),
    '950': colorTok('950', '0A5925'),
  })

  return grp('color', {
    'brand': brand,
    'interaction': interaction,
    'base': base,
    'neutral': neutral,
    'amber': amber,
    'orange': orange,
    'green': green,
  })
}

// ---------------------------------------------------------------------------
// Spacing group (0-32 scale, 4px increments)
// ---------------------------------------------------------------------------

function buildSpacingGroup(): TokenGroup {
  const tokens: Record<string, Token> = {}
  for (let i = 0; i <= 32; i++) {
    tokens[String(i)] = dimTok(String(i), i * 4)
  }
  return grp('spacing', tokens)
}

// ---------------------------------------------------------------------------
// Typography group
// ---------------------------------------------------------------------------

function buildFontGroup(): TokenGroup {
  return grp('font', {
    'family': grp('family', {
      'heading': tok('heading', 'REM', 'fontFamily'),
      'body': tok('body', 'Noto Sans JP', 'fontFamily'),
    }),
    'size': grp('size', {
      'h1': tok('h1', '2.5rem', 'dimension'),
      'h2': tok('h2', '2.2rem', 'dimension'),
      'h3': tok('h3', '1.8rem', 'dimension'),
      'h4': tok('h4', '1.5rem', 'dimension'),
      'h5': tok('h5', '1.25rem', 'dimension'),
      'body': grp('body', {
        'l': tok('l', '1.2rem', 'dimension'),
        'm': tok('m', '1rem', 'dimension'),
        's': tok('s', '0.85rem', 'dimension'),
        'xs': tok('xs', '0.75rem', 'dimension'),
      }),
      'label': grp('label', {
        'l': tok('l', '1rem', 'dimension'),
        'm': tok('m', '0.875rem', 'dimension'),
      }),
    }),
    'weight': grp('weight', {
      'regular': tok('regular', '400', 'fontWeight'),
      'semibold': tok('semibold', '600', 'fontWeight'),
      'bold': tok('bold', '700', 'fontWeight'),
    }),
    'lineHeight': grp('lineHeight', {
      'tight': tok('tight', '125%', 'dimension'),
      'normal': tok('normal', '150%', 'dimension'),
    }),
    'letterSpacing': grp('letterSpacing', {
      'default': tok('default', '0.25%', 'dimension'),
    }),
  })
}

// ---------------------------------------------------------------------------
// Shadow group
// ---------------------------------------------------------------------------

function buildShadowGroup(): TokenGroup {
  return grp('shadow', {
    'primitive': grp('primitive', {
      'sm': tok('sm', '0 1px 2px 0 rgba(0, 0, 0, 0.05)', 'shadow'),
      'md': tok('md', '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)', 'shadow'),
      'lg': tok('lg', '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)', 'shadow'),
      'xl': tok('xl', '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)', 'shadow'),
    }),
    'semantic': grp('semantic', {
      'elevation-low': tok('elevation-low', '{shadow.primitive.sm}', 'shadow'),
      'elevation-mid': tok('elevation-mid', '{shadow.primitive.md}', 'shadow'),
      'elevation-high': tok('elevation-high', '{shadow.primitive.lg}', 'shadow'),
    }),
  })
}

// ---------------------------------------------------------------------------
// Responsive layout group
// ---------------------------------------------------------------------------

function buildResponsiveGroup(): TokenGroup {
  return grp('responsive', {
    'width': grp('width', {
      'mobile': dimTok('mobile', 390),
      'tablet': dimTok('tablet', 834),
      'desktop': dimTok('desktop', 1440),
    }),
    'padding': grp('padding', {
      'mobile': dimTok('mobile', 16),
      'tablet': dimTok('tablet', 32),
      'desktop': dimTok('desktop', 160),
    }),
    'margins': grp('margins', {
      'mobile': dimTok('mobile', 32),
      'tablet': dimTok('tablet', 40),
      'desktop': dimTok('desktop', 48),
    }),
  })
}

// ---------------------------------------------------------------------------
// Semantic spacing group (references the spacing scale)
// ---------------------------------------------------------------------------

function buildSemanticSpacingGroup(): TokenGroup {
  return grp('semantic-spacing', {
    'xxs': tok('xxs', '{spacing.2}', 'dimension'),
    'xs': tok('xs', '{spacing.4}', 'dimension'),
    's': tok('s', '{spacing.6}', 'dimension'),
    'md': tok('md', '{spacing.8}', 'dimension'),
    'l': tok('l', '{spacing.10}', 'dimension'),
    'xl': tok('xl', '{spacing.12}', 'dimension'),
    'xxl': tok('xxl', '{spacing.16}', 'dimension'),
  })
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export function createSampleDesignSystem(): TokenSet {
  // Reset overrides for each invocation
  for (const key of Object.keys(darkOverrides)) {
    delete darkOverrides[key]
  }

  const colorGroup = buildColorGroup()
  const spacingGroup = buildSpacingGroup()
  const fontGroup = buildFontGroup()
  const shadowGroup = buildShadowGroup()
  const responsiveGroup = buildResponsiveGroup()
  const semanticSpacingGroup = buildSemanticSpacingGroup()

  const lightModeId = nanoid()
  const darkModeId = nanoid()

  return {
    id: nanoid(),
    name: 'Design System',
    tokens: {
      'color': colorGroup,
      'spacing': spacingGroup,
      'font': fontGroup,
      'shadow': shadowGroup,
      'responsive': responsiveGroup,
      'semantic-spacing': semanticSpacingGroup,
    },
    modes: {
      [lightModeId]: {
        id: lightModeId,
        name: 'Light',
        overrides: {},
        isDefault: true,
      },
      [darkModeId]: {
        id: darkModeId,
        name: 'Dark',
        overrides: { ...darkOverrides },
      },
    },
    activeMode: lightModeId,
    metadata: {
      createdAt: Date.now(),
      updatedAt: Date.now(),
      version: '1.0.0',
    },
  }
}
