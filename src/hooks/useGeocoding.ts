import { useState, useEffect, useRef } from 'react'
import type { AsyncResource, GeoLocation } from '@/types'
import { isAbortError, withTimeout } from '@/utils/request'

interface NominatimAddress {
  city?: string
  town?: string
  village?: string
  hamlet?: string
  municipality?: string
  county?: string
  state?: string
  postcode?: string
}

interface NominatimResult {
  lat: string
  lon: string
  display_name: string
  address?: NominatimAddress
}

function parseLocation(result: NominatimResult, zip: string): GeoLocation {
  const address = result.address ?? {}
  const city =
    address.city ??
    address.town ??
    address.village ??
    address.hamlet ??
    address.municipality ??
    address.county ??
    'Unknown'

  return {
    lat: Number.parseFloat(result.lat),
    lon: Number.parseFloat(result.lon),
    city,
    state: address.state ?? '',
    zip: address.postcode?.slice(0, 5) ?? zip,
    displayName: result.display_name,
    source: 'OpenStreetMap/Nominatim',
    fetchedAt: new Date(),
  }
}

export function useGeocoding(zip: string) {
  const [state, setState] = useState<AsyncResource<GeoLocation>>({
    data: null,
    status: 'idle',
    error: null,
    fetchedAt: null,
  })
  const cache = useRef<Map<string, GeoLocation>>(new Map())
  const requestSeq = useRef(0)

  useEffect(() => {
    if (!/^\d{5}$/.test(zip)) {
      requestSeq.current += 1
      setState({ data: null, status: 'idle', error: null, fetchedAt: null })
      return
    }

    const cached = cache.current.get(zip)
    if (cached) {
      setState({ data: cached, status: 'success', error: null, fetchedAt: cached.fetchedAt })
      return
    }

    const requestId = requestSeq.current + 1
    requestSeq.current = requestId
    const controller = new AbortController()
    const signal = withTimeout(controller.signal, 10_000)

    setState(prev => ({
      data: prev.data?.zip === zip ? prev.data : null,
      status: prev.data?.zip === zip ? 'refreshing' : 'loading',
      error: null,
      fetchedAt: prev.data?.zip === zip ? prev.fetchedAt : null,
    }))

    const params = new URLSearchParams({
      postalcode: zip,
      countrycodes: 'us',
      addressdetails: '1',
      format: 'jsonv2',
      limit: '1',
    })

    fetch(`https://nominatim.openstreetmap.org/search?${params.toString()}`, { signal })
      .then(async res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        return res.json() as Promise<NominatimResult[]>
      })
      .then(results => {
        if (requestSeq.current !== requestId) return
        const result = results[0]
        if (!result) {
          setState({ data: null, status: 'error', error: `No location found for ZIP ${zip}`, fetchedAt: null })
          return
        }

        const location = parseLocation(result, zip)
        cache.current.set(zip, location)
        setState({ data: location, status: 'success', error: null, fetchedAt: location.fetchedAt })
      })
      .catch(err => {
        if (isAbortError(err) || requestSeq.current !== requestId) return
        setState(prev => ({
          data: prev.data?.zip === zip ? prev.data : null,
          status: 'error',
          error: 'Geocoding unavailable. Check your connection or try again.',
          fetchedAt: prev.data?.zip === zip ? prev.fetchedAt : null,
        }))
      })

    return () => controller.abort()
  }, [zip])

  return {
    location: state.data,
    loading: state.status === 'loading' || state.status === 'refreshing',
    error: state.error,
    status: state.status,
    fetchedAt: state.fetchedAt,
    source: state.data?.source ?? 'OpenStreetMap/Nominatim',
  }
}
