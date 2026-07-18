import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL

// Supabase está migrando del formato viejo (anon key, empieza con "eyJ")
// al nuevo (publishable key, empieza con "sb_publishable_"). Aceptamos
// cualquiera de los dos nombres de variable para no atarnos a cuál te
// haya tocado a vos en el dashboard.
const supabaseKey =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY

// Si todavía no configuraste las variables de entorno, la app sigue
// funcionando con el catálogo de ejemplo (ver src/data/mockData.js).
export const supabase =
  supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null

export const isSupabaseConfigured = Boolean(supabase)
