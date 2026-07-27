'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Lock, Mail, CheckCircle2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { authApi } from '@/lib/api'
import GoogleAuthButton from './GoogleAuthButton'

export default function LoginPage() {
  const router = useRouter()
  const sp = useSearchParams()
  const next = sp.get('next') || '/profile'
  const [form, setForm] = useState({ email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [redirecting, setRedirecting] = useState(false)

  const submit = async (event) => {
    event.preventDefault()
    setLoading(true)
    try {
      await authApi.login(form)
      setRedirecting(true)
      toast.success('Welcome back')
      router.replace(next)
    } catch (error) {
      toast.error(error.message || 'Login failed')
      setLoading(false)
    }
  }

  return (
    <main className="relative mx-auto max-w-[420px] px-5 py-14">
      {(loading || redirecting) && <AuthRedirectOverlay title={redirecting ? 'Signed in' : 'Signing you in'} message={redirecting ? 'Opening your account now.' : 'Checking your details securely.'} />}
      <h1 className="font-display text-5xl font-bold tracking-wide mb-3">SIGN IN</h1>
      <p className="text-sm text-ink-muted mb-8">Access orders, addresses, checkout, and account settings.</p>
      <form onSubmit={submit} className="space-y-4">
        <label className="block">
          <span className="text-[11px] uppercase tracking-[0.12em] text-ink-muted font-semibold">Email</span>
          <div className="mt-1.5 flex items-center gap-2 rounded-xl border border-line bg-surface-alt px-3.5 py-3">
            <Mail size={17} className="text-ink-faint" />
            <input type="email" required value={form.email} onChange={e=>setForm(p=>({...p,email:e.target.value}))} className="w-full bg-transparent text-sm outline-none" />
          </div>
        </label>
        <label className="block">
          <span className="text-[11px] uppercase tracking-[0.12em] text-ink-muted font-semibold">Password</span>
          <div className="mt-1.5 flex items-center gap-2 rounded-xl border border-line bg-surface-alt px-3.5 py-3">
            <Lock size={17} className="text-ink-faint" />
            <input type="password" required value={form.password} onChange={e=>setForm(p=>({...p,password:e.target.value}))} className="w-full bg-transparent text-sm outline-none" />
          </div>
        </label>
        <button disabled={loading || redirecting} className="w-full rounded-xl bg-primary py-3.5 text-[13px] font-bold text-white shadow-lg shadow-primary/25 transition-colors hover:bg-primary-dark disabled:opacity-60">
          {loading || redirecting ? 'Please wait...' : 'Sign In'}
        </button>
      </form>
      <div className="mt-6 space-y-4">
        <div className="flex items-center gap-3 text-xs uppercase tracking-[0.3em] text-ink-muted">
          <span className="h-px flex-1 bg-line" />
          <span>or</span>
          <span className="h-px flex-1 bg-line" />
        </div>
        <GoogleAuthButton label="Continue with Google" redirectTo={next} />
      </div>
      <div className="mt-6 flex items-center justify-between text-sm">
        <Link href="/signup" className="font-semibold text-primary hover:underline">Create an account</Link>
        <Link href="/forgot-password" className="text-ink-muted hover:text-primary">Forgot password?</Link>
      </div>
    </main>
  )
}

function AuthRedirectOverlay({ title, message }) {
  return <div className="auth-redirect-overlay fixed inset-0 z-[850] flex items-center justify-center bg-white/85 px-5 backdrop-blur-md">
    <div className="w-full max-w-sm rounded-2xl border border-line bg-white p-7 text-center shadow-2xl">
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
        <CheckCircle2 size={24} />
      </div>
      <p className="text-xs font-black uppercase tracking-[0.16em] text-primary">{title}</p>
      <h2 className="mt-2 font-display text-2xl font-black">Almost there</h2>
      <p className="mt-2 text-sm text-ink-muted">{message}</p>
      <div className="mt-5 flex justify-center gap-1.5">
        <span className="auth-loader-dot h-2 w-2 rounded-full bg-primary" />
        <span className="auth-loader-dot h-2 w-2 rounded-full bg-primary" />
        <span className="auth-loader-dot h-2 w-2 rounded-full bg-primary" />
      </div>
    </div>
  </div>
}
