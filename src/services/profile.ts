import { supabase } from '@/lib/supabase'

export interface Profile {
  id: string
  nombre: string | null
  nombre_medico: string | null
  avatar_url: string | null
  updated_at: string
}

/**
 * Obtiene el perfil del usuario actual.
 */
export async function getProfile(userId: string): Promise<Profile | null> {
  console.log("[Profile] 🔍 Obteniendo perfil para ID:", userId);
  const { data, error } = await supabase
    .from('perfiles')
    .select('*')
    .eq('id', userId)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      // Perfil no existe, lo crearemos bajo demanda o retornamos null
      console.log("[Profile] ℹ️ El perfil no existe aún.");
      return null
    }
    console.error("[Profile] ❌ Error obteniendo perfil:", error)
    throw error
  }

  return data
}

/**
 * Actualiza o crea el perfil del usuario actual.
 */
export async function updateProfile(userId: string, updates: Partial<Omit<Profile, 'id' | 'updated_at'>>) {
  console.log("[Profile] 📝 Actualizando perfil para ID:", userId, updates);
  const { data, error } = await supabase
    .from('perfiles')
    .upsert({
      id: userId,
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .select()
    .single()

  if (error) {
    console.error("[Profile] ❌ Error actualizando perfil:", error)
    throw error
  }

  console.log("[Profile] ✅ Perfil actualizado exitosamente");
  return data
}

/**
 * Sube una imagen al bucket 'avatars' de Supabase Storage.
 */
export async function uploadAvatar(userId: string, file: File) {
  console.log("[Profile] 📸 Subiendo avatar para ID:", userId, file.name);
  
  // Limpiamos el nombre del archivo o usamos uno estático para sobrescribir
  const fileExt = file.name.split('.').pop();
  const filePath = `${userId}/avatar-${Math.random().toString(36).substring(7)}.${fileExt}`;

  // 1. Subir la imagen
  const { error: uploadError } = await supabase.storage
    .from('avatars')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: true
    });

  if (uploadError) {
    console.error("[Profile] ❌ Error subiendo imagen:", uploadError);
    throw uploadError;
  }

  // 2. Obtener la URL pública
  const { data: { publicUrl } } = supabase.storage
    .from('avatars')
    .getPublicUrl(filePath);

  console.log("[Profile] ✅ Imagen subida exitosamente:", publicUrl);
  return publicUrl;
}
