import { useState } from 'react'
import { List, Plus, X, Trash2, Send } from 'lucide-react'
import { SeverityBadge } from '@/components/shared/SeverityBadge'
import { LoadingSkeleton } from '@/components/shared/LoadingSkeleton'
import { formatRelativeTime } from '@/utils/formatters'
import type { IntelItem } from '@/types'

const REPORT_CATEGORIES = [
  'Road Hazard',
  'Flooding',
  'Power Issue',
  'Infrastructure',
  'Community Note',
  'Preparedness',
  'Other',
]

const SOURCE_CHIP: Record<string, string> = {
  NWS:     'text-cyan bg-cyan/10 border-cyan/30',
  LOCAL:   'text-success bg-success/10 border-success/30',
}

const ROW_BORDER: Record<string, string> = {
  NWS:     'border-l-2 border-l-cyan',
  LOCAL:   'border-l-2 border-l-success',
}

interface AddReportFormProps {
  onSubmit: (title: string, category: string, body: string) => void
  onCancel: () => void
  hasLocation: boolean
}

function AddReportForm({ onSubmit, onCancel, hasLocation }: AddReportFormProps) {
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState(REPORT_CATEGORIES[0])
  const [body, setBody] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return
    onSubmit(title.trim(), category, body.trim())
    setTitle('')
    setCategory(REPORT_CATEGORIES[0])
    setBody('')
  }

  return (
    <form onSubmit={handleSubmit} className="border-b border-line bg-elevated p-3 space-y-2">
      <div className="flex items-center justify-between mb-1">
        <span className="font-mono text-[10px] text-cyan tracking-widest uppercase">New Local Report</span>
        <button type="button" onClick={onCancel} aria-label="Close local report form" className="text-muted hover:text-primary transition-colors">
          <X size={13} aria-hidden="true" />
        </button>
      </div>

      <div className="font-mono text-[9px] text-amber bg-amber/8 border border-amber/25 rounded-sm px-2 py-1">
        {hasLocation
          ? 'Local note only - no external feed or map position is created'
          : 'No ZIP loaded - saved as local note only'}
      </div>

      <div className="grid grid-cols-2 gap-2">
        <input
          type="text"
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="Report title *"
          aria-label="Local report title"
          required
          maxLength={80}
          className="col-span-2 bg-card border border-line rounded-sm px-2 py-1.5 font-mono text-xs text-primary placeholder-muted focus:border-cyan focus:outline-none focus:ring-1 focus:ring-cyan/20 transition-colors"
        />
        <select
          value={category}
          onChange={e => setCategory(e.target.value)}
          aria-label="Local report category"
          className="col-span-2 bg-card border border-line rounded-sm px-2 py-1.5 font-mono text-xs text-primary focus:border-cyan focus:outline-none focus:ring-1 focus:ring-cyan/20 transition-colors appearance-none cursor-pointer"
        >
          {REPORT_CATEGORIES.map(c => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      <textarea
        value={body}
        onChange={e => setBody(e.target.value)}
        placeholder="Additional notes (optional)"
        aria-label="Additional local report notes"
        rows={2}
        maxLength={300}
        className="w-full bg-card border border-line rounded-sm px-2 py-1.5 font-mono text-xs text-primary placeholder-muted focus:border-cyan focus:outline-none focus:ring-1 focus:ring-cyan/20 transition-colors resize-none"
      />

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={!title.trim()}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-cyan/10 border border-cyan/40 text-cyan font-mono text-[10px] tracking-wider rounded-sm hover:bg-cyan/20 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Send size={11} aria-hidden="true" />
          SAVE NOTE
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-3 py-1.5 border border-line text-muted font-mono text-[10px] rounded-sm hover:text-primary hover:border-line-accent transition-colors"
        >
          CANCEL
        </button>
      </div>
    </form>
  )
}

interface IncidentRowProps {
  item: IntelItem
  onDelete?: () => void
}

function IncidentRow({ item, onDelete }: IncidentRowProps) {
  const isUserReport = item.source === 'LOCAL'
  return (
    <div className={`px-3 py-2 hover:bg-elevated transition-colors group relative ${ROW_BORDER[item.source] ?? 'border-l-2 border-l-line'}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-1.5 flex-wrap min-w-0">
          <span className={`font-mono text-[9px] font-bold tracking-wider uppercase border px-1.5 py-0.5 rounded-sm shrink-0 ${SOURCE_CHIP[item.source] ?? SOURCE_CHIP['LOCAL']}`}>
            {item.source}
          </span>
          {isUserReport && (
            <span className="font-mono text-[9px] text-success bg-success/10 border border-success/30 px-1.5 py-0.5 rounded-sm">YOU</span>
          )}
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <SeverityBadge severity={item.severity} />
          {isUserReport && onDelete && (
            <button
              onClick={onDelete}
              aria-label={`Delete report ${item.title}`}
              className="opacity-0 group-hover:opacity-100 text-muted hover:text-danger transition-all ml-1"
              title="Delete report"
            >
              <Trash2 size={11} aria-hidden="true" />
            </button>
          )}
        </div>
      </div>
      <div className="font-mono text-[11px] text-primary font-medium leading-snug mt-1 pr-2">{item.title}</div>
      {item.summary && (
        <div className="font-mono text-[10px] text-muted leading-snug mt-0.5 line-clamp-2">{item.summary}</div>
      )}
      <div className="font-mono text-[9px] text-muted mt-1">{formatRelativeTime(item.timestamp)}</div>
    </div>
  )
}

interface Props {
  items: IntelItem[]
  loading: boolean
  hasLocation: boolean
  onAddReport: (title: string, category: string, body: string) => void
  onDeleteReport?: (id: string) => void
}

export function IncidentList({ items, loading, hasLocation, onAddReport, onDeleteReport }: Props) {
  const [showForm, setShowForm] = useState(false)

  const handleSubmit = (title: string, category: string, body: string) => {
    onAddReport(title, category, body)
    setShowForm(false)
  }

  return (
    <div className="bg-card border border-line rounded-sm flex flex-col overflow-hidden card-raised">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-line shrink-0 bg-card-header">
        <div className="flex items-center gap-2">
          <List size={13} className="text-cyan" aria-hidden="true" />
          <span className="font-mono text-[10px] text-secondary tracking-widest uppercase">Local Intel List</span>
          <span className="font-mono text-[9px] text-muted bg-elevated border border-line px-1.5 py-0.5 rounded-sm">
            {items.length}
          </span>
        </div>
        <button
          onClick={() => setShowForm(v => !v)}
          aria-label={showForm ? 'Close local report form' : 'Add local note'}
          aria-expanded={showForm}
          className={`flex items-center gap-1 px-2 py-1 font-mono text-[9px] tracking-wider rounded-sm border transition-colors ${
            showForm
              ? 'bg-cyan/15 border-cyan/50 text-cyan'
              : 'border-line text-muted hover:text-cyan hover:border-cyan/40'
          }`}
        >
          <Plus size={11} aria-hidden="true" />
          ADD NOTE
        </button>
      </div>

      {/* Add report form */}
      {showForm && (
        <AddReportForm
          onSubmit={handleSubmit}
          onCancel={() => setShowForm(false)}
          hasLocation={hasLocation}
        />
      )}

      {/* List */}
      <div className="flex-1 overflow-y-auto scrollbar-thin divide-y divide-line min-h-0">
        {loading && (
          <div className="p-3"><LoadingSkeleton lines={5} /></div>
        )}
        {!loading && items.length === 0 && (
          <div className="flex flex-col items-center justify-center py-6 gap-1 text-muted">
            <List size={20} className="opacity-30" aria-hidden="true" />
            <span className="font-mono text-xs">No local intel items</span>
            <span className="font-mono text-[10px]">{hasLocation ? 'No NWS alerts or local notes to show' : 'Enter a ZIP to load NWS alerts'}</span>
          </div>
        )}
        {!loading && items.map(item => (
          <IncidentRow
            key={item.id}
            item={item}
            onDelete={item.source === 'LOCAL' && onDeleteReport
              ? () => onDeleteReport(item.id)
              : undefined
            }
          />
        ))}
      </div>
    </div>
  )
}
