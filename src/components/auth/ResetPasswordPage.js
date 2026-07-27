'use client'
import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import toast from 'react-hot-toast'
import { authApi } from '@/lib/api'

export default function ResetPasswordPage() {
  const router = useRouter()
  const sp = useSearchParams()
  const [token, setToken] = useState(sp.get('token') || '')
  const [password, setPassword] = useState('')

  const submit = async (event) => {
    event.preventDefault()
    try {
      await authApi.resetPassword({ token, password })
      toast.success('Password updated')
      router.push('/login')
    } catch (error) {
      toast.error(error.message || 'Could not reset password')
    }
  }

  return (
    <main className="mx-auto max-w-[420px] px-5 py-14">
      <h1 className="font-display text-5xl font-bold tracking-wide mb-3">NEW PASSWORD</h1>
      <form onSubmit={submit} className="space-y-4">
        <input required value={token} onChange={e=>setToken(e.target.value)} placeholder="Reset token" className="w-full rounded-xl border border-line bg-surface-alt px-4 py-3 text-sm outline-none focus:border-primary/60" />
        <input type="password" required minLength={8} value={password} onChange={e=>setPassword(e.target.value)} placeholder="New password" className="w-full rounded-xl border border-line bg-surface-alt px-4 py-3 text-sm outline-none focus:border-primary/60" />
        <button className="w-full rounded-xl bg-primary py-3.5 text-[13px] font-bold text-white shadow-lg shadow-primary/25 hover:bg-primary-dark">Update Password</button>
      </form>
    </main>
  )
}
