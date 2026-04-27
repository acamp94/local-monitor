import { format, formatDistanceToNow } from 'date-fns'

export function formatSystemTime(date: Date): string {
  return format(date, 'EEE dd MMM yyyy · HH:mm:ss').toUpperCase()
}

export function formatRelativeTime(date: Date): string {
  return formatDistanceToNow(date, { addSuffix: true })
}

export function formatShortTime(date: Date): string {
  return format(date, 'HH:mm')
}

export function formatTemp(f: number): string {
  return `${Math.round(f)}°F`
}

export function formatWindDir(degrees: number): string {
  const dirs = ['N','NNE','NE','ENE','E','ESE','SE','SSE','S','SSW','SW','WSW','W','WNW','NW','NNW']
  return dirs[Math.round(degrees / 22.5) % 16]
}

export function formatCoords(lat: number, lon: number): string {
  const latDir = lat >= 0 ? 'N' : 'S'
  const lonDir = lon >= 0 ? 'E' : 'W'
  return `${Math.abs(lat).toFixed(4)}°${latDir} ${Math.abs(lon).toFixed(4)}°${lonDir}`
}

const WMO_CODES: Record<number, string> = {
  0: 'Clear Sky', 1: 'Mainly Clear', 2: 'Partly Cloudy', 3: 'Overcast',
  45: 'Fog', 48: 'Rime Fog',
  51: 'Light Drizzle', 53: 'Drizzle', 55: 'Heavy Drizzle',
  61: 'Light Rain', 63: 'Rain', 65: 'Heavy Rain',
  71: 'Light Snow', 73: 'Snow', 75: 'Heavy Snow', 77: 'Snow Grains',
  80: 'Rain Showers', 81: 'Heavy Showers', 82: 'Violent Showers',
  85: 'Snow Showers', 86: 'Heavy Snow Showers',
  95: 'Thunderstorm', 96: 'Thunderstorm w/ Hail', 99: 'Severe Thunderstorm',
}

export function formatWMOCode(code: number): string {
  return WMO_CODES[code] ?? `Code ${code}`
}

export function formatWMOIcon(code: number): string {
  if (code === 0) return 'Sun'
  if (code <= 2) return 'CloudSun'
  if (code === 3) return 'Cloud'
  if (code <= 48) return 'CloudFog'
  if (code <= 55) return 'CloudDrizzle'
  if (code <= 65) return 'CloudRain'
  if (code <= 77) return 'Snowflake'
  if (code <= 82) return 'CloudRain'
  if (code <= 86) return 'CloudSnow'
  return 'CloudLightning'
}

export function formatPowerStatus(status: string): { label: string; color: string } {
  switch (status) {
    case 'NORMAL':   return { label: 'Normal', color: 'text-success' }
    case 'WATCH':    return { label: 'Watch',  color: 'text-warn' }
    case 'WARNING':  return { label: 'Warning',color: 'text-amber' }
    case 'CRITICAL': return { label: 'Critical',color: 'text-danger' }
    default:         return { label: status,   color: 'text-muted' }
  }
}
