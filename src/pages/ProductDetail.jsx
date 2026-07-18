import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { fetchProductById, fetchProductReviews, submitProductReview } from '../lib/catalog'
import { isSupabaseConfigured } from '../lib/supabaseClient'
import { useCart } from '../context/CartContext'
import StarRatingInput from '../components/StarRatingInput'

export default function ProductDetail() {
  const { id } = useParams()
  const [product, setProduct] = useState(null)
  const [qty, setQty] = useState(1)
  const [added, setAdded] = useState(false)
  const { addItem } = useCart()

  const [reviews, setReviews] = useState([])
  const [loadingReviews, setLoadingReviews] = useState(true)
  const [reviewForm, setReviewForm] = useState({ customer_name: '', rating: 0, comment: '' })
  const [submittingReview, setSubmittingReview] = useState(false)
  const [reviewError, setReviewError] = useState('')
  const [reviewSent, setReviewSent] = useState(false)

  const loadProduct = () => fetchProductById(id).then(setProduct)

  const loadReviews = () => {
    setLoadingReviews(true)
    fetchProductReviews(id).then((data) => {
      setReviews(data)
      setLoadingReviews(false)
    })
  }

  useEffect(() => {
    loadProduct()
    loadReviews()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  if (!product) {
    return <div className="max-w-7xl mx-auto px-4 py-16 text-center text-slate-500">Cargando producto...</div>
  }

  const handleAdd = () => {
    addItem(product, qty)
    setAdded(true)
    setTimeout(() => setAdded(false), 1500)
  }

  const handleReviewSubmit = async (e) => {
    e.preventDefault()
    setReviewError('')

    if (reviewForm.rating < 1) {
      setReviewError('Elegí una calificación de 1 a 5 estrellas.')
      return
    }
    if (!reviewForm.customer_name.trim()) {
      setReviewError('Contanos tu nombre para publicar la reseña.')
      return
    }

    setSubmittingReview(true)
    try {
      await submitProductReview({
        productId: product.id,
        customerName: reviewForm.customer_name.trim(),
        rating: reviewForm.rating,
        comment: reviewForm.comment.trim(),
      })
      setReviewForm({ customer_name: '', rating: 0, comment: '' })
      setReviewSent(true)
      setTimeout(() => setReviewSent(false), 3000)
      loadReviews()
      loadProduct() // el promedio se recalcula solo (trigger), volvemos a pedirlo
    } catch (err) {
      console.error(err)
      setReviewError('No se pudo publicar la reseña. Probá de nuevo en unos segundos.')
    } finally {
      setSubmittingReview(false)
    }
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <Link to="/tienda" className="text-sm text-brand-500 hover:underline">
        ← Volver a la tienda
      </Link>

      <div className="mt-6 grid md:grid-cols-2 gap-10">
        <div className="aspect-square bg-slate-50 rounded-2xl grid place-items-center text-8xl overflow-hidden">
          {product.image_url ? (
            <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
          ) : (
            product.icon || '🛒'
          )}
        </div>

        <div>
          <h1 className="font-display font-800 text-2xl text-navy">{product.name}</h1>
          <div className="flex items-center gap-1 text-amber-500 mt-2 text-sm">
            {'★'.repeat(Math.round(product.rating || 0))}
            <span className="text-slate-300">{'★'.repeat(5 - Math.round(product.rating || 0))}</span>
            <span className="text-slate-400 ml-1">
              {product.reviews > 0 ? `${Number(product.rating).toFixed(1)} · ${product.reviews} reseñas` : 'Sin reseñas todavía'}
            </span>
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

      {/* Reseñas */}
      <div className="mt-14 grid md:grid-cols-2 gap-10">
        <div>
          <h2 className="font-display font-700 text-xl text-navy mb-4">Reseñas de clientes</h2>

          {loadingReviews ? (
            <p className="text-slate-400 text-sm">Cargando reseñas...</p>
          ) : reviews.length === 0 ? (
            <p className="text-slate-400 text-sm">Todavía no hay reseñas para este producto. ¡Sé el primero en calificarlo!</p>
          ) : (
            <ul className="flex flex-col gap-4">
              {reviews.map((r) => (
                <li key={r.id} className="border border-slate-100 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-1">
                    <p className="font-medium text-navy text-sm">{r.customer_name}</p>
                    <p className="text-slate-400 text-xs">{new Date(r.created_at).toLocaleDateString('es-AR')}</p>
                  </div>
                  <div className="text-amber-500 text-sm mb-1">
                    {'★'.repeat(r.rating)}
                    <span className="text-slate-300">{'★'.repeat(5 - r.rating)}</span>
                  </div>
                  {r.comment && <p className="text-slate-600 text-sm">{r.comment}</p>}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div>
          <h2 className="font-display font-700 text-xl text-navy mb-4">Dejá tu calificación</h2>

          {!isSupabaseConfigured ? (
            <p className="text-slate-400 text-sm bg-slate-50 rounded-lg p-4">
              Conectá Supabase para que los clientes puedan dejar reseñas reales.
            </p>
          ) : (
            <form onSubmit={handleReviewSubmit} className="flex flex-col gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Tu calificación</label>
                <StarRatingInput
                  value={reviewForm.rating}
                  onChange={(rating) => setReviewForm((f) => ({ ...f, rating }))}
                />
              </div>
              <div>
                <label htmlFor="review-name" className="block text-sm font-medium text-slate-700 mb-1">Tu nombre</label>
                <input
                  id="review-name"
                  value={reviewForm.customer_name}
                  onChange={(e) => setReviewForm((f) => ({ ...f, customer_name: e.target.value }))}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-400"
                />
              </div>
              <div>
                <label htmlFor="review-comment" className="block text-sm font-medium text-slate-700 mb-1">
                  Comentario (opcional)
                </label>
                <textarea
                  id="review-comment"
                  rows={3}
                  maxLength={500}
                  value={reviewForm.comment}
                  onChange={(e) => setReviewForm((f) => ({ ...f, comment: e.target.value }))}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-400"
                />
              </div>

              {reviewError && <p className="text-red-500 text-sm">{reviewError}</p>}
              {reviewSent && <p className="text-fresh-500 text-sm">¡Gracias por tu reseña! 🎉</p>}

              <button
                type="submit"
                disabled={submittingReview}
                className="self-start bg-brand-500 hover:bg-brand-600 disabled:opacity-60 transition-colors text-white font-semibold px-6 py-2.5 rounded-lg"
              >
                {submittingReview ? 'Publicando...' : 'Publicar reseña'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
