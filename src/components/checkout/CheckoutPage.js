'use client'
import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Check, ChevronRight, Tag } from 'lucide-react'
import { HiArrowLongLeft, HiArrowLongRight } from 'react-icons/hi2'
import { useStore } from '@/context/StoreContext'
import { formatPrice, formatPromoLabel, promoDiscount, promoShipping } from '@/lib/utils'
import { authApi, catalogApi, clearAuthSession, loadRazorpayScript, orderApi, paymentApi, userApi } from '@/lib/api'
import { INDIAN_STATES, normalizeIndianPhone, validateAddress } from '@/lib/validation'
import toast from 'react-hot-toast'

export default function CheckoutPage() {
  const router = useRouter()
  const { cart, hydrated, cartTotal, clearCart, appliedPromo, setAppliedPromo } = useStore()
  const [step, setStep]   = useState(1)
  const [addresses, setAddresses] = useState([])
  const [selAddr, setSelAddr] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm]   = useState({ fullName:'',phone:'',addressLine1:'',addressLine2:'',city:'',state:'',pincode:'',label:'Home' })
  const [promoInput, setPromoInput] = useState('')
  const [promoMsg, setPromoMsg] = useState({ text: '', ok: false })
  const [availablePromos, setAvailablePromos] = useState([])
  const [payMethod, setPayMethod] = useState('razorpay')
  const [errors, setErrors] = useState({})
  const [processing, setProcessing] = useState(false)
  const [orderRedirecting, setOrderRedirecting] = useState(false)
  const [authReady, setAuthReady] = useState(false)
  const [signedIn, setSignedIn] = useState(false)

  const discount = promoDiscount(appliedPromo, cartTotal)
  const shipping = promoShipping(appliedPromo, cartTotal)
  const total    = cartTotal - discount + shipping

  const fc = (f,v) => { setForm(p => ({...p,[f]:v})); setErrors(p=>({...p,[f]:undefined})) }

  useEffect(() => {
    Promise.all([
      authApi.me(),
      userApi.addresses().catch(() => [])
    ]).then(([user, list]) => {
      setSignedIn(true)
      setAddresses(list)
      setSelAddr(list.find(a => a.isDefault) || list[0] || null)
      setForm(current => ({
        ...current,
        fullName: current.fullName || user.name || '',
        phone: current.phone || user.phone || ''
      }))
    }).catch(() => {
      setSignedIn(false)
    }).finally(() => {
      setAuthReady(true)
    })
  }, [])

  useEffect(() => {
    catalogApi.promos()
      .then(data => setAvailablePromos(Array.isArray(data) ? data : []))
      .catch(() => setAvailablePromos([]))
  }, [])

  const requireSignedIn = () => {
    if (!signedIn) {
      router.push('/login?next=/checkout')
      return false
    }
    return true
  }

  const saveAddress = async () => {
    if (!requireSignedIn()) return
    const nextErrors = validateAddress(form)
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length) { toast.error('Please fix the address fields'); return }
    try {
      const saved = await userApi.createAddress({ ...form, phone: normalizeIndianPhone(form.phone), isDefault: addresses.length === 0 })
      setAddresses(a => [...a, saved])
      setSelAddr(saved)
      setShowForm(false)
      toast.success('Address saved')
    } catch (error) {
      if (/unauthorized|token|auth/i.test(error.message || '')) {
        clearAuthSession()
        router.push('/login?next=/checkout')
        return
      }
      toast.error(error.message || 'Address could not be saved')
    }
  }

  const applyPromo = async (codeOverride = '') => {
    if (!requireSignedIn()) return
    const code = String(codeOverride || promoInput).trim().toUpperCase()
    if (!code) {
      setPromoMsg({ text: 'Enter a coupon code first.', ok: false })
      return
    }
    try {
      const promo = await orderApi.validatePromo({ code, cartTotal })
      setAppliedPromo(promo)
      setPromoInput(promo.code || code)
      setPromoMsg({ text: promo.desc || 'Coupon applied', ok: true })
      toast.success('Coupon applied')
    } catch (error) {
      setAppliedPromo(null)
      setPromoMsg({ text: error.message || 'Invalid or expired coupon.', ok: false })
    }
  }

  const createOrder = () => {
    const items = Object.values(cart.reduce((acc, item) => {
      const key = `${item.product.id}|${item.variant.id}`
      acc[key] = acc[key]
        ? { ...acc[key], quantity: acc[key].quantity + item.qty }
        : { productId: item.product.id, productSlug: item.product.slug, variantId: item.variant.id, quantity: item.qty }
      return acc
    }, {}))
    return orderApi.create({
      addressId: selAddr?.id,
      address: selAddr ? undefined : { ...form, phone: normalizeIndianPhone(form.phone) },
      paymentMethod: payMethod,
      promoCode: appliedPromo?.code,
      items
    })
  }

  const continueToReview = () => {
    if (!requireSignedIn()) return
    if (!selAddr) {
      toast.error('Select or save a delivery address')
      setShowForm(true)
      return
    }
    setStep(2)
  }

  const finishPurchase = async () => {
    if (!requireSignedIn()) return
    if (!selAddr) { toast.error('Select a delivery address'); setStep(1); return }
    if (!['razorpay', 'cod'].includes(payMethod)) { toast.error('Select a payment method'); return }
    setProcessing(true)
    try {
      const order = await createOrder()
      if (payMethod === 'cod') {
        setOrderRedirecting(true)
        clearCart()
        router.push(`/confirm?order=${order.order_number || order.orderNumber || order.id}`)
        return
      }
      const scriptReady = await loadRazorpayScript()
      if (!scriptReady) throw new Error('Razorpay checkout could not be loaded')
      const normalizedOrderId = String(order?.id || order?.order_number || order?.orderNumber || '').trim()
      const normalizedAmount = Math.round((Number(order?.total ?? 0) || 0) * 100)
      if (!normalizedOrderId || !Number.isFinite(normalizedAmount) || normalizedAmount <= 0) {
        throw new Error('Unable to start Razorpay because the order details are incomplete')
      }
      const paymentOrder = await paymentApi.createOrder({ orderId: normalizedOrderId, amount: normalizedAmount })
      const razorpay = new window.Razorpay({
        key: paymentOrder.keyId,
        amount: paymentOrder.razorpayOrder.amount,
        currency: 'INR',
        name: 'Aarvya',
        description: `Order ${order.order_number || order.orderNumber}`,
        order_id: paymentOrder.razorpayOrder.id,
        prefill: { name: selAddr.fullName, contact: selAddr.phone },
        theme: { color: '#f97316' },
        handler: async (response) => {
          try {
            await paymentApi.verify({
              orderId: order.id,
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            })
            setOrderRedirecting(true)
            clearCart()
            router.push(`/confirm?order=${order.order_number || order.orderNumber || order.id}`)
          } catch (error) {
            toast.error(error.message || 'Payment could not be verified')
            setProcessing(false)
          }
        },
        modal: { ondismiss: () => setProcessing(false) },
      })
      razorpay.on('payment.failed', (response) => {
        toast.error(response.error?.description || 'Payment failed')
        setProcessing(false)
      })
      razorpay.open()
    } catch (error) {
      toast.error(error.message || 'Payment could not be started')
      setOrderRedirecting(false)
      setProcessing(false)
    }
  }

  if (!hydrated || !authReady || orderRedirecting) return (
    <div className="max-w-[1360px] mx-auto px-4 md:px-6 py-10">
      <div className="mb-8 h-12 w-64 animate-pulse rounded-lg bg-surface-alt" />
      <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1fr_360px]">
        <div className="h-96 animate-pulse rounded-2xl bg-surface-alt" />
        <div className="h-80 animate-pulse rounded-2xl bg-surface-alt" />
      </div>
      {orderRedirecting && <p className="mt-6 text-center text-sm font-semibold text-ink-muted">Confirming your order...</p>}
    </div>
  )

  if (authReady && !signedIn) return (
    <div className="max-w-[520px] mx-auto px-6 py-20 text-center">
      <h1 className="font-display text-5xl font-bold mb-3">SIGN IN TO CHECKOUT</h1>
      <p className="text-ink-muted mb-7">Secure checkout, saved addresses, and payment history require an account.</p>
      <Link href="/login?next=/checkout" className="inline-flex rounded-xl bg-primary px-8 py-3.5 text-[13px] font-bold text-white shadow-lg shadow-primary/25 hover:bg-primary-dark">Sign In</Link>
    </div>
  )

  if (cart.length === 0) return (
    <div className="max-w-[600px] mx-auto px-6 py-20 text-center">
      <p className="text-ink-muted mb-4">Your cart is empty.</p>
      <Link href="/plp" className="text-primary font-semibold hover:underline">Browse products</Link>
    </div>
  )

  const STEPS = ['Address','Review','Payment']

  return (
    <div className="max-w-[1360px] mx-auto px-4 md:px-6 py-10">
      <Link href="/cart" className="group text-[13px] text-primary font-semibold hover:underline inline-flex items-center gap-2 mb-6">
        <HiArrowLongLeft className="text-base shrink-0 transition-transform group-hover:-translate-x-0.5" aria-hidden />
        Back to Cart
      </Link>
      <h1 className="font-display text-5xl font-bold tracking-wide mb-8">CHECKOUT</h1>

      {/* Step bar */}
      <div className="flex items-center gap-0 mb-10 border-b border-line pb-5">
        {STEPS.map((label,i)=>{
          const n=i+1, done=n<step, active=n===step
          return (
            <div key={label} className="flex items-center">
              <div className={`flex items-center gap-2.5 text-[13px] font-semibold ${active?'text-primary':done?'text-green-600':'text-ink-faint'}`}>
                <span className={`w-7 h-7 rounded-full flex items-center justify-center text-[12px] font-bold border-2 ${active?'border-primary bg-primary text-white':done?'border-green-600 bg-green-600 text-white':'border-line'}`}>
                  {done?<Check size={12}/>:n}
                </span>
                {label}
              </div>
              {i<STEPS.length-1 && <ChevronRight size={16} className="text-ink-faint mx-3"/>}
            </div>
          )
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-10">
        {/* Left */}
        <div>

          {/* STEP 1 */}
          {step===1 && (
            <div>
              <h3 className="font-semibold text-[15px] mb-4">Select Delivery Address</h3>
              <div className="flex flex-col gap-3 mb-5">
                {addresses.map(a=>(
                  <div key={a.id} onClick={()=>setSelAddr(a)}
                    className={`border-2 rounded-xl p-5 cursor-pointer transition-all ${selAddr?.id===a.id?'border-primary bg-primary/5':'border-line hover:border-line-dark'}`}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-[12px] font-bold uppercase tracking-wide">{a.label}</span>
                        {a.isDefault && <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-semibold">Default</span>}
                      </div>
                      {selAddr?.id===a.id && <span className="text-[11px] bg-primary text-white px-2.5 py-0.5 rounded-full font-semibold">Selected</span>}
                    </div>
                    <p className="text-[13px] text-ink-muted leading-relaxed">
                      {a.fullName} · {a.phone}<br/>{a.addressLine1}, {a.addressLine2}<br/>{a.city}, {a.state} — {a.pincode}
                    </p>
                  </div>
                ))}
              </div>
              <button onClick={()=>setShowForm(!showForm)} className="text-[13px] text-primary font-semibold hover:underline mb-5 flex items-center gap-1">
                {showForm?'− Close form':'+ Add New Address'}
              </button>
              {showForm && (
                <div className="border border-line rounded-2xl p-5 mb-6">
                  <p className="font-semibold text-[14px] mb-4">New Address</p>
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    {[['Full Name','fullName','Recipient name'],['Phone','phone','+91 XXXXX XXXXX']].map(([l,f,ph])=>(
                      <div key={f}><label className="text-[11px] uppercase tracking-[0.1em] text-ink-muted font-medium block mb-1">{l}</label>
                        <input value={form[f]} onChange={e=>fc(f,e.target.value)} placeholder={ph} className={`w-full bg-surface-alt border text-[13px] px-3.5 py-2.5 rounded-xl outline-none focus:border-primary/60 transition-colors ${errors[f]?'border-red-300':'border-line'}`}/>
                        {errors[f] && <p className="mt-1 text-xs text-red-500">{errors[f]}</p>}
                      </div>
                    ))}
                  </div>
                  {[['Address Line 1','addressLine1','Flat / Building / Street'],['Address Line 2','addressLine2','Area / Locality']].map(([l,f,ph])=>(
                    <div key={f} className="mb-3"><label className="text-[11px] uppercase tracking-[0.1em] text-ink-muted font-medium block mb-1">{l}</label>
                      <input value={form[f]} onChange={e=>fc(f,e.target.value)} placeholder={ph} className={`w-full bg-surface-alt border text-[13px] px-3.5 py-2.5 rounded-xl outline-none focus:border-primary/60 transition-colors ${errors[f]?'border-red-300':'border-line'}`}/>
                      {errors[f] && <p className="mt-1 text-xs text-red-500">{errors[f]}</p>}
                    </div>
                  ))}
                  <div className="grid grid-cols-3 gap-3 mb-4">
                    {[['City','city','City'],['PIN','pincode','6-digit PIN']].map(([l,f,ph])=>(
                      <div key={f}><label className="text-[11px] uppercase tracking-[0.1em] text-ink-muted font-medium block mb-1">{l}</label>
                        <input value={form[f]} onChange={e=>fc(f,e.target.value)} placeholder={ph} className={`w-full bg-surface-alt border text-[13px] px-3.5 py-2.5 rounded-xl outline-none focus:border-primary/60 transition-colors ${errors[f]?'border-red-300':'border-line'}`}/>
                        {errors[f] && <p className="mt-1 text-xs text-red-500">{errors[f]}</p>}
                      </div>
                    ))}
                    <div><label className="text-[11px] uppercase tracking-[0.1em] text-ink-muted font-medium block mb-1">State</label>
                      <select value={form.state} onChange={e=>fc('state',e.target.value)} className={`w-full bg-surface-alt border text-[13px] px-3.5 py-2.5 rounded-xl outline-none focus:border-primary/60 transition-colors ${errors.state?'border-red-300':'border-line'}`}>
                        <option value="">Select state</option>
                        {INDIAN_STATES.map(state => <option key={state} value={state}>{state}</option>)}
                      </select>
                      {errors.state && <p className="mt-1 text-xs text-red-500">{errors.state}</p>}
                    </div>
                  </div>
                  <button onClick={saveAddress} className="bg-primary text-white px-6 py-2.5 text-[13px] font-semibold rounded-xl hover:bg-primary-dark transition-colors">Save Address</button>
                </div>
              )}
              <button type="button" onClick={continueToReview} className="group flex w-full items-center justify-center gap-2 py-4 bg-primary hover:bg-primary-dark text-white font-bold text-[14px] rounded-xl transition-all shadow-lg shadow-primary/25">
                Continue to Review
                <HiArrowLongRight className="text-lg shrink-0 transition-transform group-hover:translate-x-0.5" aria-hidden />
              </button>
            </div>
          )}

          {/* STEP 2 */}
          {step===2 && (
            <div>
              <h3 className="font-semibold text-[15px] mb-4">Review Your Order</h3>
              <div className="border border-line rounded-2xl overflow-hidden mb-5">
                {cart.map(item=>(
                  <div key={item.key} className="flex gap-4 p-4 border-b border-line last:border-0">
                    <div className="relative w-16 h-20 bg-surface-alt rounded-xl overflow-hidden flex-shrink-0">
                      <Image src={item.product.images[0]} alt={item.product.name} fill sizes="64px" className="object-cover"/>
                    </div>
                    <div className="flex-1">
                      <p className="text-[11px] text-ink-faint uppercase tracking-wide">{item.product.brand}</p>
                      <p className="text-[14px] font-semibold text-ink">{item.product.name}</p>
                      <p className="text-[12px] text-ink-muted">{item.variant.quantity} {item.variant.unit} · Qty: {item.qty}</p>
                    </div>
                    <p className="font-bold text-[15px] flex-shrink-0">{formatPrice(item.variant.sellingPrice*item.qty)}</p>
                  </div>
                ))}
              </div>
              <div className="bg-surface-alt border border-line rounded-xl p-4 mb-6">
                <p className="text-[11px] uppercase tracking-[0.12em] text-ink-muted mb-1.5 font-semibold">Delivering to</p>
                <p className="text-[14px] text-ink leading-relaxed">{selAddr?.fullName} — {selAddr?.addressLine1}, {selAddr?.city}, {selAddr?.state} {selAddr?.pincode}</p>
                <button onClick={()=>setStep(1)} className="text-[12px] text-primary font-semibold mt-1.5 hover:underline">Change</button>
              </div>
              <div className="flex gap-3">
                <button onClick={()=>setStep(1)} className="px-7 py-3.5 border-2 border-line text-ink-mid font-semibold text-[13px] rounded-xl hover:border-primary hover:text-primary transition-all">Back</button>
                <button type="button" onClick={()=>setStep(3)} className="group flex flex-1 items-center justify-center gap-2 py-3.5 bg-primary hover:bg-primary-dark text-white font-bold text-[14px] rounded-xl transition-all shadow-lg shadow-primary/25">
                  Proceed to Payment
                  <HiArrowLongRight className="text-lg shrink-0 transition-transform group-hover:translate-x-0.5" aria-hidden />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3 */}
          {step===3 && (
            <div>
              <h3 className="font-semibold text-[15px] mb-4">Select Payment Method</h3>
              <div className="flex flex-col gap-3 mb-6">
                {[
                  {id:'razorpay', label:'Razorpay Secure Checkout', desc:'Pay online with UPI, cards, net banking and wallets'},
                  {id:'cod', label:'Cash on Delivery', desc:'Pay in cash when the order is delivered'},
                ].map(m=>(
                  <label key={m.id} onClick={()=>setPayMethod(m.id)}
                    className={`flex items-center gap-4 border-2 rounded-xl p-4 cursor-pointer transition-all ${payMethod===m.id?'border-primary bg-primary/5':'border-line hover:border-line-dark'}`}>
                    <input type="radio" name="pay" checked={payMethod===m.id} readOnly className="accent-primary"/>
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-surface-alt text-[11px] font-bold text-primary">{m.id === 'cod' ? 'COD' : 'RZP'}</span>
                    <span>
                      <span className="block text-[14px] font-semibold text-ink-mid">{m.label}</span>
                      <span className="block text-[12px] text-ink-faint">{m.desc}</span>
                    </span>
                  </label>
                ))}
              </div>
              <div className="bg-green-50 border border-green-200 rounded-xl p-3.5 flex items-center gap-3 mb-6">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100 text-[11px] font-bold text-green-700">SSL</span>
                <p className="text-[13px] text-green-700 font-medium">Your payment is 100% secure and encrypted.</p>
              </div>
              <div className="flex gap-3">
                <button onClick={()=>setStep(2)} className="px-7 py-3.5 border-2 border-line text-ink-mid font-semibold text-[13px] rounded-xl hover:border-primary hover:text-primary transition-all">Back</button>
                <button type="button" disabled={processing} onClick={finishPurchase} className="group flex flex-1 items-center justify-center gap-2 py-3.5 bg-primary hover:bg-primary-dark text-white font-bold text-[14px] rounded-xl transition-all shadow-lg shadow-primary/25 disabled:opacity-60">
                  {processing ? 'Processing...' : payMethod === 'cod' ? `Place Order ${formatPrice(total)}` : `Pay ${formatPrice(total)}`}
                  <HiArrowLongRight className="text-lg shrink-0 transition-transform group-hover:translate-x-0.5" aria-hidden />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right summary */}
        <div>
          <div className="bg-surface-alt border border-line rounded-2xl p-6 sticky top-20">
            <h2 className="font-display text-2xl font-bold mb-5">ORDER</h2>
            <div className="space-y-3 mb-5 pb-5 border-b border-line">
              {cart.map(item=>(
                <div key={item.key} className="flex items-center gap-3">
                  <div className="relative w-12 h-14 bg-surface-raised rounded-lg overflow-hidden flex-shrink-0">
                    <Image src={item.product.images[0]} alt={item.product.name} fill sizes="48px" className="object-cover"/>
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-primary rounded-full text-[9px] text-white flex items-center justify-center font-bold">{item.qty}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-medium text-ink truncate">{item.product.name}</p>
                    <p className="text-[11px] text-ink-faint">{item.variant.quantity} {item.variant.unit}</p>
                  </div>
                  <p className="text-[13px] font-bold flex-shrink-0">{formatPrice(item.variant.sellingPrice*item.qty)}</p>
                </div>
              ))}
            </div>
            <div className="space-y-2.5 text-[14px]">
              <div className="flex justify-between text-ink-muted"><span>Subtotal</span><span>{formatPrice(cartTotal)}</span></div>
              {discount > 0 && (
                <div className="flex justify-between text-green-600 font-medium">
                  <span>Promo ({appliedPromo?.code})</span><span>-{formatPrice(discount)}</span>
                </div>
              )}
              <div className="flex justify-between text-ink-muted"><span>Shipping</span><span className={shipping===0?'text-green-600 font-medium':''}>{shipping===0?'FREE':formatPrice(shipping)}</span></div>
              <div className="flex justify-between text-[17px] font-bold text-ink pt-3 border-t border-line"><span>Total</span><span>{formatPrice(total)}</span></div>
            </div>
            {appliedPromo ? (
              <div className="mb-5 flex items-center justify-between rounded-xl border border-green-200 bg-green-50 px-3.5 py-2.5">
                <p className="flex items-center gap-2 text-[13px] font-medium text-green-700"><Tag size={14}/>{appliedPromo.desc || appliedPromo.code}</p>
                <button onClick={() => { setAppliedPromo(null); setPromoMsg({ text: '', ok: false }); setPromoInput('') }} className="text-lg text-green-600 transition-colors hover:text-red-500">x</button>
              </div>
            ) : (
              <div className="mb-5">
                <div className="flex gap-2">
                  <input
                    value={promoInput}
                    onChange={e => setPromoInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && applyPromo()}
                    placeholder="Enter coupon code"
                    className="flex-1 rounded-xl border border-line bg-white px-3.5 py-2.5 text-[13px] uppercase outline-none transition-colors placeholder:normal-case placeholder:text-ink-faint focus:border-primary/60"
                  />
                  <button onClick={() => applyPromo()} className="rounded-xl bg-ink px-4 text-[12px] font-semibold text-white transition-colors hover:bg-primary">
                    Apply
                  </button>
                </div>
                {promoMsg.text && <p className={`mt-1.5 text-[12px] ${promoMsg.ok ? 'text-green-600' : 'text-red-500'}`}>{promoMsg.text}</p>}
                {availablePromos.length > 0 && (
                  <div className="mt-3">
                    <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-muted">Available coupons</p>
                    <div className="flex flex-wrap gap-2">
                      {availablePromos.map(promo => (
                        <button
                          key={promo.code}
                          type="button"
                          onClick={() => applyPromo(promo.code)}
                          className="rounded-full border border-line bg-white px-3 py-1.5 text-[11px] font-bold text-ink-mid hover:border-primary hover:text-primary"
                        >
                          {formatPromoLabel(promo)}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
