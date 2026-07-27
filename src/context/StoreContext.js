'use client'
import { createContext, useContext, useReducer, useEffect, useState } from 'react'
import toast from 'react-hot-toast'

const StoreContext = createContext(null)

function cartKey(product, variant) {
  return `${product?.id || product}|${variant?.id || variant?.variantId || 'default'}`
}

function normalizeCart(cart = []) {
  return Object.values(cart.reduce((acc, item) => {
    if (!item?.product?.id) return acc
    const key = cartKey(item.product, item.variant)
    const qty = Math.max(1, Number(item.qty) || Number(item.quantity) || 1)
    const stock = item.variant?.stock ?? 0
    acc[key] = acc[key]
      ? { ...acc[key], qty: Math.min((acc[key].qty || 1) + qty, stock) }
      : { ...item, key, qty: Math.min(qty, stock) }
    return acc
  }, {}))
}

function reducer(state, action) {
  switch(action.type) {
    case 'ADD': {
      const { product, variant, qty=1 } = action.payload
      const key = cartKey(product, variant)
      const ex = state.cart.find(i => i.key === key)
      const availableStock = variant?.stock ?? 0
      const cart = ex
        ? state.cart.map(i => i.key===key ? {...i, qty: Math.min(i.qty+qty, availableStock)} : i)
        : [...state.cart, {key,product,variant,qty}]
      return { ...state, cart: normalizeCart(cart) }
    }
    case 'REMOVE': return { ...state, cart: normalizeCart(state.cart.filter(i => i.key !== action.payload)) }
    case 'QTY':   return { ...state, cart: normalizeCart(state.cart.map(i => i.key===action.payload.key ? {...i,qty:Math.max(1,Math.min(action.payload.qty,i.variant?.stock ?? 0))} : i)) }
    case 'CLEAR': return { ...state, cart: [] }
    case 'LOAD':  return { ...state, ...action.payload, cart: normalizeCart(action.payload.cart || []) }
    default: return state
  }
}

export function StoreProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, { cart:[] })
  const [hydrated, setHydrated] = useState(false)
  const [appliedPromo, setAppliedPromo] = useState(null)

  useEffect(() => {
    try {
      const s = localStorage.getItem('sv2')
      if (s) {
        const saved = JSON.parse(s)
        dispatch({ type:'LOAD', payload:{ cart: saved.cart || [] } })
        setAppliedPromo(saved.appliedPromo || null)
      }
    } catch(_){
    } finally {
      setHydrated(true)
    }
  }, [])
  useEffect(() => {
    if (!hydrated) return
    try { localStorage.setItem('sv2', JSON.stringify({ cart:normalizeCart(state.cart), appliedPromo })) } catch(_){}
  }, [state.cart, appliedPromo, hydrated])

  const addToCart = (product, variant, qty=1) => {
    if (!variant || variant.stock === 0) { toast.error('Out of stock'); return }
    dispatch({type:'ADD',payload:{product,variant,qty}})
    toast.success('Added to cart!')
  }
  const removeFromCart = key => { dispatch({type:'REMOVE',payload:key}); toast.success('Removed') }
  const updateQty = (key,qty) => dispatch({type:'QTY',payload:{key,qty}})
  const clearCart = () => {
    dispatch({type:'CLEAR'})
    setAppliedPromo(null)
  }

  const cart = normalizeCart(state.cart)
  const cartTotal = cart.reduce((s,i)=>s+Number(i.variant?.sellingPrice || 0)*i.qty,0)
  const cartCount = cart.reduce((s,i)=>s+i.qty,0)

  return (
    <StoreContext.Provider value={{
      ...state,
      cart,
      hydrated,
      cartTotal,
      cartCount,
      appliedPromo,
      setAppliedPromo,
      addToCart,
      removeFromCart,
      updateQty,
      clearCart
    }}>
      {children}
    </StoreContext.Provider>
  )
}
export const useStore = () => { const c=useContext(StoreContext); if(!c) throw new Error('no StoreProvider'); return c }
