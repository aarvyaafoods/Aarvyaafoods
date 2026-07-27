'use client'
import { useEffect, useState } from 'react'
import { catalogApi } from '@/lib/api'
import ProductCard from '@/components/ui/ProductCard'
import SectionHeader from '@/components/ui/SectionHeader'

export default function SaleStrip() {
  const [list, setList] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    catalogApi.products({ tag: 'SALE', limit: 4 })
      .then(r => setList(r.items || []))
      .catch(() => setList([]))
      .finally(() => setLoading(false))
  }, [])

  return (
    <section className="max-w-[1360px] mx-auto px-4 md:px-6 py-3 md:py-6 border-t border-line">
      <SectionHeader title="ON SALE NOW" sub="Big discounts on premium styles" viewAllHref="/plp?tag=SALE"/>
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
        {loading
          ? [1, 2, 3, 4].map(item => <div key={item} className="overflow-hidden rounded-2xl border border-line bg-white"><div className="aspect-[3/4] animate-pulse bg-surface-alt" /><div className="space-y-2 p-3"><div className="h-3 w-1/2 animate-pulse rounded-full bg-surface-alt" /><div className="h-4 w-4/5 animate-pulse rounded-full bg-surface-alt" /></div></div>)
          : list.map(p=><ProductCard key={p.id} product={p}/>)}
      </div>
    </section>
  )
}
