import { useCallback, useEffect, useRef, useState } from 'react'
import { OFFICIAL_PUBLIC_SAFETY_SOURCES } from '@/data/publicSafetySources'
import type { AsyncResource, GeoLocation, PublicSafetyIncident, SourceStatus } from '@/types'
import {
  fetchArcGISIncidents,
  fetchPulsePointIncidentResult,
  fetchSocrataIncidents,
  mergePublicSafetyResults,
  sourceAppliesToLocation,
  type PulsePointIncidentResult,
} from '@/utils/publicSafetyAdapters'
import { isAbortError, withTimeout } from '@/utils/request'

const REFRESH_INTERVAL_MS = 2 * 60_000

export function usePublicSafetyIncidents(location: GeoLocation | null) {
  const [state, setState] = useState<AsyncResource<PublicSafetyIncident[]>>({
    data: [],
    status: 'idle',
    error: null,
    fetchedAt: null,
  })
  const [sourceErrors, setSourceErrors] = useState<string[]>([])
  const [sourceStatuses, setSourceStatuses] = useState<SourceStatus[]>([])
  const requestSeq = useRef(0)
  const lastLocationKey = useRef<string | null>(null)

  const fetchPublicSafety = useCallback(async (
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

    const configuredSources = OFFICIAL_PUBLIC_SAFETY_SOURCES.filter(source => sourceAppliesToLocation(source, loc))
    const publicSafetyRequests = configuredSources.map(source => (
      source.type === 'SOCRATA'
        ? fetchSocrataIncidents(source, signal)
        : fetchArcGISIncidents(source, signal)
    ))
    const settledResults = await Promise.allSettled([
      fetchPulsePointIncidentResult(loc, signal),
      ...publicSafetyRequests,
    ])

    const results: Array<PromiseSettledResult<PublicSafetyIncident[]>> = settledResults.map(result => (
      result.status === 'fulfilled' && Array.isArray(result.value)
        ? { status: 'fulfilled', value: result.value } as PromiseFulfilledResult<PublicSafetyIncident[]>
        : result.status === 'fulfilled'
          ? { status: 'fulfilled', value: (result.value as PulsePointIncidentResult).incidents } as PromiseFulfilledResult<PublicSafetyIncident[]>
          : { status: 'rejected', reason: result.reason }
    ))
    if (requestSeq.current !== requestId) return

    const { incidents, errors, allFailed } = mergePublicSafetyResults(results)
    const now = new Date()
    const pulsePoint = settledResults[0] as PromiseSettledResult<PulsePointIncidentResult>
    const publicSafetyStatuses: SourceStatus[] = []

    if (pulsePoint.status === 'fulfilled') {
      publicSafetyStatuses.push({
        id: 'pulsepoint',
        label: 'PulsePoint',
        kind: pulsePoint.value.agencyCount === 0 ? 'unconfigured' : pulsePoint.value.incidents.length > 0 ? 'ok' : 'empty',
        detail: pulsePoint.value.agencyCount === 0
          ? `No participating PulsePoint agency found for ${loc.zip}.`
          : `${pulsePoint.value.agencyCount} agency${pulsePoint.value.agencyCount !== 1 ? 'ies' : ''} checked; ${pulsePoint.value.incidents.length} active/recent item${pulsePoint.value.incidents.length !== 1 ? 's' : ''}.`,
        itemCount: pulsePoint.value.incidents.length,
        fetchedAt: now,
      })
    } else {
      publicSafetyStatuses.push({
        id: 'pulsepoint',
        label: 'PulsePoint',
        kind: 'unavailable',
        detail: pulsePoint.reason instanceof Error ? pulsePoint.reason.message : 'PulsePoint unavailable.',
        fetchedAt: now,
      })
    }

    if (configuredSources.length === 0) {
      publicSafetyStatuses.push({
        id: 'public-safety-open-data',
        label: 'Public safety open data',
        kind: 'unconfigured',
        detail: `No configured public-safety open-data source for ${loc.city}, ${loc.state}.`,
        itemCount: 0,
        fetchedAt: now,
      })
    } else {
      configuredSources.forEach((source, index) => {
        const result = settledResults[index + 1] as PromiseSettledResult<PublicSafetyIncident[]>
        publicSafetyStatuses.push({
          id: source.id,
          label: source.label,
          kind: result.status === 'fulfilled'
            ? result.value.length > 0 ? 'ok' : 'empty'
            : 'unavailable',
          detail: result.status === 'fulfilled'
            ? `${result.value.length} active item${result.value.length !== 1 ? 's' : ''} returned.`
            : result.reason instanceof Error ? result.reason.message : `${source.label} unavailable.`,
          itemCount: result.status === 'fulfilled' ? result.value.length : undefined,
          fetchedAt: now,
        })
      })
    }

    setSourceErrors(errors)
    setSourceStatuses(publicSafetyStatuses)
    setState({
      data: incidents,
      status: 'success',
      error: allFailed ? 'Public-safety feeds unavailable.' : null,
      fetchedAt: new Date(),
    })
  }, [])

  useEffect(() => {
    if (!location) {
      requestSeq.current += 1
      lastLocationKey.current = null
      setSourceErrors([])
      setSourceStatuses([])
      setState({ data: [], status: 'idle', error: null, fetchedAt: null })
      return
    }

    const locationKey = `${location.zip}:${location.lat.toFixed(4)},${location.lon.toFixed(4)}`
    const preserveInitialData = lastLocationKey.current === locationKey
    if (!preserveInitialData) {
      lastLocationKey.current = locationKey
      setSourceErrors([])
      setSourceStatuses([
        { id: 'pulsepoint', label: 'PulsePoint', kind: 'checking', detail: 'Checking participating agencies...' },
        { id: 'public-safety-open-data', label: 'Public safety open data', kind: 'checking', detail: 'Checking configured local datasets...' },
      ])
      setState({ data: [], status: 'loading', error: null, fetchedAt: null })
    }

    let active = true
    const requestNext = (preserveData = true) => {
      if (!active) return undefined
      const requestId = requestSeq.current + 1
      requestSeq.current = requestId
      const controller = new AbortController()
      const signal = withTimeout(controller.signal, 12_000)
      fetchPublicSafety(location, signal, requestId, preserveData).catch(err => {
        if (isAbortError(err) || requestSeq.current !== requestId) return
        setSourceErrors([err instanceof Error ? err.message : 'Public-safety feeds unavailable'])
        setSourceStatuses([
          {
            id: 'public-safety',
            label: 'Public safety feeds',
            kind: 'unavailable',
            detail: err instanceof Error ? err.message : 'Public-safety feeds unavailable.',
            fetchedAt: new Date(),
          },
        ])
        setState(prev => ({
          data: prev.data ?? [],
          status: 'error',
          error: 'Public-safety feeds unavailable. Showing last successful public-safety data if available.',
          fetchedAt: prev.fetchedAt,
        }))
      })
      return controller
    }

    let controller = requestNext(preserveInitialData)
    const interval = window.setInterval(() => {
      controller?.abort()
      controller = requestNext()
    }, REFRESH_INTERVAL_MS)

    return () => {
      active = false
      controller?.abort()
      window.clearInterval(interval)
    }
  }, [location, fetchPublicSafety])

  return {
    incidents: state.data ?? [],
    loading: state.status === 'loading' || state.status === 'refreshing',
    refreshing: state.status === 'refreshing',
    error: state.error,
    sourceErrors,
    sourceStatuses,
    status: state.status,
    fetchedAt: state.fetchedAt,
  }
}
