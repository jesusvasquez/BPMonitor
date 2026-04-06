import { useState } from "react"
import { FileDown, FileText, Table, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { exportToCSV, exportToPDF } from "@/services/reportExport"
import type { Reading } from "@/services/bloodPressure"
import { useAuth } from "@/contexts/AuthContext"
import { toast } from "sonner"

interface ExportDropdownProps {
  readings: Reading[]
}

export function ExportDropdown({ readings }: ExportDropdownProps) {
  const { profile, user } = useAuth()
  const [isExporting, setIsExporting] = useState(false)

  const handleExportPDF = async () => {
    if (!user) return
    setIsExporting(true)
    const toastId = toast.loading("Generando reporte PDF profesional...")
    
    try {
      await exportToPDF(readings, profile, user.email!)
      toast.success("Reporte PDF generado", { id: toastId })
    } catch (error) {
      console.error("Error exporting PDF:", error)
      toast.error("Error al generar PDF", { id: toastId })
    } finally {
      setIsExporting(false)
    }
  }

  const handleExportCSV = () => {
    try {
      exportToCSV(readings, profile)
      toast.success("Archivo CSV descargado")
    } catch (error) {
      console.error("Error exporting CSV:", error)
      toast.error("Error al generar CSV")
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          disabled={isExporting || readings.length === 0}
          className="h-11 px-4 gap-2 rounded-xl bg-white/50 backdrop-blur-md border-slate-200 dark:bg-slate-900/50 dark:border-slate-800 active:scale-95 transition-all shadow-sm font-semibold"
        >
          {isExporting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <FileDown className="h-4 w-4" />
          )}
          <span>Exportar</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 rounded-2xl border-none bg-white/80 backdrop-blur-2xl dark:bg-slate-900/80 shadow-2xl p-2">
        <DropdownMenuLabel className="px-3 py-2 text-xs font-bold uppercase tracking-wider text-slate-500">
          Opciones Médico
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-slate-200/50 dark:bg-slate-800/50" />
        <DropdownMenuItem 
          onClick={handleExportPDF}
          className="flex items-center gap-2 p-3 rounded-xl focus:bg-slate-100 dark:focus:bg-slate-800 cursor-pointer transition-colors"
        >
          <FileText className="h-4 w-4 text-blue-500" />
          <div className="flex flex-col">
            <span className="font-semibold text-sm">Descargar PDF</span>
            <span className="text-[10px] text-slate-500">Formato profesional (WhatsApp)</span>
          </div>
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={handleExportCSV}
          className="flex items-center gap-2 p-3 rounded-xl focus:bg-slate-100 dark:focus:bg-slate-800 cursor-pointer transition-colors"
        >
          <Table className="h-4 w-4 text-green-500" />
          <div className="flex flex-col">
            <span className="font-semibold text-sm">Descargar CSV</span>
            <span className="text-[10px] text-slate-500">Para Excel o bases de datos</span>
          </div>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
