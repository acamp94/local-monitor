import type { SeverityLevel } from '@/types'

interface Props {
  severity: SeverityLevel
  size?: 'sm' | 'md'
}

const STYLES: Record<SeverityLevel, string> = {
  CRITICAL: 'bg-danger/15 text-danger border-danger/40',
  HIGH:     'bg-amber/15 text-amber border-amber/40',
  MODERATE: 'bg-warn/15 text-warn border-warn/40',
  LOW:      'bg-success/15 text-success border-success/40',
  NONE:     'bg-muted/10 text-muted border-muted/20',
}

export function SeverityBadge({ severity, size = 'sm' }: Props) {
  const pad = size === 'md' ? 'px-2.5 py-1 text-[11px]' : 'px-2 py-0.5 text-[10px]'
  return (
    <span
      className={`font-mono font-bold tracking-widest uppercase border rounded-sm inline-block ${pad} ${STYLES[severity]}`}
    >
      {severity}
    </span>
  )
}
