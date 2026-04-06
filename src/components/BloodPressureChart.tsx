import * as React from "react"
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  ReferenceLine
} from "recharts"
import { format, subDays, startOfDay, isAfter, parseISO } from "date-fns"
import { es } from "date-fns/locale"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import type { Reading } from "@/services/bloodPressure"

interface BloodPressureChartProps {
  data: Reading[]
}

type TimeRange = "day" | "week" | "month"

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    // Filter only Systolic and Diastolic data, ignore ReferenceLines
    const dataEntries = payload.filter((p: any) => 
      p.dataKey === "sistolica" || p.dataKey === "diastolica"
    )

    if (dataEntries.length === 0) return null

    // Get the full date-time from the first data entry
    const { fullDateTime } = dataEntries[0].payload

    return (
      <div className="rounded-2xl border-none bg-white/80 p-4 shadow-xl backdrop-blur-md dark:bg-slate-900/80">
        <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-slate-500">
          {fullDateTime}
        </p>
        <div className="space-y-1.5">
          {dataEntries.map((entry: any, index: number) => (
            <div key={index} className="flex items-center justify-between gap-6">
              <div className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: entry.color }} />
                <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                  {entry.name}
                </span>
              </div>
              <span className="text-sm font-bold text-slate-900 dark:text-slate-100 tabular-nums">
                {entry.value} <span className="text-[10px] font-normal opacity-60">mmHg</span>
              </span>
            </div>
          ))}
        </div>
      </div>
    )
  }
  return null
}

export function BloodPressureChart({ data }: BloodPressureChartProps) {
  const [range, setRange] = React.useState<TimeRange>("week")

  const filteredData = React.useMemo(() => {
    const now = new Date()
    let startDate: Date

    switch (range) {
      case "day":
        startDate = startOfDay(now)
        break
      case "week":
        startDate = subDays(now, 7)
        break
      case "month":
        startDate = subDays(now, 30)
        break
      default:
        startDate = subDays(now, 7)
    }

    return data
      .filter((reading) => {
        const readingDate = typeof reading.created_at === "string" 
          ? parseISO(reading.created_at) 
          : reading.created_at
        return isAfter(readingDate as Date, startDate)
      })
      .map((reading) => {
        const date = typeof reading.created_at === "string" ? parseISO(reading.created_at) : (reading.created_at as Date)
        return {
          ...reading,
          // Label for X-Axis
          formattedDate: format(
            date,
            range === "day" ? "HH:mm" : "dd MMM",
            { locale: es }
          ),
          // More detailed label for Tooltip
          fullDateTime: format(date, "d 'de' MMM, HH:mm", { locale: es }),
          // Unique key for Recharts to avoid collision if multiple takes on same day/hour
          chartKey: date.getTime(), 
        }
      })
      .sort((a, b) => (a.chartKey || 0) - (b.chartKey || 0))
  }, [data, range])

  return (
    <Card className="w-full border-none bg-white/40 shadow-xl backdrop-blur-xl dark:bg-slate-900/40 sm:rounded-[2.5rem]">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-7">
        <div className="space-y-1">
          <CardTitle className="text-xl font-semibold tracking-tight">Tendencias</CardTitle>
          <CardDescription>Evolución de tu presión arterial</CardDescription>
        </div>
        <div className="flex items-center gap-1 rounded-2xl bg-slate-100/50 p-1 dark:bg-slate-800/50">
          {(["day", "week", "month"] as const).map((r) => (
            <Button
              key={r}
              variant="ghost"
              size="sm"
              onClick={() => setRange(r)}
              className={`rounded-xl px-3 text-xs font-medium transition-all ${
                range === r 
                  ? "bg-white shadow-sm dark:bg-slate-950" 
                  : "text-slate-500 hover:text-slate-900 dark:hover:text-slate-200"
              }`}
            >
              {r === "day" ? "Día" : r === "week" ? "Semana" : "Mes"}
            </Button>
          ))}
        </div>
      </CardHeader>
      <CardContent>
        <div id="bp-chart-container" className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={filteredData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
              <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.3} />
              <XAxis 
                dataKey="chartKey" 
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10, fill: "#94a3b8" }}
                dy={10}
                tickFormatter={(val) => {
                  const item = filteredData.find(d => d.chartKey === val);
                  return item ? item.formattedDate : "";
                }}
                minTickGap={40}
              />
              <YAxis 
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10, fill: "#94a3b8" }}
                domain={["dataMin - 10", "dataMax + 10"]}
              />
              <Tooltip content={<CustomTooltip />} />
              <Line
                type="monotone"
                dataKey="sistolica"
                name="Sistólica"
                stroke="#f43f5e" // Rose/Coral
                strokeWidth={3}
                dot={{ r: 4, fill: "#f43f5e", strokeWidth: 2, stroke: "#fff" }}
                activeDot={{ r: 6, strokeWidth: 0 }}
                animationDuration={1500}
              />
              <Line
                type="monotone"
                dataKey="diastolica"
                name="Diastólica"
                stroke="#3b82f6" // Blue
                strokeWidth={3}
                dot={{ r: 4, fill: "#3b82f6", strokeWidth: 2, stroke: "#fff" }}
                activeDot={{ r: 6, strokeWidth: 0 }}
                animationDuration={1500}
              />
              {/* Optional reference lines for healthy range */}
              <ReferenceLine y={120} stroke="#f43f5e" strokeDasharray="3 3" opacity={0.1} />
              <ReferenceLine y={80} stroke="#3b82f6" strokeDasharray="3 3" opacity={0.1} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
