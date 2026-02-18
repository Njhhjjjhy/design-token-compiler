import { useEffect, useState } from 'react'

export function BinarySeparator() {
  const [offset, setOffset] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setOffset((prev) => (prev + 1) % 100)
    }, 50)

    return () => clearInterval(interval)
  }, [])

  // Generate random binary digits
  const generateBinaryString = () => {
    const groups: string[] = []
    for (let i = 0; i < 50; i++) {
      const binary = Math.floor(Math.random() * 256)
        .toString(2)
        .padStart(8, '0')
      groups.push(binary)
    }
    return groups.join(' // ')
  }

  const [binaryString] = useState(generateBinaryString())

  return (
    <div aria-hidden="true" role="presentation" className="h-9 border-t border-b border-border bg-secondary overflow-hidden relative">
      <div
        className="absolute whitespace-nowrap font-mono text-[8px] text-text-tertiary leading-9"
        style={{
          transform: `translateX(-${offset}%)`,
          willChange: 'transform',
        }}
      >
        {binaryString} {binaryString}
      </div>

      {/* Border triangles */}
      <div
        className="absolute left-0 top-0 border-l-[8px] border-l-transparent border-t-[36px] border-t-border"
        style={{ borderTopWidth: '100%' }}
      />
      <div
        className="absolute right-0 top-0 border-r-[8px] border-r-transparent border-t-[36px] border-t-border"
        style={{ borderTopWidth: '100%' }}
      />
    </div>
  )
}
