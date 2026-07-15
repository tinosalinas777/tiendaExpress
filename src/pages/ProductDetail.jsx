import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { fetchProductById } from '../lib/catalog'
import { useCart } from '../context/CartContext'

export default function ProductDetail() {
  const { id } = useParams()
  const [product, setProduct] = useState(null)
  const [qty, setQty] = useState(1)
  const [added, setAdded] = useState(false)
  const { addItem } = useCart()

  useEffect(() => {
    fetchProductById(id).then(setProduct)
  }, [id])

  if (!product) {
    return <div className="max-w-7xl mx-auto px-4 py-16 text-center text-slate-500">Cargando producto...</div>
  }

  const handleAdd = () => {
    addItem(product, qty)
    setAdded(true)
    setTimeout(() => setAdded(false), 1500)
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <Link to="/tienda" className="text-sm text-brand-500 hover:underline">
        ← Volver a la tienda
      </Link>

      <div className="mt-6 grid md:grid-cols-2 gap-10">
        <div className="aspect-square bg-slate-50 rounded-2xl grid place-items-center text-8xl">
          {product.icon || '🛒'}
        </div>

        <div>
          <h1 className="font-display font-800 text-2xl text-navy">{product.name}</h1>
          <div className="flex items-center gap-1 text-amber-500 mt-2 text-sm">
            {'★'.repeat(Math.round(product.rating || 0))}
            <span className="text-slate-400">({product.reviews || 0} reseñas)</span>
          </div>

          <p className="font-display font-800 text-3xl text-navy mt-5">
            $ {product.price.toLocaleString('es-AR')}{' '}
            <span className="text-sm font-body font-normal text-slate-400">por {product.unit}</span>
          </p>

          <div className="flex items-center gap-3 mt-6">
            <div className="flex items-center border border-slate-200 rounded-lg">
              <button
                onClick={() => setQty((q) => Math.max(1, q - 1))}
                className="w-9 h-9 grid place-items-center text-lg text-slate-600"
                aria-label="Restar cantidad"
              >
                −
              </button>
              <span className="w-10 text-center font-medium">{qty}</span>
              <button
                onClick={() => setQty((q) => q + 1)}
                className="w-9 h-9 grid place-items-center text-lg text-slate-600"
                aria-label="Sumar cantidad"
              >
                +
              </button>
            </div>
            <button
              onClick={handleAdd}
              className="flex-1 bg-brand-500 hover:bg-brand-600 transition-colors text-white font-semibold px-6 py-3 rounded-lg"
            >
              {added ? 'Agregado ✓' : 'Agregar al carrito'}
            </button>
          </div>

          <div className="mt-8 flex items-center gap-2 text-sm text-slate-500 bg-slate-50 rounded-lg p-3">
            <span aria-hidden="true">🏍️</span>
            Envío en moto disponible para tu zona en el día.
          </div>
        </div>
      </div>
    </div>
  )
}
