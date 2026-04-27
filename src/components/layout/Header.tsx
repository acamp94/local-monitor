import { useState } from 'react'
import { ShieldAlert, Search, Loader2, MapPin, Wifi } from 'lucide-react'
import type { GeoLocation } from '@/types'

interface Props {
  zip: string
  onZipChange: (zip: string) => void
  location: GeoLocation | null
  loading: boolean
  source: string
  hasError: boolean
  weatherReady: boolean
  alertsReady: boolean
}

export function Header({ zip, onZipChange, location, loading, source, hasError, weatherReady, alertsReady }: Props) {
  const [input, setInput] = useState(zip)
  const hasSubmittedZip = /^\d{5}$/.test(zip)
  const isInvalidZip = hasSubmittedZip && !location && !loading
  const apiStatus = !hasSubmittedZip
    ? 'AWAITING ZIP'
    : hasError
      ? 'API ISSUE'
      : loading
        ? 'LOCATING'
        : location
          ? 'LOCATION READY'
          : 'ZIP NOT FOUND'
  const dataStatus = location
    ? weatherReady && alertsReady
      ? 'LIVE WX/NWS'
      : 'PARTIAL DATA'
    : 'NO AREA DATA'

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (/^\d{5}$/.test(input)) onZipChange(input)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, '').slice(0, 5)
    setInput(val)
    if (val.length === 5) onZipChange(val)
  }

  return (
    <div className="h-14 bg-card border-b border-line flex items-center gap-2 sm:gap-4 px-2 sm:px-5 shrink-0 min-w-0">
      {/* Logo */}
      <div className="flex flex-col justify-center shrink-0">
        <div className="flex items-center gap-2">
          <ShieldAlert size={20} className="text-cyan" />
          <span className="font-mono font-bold text-sm text-primary tracking-widest hidden md:block">
            LOCAL<span className="text-cyan">MONITOR</span>
          </span>
        </div>
        <span className="font-mono text-[9px] text-muted tracking-[0.15em] uppercase hidden md:block pl-7">
          Situation Monitor
        </span>
      </div>

      <div className="w-px h-6 bg-line shrink-0 hidden sm:block" />

      {/* ZIP Search */}
      <form onSubmit={handleSubmit} className="flex flex-col justify-center shrink-0 gap-0.5" aria-label="Target ZIP search">
        <label htmlFor="target-zip" className="font-mono text-[9px] text-muted tracking-widest uppercase hidden sm:block">Target ZIP</label>
        <div className="relative">
          <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted" aria-hidden="true" />
          {loading && (
            <Loader2 size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-cyan animate-spin" aria-hidden="true" />
          )}
          <input
            id="target-zip"
            type="text"
            inputMode="numeric"
            aria-label="Target ZIP code"
            aria-invalid={isInvalidZip}
            aria-describedby="zip-status"
            value={input}
            onChange={handleChange}
            placeholder="00000"
            maxLength={5}
            className="bg-elevated border border-line rounded-sm pl-8 pr-8 py-1.5 font-mono text-sm text-primary placeholder-muted focus:border-cyan focus:outline-none focus:ring-1 focus:ring-cyan/25 w-28 sm:w-32 transition-colors"
          />
        </div>
      </form>

      {/* Location display */}
      {location && (
        <div className="flex items-center gap-1.5 min-w-0">
          <MapPin size={11} className="text-cyan shrink-0" aria-hidden="true" />
          <span className="font-mono text-xs text-secondary truncate">
            {location.city}, {location.state}
          </span>
          <span className="font-mono text-[10px] text-muted hidden md:block">
            {location.lat.toFixed(3)}°N {Math.abs(location.lon).toFixed(3)}°W
          </span>
        </div>
      )}

      {isInvalidZip && (
        <span id="zip-status" className="font-mono text-xs text-danger shrink min-w-0 truncate">ZIP not found</span>
      )}

      <div className="ml-auto flex items-center gap-2 shrink-0">
        <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 border border-line rounded-sm bg-elevated">
          <Wifi size={10} className={hasError || isInvalidZip ? 'text-amber' : location ? 'text-success' : 'text-muted'} aria-hidden="true" />
          <span className="font-mono text-[10px] text-muted tracking-wider">{apiStatus}</span>
        </div>
        <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 border border-line rounded-sm bg-elevated">
          <span
            className={`w-1.5 h-1.5 rounded-full shrink-0 ${location && weatherReady && alertsReady ? 'bg-success' : hasError ? 'bg-amber' : 'bg-muted'}`}
            style={loading ? { animation: 'blink 2s ease-in-out infinite' } : undefined}
            aria-hidden="true"
          />
          <span className="font-mono text-[10px] text-muted tracking-wider">{dataStatus}</span>
        </div>
      </div>
    </div>
  )
}
