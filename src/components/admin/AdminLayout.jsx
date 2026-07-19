import { useState } from 'react'
import { NavLink, Outlet, Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { SubscriptionProvider, useSubscription } from '../../context/SubscriptionContext'

const links = [
  { to: '/admin', label: 'Resumen', icon: '📊', end: true },
  { to: '/admin/pedidos', label: 'Pedidos', icon: '🏍️' },
  { to: '/admin/productos', label: 'Productos', icon: '🛒' },
  { to: '/admin/suscripcion', label: 'Suscripción', icon: '💳' },
]

export default function AdminLayout() {
  return (
    <SubscriptionProvider>
      <AdminLayoutContent />
    </SubscriptionProvider>
  )
}

function AdminLayoutContent() {
  const { signOut, session } = useAuth()
  const { isExpired, isPendingVerification, loading } = useSubscription()
  const [menuOpen, setMenuOpen] = useState(false)

  const closeMenu = () => setMenuOpen(false)

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-50">
      {/* Barra superior, solo en mobile */}
      <div className="md:hidden bg-navy text-white flex items-center justify-between px-4 py-3 sticky top-0 z-40">
        <span className="font-display font-800 text-lg">
          Admin<span className="text-brand-400">Express</span>
        </span>
        <button
          onClick={() => setMenuOpen(true)}
          aria-label="Abrir menú"
          className="w-9 h-9 grid place-items-center rounded-lg hover:bg-white/10"
        >
          <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>

      {/* Fondo oscuro detrás del menú mobile */}
      {menuOpen && (
        <div className="md:hidden fixed inset-0 bg-black/50 z-40" onClick={closeMenu} aria-hidden="true" />
      )}

      {/* Sidebar: fija en desktop, cajón deslizable en mobile */}
      <aside
        className={`w-64 md:w-56 shrink-0 bg-navy text-white flex flex-col fixed md:static inset-y-0 left-0 z-50 transition-transform duration-200 md:translate-x-0 ${
          menuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="px-5 py-5 border-b border-white/10 flex items-center justify-between">
          <span className="font-display font-800 text-lg">
            Admin<span className="text-brand-400">Express</span>
          </span>
          <button onClick={closeMenu} aria-label="Cerrar menú" className="md:hidden w-8 h-8 grid place-items-center">
            ✕
          </button>
        </div>
        <nav className="flex-1 px-3 py-4 flex flex-col gap-1">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              onClick={closeMenu}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive ? 'bg-brand-500 text-white' : 'text-slate-300 hover:bg-white/5'
                }`
              }
            >
              <span aria-hidden="true">{link.icon}</span>
              {link.label}
              {!loading && isExpired && link.to === '/admin/suscripcion' && (
                <span className="ml-auto w-2 h-2 rounded-full bg-red-500" aria-label="Suscripción vencida" />
              )}
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

      <main className="flex-1 overflow-x-hidden min-w-0">
        {!loading && (isExpired || isPendingVerification) && (
          <div
            className={`px-4 md:px-6 py-3 text-sm font-medium flex items-center justify-between flex-wrap gap-2 ${
              isPendingVerification ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-800'
            }`}
          >
            <span>
              {isPendingVerification
                ? 'Estamos verificando tu último pago de suscripción.'
                : 'Tu suscripción venció — no podés agregar ni editar productos hasta renovarla.'}
            </span>
            <Link to="/admin/suscripcion" className="underline font-semibold shrink-0">
              Ir a Suscripción
            </Link>
          </div>
        )}
        <Outlet />
      </main>
    </div>
  )
}
