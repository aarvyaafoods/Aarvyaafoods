'use client'
import { useState, useEffect, useCallback, useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { catalogApi } from '@/lib/api'

const SWIPE_THRESHOLD = 44
const FALLBACK_HERO = [
  {
    id: 'fallback-hero',
    kicker: 'New Season',
    title: 'MOVE IN STYLE',
    cta: 'Explore Styles',
    ctaLink: '/plp',
    img: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=1400&q=80',
    video: ''
  }
]

export default function HeroSection() {
  const [heroBanners, setHeroBanners] = useState([])
  const [cur, setCur] = useState(0)
  const [inView, setInView] = useState(true)
  const sectionRef = useRef(null)
  const videoRef = useRef(null)
  const swipeStartRef = useRef(null)
  const total = heroBanners?.length || 1
  const next = useCallback(() => setCur(c => (c + 1) % (total || 1)), [total])
  const prev = useCallback(() => setCur(c => (c - 1 + (total || 1)) % (total || 1)), [total])

  useEffect(() => {
    catalogApi.home()
      .then(data => setHeroBanners(data.heroBanners?.length ? data.heroBanners : FALLBACK_HERO))
      .catch(() => setHeroBanners(FALLBACK_HERO))
  }, [])

  useEffect(() => {
    const t = setInterval(next, 5000)
    return () => clearInterval(t)
  }, [next])

  useEffect(() => {
    const node = sectionRef.current
    if (!node) return undefined
    const observer = new IntersectionObserver(([entry]) => {
      setInView(entry.isIntersecting)
    }, { threshold: 0.45 })
    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    if (inView) {
      video.play().catch(() => {})
    } else {
      video.pause()
    }
  }, [cur, inView])

  const b = heroBanners[cur]
  if (!b) return (
    <section className="relative overflow-hidden bg-white pt-5 pb-1 md:py-8" aria-label="Hero">
      <div className="mx-auto max-w-[1360px] px-4 md:px-6">
        <div className="aspect-[16/9] animate-pulse rounded-2xl bg-surface-alt lg:aspect-[21/8]" />
      </div>
    </section>
  )
  const hasVideo = Boolean(b.video)

  const onPointerDown = (event) => {
    swipeStartRef.current = event.clientX
  }

  const onPointerUp = (event) => {
    if (swipeStartRef.current === null) return
    const delta = event.clientX - swipeStartRef.current
    swipeStartRef.current = null
    if (Math.abs(delta) < SWIPE_THRESHOLD) return
    if (delta < 0) next()
    else prev()
  }

  return (
    <section ref={sectionRef} className="relative overflow-hidden bg-white pt-5 pb-1 md:py-8" aria-label="Hero">
      <div className="mx-auto max-w-[1360px] px-4 md:px-6">
        <div className="relative">
          <div
            className="relative aspect-[16/9] touch-pan-y overflow-hidden rounded-2xl bg-surface-alt shadow-xl lg:aspect-[21/8]"
            key={cur}
            onPointerDown={onPointerDown}
            onPointerUp={onPointerUp}
            onPointerCancel={() => { swipeStartRef.current = null }}
          >
            {hasVideo ? (
              <video
                ref={videoRef}
                className="absolute inset-0 h-full w-full object-cover object-center"
                src={b.video}
                poster={b.img}
                muted
                playsInline
                loop
                autoPlay
                preload="auto"
                onCanPlay={() => videoRef.current?.play().catch(() => {})}
                aria-label={b.title}
              />
            ) : (
              <Image
                src={b.img}
                alt={b.title}
                fill
                priority
                sizes="(max-width:640px)100vw,(max-width:1024px)100vw,1360px"
                className="object-cover object-center transition-transform duration-700 ease-out"
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/5 to-transparent" />
            <div className="absolute bottom-4 left-4 right-4 md:bottom-6 md:left-7">
              <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.2em] text-white/80 md:text-[11px]">{b.kicker}</p>
              <h1 className="max-w-[720px] font-display text-[clamp(30px,8vw,76px)] font-bold leading-[0.92] tracking-wide text-white drop-shadow-md">
                {b.title}
              </h1>
            </div>
          </div>

          <button onClick={prev} aria-label="Previous" className="absolute left-2 top-1/2 z-10 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-ink shadow-md transition-all hover:bg-white hover:text-primary sm:flex md:-left-5">
            <ChevronLeft size={18} />
          </button>
          <button onClick={next} aria-label="Next" className="absolute right-2 top-1/2 z-10 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-ink shadow-md transition-all hover:bg-white hover:text-primary sm:flex md:-right-5">
            <ChevronRight size={18} />
          </button>
        </div>

        <div className="mt-4 flex items-center justify-center gap-2">
          {heroBanners.map((_, i) => (
            <button
              key={i}
              onClick={() => setCur(i)}
              aria-label={`Slide ${i + 1}`}
              className={`h-2 rounded-full transition-all ${i === cur ? 'w-7 bg-primary' : 'w-2 bg-line-dark hover:bg-primary/60'}`}
            />
          ))}
        </div>

        <div className="mt-5 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center">
          <Link href={b.ctaLink || '/plp'} className="inline-flex justify-center rounded-xl bg-primary px-8 py-3.5 text-[14px] font-bold uppercase tracking-[0.16em] text-white shadow-lg shadow-primary/25 transition-all hover:-translate-y-0.5 hover:bg-primary-dark sm:text-[15px]">
            {b.cta || 'Shop Now'}
          </Link>
          <Link href="/plp" className="inline-flex justify-center rounded-xl border border-line bg-white px-8 py-3 text-[14px] font-bold uppercase tracking-[0.16em] text-ink transition-all hover:border-primary hover:text-primary sm:text-[15px]">
            Browse All
          </Link>
        </div>
      </div>
    </section>
  )
}
