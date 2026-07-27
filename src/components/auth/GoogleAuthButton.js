'use client'

import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { useRouter } from 'next/navigation'
import { authApi } from '@/lib/api'

const GOOGLE_SCRIPT = 'https://accounts.google.com/gsi/client'

export default function GoogleAuthButton({ label = 'Continue with Google', redirectTo = '/profile' }) {
  const router = useRouter()
  const [ready, setReady] = useState(false)
  const [loading, setLoading] = useState(false)
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID

  useEffect(() => {
    if (!clientId || typeof window === 'undefined') return
    if (window.google?.accounts?.id) {
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: handleCredentialResponse,
        ux_mode: 'popup'
      })
      setReady(true)
      return
    }

    const script = document.createElement('script')
    script.src = GOOGLE_SCRIPT
    script.async = true
    script.defer = true
    script.onload = () => {
      if (window.google?.accounts?.id) {
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: handleCredentialResponse,
          ux_mode: 'popup'
        })
        setReady(true)
      }
    }
    script.onerror = () => {
      toast.error('Unable to load Google sign-in')
    }
    document.body.appendChild(script)
    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script)
      }
    }
  }, [clientId])

  const handleCredentialResponse = async (response) => {
    if (!response?.credential) {
      toast.error('Google sign-in failed')
      setLoading(false)
      return
    }

    try {
      await authApi.googleLogin({ token: response.credential })
      toast.success('Signed in with Google')
      router.replace(redirectTo)
    } catch (error) {
      toast.error(error.message || 'Google sign-in failed')
      setLoading(false)
    }
  }

  const startGoogleSignIn = () => {
    if (!clientId) {
      toast.error('Google client ID is not configured')
      return
    }
    if (!window.google?.accounts?.id) {
      toast.error('Google sign-in is not ready yet')
      return
    }
    setLoading(true)
    window.google.accounts.id.prompt()
  }

  if (!clientId) {
    return (
      <div className="rounded-xl border border-dashed border-line bg-surface-alt p-4 text-sm text-ink-muted">
        Google sign-in is not configured. Set <span className="font-semibold">NEXT_PUBLIC_GOOGLE_CLIENT_ID</span> in your frontend environment to enable it.
      </div>
    )
  }

  return (
    <button
      type="button"
      disabled={!ready || loading}
      onClick={startGoogleSignIn}
      className={`group mx-auto flex w-full max-w-[360px] items-center justify-center gap-3 rounded-2xl border px-4 py-3.5 text-sm font-semibold transition-all duration-200 ${loading ? 'bg-slate-100 border-slate-200 text-slate-700' : 'bg-white border-slate-200 text-slate-900 shadow-sm hover:bg-slate-50 hover:border-slate-300 hover:shadow-md'} disabled:cursor-not-allowed disabled:opacity-60`}
    >
      {loading ? (
        <>
          <svg className="h-5 w-5 animate-spin text-slate-600" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <span>Signing in...</span>
        </>
      ) : (
        <>
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white shadow-sm">
            <svg viewBox="0 0 24 24" className="h-5 w-5" xmlns="http://www.w3.org/2000/svg">
              <path fill="#4285F4" d="M20.66 12.22c0-.64-.06-1.25-.17-1.84H12v3.48h4.53c-.2 1.05-.82 1.93-1.76 2.53v2.1h2.85c1.66-1.53 2.62-3.78 2.62-6.27z" />
              <path fill="#34A853" d="M12 21c2.39 0 4.42-.79 5.9-2.15l-2.85-2.1c-.79.53-1.8.84-3.05.84-2.35 0-4.34-1.58-5.05-3.7H3.97v2.32A8.99 8.99 0 0012 21z" />
              <path fill="#FBBC05" d="M6.95 13.89a5.43 5.43 0 010-3.78V7.79H3.97a8.99 8.99 0 000 8.42l2.98-2.32z" />
              <path fill="#EA4335" d="M12 6.5c1.3 0 2.45.45 3.36 1.33l2.52-2.52C16.4 3.8 14.29 2.5 12 2.5 7.94 2.5 4.44 4.99 3.97 8.78l2.98 2.32C7.64 8.07 9.66 6.5 12 6.5z" />
            </svg>
          </span>
          <span>{label}</span>
        </>
      )}
    </button>
  )
}
