import * as React from "react"
import { format, parseISO, isSameDay, subDays, startOfYear, isAfter, isToday } from "date-fns"
import { es } from "date-fns/locale"
import { 
  ArrowLeft, 
  History, 
  TrendingUp,
  Filter,
  ChevronDown,
  ChevronRight,
  Maximize2,
  Minimize2
} from "lucide-react"
import { Link } from "react-router-dom"
import { Button, buttonVariants } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card } from "@/components/ui/card"
import { type Reading } from "@/services/bloodPressure"
import { ReadingsHistory } from "./ReadingsHistory"
import { BloodPressureChart } from "./BloodPressureChart"
import { cn } from "@/lib/utils"

interface ReadingsHistoryViewProps {
  readings: Reading[]
  onRefresh: () => void
}

type Period = 'today' | 'week' | 'month' | 'year' | 'all'

export function ReadingsHistoryView({ readings, onRefresh }: ReadingsHistoryViewProps) {
  const [period, setPeriod] = React.useState<Period>('week')
  const [expandedDays, setExpandedDays] = React.useState<Record<string, boolean>>({})

  const filteredReadings = React.useMemo(() => {
    const now = new Date()
    switch (period) {
      case 'today':
        return readings.filter(r => {
          const d = typeof r.created_at === 'string' ? parseISO(r.created_at) : (r.created_at as Date)
          return isSameDay(d, now)
        })
      case 'week':
        const weekAgo = subDays(now, 7)
        return readings.filter(r => {
          const d = typeof r.created_at === 'string' ? parseISO(r.created_at) : (r.created_at as Date)
          return isAfter(d, weekAgo)
        })
      case 'month':
        const monthAgo = subDays(now, 30)
        return readings.filter(r => {
          const d = typeof r.created_at === 'string' ? parseISO(r.created_at) : (r.created_at as Date)
          return isAfter(d, monthAgo)
        })
      case 'year':
        const yearStart = startOfYear(now)
        return readings.filter(r => {
          const d = typeof r.created_at === 'string' ? parseISO(r.created_at) : (r.created_at as Date)
          return isAfter(d, yearStart)
        })
      case 'all':
      default:
        return readings
    }
  }, [readings, period])

  // Agrupar lecturas por día
  const groupedReadings = React.useMemo(() => {
    const groups: Record<string, Reading[]> = {}
    
    filteredReadings.forEach(reading => {
      const date = typeof reading.created_at === 'string' ? parseISO(reading.created_at) : (reading.created_at as Date)
      const dateKey = format(date, "d 'de' MMMM, yyyy", { locale: es })
      
      if (!groups[dateKey]) {
        groups[dateKey] = []
      }
      groups[dateKey].push(reading)
    })
    
    return groups
  }, [filteredReadings])

  // Inicializar días expandidos (solo el primero o Hoy)
  React.useEffect(() => {
    const dateEntries = Object.keys(groupedReadings)
    if (dateEntries.length > 0) {
      const initialExpanded: Record<string, boolean> = {}
      
      // Intentar encontrar "Hoy"
      const todayKey = dateEntries.find(key => {
        const readingsInDay = groupedReadings[key]
        if (readingsInDay.length === 0) return false
        const date = typeof readingsInDay[0].created_at === 'string' 
          ? parseISO(readingsInDay[0].created_at) 
          : (readingsInDay[0].created_at as Date)
        return isToday(date)
      })

      if (todayKey) {
        initialExpanded[todayKey] = true
      } else {
        // Si no hay hoy, expandir el primero
        initialExpanded[dateEntries[0]] = true
      }
      
      setExpandedDays(initialExpanded)
    }
  }, [groupedReadings])

  const toggleDay = (day: string) => {
    setExpandedDays(prev => ({
      ...prev,
      [day]: !prev[day]
    }))
  }

  const expandAll = () => {
    const allExpanded: Record<string, boolean> = {}
    Object.keys(groupedReadings).forEach(day => {
      allExpanded[day] = true
    })
    setExpandedDays(allExpanded)
  }

  const collapseAll = () => {
    setExpandedDays({})
  }

  // Mapeo de periodo a rango de gráfica
  const chartRange = React.useMemo(() => {
    if (period === 'today') return 'day'
    if (period === 'week') return 'week'
    return 'month' // Para month, year y all usamos month como base de visualización
  }, [period])

  return (
    <div className="w-full space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header section with back button */}
      <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Link 
              to="/"
              className={cn(
                buttonVariants({ variant: "ghost", size: "icon" }),
                "h-10 w-10 rounded-xl hover:bg-slate-200/50 dark:hover:bg-slate-800/50 transition-all active:scale-90"
              )}
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-br from-slate-900 to-slate-500 bg-clip-text text-transparent dark:from-white dark:to-slate-400">
              Historial Completo
            </h1>
          </div>
          <p className="pl-12 text-sm text-slate-500 font-medium flex items-center gap-2">
            <History className="h-4 w-4 opacity-40" />
            Explora tus registros organizados por tiempo
          </p>
        </div>
        
        <div className="flex items-center gap-3 pl-12 sm:pl-0">
          <Badge variant="outline" className="h-8 rounded-full border-slate-200 bg-white/50 px-3 text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:border-slate-800 dark:bg-slate-900/50">
            {filteredReadings.length} Registros
          </Badge>
        </div>
      </div>

      {/* Filters / Tabs section */}
      <div className="sticky top-24 z-30 bg-slate-50/10 backdrop-blur-md rounded-[2rem] p-1 shadow-sm border border-white/20 dark:bg-[#08090a]/10">
        <Tabs value={period} onValueChange={(v) => setPeriod(v as Period)} className="w-full">
          <TabsList className="grid w-full grid-cols-5 p-1 rounded-[1.8rem] h-12 bg-slate-100/50 dark:bg-slate-900/50">
            <TabsTrigger value="today" className="rounded-2xl text-[10px] font-bold uppercase tracking-wider py-2">Hoy</TabsTrigger>
            <TabsTrigger value="week" className="rounded-2xl text-[10px] font-bold uppercase tracking-wider py-2">7d</TabsTrigger>
            <TabsTrigger value="month" className="rounded-2xl text-[10px] font-bold uppercase tracking-wider py-2">30d</TabsTrigger>
            <TabsTrigger value="year" className="rounded-2xl text-[10px] font-bold uppercase tracking-wider py-2">Año</TabsTrigger>
            <TabsTrigger value="all" className="rounded-2xl text-[10px] font-bold uppercase tracking-wider py-2">Todo</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Dynamic Mini-Chart Section */}
      <div className="animate-in zoom-in-95 duration-500 delay-150">
        {filteredReadings.length > 0 ? (
          <div className="mb-8">
            <BloodPressureChart 
              data={filteredReadings} 
              rangeProp={chartRange}
              hideSelector={true}
            />
          </div>
        ) : (
          <Card className="border-none bg-white/40 backdrop-blur-xl dark:bg-slate-900/40 rounded-[2.5rem] p-12 text-center">
            <div className="flex flex-col items-center gap-3">
              <TrendingUp className="h-12 w-12 text-slate-200 dark:text-slate-700" />
              <p className="text-slate-500 font-medium">No hay suficientes datos para este periodo.</p>
            </div>
          </Card>
        )}
      </div>

      {/* Toolbar for Expand/Collapse All and Section Title */}
      <div className="sticky top-[156px] z-20 flex items-center justify-between bg-slate-50/80 px-4 py-3 backdrop-blur-md border-b border-slate-200/50 dark:bg-[#08090a]/80 dark:border-slate-800/50 rounded-t-[2rem]">
        <h2 className="text-sm font-bold uppercase tracking-widest text-slate-900 dark:text-slate-100">Registros Diarios</h2>
        {Object.keys(groupedReadings).length > 1 && (
          <div className="flex gap-1">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={expandAll}
              className="h-8 rounded-full px-3 text-[10px] font-bold uppercase tracking-wider text-slate-500 hover:text-slate-900 dark:hover:text-slate-100"
            >
              <Maximize2 className="mr-1.5 h-3.5 w-3.5" />
              Expandir
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={collapseAll}
              className="h-8 rounded-full px-3 text-[10px] font-bold uppercase tracking-wider text-slate-500 hover:text-slate-900 dark:hover:text-slate-100"
            >
              <Minimize2 className="mr-1.5 h-3.5 w-3.5" />
              Colapsar
            </Button>
          </div>
        )}
      </div>

      {/* Grouped Readings List with Collapsible Logic */}
      <div className="space-y-6 pt-2">
        {Object.entries(groupedReadings).map(([dateLabel, dayReadings]) => {
          const isExpanded = !!expandedDays[dateLabel]
          
          return (
            <div key={dateLabel} className="space-y-4">
              <button 
                onClick={() => toggleDay(dateLabel)}
                className="group flex w-full items-center gap-3 px-4 transition-opacity hover:opacity-80"
              >
                <div className="h-[1px] flex-1 bg-slate-200 dark:bg-slate-800 transition-colors group-hover:bg-slate-300 dark:group-hover:bg-slate-700" />
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-slate-400 dark:text-slate-600">
                    {dateLabel}
                  </span>
                  {isExpanded ? (
                    <ChevronDown className="h-3 w-3 text-slate-400" />
                  ) : (
                    <ChevronRight className="h-3 w-3 text-slate-400" />
                  )}
                </div>
                <div className="h-[1px] flex-1 bg-slate-200 dark:bg-slate-800 transition-colors group-hover:bg-slate-300 dark:group-hover:bg-slate-700" />
              </button>
              
              {isExpanded && (
                <div className="grid gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
                  <ReadingsHistory 
                    readings={dayReadings} 
                    onRefresh={onRefresh}
                    showAll={true}
                  />
                </div>
              )}
            </div>
          )
        })}

        {filteredReadings.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
            <div className="p-6 rounded-full bg-slate-100 dark:bg-slate-900 mb-2">
              <Filter className="h-8 w-8 text-slate-300" />
            </div>
            <h3 className="text-xl font-bold">Sin registros</h3>
            <p className="text-slate-400 text-sm max-w-xs">No se encontraron lecturas en este periodo de tiempo seleccionado.</p>
          </div>
        )}
      </div>

      {/* Safe bottom margin */}
      <div className="h-20" />
    </div>
  )
}
