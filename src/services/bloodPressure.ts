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

  console.log("[Service] Obteniendo lecturas para:", user.email);
  const { data, error } = await supabase
    .from('lecturas')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) {
    console.error("[Service] Error al obtener lecturas:", error);
    throw error
  }

  console.log("[Service] Lecturas obtenidas:", data?.length);
  return data as Reading[]
}

/**
 * Elimina una lectura por su ID.
 */
export async function deleteReading(id: string) {
  console.log("[Service] 🗑️ Iniciando DELETE para ID:", id);
  const { data, error } = await supabase
    .from('lecturas')
    .delete()
    .eq('id', id)
    .select(); // Requerido para confirmar que se eliminó algo

  if (error) {
    console.error("[Service] ❌ Error en DELETE:", error);
    throw error
  }

  if (!data || data.length === 0) {
    console.warn("[Service] ⚠️ DELETE ejecutado pero 0 filas afectadas. RLS o ID mismatch?");
    return false;
  }

  console.log("[Service] ✅ DELETE exitoso. Filas eliminadas:", data.length);
  return true
}

/**
 * Actualiza una lectura existente.
 */
export async function updateReading(id: string, updates: Partial<Omit<Reading, 'id' | 'user_id'>>) {
  console.log("[Service] 📝 Iniciando UPDATE para ID:", id, updates);
  const { data, error } = await supabase
    .from('lecturas')
    .update(updates)
    .eq('id', id)
    .select()

  if (error) {
    console.error("[Service] ❌ Error en UPDATE:", error);
    throw error
  }

  if (!data || data.length === 0) {
    console.warn("[Service] ⚠️ UPDATE ejecutado pero 0 filas afectadas.");
    return null;
  }

  console.log("[Service] ✅ UPDATE exitoso:", data[0]);
  return data[0]
}
