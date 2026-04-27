import { useState, useEffect, useCallback, useRef } from 'react'
import type { AlertGeometry, AlertSeverity, AlertUrgency, AsyncResource, GeoLocation, NWSAlert } from '@/types'
import { isAbortError, withTimeout } from '@/utils/request'

interface NWSAlertFeature {
  id: string
  geometry: AlertGeometry | null
  properties: {
    id?: string
    event?: string
    headline?: string | null
    description?: string | null
    instruction?: string | null
    severity?: string
    urgency?: string
    areaDesc?: string
    onset?: string | null
    expires?: string | null
    senderName?: string
  }
}

interface NWSAlertsResponse {
  features?: NWSAlertFeature[]
}

const ALERT_SEVERITIES: AlertSeverity[] = ['Extreme', 'Severe', 'Moderate', 'Minor', 'Unknown']
const ALERT_URGENCIES: AlertUrgency[] = ['Immediate', 'Expected', 'Future', 'Past', 'Unknown']

function normalizeSeverity(value: string | undefined): AlertSeverity {
  return ALERT_SEVERITIES.includes(value as AlertSeverity) ? value as AlertSeverity : 'Unknown'
}

function normalizeUrgency(value: string | undefined): AlertUrgency {
  return ALERT_URGENCIES.includes(value as AlertUrgency) ? value as AlertUrgency : 'Unknown'
}

function parseAlerts(json: NWSAlertsResponse): NWSAlert[] {
  return (json.features ?? []).map(feature => ({
    id: feature.properties.id ?? feature.id,
    event: feature.properties.event ?? 'Weather Alert',
    headline: feature.properties.headline ?? null,
    description: feature.properties.description ?? '',
    instruction: feature.properties.instruction ?? null,
    severity: normalizeSeverity(feature.properties.severity),
    urgency: normalizeUrgency(feature.properties.urgency),
    areaDesc: feature.properties.areaDesc ?? 'Alert area unavailable',
    onset: feature.properties.onset ?? null,
    expires: feature.properties.expires ?? null,
    senderName: feature.properties.senderName ?? 'National Weather Service',
    geometry: feature.geometry,
  }))
}

export function useAlerts(location: GeoLocation | null) {
  const [state, setState] = useState<AsyncResource<NWSAlert[]>>({
    data: [],
    status: 'idle',
    error: null,
    fetchedAt: null,
  })
  const requestSeq = useRef(0)
  const lastLocationKey = useRef<string | null>(null)

  const fetchAlerts = useCallback(async (
    loc: GeoLocation,
    signal: AbortSignal,
    requestId: number,
    preserveData = true,
  ) => {
    setState(prev => ({
      data: preserveData ? prev.data : [],
      status: preserveData && prev.data?.length ? 'refreshing' : 'loading',
      error: null,
      fetchedAt: preserveData ? prev.fetchedAt : null,
    }))

    try {
      const res = await fetch(
        `https://api.weather.gov/alerts/active?point=${loc.lat.toFixed(4)},${loc.lon.toFixed(4)}`,
        { signal, headers: { Accept: 'application/geo+json' } },
      )
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const json = await res.json() as NWSAlertsResponse
      const alerts = parseAlerts(json)
      if (requestSeq.current !== requestId) return
      setState({ data: alerts, status: 'success', error: null, fetchedAt: new Date() })
    } catch (err: unknown) {
      if (isAbortError(err) || requestSeq.current !== requestId) return
      setState(prev => ({
        data: prev.data ?? [],
        status: 'error',
        error: 'Alert service unavailable. Showing last successful NWS data if available.',
        fetchedAt: prev.fetchedAt,
      }))
    }
  }, [])

  useEffect(() => {
    if (!location) {
      requestSeq.current += 1
      lastLocationKey.current = null
      setState({ data: [], status: 'idle', error: null, fetchedAt: null })
      return
    }

    const locationKey = `${location.zip}:${location.lat.toFixed(4)},${location.lon.toFixed(4)}`
    const preserveInitialData = lastLocationKey.current === locationKey
    if (!preserveInitialData) {
      lastLocationKey.current = locationKey
      setState({ data: [], status: 'loading', error: null, fetchedAt: null })
    }

    let active = true
    const requestNext = (preserveData = true) => {
      if (!active) return
      const requestId = requestSeq.current + 1
      requestSeq.current = requestId
      const controller = new AbortController()
      const signal = withTimeout(controller.signal, 10_000)
      void fetchAlerts(location, signal, requestId, preserveData)
      return controller
    }

    let controller = requestNext(preserveInitialData)
    const interval = window.setInterval(() => {
      controller?.abort()
      controller = requestNext()
    }, 5 * 60_000)

    return () => {
      active = false
      controller?.abort()
      window.clearInterval(interval)
    }
  }, [location, fetchAlerts])

  const refetch = useCallback(() => {
    if (!location) return
    const requestId = requestSeq.current + 1
    requestSeq.current = requestId
    const controller = new AbortController()
    void fetchAlerts(location, withTimeout(controller.signal, 10_000), requestId)
  }, [location, fetchAlerts])

  return {
    alerts: state.data ?? [],
    loading: state.status === 'loading' || state.status === 'refreshing',
    refreshing: state.status === 'refreshing',
    error: state.error,
    status: state.status,
    fetchedAt: state.fetchedAt,
    refetch,
  }
}
