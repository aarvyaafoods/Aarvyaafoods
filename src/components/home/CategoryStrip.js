'use client'
import { useRef, useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { IoChevronBack, IoChevronForward } from 'react-icons/io5'
import { catalogApi } from '@/lib/api'

export default function CategoryStrip() {
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const scrollerRef = useRef(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)
  const [pageIndex, setPageIndex] = useState(0)
  const [pageCount, setPageCount] = useState(1)

  const syncScrollState = useCallback(() => {
    const el = scrollerRef.current
    if (!el) return
    const { scrollLeft, scrollWidth, clientWidth } = el
    const max = Math.max(0, scrollWidth - clientWidth)
    setCanScrollLeft(scrollLeft > 6)
    setCanScrollRight(scrollLeft < max - 6)
    const pages = Math.max(1, Math.ceil(scrollWidth / Math.max(1, clientWidth)))
    setPageCount(pages)
    if (max <= 0) setPageIndex(0)
    else setPageIndex(Math.min(pages - 1, Math.round((scrollLeft / max) * (pages - 1))))
  }, [])

  useEffect(() => {
    catalogApi.categories().then(setCategories).catch(() => setCategories([])).finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    const el = scrollerRef.current
    if (!el) return
    syncScrollState()
    el.addEventListener('scroll', syncScrollState, { passive: true })
    const ro = new ResizeObserver(syncScrollState)
    ro.observe(el)
    return () => {
      el.removeEventListener('scroll', syncScrollState)
      ro.disconnect()
    }
  }, [syncScrollState])

  const scrollStep = (dir) => {
    const el = scrollerRef.current
    if (!el) return
    const delta = Math.min(320, Math.floor(el.clientWidth * 0.85))
    el.scrollBy({ left: dir * delta, behavior: 'smooth' })
  }

  const goToPage = (i) => {
    const el = scrollerRef.current
    if (!el) return
    const max = el.scrollWidth - el.clientWidth
    if (pageCount <= 1) return
    const target = (max / (pageCount - 1)) * i
    el.scrollTo({ left: target, behavior: 'smooth' })
  }

  return (
    <section className="py-5 md:py-9 border-b border-line/90" aria-label="Shop by category">
      <div className="max-w-[1360px] mx-auto px-4 md:px-6">
        <div className="relative overflow-hidden rounded-2xl border border-line bg-gradient-to-br from-surface via-surface to-surface-alt shadow-[inset_0_1px_0_rgba(255,255,255,0.6)]">
          {/* top rail */}
          <div className="flex items-end justify-between gap-4 px-4 pt-4 pb-2.5 md:px-7 md:pt-6 md:pb-3">
            <div>
              <p className="text-[10px] md:text-[11px] uppercase tracking-[0.28em] text-ink-faint font-semibold">
                Collection
              </p>
              <h2 className="font-display text-[1.125rem] md:text-[1.35rem] font-bold tracking-wide text-ink mt-1">
                Shop by category
              </h2>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => scrollStep(-1)}
                disabled={!canScrollLeft}
                aria-label="Previous categories"
                className="hidden sm:flex h-9 w-9 items-center justify-center rounded-full border border-line bg-white text-ink-mid shadow-sm transition-all hover:border-primary/50 hover:text-primary disabled:pointer-events-none disabled:opacity-25"
              >
                <IoChevronBack className="text-lg" aria-hidden />
              </button>
              <button
                type="button"
                onClick={() => scrollStep(1)}
                disabled={!canScrollRight}
                aria-label="Next categories"
                className="hidden sm:flex h-9 w-9 items-center justify-center rounded-full border border-line bg-white text-ink-mid shadow-sm transition-all hover:border-primary/50 hover:text-primary disabled:pointer-events-none disabled:opacity-25"
              >
                <IoChevronForward className="text-lg" aria-hidden />
              </button>
            </div>
          </div>

          {/* scroll track */}
          <div className="relative px-3 pb-3 md:px-5 md:pb-5">
            <div
              className="pointer-events-none absolute left-0 top-0 z-[1] h-full w-10 bg-gradient-to-r from-surface to-transparent md:w-14"
              aria-hidden
            />
            <div
              className="pointer-events-none absolute right-0 top-0 z-[1] h-full w-10 bg-gradient-to-l from-surface to-transparent md:w-14"
              aria-hidden
            />

            <div
              ref={scrollerRef}
              className="relative z-0 flex gap-3.5 overflow-x-auto scroll-smooth pb-1 pl-1 pr-1 pt-0.5 no-scrollbar sm:gap-4 md:gap-5 md:pl-2 md:pr-2 snap-x snap-mandatory"
            >
              {loading && Array.from({ length: 8 }, (_, i) => (
                <div key={i} className="flex-none w-[92px] sm:w-[100px] md:w-[108px]">
                  <div className="aspect-[3/4] animate-pulse rounded-2xl bg-line/50" />
                  <div className="mx-auto mt-2.5 h-3 w-16 animate-pulse rounded-full bg-line/60" />
                </div>
              ))}
              {!loading && categories.map((cat) => (
                <Link
                  key={cat.id}
                  href={`/plp?category=${cat.slug}`}
                  className="group flex-none snap-start w-[92px] sm:w-[100px] md:w-[108px]"
                >
                  <div className="relative aspect-[3/4] overflow-hidden rounded-2xl bg-white ring-1 ring-black/[0.06] shadow-sm transition-all duration-300 group-hover:-translate-y-0.5 group-hover:shadow-md group-hover:ring-primary/30">
                    <Image
                      src={cat.img}
                      alt={cat.name}
                      fill
                      sizes="108px"
                      className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.04]"
                    />
                    <div
                      className="absolute inset-0 bg-gradient-to-t from-black/[0.18] via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                      aria-hidden
                    />
                  </div>
                  <p className="mt-2.5 text-center text-[11px] font-semibold leading-tight tracking-tight text-ink-mid transition-colors group-hover:text-primary md:text-xs">
                    {cat.name}
                  </p>
                </Link>
              ))}
            </div>
          </div>

          {/* pagination — minimal caps */}
          {pageCount > 1 && (
            <div className="flex justify-center gap-1.5 px-4 pb-4" role="tablist" aria-label="Category pages">
              {Array.from({ length: pageCount }, (_, i) => (
                <button
                  key={i}
                  type="button"
                  role="tab"
                  aria-selected={i === pageIndex}
                  aria-label={`Category page ${i + 1}`}
                  onClick={() => goToPage(i)}
                  className={`h-1 rounded-full transition-all duration-300 ${
                    i === pageIndex ? 'w-6 bg-primary' : 'w-1.5 bg-line-dark hover:bg-ink-faint'
                  }`}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
