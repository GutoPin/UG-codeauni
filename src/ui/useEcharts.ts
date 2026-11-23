import { BarChart, LineChart } from 'echarts/charts'
import { GridComponent, LegendComponent, MarkLineComponent, TooltipComponent } from 'echarts/components'
import * as echarts from 'echarts/core'
import { SVGRenderer } from 'echarts/renderers'
import { useEffect, useRef } from 'react'

// solo lo que usan las pantallas: mantiene chico el paquete
echarts.use([BarChart, LineChart, GridComponent, LegendComponent, MarkLineComponent, TooltipComponent, SVGRenderer])

// Tema base: ejes y rejilla recesivos, texto en tokens de tinta (nunca color de serie).
export const BASE = {
  textStyle: { fontFamily: 'Archivo Variable, system-ui, sans-serif', color: '#a9b5b1', fontSize: 12 },
  grid: { left: 8, right: 16, top: 28, bottom: 8, containLabel: true },
  tooltip: {
    backgroundColor: '#1d2624',
    borderColor: '#364240',
    textStyle: { color: '#e9eeec', fontSize: 12 },
  },
  animationDuration: 500,
}
export const EJE = {
  axisLine: { lineStyle: { color: '#364240' } },
  axisTick: { show: false },
  axisLabel: { color: '#84918d' },
  splitLine: { lineStyle: { color: '#29332f' } },
}

export function useEcharts(opcion: echarts.EChartsCoreOption) {
  const ref = useRef<HTMLDivElement>(null)
  const chart = useRef<echarts.ECharts | null>(null)
  useEffect(() => {
    const c = echarts.init(ref.current!, undefined, { renderer: 'svg' })
    chart.current = c
    const ro = new ResizeObserver(() => c.resize())
    ro.observe(ref.current!)
    return () => {
      ro.disconnect()
      c.dispose()
    }
  }, [])
  useEffect(() => {
    chart.current?.setOption(opcion, true)
  }, [opcion])
  return ref
}
