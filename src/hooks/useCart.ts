import { useState, useCallback } from 'react'
import { Cart, Product, fmt } from '../types'

export function useCart() {
  const [cart, setCart] = useState<Cart>({})

  const addToCart = useCallback((product: Product) => {
    setCart(prev => {
      const existing = prev[product.id]
      return {
        ...prev,
        [product.id]: {
          product,
          qty: existing ? existing.qty + 1 : 1,
        },
      }
    })
  }, [])

  const removeFromCart = useCallback((productId: string) => {
    setCart(prev => {
      const existing = prev[productId]
      if (!existing) return prev
      if (existing.qty <= 1) {
        const next = { ...prev }
        delete next[productId]
        return next
      }
      return { ...prev, [productId]: { ...existing, qty: existing.qty - 1 } }
    })
  }, [])

  const clearCart = useCallback(() => setCart({}), [])

  const cartItems = Object.values(cart)
  const cartCount = cartItems.reduce((sum, i) => sum + i.qty, 0)
  const cartTotal = cartItems.reduce((sum, i) => sum + i.qty * i.product.price, 0)
  const cartTotalFmt = fmt(cartTotal)

  return { cart, cartItems, cartCount, cartTotal, cartTotalFmt, addToCart, removeFromCart, clearCart }
}
