'use client'
import { useEffect, useState } from 'react'
import { Plus, Star, Pencil, Trash2 } from 'lucide-react'
import { authApi, userApi } from '@/lib/api'
import toast from 'react-hot-toast'
import { INDIAN_STATES, normalizeIndianPhone, validateAddress } from '@/lib/validation'

const blankAddress = (profile = {}) => ({
  label:'Home',
  fullName:profile.name || '',
  phone:profile.phone || '',
  addressLine1:'',
  addressLine2:'',
  city:'',
  state:'',
  pincode:''
})

export default function AddressesSection() {
  const [addrs, setAddrs]   = useState([])
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState(null)
  const [profile, setProfile] = useState({})
  const [form, setForm]     = useState(blankAddress())
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)

  const fc = (f,v) => { setForm(p=>({...p,[f]:v})); setErrors(p=>({...p,[f]:undefined})) }

  useEffect(() => {
    Promise.all([
      userApi.addresses().catch(() => []),
      authApi.me().catch(() => null)
    ]).then(([addresses, user]) => {
      setAddrs(addresses)
      if (user) {
        const nextProfile = { name:user.name || '', phone:user.phone || '' }
        setProfile(nextProfile)
        setForm(current => current.fullName || current.phone ? current : blankAddress(nextProfile))
      }
    }).finally(() => setLoading(false))
  }, [])

  const handleSave = async () => {
    const nextErrors = validateAddress(form)
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length) { toast.error('Please fix the address fields'); return }
    setSaving(true)
    try {
      const payload = { ...form, phone: normalizeIndianPhone(form.phone) }
      if (editId) {
        const saved = await userApi.updateAddress(editId, payload)
        setAddrs(a=>a.map(x=>x.id===editId?saved:x))
        toast.success('Address updated')
      } else {
        const saved = await userApi.createAddress({ ...payload, isDefault:addrs.length === 0 })
        setAddrs(a=>[...a,saved])
        toast.success('Address saved')
      }
      setShowForm(false); setEditId(null)
      setForm(blankAddress(profile))
    } catch (error) {
      toast.error(error.message || 'Address could not be saved')
    } finally {
      setSaving(false)
    }
  }

  const startEdit = a => {
    setForm({label:a.label,fullName:a.fullName,phone:a.phone,addressLine1:a.addressLine1,addressLine2:a.addressLine2,city:a.city,state:a.state,pincode:a.pincode})
    setEditId(a.id); setShowForm(true)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-7">
        <h2 className="font-display text-4xl font-bold tracking-wide">SAVED ADDRESSES</h2>
        <button disabled={loading} onClick={()=>{setShowForm(true);setEditId(null);setForm(blankAddress(profile));setErrors({})}}
          className="flex items-center gap-2 bg-primary hover:bg-primary-dark text-white px-4 py-2.5 rounded-xl text-[13px] font-semibold transition-colors shadow-md shadow-primary/25">
          <Plus size={15}/> Add Address
        </button>
      </div>

      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2].map(item => (
            <div key={item} className="rounded-2xl border border-line bg-white p-5 shadow-card">
              <div className="mb-4 h-4 w-24 animate-pulse rounded-full bg-surface-alt" />
              <div className="mb-3 h-5 w-40 animate-pulse rounded-full bg-surface-alt" />
              <div className="space-y-2">
                <div className="h-3 w-full animate-pulse rounded-full bg-surface-alt" />
                <div className="h-3 w-4/5 animate-pulse rounded-full bg-surface-alt" />
                <div className="h-3 w-2/3 animate-pulse rounded-full bg-surface-alt" />
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <div className="bg-white border border-line rounded-2xl p-6 mb-6 shadow-card">
          <p className="font-bold text-[15px] mb-5">{editId?'Edit Address':'New Address'}</p>
          <div className="grid grid-cols-2 gap-3 mb-3">
            {[['Full Name *','fullName','Recipient name'],['Phone','phone','+91 XXXXX XXXXX']].map(([l,f,ph])=>(
              <div key={f}><label className="text-[11px] uppercase tracking-[0.1em] text-ink-muted font-semibold block mb-1.5">{l}</label>
                <input value={form[f]} onChange={e=>fc(f,e.target.value)} placeholder={ph} className={`w-full bg-surface-alt border text-[13px] px-3.5 py-2.5 rounded-xl outline-none focus:border-primary/60 transition-colors ${errors[f]?'border-red-300':'border-line'}`}/>
                {errors[f] && <p className="mt-1 text-xs text-red-500">{errors[f]}</p>}
              </div>
            ))}
          </div>
          {[['Address Line 1 *','addressLine1','Flat / Building / Street'],['Address Line 2','addressLine2','Area / Locality']].map(([l,f,ph])=>(
            <div key={f} className="mb-3"><label className="text-[11px] uppercase tracking-[0.1em] text-ink-muted font-semibold block mb-1.5">{l}</label>
              <input value={form[f]} onChange={e=>fc(f,e.target.value)} placeholder={ph} className={`w-full bg-surface-alt border text-[13px] px-3.5 py-2.5 rounded-xl outline-none focus:border-primary/60 transition-colors ${errors[f]?'border-red-300':'border-line'}`}/>
              {errors[f] && <p className="mt-1 text-xs text-red-500">{errors[f]}</p>}
            </div>
          ))}
          <div className="grid grid-cols-3 gap-3 mb-4">
            {[['City *','city','City'],['PIN *','pincode','6-digit PIN']].map(([l,f,ph])=>(
              <div key={f}><label className="text-[11px] uppercase tracking-[0.1em] text-ink-muted font-semibold block mb-1.5">{l}</label>
                <input value={form[f]} onChange={e=>fc(f,e.target.value)} placeholder={ph} className={`w-full bg-surface-alt border text-[13px] px-3.5 py-2.5 rounded-xl outline-none focus:border-primary/60 transition-colors ${errors[f]?'border-red-300':'border-line'}`}/>
                {errors[f] && <p className="mt-1 text-xs text-red-500">{errors[f]}</p>}
              </div>
            ))}
            <div><label className="text-[11px] uppercase tracking-[0.1em] text-ink-muted font-semibold block mb-1.5">State *</label>
              <select value={form.state} onChange={e=>fc('state',e.target.value)} className={`w-full bg-surface-alt border text-[13px] px-3.5 py-2.5 rounded-xl outline-none focus:border-primary/60 transition-colors ${errors.state?'border-red-300':'border-line'}`}>
                <option value="">Select state</option>
                {INDIAN_STATES.map(state => <option key={state} value={state}>{state}</option>)}
              </select>
              {errors.state && <p className="mt-1 text-xs text-red-500">{errors.state}</p>}
            </div>
          </div>
          <div className="mb-5">
            <label className="text-[11px] uppercase tracking-[0.1em] text-ink-muted font-semibold block mb-1.5">Label</label>
            <select value={form.label} onChange={e=>fc('label',e.target.value)} className="bg-surface-alt border border-line text-[13px] px-3.5 py-2.5 rounded-xl outline-none">
              <option>Home</option><option>Office</option><option>Other</option>
            </select>
          </div>
          <div className="flex gap-3">
            <button onClick={handleSave} disabled={saving} className="bg-primary hover:bg-primary-dark text-white px-7 py-3 text-[13px] font-bold rounded-xl transition-colors disabled:opacity-60">
              {saving ? 'Saving...' : editId?'Update':'Save Address'}
            </button>
            <button onClick={()=>{setShowForm(false);setEditId(null)}} className="border border-line text-ink-muted px-7 py-3 text-[13px] font-semibold rounded-xl hover:border-line-dark transition-colors">
              Cancel
            </button>
          </div>
        </div>
      )}

      {!loading && <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {addrs.map(a=>(
          <div key={a.id} className={`bg-white border-2 rounded-2xl p-5 relative shadow-card ${a.isDefault?'border-primary':'border-line'}`}>
            {a.isDefault && <div className="absolute top-4 right-4"><Star size={16} className="text-primary" fill="currentColor"/></div>}
            <div className="flex items-center gap-2 mb-3 pr-7">
              <span className="text-[12px] font-bold uppercase tracking-wide text-ink">{a.label}</span>
              {a.isDefault && <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-semibold">Default</span>}
            </div>
            <p className="text-[14px] font-semibold text-ink mb-1">{a.fullName}</p>
            <p className="text-[13px] text-ink-muted leading-relaxed">{a.phone}<br/>{a.addressLine1}{a.addressLine2?', '+a.addressLine2:''}<br/>{a.city}, {a.state} — {a.pincode}</p>
            <div className="flex gap-4 mt-4 pt-4 border-t border-line">
              <button onClick={()=>startEdit(a)} className="flex items-center gap-1.5 text-[12px] text-ink-muted hover:text-primary transition-colors font-medium"><Pencil size={12}/>Edit</button>
              {!a.isDefault && <>
                <span className="text-line-dark">·</span>
                <button onClick={async()=>{await userApi.setDefaultAddress(a.id); setAddrs(a2=>a2.map(x=>({...x,isDefault:x.id===a.id})))}} className="text-[12px] text-ink-muted hover:text-primary transition-colors font-medium">Set Default</button>
              </>}
              <span className="text-line-dark">·</span>
              <button onClick={async()=>{await userApi.deleteAddress(a.id); setAddrs(a2=>a2.filter(x=>x.id!==a.id));toast.success('Address deleted')}} className="flex items-center gap-1.5 text-[12px] text-ink-muted hover:text-red-500 transition-colors font-medium"><Trash2 size={12}/>Delete</button>
            </div>
          </div>
        ))}
        <button onClick={()=>{setShowForm(true);setEditId(null);setForm(blankAddress(profile));setErrors({})}} className="border-2 border-dashed border-line rounded-2xl flex flex-col items-center justify-center gap-3 min-h-[180px] hover:border-primary hover:text-primary transition-all group text-ink-muted">
          <Plus size={26} className="group-hover:text-primary transition-colors"/>
          <span className="text-[13px] font-medium">Add New Address</span>
        </button>
      </div>}
    </div>
  )
}
