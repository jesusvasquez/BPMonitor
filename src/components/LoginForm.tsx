import * as React from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Eye, EyeOff, Loader2, LogIn, UserPlus } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { signIn, signUp } from "@/services/auth"

const authSchema = z.object({
  email: z.string().email("Correo electrónico inválido"),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
})

type AuthValues = z.infer<typeof authSchema>

export function LoginForm() {
  const [isLoading, setIsLoading] = React.useState(false)
  const [showPassword, setShowPassword] = React.useState(false)

  const form = useForm<AuthValues>({
    resolver: zodResolver(authSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  })

  async function onLogin(data: AuthValues) {
    setIsLoading(true)
    const { error } = await signIn(data.email, data.password)
    
    if (error) {
      toast.error("Error al iniciar sesión", {
        description: error.message,
      })
    } else {
      toast.success("Bienvenido de nuevo")
    }
    setIsLoading(false)
  }

  async function onRegister(data: AuthValues) {
    setIsLoading(true)
    const { error, data: authData } = await signUp(data.email, data.password)
    
    if (error) {
      toast.error("Error al crear cuenta", {
        description: error.message,
      })
    } else if (authData.user && authData.session === null) {
      toast.info("Cuenta creada", {
        description: "Por favor, verifica tu correo electrónico para confirmar tu cuenta.",
      })
    } else {
      toast.success("Cuenta creada exitosamente")
    }
    setIsLoading(false)
  }

  return (
    <Card className="w-full max-w-md border-none bg-white/80 shadow-2xl backdrop-blur-xl dark:bg-slate-900/80 sm:rounded-[2.5rem]">
      <Tabs defaultValue="login" className="w-full">
        <CardHeader className="space-y-1 pb-4 text-center">
          <CardTitle className="text-3xl font-semibold tracking-tight text-slate-900 dark:text-slate-50">
            BPMonitor
          </CardTitle>
          <CardDescription className="text-slate-500 dark:text-slate-400">
            Tu salud, bajo control y siempre contigo
          </CardDescription>
          <TabsList className="grid w-full grid-cols-2 mt-6 rounded-2xl bg-slate-100/50 p-1 dark:bg-slate-800/50">
            <TabsTrigger value="login" className="rounded-xl py-2 text-sm font-medium transition-all data-[state=active]:bg-white data-[state=active]:shadow-sm dark:data-[state=active]:bg-slate-950">
              Iniciar Sesión
            </TabsTrigger>
            <TabsTrigger value="signup" className="rounded-xl py-2 text-sm font-medium transition-all data-[state=active]:bg-white data-[state=active]:shadow-sm dark:data-[state=active]:bg-slate-950">
              Crear Cuenta
            </TabsTrigger>
          </TabsList>
        </CardHeader>
        
        <TabsContent value="login">
          <form onSubmit={form.handleSubmit(onLogin)}>
            <CardContent className="grid gap-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="email-login" className="text-xs font-medium uppercase tracking-wider text-slate-500 ml-1">
                  Email
                </Label>
                <Input
                  id="email-login"
                  type="email"
                  placeholder="ejemplo@correo.com"
                  className="h-12 rounded-2xl border-slate-200 bg-slate-50/50 px-4 focus-visible:ring-slate-400 dark:border-slate-800 dark:bg-slate-900/50"
                  {...form.register("email")}
                />
                {form.formState.errors.email && (
                  <p className="text-[10px] font-medium text-red-500 ml-1">{form.formState.errors.email.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="password-login" className="text-xs font-medium uppercase tracking-wider text-slate-500 ml-1">
                  Contraseña
                </Label>
                <div className="relative">
                  <Input
                    id="password-login"
                    type={showPassword ? "text" : "password"}
                    className="h-12 rounded-2xl border-slate-200 bg-slate-50/50 px-4 focus-visible:ring-slate-400 dark:border-slate-800 dark:bg-slate-900/50"
                    {...form.register("password")}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-2 top-1.5 h-9 w-9 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </Button>
                </div>
                {form.formState.errors.password && (
                  <p className="text-[10px] font-medium text-red-500 ml-1">{form.formState.errors.password.message}</p>
                )}
              </div>
            </CardContent>
            <CardFooter className="pb-8">
              <Button 
                disabled={isLoading}
                className="h-14 w-full rounded-[1.25rem] bg-slate-900 text-base font-semibold transition-all hover:bg-slate-800 active:scale-[0.98] dark:bg-slate-50 dark:text-slate-900 dark:hover:bg-slate-200" 
                type="submit"
              >
                {isLoading ? (
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                ) : (
                  <LogIn className="mr-2 h-5 w-5" />
                )}
                Ingresar
              </Button>
            </CardFooter>
          </form>
        </TabsContent>

        <TabsContent value="signup">
          <form onSubmit={form.handleSubmit(onRegister)}>
            <CardContent className="grid gap-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="email-signup" className="text-xs font-medium uppercase tracking-wider text-slate-500 ml-1">
                  Email
                </Label>
                <Input
                  id="email-signup"
                  type="email"
                  placeholder="ejemplo@correo.com"
                  className="h-12 rounded-2xl border-slate-200 bg-slate-50/50 px-4 focus-visible:ring-slate-400 dark:border-slate-800 dark:bg-slate-900/50"
                  {...form.register("email")}
                />
                {form.formState.errors.email && (
                  <p className="text-[10px] font-medium text-red-500 ml-1">{form.formState.errors.email.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="password-signup" className="text-xs font-medium uppercase tracking-wider text-slate-500 ml-1">
                  Contraseña
                </Label>
                <div className="relative">
                  <Input
                    id="password-signup"
                    type={showPassword ? "text" : "password"}
                    className="h-12 rounded-2xl border-slate-200 bg-slate-50/50 px-4 focus-visible:ring-slate-400 dark:border-slate-800 dark:bg-slate-900/50"
                    {...form.register("password")}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-2 top-1.5 h-9 w-9 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </Button>
                </div>
                {form.formState.errors.password && (
                  <p className="text-[10px] font-medium text-red-500 ml-1">{form.formState.errors.password.message}</p>
                )}
              </div>
            </CardContent>
            <CardFooter className="pb-8">
              <Button 
                disabled={isLoading}
                className="h-14 w-full rounded-[1.25rem] bg-slate-900 text-base font-semibold transition-all hover:bg-slate-800 active:scale-[0.98] dark:bg-slate-50 dark:text-slate-900 dark:hover:bg-slate-200" 
                type="submit"
              >
                {isLoading ? (
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                ) : (
                  <UserPlus className="mr-2 h-5 w-5" />
                )}
                Crear Cuenta
              </Button>
            </CardFooter>
          </form>
        </TabsContent>
      </Tabs>
    </Card>
  )
}
