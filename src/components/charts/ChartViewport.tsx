import { useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'

interface Props {
  children: (size: { width: number; height: number }) => ReactNode
  className?: string
}

export function ChartViewport({ children, className = '' }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const [size, setSize] = useState({ width: 0, height: 0 })

  useEffect(() => {
    const element = ref.current
    if (!element) return

    const update = () => {
      const rect = element.getBoundingClientRect()
      setSize({
        width: Math.max(0, Math.floor(rect.width)),
        height: Math.max(0, Math.floor(rect.height)),
      })
    }

    update()

    const observer = new ResizeObserver(update)
    observer.observe(element)
    return () => observer.disconnect()
  }, [])

  return (
    <div ref={ref} className={`w-full h-full min-w-0 min-h-px ${className}`}>
      {size.width > 0 && size.height > 0 ? children(size) : null}
    </div>
  )
}
