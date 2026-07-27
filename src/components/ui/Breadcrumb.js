'use client'
import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
export default function Breadcrumb({ crumbs }) {
  return (
    <nav className="flex items-center gap-1.5 py-4 text-sm text-ink-muted" aria-label="Breadcrumb">
      {crumbs.map((c,i)=>(
        <span key={i} className="flex items-center gap-1.5">
          {i>0 && <ChevronRight size={11} className="text-line-dark"/>}
          {c.href ? <Link href={c.href} className="hover:text-primary transition-colors">{c.label}</Link> : <span className="text-ink font-medium">{c.label}</span>}
        </span>
      ))}
    </nav>
  )
}
