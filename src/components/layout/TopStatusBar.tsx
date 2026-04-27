import { useState, useEffect } from 'react'
import { Activity } from 'lucide-react'
import { formatSystemTime, formatRelativeTime } from '@/utils/formatters'
import { SeverityBadge } from '@/components/shared/SeverityBadge'
import type { SeverityLevel } from '@/types'

interface Props {
  threatLevel: SeverityLevel
  lastSync: Date | null
}

const THREAT_BORDER: Record<SeverityLevel, string> = {
  CRITICAL: 'border-b-danger',
  HIGH:     'border-b-amber',
  MODERATE: 'border-b-warn',
  LOW:      'border-b-success',
  NONE:     'border-b-line',
}

export function TopStatusBar({ threatLevel, lastSync }: Props) {
  const [now, setNow] = useState(new Date())

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])

  return (
    <div className={`h-9 bg-page border-b flex items-center justify-between gap-2 px-2 sm:px-4 shrink-0 min-w-0 transition-colors ${THREAT_BORDER[threatLevel]}`}>
      <div className="flex items-center gap-2 min-w-0">
        <span
          className="w-1.5 h-1.5 rounded-full bg-cyan shrink-0"
          style={{ animation: 'blink 2s ease-in-out infinite' }}
          aria-hidden="true"
        />
        <Activity size={11} className="text-cyan shrink-0" aria-hidden="true" />
        <span className="font-mono text-[10px] text-secondary tracking-widest hidden sm:inline">SITUATION MONITOR v1.0</span>
      </div>

      <span className="font-mono text-[13px] text-cyan tracking-widest select-none truncate font-bold tabular-nums">
        {formatSystemTime(now)}
      </span>

      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        {lastSync && (
          <span className="font-mono text-[10px] text-secondary tracking-wider hidden md:inline">
            SYNC: {formatRelativeTime(lastSync).toUpperCase()}
          </span>
        )}
        <div className="hidden sm:flex items-center gap-1.5">
          <span className="font-mono text-[10px] text-muted tracking-wider">THREAT:</span>
          <SeverityBadge severity={threatLevel} />
        </div>
      </div>
    </div>
  )
}
