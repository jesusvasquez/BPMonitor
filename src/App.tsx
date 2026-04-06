import * as React from "react"
import { BloodPressureForm } from "@/components/BloodPressureForm"
import { ThemeToggle } from "@/components/ThemeToggle"
import { Toaster } from "sonner"
import { ThemeProvider } from "@/components/theme-provider"
import { AuthProvider, useAuth } from "@/contexts/AuthContext"
import { LoginForm } from "@/components/LoginForm"
import { 
  LogOut, 
  Loader2, 
  Settings 
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { BloodPressureChart } from "@/components/BloodPressureChart"
import { ReadingsHistory } from "@/components/ReadingsHistory"
import { ProfileDialog } from "@/components/ProfileDialog"
import { ExportDropdown } from "@/components/ExportDropdown"
import { getReadings, type Reading } from "@/services/bloodPressure"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

function AppContent() {
  const { user, profile, signOut } = useAuth()
  const [readings, setReadings] = React.useState<Reading[]>([])
  const [isLoading, setIsLoading] = React.useState(false)
  const [isProfileOpen, setIsProfileOpen] = React.useState(false)

  const userInitials = React.useMemo(() => {
    if (profile?.nombre) {
      const parts = profile.nombre.trim().split(/\s+/)
      const initials = parts
        .map(part => part[0])
        .filter(Boolean)
        .join('')
        .toUpperCase()
        .slice(0, 2)
      if (initials) return initials
    }
    return user?.email?.charAt(0).toUpperCase() || 'U'
  }, [profile, user])

  const fetchReadings = React.useCallback(async () => {
    if (!user) return
    setIsLoading(true)
    console.log("[App] Iniciando fetchReadings para:", user.email);
    try {
      const data = await getReadings()
      console.log("[App] Datos recibidos del servicio:", data.length);
      setReadings(data)
    } catch (error) {
      console.error("[App] Error al obtener lecturas:", error)
    } finally {
      setIsLoading(false)
    }
  }, [user])

  React.useEffect(() => {
    if (user) {
      fetchReadings()
    }
  }, [user, fetchReadings])

  // Log para rastrear cambios en el estado de readings
  React.useEffect(() => {
    console.log("[App] El estado 'readings' ha cambiado. Nuevo tamaño:", readings.length);
  }, [readings])

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-slate-50 text-slate-900 transition-colors duration-500 dark:bg-[#08090a] dark:text-slate-100">
      {/* Background Gradients for Apple Aesthetic */}
      <div className="absolute -top-[10%] -left-[10%] h-[600px] w-[600px] rounded-full bg-blue-400/10 blur-[120px] dark:bg-blue-600/5 transition-opacity" />
      <div className="absolute -bottom-[10%] -right-[10%] h-[600px] w-[600px] rounded-full bg-purple-400/10 blur-[120px] dark:bg-purple-600/5 transition-opacity" />
      
      <header className="fixed top-0 left-0 right-0 z-50 flex h-20 items-center justify-between px-6 backdrop-blur-xl lg:px-12 border-b border-slate-200/50 dark:border-slate-800/50">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-slate-900 shadow-lg dark:bg-slate-50" />
          <span className="text-xl font-bold tracking-tight">BP Monitor</span>
        </div>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          {user && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="relative h-11 w-11 rounded-xl bg-white/50 backdrop-blur-md shadow-sm active:scale-95 dark:bg-slate-900/50 p-0"
                >
                  <Avatar className="h-9 w-9 rounded-lg border-2 border-white dark:border-slate-800">
                    <AvatarImage src={profile?.avatar_url || ""} />
                    <AvatarFallback className="rounded-lg bg-slate-900 text-white dark:bg-white dark:text-slate-900 text-xs font-bold">
                      {userInitials}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 rounded-2xl border-none bg-white/80 backdrop-blur-2xl dark:bg-slate-900/80 shadow-2xl p-2">
                <DropdownMenuLabel className="px-3 py-2">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-bold leading-none">{profile?.nombre || 'Usuario'}</p>
                    <p className="text-xs leading-none text-slate-500">{user.email}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-slate-200/50 dark:bg-slate-800/50" />
                <DropdownMenuItem 
                  onClick={() => setIsProfileOpen(true)}
                  className="flex items-center gap-2 p-3 rounded-xl focus:bg-slate-100 dark:focus:bg-slate-800 cursor-pointer transition-colors"
                >
                  <Settings className="h-4 w-4 text-slate-500" />
                  <span className="font-semibold text-sm">Editar Perfil</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-slate-200/50 dark:bg-slate-800/50" />
                <DropdownMenuItem 
                  onSelect={() => signOut()}
                  className="flex items-center gap-2 p-3 rounded-xl focus:bg-red-50 text-red-600 dark:focus:bg-red-900/20 cursor-pointer transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                  <span className="font-semibold text-sm">Cerrar Sesión</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </header>

      <main className="container mx-auto flex min-h-screen flex-col items-center pt-32 pb-20 px-6">
        <div className="w-full max-w-2xl space-y-16">
          {!user ? (
            <div className="flex justify-center pt-20">
              <LoginForm />
            </div>
          ) : (
            <>
              <div className="text-center space-y-2">
                <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-br from-slate-900 to-slate-500 bg-clip-text text-transparent dark:from-white dark:to-slate-400">
                  Panel de Salud
                </h1>
                <div className="flex flex-col items-center">
                  {profile?.nombre && (
                    <p className="text-lg font-bold text-slate-900 dark:text-white uppercase tracking-tight">
                      {profile.nombre}
                    </p>
                  )}
                  <p className="text-slate-500 font-medium text-sm">{user?.email || 'ID: ' + user?.id.slice(0, 8)}</p>
                </div>
              </div>

              <div className="grid gap-12 lg:grid-cols-1">
                <BloodPressureForm onSuccess={fetchReadings} />
                
                {isLoading && readings.length === 0 ? (
                  <div className="flex h-64 items-center justify-center rounded-[2.5rem] bg-white/20 backdrop-blur-xl">
                    <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
                  </div>
                ) : readings.length > 0 ? (
                  <>
                    <div className="flex justify-end mb-[-40px] relative z-10">
                      <ExportDropdown readings={readings} />
                    </div>
                    <BloodPressureChart data={readings} />
                    <ReadingsHistory readings={readings} onRefresh={fetchReadings} />
                  </>
                ) : (
                  <div className="rounded-[2.5rem] bg-white/20 p-12 text-center backdrop-blur-xl dark:bg-slate-900/20 border border-white/20">
                    <p className="text-slate-500 font-medium">Aún no tienes lecturas registradas.</p>
                    <p className="text-xs text-slate-400 mt-2">Usa el formulario de arriba para comenzar tu seguimiento.</p>
                  </div>
                )}
              </div>

              <p className="px-8 text-center text-[10px] text-slate-500/60 leading-relaxed max-w-md mx-auto">
                Tus datos se guardan de forma segura encriptados en tu cuenta personal de Supabase bajo políticas de seguridad de nivel bancario.
              </p>

              <ProfileDialog open={isProfileOpen} onOpenChange={setIsProfileOpen} />
            </>
          )}
        </div>
      </main>
      
      <Toaster position="top-center" richColors closeButton />
    </div>
  )
}

function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  )
}

export default App
