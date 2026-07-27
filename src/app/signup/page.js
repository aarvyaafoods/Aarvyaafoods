import SignupPage from '@/components/auth/SignupPage'
import { Suspense } from 'react'

export default function Page() {
  return <Suspense fallback={null}><SignupPage /></Suspense>
}
