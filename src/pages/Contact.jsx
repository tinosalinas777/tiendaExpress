export default function Contact() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-16 text-center">
      <h1 className="font-display font-800 text-2xl text-navy mb-3">
        Contacto
      </h1>
      <p className="text-slate-500 mb-8">
        ¿Tenés alguna consulta sobre tu pedido o un producto? Escribinos, te
        respondemos rápido.
      </p>
      <a
        href="https://wa.me/5491127227613"
        target="_blank"
        rel="noreferrer"
        className="inline-block bg-brand-500 hover:bg-brand-600 transition-colors text-white font-semibold px-6 py-3 rounded-lg"
      >
        Escribir por WhatsApp
      </a>
    </div>
  );
}
