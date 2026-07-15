import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabaseClient'

export default function AdminDashboard() {
  const [stats, setStats] = useState({ pending: 0, todayTotal: 0, todayCount: 0, lowStock: 0 })
  const [recentOrders, setRecentOrders] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const startOfDay = new Date()
      startOfDay.setHours(0, 0, 0, 0)

      const [{ data: pending }, { data: today }, { data: lowStock }, { data: recent }] = await Promise.all([
        supabase.from('orders').select('id').eq('status', 'pendiente'),
        supabase.from('orders').select('total').gte('created_at', startOfDay.toISOString()),
        supabase.from('products').select('id').lt('stock', 5).eq('active', true),
        supabase.from('orders').select('*').order('created_at', { ascending: false }).limit(6),
      ])

      setStats({
        pending: pending?.length || 0,
        todayCount: today?.length || 0,
        todayTotal: (today || []).reduce((sum, o) => sum + Number(o.total), 0),
        lowStock: lowStock?.length || 0,
      })
      setRecentOrders(recent || [])
      setLoading(false)
    }
    load()
  }, [])

  const cards = [
    { label: 'Pedidos pendientes', value: stats.pending, icon: '🏍️', link: '/admin/pedidos' },
    { label: 'Ventas de hoy', value: `$ ${stats.todayTotal.toLocaleString('es-AR')}`, icon: '💰' },
    { label: 'Pedidos de hoy', value: stats.todayCount, icon: '📦' },
    { label: 'Productos con poco stock', value: stats.lowStock, icon: '⚠️', link: '/admin/productos' },
  ]

  return (
    <div className="p-6 md:p-8">
      <h1 className="font-display font-800 text-2xl text-navy mb-6">Resumen</h1>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {cards.map((c) => {
          const Wrapper = c.link ? Link : 'div'
          return (
            <Wrapper key={c.label} to={c.link} className="bg-white border border-slate-100 rounded-xl p-5 shadow-card block hover:shadow-cardHover transition-shadow">
              <span className="text-2xl">{c.icon}</span>
              <p className="font-display font-800 text-2xl text-navy mt-2">{loading ? '—' : c.value}</p>
              <p className="text-slate-500 text-sm">{c.label}</p>
            </Wrapper>
          )
        })}
      </div>

      <div className="bg-white border border-slate-100 rounded-xl shadow-card">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="font-display font-700 text-navy">Últimos pedidos</h2>
          <Link to="/admin/pedidos" className="text-brand-500 text-sm font-medium hover:underline">Ver todos →</Link>
        </div>
        <div className="divide-y divide-slate-100">
          {loading ? (
            <p className="p-5 text-slate-400 text-sm">Cargando...</p>
          ) : recentOrders.length === 0 ? (
            <p className="p-5 text-slate-400 text-sm">Todavía no hay pedidos.</p>
          ) : (
            recentOrders.map((o) => (
              <div key={o.id} className="px-5 py-3 flex items-center justify-between text-sm">
                <div>
                  <p className="font-medium text-navy">#{o.id} · {o.customer_name}</p>
                  <p className="text-slate-400">{new Date(o.created_at).toLocaleString('es-AR')}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-navy">$ {Number(o.total).toLocaleString('es-AR')}</p>
                  <StatusBadge status={o.status} />
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

export function StatusBadge({ status }) {
  const styles = {
    pendiente: 'bg-amber-100 text-amber-700',
    en_camino: 'bg-brand-100 text-brand-700',
    entregado: 'bg-green-100 text-green-700',
    cancelado: 'bg-red-100 text-red-700',
  }
  const labels = {
    pendiente: 'Pendiente',
    en_camino: 'En camino',
    entregado: 'Entregado',
    cancelado: 'Cancelado',
  }
  return (
    <span className={`inline-block text-[11px] font-semibold px-2 py-0.5 rounded-full ${styles[status] || 'bg-slate-100 text-slate-600'}`}>
      {labels[status] || status}
    </span>
  )
}

export function PaymentBadge({ status }) {
  const styles = {
    aprobado: 'bg-green-100 text-green-700',
    pendiente: 'bg-amber-100 text-amber-700',
    rechazado: 'bg-red-100 text-red-700',
    no_aplica: 'bg-slate-100 text-slate-500',
  }
  const labels = {
    aprobado: 'Pago aprobado',
    pendiente: 'Pago pendiente',
    rechazado: 'Pago rechazado',
    no_aplica: 'Efectivo/transferencia',
  }
  return (
    <span className={`inline-block text-[11px] font-semibold px-2 py-0.5 rounded-full ${styles[status] || 'bg-slate-100 text-slate-600'}`}>
      {labels[status] || status}
    </span>
  )
}
