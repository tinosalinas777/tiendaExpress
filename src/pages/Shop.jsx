import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import CategoryChips from '../components/CategoryChips'
import ProductCard from '../components/ProductCard'
import { fetchCategories, fetchProducts } from '../lib/catalog'

export default function Shop() {
  const [searchParams] = useSearchParams()
  const initialCategory = searchParams.get('categoria')
  const search = searchParams.get('buscar') || ''

  const [categories, setCategories] = useState([])
  const [activeCategory, setActiveCategory] = useState(initialCategory)
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchCategories().then(setCategories)
  }, [])

  useEffect(() => {
    setLoading(true)
    fetchProducts({ categoryId: activeCategory, search }).then((data) => {
      setProducts(data)
      setLoading(false)
    })
  }, [activeCategory, search])

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="font-display font-800 text-2xl text-navy mb-1">Tienda</h1>
      <p className="text-slate-500 text-sm mb-6">
        {search ? `Resultados para "${search}"` : 'Elegí una categoría o mirá todo el catálogo'}
      </p>

      <CategoryChips categories={categories} active={activeCategory} onSelect={setActiveCategory} />

      <div className="mt-6">
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="aspect-square bg-slate-100 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-16 text-slate-500">
            <p className="text-4xl mb-3">🔍</p>
            <p className="font-medium">No encontramos productos con esos filtros.</p>
            <p className="text-sm">Probá con otra categoría o palabra de búsqueda.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {products.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
