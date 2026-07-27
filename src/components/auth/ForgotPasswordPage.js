'use client'
import { useState } from 'react'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { authApi } from '@/lib/api'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [resetToken, setResetToken] = useState('')

  const submit = async (event) => {
    event.preventDefault()
    try {
      const data = await authApi.forgotPassword({ email })
      setResetToken(data.resetToken || '')
      toast.success('Reset request created')
    } catch (error) {
      toast.error(error.message || 'Could not request reset')
    }
  }

  return (
    <main className="mx-auto max-w-[420px] px-5 py-14">
      <h1 className="font-display text-5xl font-bold tracking-wide mb-3">RESET PASSWORD</h1>
      <p className="text-sm text-ink-muted mb-8">Enter your email to generate a password reset token.</p>
      <form onSubmit={submit} className="space-y-4">
        <input type="email" required value={email} onChange={e=>setEmail(e.target.value)} placeholder="Email address" className="w-full rounded-xl border border-line bg-surface-alt px-4 py-3 text-sm outline-none focus:border-primary/60" />
        <button className="w-full rounded-xl bg-primary py-3.5 text-[13px] font-bold text-white shadow-lg shadow-primary/25 hover:bg-primary-dark">Continue</button>
      </form>
      {resetToken && (
        <div className="mt-5 rounded-xl border border-line bg-surface-alt p-4 text-sm">
          <p className="mb-2 font-semibold text-ink">Development reset token</p>
          <p className="break-all text-ink-muted">{resetToken}</p>
          <Link href={`/reset-password?token=${resetToken}`} className="mt-3 inline-flex font-semibold text-primary hover:underline">Set new password</Link>
        </div>
      )}
    </main>
  )
}
