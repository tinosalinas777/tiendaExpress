import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { useSubscription } from '../../context/SubscriptionContext'

const EMPTY_FORM = { name: '', category_id: '', price: '', unit: 'un', stock: '', icon: '🛒', badge: '', active: true, image_url: '' }
// Límite generoso: la foto se comprime y redimensiona ANTES de subirla
// (ver compressImage), así que una foto de 6-8MB del celu tranquilamente
// termina pesando unos cientos de KB una vez optimizada.
const MAX_RAW_IMAGE_MB = 8
const MAX_WIDTH = 1400
const MAX_HEIGHT = 1400
const WEBP_QUALITY = 0.82

// Algunos formatos (como .jfif) no siempre se identifican bien por
// file.type en el navegador — por eso validamos también por extensión.
const KNOWN_IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'jfif', 'png', 'webp', 'gif', 'avif', 'heic', 'heif']

// Redimensiona y convierte la imagen a WebP del lado del navegador antes
// de subirla a Supabase Storage. Si algo falla o el navegador no soporta
// WebP, devuelve el archivo original tal cual (nunca bloquea la subida).
async function compressImage(file) {
  // No tocamos GIFs (podrían ser animados) ni SVGs (son vectoriales).
  if (file.type === 'image/gif' || file.name.toLowerCase().endsWith('.svg')) {
    return file
  }

  try {
    const source = await loadImageSource(file)
    if (!source) return file

    let { width, height } = getSourceSize(source)
    if (width > MAX_WIDTH || height > MAX_HEIGHT) {
      const ratio = Math.min(MAX_WIDTH / width, MAX_HEIGHT / height)
      width = Math.round(width * ratio)
      height = Math.round(height * ratio)
    }

    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')
    ctx.drawImage(source, 0, 0, width, height)

    const supportsWebp = canvas.toDataURL('image/webp').startsWith('data:image/webp')
    const outputType = supportsWebp ? 'image/webp' : 'image/jpeg'
    const outputExt = supportsWebp ? 'webp' : 'jpg'

    const blob = await new Promise((resolve) => canvas.toBlob(resolve, outputType, WEBP_QUALITY))
    if (!blob) return file

    const baseName = file.name.replace(/\.[^.]+$/, '')
    return new File([blob], `${baseName}.${outputExt}`, { type: outputType })
  } catch (err) {
    console.warn('No se pudo optimizar la imagen, se sube el archivo original:', err)
    return file
  }
}

function loadImageSource(file) {
  if (window.createImageBitmap) {
    return createImageBitmap(file).catch(() => loadImageViaElement(file))
  }
  return loadImageViaElement(file)
}

function loadImageViaElement(file) {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => resolve(null)
    img.src = URL.createObjectURL(file)
  })
}

function getSourceSize(source) {
  return { width: source.width, height: source.height }
}

