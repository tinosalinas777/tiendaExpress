import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient'

const WHATSAPP_NUMBER = '5491100000000' // TODO: reemplazar por el número real del negocio

export default function Checkout() {
  const { items, subtotal, shipping, total, clearCart } = useCart()
  const navigate = useNavigate()
  const [form, setForm] = useState({ name: '', phone: '', address: '', notes: '', payment: 'efectivo' })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const handleChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }))

  const buildWhatsappMessage = (orderId) => {
    const lines = items.map((i) => `• ${i.qty} x ${i.name} — $ ${(i.price * i.qty).toLocaleString('es-AR')}`)
    return encodeURIComponent(
      `Hola! Quiero confirmar mi pedido${orderId ? ` #${orderId}` : ''}:\n\n${lines.join('\n')}\n\nSubtotal: $ ${subtotal.toLocaleString(
        'es-AR',
      )}\nEnvío: $ ${shipping.toLocaleString('es-AR')}\nTotal: $ ${total.toLocaleString('es-AR')}\n\nNombre: ${form.name}\nDirección: ${
        form.address
      }\nPago: ${form.payment}${form.notes ? `\nNotas: ${form.notes}` : ''}`,
    )
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (items.length === 0) return
    setSubmitting(true)
    setError('')

    try {
      let orderId = null

      if (isSupabaseConfigured) {
        const { data: order, error: orderError } = await supabase
          .from('orders')
          .insert({
            customer_name: form.name,
            customer_phone: form.phone,
            delivery_address: form.address,
            notes: form.notes,
            payment_method: form.payment,
            subtotal,
            shipping,
            total,
            status: 'pendiente',
            payment_status: form.payment === 'mercadopago' ? 'pendiente' : 'no_aplica',
          })
          .select()
          .single()

        if (orderError) throw orderError
        orderId = order.id

        const orderItems = items.map((i) => ({
          order_id: order.id,
          product_id: i.id,
          product_name: i.name,
          quantity: i.qty,
          unit_price: i.price,
        }))
        const { error: itemsError } = await supabase.from('order_items').insert(orderItems)
        if (itemsError) throw itemsError
      }

      // Pago con Mercado Pago: creamos la preferencia y redirigimos a Checkout Pro.
      if (form.payment === 'mercadopago') {
        if (!orderId) {
          throw new Error('Para pagar con Mercado Pago primero hay que conectar Supabase.')
        }
        const res = await fetch('/api/create-preference', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ orderId }),
        })
        const data = await res.json()
        if (!res.ok || !data.init_point) {
          throw new Error(data.error || 'No se pudo iniciar el pago con Mercado Pago.')
        }
        clearCart()
        window.location.href = data.init_point
        return
      }

      // Pago en efectivo o transferencia: confirmamos por WhatsApp.
      const waUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${buildWhatsappMessage(orderId)}`
      clearCart()
      window.open(waUrl, '_blank')
      navigate('/', { state: { orderConfirmed: true } })
    } catch (err) {
      console.error(err)
      setError(err.message || 'No pudimos registrar el pedido. Probá de nuevo en unos segundos.')
    } finally {
      setSubmitting(false)
    }
  }

  if (items.length === 0) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center">
        <p className="text-slate-500">Tu carrito está vacío.</p>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <h1 className="font-display font-800 text-2xl text-navy mb-6">Finalizar compra</h1>

      <div className="grid md:grid-cols-3 gap-8">
        <form onSubmit={handleSubmit} className="md:col-span-2 flex flex-col gap-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-slate-700 mb-1">Nombre y apellido</label>
            <input id="name" name="name" required value={form.name} onChange={handleChange}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-400" />
          </div>
          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-slate-700 mb-1">Teléfono</label>
            <input id="phone" name="phone" required value={form.phone} onChange={handleChange}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-400" />
          </div>
          <div>
            <label htmlFor="address" className="block text-sm font-medium text-slate-700 mb-1">Dirección de entrega</label>
            <input id="address" name="address" required value={form.address} onChange={handleChange}
              placeholder="Calle, número, piso/depto, referencia"
              className="w-full border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-400" />
          </div>
          <div>
            <label htmlFor="payment" className="block text-sm font-medium text-slate-700 mb-1">Método de pago</label>
            <select id="payment" name="payment" value={form.payment} onChange={handleChange}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-400">
              <option value="efectivo">Efectivo al recibir</option>
              <option value="transferencia">Transferencia</option>
              <option value="mercadopago">Mercado Pago (tarjeta, débito o dinero en cuenta)</option>
            </select>
          </div>
          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-slate-700 mb-1">Notas para el repartidor (opcional)</label>
            <textarea id="notes" name="notes" value={form.notes} onChange={handleChange} rows={3}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-400" />
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="bg-brand-500 hover:bg-brand-600 disabled:opacity-60 transition-colors text-white font-semibold px-6 py-3 rounded-lg"
          >
            {submitting
              ? 'Procesando...'
              : form.payment === 'mercadopago'
              ? 'Ir a pagar con Mercado Pago'
              : 'Confirmar pedido por WhatsApp'}
          </button>
          {!isSupabaseConfigured && (
            <p className="text-xs text-slate-400">
              Nota: Supabase todavía no está conectado, así que este pedido solo se envía por WhatsApp y no queda guardado en la base de datos. El pago con Mercado Pago necesita Supabase conectado.
            </p>
          )}
        </form>

        <div className="border border-slate-100 rounded-xl p-5 h-fit">
          <h2 className="font-display font-700 text-navy mb-4">Tu pedido</h2>
          <ul className="text-sm text-slate-600 flex flex-col gap-1 mb-4">
            {items.map((i) => (
              <li key={i.id} className="flex justify-between">
                <span>{i.qty} x {i.name}</span>
                <span>$ {(i.price * i.qty).toLocaleString('es-AR')}</span>
              </li>
            ))}
          </ul>
          <div className="flex justify-between text-sm text-slate-600 mb-1">
            <span>Subtotal</span>
            <span>$ {subtotal.toLocaleString('es-AR')}</span>
          </div>
          <div className="flex justify-between text-sm text-slate-600 mb-1">
            <span>Envío</span>
            <span>{shipping === 0 ? 'Gratis' : `$ ${shipping.toLocaleString('es-AR')}`}</span>
          </div>
          <div className="flex justify-between font-display font-800 text-navy text-lg border-t border-slate-100 mt-3 pt-3">
            <span>Total</span>
            <span>$ {total.toLocaleString('es-AR')}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
