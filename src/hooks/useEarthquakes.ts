import { useState, useEffect, useCallback, useRef } from 'react'
import type { AsyncResource, EarthquakeEvent, GeoLocation } from '@/types'
import { isAbortError, withTimeout } from '@/utils/request'

const SEARCH_RADIUS_KM = 100
const RECENT_WINDOW_HOURS = 24

interface USGSEarthquakeFeature {
  id: string
  geometry: {
    type: 'Point'
    coordinates: [number, number, number?]
  } | null
  properties: {
    mag?: number | null
    place?: string | null
    time?: number | null
    updated?: number | null
    url?: string | null
    title?: string | null
  }
}

interface USGSEarthquakeResponse {
  features?: USGSEarthquakeFeature[]
}

function parseEarthquakes(json: USGSEarthquakeResponse): EarthquakeEvent[] {
  return (json.features ?? [])
    .map(feature => {
      const coords = feature.geometry?.coordinates
      const time = feature.properties.time
      if (!coords || time == null) return null

      return {
        id: feature.id,
        title: feature.properties.title ?? feature.properties.place ?? 'USGS earthquake event',
        place: feature.properties.place ?? 'Location unavailable',
        magnitude: feature.properties.mag ?? null,
        time: new Date(time),
        updated: feature.properties.updated ? new Date(feature.properties.updated) : null,
        url: feature.properties.url ?? null,
        lon: coords[0],
        lat: coords[1],
        depthKm: coords[2] ?? null,
      } satisfies EarthquakeEvent
    })
    .filter((event): event is EarthquakeEvent => event !== null)
}

export function useEarthquakes(location: GeoLocation | null) {
  const [state, setState] = useState<AsyncResource<EarthquakeEvent[]>>({
    data: [],
    status: 'idle',
    error: null,
    fetchedAt: null,
  })
  const requestSeq = useRef(0)
  const lastLocationKey = useRef<string | null>(null)

  const fetchEarthquakes = useCallback(async (
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

    const start = new Date(Date.now() - RECENT_WINDOW_HOURS * 60 * 60 * 1000)
    const params = new URLSearchParams({
      format: 'geojson',
      latitude: String(loc.lat),
      longitude: String(loc.lon),
      maxradiuskm: String(SEARCH_RADIUS_KM),
      starttime: start.toISOString(),
      orderby: 'time',
      limit: '50',
    })

    try {
      const res = await fetch(`https://earthquake.usgs.gov/fdsnws/event/1/query?${params.toString()}`, { signal })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const json = await res.json() as USGSEarthquakeResponse
      const events = parseEarthquakes(json)
      if (requestSeq.current !== requestId) return
      setState({ data: events, status: 'success', error: null, fetchedAt: new Date() })
    } catch (err: unknown) {
      if (isAbortError(err) || requestSeq.current !== requestId) return
      setState(prev => ({
        data: prev.data ?? [],
        status: 'error',
        error: 'USGS earthquake feed unavailable. Showing last successful USGS data if available.',
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
      void fetchEarthquakes(location, signal, requestId, preserveData)
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
  }, [location, fetchEarthquakes])

  const refetch = useCallback(() => {
    if (!location) return
    const requestId = requestSeq.current + 1
    requestSeq.current = requestId
    const controller = new AbortController()
    void fetchEarthquakes(location, withTimeout(controller.signal, 10_000), requestId)
  }, [location, fetchEarthquakes])

  return {
    earthquakes: state.data ?? [],
    loading: state.status === 'loading' || state.status === 'refreshing',
    refreshing: state.status === 'refreshing',
    error: state.error,
    status: state.status,
    fetchedAt: state.fetchedAt,
    refetch,
  }
}
