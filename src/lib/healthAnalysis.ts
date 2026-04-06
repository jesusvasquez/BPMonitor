import { subDays, isAfter, parseISO } from 'date-fns'
import type { Reading } from '@/services/bloodPressure'

export type BPCategory = 
  | 'Normal' 
  | 'Normal-Alta' 
  | 'Hipertensión Etapa 1' 
  | 'Hipertensión Etapa 2' 
  | 'Crisis Hipertensiva'

export interface HealthStats {
  averageSystolic: number
  averageDiastolic: number
  averagePulse: number
  latestCategory: BPCategory
  pulseStatus: 'Estable' | 'Bajo' | 'Elevado' | 'Irregular'
  totalReadings: number
  trend: 'Mejorando' | 'Estable' | 'Empeorando'
  recommendation: string
}

export function getBPCategory(sys: number, dia: number): BPCategory {
  if (sys > 180 || dia > 120) return 'Crisis Hipertensiva'
  if (sys >= 140 || dia >= 90) return 'Hipertensión Etapa 2'
  if (sys >= 130 || dia >= 80) return 'Hipertensión Etapa 1'
  if (sys >= 120 && dia < 80) return 'Normal-Alta'
  return 'Normal'
}

export function analyzeHealth(readings: Reading[]): HealthStats | null {
  if (readings.length === 0) return null

  // Filtrar lecturas de los últimos 7 días
  const sevenDaysAgo = subDays(new Date(), 7)
  const recentReadings = readings.filter(r => {
    const date = typeof r.created_at === 'string' ? parseISO(r.created_at) : r.created_at
    return isAfter(date, sevenDaysAgo)
  })

  if (recentReadings.length === 0) return null

  // Calcular promedios
  const sumSys = recentReadings.reduce((acc, curr) => acc + curr.sistolica, 0)
  const sumDia = recentReadings.reduce((acc, curr) => acc + curr.diastolica, 0)
  const sumPulse = recentReadings.reduce((acc, curr) => acc + curr.pulso, 0)
  
  const avgSys = Math.round(sumSys / recentReadings.length)
  const avgDia = Math.round(sumDia / recentReadings.length)
  const avgPulse = Math.round(sumPulse / recentReadings.length)

  // Última categoría
  const latest = recentReadings[0] // Asumiendo que están ordenadas por fecha desc
  const latestCategory = getBPCategory(latest.sistolica, latest.diastolica)

  // Estado del pulso
  let pulseStatus: HealthStats['pulseStatus'] = 'Estable'
  if (avgPulse > 100) pulseStatus = 'Elevado'
  else if (avgPulse < 60) pulseStatus = 'Bajo'

  // Variabilidad del pulso (Arritmia simplificada)
  const pulseValues = recentReadings.map(r => r.pulso)
  const meanPulse = sumPulse / recentReadings.length
  const variance = pulseValues.reduce((acc, curr) => acc + Math.pow(curr - meanPulse, 2), 0) / pulseValues.length
  const stdDev = Math.sqrt(variance)
  if (stdDev > 12) pulseStatus = 'Irregular' // Umbral de variabilidad inusual

  // Determinación de tendencia
  let trend: HealthStats['trend'] = 'Estable'
  if (recentReadings.length >= 4) {
    const half = Math.floor(recentReadings.length / 2)
    const recentHalf = recentReadings.slice(0, half)
    const olderHalf = recentReadings.slice(half)
    
    const avgRecent = recentHalf.reduce((acc, curr) => acc + curr.sistolica, 0) / recentHalf.length
    const avgOlder = olderHalf.reduce((acc, curr) => acc + curr.sistolica, 0) / olderHalf.length
    
    if (avgRecent < avgOlder - 3) trend = 'Mejorando'
    else if (avgRecent > avgOlder + 3) trend = 'Empeorando'
  }

  // Recomendación
  let recommendation = 'Continúa con tu monitoreo regular.'
  if (latestCategory === 'Crisis Hipertensiva') {
    recommendation = '⚠️ BUSCA ATENCIÓN MÉDICA DE EMERGENCIA INMEDIATAMENTE.'
  } else if (latestCategory === 'Hipertensión Etapa 2') {
    recommendation = 'Llama a tu médico para ajustar tu tratamiento.'
  } else if (pulseStatus === 'Irregular') {
    recommendation = 'Se detectan variaciones de pulso. Consulta sobre posibles arritmias.'
  } else if (latestCategory === 'Normal') {
    recommendation = '¡Excelente! Mantén tus hábitos saludables.'
  }

  return {
    averageSystolic: avgSys,
    averageDiastolic: avgDia,
    averagePulse: avgPulse,
    latestCategory,
    pulseStatus,
    totalReadings: recentReadings.length,
    trend,
    recommendation
  }
}
