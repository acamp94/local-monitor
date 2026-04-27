export interface GeoLocation {
  lat: number
  lon: number
  city: string
  state: string
  zip: string
  displayName: string
  source: 'OpenStreetMap/Nominatim'
  fetchedAt: Date
}

export interface WeatherCurrent {
  time: string
  temperature_2m: number
  apparent_temperature: number
  relative_humidity_2m: number
  wind_speed_10m: number
  wind_direction_10m: number
  precipitation: number
  weather_code: number
}

export interface WeatherHourlyPoint {
  time: string
  temperature_2m: number
  wind_speed_10m: number
  precipitation_probability: number
}

export interface WeatherData {
  current: WeatherCurrent
  hourly: WeatherHourlyPoint[]
  fetchedAt: Date
  timezone: string
}

export type AlertSeverity = 'Extreme' | 'Severe' | 'Moderate' | 'Minor' | 'Unknown'
export type AlertUrgency = 'Immediate' | 'Expected' | 'Future' | 'Past' | 'Unknown'

export interface NWSAlert {
  id: string
  event: string
  headline: string | null
  description: string
  instruction: string | null
  severity: AlertSeverity
  urgency: AlertUrgency
  areaDesc: string
  onset: string | null
  expires: string | null
  senderName: string
  geometry: AlertGeometry | null
}

export type AsyncStatus = 'idle' | 'loading' | 'refreshing' | 'success' | 'error'

export interface AsyncResource<T> {
  data: T | null
  status: AsyncStatus
  error: string | null
  fetchedAt: Date | null
}

export type AlertGeometry =
  | { type: 'Polygon'; coordinates: number[][][] }
  | { type: 'MultiPolygon'; coordinates: number[][][][] }

export type SeverityLevel = 'CRITICAL' | 'HIGH' | 'MODERATE' | 'LOW' | 'NONE'
export type IntelSource = 'NWS' | 'LOCAL'

export interface IntelItem {
  id: string
  title: string
  summary: string
  source: IntelSource
  severity: SeverityLevel
  timestamp: Date
  url?: string
}

export interface RiskMetric {
  label: string
  score: number
  severity: SeverityLevel
  detail: string
}

export interface RiskIndex {
  overall: number
  overallSeverity: SeverityLevel
  weather: RiskMetric
  alerts: RiskMetric
}

export interface LocalReport {
  id: string
  title: string
  category: string
  body: string
  createdAt: Date
  lat?: number
  lon?: number
}

export interface WeatherChartPoint {
  hour: string
  temp: number
  wind: number
}

export type NavSection = 'overview' | 'weather' | 'alerts' | 'reports' | 'settings'
