'use client'
import Link from 'next/link'
import { HiArrowLongRight } from 'react-icons/hi2'

export default function SectionHeader({ title, sub, viewAllHref }) {
  return (
    <div className="relative mb-8 md:mb-10">
      <div className="text-center max-w-4xl mx-auto px-2">
        <h2 className="font-display whitespace-nowrap text-[clamp(1.7rem,9vw,2rem)] sm:text-[2.35rem] md:text-[2.75rem] lg:text-[3rem] font-bold tracking-wide text-ink leading-tight">
          {title}
        </h2>
        {sub && (
          <p className="text-[15px] md:text-base text-ink-muted mt-2 md:mt-3 max-w-xl mx-auto leading-relaxed">
            {sub}
          </p>
        )}
      </div>
      {viewAllHref && (
        <Link
          href={viewAllHref}
          className="group/view mt-4 md:mt-0 md:absolute md:top-1/2 md:right-0 md:-translate-y-1/2 inline-flex items-center justify-center gap-2 text-[15px] font-semibold text-primary hover:text-primary-dark transition-colors w-full md:w-auto"
        >
          <span>View All</span>
          <HiArrowLongRight className="text-lg shrink-0 transition-transform group-hover/view:translate-x-0.5" aria-hidden />
        </Link>
      )}
    </div>
  )
}
