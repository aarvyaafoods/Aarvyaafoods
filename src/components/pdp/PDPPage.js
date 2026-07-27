'use client'
import { useState, useEffect, useRef, useCallback, useMemo, Suspense } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { ChevronLeft, ChevronRight, Star, Truck, RefreshCw, ShieldCheck, X } from 'lucide-react'
import { catalogApi } from '@/lib/api'
import { useStore } from '@/context/StoreContext'
import { formatPrice } from '@/lib/utils'
import Breadcrumb from '@/components/ui/Breadcrumb'
import ProductCard from '@/components/ui/ProductCard'


const clamp = (value, min, max) => Math.min(max, Math.max(min, value))
const TAG_CYCLE_MS = 3200
const getTouchDistance = (touches) => {
  const [a, b] = touches
  return Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY)
}

function highResImage(src) {
  if (!src) return ''
  if (src.includes('images.unsplash.com')) {
    return src.replace(/([?&])w=\d+/i, '$1w=1800').replace(/([?&])q=\d+/i, '$1q=90')
  }
  return src
}


function getProductTags(product) {
  const tags = [
    ...(Array.isArray(product.tags) ? product.tags : []),
    product.offerTag,
    product.tag,
  ]
    .filter(Boolean)
    .map((tag) => String(tag).trim())
    .filter(Boolean)

  return [...new Set(tags)]
}

