'use client'
import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { Package, MapPin, Settings, LogOut } from 'lucide-react'
import Link from 'next/link'
import OrdersSection    from './OrdersSection'
import AddressesSection from './AddressesSection'
import SettingsSection  from './SettingsSection'
import { authApi } from '@/lib/api'

const NAV = [
  {id:'orders',    label:'My Orders',       Icon:Package},
  {id:'addresses', label:'Saved Addresses', Icon:MapPin},
  {id:'settings',  label:'Settings',        Icon:Settings},
]

function ProfileContent() {
  const sp = useSearchParams()
  const requestedTab = sp.get('tab')
  const [tab, setTab] = useState(NAV.some(item => item.id === requestedTab) ? requestedTab : 'orders')
  const [user, setUser] = useState(null)
  const [loaded, setLoaded] = useState(false)
  useEffect(() => { authApi.me().then(setUser).catch(() => setUser(null)).finally(()=>setLoaded(true)) }, [])

  if (loaded && !user) {
    return (
      <div className="mx-auto max-w-[520px] px-5 py-20 text-center">
        <h1 className="font-display text-5xl font-bold mb-3">SIGN IN REQUIRED</h1>
        <p className="text-sm text-ink-muted mb-7">Your orders, addresses, and settings are protected behind your account.</p>
        <Link href="/login?next=/profile" className="inline-flex rounded-xl bg-primary px-8 py-3.5 text-[13px] font-bold text-white shadow-lg shadow-primary/25 hover:bg-primary-dark">Sign In</Link>
      </div>
    )
  }

  if (!loaded) {
    return (
      <div className="max-w-[1360px] mx-auto px-4 md:px-6 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-8">
          <div className="space-y-4">
            <div className="h-40 animate-pulse rounded-2xl bg-surface-alt" />
            <div className="h-44 animate-pulse rounded-2xl bg-surface-alt" />
          </div>
          <div className="space-y-4">
            <div className="h-10 w-56 animate-pulse rounded-lg bg-surface-alt" />
            <div className="h-48 animate-pulse rounded-2xl bg-surface-alt" />
            <div className="h-48 animate-pulse rounded-2xl bg-surface-alt" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-[1360px] mx-auto px-4 md:px-6 py-10">
      <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-8">

        {/* Sidebar */}
        <aside className="lg:sticky lg:top-20 self-start">
          <div className="bg-gradient-to-br from-primary to-primary-dark rounded-2xl p-6 text-white mb-4">
            <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center font-display text-2xl font-bold mb-3">{(user?.name || 'U').split(' ').map(x=>x[0]).join('').slice(0,2)}</div>
            <p className="font-bold text-[16px]">{user?.name || 'Account'}</p>
            <p className="text-[12px] opacity-80">{user?.email || 'Sign in to sync your profile'}</p>
            <p className="text-[11px] opacity-70 mt-1">{user?.created_at ? `Member since ${new Date(user.created_at).toLocaleDateString('en-IN', { month:'long', year:'numeric' })}` : 'JWT protected'}</p>
          </div>
          <nav className="bg-white border border-line rounded-2xl overflow-hidden">
            {NAV.map(({id,label,Icon})=>(
              <button key={id} onClick={()=>setTab(id)}
                className={`w-full flex items-center gap-3 px-5 py-3.5 text-[13px] font-medium border-b border-line last:border-0 transition-all ${tab===id?'bg-primary/8 text-primary font-semibold':'text-ink-mid hover:bg-surface-alt'}`}>
                <Icon size={16} className={tab===id?'text-primary':'text-ink-muted'}/>
                {label}
                {tab===id && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-primary"/>}
              </button>
            ))}
            <button onClick={()=>authApi.logout()} className="w-full flex items-center gap-3 px-5 py-3.5 text-[13px] font-medium text-red-500 hover:bg-red-50 transition-all">
              <LogOut size={16}/> Logout
            </button>
          </nav>
        </aside>

        {/* Content */}
        <div className="min-h-[60vh]">
          {tab==='orders'    && <OrdersSection/>}
          {tab==='addresses' && <AddressesSection/>}
          {tab==='settings'  && <SettingsSection/>}
        </div>
      </div>
    </div>
  )
}

export default function ProfilePage() {
  return <Suspense fallback={<div className="py-20 text-center text-ink-muted">Loading…</div>}><ProfileContent/></Suspense>
}
