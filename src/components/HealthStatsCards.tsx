import * as React from "react"
import { 
  Activity, 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  Heart, 
  Info,
  AlertTriangle 
} from "lucide-react"
import { analyzeHealth, type HealthStats } from "@/lib/healthAnalysis"
import type { Reading } from "@/services/bloodPressure"

interface HealthStatsCardsProps {
  readings: Reading[]
}

export function HealthStatsCards({ readings }: HealthStatsCardsProps) {
  const stats = React.useMemo(() => analyzeHealth(readings), [readings])

  if (!stats) return null

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Normal': return 'text-emerald-500 bg-emerald-500/10'
      case 'Normal-Alta': return 'text-amber-500 bg-amber-500/10'
      case 'Hipertensión Etapa 1': return 'text-orange-500 bg-orange-500/10'
      case 'Hipertensión Etapa 2': return 'text-rose-500 bg-rose-500/10'
      case 'Crisis Hipertensiva': return 'text-red-600 bg-red-600/20 animate-pulse'
      default: return 'text-slate-500 bg-slate-500/10'
    }
  }

  const getTrendIcon = (trend: HealthStats['trend']) => {
    switch (trend) {
      case 'Mejorando': return <TrendingDown className="h-4 w-4 text-emerald-500" />
      case 'Empeorando': return <TrendingUp className="h-4 w-4 text-rose-500" />
      default: return <Minus className="h-4 w-4 text-slate-400" />
    }
  }

  return (
    <div className="w-full space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {/* Card: Estado Actual */}
        <div className="group overflow-hidden rounded-[2.5rem] bg-white/40 p-6 backdrop-blur-xl border border-white/20 shadow-sm transition-all hover:shadow-lg dark:bg-slate-900/40 dark:border-slate-800/40">
          <div className="flex items-center justify-between mb-4">
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
              Estado Actual (7d)
            </span>
            <div className={`p-2 rounded-xl ${getCategoryColor(stats.latestCategory)}`}>
              <Activity className="h-4 w-4" />
            </div>
          </div>
          <div className="space-y-1">
            <h3 className="text-xl font-bold tracking-tight">
              {stats.latestCategory}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Basado en tu última lectura.
            </p>
          </div>
        </div>

        {/* Card: Promedio Semanal */}
        <div className="group overflow-hidden rounded-[2.5rem] bg-white/40 p-6 backdrop-blur-xl border border-white/20 shadow-sm transition-all hover:shadow-lg dark:bg-slate-900/40 dark:border-slate-800/40">
          <div className="flex items-center justify-between mb-4">
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
              Promedio Presión
            </span>
            <div className="flex items-center gap-1">
              {getTrendIcon(stats.trend)}
              <span className="text-[10px] font-bold text-slate-400 uppercase">Trend</span>
            </div>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-black tracking-tighter tabular-nums">
              {stats.averageSystolic}/{stats.averageDiastolic}
            </span>
            <span className="text-sm font-bold text-slate-400">mmHg</span>
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-[10px] font-medium text-slate-500">
            <Info className="h-3 w-3" />
            <span>Actualizado con {stats.totalReadings} registros recientes.</span>
          </div>
        </div>

        {/* Card: Pulso & Arritmia */}
        <div className="group overflow-hidden rounded-[2.5rem] bg-white/40 p-6 backdrop-blur-xl border border-white/20 shadow-sm transition-all hover:shadow-lg dark:bg-slate-900/40 dark:border-slate-800/40 lg:col-span-1 sm:col-span-2 lg:sm:col-span-1">
          <div className="flex items-center justify-between mb-4">
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
              Análisis del Pulso
            </span>
            <div className={`p-2 rounded-xl ${stats.pulseStatus === 'Irregular' ? 'bg-rose-500/10 text-rose-500' : 'bg-emerald-500/10 text-emerald-500'}`}>
              <Heart className={`h-4 w-4 ${stats.pulseStatus === 'Irregular' ? 'animate-bounce' : ''}`} />
            </div>
          </div>
          <div className="space-y-1">
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold tabular-nums">{stats.averagePulse}</span>
              <span className="text-xs font-bold text-slate-400 uppercase">BPM</span>
              <span className={`ml-2 text-[10px] font-black uppercase tracking-tighter px-2 py-0.5 rounded-full ${stats.pulseStatus === 'Irregular' ? 'bg-rose-500 text-white' : 'bg-emerald-500/10 text-emerald-500'}`}>
                {stats.pulseStatus}
              </span>
            </div>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 italic">
              {stats.pulseStatus === 'Irregular' 
                ? 'Se detecta variabilidad alta; reporte esto a su médico.' 
                : 'Ritmo promedio dentro de rangos estables.'}
            </p>
          </div>
        </div>
      </div>

      {/* Alerta de Recomendación */}
      <div className={`flex items-center gap-4 p-5 rounded-3xl border ${
        stats.latestCategory === 'Crisis Hipertensiva' 
          ? 'bg-rose-600 text-white border-rose-500 shadow-lg shadow-rose-500/20 animate-pulse' 
          : 'bg-white/40 backdrop-blur-xl border-white/20 dark:bg-slate-900/40 dark:border-slate-800/40'
      }`}>
        <div className={`p-3 rounded-2xl ${stats.latestCategory === 'Crisis Hipertensiva' ? 'bg-white/20' : 'bg-slate-100 dark:bg-slate-800'}`}>
          <AlertTriangle className="h-5 w-5" />
        </div>
        <div className="flex-1 space-y-0.5">
          <p className="text-[10px] font-bold uppercase tracking-widest opacity-60">Recomendación Médica</p>
          <p className="text-sm font-semibold leading-tight">{stats.recommendation}</p>
        </div>
      </div>

      {/* Disclaimer */}
      <div className="px-6 py-2 text-center">
        <p className="text-[9px] text-slate-400 font-medium leading-relaxed max-w-sm mx-auto">
          * LOS RESULTADOS SON INFORMATIVOS Y NO CONSTITUYEN UN DIAGNÓSTICO PROFESIONAL. 
          SIEMPRE CONSULTE CON UN MÉDICO COLEGIADO ANTES DE CAMBIAR SU TRATAMIENTO.
        </p>
      </div>
    </div>
  )
}
