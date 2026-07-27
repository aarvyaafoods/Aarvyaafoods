'use client'
import Link from 'next/link'
import { HiArrowLongRight } from 'react-icons/hi2'

export default function PromoBanner() {
  return (
    <section className="mx-4 md:mx-6 my-2 md:my-4 rounded-2xl overflow-hidden relative text-white py-8 md:py-10 px-6 md:px-12 flex flex-col md:flex-row items-center justify-between gap-5 md:gap-6"
      style={{background:'linear-gradient(135deg,var(--color-primary),var(--color-primary-dark))'}}>
      <div className="absolute inset-0 opacity-10"
        style={{backgroundImage:'repeating-linear-gradient(45deg,#fff 0,#fff 1px,transparent 1px,transparent 12px)'}}/>
      <div className="relative text-center md:text-left">
        <p className="text-[11px] uppercase tracking-[0.2em] opacity-80 mb-1">Limited Time</p>
        <h2 className="font-display text-[clamp(28px,5vw,48px)] font-bold leading-tight">FREE SHIPPING ON ₹999+</h2>
        <p className="text-[13px] opacity-85 mt-1">Use code <strong>FREESHIP</strong> at checkout · Valid till May 31, 2026</p>
      </div>
      <Link href="/plp" className="group relative inline-flex flex-shrink-0 items-center gap-2 bg-white text-primary font-bold text-[13px] px-8 py-3.5 rounded-xl hover:bg-surface-alt transition-colors shadow-lg">
        Shop Now
        <HiArrowLongRight className="text-lg transition-transform group-hover:translate-x-0.5" aria-hidden />
      </Link>
    </section>
  )
}
