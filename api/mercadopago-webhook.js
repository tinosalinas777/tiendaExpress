// Vercel Serverless Function: POST /api/mercadopago-webhook
// Mercado Pago llama a esta URL cada vez que cambia el estado de un pago.
// Busca el pedido por external_reference (el id del pedido en Supabase) y
// actualiza payment_status y mp_payment_id.
//
// Configurala como "notification_url" (ya se envía automáticamente desde
// create-preference.js) — no hace falta cargarla a mano en el panel de
// Mercado Pago si usás Checkout Pro con notification_url en la preferencia.

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

export default async function handler(req, res) {
  try {
    const topic = req.query.topic || req.query.type || req.body?.type
    const paymentId = req.query['data.id'] || req.body?.data?.id

    // Mercado Pago también manda notificaciones de tipo "merchant_order" que
    // podemos ignorar; solo nos interesan las de "payment".
    if (topic !== 'payment' || !paymentId) {
      return res.status(200).json({ received: true })
    }

    if (!process.env.MP_ACCESS_TOKEN) {
      console.error('MP_ACCESS_TOKEN no configurado')
      return res.status(200).json({ received: true })
    }

    const client = new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN })
    const paymentClient = new Payment(client)
    const payment = await paymentClient.get({ id: paymentId })

    const orderId = payment.external_reference
    if (!orderId) return res.status(200).json({ received: true })

    const supabaseAdmin = createClient(
      process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
    )

    const paymentStatus = STATUS_MAP[payment.status] || 'pendiente'

    await supabaseAdmin
      .from('orders')
      .update({
        payment_status: paymentStatus,
        mp_payment_id: String(payment.id),
      })
      .eq('id', orderId)

    return res.status(200).json({ received: true })
  } catch (err) {
    console.error('mercadopago-webhook error:', err)
    // Devolvemos 200 igual para que Mercado Pago no reintente indefinidamente
    // notificaciones que ya sabemos que van a volver a fallar (ej. pedido borrado).
    return res.status(200).json({ received: true })
  }
}
