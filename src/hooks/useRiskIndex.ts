import { useMemo } from 'react'
import type { WeatherData, NWSAlert, RiskIndex } from '@/types'
import { buildRiskIndex } from '@/utils/riskCalculator'

export function useRiskIndex(
  weather: WeatherData | null,
  alerts: NWSAlert[],
): RiskIndex {
  return useMemo(
    () => buildRiskIndex(weather, alerts),
    [weather, alerts]
  )
}
