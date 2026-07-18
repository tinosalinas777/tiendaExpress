import { Link } from 'react-router-dom'
import { useCart } from '../context/CartContext'

export default function ProductCard({ product }) {
  const { addItem } = useCart()

  return (
    <div className="bg-white rounded-xl border border-slate-100 shadow-card hover:shadow-cardHover transition-shadow flex flex-col">
      <Link to={`/producto/${product.id}`} className="relative aspect-square bg-slate-50 rounded-t-xl grid place-items-center text-5xl overflow-hidden">
        {product.badge && (
          <span className="absolute top-2 left-2 bg-fresh-500 text-white text-[11px] font-semibold px-2 py-1 rounded-md z-10">
            {product.badge}
          </span>
        )}
        {product.image_url ? (
          <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
        ) : (
          <span aria-hidden="true">{product.icon || '🛒'}</span>
        )}
      </Link>
      <div className="p-3 flex flex-col gap-1 flex-1">
        <Link to={`/producto/${product.id}`} className="text-sm font-medium text-navy hover:text-brand-500 line-clamp-2">
          {product.name}
        </Link>
        <div className="flex items-center gap-1 text-xs text-amber-500" aria-label={`Calificación ${product.rating} de 5`}>
          {'★'.repeat(Math.round(product.rating || 0))}
          <span className="text-slate-400">({product.reviews || 0})</span>
        </div>
        <div className="mt-auto pt-2 flex items-center justify-between">
          <div>
            <p className="font-display font-800 text-navy">$ {product.price.toLocaleString('es-AR')}</p>
            <p className="text-[11px] text-slate-400">por {product.unit}</p>
          </div>
          <button
            onClick={() => addItem(product)}
            className="w-9 h-9 rounded-full bg-brand-500 hover:bg-brand-600 text-white grid place-items-center transition-colors"
            aria-label={`Agregar ${product.name} al carrito`}
          >
            +
          </button>
        </div>
      </div>
    </div>
  )
}
