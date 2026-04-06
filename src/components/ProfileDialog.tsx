import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { useAuth } from "@/contexts/AuthContext"
import { updateProfile, uploadAvatar } from "@/services/profile"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { 
  Camera, 
  Loader2, 
  Upload, 
  X
} from "lucide-react"
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
import { toast } from "sonner"

const profileSchema = z.object({
  nombre: z.string().min(2, "El nombre debe tener al menos 2 caracteres").max(50),
  nombre_medico: z.string().max(50).optional().or(z.literal("")),
})

type ProfileFormValues = z.infer<typeof profileSchema>

interface ProfileDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ProfileDialog({ open, onOpenChange }: ProfileDialogProps) {
  const { user, profile, refreshProfile } = useAuth()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  const userInitials = profile?.nombre
    ? profile.nombre.trim().split(/\s+/).map(n => n[0]).filter(Boolean).join('').toUpperCase().slice(0, 2)
    : "U"

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      nombre: "",
      nombre_medico: "",
    },
  })

  // Cargar datos actuales del perfil cuando se abre el diálogo
  useEffect(() => {
    if (open && profile) {
      form.reset({
        nombre: profile.nombre || "",
        nombre_medico: profile.nombre_medico || "",
      })
      setPreviewUrl(profile.avatar_url)
    } else if (open) {
      setSelectedFile(null)
      setPreviewUrl(null)
    }
  }, [open, profile, form])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      const url = URL.createObjectURL(file)
      setPreviewUrl(url)
    }
  }

  const removeSelectedFile = () => {
    setSelectedFile(null)
    setPreviewUrl(profile?.avatar_url || null)
  }

  const onSubmit = async (values: ProfileFormValues) => {
    if (!user) return

    setIsSubmitting(true)
    try {
      let avatarUrl = profile?.avatar_url || null

      // 1. Subir nueva foto si se seleccionó una
      if (selectedFile) {
        avatarUrl = await uploadAvatar(user.id, selectedFile)
      }

      // 2. Actualizar perfil en la base de datos
      await updateProfile(user.id, {
        nombre: values.nombre,
        nombre_medico: values.nombre_medico || null,
        avatar_url: avatarUrl,
      })

      await refreshProfile()
      toast.success("Perfil actualizado correctamente")
      onOpenChange(false)
    } catch (error) {
      console.error("Error al actualizar perfil:", error)
      toast.error("No se pudo actualizar el perfil")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] rounded-[2rem] border-none bg-white/80 backdrop-blur-2xl dark:bg-slate-900/80 shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold tracking-tight">Mi Perfil</DialogTitle>
          <DialogDescription className="text-slate-500">
            Personaliza tu información para los reportes médicos.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center justify-center py-6">
          <div className="relative group">
            <Avatar className="h-28 w-28 border-4 border-white shadow-2xl dark:border-slate-800 transition-transform duration-300 group-hover:scale-105">
              <AvatarImage src={previewUrl || ""} className="object-cover" />
              <AvatarFallback className="bg-slate-900 text-white dark:bg-white dark:text-slate-900 font-bold text-2xl">
                {userInitials}
              </AvatarFallback>
            </Avatar>
            
            <label 
              htmlFor="avatar-upload" 
              className="absolute bottom-0 right-0 h-10 w-10 bg-slate-900 text-white rounded-full flex items-center justify-center cursor-pointer shadow-lg hover:bg-slate-800 transition-colors dark:bg-white dark:text-slate-900"
            >
              <Camera className="h-5 w-5" />
              <input 
                id="avatar-upload" 
                type="file" 
                className="hidden" 
                accept="image/*"
                onChange={handleFileSelect}
                disabled={isSubmitting}
              />
            </label>

            {selectedFile && (
              <button
                onClick={removeSelectedFile}
                className="absolute -top-2 -right-2 h-7 w-7 bg-red-500 text-white rounded-full flex items-center justify-center shadow-md hover:bg-red-600 transition-colors"
                title="Quitar imagen seleccionada"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          
          {selectedFile ? (
            <p className="mt-3 text-xs font-semibold text-slate-500 flex items-center gap-1">
              <Upload className="h-3 w-3" />
              Nueva imagen lista para subir
            </p>
          ) : (
            <p className="mt-3 text-xs font-medium text-slate-400">
              Haz clic en la cámara para cambiar tu foto
            </p>
          )}
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 pt-4">
            <FormField
              control={form.control}
              name="nombre"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Nombre del Paciente
                  </FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Ej: Juan Pérez" 
                      {...field} 
                      className="h-12 rounded-2xl bg-slate-100/50 border-none focus-visible:ring-2 focus-visible:ring-slate-900 dark:bg-slate-800/50 dark:focus-visible:ring-white transition-all"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="nombre_medico"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Nombre de tu Médico (Opcional)
                  </FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Ej: Dra. García" 
                      {...field} 
                      className="h-12 rounded-2xl bg-slate-100/50 border-none focus-visible:ring-2 focus-visible:ring-slate-900 dark:bg-slate-800/50 dark:focus-visible:ring-white transition-all"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="pt-4">
              <Button 
                type="submit" 
                disabled={isSubmitting}
                className="w-full h-12 rounded-2xl bg-slate-900 text-white hover:bg-slate-800 active:scale-95 transition-all dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200 shadow-xl shadow-slate-900/10 dark:shadow-white/5 font-bold"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  "Guardar Cambios"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
