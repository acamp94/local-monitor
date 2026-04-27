import type {
  WeatherData, NWSAlert, RiskMetric, RiskIndex, SeverityLevel,
} from '@/types'

export function scoreToSeverity(score: number): SeverityLevel {
  if (score >= 80) return 'CRITICAL'
  if (score >= 60) return 'HIGH'
  if (score >= 40) return 'MODERATE'
  if (score >= 20) return 'LOW'
  return 'NONE'
}

export function calcWeatherRisk(weather: WeatherData | null, alerts: NWSAlert[]): RiskMetric {
  if (!weather) {
    return { label: 'Weather Risk', score: 0, severity: 'NONE', detail: 'No data' }
  }
  let score = 0
  const { wind_speed_10m, precipitation, weather_code } = weather.current

  if (wind_speed_10m >= 50) score += 40
  else if (wind_speed_10m >= 30) score += 25
  else if (wind_speed_10m >= 15) score += 10

  if (precipitation >= 10) score += 25
  else if (precipitation >= 5) score += 15
  else if (precipitation >= 1) score += 8

  if (weather_code >= 95) score += 30
  else if (weather_code >= 80) score += 15
  else if (weather_code >= 61) score += 10
  else if (weather_code >= 71) score += 20

  const hasExtreme = alerts.some(a => a.severity === 'Extreme')
  const hasSevere = alerts.some(a => a.severity === 'Severe')
  if (hasExtreme) score += 25
  else if (hasSevere) score += 15

  score = Math.min(100, score)
  const detail = `Wind ${Math.round(wind_speed_10m)} mph · Precip ${precipitation.toFixed(1)} mm`
  return { label: 'Weather Risk', score, severity: scoreToSeverity(score), detail }
}

export function calcAlertRisk(alerts: NWSAlert[]): RiskMetric {
  let score = Math.min(40, alerts.length * 8)
  const extremeCount = alerts.filter(a => a.severity === 'Extreme').length
  const severeCount = alerts.filter(a => a.severity === 'Severe').length
  score += Math.min(30, extremeCount * 30)
  score += Math.min(20, severeCount * 15)
  score = Math.min(100, score)
  const detail = `${alerts.length} active alert${alerts.length !== 1 ? 's' : ''}`
  return { label: 'Public Alert Level', score, severity: scoreToSeverity(score), detail }
}

export function buildRiskIndex(
  weather: WeatherData | null,
  alerts: NWSAlert[],
): RiskIndex {
  const weatherMetric = calcWeatherRisk(weather, alerts)
  const alertsMetric = calcAlertRisk(alerts)

  const overall = Math.round(
    weatherMetric.score * 0.55 +
    alertsMetric.score * 0.45
  )

  return {
    overall,
    overallSeverity: scoreToSeverity(overall),
    weather: weatherMetric,
    alerts: alertsMetric,
  }
}