export default function AdminProducts() {
  const { isExpired } = useSubscription()
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState(EMPTY_FORM)
  const [editingId, setEditingId] = useState(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [compressingImage, setCompressingImage] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)

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

  const handleImageChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setError('')

    const ext = file.name.split('.').pop()?.toLowerCase()
    const looksLikeImage = file.type.startsWith('image/') || KNOWN_IMAGE_EXTENSIONS.includes(ext)

    if (!looksLikeImage) {
      setError('El archivo tiene que ser una imagen (jpg, jfif, png, webp, etc).')
      e.target.value = ''
      return
    }
    if (file.size > MAX_RAW_IMAGE_MB * 1024 * 1024) {
      setError(`La imagen no puede pesar más de ${MAX_RAW_IMAGE_MB}MB.`)
      e.target.value = ''
      return
    }

    setCompressingImage(true)
    const optimized = await compressImage(file)
    setCompressingImage(false)

    setImageFile(optimized)
    setImagePreview(URL.createObjectURL(optimized))
  }

  const removeImage = () => {
    setImageFile(null)
    setImagePreview(null)
    setForm((f) => ({ ...f, image_url: '' }))
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
      image_url: p.image_url || '',
    })
    setImageFile(null)
    setImagePreview(p.image_url || null)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const cancelEdit = () => {
    setEditingId(null)
    setForm(EMPTY_FORM)
    setImageFile(null)
    setImagePreview(null)
    setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (isExpired) {
      setError('Tu suscripción está vencida — renovala para poder guardar cambios en el catálogo.')
      return
    }
    setSaving(true)
    setError('')

    let imageUrl = form.image_url || null

    // Si el admin eligió un archivo nuevo, ya viene optimizado (WebP,
    // redimensionado) desde handleImageChange. Lo subimos a Supabase
    // Storage con el content-type correcto (no confiamos en lo que haya
    // detectado el navegador del archivo original).
    if (imageFile) {
      setUploadingImage(true)
      const ext = imageFile.name.split('.').pop().toLowerCase()
      const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`

      const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(path, imageFile, { cacheControl: '3600', upsert: false, contentType: imageFile.type })

      setUploadingImage(false)

      if (uploadError) {
        setSaving(false)
        setError(
          'No se pudo subir la imagen. ' +
            uploadError.message +
            ' (revisá que hayas creado el bucket "product-images" — ver README).',
        )
        return
      }

      const { data: publicUrlData } = supabase.storage.from('product-images').getPublicUrl(path)
      imageUrl = publicUrlData.publicUrl
    }

    const payload = {
      name: form.name,
      category_id: form.category_id || null,
      price: Number(form.price),
      unit: form.unit,
      stock: Number(form.stock),
      icon: form.icon,
      badge: form.badge || null,
      active: form.active,
      image_url: imageUrl,
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
    if (isExpired) return
    await supabase.from('products').update({ active: !p.active }).eq('id', p.id)
    load()
  }

  const deleteProduct = async (p) => {
    if (isExpired) return
    if (!confirm(`¿Eliminar "${p.name}" definitivamente? Esta acción no se puede deshacer.`)) return
    await supabase.from('products').delete().eq('id', p.id)
    load()
  }

  const busy = saving || uploadingImage || compressingImage || isExpired

  return (
    <div className="p-6 md:p-8">
      <h1 className="font-display font-800 text-2xl text-navy mb-6">Productos</h1>

      <form onSubmit={handleSubmit} className="bg-white border border-slate-100 rounded-xl shadow-card p-5 mb-8">
        <h2 className="font-display font-700 text-navy mb-4">
          {editingId ? `Editando producto #${editingId}` : 'Agregar producto nuevo'}
        </h2>

        {isExpired && (
          <p className="text-sm text-red-700 bg-red-50 rounded-lg p-3 mb-4">
            Tu suscripción está vencida — <a href="/admin/suscripcion" className="underline font-semibold">renovala acá</a> para
            poder agregar, editar u ocultar productos. Mientras tanto podés seguir viendo tus pedidos con normalidad.
          </p>
        )}

        <div className="flex flex-col sm:flex-row gap-5 mb-4">
          <div className="shrink-0">
            <label className="block text-sm font-medium text-slate-700 mb-1">Foto del producto</label>
            <div className="w-28 h-28 rounded-lg bg-slate-50 border border-slate-200 grid place-items-center overflow-hidden relative">
              {compressingImage && (
                <span className="absolute inset-0 bg-white/70 grid place-items-center text-xs text-slate-500">
                  Optimizando...
                </span>
              )}
              {imagePreview ? (
                <img src={imagePreview} alt="Vista previa" className="w-full h-full object-cover" />
              ) : (
                <span className="text-4xl">{form.icon || '🛒'}</span>
              )}
            </div>
            <div className="flex flex-col gap-1 mt-2">
              <label className="text-xs font-medium text-brand-500 cursor-pointer hover:underline">
                {imagePreview ? 'Cambiar foto' : 'Subir foto'}
                <input type="file" accept="image/*,.jfif,.heic,.heif" onChange={handleImageChange} className="hidden" />
              </label>
              {imagePreview && (
                <button type="button" onClick={removeImage} className="text-xs font-medium text-slate-400 hover:text-red-500 text-left">
                  Quitar foto (usar ícono)
                </button>
              )}
            </div>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 flex-1">
            <div className="sm:col-span-2 lg:col-span-3">
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
              <label className="block text-sm font-medium text-slate-700 mb-1">Ícono (emoji, si no subís foto)</label>
              <input name="icon" value={form.icon} onChange={handleChange}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-400" />
            </div>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
          <button type="submit" disabled={busy}
            className="bg-brand-500 hover:bg-brand-600 disabled:opacity-60 transition-colors text-white font-semibold px-6 py-2.5 rounded-lg">
            {isExpired
              ? 'Renová tu suscripción para guardar'
              : compressingImage
              ? 'Optimizando imagen...'
              : uploadingImage
              ? 'Subiendo foto...'
              : saving
              ? 'Guardando...'
              : editingId
              ? 'Guardar cambios'
              : 'Agregar producto'}
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
                    <span className="w-8 h-8 rounded bg-slate-50 grid place-items-center overflow-hidden shrink-0">
                      {p.image_url ? (
                        <img src={p.image_url} alt={p.name} className="w-full h-full object-cover" />
                      ) : (
                        <span>{p.icon}</span>
                      )}
                    </span>
                    {p.name}
                  </td>
                  <td className="px-4 py-3 text-slate-500">{categories.find((c) => c.id === p.category_id)?.name || '—'}</td>
                  <td className="px-4 py-3">$ {Number(p.price).toLocaleString('es-AR')}</td>
                  <td className="px-4 py-3">
                    <span className={p.stock < 5 ? 'text-red-500 font-semibold' : ''}>{p.stock}</span>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => toggleActive(p)}
                      disabled={isExpired}
                      className="text-xs font-medium underline text-slate-500 hover:text-navy disabled:opacity-40 disabled:cursor-not-allowed disabled:no-underline"
                    >
                      {p.active ? 'Ocultar' : 'Mostrar'}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    <button
                      onClick={() => !isExpired && startEdit(p)}
                      disabled={isExpired}
                      className="text-brand-500 font-medium mr-3 hover:underline disabled:opacity-40 disabled:cursor-not-allowed disabled:no-underline"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => deleteProduct(p)}
                      disabled={isExpired}
                      className="text-red-500 font-medium hover:underline disabled:opacity-40 disabled:cursor-not-allowed disabled:no-underline"
                    >
                      Eliminar
                    </button>
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
