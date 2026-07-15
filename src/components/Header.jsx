import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useCart } from '../context/CartContext'

export default function Header() {
  const { itemCount, subtotal } = useCart()
  const [query, setQuery] = useState('')
  const navigate = useNavigate()

  const handleSearch = (e) => {
    e.preventDefault()
    navigate(query.trim() ? `/tienda?buscar=${encodeURIComponent(query.trim())}` : '/tienda')
  }

  return (
    <header className="bg-white border-b border-slate-100 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-4">
        <Link to="/" className="flex items-center gap-2 shrink-0">
          <span className="w-9 h-9 rounded-lg bg-brand-500 text-white grid place-items-center font-display font-800 text-lg">A</span>
          <span className="font-display font-800 text-lg text-navy leading-none">
            Almacén<span className="text-brand-500">Express</span>
          </span>
        </Link>

        <nav className="hidden lg:flex items-center gap-6 font-medium text-sm text-slate-700 ml-4">
          <Link to="/" className="hover:text-brand-500 transition-colors">Inicio</Link>
          <Link to="/tienda" className="hover:text-brand-500 transition-colors">Tienda</Link>
          <Link to="/tienda?ofertas=1" className="hover:text-brand-500 transition-colors">Ofertas</Link>
          <Link to="/contacto" className="hover:text-brand-500 transition-colors">Contacto</Link>
        </nav>

        <form onSubmit={handleSearch} className="flex-1 hidden sm:flex">
          <div className="relative w-full max-w-md ml-auto">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              type="text"
              placeholder="Buscar productos..."
              className="w-full rounded-full border border-slate-200 bg-slate-50 py-2 pl-4 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
              aria-label="Buscar productos"
            />
            <button type="submit" className="absolute right-1 top-1/2 -translate-y-1/2 w-8 h-8 grid place-items-center text-slate-500" aria-label="Buscar">
              🔍
            </button>
          </div>
        </form>

        <Link to="/carrito" className="relative flex items-center gap-2 shrink-0 ml-auto sm:ml-0">
          <span className="relative w-10 h-10 rounded-full bg-slate-50 grid place-items-center text-lg">
            🛒
            {itemCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-brand-500 text-white text-[11px] rounded-full w-5 h-5 grid place-items-center">
                {itemCount}
              </span>
            )}
          </span>
          <span className="hidden md:block text-sm font-semibold text-navy">
            $ {subtotal.toLocaleString('es-AR')}
          </span>
        </Link>
      </div>

      <form onSubmit={handleSearch} className="sm:hidden px-4 pb-3">
        <div className="relative">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            type="text"
            placeholder="Buscar productos..."
            className="w-full rounded-full border border-slate-200 bg-slate-50 py-2 pl-4 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
            aria-label="Buscar productos"
          />
          <button type="submit" className="absolute right-1 top-1/2 -translate-y-1/2 w-8 h-8 grid place-items-center text-slate-500" aria-label="Buscar">
            🔍
          </button>
        </div>
      </form>
    </header>
  )
}
