import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { SeverityBadge } from '@/components/shared/SeverityBadge'
import { LoadingSkeleton } from '@/components/shared/LoadingSkeleton'
import type { SeverityLevel } from '@/types'

interface Props {
  icon: LucideIcon
  label: string
  value: string
  subvalue?: string
  severity?: SeverityLevel
  trend?: 'up' | 'down' | 'stable'
  trendLabel?: string
  loading?: boolean
}

const ICON_COLOR: Record<SeverityLevel, string> = {
  CRITICAL: 'text-danger',
  HIGH:     'text-amber',
  MODERATE: 'text-warn',
  LOW:      'text-success',
  NONE:     'text-cyan',
}

export function KPICard({ icon: Icon, label, value, subvalue, severity = 'NONE', trend, trendLabel, loading }: Props) {
  const iconColor = ICON_COLOR[severity]

  if (loading) {
    return (
      <div className="bg-card border border-line rounded-sm flex flex-col min-w-0 min-h-[5.5rem] overflow-hidden card-raised">
        <div className="bg-card-header px-3 py-1.5 border-b border-line">
          <LoadingSkeleton lines={1} />
        </div>
        <div className="flex-1 p-3">
          <LoadingSkeleton lines={2} />
        </div>
      </div>
    )
  }

  return (
    <div className="bg-card border border-line rounded-sm flex flex-col min-w-0 min-h-[5.5rem] relative overflow-hidden group hover:border-line-accent transition-colors card-raised">
      {/* Severity top accent bar */}
      {severity !== 'NONE' && (
        <div className={`absolute top-0 left-0 right-0 h-px ${
          severity === 'CRITICAL' ? 'bg-danger' :
          severity === 'HIGH' ? 'bg-amber' :
          severity === 'MODERATE' ? 'bg-warn' : 'bg-success'
        }`} />
      )}

      {/* Header section */}
      <div className="bg-card-header px-2 sm:px-3 pt-2 pb-1.5 border-b border-line flex items-center justify-between gap-1 shrink-0 min-w-0">
        <div className="flex items-center gap-1.5 min-w-0">
          <Icon size={12} className={iconColor} />
          <span className="font-mono text-[10px] text-secondary tracking-widest uppercase truncate min-w-0">{label}</span>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {severity !== 'NONE' && <SeverityBadge severity={severity} />}
        </div>
      </div>

      {/* Value section */}
      <div className="flex flex-col items-center justify-center flex-1 gap-0.5 py-2 px-2">
        <div className="font-mono font-bold text-xl sm:text-2xl text-primary leading-none tracking-tight max-w-full truncate">
          {value}
        </div>
        {subvalue && (
          <div className="font-mono text-[10px] text-secondary text-center leading-snug">{subvalue}</div>
        )}
        {trend && (
          <div className={`flex items-center gap-0.5 mt-0.5 ${
            trend === 'up' ? 'text-danger' : trend === 'down' ? 'text-success' : 'text-muted'
          }`}>
            {trend === 'up' ? <TrendingUp size={11} /> : trend === 'down' ? <TrendingDown size={11} /> : <Minus size={11} />}
            {trendLabel && <span className="font-mono text-[9px]">{trendLabel}</span>}
          </div>
        )}
      </div>
    </div>
  )
}
