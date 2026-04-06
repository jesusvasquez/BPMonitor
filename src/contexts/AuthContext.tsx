import React, { createContext, useContext, useEffect, useState } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { getProfile, type Profile } from '@/services/profile'

interface AuthContextType {
  session: Session | null
  user: User | null
  profile: Profile | null
  loading: boolean
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchProfile = async (userId: string) => {
    try {
      const data = await getProfile(userId)
      setProfile(data)
    } catch (error) {
      console.error('Error fetching profile:', error)
    }
  }

  useEffect(() => {
    // Escuchar cambios en el estado de autenticación
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      console.log("[Auth] 🔑 Cambio en estado de auth:", _event);
      setSession(session)
      setUser(session?.user ?? null)
      
      if (session?.user) {
        // No bloqueamos setLoading con el fetch del perfil
        fetchProfile(session.user.id).catch(err => {
          console.error("[Auth] Error en fetchProfile (onAuthStateChange):", err);
        });
      } else {
        setProfile(null)
      }
      
      setLoading(false)
    })

    // Obtener sesión inicial
    supabase.auth.getSession()
      .then(({ data: { session } }) => {
        setSession(session)
        setUser(session?.user ?? null)
        
        if (session?.user) {
          // No bloqueamos el renderizado inicial esperando al perfil
          fetchProfile(session.user.id).catch(err => {
            console.error("[Auth] Error en fetchProfile (getSession):", err);
          });
        }
      })
      .catch((error) => {
        console.error('Error fetching session:', error)
      })
      .finally(() => {
        setLoading(false)
      })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const signOut = async () => {
    await supabase.auth.signOut()
  }

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.id)
    }
  }

  const value = {
    session,
    user,
    profile,
    loading,
    signOut,
    refreshProfile,
  }

  return <AuthContext.Provider value={value}>{!loading && children}</AuthContext.Provider>
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
