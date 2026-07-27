import Link from 'next/link'
import MainLayout from '@/components/layout/MainLayout'
export default function NotFound() {
  return (
    <MainLayout>
      <div className="max-w-[1360px] mx-auto px-6 py-28 text-center">
        <p className="font-display text-[140px] font-bold text-surface-raised select-none leading-none">404</p>
        <h1 className="font-display text-5xl font-bold tracking-wide mb-4 -mt-4">PAGE NOT FOUND</h1>
        <p className="text-ink-muted text-[15px] mb-10">The page you&apos;re looking for doesn&apos;t exist or has moved.</p>
        <div className="flex gap-4 justify-center">
          <Link href="/" className="bg-primary hover:bg-primary-dark text-white px-9 py-4 rounded-xl font-bold text-[13px] transition-all shadow-lg shadow-primary/25">Go Home</Link>
          <Link href="/plp" className="border-2 border-line hover:border-primary text-ink-mid hover:text-primary px-9 py-4 rounded-xl font-semibold text-[13px] transition-all">Shop Now</Link>
        </div>
      </div>
    </MainLayout>
  )
}
