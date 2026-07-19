import { useState } from 'react'
import { supabase, isSupabaseConfigured } from '../../lib/supabaseClient'
import { useSubscription } from '../../context/SubscriptionContext'
import { BANK_TRANSFER_DETAILS, buildDeveloperWhatsappLink } from '../../lib/config'

export default function AdminSubscription() {
  const { subscription, loading, isExpired, isPendingVerification, refresh } = useSubscription()
  const [payingMP, setPayingMP] = useState(false)
  const [notifying, setNotifying] = useState(false)
  const [error, setError] = useState('')

  const handlePayWithMercadoPago = async () => {
    setError('')
    setPayingMP(true)
    try {
      const { data: sessionData } = await supabase.auth.getSession()
      const accessToken = sessionData?.session?.access_token
      if (!accessToken) throw new Error('Sesión inválida, volvé a iniciar sesión.')

      const res = await fetch('/api/create-subscription-preference', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
      })
      const raw = await res.text()
      let data
      try {
        data = JSON.parse(raw)
      } catch {
        throw new Error(`El servidor de pagos no respondió correctamente (código ${res.status}).`)
      }
      if (!res.ok || !data.init_point) {
        throw new Error(data.error || 'No se pudo iniciar el pago.')
      }
      window.location.href = data.init_point
    } catch (err) {
      console.error(err)
      setError(err.message || 'No se pudo iniciar el pago con Mercado Pago.')
      setPayingMP(false)
    }
  }

  const handleNotifyTransfer = async () => {
    setError('')
    setNotifying(true)
    try {
      const { error: rpcError } = await supabase.rpc('request_subscription_verification', {
        p_payment_method: 'transferencia',
      })
      if (rpcError) throw rpcError
      await refresh()
      window.open(
        buildDeveloperWhatsappLink(
          `Hola! Te aviso que ya hice la transferencia de la suscripción mensual de mi tienda. Quedo pendiente de la confirmación.`,
        ),
        '_blank',
      )
    } catch (err) {
      console.error(err)
      setError('No se pudo registrar el aviso. Probá de nuevo.')
    } finally {
      setNotifying(false)
    }
  }

  if (!isSupabaseConfigured) {
    return (
      <div className="p-6 md:p-8">
        <p className="text-slate-400 text-sm">Conectá Supabase para ver el estado de la suscripción.</p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="p-6 md:p-8">
        <p className="text-slate-400 text-sm">Cargando...</p>
      </div>
    )
  }

  const endDate = subscription
    ? new Date(subscription.current_period_end + 'T00:00:00').toLocaleDateString('es-AR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      })
    : '—'

  return (
    <div className="p-6 md:p-8 max-w-3xl">
      <h1 className="font-display font-800 text-2xl text-navy mb-6">Mi suscripción</h1>

      <div className="bg-white border border-slate-100 rounded-xl shadow-card p-6 mb-6">
        <div className="flex items-center justify-between flex-wrap gap-2 mb-4">
          <div>
            <p className="text-slate-500 text-sm">{subscription?.plan_name || 'Plan mensual'}</p>
            <p className="font-display font-800 text-2xl text-navy">
              $ {Number(subscription?.price || 0).toLocaleString('es-AR')} / mes
            </p>
          </div>
          <StatusPill isExpired={isExpired} isPendingVerification={isPendingVerification} />
        </div>

        {isPendingVerification ? (
          <p className="text-sm text-slate-600 bg-amber-50 rounded-lg p-3">
            Ya avisaste que transferiste — en cuanto se confirme el pago, vuelve a quedar activa
            automáticamente. Esto puede demorar hasta 24-48hs hábiles.
          </p>
        ) : isExpired ? (
          <p className="text-sm text-slate-600 bg-red-50 rounded-lg p-3">
            Tu suscripción venció el {endDate}. Podés seguir viendo y gestionando tus pedidos, pero
            no vas a poder agregar, editar ni eliminar productos hasta que la renueves.
          </p>
        ) : (
          <p className="text-sm text-slate-600">
            Tu suscripción está al día. Vence el <strong>{endDate}</strong>.
          </p>
        )}
      </div>

      {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

      {!isPendingVerification && (
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="bg-white border border-slate-100 rounded-xl shadow-card p-5">
            <h2 className="font-display font-700 text-navy mb-2">Pagar con Mercado Pago</h2>
            <p className="text-slate-500 text-sm mb-4">
              Pago inmediato con tarjeta, débito o dinero en cuenta. Se confirma solo en unos minutos.
            </p>
            <button
              onClick={handlePayWithMercadoPago}
              disabled={payingMP}
              className="w-full bg-brand-500 hover:bg-brand-600 disabled:opacity-60 transition-colors text-white font-semibold px-6 py-2.5 rounded-lg"
            >
              {payingMP ? 'Redirigiendo...' : 'Renovar con Mercado Pago'}
            </button>
          </div>

          <div className="bg-white border border-slate-100 rounded-xl shadow-card p-5">
            <h2 className="font-display font-700 text-navy mb-2">Transferencia bancaria</h2>
            <div className="text-slate-600 text-sm mb-4 flex flex-col gap-1">
              <p>Titular: {BANK_TRANSFER_DETAILS.titular}</p>
              <p>CBU: {BANK_TRANSFER_DETAILS.cbu}</p>
              <p>Alias: {BANK_TRANSFER_DETAILS.alias}</p>
              <p>Banco: {BANK_TRANSFER_DETAILS.banco}</p>
            </div>
            <button
              onClick={handleNotifyTransfer}
              disabled={notifying}
              className="w-full border border-slate-200 hover:border-navy disabled:opacity-60 transition-colors text-navy font-semibold px-6 py-2.5 rounded-lg"
            >
              {notifying ? 'Enviando aviso...' : 'Ya transferí, avisar'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function StatusPill({ isExpired, isPendingVerification }) {
  if (isPendingVerification) {
    return (
      <span className="text-xs font-semibold px-3 py-1 rounded-full bg-amber-100 text-amber-700">
        Verificando pago
      </span>
    )
  }
  if (isExpired) {
    return (
      <span className="text-xs font-semibold px-3 py-1 rounded-full bg-red-100 text-red-700">
        Vencida
      </span>
    )
  }
  return (
    <span className="text-xs font-semibold px-3 py-1 rounded-full bg-green-100 text-green-700">
      Activa
    </span>
  )
}
