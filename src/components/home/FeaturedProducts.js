'use client'
import { useEffect, useState } from 'react'
import { catalogApi } from '@/lib/api'
import ProductCard from '@/components/ui/ProductCard'
import SectionHeader from '@/components/ui/SectionHeader'

export default function FeaturedProducts() {
  const [list, setList] = useState([])
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    catalogApi.products({ featured: true, limit: 8 }).then(r => setList(r.items || [])).catch(() => setList([])).finally(() => setLoading(false))
  }, [])
  return (
    <section className="max-w-[1360px] mx-auto px-4 md:px-6 py-3 md:py-6">
      {!loading && <SectionHeader title="FEATURED STYLES" sub="Curated picks from top brands" viewAllHref="/plp"/>}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-5">
        {loading && Array.from({ length: 8 }, (_, i) => <div key={i} className="aspect-[3/5] animate-pulse rounded-xl bg-surface-alt" />)}
        {!loading && list.map(p=><ProductCard key={p.id} product={p}/>)}
      </div>
    </section>
  )
}
