import * as React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { format } from "date-fns"
import { CalendarIcon, Loader2 } from "lucide-react"
import { es } from "date-fns/locale"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { cn } from "@/lib/utils"
import { updateReading, type Reading } from "@/services/bloodPressure"

const formSchema = z.object({
  systolic: z.number().min(40, "Mínimo 40").max(300, "Máximo 300"),
  diastolic: z.number().min(30, "Mínimo 30").max(200, "Máximo 200"),
  pulse: z.number().min(30, "Mínimo 30").max(250, "Máximo 250"),
  date: z.date(),
})

type FormValues = {
  systolic: number
  diastolic: number
  pulse: number
  date: Date
}

interface EditReadingDialogProps {
  reading: Reading | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function EditReadingDialog({ reading, open, onOpenChange, onSuccess }: EditReadingDialogProps) {
  const [isLoading, setIsLoading] = React.useState(false)

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema) as any, // Forced cast to bypass persistent resolver issues
    defaultValues: {
      systolic: 120,
      diastolic: 80,
      pulse: 70,
      date: new Date(),
    }
  })

  React.useEffect(() => {
    if (reading && open) {
      form.reset({
        systolic: reading.sistolica,
        diastolic: reading.diastolica,
        pulse: reading.pulso,
        date: typeof reading.created_at === 'string' ? new Date(reading.created_at) : reading.created_at,
      })
    }
  }, [reading, open, form])

  async function onSubmit(values: FormValues) {
    if (!reading?.id) return
    setIsLoading(true)
    console.log("[EditReadingDialog] Enviando actualización para ID:", reading.id, values);
    try {
      await updateReading(reading.id, {
        sistolica: values.systolic,
        diastolica: values.diastolic,
        pulso: values.pulse,
        created_at: values.date.toISOString(),
      })
      toast.success("Lectura actualizada")
      onSuccess()
      onOpenChange(false)
    } catch (error: any) {
      console.error("[EditReadingDialog] Error al actualizar:", error);
      toast.error("Error al actualizar", { description: error.message })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] rounded-[2rem] border-none bg-white/90 backdrop-blur-2xl dark:bg-slate-900/90 shadow-2xl overflow-hidden">
        <DialogHeader className="pt-6 px-6">
          <DialogTitle className="text-2xl font-bold">Editar Registro</DialogTitle>
          <DialogDescription>
            Ajusta los valores de tu toma de presión arterial.
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 p-6">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="systolic"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-semibold uppercase tracking-wider text-slate-500">Sistólica</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        {...field} 
                        onChange={(e) => field.onChange(Number(e.target.value))}
                        className="rounded-2xl bg-slate-50 border-slate-100 dark:bg-slate-800 dark:border-slate-700 h-11" 
                      />
                    </FormControl>
                    <FormMessage className="text-[10px]" />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="diastolic"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-semibold uppercase tracking-wider text-slate-500">Diastólica</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        {...field} 
                        onChange={(e) => field.onChange(Number(e.target.value))}
                        className="rounded-2xl bg-slate-50 border-slate-100 dark:bg-slate-800 dark:border-slate-700 h-11" 
                      />
                    </FormControl>
                    <FormMessage className="text-[10px]" />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="pulse"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-semibold uppercase tracking-wider text-slate-500">Pulso (BPM)</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      {...field} 
                      onChange={(e) => field.onChange(Number(e.target.value))}
                      className="rounded-2xl bg-slate-50 border-slate-100 dark:bg-slate-800 dark:border-slate-700 h-11" 
                    />
                  </FormControl>
                  <FormMessage className="text-[10px]" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel className="text-xs font-semibold uppercase tracking-wider text-slate-500">Fecha y Hora</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full pl-3 text-left font-normal rounded-2xl h-11 bg-slate-50 border-slate-100 dark:bg-slate-800 dark:border-slate-700",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value instanceof Date ? (
                            format(field.value, "PPP p", { locale: es })
                          ) : (
                            <span>Seleccionar fecha</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 rounded-3xl overflow-hidden border-none shadow-2xl" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) =>
                          date > new Date() || date < new Date("1900-01-01")
                        }
                        initialFocus
                        locale={es}
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage className="text-[10px]" />
                </FormItem>
              )}
            />

            <DialogFooter className="mt-8">
              <Button 
                type="submit" 
                disabled={isLoading}
                className="w-full rounded-2xl bg-slate-900 h-12 text-base font-semibold dark:bg-slate-50 dark:text-slate-900 shadow-xl active:scale-95 transition-all"
              >
                {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Guardar Cambios"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
