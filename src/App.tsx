import { useState, useEffect, useCallback } from 'react'
import {
  Thermometer, AlertTriangle, Wind, Droplets, ShieldAlert,
  List, LayoutDashboard, CloudLightning,
  FileText, Settings,
} from 'lucide-react'

import { TopStatusBar } from '@/components/layout/TopStatusBar'
import { LeftNav } from '@/components/layout/LeftNav'
import { Header } from '@/components/layout/Header'
import { ErrorBanner } from '@/components/shared/ErrorBanner'
import { KPICard } from '@/components/cards/KPICard'
import { IncidentList } from '@/components/panels/IncidentList'
import { WeatherDetailPanel } from '@/components/panels/WeatherDetailPanel'
import { AlertsPanel } from '@/components/panels/AlertsPanel'
import { RiskIndexPanel } from '@/components/panels/RiskIndexPanel'
import { OperationalMap } from '@/components/map/OperationalMap'

import { useDashboardData } from '@/hooks/useDashboardData'

import { formatTemp, formatWMOCode } from '@/utils/formatters'
import type { NavSection } from '@/types'

function useLocalStorageState<T>(key: string, initial: T): [T, (v: T) => void] {
  const [state, setState] = useState<T>(() => {
    try { const s = localStorage.getItem(key); return s ? JSON.parse(s) as T : initial } catch { return initial }
  })
  const set = useCallback((v: T) => {
    setState(v)
    try { localStorage.setItem(key, JSON.stringify(v)) } catch { /* ignore */ }
  }, [key])
  return [state, set]
}

const NAV_ITEMS_MOBILE = [
  { id: 'overview' as NavSection, icon: LayoutDashboard, label: 'Overview' },
  { id: 'weather'  as NavSection, icon: CloudLightning,  label: 'Weather' },
  { id: 'alerts'   as NavSection, icon: AlertTriangle,   label: 'Alerts' },
  { id: 'reports'  as NavSection, icon: FileText,        label: 'Reports' },
  { id: 'settings' as NavSection, icon: Settings,        label: 'Settings' },
]

function sectionDescription(section: NavSection): string {
  if (section === 'overview') return 'Overview dashboard'
  if (section === 'weather') return 'Weather and alert panels are available on wider screens'
  if (section === 'alerts') return 'NWS alerts are shown when a ZIP is loaded'
  if (section === 'reports') return 'Local notes and NWS alerts'
  return 'Configuration panel is not available in this static dashboard'
}

