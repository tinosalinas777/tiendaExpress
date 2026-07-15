import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

const links = [
  { to: '/admin', label: 'Resumen', icon: '📊', end: true },
  { to: '/admin/pedidos', label: 'Pedidos', icon: '🏍️' },
  { to: '/admin/productos', label: 'Productos', icon: '🛒' },
]

export default function AdminLayout() {
  const { signOut, session } = useAuth()

  return (
    <div className="min-h-screen flex bg-slate-50">
      <aside className="w-56 shrink-0 bg-navy text-white flex flex-col">
        <div className="px-5 py-5 border-b border-white/10">
          <span className="font-display font-800 text-lg">
            Admin<span className="text-brand-400">Express</span>
          </span>
        </div>
        <nav className="flex-1 px-3 py-4 flex flex-col gap-1">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive ? 'bg-brand-500 text-white' : 'text-slate-300 hover:bg-white/5'
                }`
              }
            >
              <span aria-hidden="true">{link.icon}</span>
              {link.label}
            </NavLink>
          ))}
        </nav>
        <div className="px-5 py-4 border-t border-white/10">
          <p className="text-xs text-slate-400 truncate mb-2">{session?.user?.email}</p>
          <button
            onClick={signOut}
            className="text-sm text-slate-300 hover:text-white transition-colors"
          >
            Cerrar sesión
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-x-hidden">
        <Outlet />
      </main>
    </div>
  )
}
