import { AlertTriangle, X } from 'lucide-react'

interface Props {
  message: string
  section: string
  onDismiss: () => void
}

export function ErrorBanner({ message, section, onDismiss }: Props) {
  return (
    <div className="flex items-start gap-2 px-4 py-2 bg-amber/8 border-b border-amber/25 text-amber shrink-0">
      <AlertTriangle size={14} className="mt-0.5 shrink-0" aria-hidden="true" />
      <span className="text-xs font-mono flex-1">
        <span className="font-bold">[{section}]</span> {message}
      </span>
      <button onClick={onDismiss} aria-label={`Dismiss ${section} error`} className="text-amber/60 hover:text-amber transition-colors">
        <X size={14} aria-hidden="true" />
      </button>
    </div>
  )
}
