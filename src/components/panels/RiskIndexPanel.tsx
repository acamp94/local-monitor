import { ShieldAlert } from 'lucide-react'
import type { RiskIndex, SeverityLevel } from '@/types'

interface Props {
  riskIndex: RiskIndex
}

const SCORE_COLOR: Record<SeverityLevel, string> = {
  CRITICAL: '#ef4444',
  HIGH:     '#f59e0b',
  MODERATE: '#eab308',
  LOW:      '#22c55e',
  NONE:     '#64748b',
}

const SCORE_TEXT: Record<SeverityLevel, string> = {
  CRITICAL: 'text-danger',
  HIGH:     'text-amber',
  MODERATE: 'text-warn',
  LOW:      'text-success',
  NONE:     'text-muted',
}

function MetricRow({ metric }: { metric: { label: string; score: number; severity: SeverityLevel; detail: string } }) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="font-mono text-[10px] text-secondary tracking-wider uppercase">{metric.label}</span>
        <span className={`font-mono text-[11px] font-bold tabular-nums ${SCORE_TEXT[metric.severity]}`}>{metric.score}</span>
      </div>
      <div className="h-1 bg-page rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${metric.score}%`, backgroundColor: SCORE_COLOR[metric.severity] }}
        />
      </div>
      <div className="font-mono text-[9px] text-muted truncate">{metric.detail}</div>
    </div>
  )
}

export function RiskIndexPanel({ riskIndex }: Props) {
  const compositeLabel = riskIndex.weather.detail === 'No data'
    ? 'NO DATA'
    : riskIndex.overall === 0
      ? 'NORMAL'
      : riskIndex.overallSeverity

  return (
    <div className="bg-card border border-line rounded-sm shrink-0 card-raised">
      <div className="flex items-center gap-2 px-3 py-2 border-b border-line bg-card-header">
        <ShieldAlert size={13} className="text-cyan" />
        <span className="font-mono text-[10px] text-secondary tracking-widest uppercase">Risk Index</span>
      </div>
      {/* Composite score */}
      <div className="flex items-center justify-between px-3 py-3 border-b border-line">
        <span className="font-mono text-[10px] text-muted tracking-widest uppercase">Composite Score</span>
        <div className={`font-mono text-3xl font-bold leading-none tabular-nums ${SCORE_TEXT[riskIndex.overallSeverity]}`}>
          {riskIndex.overall}
          <span className="text-[11px] text-muted font-normal ml-1">/100</span>
          <div className="font-mono text-[9px] text-muted font-normal tracking-widest text-right mt-0.5">{compositeLabel}</div>
        </div>
      </div>
      <div className="p-3 space-y-3">
        <MetricRow metric={riskIndex.weather} />
        <MetricRow metric={riskIndex.alerts} />
      </div>
    </div>
  )
}
