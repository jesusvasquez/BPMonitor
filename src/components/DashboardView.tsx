import { Loader2 } from "lucide-react"
import { HealthStatsCards } from "@/components/HealthStatsCards"
import { ExportDropdown } from "@/components/ExportDropdown"
import { BloodPressureChart } from "@/components/BloodPressureChart"
import { ReadingsHistory } from "@/components/ReadingsHistory"
import { BloodPressureForm } from "@/components/BloodPressureForm"
import { type Reading } from "@/services/bloodPressure"

interface DashboardViewProps {
  readings: Reading[]
  isLoading: boolean
  fetchReadings: () => Promise<void>
}

export function DashboardView({ readings, isLoading, fetchReadings }: DashboardViewProps) {
  return (
    <div className="grid gap-12 lg:grid-cols-1">
      <BloodPressureForm onSuccess={fetchReadings} />
      
      {isLoading && readings.length === 0 ? (
        <div className="flex h-64 items-center justify-center rounded-[2.5rem] bg-white/20 backdrop-blur-xl">
          <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
        </div>
      ) : readings.length > 0 ? (
        <>
          <HealthStatsCards readings={readings} />
          <div className="flex justify-end mb-[-40px] relative z-10 pt-4">
            <ExportDropdown readings={readings} />
          </div>
          <BloodPressureChart data={readings} />
          <ReadingsHistory 
            readings={readings} 
            onRefresh={fetchReadings} 
          />
        </>
      ) : (
        <div className="rounded-[2.5rem] bg-white/20 p-12 text-center backdrop-blur-xl dark:bg-slate-900/20 border border-white/20">
          <p className="text-slate-500 font-medium">Aún no tienes lecturas registradas.</p>
          <p className="text-xs text-slate-400 mt-2">Usa el formulario de arriba para comenzar tu seguimiento.</p>
        </div>
      )}
    </div>
  )
}
