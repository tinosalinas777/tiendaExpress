const trust = [
  { icon: '🛡️', title: 'Compra 100% segura', text: 'Protegemos tus datos' },
  { icon: '🔄', title: 'Cambios fáciles', text: 'Consultanos por WhatsApp' },
  { icon: '🏍️', title: 'Reparto propio', text: 'Nuestra moto, sin intermediarios' },
  { icon: '🏷️', title: 'Ofertas de la semana', text: 'Descuentos en productos elegidos' },
]

export default function Footer() {
  return (
    <>
      <section className="bg-navy">
        <div className="max-w-7xl mx-auto px-4 py-8 grid grid-cols-2 md:grid-cols-4 gap-6">
          {trust.map((t) => (
            <div key={t.title} className="flex items-center gap-3">
              <span className="w-11 h-11 rounded-full bg-white/10 grid place-items-center text-xl shrink-0">
                {t.icon}
              </span>
              <div>
                <p className="font-semibold text-white text-sm">{t.title}</p>
                <p className="text-slate-400 text-xs">{t.text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
      <footer className="bg-white border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-4 py-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-slate-500">
          <p>© {new Date().getFullYear()} Almacén Express. Todos los derechos reservados.</p>
          <a href="/admin" className="text-slate-400 hover:text-brand-500 transition-colors">
            Acceso administrador
          </a>
        </div>
      </footer>
    </>
  )
}