export default function App() {
  const [zip, setZip] = useLocalStorageState<string>('monitor-zip', '')
  const [activeSection, setActiveSection] = useState<NavSection>('overview')
  const [dismissedErrors, setDismissedErrors] = useState<Set<string>>(new Set())

  const {
    geocoding,
    weather,
    alerts,
    earthquakes,
    localData,
    riskIndex,
    incidentItems,
  } = useDashboardData(zip)

  const dismiss = useCallback((key: string) => {
    setDismissedErrors(prev => new Set([...prev, key]))
  }, [])

  useEffect(() => setDismissedErrors(new Set()), [zip])
  useEffect(() => { if (geocoding.error) setDismissedErrors(p => { const n = new Set(p); n.delete('geo'); return n }) }, [geocoding.error])
  useEffect(() => { if (weather.error) setDismissedErrors(p => { const n = new Set(p); n.delete('weather'); return n }) }, [weather.error])
  useEffect(() => { if (alerts.error) setDismissedErrors(p => { const n = new Set(p); n.delete('alerts'); return n }) }, [alerts.error])
  useEffect(() => { if (earthquakes.error) setDismissedErrors(p => { const n = new Set(p); n.delete('earthquakes'); return n }) }, [earthquakes.error])

  const hasApiError = Boolean(geocoding.error || weather.error || alerts.error || earthquakes.error)
  const hasLiveWeather = weather.status === 'success' && Boolean(weather.data)
  const hasLiveAlerts = alerts.status === 'success'
  const hasLiveEarthquakes = earthquakes.status === 'success'
  const lastExternalSync = [weather.fetchedAt, alerts.fetchedAt, earthquakes.fetchedAt]
    .filter((date): date is Date => date instanceof Date)
    .sort((a, b) => b.getTime() - a.getTime())[0] ?? null
  const windSeverity = weather.data
    ? weather.data.current.wind_speed_10m >= 50
      ? 'HIGH'
      : weather.data.current.wind_speed_10m >= 30
        ? 'MODERATE'
        : weather.data.current.wind_speed_10m >= 15
          ? 'LOW'
          : 'NONE'
    : 'NONE'

  return (
    <div className="flex flex-col h-screen w-full max-w-full overflow-hidden bg-page">
      <TopStatusBar threatLevel={riskIndex.overallSeverity} lastSync={lastExternalSync} />

      <div className="flex flex-1 overflow-hidden min-h-0">
        <LeftNav activeSection={activeSection} onNavigate={setActiveSection} />

        <main className="flex flex-col flex-1 overflow-hidden min-w-0">
          <Header
            zip={zip}
            onZipChange={setZip}
            location={geocoding.location}
            loading={geocoding.loading}
            source={geocoding.source}
            hasError={hasApiError}
            weatherReady={hasLiveWeather}
            alertsReady={hasLiveAlerts}
            earthquakesReady={hasLiveEarthquakes}
          />

          {/* Threat level bar */}
          <div className={`h-0.5 shrink-0 transition-colors ${
            riskIndex.overallSeverity === 'CRITICAL' ? 'bg-danger' :
            riskIndex.overallSeverity === 'HIGH'     ? 'bg-amber' :
            riskIndex.overallSeverity === 'MODERATE' ? 'bg-warn' :
            riskIndex.overallSeverity === 'LOW'      ? 'bg-success' : 'bg-line'
          }`} />

          {/* Error banners */}
          {geocoding.error && !dismissedErrors.has('geo') && <ErrorBanner message={geocoding.error} section="GEO" onDismiss={() => dismiss('geo')} />}
          {weather.error && !dismissedErrors.has('weather') && <ErrorBanner message={weather.error} section="WEATHER" onDismiss={() => dismiss('weather')} />}
          {alerts.error && !dismissedErrors.has('alerts') && <ErrorBanner message={alerts.error} section="ALERTS" onDismiss={() => dismiss('alerts')} />}
          {earthquakes.error && !dismissedErrors.has('earthquakes') && <ErrorBanner message={earthquakes.error} section="USGS" onDismiss={() => dismiss('earthquakes')} />}

          {/* KPI Row */}
          <div className="grid grid-cols-[repeat(2,minmax(0,1fr))] lg:grid-cols-[repeat(5,minmax(0,1fr))] gap-2 px-2 sm:px-3 py-2 shrink-0 min-w-0 max-w-full overflow-hidden">
            <KPICard
              icon={Thermometer}
              label="Temperature"
              value={weather.data ? formatTemp(weather.data.current.temperature_2m) : '—'}
              subvalue={weather.data ? formatWMOCode(weather.data.current.weather_code) : geocoding.location ? 'Awaiting Open-Meteo' : 'Awaiting ZIP'}
              severity={riskIndex.weather.severity}
              loading={weather.loading && !weather.data}
            />
            <KPICard
              icon={AlertTriangle}
              label="Active Alerts"
              value={alerts.loading && !alerts.alerts.length ? '…' : String(alerts.alerts.length)}
              subvalue={
                alerts.alerts.length
                  ? `Highest: ${alerts.alerts[0]?.severity}`
                  : alerts.status === 'success'
                    ? 'NWS area clear'
                    : geocoding.location
                      ? 'Checking NWS'
                      : 'Awaiting ZIP'
              }
              severity={riskIndex.alerts.severity}
              loading={alerts.loading && !alerts.alerts.length}
            />
            <KPICard
              icon={Wind}
              label="Wind"
              value={weather.data ? `${Math.round(weather.data.current.wind_speed_10m)} mph` : '—'}
              subvalue={weather.data ? 'Open-Meteo current' : geocoding.location ? 'Awaiting Open-Meteo' : 'Awaiting ZIP'}
              severity={windSeverity}
              loading={weather.loading && !weather.data}
            />
            <KPICard
              icon={Droplets}
              label="Humidity"
              value={weather.data ? `${weather.data.current.relative_humidity_2m}%` : '—'}
              subvalue={weather.data ? `Precip ${weather.data.current.precipitation.toFixed(1)} mm` : geocoding.location ? 'Awaiting Open-Meteo' : 'Awaiting ZIP'}
              severity="NONE"
              loading={weather.loading && !weather.data}
            />
            <KPICard
              icon={List}
              label="Live Feed"
              value={String(incidentItems.length)}
              subvalue={`${alerts.alerts.length} NWS · ${earthquakes.earthquakes.length} USGS · ${localData.userReports.length} local`}
              severity="NONE"
            />
          </div>

          {/* ── Main content ─────────────────────────────────────────── */}
          <div className="flex flex-1 flex-col lg:flex-row gap-2 px-2 sm:px-3 pb-16 sm:pb-2 overflow-y-auto overflow-x-hidden lg:overflow-hidden min-h-0">

            {/* Center column: map (flex-1) + incident list (fixed height) */}
            <div className="flex flex-col flex-1 gap-2 overflow-hidden min-w-0 min-h-0">
              {/* Operational map */}
              <div className="flex-1 relative overflow-hidden corner-bracket min-h-[45vh] lg:min-h-0">
                <OperationalMap
                  location={geocoding.location}
                  alerts={alerts.alerts}
                  earthquakes={earthquakes.earthquakes}
                  userReports={localData.userReports}
                />
              </div>

              {/* Incident list — sits below the map */}
              <div className="h-52 sm:h-48 shrink-0">
                <IncidentList
                  items={incidentItems}
                  loading={(alerts.loading || earthquakes.loading) && !incidentItems.length}
                  hasLocation={!!geocoding.location}
                  onAddReport={localData.addReport}
                  onDeleteReport={localData.deleteUserReport}
                />
              </div>
            </div>

            {/* Right sidebar — visible at lg: breakpoint */}
            <div className="hidden lg:flex w-80 flex-col gap-2 overflow-y-auto scrollbar-thin shrink-0 min-h-0 pb-0.5">
              {/* Weather card */}
              <WeatherDetailPanel data={weather.data} loading={weather.loading} error={weather.error} refreshing={weather.refreshing} />

              {/* NWS Alerts */}
              <AlertsPanel alerts={alerts.alerts} loading={alerts.loading} error={alerts.error} status={alerts.status} fetchedAt={alerts.fetchedAt} />

              {/* Risk index */}
              <RiskIndexPanel riskIndex={riskIndex} />
            </div>

          </div>
        </main>
      </div>

      {/* Mobile bottom nav */}
      <div className="sr-only" aria-live="polite">{sectionDescription(activeSection)}</div>
      <nav className="sm:hidden fixed bottom-0 left-0 right-0 h-14 bg-card border-t border-line flex items-center justify-around z-50" aria-label="Dashboard sections">
        {NAV_ITEMS_MOBILE.map(({ id, icon: Icon, label }) => (
          <button
            key={id}
            onClick={() => setActiveSection(id)}
            aria-label={`Show ${label}`}
            aria-current={activeSection === id ? 'page' : undefined}
            className={`flex flex-col items-center gap-0.5 p-2 transition-colors ${
              activeSection === id ? 'text-cyan' : 'text-muted'
            }`}
          >
            <Icon size={18} />
            <span className="font-mono text-[8px] tracking-wider">{label.toUpperCase()}</span>
          </button>
        ))}
      </nav>
    </div>
  )
}
