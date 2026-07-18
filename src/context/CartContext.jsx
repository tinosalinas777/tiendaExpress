import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'

const CartContext = createContext(null)
const STORAGE_KEY = 'almacen-express-cart'

export function CartProvider({ children }) {
  const [items, setItems] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      return saved ? JSON.parse(saved) : []
    } catch {
      return []
    }
  })

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
  }, [items])

  const addItem = (product, qty = 1) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.id === product.id)
      if (existing) {
        return prev.map((i) => (i.id === product.id ? { ...i, qty: i.qty + qty } : i))
      }
      return [...prev, { id: product.id, name: product.name, price: product.price, unit: product.unit, icon: product.icon, image_url: product.image_url, qty }]
    })
  }

  const updateQty = (id, qty) => {
    if (qty <= 0) {
      removeItem(id)
      return
    }
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, qty } : i)))
  }

  const removeItem = (id) => setItems((prev) => prev.filter((i) => i.id !== id))

  const clearCart = () => setItems([])

  const subtotal = useMemo(() => items.reduce((sum, i) => sum + i.price * i.qty, 0), [items])
  const itemCount = useMemo(() => items.reduce((sum, i) => sum + i.qty, 0), [items])

  // Envío gratis a partir de cierto monto; si no, costo fijo de reparto en moto.
  const FREE_SHIPPING_THRESHOLD = 15000
  const DELIVERY_FEE = 1200
  const shipping = items.length === 0 ? 0 : subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : DELIVERY_FEE
  const total = subtotal + shipping

  const value = {
    items,
    addItem,
    updateQty,
    removeItem,
    clearCart,
    subtotal,
    shipping,
    total,
    itemCount,
    FREE_SHIPPING_THRESHOLD,
  }

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart debe usarse dentro de <CartProvider>')
  return ctx
}
