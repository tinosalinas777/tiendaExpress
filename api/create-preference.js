// Vercel Serverless Function: POST /api/create-preference
// Crea una preferencia de pago de Mercado Pago para un pedido ya guardado
// en Supabase, y devuelve la URL (init_point) a la que hay que redirigir
// al cliente para que pague.
//
// Variables de entorno necesarias (configurar en Vercel, NO en el .env del
// frontend, porque son secretas):
//   MP_ACCESS_TOKEN            Access token de Mercado Pago (producción o test)
//   SUPABASE_URL                Mismo valor que VITE_SUPABASE_URL
//   SUPABASE_SERVICE_ROLE_KEY   Service role key de Supabase (Project Settings > API)

import { MercadoPagoConfig, Preference } from 'mercadopago'
import { createClient } from '@supabase/supabase-js'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' })
  }

  const { orderId } = req.body || {}
  if (!orderId) {
    return res.status(400).json({ error: 'Falta orderId' })
  }

  if (!process.env.MP_ACCESS_TOKEN) {
    return res.status(500).json({ error: 'MP_ACCESS_TOKEN no está configurado en el servidor' })
  }

  try {
    const supabaseAdmin = createClient(
      process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
    )

    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single()
    if (orderError || !order) {
      return res.status(404).json({ error: 'Pedido no encontrado' })
    }
    if (order.payment_status === 'aprobado') {
      return res.status(400).json({ error: 'Este pedido ya fue pagado.' })
    }

    const { data: items, error: itemsError } = await supabaseAdmin
      .from('order_items')
      .select('*')
      .eq('order_id', orderId)
    if (itemsError) throw itemsError

    const mpItems = items.map((i) => ({
      title: i.product_name,
      quantity: i.quantity,
      unit_price: Number(i.unit_price),
      currency_id: 'ARS',
    }))

    if (Number(order.shipping) > 0) {
      mpItems.push({
        title: 'Envío (moto)',
        quantity: 1,
        unit_price: Number(order.shipping),
        currency_id: 'ARS',
      })
    }

    const origin = req.headers.origin || `https://${req.headers.host}`

    const client = new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN })
    const preference = new Preference(client)

    const result = await preference.create({
      body: {
        items: mpItems,
        external_reference: String(order.id),
        payer: { name: order.customer_name, phone: { number: order.customer_phone } },
        back_urls: {
          success: `${origin}/pago-exitoso`,
          failure: `${origin}/pago-fallido`,
          pending: `${origin}/pago-pendiente`,
        },
        auto_return: 'approved',
        notification_url: `${origin}/api/mercadopago-webhook`,
        statement_descriptor: 'ALMACEN EXPRESS',
      },
    })

    await supabaseAdmin.from('orders').update({ mp_preference_id: result.id }).eq('id', orderId)

    return res.status(200).json({ init_point: result.init_point, id: result.id })
  } catch (err) {
    console.error('create-preference error:', err)
    return res.status(500).json({ error: 'No se pudo crear la preferencia de pago' })
  }
}