function ProductGallery({ product, mainImg, setMainImg, isOOS }) {
  const [zoom, setZoom] = useState({ active: false, x: 50, y: 50 })
  const [viewerOpen, setViewerOpen] = useState(false)
  const [tagIdx, setTagIdx] = useState(0)
  const swipeRef = useRef({ active: false, startX: 0, startY: 0, didSwipe: false })
  const productTags = useMemo(() => getProductTags(product), [product])

  const isFinePointer = () =>
    typeof window !== 'undefined' &&
    window.matchMedia('(min-width: 768px) and (hover: hover) and (pointer: fine)').matches

  const openViewer = () => {
    if (swipeRef.current.didSwipe) {
      swipeRef.current.didSwipe = false
      return
    }
    if (!isFinePointer()) setViewerOpen(true)
  }

  const goToImage = useCallback((index) => {
    if (product.images.length <= 1) return
    setMainImg((index + product.images.length) % product.images.length)
  }, [product.images.length, setMainImg])

  useEffect(() => {
    setTagIdx(0)
    if (productTags.length <= 1) return undefined

    const timer = setInterval(() => {
      setTagIdx((i) => (i + 1) % productTags.length)
    }, TAG_CYCLE_MS)

    return () => clearInterval(timer)
  }, [productTags.length])

  const handleMouseMove = (event) => {
    if (!isFinePointer()) return
    const rect = event.currentTarget.getBoundingClientRect()
    setZoom({
      active: true,
      x: clamp(((event.clientX - rect.left) / rect.width) * 100, 0, 100),
      y: clamp(((event.clientY - rect.top) / rect.height) * 100, 0, 100),
    })
  }

  const handleTouchStart = (event) => {
    if (event.touches.length !== 1 || product.images.length <= 1) return
    const touch = event.touches[0]
    swipeRef.current = {
      active: true,
      startX: touch.clientX,
      startY: touch.clientY,
      didSwipe: false,
    }
  }

  const handleTouchMove = (event) => {
    if (!swipeRef.current.active || event.touches.length !== 1) return
    const touch = event.touches[0]
    const dx = touch.clientX - swipeRef.current.startX
    const dy = touch.clientY - swipeRef.current.startY

    if (Math.abs(dx) > 18 && Math.abs(dx) > Math.abs(dy) * 1.25) {
      event.preventDefault()
    }
  }

  const handleTouchEnd = (event) => {
    if (!swipeRef.current.active) return
    const touch = event.changedTouches[0]
    const dx = touch.clientX - swipeRef.current.startX
    const dy = touch.clientY - swipeRef.current.startY
    swipeRef.current.active = false

    if (Math.abs(dx) > 55 && Math.abs(dx) > Math.abs(dy) * 1.25) {
      swipeRef.current.didSwipe = true
      goToImage(mainImg + (dx < 0 ? 1 : -1))
    }
  }

  return (
    <>
      <div
        className="group/gallery relative mb-3 aspect-[3/4] cursor-zoom-in overflow-hidden rounded-2xl bg-surface-alt shadow-card md:cursor-crosshair"
        onClick={openViewer}
        onMouseEnter={() => isFinePointer() && setZoom((z) => ({ ...z, active: true }))}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setZoom((z) => ({ ...z, active: false }))}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <Image
          src={product.images[mainImg]}
          alt={product.name}
          fill
          priority
          sizes="(max-width:768px)100vw,50vw"
          className="object-cover transition-transform duration-500 ease-out md:group-hover/gallery:scale-[1.015]"
        />

        <div
          aria-hidden="true"
          className={`pointer-events-none absolute inset-0 z-10 hidden bg-no-repeat opacity-0 transition-opacity duration-200 ease-out md:block ${zoom.active ? 'opacity-100' : ''}`}
          style={{
            backgroundImage: `url(${highResImage(product.images[mainImg])})`,
            backgroundPosition: `${zoom.x}% ${zoom.y}%`,
            backgroundSize: '230%',
          }}
        />

        {isOOS && (
          <div className="absolute inset-0 z-30 flex items-center justify-center bg-white/75">
            <span className="rounded-full border border-line bg-white px-6 py-2 text-[13px] font-semibold text-ink-mid shadow">Out of Stock</span>
          </div>
        )}
        {productTags.length > 0 && (
          <div className="absolute left-4 top-4 z-30 h-[38px] max-w-[calc(100%-2rem)] overflow-hidden pointer-events-none">
            <span
              key={productTags[tagIdx]}
              className={`${productTags.length > 1 ? 'product-card-tag-slide' : ''} inline-flex max-w-full items-center rounded-md bg-white px-3 py-2 text-[11px] font-extrabold uppercase leading-none tracking-normal text-green-700 shadow-[0_2px_10px_rgba(0,0,0,0.12)] ring-1 ring-black/5 sm:text-xs`}
            >
              <span className="truncate">{productTags[tagIdx]}</span>
            </span>
          </div>
        )}

        {product.images.length > 1 && (
          <div className="absolute bottom-4 left-0 right-0 z-30 flex justify-center gap-1.5 md:hidden" aria-label={`Image ${mainImg + 1} of ${product.images.length}`}>
            {product.images.map((_, i) => (
              <span
                key={i}
                className={`h-1.5 rounded-full shadow-sm transition-all duration-300 ${
                  i === mainImg ? 'w-6 bg-white' : 'w-1.5 bg-white/60'
                }`}
              />
            ))}
          </div>
        )}
      </div>

      {product.images.length > 1 && (
        <div className="flex gap-2.5">
          {product.images.map((img, i) => (
            <button key={i} onClick={() => setMainImg(i)} aria-label={`View ${i+1}`}
              className={`relative h-[88px] w-[72px] overflow-hidden rounded-xl border-2 bg-surface-alt transition-all ${mainImg===i?'border-primary':'border-transparent hover:border-line-dark'}`}>
              <Image src={img} alt="" fill sizes="72px" className="object-cover"/>
            </button>
          ))}
        </div>
      )}

      {viewerOpen && (
        <MobileImageViewer
          images={product.images}
          productName={product.name}
          index={mainImg}
          setIndex={setMainImg}
          onClose={() => setViewerOpen(false)}
        />
      )}
    </>
  )
}

