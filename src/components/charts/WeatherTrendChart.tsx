import { ComposedChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts'
import { LoadingSkeleton } from '@/components/shared/LoadingSkeleton'
import { ChartViewport } from '@/components/charts/ChartViewport'
import type { WeatherChartPoint } from '@/types'

interface Props {
  data: WeatherChartPoint[]
  loading: boolean
}

export function WeatherTrendChart({ data, loading }: Props) {
  if (loading || data.length === 0) return <LoadingSkeleton lines={4} />

  return (
    <ChartViewport>
      {({ width, height }) => (
        <ComposedChart width={width} height={height} data={data} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1a2640" vertical={false} />
          <XAxis
            dataKey="hour"
            tick={{ fill: '#64748b', fontSize: 9, fontFamily: 'monospace' }}
            interval={5}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            yAxisId="temp"
            tick={{ fill: '#64748b', fontSize: 9, fontFamily: 'monospace' }}
            axisLine={false}
            tickLine={false}
            width={30}
          />
          <YAxis
            yAxisId="wind"
            orientation="right"
            tick={{ fill: '#64748b', fontSize: 9, fontFamily: 'monospace' }}
            axisLine={false}
            tickLine={false}
            width={30}
          />
          <Tooltip
            contentStyle={{ background: '#0c1524', border: '1px solid #1a2640', borderRadius: '2px', fontSize: '10px', fontFamily: 'monospace' }}
            labelStyle={{ color: '#94a3b8' }}
            cursor={{ stroke: '#1a2640' }}
          />
          <Legend
            wrapperStyle={{ fontSize: '9px', fontFamily: 'monospace', color: '#64748b', paddingTop: '4px' }}
            iconSize={8}
          />
          <Line yAxisId="temp" type="monotone" dataKey="temp" stroke="#00c8ff" strokeWidth={1.5} dot={false} name="Temp °F" activeDot={{ r: 3 }} />
          <Line yAxisId="wind" type="monotone" dataKey="wind" stroke="#f59e0b" strokeWidth={1.5} dot={false} name="Wind mph" activeDot={{ r: 3 }} strokeDasharray="4 2" />
        </ComposedChart>
      )}
    </ChartViewport>
  )
}
