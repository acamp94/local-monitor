import { useMemo } from 'react'
import type { IntelItem } from '@/types'
import { useAlerts } from '@/hooks/useAlerts'
import { useEarthquakes } from '@/hooks/useEarthquakes'
import { useGeocoding } from '@/hooks/useGeocoding'
import { useLocalData } from '@/hooks/useLocalData'
import { useRiskIndex } from '@/hooks/useRiskIndex'
import { useWeather } from '@/hooks/useWeather'

function mapAlertSeverity(severity: string): IntelItem['severity'] {
  if (severity === 'Extreme') return 'CRITICAL'
  if (severity === 'Severe') return 'HIGH'
  if (severity === 'Moderate') return 'MODERATE'
  if (severity === 'Minor') return 'LOW'
  return 'NONE'
}

export function useDashboardData(zip: string) {
  const geocoding = useGeocoding(zip)
  const weather = useWeather(geocoding.location)
  const alerts = useAlerts(geocoding.location)
  const earthquakes = useEarthquakes(geocoding.location)
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

    return [
      ...fromAlerts,
      ...fromEarthquakes,
      ...fromUserReports,
    ].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
  }, [
    alerts.alerts,
    alerts.fetchedAt,
    earthquakes.earthquakes,
    localData.userReports,
  ])

  return {
    geocoding,
    weather,
    alerts,
    earthquakes,
    localData,
    riskIndex,
    incidentItems,
  }
}
