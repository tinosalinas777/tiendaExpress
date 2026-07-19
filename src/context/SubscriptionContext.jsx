import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient'

const SubscriptionContext = createContext(null)

export function SubscriptionProvider({ children }) {
  const [subscription, setSubscription] = useState(null)
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    if (!isSupabaseConfigured) {
      setLoading(false)
      return
    }
    const { data } = await supabase.from('subscription').select('*').eq('id', 1).single()
    setSubscription(data || null)
    setLoading(false)
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  // La fecha manda: si venció, se considera vencida aunque la columna
  // `status` todavía diga "activa" (no hace falta un cron que la actualice).
  const isExpired = subscription
    ? new Date(subscription.current_period_end + 'T23:59:59') < new Date()
    : false

  const isPendingVerification = subscription?.status === 'pendiente_verificacion'

  const value = { subscription, loading, isExpired, isPendingVerification, refresh }

  return <SubscriptionContext.Provider value={value}>{children}</SubscriptionContext.Provider>
}

export function useSubscription() {
  const ctx = useContext(SubscriptionContext)
  if (!ctx) throw new Error('useSubscription debe usarse dentro de <SubscriptionProvider>')
  return ctx
}
