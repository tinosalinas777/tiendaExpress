const benefits = [
  { icon: '🏍️', title: 'Reparto en moto', text: 'Envíos rápidos por el barrio' },
  { icon: '🥦', title: 'Productos frescos', text: 'Seleccionados todos los días' },
  { icon: '💳', title: 'Varios medios de pago', text: 'Tarjeta, transferencia o efectivo' },
  { icon: '🎧', title: 'Atención personalizada', text: 'Te ayudamos por WhatsApp' },
]

export default function Benefits() {
  return (
    <section className="border-b border-slate-100">
      <div className="max-w-7xl mx-auto px-4 py-8 grid grid-cols-2 md:grid-cols-4 gap-6">
        {benefits.map((b) => (
          <div key={b.title} className="flex items-center gap-3">
            <span className="w-11 h-11 rounded-full bg-brand-50 grid place-items-center text-xl shrink-0">
              {b.icon}
            </span>
            <div>
              <p className="font-semibold text-navy text-sm">{b.title}</p>
              <p className="text-slate-500 text-xs">{b.text}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
