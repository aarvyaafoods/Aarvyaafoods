'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useStore } from '@/context/StoreContext'
import { ArrowLeft, Search, User, ShoppingCart, Menu, X } from 'lucide-react'
import { authApi, catalogApi } from '@/lib/api'

const NAV = [
  { label:'Home', href:'/' },
  { label:'Categories', href:'/plp', categories: true },
  { label:'About Us', href:'/about-us' },
  { label:'Contact Us', href:'/contact-us' },
]

export default function Header() {
  const router = useRouter()
  const { cartCount } = useStore()
  const [scrolled, setScrolled] = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [drawerClosing, setDrawerClosing] = useState(false)
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false)
  const [megaOpen, setMegaOpen] = useState(null)
  const [query, setQuery] = useState('')
  const [searchMatches, setSearchMatches] = useState([])
  const [searchLoading, setSearchLoading] = useState(false)
  const [accountOpen, setAccountOpen] = useState(false)
  const [signedIn, setSignedIn] = useState(false)
  const [authReady, setAuthReady] = useState(false)
  const [categories, setCategories] = useState([])
  const [branding, setBranding] = useState({})

  const normalizedQuery = query.trim().toLowerCase()

  useEffect(() => {
    if (!normalizedQuery) {
      setSearchMatches([])
      setSearchLoading(false)
      return
    }
    setSearchLoading(true)
    const t = window.setTimeout(() => {
      catalogApi.products({ q: normalizedQuery, limit: 6 })
        .then(data => setSearchMatches(data.items || []))
        .catch(() => setSearchMatches([]))
        .finally(() => setSearchLoading(false))
    }, 180)
    return () => {
      window.clearTimeout(t)
      setSearchLoading(false)
    }
  }, [normalizedQuery])

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 8)
    window.addEventListener('scroll', fn)
    return () => window.removeEventListener('scroll', fn)
  }, [])

  useEffect(() => {
    catalogApi.home()
      .then(data => {
        setCategories(data.categories || [])
        setBranding(data.branding || {})
      })
      .catch(() => {
        setCategories([])
        setBranding({})
      })
  }, [])

  useEffect(() => {
    let cancelled = false
    const syncAuth = async () => {
      try {
        await authApi.me()
        if (!cancelled) setSignedIn(true)
      } catch (_) {
        if (!cancelled) setSignedIn(false)
      } finally {
        if (!cancelled) setAuthReady(true)
      }
    }
    syncAuth()
    window.addEventListener('storage', syncAuth)
    window.addEventListener('staffarc-auth', syncAuth)
    return () => {
      cancelled = true
      window.removeEventListener('storage', syncAuth)
      window.removeEventListener('staffarc-auth', syncAuth)
    }
  }, [])

  const closeSearch = () => {
    setMobileSearchOpen(false)
    setQuery('')
  }

  const openDrawer = () => {
    setDrawerClosing(false)
    setDrawerOpen(true)
  }

  const closeDrawer = () => {
    setDrawerClosing(true)
    window.setTimeout(() => {
      setDrawerOpen(false)
      setDrawerClosing(false)
    }, 220)
  }

  const onSearch = e => {
    if (e.key === 'Enter' && query.trim()) {
      window.location.href = `/plp?q=${encodeURIComponent(query.trim())}`
      closeSearch()
    }
  }

  const SearchSuggestions = ({ mobile = false }) => {
    if (!normalizedQuery) return null

    return (
      <div className={`${mobile ? 'absolute left-0 right-0 top-[calc(100%+0.5rem)] z-[410] max-h-[min(62vh,420px)] overflow-y-auto overscroll-contain rounded-b-2xl border-t border-line bg-white px-4 py-3 shadow-lg' : 'absolute left-0 right-0 top-[calc(100%+0.5rem)] z-[410] rounded-xl border border-line bg-white p-2 shadow-xl'}`}>
        {searchLoading ? (
          <div className="space-y-2 p-2">
            {[1, 2, 3].map(item => <div key={item} className="h-12 animate-pulse rounded-lg bg-surface-alt" />)}
          </div>
        ) : searchMatches.length > 0 ? (
          <div className="flex flex-col">
            {searchMatches.map((product) => (
              <Link
                key={product.id}
                href={`/pdp?id=${product.id}`}
                onMouseDown={(e) => e.preventDefault()}
                onClick={closeSearch}
                className="flex items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-surface-alt"
              >
                <span className="min-w-0">
                  <span className="block truncate text-sm font-semibold text-ink">{product.name}</span>
                  <span className="block truncate text-xs text-ink-muted">{product.brand} - {product.subcategory.replace('-', ' ')}</span>
                </span>
                <span className="shrink-0 text-xs font-semibold text-primary">View</span>
              </Link>
            ))}
          </div>
        ) : (
          <div className="rounded-xl bg-surface-alt px-4 py-5 text-center">
            <Image
              src="https://api.dicebear.com/9.x/avataaars/png?seed=AarvyaSearch&backgroundColor=ffd5dc&radius=50"
              alt=""
              width={96}
              height={96}
              className="mx-auto mb-3 h-24 w-24 animate-[fadeUp_0.3s_ease] rounded-full bg-white p-2 shadow-sm"
            />
            <p className="text-sm font-bold text-ink">No matching styles found</p>
            <p className="mx-auto mt-1 max-w-[260px] text-xs leading-5 text-ink-muted">
              We could not find that exact product yet. Try a simpler word or explore our latest drops.
            </p>
            <Link
              href="/plp"
              onClick={closeSearch}
              className="mt-3 inline-flex rounded-full bg-primary px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-primary-dark"
            >
              Browse all products
            </Link>
          </div>
        )}
      </div>
    )
  }

  return (
    <>
      <header className={`sticky top-0 z-[200] bg-white transition-shadow duration-200 ${scrolled ? 'shadow-md' : 'border-b border-line'}`}>
        <div className="max-w-[1360px] mx-auto px-4 md:px-6">
          <div className="flex items-center justify-between h-16 gap-4">
            {mobileSearchOpen ? (
              <div className="relative flex w-full items-center gap-2 md:hidden">
                <button onClick={closeSearch} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md text-ink-muted hover:text-primary" aria-label="Close search">
                  <ArrowLeft size={21}/>
                </button>
                <div className="relative flex-1">
                  <input
                    autoFocus
                    type="text"
                    value={query}
                    onChange={e=>setQuery(e.target.value)}
                    onKeyDown={onSearch}
                    placeholder="Search products"
                    className="h-11 w-full rounded-xl border-2 border-primary bg-white pl-4 pr-11 text-base font-semibold text-ink outline-none shadow-[0_3px_0_var(--color-primary-light)] placeholder:text-ink-faint"
                  />
                  <Search size={20} strokeWidth={2.4} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-primary"/>
                </div>
                <SearchSuggestions mobile />
              </div>
            ) : (
              <>
                <button onClick={openDrawer} className="lg:hidden p-2 text-ink-muted hover:text-primary transition-colors" aria-label="Open menu">
                  <Menu size={22}/>
                </button>

                <Link href="/" className="flex-shrink-0">
                  {branding.logoUrl ? (
                    <img src={branding.logoUrl} alt="Aarvya" className="h-10 max-w-[150px] object-contain" />
                  ) : (
                    <span className="font-display text-[26px] font-bold tracking-wider text-ink">
                      Aarv<span className="text-primary">ya</span>
                    </span>
                  )}
                </Link>

                <nav className="hidden lg:flex items-center gap-1 self-stretch">
                  {NAV.map(l => {
                    return (
                      <div
                        key={l.label}
                        className="flex items-center"
                        onMouseEnter={() => setMegaOpen(l.categories ? 'categories' : null)}
                      >
                        <Link href={l.href}
                          onClick={(event) => {
                            if (l.categories) {
                              event.preventDefault()
                              setMegaOpen(megaOpen === 'categories' ? null : 'categories')
                            }
                          }}
                          className={`px-3.5 py-2 text-sm font-medium rounded-md transition-colors whitespace-nowrap hover:bg-surface-alt hover:text-primary ${megaOpen === 'categories' && l.categories ? 'bg-surface-alt text-primary' : ''} ${l.hot?'text-primary font-semibold':'text-ink-mid'}`}>
                          {l.label}
                        </Link>
                      </div>
                    )
                  })}
                </nav>

                <div className="hidden md:flex flex-1 max-w-xs">
                  <div className="relative w-full">
                    <input
                      type="text"
                      value={query}
                      onChange={e=>setQuery(e.target.value)}
                      onKeyDown={onSearch}
                      placeholder="Search products..."
                      className="h-12 w-full rounded-xl border-2 border-primary bg-white pl-5 pr-12 text-sm font-semibold text-ink outline-none shadow-[0_3px_0_var(--color-primary-light)] transition-all placeholder:text-ink-faint hover:border-primary-dark focus:border-primary-dark focus:shadow-[0_4px_0_var(--color-primary-light)]"
                    />
                    <Search size={24} strokeWidth={2.4} className="absolute right-4 top-1/2 -translate-y-1/2 text-primary"/>
                    <SearchSuggestions />
                  </div>
                </div>

                <div className="flex items-center gap-0.5">
                  <button onClick={()=>setMobileSearchOpen(true)} className="md:hidden w-9 h-9 flex items-center justify-center text-ink-muted hover:text-primary rounded-md transition-colors" aria-label="Search">
                    <Search size={19}/>
                  </button>
                  <div className="relative">
                    <button onClick={()=>setAccountOpen(v=>!v)} className="w-9 h-9 flex items-center justify-center text-ink-muted hover:text-primary rounded-md transition-colors" aria-label="Account">
                      <User size={19}/>
                    </button>
                    {accountOpen && (
                      <div className="absolute right-0 top-[calc(100%+0.55rem)] z-[500] w-56 rounded-xl border border-line bg-white p-2 shadow-xl">
                        {!authReady ? (
                          <p className="px-3 py-3 text-sm text-ink-muted">Checking account...</p>
                        ) : signedIn ? (
                          <>
                            <Link href="/profile" onClick={()=>setAccountOpen(false)} className="block rounded-lg px-3 py-2.5 text-sm font-semibold text-ink hover:bg-surface-alt">My Account</Link>
                            <Link href="/profile?tab=orders" onClick={()=>setAccountOpen(false)} className="block rounded-lg px-3 py-2.5 text-sm text-ink-mid hover:bg-surface-alt">Orders</Link>
                            <Link href="/profile?tab=addresses" onClick={()=>setAccountOpen(false)} className="block rounded-lg px-3 py-2.5 text-sm text-ink-mid hover:bg-surface-alt">Addresses</Link>
                            <button onClick={async()=>{await authApi.logout(); setSignedIn(false); setAccountOpen(false); router.push('/')}} className="mt-1 w-full rounded-lg px-3 py-2.5 text-left text-sm font-semibold text-red-500 hover:bg-red-50">Logout</button>
                          </>
                        ) : (
                          <>
                            <p className="px-3 py-2 text-xs leading-5 text-ink-muted">Sign in for faster checkout, order tracking, and saved addresses.</p>
                            <Link href="/login" onClick={()=>setAccountOpen(false)} className="block rounded-lg bg-primary px-3 py-2.5 text-center text-sm font-bold text-white hover:bg-primary-dark">Sign In</Link>
                            <Link href="/signup" onClick={()=>setAccountOpen(false)} className="mt-1 block rounded-lg px-3 py-2.5 text-center text-sm font-semibold text-primary hover:bg-surface-alt">Create Account</Link>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                  <Link href="/cart" className="relative w-9 h-9 flex items-center justify-center text-ink-muted hover:text-primary rounded-md transition-colors" aria-label="Cart">
                    <ShoppingCart size={19}/>
                    {cartCount > 0 && <span className="absolute top-1 right-1 w-4 h-4 bg-primary text-white text-[9px] font-bold rounded-full flex items-center justify-center">{cartCount>9?'9+':cartCount}</span>}
                  </Link>
                </div>
              </>
            )}
          </div>
        </div>

        {megaOpen === 'categories' && (
          <div
            className="absolute left-0 right-0 top-full hidden border-b border-line bg-white shadow-lg lg:block"
            onMouseEnter={() => setMegaOpen(megaOpen)}
            onMouseLeave={() => setMegaOpen(null)}
          >
            <div className="mx-auto max-w-[1360px] px-6 py-9">
              <div className="mb-5 flex items-center justify-between border-b border-line pb-4">
                <p className="font-display text-3xl font-bold text-ink">Categories</p>
                <Link href="/plp" className="text-[13px] font-semibold text-primary hover:text-primary-dark">
                  View all products
                </Link>
              </div>
              <div className="grid grid-cols-4 gap-x-10 gap-y-8">
                {categories.map(category => (
                  <div key={category.id || category.slug}>
                    <Link href={`/plp?category=${category.slug}`} onClick={() => setMegaOpen(null)} className="block text-sm font-black uppercase tracking-[0.12em] text-ink hover:text-primary">{category.name}</Link>
                    <div className="mt-3 space-y-2">
                      {(category.subcategories || []).map(item => (
                        <Link key={item.id || item.slug} href={`/plp?category=${category.slug}&subcategory=${item.slug}`} onClick={() => setMegaOpen(null)} className="block text-sm font-semibold text-ink-muted hover:text-primary">{item.name}</Link>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </header>

      {drawerOpen && (
        <div className="fixed inset-0 z-[300] lg:hidden">
          <div className={`absolute inset-0 bg-black/50 ${drawerClosing ? 'opacity-0 transition-opacity duration-200' : 'drawer-backdrop-in'}`} onClick={closeDrawer}/>
          <div className={`${drawerClosing ? 'drawer-left-out' : 'drawer-left-in'} absolute left-0 top-0 bottom-0 w-72 bg-white flex flex-col shadow-2xl`}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-line">
              {branding.logoUrl ? <img src={branding.logoUrl} alt="Aarvya" className="h-9 max-w-[140px] object-contain" /> : <span className="font-display text-xl font-bold">Aarv<span className="text-primary">ya</span></span>}
              <button onClick={closeDrawer} className="text-ink-muted hover:text-ink"><X size={20}/></button>
            </div>
            <nav className="flex flex-col py-2 overflow-y-auto flex-1">
              <Link href="/" onClick={closeDrawer} className="px-5 py-3.5 text-[14px] font-medium border-b border-line/50 text-ink-mid hover:bg-surface-alt transition-colors">Home</Link>
              <div className="border-b border-line/50 px-5 py-3.5">
                <p className="mb-2 text-[14px] font-black text-ink">Categories</p>
                <div className="space-y-3">
                  {categories.map(category => (
                    <div key={category.id || category.slug}>
                      <Link href={`/plp?category=${category.slug}`} onClick={closeDrawer} className="text-sm font-bold text-ink-mid hover:text-primary">{category.name}</Link>
                      <div className="mt-1.5 grid gap-1 pl-3">
                        {(category.subcategories || []).map(item => <Link key={item.id || item.slug} href={`/plp?category=${category.slug}&subcategory=${item.slug}`} onClick={closeDrawer} className="text-xs font-semibold text-ink-muted hover:text-primary">{item.name}</Link>)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <Link href="/about-us" onClick={closeDrawer} className="px-5 py-3.5 text-[14px] font-medium border-b border-line/50 text-ink-mid hover:bg-surface-alt transition-colors">About Us</Link>
              <Link href="/contact-us" onClick={closeDrawer} className="px-5 py-3.5 text-[14px] font-medium border-b border-line/50 text-ink-mid hover:bg-surface-alt transition-colors">Contact Us</Link>
            </nav>
            <div className="p-4 border-t border-line">
              <Link href={signedIn ? '/profile' : '/login'} onClick={closeDrawer}
                className="flex items-center gap-2.5 text-[13px] text-ink-muted hover:text-primary transition-colors py-2">
                <User size={17}/> {signedIn ? 'My Account' : 'Sign In'}
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
