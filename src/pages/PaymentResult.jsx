import { Link, useSearchParams } from 'react-router-dom'

const CONTENT = {
  success: {
    icon: '✅',
    title: '¡Pago aprobado!',
    text: 'Recibimos tu pago. Ya le avisamos al almacén para que preparen tu pedido y salga la moto.',
  },
  failure: {
    icon: '❌',
    title: 'El pago no se pudo procesar',
    text: 'Algo falló al intentar cobrar. Podés volver al carrito e intentar de nuevo, o elegir pagar en efectivo al recibir.',
  },
  pending: {
    icon: '⏳',
    title: 'Tu pago está pendiente',
    text: 'Mercado Pago todavía está procesando el pago (por ejemplo, si elegiste pagar en efectivo en un punto de pago). Te avisamos apenas se acredite.',
  },
}

export default function PaymentResult({ variant }) {
  const [params] = useSearchParams()
  const orderId = params.get('external_reference')
  const { icon, title, text } = CONTENT[variant]

  return (
    <div className="max-w-lg mx-auto px-4 py-20 text-center">
      <p className="text-5xl mb-4">{icon}</p>
      <h1 className="font-display font-800 text-2xl text-navy mb-2">{title}</h1>
      <p className="text-slate-500 mb-1">{text}</p>
      {orderId && <p className="text-slate-400 text-sm mb-6">Pedido #{orderId}</p>}
      <div className="mt-6 flex items-center justify-center gap-3">
        <Link to="/" className="bg-brand-500 hover:bg-brand-600 transition-colors text-white font-semibold px-6 py-3 rounded-lg">
          Volver a la tienda
        </Link>
        {variant === 'failure' && (
          <Link to="/carrito" className="border border-slate-200 hover:border-navy transition-colors text-navy font-semibold px-6 py-3 rounded-lg">
            Ver mi carrito
          </Link>
        )}
      </div>
    </div>
  )
}
