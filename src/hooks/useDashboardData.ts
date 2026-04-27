import { useMemo } from 'react'
import type { IntelItem } from '@/types'
import { useAlerts } from '@/hooks/useAlerts'
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
      source: 'LOCAL',
      severity: 'MODERATE',
      timestamp: report.createdAt,
    }))

    return [
      ...fromAlerts,
      ...fromUserReports,
    ].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
  }, [
    alerts.alerts,
    alerts.fetchedAt,
    localData.userReports,
  ])

  return {
    geocoding,
    weather,
    alerts,
    localData,
    riskIndex,
    incidentItems,
  }
}
