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
  return { fontFamily: String(value) }
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
