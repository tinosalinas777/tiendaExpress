import { Navigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { isSupabaseConfigured } from '../../lib/supabaseClient'

export default function ProtectedRoute({ children }) {
  const { session, loading } = useAuth()

  if (!isSupabaseConfigured) {
    return (
      <div className="min-h-screen grid place-items-center bg-slate-50 px-4">
        <div className="text-center max-w-md">
          <p className="text-4xl mb-3">⚙️</p>
          <h1 className="font-display font-800 text-xl text-navy mb-2">Falta conectar Supabase</h1>
          <p className="text-slate-500 text-sm">
            El panel de administración necesita las variables VITE_SUPABASE_URL y
            VITE_SUPABASE_ANON_KEY configuradas. Revisá el archivo .env y el README.
          </p>
        </div>
      </div>
    )
  }

  if (loading) {
    return <div className="min-h-screen grid place-items-center text-slate-400">Cargando...</div>
  }

  if (!session) {
    return <Navigate to="/admin/login" replace />
  }

  return children
}
