'use client'
import { useEffect, useState } from 'react'
import Image from 'next/image'
import { X, Download, Truck, Package } from 'lucide-react'
import { HiArrowLongRight } from 'react-icons/hi2'
import { orderApi } from '@/lib/api'
import { downloadInvoice } from '@/lib/invoice'
import { formatPrice, statusColor, statusLabel } from '@/lib/utils'

export default function OrdersSection() {
  const [sel, setSel] = useState(null)
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [detailLoading, setDetailLoading] = useState(false)
  useEffect(() => {
    orderApi.list()
      .then(data => setOrders(data.items || []))
      .catch(() => setOrders([]))
      .finally(() => setLoading(false))
  }, [])
  const viewOrder = async (order) => {
    setDetailLoading(true)
    try { setSel(await orderApi.get(order.id)) }
    catch { setSel(order) }
    finally { setDetailLoading(false) }
  }

  return (
    <div>
      <h2 className="font-display text-4xl font-bold tracking-wide mb-7">MY ORDERS</h2>

      {loading && <OrdersLoading />}

      {!loading && orders.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-line bg-white px-6 py-16 text-center">
          <Package size={34} className="mb-3 text-ink-faint" />
          <p className="font-bold text-ink">No orders yet</p>
          <p className="mt-1 text-sm text-ink-muted">Your placed orders will appear here after checkout.</p>
        </div>
      )}

      {/* Desktop table */}
      {!loading && orders.length > 0 && <div className="hidden md:block bg-white border border-line rounded-2xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-surface-alt">
              {['Order #','Date','Items','Total','Status','Action'].map(h=>(
                <th key={h} className="text-left text-[11px] uppercase tracking-[0.15em] text-ink-muted font-semibold px-5 py-3.5 border-b border-line">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {orders.map(o=>(
              <tr key={o.id} className="hover:bg-surface-alt/50 transition-colors">
                <td className="px-5 py-4 text-[13px] font-bold text-ink border-b border-line">{o.orderNumber || o.id}</td>
                <td className="px-5 py-4 text-[13px] text-ink-muted border-b border-line">{new Date(o.date).toLocaleDateString('en-IN')}</td>
                <td className="px-5 py-4 text-[13px] text-ink-muted border-b border-line">{o.items || '-'} item{o.items>1?'s':''}</td>
                <td className="px-5 py-4 text-[14px] font-bold text-ink border-b border-line">{formatPrice(o.total)}</td>
                <td className="px-5 py-4 border-b border-line">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-[11px] font-semibold ${statusColor(o.status)}`}>{statusLabel(o.status)}</span>
                </td>
                <td className="px-5 py-4 border-b border-line">
                  <button type="button" onClick={()=>viewOrder(o)} className="group inline-flex items-center gap-1 text-[12px] font-semibold text-primary hover:underline">
                    View Details
                    <HiArrowLongRight className="text-sm shrink-0 transition-transform group-hover:translate-x-0.5" aria-hidden />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>}

      {/* Mobile cards */}
      {!loading && orders.length > 0 && <div className="md:hidden flex flex-col gap-4">
        {orders.map(o=>(
          <div key={o.id} className="bg-white border border-line rounded-2xl p-5">
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="text-[13px] font-bold text-ink">{o.orderNumber || o.id}</p>
                <p className="text-[12px] text-ink-muted">{new Date(o.date).toLocaleDateString('en-IN')}</p>
              </div>
              <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold ${statusColor(o.status)}`}>{statusLabel(o.status)}</span>
            </div>
            <div className="flex items-center justify-between border-t border-line pt-3">
              <p className="text-[15px] font-bold">{formatPrice(o.total)}</p>
              <button type="button" onClick={()=>viewOrder(o)} className="group inline-flex items-center gap-1 text-[13px] font-semibold text-primary hover:underline">
                View Details
                <HiArrowLongRight className="text-base shrink-0 transition-transform group-hover:translate-x-0.5" aria-hidden />
              </button>
            </div>
          </div>
        ))}
      </div>}

      {detailLoading && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/35 p-4">
          <div className="rounded-2xl bg-white px-7 py-5 text-center shadow-2xl">
            <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            <p className="text-sm font-semibold text-ink-muted">Loading order details...</p>
          </div>
        </div>
      )}

      {/* Modal */}
      {sel && (
        <div className="fixed inset-0 bg-black/50 z-[1000] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-[640px] w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between p-6 border-b border-line">
              <div>
                <p className="text-[11px] uppercase tracking-[0.15em] text-ink-faint mb-1">Order Details</p>
                <h3 className="font-display text-[26px] font-bold">{sel.orderNumber || sel.id}</h3>
              </div>
              <button onClick={()=>setSel(null)} className="w-9 h-9 rounded-xl bg-surface-alt flex items-center justify-center text-ink-muted hover:text-ink transition-colors" aria-label="Close">
                <X size={18}/>
              </button>
            </div>
            <div className="p-6">
              <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
                <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-[12px] font-semibold ${statusColor(sel.status)}`}>{statusLabel(sel.status)}</span>
                <span className="text-[13px] text-ink-muted">{sel.date}</span>
              </div>

              <p className="text-[11px] uppercase tracking-[0.15em] text-ink-muted font-semibold mb-3">Items</p>
              <div className="border border-line rounded-xl overflow-hidden mb-5">
                {(sel.products || []).map((item,i)=>{
                  return (
                    <div key={i} className="flex gap-4 p-4 border-b border-line last:border-0">
                      <div className="relative w-14 h-18 bg-surface-alt rounded-xl overflow-hidden flex-shrink-0" style={{height:'72px'}}>
                        {item.image && <Image src={item.image} alt={item.name} fill sizes="56px" className="object-cover"/>}
                      </div>
                      <div className="flex-1">
                        <p className="text-[11px] text-ink-faint uppercase tracking-wide">{item.brand}</p>
                        <p className="text-[14px] font-semibold text-ink">{item.name}</p>
                        <p className="text-[12px] text-ink-muted">Variant: {item.size} · Qty: {item.qty}</p>
                      </div>
                      <p className="font-bold text-[14px] flex-shrink-0">{formatPrice(item.unitPrice*item.qty)}</p>
                    </div>
                  )
                })}
              </div>

              <div className="bg-surface-alt rounded-xl p-4 mb-5">
                <div className="flex justify-between text-[13px] text-ink-muted mb-2"><span>Subtotal</span><span>{formatPrice(sel.total)}</span></div>
                <div className="flex justify-between text-[13px] text-ink-muted mb-2"><span>Shipping</span><span className="text-green-600 font-medium">FREE</span></div>
                <div className="flex justify-between text-[16px] font-bold text-ink pt-2.5 border-t border-line"><span>Total</span><span>{formatPrice(sel.total)}</span></div>
              </div>

              {sel.status!=='cancelled' && (
                <div className="flex gap-3 flex-wrap">
                  <button onClick={() => downloadInvoice(sel, 'a4')} className="flex-1 flex items-center justify-center gap-2 border border-line rounded-xl py-3 text-[13px] font-semibold text-ink-mid hover:border-primary hover:text-primary transition-all">
                    <Download size={15}/> Invoice
                  </button>
                  {sel.trackingLink && (
                    <a href={sel.trackingLink} target="_blank" rel="noreferrer"
                      className="flex-1 flex items-center justify-center gap-2 bg-primary text-white rounded-xl py-3 text-[13px] font-semibold hover:bg-primary-dark transition-colors">
                      <Truck size={15}/> Track Order
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function OrdersLoading() {
  return (
    <div className="space-y-4">
      <div className="hidden overflow-hidden rounded-2xl border border-line bg-white md:block">
        <div className="grid grid-cols-6 gap-4 border-b border-line bg-surface-alt px-5 py-4">
          {[1, 2, 3, 4, 5, 6].map(item => <div key={item} className="h-3 animate-pulse rounded-full bg-line" />)}
        </div>
        {[1, 2, 3, 4].map(row => (
          <div key={row} className="grid grid-cols-6 gap-4 border-b border-line px-5 py-5 last:border-0">
            {[1, 2, 3, 4, 5, 6].map(item => <div key={item} className="h-4 animate-pulse rounded-full bg-surface-alt" />)}
          </div>
        ))}
      </div>
      <div className="flex flex-col gap-4 md:hidden">
        {[1, 2, 3].map(item => <div key={item} className="h-32 animate-pulse rounded-2xl border border-line bg-white" />)}
      </div>
    </div>
  )
}
