import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabaseClient'

const EMPTY_FORM = { name: '', category_id: '', price: '', unit: 'un', stock: '', icon: '🛒', badge: '', active: true }

export default function AdminProducts() {
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState(EMPTY_FORM)
  const [editingId, setEditingId] = useState(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const load = async () => {
    setLoading(true)
    const [{ data: prods }, { data: cats }] = await Promise.all([
      supabase.from('products').select('*').order('name'),
      supabase.from('categories').select('*').order('name'),
    ])
    setProducts(prods || [])
    setCategories(cats || [])
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [])

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setForm((f) => ({ ...f, [name]: type === 'checkbox' ? checked : value }))
  }

  const startEdit = (p) => {
    setEditingId(p.id)
    setForm({
      name: p.name,
      category_id: p.category_id || '',
      price: p.price,
      unit: p.unit,
      stock: p.stock,
      icon: p.icon || '🛒',
      badge: p.badge || '',
      active: p.active,
    })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const cancelEdit = () => {
    setEditingId(null)
    setForm(EMPTY_FORM)
    setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')

    const payload = {
      name: form.name,
      category_id: form.category_id || null,
      price: Number(form.price),
      unit: form.unit,
      stock: Number(form.stock),
      icon: form.icon,
      badge: form.badge || null,
      active: form.active,
    }

    const { error } = editingId
      ? await supabase.from('products').update(payload).eq('id', editingId)
      : await supabase.from('products').insert(payload)

    setSaving(false)
    if (error) {
      setError('No se pudo guardar el producto. ' + error.message)
      return
    }
    cancelEdit()
    load()
  }

  const toggleActive = async (p) => {
    await supabase.from('products').update({ active: !p.active }).eq('id', p.id)
    load()
  }

  const deleteProduct = async (p) => {
    if (!confirm(`¿Eliminar "${p.name}" definitivamente? Esta acción no se puede deshacer.`)) return
    await supabase.from('products').delete().eq('id', p.id)
    load()
  }

  return (
    <div className="p-6 md:p-8">
      <h1 className="font-display font-800 text-2xl text-navy mb-6">Productos</h1>

      <form onSubmit={handleSubmit} className="bg-white border border-slate-100 rounded-xl shadow-card p-5 mb-8">
        <h2 className="font-display font-700 text-navy mb-4">
          {editingId ? `Editando producto #${editingId}` : 'Agregar producto nuevo'}
        </h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="lg:col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-1">Nombre</label>
            <input name="name" required value={form.name} onChange={handleChange}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-400" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Categoría</label>
            <select name="category_id" value={form.category_id} onChange={handleChange}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-400">
              <option value="">Sin categoría</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Unidad</label>
            <select name="unit" value={form.unit} onChange={handleChange}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-400">
              <option value="un">Unidad</option>
              <option value="kg">Kilo</option>
              <option value="lt">Litro</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Precio</label>
            <input name="price" type="number" step="0.01" min="0" required value={form.price} onChange={handleChange}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-400" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Stock</label>
            <input name="stock" type="number" min="0" required value={form.stock} onChange={handleChange}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-400" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Ícono (emoji)</label>
            <input name="icon" value={form.icon} onChange={handleChange}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-400" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Etiqueta (opcional)</label>
            <input name="badge" placeholder="Ej: Oferta, 2x1" value={form.badge} onChange={handleChange}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-400" />
          </div>
          <label className="flex items-center gap-2 text-sm text-slate-700 mt-6">
            <input type="checkbox" name="active" checked={form.active} onChange={handleChange} />
            Visible en la tienda
          </label>
        </div>

        {error && <p className="text-red-500 text-sm mt-3">{error}</p>}

        <div className="flex items-center gap-3 mt-5">
          <button type="submit" disabled={saving}
            className="bg-brand-500 hover:bg-brand-600 disabled:opacity-60 transition-colors text-white font-semibold px-6 py-2.5 rounded-lg">
            {saving ? 'Guardando...' : editingId ? 'Guardar cambios' : 'Agregar producto'}
          </button>
          {editingId && (
            <button type="button" onClick={cancelEdit} className="text-slate-500 text-sm font-medium hover:text-navy">
              Cancelar edición
            </button>
          )}
        </div>
      </form>

      <div className="bg-white border border-slate-100 rounded-xl shadow-card overflow-x-auto">
        {loading ? (
          <p className="p-5 text-slate-400 text-sm">Cargando productos...</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-500 border-b border-slate-100">
                <th className="px-4 py-3">Producto</th>
                <th className="px-4 py-3">Categoría</th>
                <th className="px-4 py-3">Precio</th>
                <th className="px-4 py-3">Stock</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {products.map((p) => (
                <tr key={p.id} className={!p.active ? 'opacity-50' : ''}>
                  <td className="px-4 py-3 flex items-center gap-2 whitespace-nowrap">
                    <span>{p.icon}</span> {p.name}
                  </td>
                  <td className="px-4 py-3 text-slate-500">{categories.find((c) => c.id === p.category_id)?.name || '—'}</td>
                  <td className="px-4 py-3">$ {Number(p.price).toLocaleString('es-AR')}</td>
                  <td className="px-4 py-3">
                    <span className={p.stock < 5 ? 'text-red-500 font-semibold' : ''}>{p.stock}</span>
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => toggleActive(p)} className="text-xs font-medium underline text-slate-500 hover:text-navy">
                      {p.active ? 'Ocultar' : 'Mostrar'}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    <button onClick={() => startEdit(p)} className="text-brand-500 font-medium mr-3 hover:underline">Editar</button>
                    <button onClick={() => deleteProduct(p)} className="text-red-500 font-medium hover:underline">Eliminar</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
