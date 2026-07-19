// Vercel Serverless Function: POST /api/mercadopago-webhook
// Mercado Pago llama a esta URL cada vez que cambia el estado de un pago.
// OJO: esta única URL recibe notificaciones de DOS cuentas de Mercado Pago
// distintas — la del negocio (pagos de pedidos de sus clientes) y la TUYA
// (pago de la suscripción mensual que te hace el dueño de la tienda). Cada
// pago solo se puede consultar con el token de la cuenta que lo recibió,
// así que probamos con los dos tokens hasta encontrar el que corresponde
// (ver fetchPayment más abajo).
//
// Qué actualiza según el prefijo de external_reference:
//   - pedidos de clientes de la tienda (id numérico) -> actualiza `orders`
//   - suscripción mensual de la tienda ("sub-...")    -> actualiza `subscription`
//
// Seguridad:
// 1) No confiamos en el cuerpo del POST: volvemos a pedirle el pago a la
//    API de Mercado Pago con nuestro propio access token.
// 2) Si configuraste MP_WEBHOOK_SECRET (recomendado en producción),
//    validamos la firma "x-signature" para confirmar que la notificación
//    vino realmente de Mercado Pago.
// 3) Antes de aprobar un pago, comparamos el monto pagado contra el total
//    real guardado en Supabase. Si no coincide, no se aprueba.

import crypto from 'crypto'
import { MercadoPagoConfig, Payment } from 'mercadopago'
import { createClient } from '@supabase/supabase-js'

const STATUS_MAP = {
  approved: 'aprobado',
  pending: 'pendiente',
  in_process: 'pendiente',
  authorized: 'pendiente',
  rejected: 'rechazado',
  cancelled: 'rechazado',
  refunded: 'rechazado',
  charged_back: 'rechazado',
}

function isSignatureValid(req, dataId) {
  const secret = process.env.MP_WEBHOOK_SECRET
  if (!secret) {
    // Todavía no configuraron el secreto: dejamos pasar la notificación
    // (igual se re-valida el pago contra la API de MP más abajo), pero
    // avisamos en los logs para que lo configuren en producción.
    console.warn('MP_WEBHOOK_SECRET no configurado: no se valida la firma del webhook.')
    return true
  }

  const signatureHeader = req.headers['x-signature']
  const requestId = req.headers['x-request-id']
  if (!signatureHeader || !requestId) return false

  const parts = Object.fromEntries(
    String(signatureHeader)
      .split(',')
      .map((p) => p.split('=').map((s) => s.trim())),
  )
  const { ts, v1 } = parts
  if (!ts || !v1) return false

  const manifest = `id:${dataId};request-id:${requestId};ts:${ts};`
  const expected = crypto.createHmac('sha256', secret).update(manifest).digest('hex')

  try {
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(v1))
  } catch {
    return false
  }
}

// Prueba obtener el pago con cada token configurado (el de la tienda y el
// tuyo). Un pago solo existe en la cuenta que lo cobró, así que con el
// token equivocado la API de Mercado Pago simplemente no lo va a
// encontrar — no hace falta saber de antemano cuál es cuál.
async function fetchPayment(paymentId) {
  const tokens = [process.env.MP_ACCESS_TOKEN, process.env.MP_DEVELOPER_ACCESS_TOKEN].filter(Boolean)

  for (const token of tokens) {
    try {
      const client = new MercadoPagoConfig({ accessToken: token })
      const payment = await new Payment(client).get({ id: paymentId })
      if (payment) return payment
    } catch {
      // Este token no reconoce el pago — probamos con el siguiente.
    }
  }
  return null
}

