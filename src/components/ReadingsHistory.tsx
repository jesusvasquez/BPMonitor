import * as React from "react"
import { format, parseISO } from "date-fns"
import { es } from "date-fns/locale"
import { 
  Heart, 
  Activity, 
  Pencil,
  Trash2,
  MoreVertical
} from "lucide-react"
import { toast } from "sonner"
import { Link } from "react-router-dom"

import { Button, buttonVariants } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { deleteReading, type Reading } from "@/services/bloodPressure"
import { EditReadingDialog } from "./EditReadingDialog"
import { cn } from "@/lib/utils"

interface ReadingsHistoryProps {
  readings: Reading[]
  onRefresh: () => void
  showAll?: boolean
}

export function ReadingsHistory({ readings, onRefresh, showAll = false }: ReadingsHistoryProps) {
  const [editingReading, setEditingReading] = React.useState<Reading | null>(null)

  // Log para depuración de sincronización
  React.useEffect(() => {
    console.log("[ReadingsHistory] Se recibió un nuevo array de lecturas:", readings.length);
  }, [readings])

  const getStatusColor = (sys: number, dia: number) => {
    if (sys >= 140 || dia >= 90) return "text-rose-500 bg-rose-50 dark:bg-rose-950/30"
    if (sys >= 130 || dia >= 80) return "text-amber-500 bg-amber-50 dark:bg-amber-950/30"
    if (sys < 120 && dia < 80) return "text-emerald-500 bg-emerald-50 dark:bg-emerald-950/30"
    return "text-blue-500 bg-blue-50 dark:bg-blue-950/30"
  }

  const getStatusLabel = (sys: number, dia: number) => {
    if (sys >= 140 || dia >= 90) return "Hipertensión"
    if (sys >= 130 || dia >= 80) return "Elevada"
    if (sys < 120 && dia < 80) return "Normal"
    return "Pre-hipertensión"
  }

  const handleDelete = async (id: string | undefined) => {
    if (!id) {
      console.error("[ReadingsHistory] Error: No se puede eliminar, el ID es undefined");
      toast.error("Error: ID de registro no encontrado");
      return
    }

    console.log("[ReadingsHistory] 🗑️ Intentando eliminar registro con ID:", id);
    
    try {
      // Llamada al servicio de Supabase
      const success = await deleteReading(id)
      
      if (success) {
        console.log("[ReadingsHistory] ✅ Confirmación de eliminación recibida de Supabase para ID:", id);
        toast.success("Lectura eliminada permanentemente")
        
        // Pequeña pausa para asegurar que Supabase procese el cambio antes de re-descargar
        setTimeout(() => {
          console.log("[ReadingsHistory] 🔄 Disparando onRefresh tras eliminar...");
          onRefresh()
        }, 300)
      }
    } catch (error: any) {
      console.error("[ReadingsHistory] ❌ Error fatal al eliminar:", error);
      toast.error("No se pudo eliminar", { 
        description: error.message || "Error de conexión con la base de datos" 
      })
    }
  }

  if (readings.length === 0) return null

  return (
    <div className="w-full space-y-6">
      {!showAll && (
        <div className="flex items-center justify-between px-2">
          <h2 className="text-2xl font-bold tracking-tight">Historial Detallado</h2>
          <span className="text-xs font-medium text-slate-500 uppercase tracking-widest bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full">
            {readings.length} Registros
          </span>
        </div>
      )}

      <div className="grid gap-4">
        {(showAll ? readings : readings.slice(0, 5)).map((reading) => {
          const readingDate = typeof reading.created_at === "string" 
            ? parseISO(reading.created_at) 
            : reading.created_at as Date
          
          return (
            <div 
              key={reading.id}
              className="group relative flex items-center justify-between p-4 rounded-[2rem] bg-white/40 border border-white/20 backdrop-blur-md shadow-sm transition-all hover:shadow-md hover:bg-white/60 dark:bg-slate-900/40 dark:border-slate-800/40 dark:hover:bg-slate-900/60"
            >
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-2xl ${getStatusColor(reading.sistolica, reading.diastolica)}`}>
                  <Heart className="h-5 w-5 fill-current" />
                </div>
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold tabular-nums">
                      {reading.sistolica}/{reading.diastolica}
                    </span>
                    <span className="text-[10px] font-medium text-slate-400 uppercase tracking-tighter">mmHg</span>
                  </div>
                  <p className="text-xs font-medium text-slate-500 first-letter:uppercase">
                    {format(readingDate, "EEEE, d 'de' MMMM", { locale: es })}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-6">
                <div className="hidden md:flex flex-col items-end gap-1">
                  <div className="flex items-center gap-1.5">
                    <Activity className="h-3 w-3 text-emerald-500" />
                    <span className="text-sm font-bold">{reading.pulso} <span className="text-[10px] font-normal text-slate-400">BPM</span></span>
                  </div>
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${getStatusColor(reading.sistolica, reading.diastolica)}`}>
                    {getStatusLabel(reading.sistolica, reading.diastolica)}
                  </span>
                </div>

                <div className="text-right mr-2">
                  <p className="text-xs font-semibold text-slate-400">
                    {format(readingDate, "HH:mm")}
                  </p>
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-40 rounded-2xl border-none shadow-2xl backdrop-blur-xl bg-white/90 dark:bg-slate-950/90">
                    <DropdownMenuItem 
                      onClick={() => setEditingReading(reading)}
                      className="rounded-xl focus:bg-slate-100 dark:focus:bg-slate-800 gap-2 cursor-pointer py-2.5"
                    >
                      <Pencil className="h-4 w-4 text-blue-500" />
                      <span>Editar</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => {
                        if (confirm("¿Estás seguro de que quieres eliminar este registro?")) {
                          handleDelete(reading.id)
                        }
                      }}
                      className="rounded-xl focus:bg-rose-50 dark:focus:bg-rose-950/30 text-rose-500 gap-2 cursor-pointer py-2.5"
                    >
                      <Trash2 className="h-4 w-4" />
                      <span>Eliminar</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          )
        })}
      </div>

      {readings.length > 5 && !showAll && (
        <div className="flex justify-center pt-2">
          <Link 
            to="/history"
            className={cn(
              buttonVariants({ variant: "ghost" }),
              "rounded-full px-8 text-xs font-bold uppercase tracking-widest text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all hover:scale-105 active:scale-95"
            )}
          >
            Ver Historial Completo
          </Link>
        </div>
      )}

      <EditReadingDialog 
        reading={editingReading}
        open={!!editingReading}
        onOpenChange={(open) => !open && setEditingReading(null)}
        onSuccess={onRefresh}
      />
    </div>
  )
}
