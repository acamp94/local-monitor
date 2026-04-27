import { useState, useEffect, useCallback, useRef } from 'react'
import type { AsyncResource, GeoLocation, WeatherCurrent, WeatherData, WeatherHourlyPoint } from '@/types'
import { isAbortError, withTimeout } from '@/utils/request'

interface OpenMeteoResponse {
  current: WeatherCurrent
  hourly: {
    time: string[]
    temperature_2m: number[]
    wind_speed_10m: number[]
    precipitation_probability: number[]
  }
  timezone: string
}

function parseWeather(json: OpenMeteoResponse): WeatherData {
  const hourly: WeatherHourlyPoint[] = json.hourly.time.map((time, i) => ({
    time,
    temperature_2m: json.hourly.temperature_2m[i] ?? 0,
    wind_speed_10m: json.hourly.wind_speed_10m[i] ?? 0,
    precipitation_probability: json.hourly.precipitation_probability[i] ?? 0,
  }))

  return {
    current: json.current,
    hourly,
    fetchedAt: new Date(),
    timezone: json.timezone,
  }
}

export function useWeather(location: GeoLocation | null) {
  const [state, setState] = useState<AsyncResource<WeatherData>>({
    data: null,
    status: 'idle',
    error: null,
    fetchedAt: null,
  })
  const requestSeq = useRef(0)
  const lastLocationKey = useRef<string | null>(null)

  const fetchWeather = useCallback(async (
    loc: GeoLocation,
    signal: AbortSignal,
    requestId: number,
    preserveData = true,
  ) => {
    setState(prev => ({
      data: preserveData ? prev.data : null,
      status: preserveData && prev.data ? 'refreshing' : 'loading',
      error: null,
      fetchedAt: preserveData ? prev.fetchedAt : null,
    }))

    const params = new URLSearchParams({
      latitude: String(loc.lat),
      longitude: String(loc.lon),
      current: 'temperature_2m,apparent_temperature,relative_humidity_2m,wind_speed_10m,wind_direction_10m,precipitation,weather_code',
      hourly: 'temperature_2m,wind_speed_10m,precipitation_probability',
      temperature_unit: 'fahrenheit',
      wind_speed_unit: 'mph',
      forecast_days: '1',
      timezone: 'auto',
    })

    try {
      const res = await fetch(`https://api.open-meteo.com/v1/forecast?${params.toString()}`, { signal })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const json = await res.json() as OpenMeteoResponse
      const data = parseWeather(json)
      if (requestSeq.current !== requestId) return
      setState({ data, status: 'success', error: null, fetchedAt: data.fetchedAt })
    } catch (err: unknown) {
      if (isAbortError(err) || requestSeq.current !== requestId) return
      setState(prev => ({
        data: prev.data,
        status: 'error',
        error: 'Weather data unavailable. Showing last successful Open-Meteo data if available.',
        fetchedAt: prev.fetchedAt,
      }))
    }
  }, [])

  useEffect(() => {
    if (!location) {
      requestSeq.current += 1
      lastLocationKey.current = null
      setState({ data: null, status: 'idle', error: null, fetchedAt: null })
      return
    }

    const locationKey = `${location.zip}:${location.lat.toFixed(4)},${location.lon.toFixed(4)}`
    const preserveInitialData = lastLocationKey.current === locationKey
    if (!preserveInitialData) {
      lastLocationKey.current = locationKey
      setState({ data: null, status: 'loading', error: null, fetchedAt: null })
    }

    let active = true
    const requestNext = (preserveData = true) => {
      if (!active) return
      const requestId = requestSeq.current + 1
      requestSeq.current = requestId
      const controller = new AbortController()
      const signal = withTimeout(controller.signal, 10_000)
      void fetchWeather(location, signal, requestId, preserveData)
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
  }, [location, fetchWeather])

  const refetch = useCallback(() => {
    if (!location) return
    const requestId = requestSeq.current + 1
    requestSeq.current = requestId
    const controller = new AbortController()
    void fetchWeather(location, withTimeout(controller.signal, 10_000), requestId)
  }, [location, fetchWeather])

  return {
    data: state.data,
    loading: state.status === 'loading' || state.status === 'refreshing',
    refreshing: state.status === 'refreshing',
    error: state.error,
    status: state.status,
    fetchedAt: state.fetchedAt,
    refetch,
  }
}
