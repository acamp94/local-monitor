import { useMemo } from 'react'
import type { AsyncStatus, IntelItem, SourceStatus } from '@/types'
import { useAlerts } from '@/hooks/useAlerts'
import { useEarthquakes } from '@/hooks/useEarthquakes'
import { useGeocoding } from '@/hooks/useGeocoding'
import { useLocalData } from '@/hooks/useLocalData'
import { usePublicSafetyIncidents } from '@/hooks/usePublicSafetyIncidents'
import { useRiskIndex } from '@/hooks/useRiskIndex'
import { useWeather } from '@/hooks/useWeather'
import { getLocalInfoStatuses } from '@/data/localInfoSources'

function mapAlertSeverity(severity: string): IntelItem['severity'] {
  if (severity === 'Extreme') return 'CRITICAL'
  if (severity === 'Severe') return 'HIGH'
  if (severity === 'Moderate') return 'MODERATE'
  if (severity === 'Minor') return 'LOW'
  return 'NONE'
}

function statusKind(status: AsyncStatus, count?: number): SourceStatus['kind'] {
  if (status === 'idle') return 'idle'
  if (status === 'loading' || status === 'refreshing') return 'checking'
  if (status === 'error') return 'unavailable'
  return count && count > 0 ? 'ok' : 'empty'
}

export function useDashboardData(zip: string) {
  const geocoding = useGeocoding(zip)
  const weather = useWeather(geocoding.location)
  const alerts = useAlerts(geocoding.location)
  const earthquakes = useEarthquakes(geocoding.location)
  const publicSafety = usePublicSafetyIncidents(geocoding.location)
  const localData = useLocalData()
  const riskIndex = useRiskIndex(weather.data, alerts.alerts)

  const incidentItems: IntelItem[] = useMemo(() => {
    const fromAlerts: IntelItem[] = alerts.alerts.map(alert => ({
      id: alert.id,
      title: alert.event,
      summary: alert.headline ?? alert.description.slice(0, 120) ?? alert.areaDesc,
      source: 'NWS',
      severity: mapAlertSeverity(alert.severity),
      timestamp: alert.onset ? new Date(alert.onset) : alerts.fetchedAt ?? new Date(),
    }))

    const fromUserReports: IntelItem[] = localData.userReports.map(report => ({
      id: report.id,
      title: report.title,
      summary: report.body || report.category,
      source: 'LOCAL_NOTE',
      severity: 'MODERATE',
      timestamp: report.createdAt,
    }))

    const fromEarthquakes: IntelItem[] = earthquakes.earthquakes.map(event => ({
      id: event.id,
      title: event.magnitude == null ? event.title : `M ${event.magnitude.toFixed(1)} - ${event.place}`,
      summary: event.depthKm == null
        ? 'USGS event depth unavailable'
        : `USGS event · ${event.depthKm.toFixed(1)} km depth`,
      source: 'USGS',
      severity: event.magnitude == null
        ? 'LOW'
        : event.magnitude >= 6
          ? 'HIGH'
          : event.magnitude >= 4
            ? 'MODERATE'
            : 'LOW',
      timestamp: event.time,
      url: event.url ?? undefined,
    }))

    const fromPublicSafety: IntelItem[] = publicSafety.incidents.map(incident => ({
      id: incident.id,
      title: incident.title,
      summary: [
        incident.status,
        incident.address,
        incident.agencyName,
      ].filter(Boolean).join(' · ') || incident.category,
      source: incident.source,
      severity: incident.severity,
      timestamp: incident.timestamp,
      url: incident.url,
    }))

    return [
      ...fromAlerts,
      ...fromEarthquakes,
      ...fromPublicSafety,
      ...fromUserReports,
    ].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
  }, [
    alerts.alerts,
    alerts.fetchedAt,
    earthquakes.earthquakes,
    publicSafety.incidents,
    localData.userReports,
  ])

  const sourceStatuses: SourceStatus[] = useMemo(() => {
    const location = geocoding.location
    if (!location) {
      return [
        { id: 'weather', label: 'Weather', kind: 'idle', detail: 'Enter a ZIP to check local weather.' },
        { id: 'nws', label: 'NWS alerts', kind: 'idle', detail: 'Enter a ZIP to check active alerts.' },
        { id: 'usgs', label: 'USGS earthquakes', kind: 'idle', detail: 'Enter a ZIP to check nearby events.' },
      ]
    }

    return [
      {
        id: 'weather',
        label: 'Weather',
        kind: weather.status === 'success' && weather.data ? 'ok' : statusKind(weather.status),
        detail: weather.error ?? (weather.data
          ? `Checked current conditions for ${location.zip}.`
          : 'Checking current conditions...'),
        itemCount: weather.data ? 1 : 0,
        fetchedAt: weather.fetchedAt,
      },
      {
        id: 'nws',
        label: 'NWS alerts',
        kind: statusKind(alerts.status, alerts.alerts.length),
        detail: alerts.error ?? (alerts.status === 'success'
          ? `Checked: ${alerts.alerts.length} active alert${alerts.alerts.length !== 1 ? 's' : ''}.`
          : 'Checking active alerts...'),
        itemCount: alerts.alerts.length,
        fetchedAt: alerts.fetchedAt,
      },
      {
        id: 'usgs',
        label: 'USGS earthquakes',
        kind: statusKind(earthquakes.status, earthquakes.earthquakes.length),
        detail: earthquakes.error ?? (earthquakes.status === 'success'
          ? `Checked: ${earthquakes.earthquakes.length} nearby event${earthquakes.earthquakes.length !== 1 ? 's' : ''}.`
          : 'Checking nearby events...'),
        itemCount: earthquakes.earthquakes.length,
        fetchedAt: earthquakes.fetchedAt,
      },
      ...publicSafety.sourceStatuses,
      ...getLocalInfoStatuses(location),
    ]
  }, [
    alerts.alerts.length,
    alerts.error,
    alerts.fetchedAt,
    alerts.status,
    earthquakes.earthquakes.length,
    earthquakes.error,
    earthquakes.fetchedAt,
    earthquakes.status,
    geocoding.location,
    publicSafety.sourceStatuses,
    weather.data,
    weather.error,
    weather.fetchedAt,
    weather.status,
  ])

  return {
    geocoding,
    weather,
    alerts,
    earthquakes,
    publicSafety,
    localData,
    riskIndex,
    incidentItems,
    sourceStatuses,
  }
}
