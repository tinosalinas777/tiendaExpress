import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { StatusBadge, PaymentBadge } from './Dashboard'

const STATUSES = ['pendiente', 'en_camino', 'entregado', 'cancelado']

export default function AdminOrders() {
  const [orders, setOrders] = useState([])
  const [itemsByOrder, setItemsByOrder] = useState({})
  const [expanded, setExpanded] = useState(null)
  const [filter, setFilter] = useState('todos')
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true)
    let query = supabase.from('orders').select('*').order('created_at', { ascending: false })
    if (filter !== 'todos') query = query.eq('status', filter)
    const { data } = await query
    setOrders(data || [])
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [filter])

  const toggleExpand = async (orderId) => {
    if (expanded === orderId) {
      setExpanded(null)
      return
    }
    setExpanded(orderId)
    if (!itemsByOrder[orderId]) {
      const { data } = await supabase.from('order_items').select('*').eq('order_id', orderId)
      setItemsByOrder((prev) => ({ ...prev, [orderId]: data || [] }))
    }
  }

  const updateStatus = async (orderId, status) => {
    setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status } : o)))
    await supabase.from('orders').update({ status }).eq('id', orderId)
  }

  return (
    <div className="p-6 md:p-8">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <h1 className="font-display font-800 text-2xl text-navy">Pedidos</h1>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
        >
          <option value="todos">Todos los estados</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>{s.replace('_', ' ')}</option>
          ))}
        </select>
      </div>

      <div className="bg-white border border-slate-100 rounded-xl shadow-card overflow-hidden">
        {loading ? (
          <p className="p-5 text-slate-400 text-sm">Cargando pedidos...</p>
        ) : orders.length === 0 ? (
          <p className="p-5 text-slate-400 text-sm">No hay pedidos con ese filtro.</p>
        ) : (
          <div className="divide-y divide-slate-100">
            {orders.map((o) => (
              <div key={o.id}>
                <button
                  onClick={() => toggleExpand(o.id)}
                  className="w-full text-left px-5 py-4 flex items-center justify-between gap-4 hover:bg-slate-50 transition-colors"
                >
                  <div className="min-w-0">
                    <p className="font-medium text-navy text-sm">#{o.id} · {o.customer_name}</p>
                    <p className="text-slate-400 text-xs truncate">{o.delivery_address}</p>
                    <p className="text-slate-400 text-xs">{new Date(o.created_at).toLocaleString('es-AR')}</p>
                  </div>
                  <div className="text-right shrink-0 flex items-center gap-4">
                    <div>
                      <p className="font-semibold text-navy">$ {Number(o.total).toLocaleString('es-AR')}</p>
                      <div className="flex gap-1 justify-end flex-wrap">
                        <StatusBadge status={o.status} />
                        <PaymentBadge status={o.payment_status} />
                      </div>
                    </div>
                    <span className="text-slate-400">{expanded === o.id ? '▲' : '▼'}</span>
                  </div>
                </button>

                {expanded === o.id && (
                  <div className="px-5 pb-5 bg-slate-50">
                    <div className="grid sm:grid-cols-2 gap-4 mb-4 text-sm">
                      <div>
                        <p className="text-slate-500">Teléfono</p>
                        <p className="text-navy font-medium">{o.customer_phone}</p>
                      </div>
                      <div>
                        <p className="text-slate-500">Pago</p>
                        <p className="text-navy font-medium capitalize">{o.payment_method}</p>
                        {o.mp_payment_id && (
                          <p className="text-slate-400 text-xs">Pago MP #{o.mp_payment_id}</p>
                        )}
                      </div>
                      {o.notes && (
                        <div className="sm:col-span-2">
                          <p className="text-slate-500">Notas</p>
                          <p className="text-navy">{o.notes}</p>
                        </div>
                      )}
                    </div>

                    <ul className="text-sm text-slate-700 flex flex-col gap-1 mb-4">
                      {(itemsByOrder[o.id] || []).map((it) => (
                        <li key={it.id} className="flex justify-between">
                          <span>{it.quantity} x {it.product_name}</span>
                          <span>$ {(it.quantity * it.unit_price).toLocaleString('es-AR')}</span>
                        </li>
                      ))}
                    </ul>

                    <div className="flex items-center gap-2">
                      <span className="text-sm text-slate-500">Estado:</span>
                      <select
                        value={o.status}
                        onChange={(e) => updateStatus(o.id, e.target.value)}
                        className="border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
                      >
                        {STATUSES.map((s) => (
                          <option key={s} value={s}>{s.replace('_', ' ')}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