export default async function handler(req, res) {
  try {
    const topic = req.query.topic || req.query.type || req.body?.type
    const paymentId = req.query['data.id'] || req.body?.data?.id

    // Mercado Pago también manda notificaciones de tipo "merchant_order" que
    // podemos ignorar; solo nos interesan las de "payment".
    if (topic !== 'payment' || !paymentId) {
      return res.status(200).json({ received: true })
    }

    if (!isSignatureValid(req, paymentId)) {
      console.error('Firma de webhook inválida, se ignora la notificación.')
      return res.status(200).json({ received: true })
    }

    if (!process.env.MP_ACCESS_TOKEN && !process.env.MP_DEVELOPER_ACCESS_TOKEN) {
      console.error('Ni MP_ACCESS_TOKEN ni MP_DEVELOPER_ACCESS_TOKEN están configurados')
      return res.status(200).json({ received: true })
    }

    const payment = await fetchPayment(paymentId)
    if (!payment) {
      console.error(`No se pudo obtener el pago ${paymentId} con ninguno de los tokens configurados.`)
      return res.status(200).json({ received: true })
    }

    const externalReference = payment.external_reference
    if (!externalReference) return res.status(200).json({ received: true })

    const supabaseAdmin = createClient(
      process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
    )

    // Los pagos de suscripción se crean con external_reference "sub-<algo>"
    // (ver create-subscription-preference.js); todo lo demás es un pedido
    // normal de un cliente de la tienda.
    if (externalReference.startsWith('sub-')) {
      await handleSubscriptionPayment(supabaseAdmin, payment)
    } else {
      await handleOrderPayment(supabaseAdmin, payment, externalReference)
    }

    return res.status(200).json({ received: true })
  } catch (err) {
    console.error('mercadopago-webhook error:', err)
    // Devolvemos 200 igual para que Mercado Pago no reintente indefinidamente
    // notificaciones que ya sabemos que van a volver a fallar (ej. pedido borrado).
    return res.status(200).json({ received: true })
  }
}

async function handleOrderPayment(supabaseAdmin, payment, orderId) {
  let paymentStatus = STATUS_MAP[payment.status] || 'pendiente'

  // Si el pago vino aprobado, verificamos que el monto pagado coincida
  // con el total real del pedido antes de darlo por bueno.
  if (paymentStatus === 'aprobado') {
    const { data: order } = await supabaseAdmin.from('orders').select('total').eq('id', orderId).single()
    const paidAmount = Number(payment.transaction_amount)
    const orderTotal = order ? Number(order.total) : null

    if (orderTotal === null || Math.abs(orderTotal - paidAmount) > 1) {
      console.error(
        `Monto del pago #${payment.id} ($${paidAmount}) no coincide con el total del pedido #${orderId} ($${orderTotal}). No se aprueba.`,
      )
      paymentStatus = 'pendiente'
    }
  }

  await supabaseAdmin
    .from('orders')
    .update({
      payment_status: paymentStatus,
      mp_payment_id: String(payment.id),
    })
    .eq('id', orderId)
}

async function handleSubscriptionPayment(supabaseAdmin, payment) {
  // Un pago rechazado o pendiente de la suscripción no toca nada — la
  // tienda sigue en el estado en que estaba hasta que llegue un pago
  // realmente aprobado.
  if (payment.status !== 'approved') return

  const { data: subscription } = await supabaseAdmin.from('subscription').select('*').eq('id', 1).single()
  if (!subscription) return

  const paidAmount = Number(payment.transaction_amount)
  const expectedAmount = Number(subscription.price)

  if (Math.abs(expectedAmount - paidAmount) > 1) {
    console.error(
      `Monto del pago de suscripción #${payment.id} ($${paidAmount}) no coincide con el precio del plan ($${expectedAmount}). No se aprueba.`,
    )
    return
  }

  // Extendemos un mes desde la fecha de vencimiento actual, o desde hoy si
  // ya estaba vencida — así renovar antes de tiempo no "desperdicia" días.
  const today = new Date()
  const currentEnd = new Date(subscription.current_period_end + 'T00:00:00')
  const base = currentEnd > today ? currentEnd : today
  const newEnd = new Date(base)
  newEnd.setMonth(newEnd.getMonth() + 1)

  await supabaseAdmin
    .from('subscription')
    .update({
      status: 'activa',
      payment_method: 'mercadopago',
      mp_payment_id: String(payment.id),
      current_period_end: newEnd.toISOString().slice(0, 10),
      last_payment_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', 1)
}
