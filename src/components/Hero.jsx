import { Link } from "react-router-dom";

export default function Hero() {
  return (
    <section
      className="relative overflow-hidden bg-navy bg-cover bg-center"
      style={{ backgroundImage: "url('/fondo.png')" }}
    >
      {/* Capa oscura para que el texto blanco se siga leyendo sobre la foto */}
      <div className="absolute inset-0 bg-navy/40" aria-hidden="true" />
      <div className="relative z-10 max-w-7xl mx-auto px-4 py-14 md:py-20 grid md:grid-cols-2 gap-10 items-center">
        <div>
          <p className="text-brand-400 font-semibold text-sm tracking-wide uppercase mb-3">
            Tu almacén de barrio, ahora online
          </p>
          <h1 className="text-white font-display font-800 text-4xl md:text-5xl leading-tight">
            Hacé el pedido y lo tenés en la puerta de tu casa{" "}
            <span className="text-brand-400">en minutos.</span>
          </h1>
          <p className="text-slate-300 mt-5 text-base md:text-lg max-w-md">
            Comprá tu changuito del super desde el celu. Nuestro repartidor sale
            en moto apenas confirmás el pedido.
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
      </div>
    </section>
  );
}
