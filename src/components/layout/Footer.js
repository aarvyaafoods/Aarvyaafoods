'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  Facebook,
  Instagram,
  Linkedin,
} from 'lucide-react'
import { FaWhatsapp } from 'react-icons/fa'
import { catalogApi } from '@/lib/api'
import toast from 'react-hot-toast'

export default function Footer() {
  const staticCols = {
    Company: [
      ['About Us', '/about-us'],
      ['Blog', '#'],
      ['Privacy Policy', '#'],
      ['Terms & Conditions', '#'],
      ['Work With Us', '#'],
    ],
    Customers: [
      ['Contact Us', '/contact-us'],
      ['FAQs', '#'],
      ['Shipping Policy', '#'],
      ['Refund Policy', '#'],
    ],
  }
  const socials = [
    ['Facebook', Facebook, 'https://www.facebook.com/share/188Zeu7wE5/'],
    ['Instagram', Instagram, 'https://www.instagram.com/foodsaarvya?igsh=MTByaG9mYnV4Y256Mg=='],
    ['WhatsApp', FaWhatsapp, 'https://wa.me/917331167628'],
    ['LinkedIn', Linkedin, '#'],
  ]
  const [marqueeMessage, setMarqueeMessage] = useState('Free shipping on orders above Rs. 999')
  const [email, setEmail] = useState('')
  const [categories, setCategories] = useState([])
  const [branding, setBranding] = useState({})

  useEffect(() => {
    catalogApi.home()
      .then(data => {
        setMarqueeMessage(data.footerMarquee?.message || 'Free shipping on orders above Rs. 999')
        setCategories(data.categories || [])
        setBranding(data.branding || {})
      })
      .catch(() => {})
  }, [])

  const subscribe = async (event) => {
    event.preventDefault()
    try {
      await catalogApi.newsletter({ email, source: 'footer' })
      setEmail('')
      toast.success('Subscribed successfully')
    } catch (error) {
      toast.error(error.message || 'Subscription failed')
    }
  }

  return (
    <footer className="site-footer bg-primary text-white mt-16">
      <div className="max-w-[1360px] mx-auto px-4 md:px-6 pt-12 pb-6">
        <div className="mb-10">
          <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
            <div>
              {branding.logoUrl ? <img src={branding.logoUrl} alt="Aarvya" className="mb-5 h-12 max-w-[180px] object-contain" /> : null}
              <h2 className="footer-title font-body text-[2.45rem] font-black uppercase leading-[0.9] tracking-normal text-white sm:text-[3.35rem] md:text-[4.1rem]">Join Our<span className="block">Aarvya Fam</span></h2>
            </div>

            <form onSubmit={subscribe} className="footer-subscribe flex h-14 rounded-xl bg-white p-1.5 shadow-[0_3px_0_var(--color-primary-dark)] focus-within:ring-2 focus-within:ring-white/70 sm:h-16">
              <label htmlFor="footer-email" className="sr-only">Email address</label>
              <input
                id="footer-email"
                type="email"
                required
                value={email}
                onChange={event => setEmail(event.target.value)}
                placeholder="aarvyaa.foods@gmail.com"
                className="min-w-0 flex-1 rounded-lg px-3 text-sm font-semibold text-ink outline-none placeholder:text-ink-faint sm:px-5"
              />
              <button
                type="submit"
                className="shrink-0 rounded-lg bg-ink px-4 text-[11px] font-extrabold uppercase tracking-wide text-white transition-colors hover:bg-primary-dark sm:px-7 sm:text-xs"
              >
                Subscribe
              </button>
            </form>
          </div>

          <div className="mt-8">
            <p className="mb-3 text-sm font-extrabold uppercase tracking-wide text-white">Spot Us On</p>
            <div className="footer-socials grid grid-cols-4 border border-white/35">
              {socials.map(([label, Icon, href]) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  target={href !== '#' ? '_blank' : undefined}
                  rel={href !== '#' ? 'noreferrer' : undefined}
                  className="group flex min-h-14 items-center justify-center border-r border-white/35 text-white transition-colors hover:bg-white/15 last:border-r-0"
                >
                  <Icon size={22} strokeWidth={2.2} className="transition-transform group-hover:scale-110" />
                </a>
              ))}
            </div>
          </div>

          <div className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {Object.entries({
              Categories: categories.map(category => [category.name, `/plp?category=${category.slug}`]),
              ...staticCols
            }).map(([h, links]) => (
              <div key={h}>
                <p className="mb-5 text-sm font-extrabold uppercase tracking-wide text-white">{h}</p>
              <ul className="space-y-1.5">
                {links.map(([l, href]) => (
                  <li key={l}>
                    <Link href={href} className="text-[13px] font-bold uppercase tracking-wide text-white/75 transition-colors hover:text-white">
                      {l}
                    </Link>
                  </li>
                ))}
              </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="relative left-1/2 w-screen -translate-x-1/2 mb-8">
          <div className="marquee bg-primary py-6">
            <div className="marquee__track" aria-hidden>
              <span className="marquee__item font-extrabold text-white">{marqueeMessage}</span><span className="marquee__item font-extrabold text-white">{marqueeMessage}</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-5 border-t border-white/10">
          <p className="text-[12px] text-white/55">&copy; 2026 Aarvya. All rights reserved.</p>
          {/* Payment icons removed from the footer bottom. */}
        </div>
      </div>
    </footer>
  )
}
