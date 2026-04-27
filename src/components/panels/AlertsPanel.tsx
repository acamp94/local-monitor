import { useState } from 'react'
import { AlertTriangle, CheckCircle, ChevronDown, ChevronUp } from 'lucide-react'
import { SeverityBadge } from '@/components/shared/SeverityBadge'
import { LoadingSkeleton } from '@/components/shared/LoadingSkeleton'
import { SourceLabel } from '@/components/shared/SourceLabel'
import type { AsyncStatus, NWSAlert, SeverityLevel } from '@/types'
import { format } from 'date-fns'

const ROW_BORDER: Record<SeverityLevel, string> = {
  CRITICAL: 'border-l-2 border-l-danger',
  HIGH:     'border-l-2 border-l-amber',
  MODERATE: 'border-l-2 border-l-warn',
  LOW:      'border-l-2 border-l-success',
  NONE:     'border-l-2 border-l-line',
}

interface Props {
  alerts: NWSAlert[]
  loading: boolean
  error: string | null
  status: AsyncStatus
  fetchedAt: Date | null
}

function mapNWSSeverity(s: string): SeverityLevel {
  if (s === 'Extreme') return 'CRITICAL'
  if (s === 'Severe') return 'HIGH'
  if (s === 'Moderate') return 'MODERATE'
  if (s === 'Minor') return 'LOW'
  return 'NONE'
}

function AlertRow({ alert }: { alert: NWSAlert }) {
  const [expanded, setExpanded] = useState(false)
  const severity = mapNWSSeverity(alert.severity)
  const expires = alert.expires ? format(new Date(alert.expires), 'MMM d HH:mm') : null

  return (
    <div className={`border-b border-line last:border-0 ${ROW_BORDER[severity]}`}>
      <button
        className="w-full text-left px-3 py-2 hover:bg-elevated transition-colors"
        onClick={() => setExpanded(e => !e)}
        aria-expanded={expanded}
        aria-label={`${expanded ? 'Collapse' : 'Expand'} NWS alert ${alert.event}`}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-1.5 flex-wrap">
            <SeverityBadge severity={severity} />
            <span className="font-mono text-[11px] text-primary font-medium">{alert.event}</span>
          </div>
          {expanded ? <ChevronUp size={12} className="text-muted shrink-0 mt-0.5" aria-hidden="true" /> : <ChevronDown size={12} className="text-muted shrink-0 mt-0.5" aria-hidden="true" />}
        </div>
        <div className="font-mono text-[10px] text-muted mt-0.5">{alert.areaDesc}</div>
        {expires && <div className="font-mono text-[10px] text-muted/70">Expires: {expires}</div>}
      </button>
      {expanded && (
        <div className="px-3 pb-2 space-y-1">
          {alert.headline && (
            <p className="font-mono text-[10px] text-secondary leading-relaxed">{alert.headline}</p>
          )}
          {alert.instruction && (
            <p className="font-mono text-[10px] text-amber leading-relaxed">{alert.instruction.slice(0, 200)}{alert.instruction.length > 200 ? '…' : ''}</p>
          )}
          <div className="font-mono text-[10px] text-muted">{alert.senderName}</div>
        </div>
      )}
    </div>
  )
}

export function AlertsPanel({ alerts, loading, error, status, fetchedAt }: Props) {
  return (
    <div className="bg-card border border-line rounded-sm shrink-0 flex flex-col max-h-52 card-raised">
      <div className="flex items-center justify-between px-3 py-2 border-b border-line shrink-0 bg-card-header">
        <div className="flex items-center gap-2">
          <AlertTriangle size={13} className="text-cyan" aria-hidden="true" />
          <span className="font-mono text-[10px] text-secondary tracking-widest uppercase">Active Alerts</span>
        </div>
        <div className="flex items-center gap-2">
          {loading && alerts.length > 0 && <span className="font-mono text-[9px] text-cyan">REFRESH</span>}
          <SourceLabel source="NWS" fetchedAt={fetchedAt ?? undefined} />
          <span className="font-mono text-[9px] text-muted bg-elevated border border-line px-1.5 py-0.5 rounded-sm">
            {alerts.length}
          </span>
        </div>
      </div>

      <div className="overflow-y-auto scrollbar-thin flex-1">
        {loading && alerts.length === 0 && <div className="p-3"><LoadingSkeleton lines={3} /></div>}
        {error && alerts.length === 0 && !loading && (
          <div className="p-3 font-mono text-[10px] text-muted text-center">{error}</div>
        )}
        {error && alerts.length > 0 && (
          <div className="px-3 py-1.5 font-mono text-[9px] text-amber border-b border-line">
            {error}
          </div>
        )}
        {!loading && !error && status === 'success' && alerts.length === 0 && (
          <div className="flex flex-col items-center justify-center gap-1 py-4">
            <CheckCircle size={18} className="text-success" aria-hidden="true" />
            <span className="font-mono text-[10px] text-success">No Active Alerts</span>
            <span className="font-mono text-[9px] text-muted">No active NWS alerts for this point</span>
          </div>
        )}
        {status === 'idle' && alerts.length === 0 && (
          <div className="p-3 font-mono text-[10px] text-muted text-center">Enter a ZIP to check NWS alerts</div>
        )}
        {alerts.map(alert => (
          <AlertRow key={alert.id} alert={alert} />
        ))}
      </div>
    </div>
  )
}
