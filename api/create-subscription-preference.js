// Vercel Serverless Function: POST /api/create-subscription-preference
// Crea una preferencia de pago de Mercado Pago para RENOVAR la suscripción
// mensual de esta tienda (no un pedido de un cliente — esto es lo que el
// dueño de la tienda te paga a VOS por el servicio).
//
// IMPORTANTE: usa MP_DEVELOPER_ACCESS_TOKEN (TU cuenta de Mercado Pago),
// no MP_ACCESS_TOKEN (la del negocio, que se usa para cobrarles a los
// clientes de la tienda). Si usaran el mismo token, el dueño terminaría
// pagándose la suscripción a sí mismo en vez de pagarte a vos.
//
// El precio nunca lo manda el navegador: se lee de la tabla `subscription`
// en Supabase, así nadie puede pagar una suscripción a un precio inventado.
//
// Requiere que quien llama esté logueado como admin de ESTA tienda — el
// frontend manda el access token de Supabase en el header Authorization.
//
// Variables de entorno necesarias:
//   MP_DEVELOPER_ACCESS_TOKEN, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY

import { MercadoPagoConfig, Preference } from 'mercadopago'
import { createClient } from '@supabase/supabase-js'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' })
  }

  if (!process.env.MP_DEVELOPER_ACCESS_TOKEN) {
    return res.status(500).json({ error: 'MP_DEVELOPER_ACCESS_TOKEN no está configurado en el servidor' })
  }

  const authHeader = req.headers.authorization || ''
  const accessToken = authHeader.replace('Bearer ', '')
  if (!accessToken) {
    return res.status(401).json({ error: 'No autenticado' })
  }

  try {
    const supabaseAdmin = createClient(
      process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
    )

    // Verificamos que el token pertenezca a un usuario real...
    const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(accessToken)
    if (userError || !userData?.user) {
      return res.status(401).json({ error: 'Sesión inválida' })
    }

    // ...y que además esté en la lista de administradores de esta tienda.
    const { data: adminRow } = await supabaseAdmin
      .from('admin_users')
      .select('user_id')
      .eq('user_id', userData.user.id)
      .maybeSingle()
    if (!adminRow) {
      return res.status(403).json({ error: 'No sos administrador de esta tienda' })
    }

    const { data: subscription, error: subError } = await supabaseAdmin
      .from('subscription')
      .select('*')
      .eq('id', 1)
      .single()
    if (subError || !subscription) {
      return res.status(404).json({ error: 'No se encontró la suscripción' })
    }

    const origin = req.headers.origin || `https://${req.headers.host}`

    const client = new MercadoPagoConfig({ accessToken: process.env.MP_DEVELOPER_ACCESS_TOKEN })
    const preference = new Preference(client)

    // external_reference con prefijo "sub-" para que el webhook sepa que
    // esto es un pago de suscripción y no el de un pedido de un cliente.
    const externalReference = `sub-${Date.now()}`

    const result = await preference.create({
      body: {
        items: [
          {
            title: subscription.plan_name || 'Suscripción mensual',
            quantity: 1,
            unit_price: Number(subscription.price),
            currency_id: 'ARS',
          },
        ],
        external_reference: externalReference,
        back_urls: {
          success: `${origin}/admin/suscripcion`,
          failure: `${origin}/admin/suscripcion`,
          pending: `${origin}/admin/suscripcion`,
        },
        auto_return: 'approved',
        notification_url: `${origin}/api/mercadopago-webhook`,
      },
    })

    await supabaseAdmin.from('subscription').update({ mp_preference_id: result.id }).eq('id', 1)

    return res.status(200).json({ init_point: result.init_point, id: result.id })
  } catch (err) {
    console.error('create-subscription-preference error:', err)
    return res.status(500).json({ error: 'No se pudo crear la preferencia de pago' })
  }
}
