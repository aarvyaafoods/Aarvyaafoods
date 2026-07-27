'use client'
import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Star } from 'lucide-react'
import { useStore } from '@/context/StoreContext'
import { formatPrice } from '@/lib/utils'

const HOVER_DELAY_MS = 550
const CYCLE_MS = 1300
const TAG_CYCLE_MS = 3200

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

export default function ProductCard({ product }) {
  const { addToCart } = useStore()
  const isOOS = product.stock === 0
  const images = product.images?.length ? product.images : ['https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800&q=80']
  const defaultVariant = product.variants?.find(variant => variant.stock > 0) || product.variants?.[0]

  const [imgIdx, setImgIdx] = useState(0)
  const [tagIdx, setTagIdx] = useState(0)
  const hoverStartRef = useRef(null)
  const cycleRef = useRef(null)
  const nImg = images.length
  const multi = nImg > 1
  const productTags = useMemo(() => getProductTags(product), [product])

  const clearTimers = useCallback(() => {
    if (hoverStartRef.current) {
      clearTimeout(hoverStartRef.current)
      hoverStartRef.current = null
    }
    if (cycleRef.current) {
      clearInterval(cycleRef.current)
      cycleRef.current = null
    }
  }, [])

  const onImgEnter = useCallback(() => {
    if (!multi || isOOS) return
    clearTimers()
    hoverStartRef.current = setTimeout(() => {
      hoverStartRef.current = null
      cycleRef.current = setInterval(() => {
        setImgIdx((i) => (i + 1) % nImg)
      }, CYCLE_MS)
    }, HOVER_DELAY_MS)
  }, [clearTimers, multi, isOOS, nImg])

  const onImgLeave = useCallback(() => {
    clearTimers()
    setImgIdx(0)
  }, [clearTimers])

  useEffect(() => () => clearTimers(), [clearTimers])

  useEffect(() => {
    setTagIdx(0)
    if (productTags.length <= 1) return undefined

    const timer = setInterval(() => {
      setTagIdx((i) => (i + 1) % productTags.length)
    }, TAG_CYCLE_MS)

    return () => clearInterval(timer)
  }, [productTags.length])

  const onCart = (e) => {
    e.preventDefault()
    e.stopPropagation()
    addToCart(product, defaultVariant)
  }
  return (
    <Link
      href={`/pdp?id=${product.id}`}
      className="product-card group flex h-full flex-col bg-white rounded-xl overflow-hidden border border-line hover:shadow-hover transition-all duration-300"
    >
      <div
        className="relative aspect-[3/4] bg-surface-alt overflow-hidden"
        onMouseEnter={onImgEnter}
        onMouseLeave={onImgLeave}
      >
        {images.map((src, i) => (
          <Image
            key={src}
            src={src}
            alt={i === 0 ? product.name : ''}
            fill
            sizes="(max-width:640px)50vw,(max-width:1024px)33vw,25vw"
            className={`object-cover transition-[opacity,transform] duration-500 ease-out ${
              i === imgIdx ? 'opacity-100 z-[1]' : 'opacity-0 z-0 pointer-events-none'
            } ${!isOOS && i === imgIdx ? 'group-hover:scale-[1.03]' : ''}`}
          />
        ))}

        {multi && !isOOS && (
          <div className="absolute bottom-2 left-1/2 z-[5] flex -translate-x-1/2 gap-1 pointer-events-none">
            {images.map((_, i) => (
              <span
                key={i}
                className={`h-0.5 rounded-full transition-all duration-300 ${
                  i === imgIdx ? 'w-3 bg-white shadow-sm' : 'w-1 bg-white/50'
                }`}
              />
            ))}
          </div>
        )}

        {productTags.length > 0 && (
          <div className="absolute left-2 top-2 z-10 h-[34px] max-w-[calc(100%-1rem)] overflow-hidden pointer-events-none sm:left-3 sm:top-3 sm:h-[38px] sm:max-w-[calc(100%-1.5rem)]">
            <span
              key={productTags[tagIdx]}
              className={`${productTags.length > 1 ? 'product-card-tag-slide' : ''} inline-flex max-w-full items-center rounded-md bg-white px-2.5 py-1.5 text-[9px] font-extrabold uppercase leading-none tracking-normal text-green-700 shadow-[0_2px_10px_rgba(0,0,0,0.12)] ring-1 ring-black/5 sm:px-3 sm:py-2 sm:text-xs`}
            >
              <span className="truncate">{productTags[tagIdx]}</span>
            </span>
          </div>
        )}

        {(product.reviews !== undefined || product.colors?.length > 0) && (
          <div className="absolute bottom-3 left-2 right-2 z-10 flex items-center justify-between gap-1.5 sm:left-3 sm:right-3">
            {product.reviews !== undefined && (
              <div className="flex min-w-0 items-center gap-1 rounded-full bg-white/[0.92] px-2 py-1 shadow-sm backdrop-blur-sm sm:gap-1.5 sm:px-2.5">
                <Star size={13} fill={product.rating ? 'currentColor' : 'none'} strokeWidth={1.5} className="shrink-0 text-primary sm:size-3.5" />
                <span className="text-[11px] font-semibold leading-none text-ink sm:text-xs">{product.rating ? (Math.round(product.rating * 10) / 10).toFixed(1) : '0.0'}</span>
                <span className="hidden text-[11px] leading-none text-ink-faint min-[390px]:inline sm:text-xs">|</span>
                <span className="hidden truncate text-[11px] leading-none text-ink-faint min-[390px]:inline sm:text-xs">{product.reviews}</span>
              </div>
            )}

            {product.colors?.length > 0 && (
              <div className="flex shrink-0 items-center gap-1 rounded-full bg-white/[0.92] px-1.5 py-1 shadow-sm backdrop-blur-sm sm:gap-1.5 sm:px-2">
                <div className="flex -space-x-1.5">
                  {product.colors.slice(0, 3).map((c) => (
                    <span
                      key={`${c.name}-${c.hex}`}
                      title={c.name}
                      style={{ background: c.hex }}
                      className="h-3.5 w-3.5 rounded-full border border-ink/20 shadow-sm ring-1 ring-black/15 sm:h-4 sm:w-4"
                    />
                  ))}
                </div>
                {product.colors.length > 3 && (
                  <span className="text-[10px] font-semibold leading-none text-ink-muted sm:text-[11px]">+{product.colors.length - 3}</span>
                )}
              </div>
            )}
          </div>
        )}

        {isOOS && (
          <div className="absolute inset-0 bg-white/70 flex items-center justify-center z-10">
            <span className="bg-white text-ink-mid text-sm font-medium px-4 py-1.5 rounded-full border border-line shadow-sm">
              Out of Stock
            </span>
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col p-3 sm:p-4">
        <p className="mb-1 truncate text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-faint sm:text-xs sm:tracking-[0.16em]">{product.brand}</p>
        <div className="flex min-w-0 items-baseline gap-1 overflow-hidden whitespace-nowrap sm:gap-2">
          <span className="shrink-0 text-[10px] font-bold uppercase text-ink-faint sm:text-xs">From</span>
          <span className="shrink-0 text-[clamp(13px,3.7vw,17px)] font-bold leading-tight text-ink sm:text-lg">{formatPrice(product.sellPrice)}</span>
          <span className="shrink-0 text-[clamp(9px,2.7vw,12px)] leading-tight text-ink-faint line-through sm:text-sm">{formatPrice(product.mrp)}</span>
          <span className="shrink-0 text-[clamp(9px,2.5vw,11px)] font-bold uppercase leading-tight text-green-600 sm:text-xs">{product.off}% off</span>
        </div>
        <p className="mt-2 truncate text-[13px] leading-5 text-ink-muted sm:text-[14px] sm:leading-6">{product.description}</p>
      </div>

      {!isOOS && (
        <button
          onClick={onCart}
          className="mt-auto w-full border-t border-line bg-white px-3 py-3 text-center text-[13px] font-semibold tracking-wide text-ink transition-colors hover:bg-primary hover:text-white"
        >
          Add to Cart
        </button>
      )}
    </Link>
  )
}