function MobileImageViewer({ images, productName, index, setIndex, onClose }) {
  const [scale, setScale] = useState(1)
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const [closing, setClosing] = useState(false)
  const gesture = useRef({})
  const lastTap = useRef(0)

  const resetZoom = useCallback(() => {
    setScale(1)
    setOffset({ x: 0, y: 0 })
  }, [])

  const close = useCallback(() => {
    setClosing(true)
    window.setTimeout(onClose, 180)
  }, [onClose])

  const goTo = useCallback((nextIndex) => {
    setIndex((nextIndex + images.length) % images.length)
    resetZoom()
  }, [images.length, resetZoom, setIndex])

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  useEffect(() => {
    const handleKey = (event) => {
      if (event.key === 'Escape') close()
      if (event.key === 'ArrowLeft') goTo(index - 1)
      if (event.key === 'ArrowRight') goTo(index + 1)
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [close, goTo, index])

  const handleTouchStart = (event) => {
    if (event.touches.length === 2) {
      gesture.current = {
        mode: 'pinch',
        startDistance: getTouchDistance(event.touches),
        startScale: scale,
      }
      return
    }

    const touch = event.touches[0]
    gesture.current = {
      mode: scale > 1 ? 'pan' : 'swipe',
      startX: touch.clientX,
      startY: touch.clientY,
      startOffset: offset,
    }
  }

  const handleTouchMove = (event) => {
    if (event.touches.length === 2 && gesture.current.mode === 'pinch') {
      event.preventDefault()
      const nextScale = clamp((getTouchDistance(event.touches) / gesture.current.startDistance) * gesture.current.startScale, 1, 4)
      setScale(nextScale)
      if (nextScale === 1) setOffset({ x: 0, y: 0 })
      return
    }

    if (event.touches.length !== 1) return
    const touch = event.touches[0]
    const dx = touch.clientX - gesture.current.startX
    const dy = touch.clientY - gesture.current.startY

    if (gesture.current.mode === 'pan') {
      event.preventDefault()
      const limit = 130 * scale
      setOffset({
        x: clamp(gesture.current.startOffset.x + dx, -limit, limit),
        y: clamp(gesture.current.startOffset.y + dy, -limit, limit),
      })
    }
  }

  const handleTouchEnd = (event) => {
    const now = Date.now()
    const wasDoubleTap = now - lastTap.current < 280
    const dx = (event.changedTouches[0]?.clientX || 0) - (gesture.current.startX || 0)
    const dy = (event.changedTouches[0]?.clientY || 0) - (gesture.current.startY || 0)

    if (wasDoubleTap && Math.abs(dx) < 28 && Math.abs(dy) < 28) {
      if (scale > 1) resetZoom()
      else setScale(2.5)
      lastTap.current = 0
      return
    }

    lastTap.current = now
    if (gesture.current.mode === 'swipe' && Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy)) {
      goTo(index + (dx < 0 ? 1 : -1))
    }
  }

  return (
    <div
      className={`fixed inset-0 z-[9999] flex touch-none flex-col bg-black transition-opacity duration-200 ${closing ? 'opacity-0' : 'opacity-100'}`}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div className="absolute right-4 top-4 z-20">
        <button onClick={close} aria-label="Close image viewer" className="flex h-11 w-11 items-center justify-center rounded-full bg-white/[0.12] text-white backdrop-blur-md transition-colors hover:bg-white/20">
          <X size={22} />
        </button>
      </div>

      {images.length > 1 && (
        <>
          <button onClick={() => goTo(index - 1)} aria-label="Previous image" className="absolute left-3 top-1/2 z-20 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/[0.12] text-white backdrop-blur-md sm:flex">
            <ChevronLeft size={24} />
          </button>
          <button onClick={() => goTo(index + 1)} aria-label="Next image" className="absolute right-3 top-1/2 z-20 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/[0.12] text-white backdrop-blur-md sm:flex">
            <ChevronRight size={24} />
          </button>
        </>
      )}

      <div className="relative flex flex-1 items-center justify-center overflow-hidden">
        <Image
          src={images[index]}
          alt={productName}
          fill
          sizes="100vw"
          className="object-contain transition-transform duration-200 ease-out"
          style={{ transform: `translate3d(${offset.x}px, ${offset.y}px, 0) scale(${scale})` }}
          priority
        />
      </div>

      {images.length > 1 && (
        <div className="absolute bottom-6 left-0 right-0 z-20 flex justify-center gap-2">
          {images.map((_, i) => (
            <button key={i} onClick={() => goTo(i)} aria-label={`View image ${i + 1}`} className={`h-1.5 rounded-full transition-all ${i === index ? 'w-6 bg-white' : 'w-1.5 bg-white/45'}`} />
          ))}
        </div>
      )}
    </div>
  )
}

function PDPContent() {
  const sp = useSearchParams()
  const id = sp?.get?.('id')
  const { addToCart } = useStore()
  const [product, setProduct] = useState(null)
  const [related, setRelated] = useState([])

  const [selectedVariant, setSelectedVariant] = useState(null)
  const [qty,      setQty]      = useState(1)
  const [mainImg,  setMainImg]  = useState(0)
  const [tab,      setTab]      = useState('desc')

  const isOOS     = !product || product.stock === 0
  const variantStock = selectedVariant?.stock || 0

  useEffect(() => {
    if (!id) return
    catalogApi.product(id).then(setProduct).catch(() => setProduct(null))
  }, [id])

  useEffect(() => {
    if (!product) return
    setSelectedVariant(product.variants?.find(variant => variant.stock > 0) || product.variants?.[0] || null)
    setQty(1)
    setMainImg(0)
    catalogApi.products({ category: product.category, limit: 6 }).then(data => {
      setRelated((data.items || []).filter(p => p.id !== product.id))
    }).catch(() => setRelated([]))
  }, [product])

  const handleCart = () => { if (isOOS || variantStock === 0) return; addToCart(product, selectedVariant, qty) }

  if (!product) return <div className="py-20 text-center text-ink-muted">Loading product...</div>
  const ph = product
  const highlights = [
    ['Ingredients', ph.ingredients], ['Shelf Life', ph.shelfLife], ['Storage Instructions', ph.storageInstructions], ['FSSAI License Number', ph.fssaiLicenseNumber], ['Veg / Non-Veg', ph.vegNonVeg], ['Organic', ph.organic == null ? null : ph.organic ? 'Yes' : 'No'], ['Best Before', ph.bestBefore], ['Allergen Information', ph.allergenInformation], ['Spice Level', ph.spiceLevel], ['Sweetness Level', ph.sweetnessLevel],
  ].filter(([, value]) => value)

  const crumbs = [
    { label: 'Home', href: '/' },
    { label: product.category.charAt(0).toUpperCase() + product.category.slice(1), href: `/plp?category=${product.category}` },
    { label: product.name },
  ]

  return (
    <div className="max-w-[1360px] mx-auto px-4 md:px-6 pb-16">
      <Breadcrumb crumbs={crumbs} />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-14">
        {/* ── GALLERY ── */}
        <div className="md:sticky md:top-20 self-start">
          <ProductGallery product={product} mainImg={mainImg} setMainImg={setMainImg} isOOS={isOOS} />
        </div>

        {/* ── INFO ── */}
        <div>
          <p className="text-[11px] tracking-[0.2em] uppercase text-ink-faint font-medium mb-1">{product.brand}</p>
          <h1 className="font-display text-[clamp(24px,3.5vw,38px)] font-bold leading-tight text-ink mb-3">{product.name}</h1>

          {/* Rating */}
          <div className="flex items-center gap-2 mb-4">
            <div className="flex text-primary">
              {[1,2,3,4,5].map(n => <Star key={n} size={14} fill={n<=Math.round(product.rating)?'currentColor':'none'} strokeWidth={1.5}/>)}
            </div>
            <span className="text-[13px] text-ink-muted font-medium">{product.rating} · {product.reviews} reviews</span>
          </div>

          {/* Price */}
          <div className="flex items-baseline gap-3 mb-1">
            <span className="text-[30px] font-bold text-ink">{formatPrice(selectedVariant?.sellingPrice)}</span>
            <span className="text-[16px] text-ink-faint line-through">{formatPrice(selectedVariant?.mrp)}</span>
          </div>
          <p className="text-[12px] text-ink-faint mb-6">Inclusive of all taxes</p>

          {/* Quantity variant */}
          <div className="mb-5">
            <p className="mb-2.5 text-[12px] font-semibold uppercase tracking-[0.12em] text-ink-mid">Quantity{selectedVariant ? ` - ${selectedVariant.quantity} ${selectedVariant.unit}` : ''}</p>
            <div className="flex gap-2 flex-wrap">
              {(product.variants || []).map(s => (
                <button key={s.id} onClick={() => s.stock>0 && setSelectedVariant(s)} disabled={s.stock===0}
                  className={`min-w-[76px] min-h-14 px-3 py-2 rounded-xl text-[13px] font-semibold border-2 transition-all relative ${
                    s.stock===0 ? 'border-line text-ink-faint line-through cursor-not-allowed bg-surface-alt'
                    : selectedVariant?.id===s.id ? 'border-primary bg-primary text-white shadow-md'
                    : 'border-line text-ink-mid hover:border-primary hover:text-primary'
                  }`}>
                  <span className="block">{s.quantity} {s.unit}</span><span className="block text-[11px] font-medium opacity-80">{s.stock > 0 ? `${s.stock} in stock` : 'Out of stock'}</span>
                  {s.stock>0 && s.stock<=3 && <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"/>}
                </button>
              ))}
            </div>
            <p className={`mt-2 text-[12px] font-medium ${variantStock > 0 ? 'text-ink-muted' : 'text-red-500'}`}>{variantStock > 0 ? `${variantStock} available for ${selectedVariant?.quantity} ${selectedVariant?.unit}` : 'Selected variant is out of stock'}</p>
          </div>

          {/* Qty */}
          <div className="mb-6">
            <p className="text-[12px] uppercase tracking-[0.12em] font-semibold text-ink-mid mb-2.5">Quantity</p>
            <div className="inline-flex items-center border-2 border-line rounded-xl overflow-hidden">
              <button onClick={() => setQty(q => Math.max(1, q-1))} className="w-11 h-11 text-ink-mid hover:text-primary hover:bg-surface-alt transition-all text-xl font-light">−</button>
              <span className="w-12 h-11 flex items-center justify-center text-[15px] font-bold border-x-2 border-line">{qty}</span>
              <button onClick={() => setQty(q => Math.min(variantStock||99, q+1))} className="w-11 h-11 text-ink-mid hover:text-primary hover:bg-surface-alt transition-all text-xl font-light">+</button>
            </div>
          </div>

          {/* CTAs */}
          <div className="flex flex-col gap-3 mb-6">
            <button onClick={handleCart} disabled={isOOS||variantStock===0}
              className="w-full py-4 border-2 border-primary text-primary font-bold text-[13px] rounded-xl hover:bg-primary hover:text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-primary">
              {isOOS||variantStock===0 ? 'Out of Stock' : 'Add to Cart'}
            </button>
            <Link href="/checkout" onClick={() => !isOOS && handleCart()}
              className="w-full py-4 bg-primary hover:bg-primary-dark text-white font-bold text-[13px] rounded-xl transition-all text-center shadow-lg shadow-primary/30">
              Buy Now
            </Link>
          </div>

          {/* Notify me OOS */}
          {(isOOS || variantStock===0) && (
            <div className="mb-6 bg-surface-alt border border-line rounded-xl p-4">
              <p className="text-[13px] font-medium text-ink mb-1">Notify me when available</p>
              <div className="flex gap-2">
                <input type="email" placeholder="your@email.com"
                  className="flex-1 bg-white border border-line text-[13px] px-3.5 py-2.5 rounded-lg outline-none focus:border-primary/60 transition-colors"/>
                <button className="bg-primary text-white text-[12px] font-semibold px-4 rounded-lg hover:bg-primary-dark transition-colors whitespace-nowrap">Notify Me</button>
              </div>
            </div>
          )}

          {/* Meta */}
          {product.shippingDetails && <div className="flex flex-wrap gap-4 py-5 border-t border-b border-line text-[12px] text-ink-muted mb-6"><span className="flex items-center gap-1.5"><Truck size={15} className="text-primary"/>{product.shippingDetails}</span></div>}
          <div className={`flex flex-wrap gap-4 py-5 border-t border-b border-line text-[12px] text-ink-muted mb-6 ${product.shippingDetails ? 'hidden' : ''}`}>
            <span className="flex items-center gap-1.5"><Truck size={15} className="text-primary"/> Free delivery above ₹999</span>
            <span className="flex items-center gap-1.5"><RefreshCw size={15} className="text-primary"/> 30-day returns</span>
            <span className="flex items-center gap-1.5"><ShieldCheck size={15} className="text-primary"/> Authentic product</span>
          </div>

          {/* Key Highlights */}
          <div className="bg-surface-alt border border-line rounded-xl p-5 md:p-6 mb-6">
            <h2 className="text-[15px] font-bold uppercase tracking-wide text-ink mb-6">Key Highlights</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-6">
              {highlights.map(([label, value]) => (
                <div key={label} className="border-b border-line pb-3 last:border-b-0 sm:[&:nth-last-child(-n+2)]:border-b-0">
                  <p className="text-[14px] text-ink-muted mb-1">{label}</p>
                  <p className="text-[15px] font-semibold text-ink leading-snug">{value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Tabs */}
          <div className="border border-line rounded-xl overflow-hidden">
            <div className="flex border-b border-line">
              {[['desc','Description'],['care','Care'],['shipping','Shipping']].map(([id,label]) => (
                <button key={id} onClick={() => setTab(id)}
                  className={`flex-1 py-3 text-[12px] font-semibold transition-all ${tab===id?'bg-primary text-white':'text-ink-mid hover:text-primary hover:bg-surface-alt'}`}>
                  {label}
                </button>
              ))}
            </div>
            <div className="p-5 text-[14px] text-ink-mid leading-relaxed">
              {tab==='desc'     && <p>{product.description}<br/><br/><strong className="text-ink">Ingredients:</strong> {product.ingredients}</p>}
              {tab==='care'     && <p>{product.storageInstructions}</p>}
              {tab==='shipping' && product.shippingDetails && <p>{product.shippingDetails}</p>}
              {tab==='shipping' && !product.shippingDetails && <div className="space-y-2"><p>Standard: 3–5 business days (Free above ₹999)</p><p>Express: 1–2 business days (₹149)</p><p>Cash on delivery available</p><p>Easy 30-day returns from delivery date</p></div>}
            </div>
          </div>
        </div>
      </div>

      {/* Related products */}
      {related.length > 0 && (
        <section className="mt-16 border-t border-line pt-10">
          <h2 className="font-display text-[32px] font-bold tracking-wide mb-7">YOU MAY ALSO LIKE</h2>
          <div className="flex gap-5 overflow-x-auto no-scrollbar pb-2">
            {related.map(p => (
              <div key={p.id} className="flex-none w-[220px]"><ProductCard product={p}/></div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

export default function PDPPage() {
  return <Suspense fallback={<div className="py-20 text-center text-ink-muted">Loading product…</div>}><PDPContent/></Suspense>
}
