import { Link } from 'react-router-dom'

export default function Hero() {
  return (
    <section className="bg-navy relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 py-14 md:py-20 grid md:grid-cols-2 gap-10 items-center">
        <div>
          <p className="text-brand-400 font-semibold text-sm tracking-wide uppercase mb-3">
            Tu almacén de barrio, ahora online
          </p>
          <h1 className="text-white font-display font-800 text-4xl md:text-5xl leading-tight">
            Hacé el pedido y lo tenés en la puerta de tu casa <span className="text-brand-400">en minutos.</span>
          </h1>
          <p className="text-slate-300 mt-5 text-base md:text-lg max-w-md">
            Comprá tu changuito del super desde el celu. Nuestro repartidor sale en moto apenas confirmás el pedido.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              to="/tienda"
              className="bg-brand-500 hover:bg-brand-600 transition-colors text-white font-semibold px-6 py-3 rounded-lg"
            >
              Ver productos
            </Link>
            <Link
              to="/tienda?ofertas=1"
              className="border border-white/20 hover:border-white/40 transition-colors text-white font-semibold px-6 py-3 rounded-lg"
            >
              Ver ofertas
            </Link>
          </div>
        </div>

        {/* Signature: ruta punteada con la moto de reparto */}
        <div className="relative h-64 md:h-80" aria-hidden="true">
          <svg viewBox="0 0 400 300" className="w-full h-full">
            <path
              id="route"
              d="M20,260 C120,260 100,120 200,120 S320,40 380,40"
              fill="none"
              stroke="#2F6FED"
              strokeOpacity="0.35"
              strokeWidth="3"
              strokeDasharray="2 12"
              strokeLinecap="round"
            />
            <circle cx="20" cy="260" r="7" fill="#5B8DFF" />
            <circle cx="380" cy="40" r="9" fill="#fff" />
            <text x="335" y="25" fill="#94A3B8" fontSize="12" fontFamily="Inter, sans-serif">
              Tu casa
            </text>
            <text x="24" y="280" fill="#94A3B8" fontSize="12" fontFamily="Inter, sans-serif">
              El almacén
            </text>
            <g className="moto-rider">
              <text x="0" y="0" fontSize="34">🏍️</text>
            </g>
          </svg>
        </div>
      </div>

      <style>{`
        .moto-rider {
          offset-path: path('M20,260 C120,260 100,120 200,120 S320,40 380,40');
          animation: ride 6s ease-in-out infinite alternate;
        }
        @keyframes ride {
          0% { offset-distance: 0%; }
          100% { offset-distance: 100%; }
        }
        @media (prefers-reduced-motion: reduce) {
          .moto-rider { animation: none; offset-distance: 40%; }
        }
      `}</style>
    </section>
  )
}
