import { BloodPressureForm } from "@/components/BloodPressureForm"
import { ThemeToggle } from "@/components/ThemeToggle"
import { Toaster } from "sonner"
import { ThemeProvider } from "@/components/theme-provider"
import { AuthProvider, useAuth } from "@/contexts/AuthContext"
import { LoginForm } from "@/components/LoginForm"
import { LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"

function AppContent() {
  const { user, signOut } = useAuth()

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-slate-50 text-slate-900 transition-colors duration-500 dark:bg-[#08090a] dark:text-slate-100">
      {/* Background Gradients for Apple Aesthetic */}
      <div className="absolute -top-[10%] -left-[10%] h-[400px] w-[400px] rounded-full bg-blue-400/20 blur-[120px] dark:bg-blue-600/10" />
      <div className="absolute -bottom-[10%] -right-[10%] h-[400px] w-[400px] rounded-full bg-purple-400/20 blur-[120px] dark:bg-purple-600/10" />
      
      <header className="flex h-20 items-center justify-between px-6 lg:px-12">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-slate-900 dark:bg-slate-50" />
          <span className="text-xl font-bold tracking-tight">BP Monitor</span>
        </div>
        <div className="flex items-center gap-4">
          <ThemeToggle />
          {user && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => signOut()}
              className="h-12 w-12 rounded-2xl bg-white/50 backdrop-blur-md shadow-sm active:scale-95 dark:bg-slate-900/50"
            >
              <LogOut className="h-[1.2rem] w-[1.2rem] text-slate-700 dark:text-slate-300" />
            </Button>
          )}
        </div>
      </header>

      <main className="flex min-h-[calc(100vh-80px)] flex-col items-center justify-center p-6 pb-20">
        <div className="w-full max-w-md space-y-8">
          {!user ? (
            <LoginForm />
          ) : (
            <>
              <div className="text-center space-y-2 mb-4">
                <h1 className="text-2xl font-bold tracking-tight">¡Hola de nuevo!</h1>
                <p className="text-slate-500">{user.email}</p>
              </div>
              <BloodPressureForm />
              <p className="px-8 text-center text-sm text-slate-500 dark:text-slate-500">
                Tus datos se guardan de forma segura en tu cuenta personal de Supabase.
              </p>
            </>
          )}
        </div>
      </main>
      
      <Toaster position="top-center" richColors />
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
