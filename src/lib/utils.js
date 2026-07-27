import clsx from 'clsx'
export const cn = (...c) => clsx(...c)
export const formatPrice = n => '₹' + Number(n).toLocaleString('en-IN')

export function isLightColor(hex = '#000000') {
  const value = String(hex).replace('#', '')
  if (value.length < 6) return false
  const r = parseInt(value.slice(0, 2), 16)
  const g = parseInt(value.slice(2, 4), 16)
  const b = parseInt(value.slice(4, 6), 16)
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  return luminance > 0.82
}

export function computeDiscountPercent(mrp, sellPrice) {
  const m = Number(mrp) || 0
  const s = Number(sellPrice) || 0
  if (m <= 0 || s >= m) return 0
  return Math.round(((m - s) / m) * 100)
}

export function promoDiscount(applied, cartTotal) {
  if (!applied) return 0
  if (applied.type === 'percentage') return Math.round(cartTotal * (Number(applied.value) / 100))
  if (applied.type === 'fixed') return Math.min(Number(applied.value), cartTotal)
  return 0
}

export function promoShipping(applied, cartTotal) {
  return cartTotal >= 999 || applied?.type === 'shipping' ? 0 : 149
}

export function formatPromoLabel(promo) {
  if (!promo?.code) return ''
  if (promo.type === 'percentage') return `${promo.code} — ${promo.value}% off`
  if (promo.type === 'fixed') return `${promo.code} — ${formatPrice(promo.value)} off`
  if (promo.type === 'shipping') return `${promo.code} — Free shipping`
  return promo.code
}

export function colorSwatchClass(hex, selected = false) {
  const light = isLightColor(hex)
  return cn(
    'rounded-full border-2 transition-all',
    selected
      ? 'border-primary scale-110 ring-2 ring-primary/30'
      : light
        ? 'border-ink/30 shadow-[inset_0_0_0_1px_rgba(0,0,0,0.08)] hover:scale-110'
        : 'border-line hover:scale-110'
  )
}
export const statusColor = s => ({ pending:'bg-yellow-100 text-yellow-700', paid:'bg-green-100 text-green-700', shipped:'bg-blue-100 text-blue-700', delivered:'bg-emerald-100 text-emerald-700', cancelled:'bg-red-100 text-red-700', refunded:'bg-orange-100 text-orange-700' }[s] || 'bg-gray-100 text-gray-700')
export const statusLabel = s => s.charAt(0).toUpperCase() + s.slice(1)
