import { supabase } from '@/lib/supabase'
import type { AuthError, AuthResponse, Session } from '@supabase/supabase-js'

/**
 * Inicia sesión con correo electrónico y contraseña.
 */
export async function signIn(email: string, password: string): Promise<AuthResponse> {
  const response = await supabase.auth.signInWithPassword({
    email,
    password,
  })
  return response
}

/**
 * Crea una nueva cuenta con correo electrónico y contraseña.
 */
export async function signUp(email: string, password: string): Promise<AuthResponse> {
  const response = await supabase.auth.signUp({
    email,
    password,
  })
  return response
}

/**
 * Cierra la sesión activa del usuario.
 */
export async function signOut(): Promise<{ error: AuthError | null }> {
  const { error } = await supabase.auth.signOut()
  return { error }
}

/**
 * Obtiene la sesión actual.
 */
export async function getSession(): Promise<{ session: Session | null; error: AuthError | null }> {
  const { data: { session }, error } = await supabase.auth.getSession()
  return { session, error }
}
