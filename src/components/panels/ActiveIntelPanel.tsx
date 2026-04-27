import { Radio } from 'lucide-react'
import { SeverityBadge } from '@/components/shared/SeverityBadge'
import { LoadingSkeleton } from '@/components/shared/LoadingSkeleton'
import { formatRelativeTime } from '@/utils/formatters'
import type { IntelItem, IntelSource } from '@/types'

interface Props {
  items: IntelItem[]
  loading: boolean
}

const SOURCE_COLOR: Record<IntelSource, string> = {
  NWS:     'text-cyan bg-cyan/10 border-cyan/30',
  USGS:    'text-amber bg-amber/10 border-amber/30',
  PULSEPOINT: 'text-danger bg-danger/10 border-danger/30',
  SOCRATA: 'text-warn bg-warn/10 border-warn/30',
  ARCGIS: 'text-warn bg-warn/10 border-warn/30',
  LOCAL_NOTE: 'text-success bg-success/10 border-success/30',
}

function IntelItemRow({ item }: { item: IntelItem }) {
  return (
    <div className="px-3 py-2 hover:bg-elevated transition-colors">
      <div className="flex items-start justify-between gap-2 mb-0.5">
        <span className={`font-mono text-[8px] font-bold tracking-wider uppercase border px-1.5 py-0.5 rounded-sm shrink-0 ${SOURCE_COLOR[item.source]}`}>
          {item.source === 'LOCAL_NOTE' ? 'LOCAL NOTE' : item.source}
        </span>
        <SeverityBadge severity={item.severity} />
      </div>
      <div className="font-mono text-[11px] text-primary leading-snug mt-1">{item.title}</div>
      <div className="font-mono text-[10px] text-muted leading-snug mt-0.5 line-clamp-2">{item.summary}</div>
      <div className="font-mono text-[9px] text-muted mt-1">{formatRelativeTime(item.timestamp)}</div>
    </div>
  )
}

export function ActiveIntelPanel({ items, loading }: Props) {
  return (
    <div className="bg-card border border-line rounded-sm flex flex-col flex-1 min-h-0 overflow-hidden">
      <div className="flex items-center justify-between p-3 border-b border-line shrink-0">
        <div className="flex items-center gap-2">
          <Radio size={13} className="text-cyan" style={{ animation: 'blink 2s ease-in-out infinite' }} />
          <span className="font-mono text-[10px] text-secondary tracking-widest uppercase">Live Feed</span>
        </div>
        <span className="font-mono text-[9px] text-muted bg-elevated border border-line px-1.5 py-0.5 rounded-sm">
          {items.length} ITEMS
        </span>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin divide-y divide-line">
        {loading && (
          <div className="p-3">
            <LoadingSkeleton lines={6} />
          </div>
        )}
        {!loading && items.length === 0 && (
          <div className="flex flex-col items-center justify-center h-20 text-muted">
            <span className="font-mono text-xs">No active intel items</span>
          </div>
        )}
        {!loading && items.map(item => (
          <IntelItemRow key={item.id} item={item} />
        ))}
      </div>
    </div>
  )
}
