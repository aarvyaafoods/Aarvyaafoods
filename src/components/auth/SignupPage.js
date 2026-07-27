'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { CheckCircle2, Lock, Mail, Phone, User } from 'lucide-react'
import toast from 'react-hot-toast'
import { authApi } from '@/lib/api'
import GoogleAuthButton from './GoogleAuthButton'
import { normalizeIndianPhone, passwordChecks, validateSignup } from '@/lib/validation'

export default function SignupPage() {
  const router = useRouter()
  const sp = useSearchParams()
  const next = sp.get('next') || '/profile'
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '' })
  const [errors, setErrors] = useState({})
  const passRules = passwordChecks(form.password)
  const [loading, setLoading] = useState(false)
  const [checkingEmail, setCheckingEmail] = useState(false)
  const [redirecting, setRedirecting] = useState(false)
  const fields = [
    ['Full Name', 'name', 'text', User],
    ['Email', 'email', 'email', Mail],
    ['Phone', 'phone', 'tel', Phone],
    ['Password', 'password', 'password', Lock]
  ]

  const submit = async (event) => {
    event.preventDefault()
    const nextErrors = validateSignup(form)
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length) {
      toast.error('Please fix the highlighted fields')
      return
    }
    setCheckingEmail(true)
    try {
      const result = await authApi.checkEmail(form.email.trim())
      if (!result.available) {
        setErrors(p => ({ ...p, email: 'An account already exists with this email. Sign in instead.' }))
        toast.error('Account already exists with this email')
        return
      }
    } catch (_) {
    } finally {
      setCheckingEmail(false)
    }
    setLoading(true)
    try {
      await authApi.register({ ...form, phone: normalizeIndianPhone(form.phone) })
      setRedirecting(true)
      toast.success('Account created')
      router.replace(next)
    } catch (error) {
      if (/already registered|already exists/i.test(error.message || '')) {
        setErrors(p => ({ ...p, email: 'An account already exists with this email. Sign in instead.' }))
      }
      toast.error(error.message || 'Signup failed')
      setLoading(false)
    }
  }

  const checkEmail = async () => {
    const email = form.email.trim()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return
    setCheckingEmail(true)
    try {
      const result = await authApi.checkEmail(email)
      setErrors(p => ({ ...p, email: result.available ? undefined : 'An account already exists with this email. Sign in instead.' }))
    } catch (_) {
    } finally {
      setCheckingEmail(false)
    }
  }

  return (
    <main className="relative mx-auto max-w-[460px] px-5 py-14">
      {(loading || redirecting) && <AuthRedirectOverlay title={redirecting ? 'Account ready' : 'Creating account'} message={redirecting ? 'Opening your profile now.' : 'Setting up your secure account.'} />}
      <h1 className="font-display text-5xl font-bold tracking-wide mb-3">CREATE ACCOUNT</h1>
      <p className="text-sm text-ink-muted mb-8">Save addresses, track orders, and checkout securely.</p>
      <form onSubmit={submit} className="space-y-4">
        {fields.map(([label, key, type, Icon]) => (
          <label key={key} className="block">
            <span className="text-[11px] uppercase tracking-[0.12em] text-ink-muted font-semibold">{label}</span>
            <div className="mt-1.5 flex items-center gap-2 rounded-xl border border-line bg-surface-alt px-3.5 py-3">
              <Icon size={17} className="text-ink-faint" />
              <input type={type} required value={form[key]} onBlur={key === 'email' ? checkEmail : undefined} onChange={e=>{setForm(p=>({...p,[key]:e.target.value})); setErrors(p=>({...p,[key]:undefined}))}} className="w-full bg-transparent text-sm outline-none" />
            </div>
            {errors[key] && <p className="mt-1.5 text-xs font-medium text-red-500">{errors[key]}</p>}
            {key === 'email' && checkingEmail && <p className="mt-1.5 text-xs font-medium text-ink-faint">Checking email...</p>}
            {key === 'email' && errors.email?.includes('already') && <Link href={`/login?next=${encodeURIComponent(next)}`} className="mt-1.5 inline-block text-xs font-semibold text-primary hover:underline">Sign in with this email</Link>}
          </label>
        ))}
        <div className="grid grid-cols-2 gap-2 rounded-xl bg-surface-alt p-3">
          {passRules.map(rule => (
            <div key={rule.key} className={`text-xs font-medium ${rule.ok ? 'text-green-600' : 'text-ink-faint'}`}>
              {rule.ok ? 'OK' : '--'} {rule.label}
            </div>
          ))}
        </div>
        <button disabled={loading || checkingEmail || redirecting} className="w-full rounded-xl bg-primary py-3.5 text-[13px] font-bold text-white shadow-lg shadow-primary/25 transition-colors hover:bg-primary-dark disabled:opacity-60">
          {loading || checkingEmail || redirecting ? 'Please wait...' : 'Create Account'}
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
      <p className="mt-6 text-sm text-ink-muted">
        Already have an account? <Link href="/login" className="font-semibold text-primary hover:underline">Sign in</Link>
      </p>
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
