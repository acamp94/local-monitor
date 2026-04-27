import { CloudSun, Wind, Droplets, Thermometer } from 'lucide-react'
import { AreaChart, Area, Tooltip, XAxis } from 'recharts'
import { ChartViewport } from '@/components/charts/ChartViewport'
import { LoadingSkeleton } from '@/components/shared/LoadingSkeleton'
import { SourceLabel } from '@/components/shared/SourceLabel'
import { formatTemp, formatWindDir, formatWMOCode } from '@/utils/formatters'
import type { WeatherData } from '@/types'

interface Props {
  data: WeatherData | null
  loading: boolean
  error: string | null
  refreshing?: boolean
}

function WindCompass({ degrees }: { degrees: number }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative w-9 h-9">
        <div className="absolute inset-0 rounded-full border border-line" />
        <div
          className="absolute inset-0 flex items-center justify-center"
          style={{ transform: `rotate(${degrees}deg)` }}
        >
          <div className="w-0.5 h-3.5 bg-cyan rounded-full origin-bottom" style={{ marginTop: '-14px' }} />
        </div>
      </div>
      <span className="font-mono text-[9px] text-muted">{formatWindDir(degrees)}</span>
    </div>
  )
}

export function WeatherDetailPanel({ data, loading, error, refreshing }: Props) {
  const chartData = data?.hourly.slice(0, 24).map(h => ({
    hour: h.time.slice(11, 16),
    temp: Math.round(h.temperature_2m),
    precip: h.precipitation_probability,
  })) ?? []

  return (
    <div className="bg-card border border-line rounded-sm shrink-0 card-raised">
      <div className="flex items-center justify-between px-3 py-2 border-b border-line bg-card-header">
        <div className="flex items-center gap-2">
          <CloudSun size={13} className="text-cyan" />
          <span className="font-mono text-[10px] text-secondary tracking-widest uppercase">Weather Detail</span>
        </div>
        <div className="flex items-center gap-2">
          {refreshing && <span className="font-mono text-[9px] text-cyan">REFRESH</span>}
          {error && data && <span className="font-mono text-[9px] text-amber">LAST GOOD</span>}
          <SourceLabel source="Open-Meteo" fetchedAt={data?.fetchedAt} />
        </div>
      </div>

      <div className="p-3">
        {loading && !data && <LoadingSkeleton lines={4} />}
        {error && !data && (
          <span className="font-mono text-[10px] text-muted">Weather unavailable</span>
        )}
        {data && (
          <>
            {error && (
              <div className="mb-2 font-mono text-[9px] text-amber bg-amber/8 border border-amber/25 rounded-sm px-2 py-1">
                Open-Meteo refresh failed. Showing last successful weather data.
              </div>
            )}
            <div className="grid grid-cols-3 gap-2 mb-2 pb-2 border-b border-line">
              <div className="flex flex-col items-center">
                <Thermometer size={12} className="text-cyan mb-1" />
                <span className="font-mono text-2xl font-bold text-primary leading-none tracking-tight">{formatTemp(data.current.temperature_2m)}</span>
                <span className="font-mono text-[10px] text-muted mt-0.5">Feels {formatTemp(data.current.apparent_temperature)}</span>
              </div>
              <div className="flex flex-col items-center">
                <Wind size={12} className="text-secondary mb-1" />
                <span className="font-mono text-base font-bold text-primary tracking-tight">{Math.round(data.current.wind_speed_10m)} mph</span>
                <WindCompass degrees={data.current.wind_direction_10m} />
              </div>
              <div className="flex flex-col items-center">
                <Droplets size={12} className="text-cyan mb-1" />
                <span className="font-mono text-base font-bold text-primary tracking-tight">{data.current.relative_humidity_2m}%</span>
                <span className="font-mono text-[10px] text-muted">Humidity</span>
              </div>
            </div>

            <div className="font-mono text-[11px] text-cyan mb-3 text-center tracking-widest uppercase">
              {formatWMOCode(data.current.weather_code)}
            </div>

            {/* Mini hourly temp chart */}
            <div className="h-14">
              <ChartViewport>
                {({ width, height }) => (
                  <AreaChart width={width} height={height} data={chartData} margin={{ top: 4, right: 0, bottom: 0, left: 0 }}>
                    <defs>
                      <linearGradient id="tempGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#00c8ff" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#00c8ff" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="hour" hide />
                    <Tooltip
                      contentStyle={{ background: '#0c1524', border: '1px solid #1a2640', borderRadius: '2px', fontSize: '10px', fontFamily: 'monospace' }}
                      labelStyle={{ color: '#94a3b8' }}
                      itemStyle={{ color: '#00c8ff' }}
                    />
                    <Area type="monotone" dataKey="temp" stroke="#00c8ff" strokeWidth={1.5} fill="url(#tempGrad)" dot={false} name="°F" />
                  </AreaChart>
                )}
              </ChartViewport>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
