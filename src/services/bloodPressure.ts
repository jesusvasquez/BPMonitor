import { supabase } from '@/lib/supabase'

export interface Reading {
  id?: string
  user_id?: string
  sistolica: number
  diastolica: number
  pulso: number
  created_at: Date | string
}

/**
 * Inserta una nueva lectura de presión arterial para el usuario autenticado.
 */
export async function insertReading(reading: Omit<Reading, 'id' | 'user_id'>) {
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  if (authError || !user) {
    throw new Error('Usuario no autenticado')
  }

  const { data, error } = await supabase
    .from('lecturas')
    .insert([
      {
        user_id: user.id,
        sistolica: reading.sistolica,
        diastolica: reading.diastolica,
        pulso: reading.pulso,
        created_at: reading.created_at,
      },
    ])
    .select()

  if (error) {
    throw error
  }

  return data?.[0]
}

/**
 * Obtiene todas las lecturas del usuario autenticado actual.
 */
export async function getReadings() {
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    throw new Error('Usuario no autenticado')
  }

  const { data, error } = await supabase
    .from('lecturas')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) {
    throw error
  }

  return data as Reading[]
}
