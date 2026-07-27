'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle2, Lock, Mail } from 'lucide-react'
import toast from 'react-hot-toast'
import { adminApi } from '@/lib/api'

export default function AdminLoginPage() {
  const router = useRouter()
  const [form, setForm] = useState({ email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [redirecting, setRedirecting] = useState(false)

  const submit = async (event) => {
    event.preventDefault()
    setLoading(true)
    try {
      await adminApi.login(form)
      await adminApi.me()
      setRedirecting(true)
      router.replace('/admin')
    } catch (error) {
      toast.error(error.message || 'Admin login failed')
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-[#f6f7f9] px-5 py-10 text-ink">
      {(loading || redirecting) && <AdminLoginOverlay redirecting={redirecting} />}
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-[1120px] items-center justify-center">
        <div className="grid w-full overflow-hidden rounded-2xl border border-line bg-white shadow-xl md:grid-cols-[1fr_440px]">
          <div className="hidden bg-ink p-10 text-white md:flex md:flex-col md:justify-between">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-primary">Aarvya Admin</p>
              <h1 className="mt-6 max-w-[520px] font-display text-6xl font-black leading-none">Commerce control room</h1>
            </div>
            <div className="grid grid-cols-3 gap-3 text-sm">
              {['Orders', 'Customers', 'Catalog'].map(item => (
                <div key={item} className="rounded-lg border border-white/15 bg-white/10 p-4 font-bold">{item}</div>
              ))}
            </div>
          </div>
          <form onSubmit={submit} className="p-7 sm:p-10">
            <h2 className="font-display text-4xl font-black">ADMIN LOGIN</h2>
            <p className="mt-2 text-sm text-ink-muted">Sign in with your admin credentials to manage storefront data.</p>
            <label className="mt-8 block text-xs font-bold uppercase tracking-[0.14em] text-ink-muted">Email</label>
            <div className="mt-2 flex items-center gap-3 rounded-xl border border-line bg-surface-alt px-4">
              <Mail size={18} className="text-ink-faint" />
              <input type="email" required autoComplete="off" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="h-12 min-w-0 flex-1 bg-transparent text-sm font-semibold outline-none" />
            </div>
            <label className="mt-5 block text-xs font-bold uppercase tracking-[0.14em] text-ink-muted">Password</label>
            <div className="mt-2 flex items-center gap-3 rounded-xl border border-line bg-surface-alt px-4">
              <Lock size={18} className="text-ink-faint" />
              <input type="password" required autoComplete="new-password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} className="h-12 min-w-0 flex-1 bg-transparent text-sm font-semibold outline-none" />
            </div>
            <button disabled={loading || redirecting} className="mt-7 h-12 w-full rounded-xl bg-primary text-sm font-black uppercase tracking-[0.12em] text-white shadow-lg shadow-primary/25 transition-colors hover:bg-primary-dark disabled:opacity-60">
              {loading || redirecting ? 'Please wait...' : 'Sign in'}
            </button>
          </form>
        </div>
      </div>
    </main>
  )
}

function AdminLoginOverlay({ redirecting }) {
  return <div className="auth-redirect-overlay fixed inset-0 z-[850] flex items-center justify-center bg-[#111318]/70 px-5 backdrop-blur-md">
    <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-white p-7 text-center shadow-2xl">
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
        <CheckCircle2 size={24} />
      </div>
      <p className="text-xs font-black uppercase tracking-[0.16em] text-primary">{redirecting ? 'Access granted' : 'Checking access'}</p>
      <h2 className="mt-2 font-display text-2xl font-black">Opening admin panel</h2>
      <p className="mt-2 text-sm text-ink-muted">{redirecting ? 'Loading your dashboard now.' : 'Verifying your admin session securely.'}</p>
      <div className="mt-5 flex justify-center gap-1.5">
        <span className="auth-loader-dot h-2 w-2 rounded-full bg-primary" />
        <span className="auth-loader-dot h-2 w-2 rounded-full bg-primary" />
        <span className="auth-loader-dot h-2 w-2 rounded-full bg-primary" />
      </div>
    </div>
  </div>
}
