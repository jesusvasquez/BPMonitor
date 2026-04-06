import * as React from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { format } from "date-fns"
import { Calendar as CalendarIcon, Loader2, Save } from "lucide-react"
import { toast } from "sonner"
import { insertReading } from "@/services/bloodPressure"
import type { SubmitHandler } from "react-hook-form"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

const formSchema = z.object({
  systolic: z.coerce
    .number()
    .int()
    .positive("La presión sistólica debe ser un número entero positivo")
    .min(50, "Valor demasiado bajo")
    .max(250, "Valor demasiado alto"),
  diastolic: z.coerce
    .number()
    .int()
    .positive("La presión diastólica debe ser un número entero positivo")
    .min(30, "Valor demasiado bajo")
    .max(150, "Valor demasiado alto"),
  pulse: z.coerce
    .number()
    .int()
    .positive("El pulso debe ser un número entero positivo")
    .min(30, "Valor demasiado bajo")
    .max(220, "Valor demasiado alto"),
  date: z.date(),
})

type FormValues = z.infer<typeof formSchema>

interface BloodPressureFormProps {
  onSuccess?: () => void
}

export function BloodPressureForm({ onSuccess }: BloodPressureFormProps) {
  const [isLoading, setIsLoading] = React.useState(false)

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema) as any,
    defaultValues: {
      systolic: 120,
      diastolic: 80,
      pulse: 70,
      date: new Date(),
    },
  })

  const onSubmit: SubmitHandler<FormValues> = async (data) => {
    setIsLoading(true)
    
    try {
      await insertReading({
        sistolica: data.systolic,
        diastolica: data.diastolic,
        pulso: data.pulse,
        created_at: data.date.toISOString(),
      })
      
      toast.success("Lectura guardada", {
        description: `${format(data.date, "PPP")} | ${data.systolic}/${data.diastolic} mmHg`,
      })
      
      onSuccess?.()
      
      form.reset({
        systolic: 120,
        diastolic: 80,
        pulse: 70,
        date: new Date(),
      })
    } catch (error: any) {
      toast.error("Error al guardar", {
        description: error.message || "Ocurrió un error inesperado",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="mx-auto w-full max-w-md border-none bg-white/80 shadow-2xl backdrop-blur-xl dark:bg-slate-900/80 sm:rounded-[2.5rem]">
      <CardHeader className="space-y-1 pb-8 text-center">
        <CardTitle className="text-3xl font-semibold tracking-tight text-slate-900 dark:text-slate-50">
          Nueva Lectura
        </CardTitle>
        <CardDescription className="text-slate-500 dark:text-slate-400">
          Registra tus niveles actuales de presión arterial
        </CardDescription>
      </CardHeader>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <CardContent className="grid gap-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="systolic" className="text-xs font-medium uppercase tracking-wider text-slate-500">
                Sistólica (mmHg)
              </Label>
              <Input
                id="systolic"
                type="number"
                placeholder="120"
                className="h-12 rounded-2xl border-slate-200 bg-slate-50/50 px-4 focus-visible:ring-slate-400 dark:border-slate-800 dark:bg-slate-900/50"
                {...form.register("systolic")}
              />
              {form.formState.errors.systolic && (
                <p className="text-[10px] font-medium text-red-500">{form.formState.errors.systolic.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="diastolic" className="text-xs font-medium uppercase tracking-wider text-slate-500">
                Diastólica (mmHg)
              </Label>
              <Input
                id="diastolic"
                type="number"
                placeholder="80"
                className="h-12 rounded-2xl border-slate-200 bg-slate-50/50 px-4 focus-visible:ring-slate-400 dark:border-slate-800 dark:bg-slate-900/50"
                {...form.register("diastolic")}
              />
              {form.formState.errors.diastolic && (
                <p className="text-[10px] font-medium text-red-500">{form.formState.errors.diastolic.message}</p>
              )}
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="pulse" className="text-xs font-medium uppercase tracking-wider text-slate-500">
              Pulso (BPM)
            </Label>
            <Input
              id="pulse"
              type="number"
              placeholder="72"
              className="h-12 rounded-2xl border-slate-200 bg-slate-50/50 px-4 focus-visible:ring-slate-400 dark:border-slate-800 dark:bg-slate-900/50"
              {...form.register("pulse")}
            />
            {form.formState.errors.pulse && (
              <p className="text-[10px] font-medium text-red-500">{form.formState.errors.pulse.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-medium uppercase tracking-wider text-slate-500">Fecha y Hora</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={cn(
                    "h-12 w-full justify-start rounded-2xl border-slate-200 bg-slate-50/50 px-4 text-left font-normal hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-900/50 dark:hover:bg-slate-800",
                    !form.watch("date") && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-3 h-4 w-4 opacity-50" />
                  {form.watch("date") ? format(form.watch("date"), "PPP p") : <span>Seleccionar fecha</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 rounded-3xl border-none shadow-2xl" align="start">
                <Calendar
                  mode="single"
                  selected={form.watch("date")}
                  onSelect={(date) => date && form.setValue("date", date)}
                  initialFocus
                  className="rounded-3xl"
                />
              </PopoverContent>
            </Popover>
          </div>
        </CardContent>
        <CardFooter className="pt-4">
          <Button 
            disabled={isLoading}
            className="h-14 w-full rounded-[1.25rem] bg-slate-900 text-base font-semibold transition-all hover:bg-slate-800 active:scale-[0.98] dark:bg-slate-50 dark:text-slate-900 dark:hover:bg-slate-200" 
            type="submit"
          >
            {isLoading ? (
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            ) : (
              <Save className="mr-2 h-5 w-5" />
            )}
            Registrar Lectura
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}
