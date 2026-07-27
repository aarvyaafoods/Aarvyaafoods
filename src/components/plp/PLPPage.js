'use client'
import { useState, useMemo, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { SlidersHorizontal, X, ChevronDown, PanelLeftClose, PanelLeft, ArrowUpDown, Check } from 'lucide-react'
import { catalogApi } from '@/lib/api'
import ProductCard from '@/components/ui/ProductCard'
import Breadcrumb from '@/components/ui/Breadcrumb'

const SORT   = [{v:'newest',l:'Newest'},{v:'price-asc',l:'Price: Low to High'},{v:'price-desc',l:'Price: High to Low'},{v:'discount',l:'Biggest Discount'},{v:'rating',l:'Top Rated'}]
const SUBCATEGORY_LABELS = {
  't-shirts': 'T-Shirts',
  trousers: 'Trousers',
  joggers: 'Joggers',
  jeans: 'Jeans',
  blazers: 'Blazers',
  sweaters: 'Sweaters',
  skirts: 'Skirts',
  'co-ords': 'Co-ord Sets',
  tops: 'Tops',
  jackets: 'Jackets',
  'midi-dresses': 'Midi Dresses',
  'maxi-dresses': 'Maxi Dresses',
  bags: 'Bags',
  backpacks: 'Backpacks',
  wallets: 'Wallets',
  jewellery: 'Jewellery',
}

const titleCase = (value) => (SUBCATEGORY_LABELS[value] || value.split('-').map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(' '))
function FilterSidebar({ selectedSizes, selectedColors, selectedBrands, selectedSubcategories, maxPrice, onSize, onColor, onBrand, onSubcategory, onMax, onClear, allColors, allSubcategories, allBrands, allSizes }) {
  return (
    <div className="space-y-7">
      {/* Price */}
      <div>
        <p className="text-xs uppercase tracking-[0.15em] font-semibold text-ink mb-3 pb-2 border-b border-line">Price Range</p>
        <input type="range" min={200} max={10000} step={100} value={maxPrice} onChange={e=>onMax(Number(e.target.value))} className="w-full"/>
        <div className="flex justify-between text-sm text-ink-muted mt-1"><span>₹200</span><span>₹{maxPrice.toLocaleString('en-IN')}</span></div>
      </div>
      {/* Size */}
      <div>
        <p className="text-xs uppercase tracking-[0.15em] font-semibold text-ink mb-3 pb-2 border-b border-line">Size</p>
        <div className="flex flex-wrap gap-2">
          {allSizes.map(s=>(
            <button key={s} onClick={()=>onSize(s)}
              className={`w-10 h-10 rounded-lg text-sm font-medium border transition-all ${selectedSizes.includes(s)?'bg-primary text-white border-primary':'border-line text-ink-mid hover:border-primary hover:text-primary'}`}>
              {s}
            </button>
          ))}
        </div>
      </div>
      {/* Style */}
      {allSubcategories.length > 0 && (
        <div>
          <p className="text-xs uppercase tracking-[0.15em] font-semibold text-ink mb-3 pb-2 border-b border-line">Style</p>
          <div className="flex flex-col gap-2">
            {allSubcategories.map(s=>(
              <label key={s.value} className="flex items-center gap-2.5 cursor-pointer group">
                <input type="checkbox" checked={selectedSubcategories.includes(s.value)} onChange={()=>onSubcategory(s.value)} className="w-4 h-4 rounded"/>
                <span className="text-sm text-ink-mid group-hover:text-ink transition-colors">{s.label}</span>
              </label>
            ))}
          </div>
        </div>
      )}
      {/* Color */}
      <div>
        <p className="text-xs uppercase tracking-[0.15em] font-semibold text-ink mb-3 pb-2 border-b border-line">Colour</p>
        <div className="flex flex-col gap-2">
          {allColors.map(c=>(
            <label key={c.name} className="flex items-center gap-2.5 cursor-pointer group">
              <input type="checkbox" checked={selectedColors.includes(c.name)} onChange={()=>onColor(c.name)} className="w-4 h-4 rounded"/>
              <span
                aria-hidden
                style={{ background: c.hex }}
                className="h-4 w-4 rounded-full border border-line shadow-sm ring-1 ring-black/5"
              />
              <span className="text-sm text-ink-mid group-hover:text-ink transition-colors">{c.name}</span>
            </label>
          ))}
        </div>
      </div>
      {/* Brand */}
      <div>
        <p className="text-xs uppercase tracking-[0.15em] font-semibold text-ink mb-3 pb-2 border-b border-line">Brand</p>
        <div className="flex flex-col gap-2">
          {allBrands.map(b=>(
            <label key={b} className="flex items-center gap-2.5 cursor-pointer group">
              <input type="checkbox" checked={selectedBrands.includes(b)} onChange={()=>onBrand(b)} className="w-4 h-4 rounded"/>
              <span className="text-sm text-ink-mid group-hover:text-ink transition-colors">{b}</span>
            </label>
          ))}
        </div>
      </div>
      <button onClick={onClear} className="w-full py-2.5 border border-line rounded-lg text-sm text-ink-muted hover:border-primary hover:text-primary transition-all">
        Clear All Filters
      </button>
    </div>
  )
}

function PLPContent() {
  const sp = useSearchParams()
  const cat = sp.get('category')||'', tag = sp.get('tag')||'', q = sp.get('q')||'', subcategory = sp.get('subcategory')||''

  const [sort, setSort]          = useState('newest')
  const [products, setProducts]  = useState([])
  const [productsLoading, setProductsLoading] = useState(true)
  const [filters, setFilters]    = useState({ brands: [], colors: [], sizes: [], subcategories: [] })
  const [selSizes, setSelSizes]  = useState([])
  const [selColors, setSelColors]= useState([])
  const [selBrands, setSelBrands]= useState([])
  const [selSubcategories, setSelSubcategories]= useState(subcategory ? [subcategory] : [])
  const [maxPrice, setMaxPrice]  = useState(10000)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [drawerClosing, setDrawerClosing] = useState(false)
  const [sortDrawerOpen, setSortDrawerOpen] = useState(false)
  const [sortDrawerClosing, setSortDrawerClosing] = useState(false)
  const [desktopFiltersOpen, setDesktopFiltersOpen] = useState(true)

  useEffect(() => {
    setSelSubcategories(subcategory ? [subcategory] : [])
  }, [subcategory])

  useEffect(() => {
    catalogApi.filters({ category: cat }).then(data => setFilters({
      brands: data.brands || [],
      colors: data.colors || [],
      sizes: data.sizes || [],
      subcategories: data.subcategories || []
    })).catch(() => setFilters({ brands: [], colors: [], sizes: [], subcategories: [] }))
  }, [cat])

  useEffect(() => {
    setProductsLoading(true)
    catalogApi.products({
      category: cat,
      tag,
      q,
      subcategory: selSubcategories.join(','),
      size: selSizes,
      color: selColors,
      brand: selBrands,
      maxPrice,
      sort,
      limit: 100
    }).then(data => setProducts(data.items || [])).catch(() => setProducts([])).finally(() => setProductsLoading(false))
  }, [cat, tag, q, selSubcategories, selSizes, selColors, selBrands, maxPrice, sort])

  const allColors = useMemo(() => filters.colors || [], [filters.colors])

  const allSubcategories = useMemo(() => {
    const values = new Set(filters.subcategories || [])
    if (subcategory) values.add(subcategory)
    return Array.from(values).map(value=>({ value, label:titleCase(value) }))
  }, [filters.subcategories, subcategory])

  const toggle = (arr, setArr, val) => setArr(a=>a.includes(val)?a.filter(x=>x!==val):[...a,val])

  const filtered = useMemo(()=>{
    return products
  },[products])

  const clearAll = () => { setSelSubcategories([]); setSelSizes([]); setSelColors([]); setSelBrands([]); setMaxPrice(10000) }
  const hasFilters = selSubcategories.length||selSizes.length||selColors.length||selBrands.length||maxPrice<10000
  const openFilterDrawer = () => { setDrawerClosing(false); setDrawerOpen(true) }
  const closeFilterDrawer = () => {
    setDrawerClosing(true)
    window.setTimeout(() => {
      setDrawerOpen(false)
      setDrawerClosing(false)
    }, 220)
  }
  const openSortDrawer = () => { setSortDrawerClosing(false); setSortDrawerOpen(true) }
  const closeSortDrawer = () => {
    setSortDrawerClosing(true)
    window.setTimeout(() => {
      setSortDrawerOpen(false)
      setSortDrawerClosing(false)
    }, 220)
  }

  const title = subcategory ? titleCase(subcategory) : cat ? cat.charAt(0).toUpperCase()+cat.slice(1) : tag ? tag==='SALE'?'Sale':tag==='NEW'?'New Arrivals':tag : q ? `"${q}"` : 'All Products'

  return (
    <div className="max-w-[1360px] mx-auto px-4 md:px-6">
      <Breadcrumb crumbs={[{label:'Home',href:'/'},{label:title}]}/>

      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3 mb-6 pb-4 border-b border-line flex-wrap">
        <h1 className="font-display text-[1.75rem] md:text-[2rem] font-bold tracking-wide">{title.toUpperCase()}</h1>
        <div className="flex items-center gap-3 flex-wrap">
          <button
            type="button"
            onClick={() => setDesktopFiltersOpen((v) => !v)}
            className="hidden lg:inline-flex items-center gap-2 border border-line text-ink-mid text-sm px-3.5 py-2 rounded-lg hover:border-primary hover:text-primary transition-all"
            aria-expanded={desktopFiltersOpen}
            aria-controls="plp-filters-sidebar"
          >
            {desktopFiltersOpen ? (
              <>
                <PanelLeftClose size={16} aria-hidden /> Hide filters
              </>
            ) : (
              <>
                <PanelLeft size={16} aria-hidden /> Show filters
              </>
            )}
          </button>
          <button onClick={openFilterDrawer}
            className="lg:hidden flex items-center gap-2 border border-line text-ink-mid text-sm px-3.5 py-2 rounded-lg hover:border-primary hover:text-primary transition-all">
            <SlidersHorizontal size={15}/> Filters {hasFilters && <span className="bg-primary text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center">{selSubcategories.length+selSizes.length+selColors.length+selBrands.length+(maxPrice<10000?1:0)}</span>}
          </button>
          <button onClick={openSortDrawer}
            className="lg:hidden flex items-center gap-2 border border-line text-ink-mid text-sm px-3.5 py-2 rounded-lg hover:border-primary hover:text-primary transition-all">
            <ArrowUpDown size={15}/>{SORT.find(o=>o.v===sort)?.l || 'Sort'}
          </button>
          <div className="relative hidden lg:block">
            <select value={sort} onChange={e=>setSort(e.target.value)} aria-label="Sort"
              className="appearance-none bg-surface-alt border border-line text-sm text-ink-mid pl-3.5 pr-8 py-2 rounded-lg outline-none focus:border-primary cursor-pointer">
              {SORT.map(o=><option key={o.v} value={o.v}>{o.l}</option>)}
            </select>
            <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-ink-faint pointer-events-none"/>
          </div>
          <span className="text-sm text-ink-muted">{productsLoading ? 'Loading products...' : `${filtered.length} products`}</span>
          {hasFilters && <button onClick={clearAll} className="text-sm text-primary flex items-center gap-1"><X size={14}/>Clear</button>}
        </div>
      </div>

      <div className="flex items-start gap-5 bg-white pb-10 md:gap-8">
          {/* Desktop sidebar */}
          <aside className={`hidden w-64 flex-shrink-0 self-start transition-[opacity,transform] duration-200 xl:w-72 ${desktopFiltersOpen ? 'lg:sticky lg:top-20 lg:block lg:h-[calc(100vh-80px)]' : 'lg:hidden'}`}>
            <div className="relative h-full">
              <aside
                id="plp-filters-sidebar"
                className="no-scrollbar h-full overflow-y-auto overscroll-contain pb-8 pr-3 pt-1"
              >
                <FilterSidebar selectedSizes={selSizes} selectedColors={selColors} selectedBrands={selBrands} selectedSubcategories={selSubcategories} maxPrice={maxPrice} allColors={allColors} allSubcategories={allSubcategories}
                  allBrands={filters.brands || []}
                  allSizes={filters.sizes || []}
                  onSize={v=>toggle(selSizes,setSelSizes,v)} onColor={v=>toggle(selColors,setSelColors,v)} onBrand={v=>toggle(selBrands,setSelBrands,v)}
                  onSubcategory={v=>toggle(selSubcategories,setSelSubcategories,v)}
                  onMax={setMaxPrice} onClear={clearAll}/>
              </aside>
              <div className="pointer-events-none absolute inset-x-0 top-0 hidden h-6 bg-gradient-to-b from-white to-white/0 lg:block" />
              <div className="pointer-events-none absolute inset-x-0 bottom-0 hidden h-10 bg-gradient-to-t from-white to-white/0 lg:block" />
            </div>
          </aside>
          {/* Grid */}
          <div className="relative min-w-0 flex-1">
            <main className="min-w-0">
              {productsLoading
                ? <ProductGridLoading desktopFiltersOpen={desktopFiltersOpen} />
                : filtered.length===0
                ? <div className="text-center py-20"><p className="font-display text-3xl font-bold mb-2">NO RESULTS</p><p className="text-ink-muted mb-5">Try adjusting filters</p><button onClick={clearAll} className="text-primary font-semibold underline">Clear filters</button></div>
                : <div className={`grid grid-cols-2 md:grid-cols-2 gap-4 pb-10 md:gap-5 ${desktopFiltersOpen ? 'lg:grid-cols-3' : 'lg:grid-cols-4'}`}>{filtered.map(p=><ProductCard key={p.id} product={p}/>)}</div>
              }
            </main>
          </div>
      </div>

      {/* Mobile filter drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-[300] lg:hidden">
          <div className={`absolute inset-0 bg-black/50 ${drawerClosing ? 'opacity-0 transition-opacity duration-200' : 'drawer-backdrop-in'}`} onClick={closeFilterDrawer}/>
          <div className={`${drawerClosing ? 'drawer-right-out' : 'drawer-right-in'} absolute right-0 top-0 bottom-0 w-72 bg-white shadow-2xl flex flex-col`}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-line">
              <span className="font-semibold text-[14px]">Filters</span>
              <button onClick={closeFilterDrawer}><X size={18} className="text-ink-muted"/></button>
            </div>
            <div className="flex-1 overflow-y-auto p-5">
              <FilterSidebar selectedSizes={selSizes} selectedColors={selColors} selectedBrands={selBrands} selectedSubcategories={selSubcategories} maxPrice={maxPrice} allColors={allColors} allSubcategories={allSubcategories}
                allBrands={filters.brands || []}
                allSizes={filters.sizes || []}
                onSize={v=>toggle(selSizes,setSelSizes,v)} onColor={v=>toggle(selColors,setSelColors,v)} onBrand={v=>toggle(selBrands,setSelBrands,v)}
                onSubcategory={v=>toggle(selSubcategories,setSelSubcategories,v)}
                onMax={setMaxPrice} onClear={clearAll}/>
            </div>
            <div className="p-4 border-t border-line">
              <button onClick={closeFilterDrawer} className="w-full bg-primary text-white py-3 rounded-xl text-[13px] font-semibold">Apply Filters</button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile sort drawer */}
      {sortDrawerOpen && (
        <div className="fixed inset-0 z-[300] lg:hidden">
          <div className={`absolute inset-0 bg-black/50 ${sortDrawerClosing ? 'opacity-0 transition-opacity duration-200' : 'drawer-backdrop-in'}`} onClick={closeSortDrawer}/>
          <div className={`${sortDrawerClosing ? 'drawer-right-out' : 'drawer-right-in'} absolute right-0 top-0 bottom-0 w-72 bg-white shadow-2xl flex flex-col`}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-line">
              <span className="font-semibold text-[14px]">Sort By</span>
              <button onClick={closeSortDrawer}><X size={18} className="text-ink-muted"/></button>
            </div>
            <div className="flex-1 overflow-y-auto p-3">
              {SORT.map(option => (
                <button
                  key={option.v}
                  type="button"
                  onClick={() => {
                    setSort(option.v)
                    closeSortDrawer()
                  }}
                  className={`flex w-full items-center justify-between rounded-xl px-4 py-3 text-left text-sm transition-colors ${sort === option.v ? 'bg-primary/10 font-semibold text-primary' : 'text-ink-mid hover:bg-surface-alt'}`}
                >
                  {option.l}
                  {sort === option.v && <Check size={17} aria-hidden />}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function ProductGridLoading({ desktopFiltersOpen }) {
  return (
    <div className={`grid grid-cols-2 md:grid-cols-2 gap-4 pb-10 md:gap-5 ${desktopFiltersOpen ? 'lg:grid-cols-3' : 'lg:grid-cols-4'}`}>
      {Array.from({ length: desktopFiltersOpen ? 9 : 12 }).map((_, index) => (
        <div key={index} className="overflow-hidden rounded-2xl border border-line bg-white">
          <div className="aspect-[3/4] animate-pulse bg-surface-alt" />
          <div className="space-y-2 p-3">
            <div className="h-3 w-1/2 animate-pulse rounded-full bg-surface-alt" />
            <div className="h-4 w-4/5 animate-pulse rounded-full bg-surface-alt" />
            <div className="h-4 w-1/3 animate-pulse rounded-full bg-surface-alt" />
          </div>
        </div>
      ))}
    </div>
  )
}

export default function PLPPage() {
  return <Suspense fallback={<div className="py-20 text-center text-ink-muted">Loading...</div>}><PLPContent/></Suspense>
}
