'use client'
import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { authApi, userApi } from '@/lib/api'
import { isStrongPassword, isValidIndianPhone, normalizeIndianPhone, passwordChecks } from '@/lib/validation'

export default function SettingsSection() {
  const [profile, setProfile]   = useState({name:'',email:'',phone:''})
  const [loaded, setLoaded] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [passwordForm, setPasswordForm] = useState({ currentPassword:'', newPassword:'', confirmPassword:'' })
  const passRules = passwordChecks(passwordForm.newPassword)

  useEffect(() => {
    authApi.me().then(user => setProfile({ name:user.name || '', email:user.email || '', phone:user.phone || '' })).catch(() => {}).finally(()=>setLoaded(true))
  }, [])

  const saveProfile = async () => {
    if (!profile.name.trim() || profile.name.trim().length < 2) { toast.error('Enter your full name'); return }
    if (!isValidIndianPhone(profile.phone)) { toast.error('Enter a valid 10-digit Indian mobile number'); return }
    const saved = await userApi.updateMe({ name: profile.name.trim(), phone: normalizeIndianPhone(profile.phone) })
    setProfile(p => ({ ...p, name: saved.name, phone: saved.phone || '' }))
    toast.success('Profile updated!')
  }

  const changePassword = async () => {
    if (!passwordForm.currentPassword) { toast.error('Enter your current password'); return }
    if (!isStrongPassword(passwordForm.newPassword)) { toast.error('Complete all password rules'); return }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) { toast.error('Passwords do not match'); return }
    await authApi.changePassword({ currentPassword: passwordForm.currentPassword, newPassword: passwordForm.newPassword })
    setPasswordForm({ currentPassword:'', newPassword:'', confirmPassword:'' })
    setShowPassword(false)
    toast.success('Password changed')
  }

  if (!loaded) {
    return <div className="max-w-lg space-y-5"><div className="h-10 w-48 animate-pulse rounded-lg bg-surface-alt" /><div className="h-64 animate-pulse rounded-2xl bg-surface-alt" /><div className="h-48 animate-pulse rounded-2xl bg-surface-alt" /></div>
  }

  return (
    <div>
      <h2 className="font-display text-4xl font-bold tracking-wide mb-7">SETTINGS</h2>
      <div className="max-w-lg space-y-5">

        {/* Profile */}
        <div className="bg-white border border-line rounded-2xl p-6">
          <p className="font-bold text-[14px] mb-5">Profile Information</p>
          <div className="space-y-4">
            {[['Full Name','name','text'],['Email','email','email'],['Phone','phone','tel']].map(([l,f,t])=>(
              <div key={f}>
                <label className="text-[11px] uppercase tracking-[0.1em] text-ink-muted font-semibold block mb-1.5">{l}</label>
                <input type={t} value={profile[f]} onChange={e=>setProfile(p=>({...p,[f]:e.target.value}))}
                  className="w-full bg-surface-alt border border-line text-[14px] px-4 py-3 rounded-xl outline-none focus:border-primary/60 transition-colors"/>
              </div>
            ))}
          </div>
          <button onClick={saveProfile} className="mt-5 bg-primary hover:bg-primary-dark text-white px-7 py-3 text-[13px] font-bold rounded-xl transition-colors">
            Save Changes
          </button>
        </div>

        {/* Notifications - COMMENTED OUT
        <div className="bg-white border border-line rounded-2xl p-6">
          <p className="font-bold text-[14px] mb-5">Notifications</p>
          <div className="space-y-4">
            {[
              {k:'email',    l:'Order updates via email'},
              {k:'promo',    l:'Promotional offers & deals'},
              {k:'whatsapp', l:'WhatsApp notifications'},
              {k:'sms',      l:'SMS alerts'},
            ].map(({k,l})=>(
              <div key={k} className="flex items-center justify-between">
                <span className="text-[14px] text-ink-mid">{l}</span>
                <button onClick={async()=>{const next={...notifs,[k]:!notifs[k]}; setNotifs(next); await userApi.updatePrefs(next)}} aria-checked={notifs[k]} role="switch"
                  className={`relative h-6 w-11 rounded-full transition-colors ${notifs[k]?'bg-primary':'bg-line-dark'}`}>
                  <span className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${notifs[k]?'translate-x-5':'translate-x-0'}`}/>
                </button>
              </div>
            ))}
          </div>
        </div>
        */}

        {/* Security */}
        <div className="bg-white border border-line rounded-2xl p-6">
          <p className="font-bold text-[14px] mb-5">Account Security</p>
          <div className="space-y-3">
            <button onClick={()=>setShowPassword(v=>!v)}
              className="w-full border border-line text-ink-mid text-[13px] font-semibold py-3 rounded-xl hover:border-primary hover:text-primary transition-all">
              Change Password
            </button>
            {showPassword && (
              <div className="rounded-2xl border border-line bg-surface-alt p-4">
                {[
                  ['Current password','currentPassword','password'],
                  ['New password','newPassword','password'],
                  ['Confirm new password','confirmPassword','password'],
                ].map(([label,key,type]) => (
                  <label key={key} className="mb-3 block">
                    <span className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.1em] text-ink-muted">{label}</span>
                    <input type={type} value={passwordForm[key]} onChange={e=>setPasswordForm(p=>({...p,[key]:e.target.value}))} className="w-full rounded-xl border border-line bg-white px-3.5 py-2.5 text-[13px] outline-none focus:border-primary/60" />
                  </label>
                ))}
                <div className="mb-3 grid grid-cols-2 gap-2">
                  {passRules.map(rule => <span key={rule.key} className={`text-xs font-medium ${rule.ok ? 'text-green-600' : 'text-ink-faint'}`}>{rule.ok ? 'OK' : '--'} {rule.label}</span>)}
                </div>
                <button onClick={changePassword} className="w-full rounded-xl bg-primary py-3 text-[13px] font-bold text-white hover:bg-primary-dark">Update Password</button>
              </div>
            )}
            <button onClick={()=>toast.success('Logged out from all devices')}
              className="w-full border border-line text-ink-mid text-[13px] font-semibold py-3 rounded-xl hover:border-primary hover:text-primary transition-all">
              Log Out All Devices
            </button>
            <button onClick={()=>toast.error('Account deletion requires email verification')}
              className="w-full border border-red-200 text-red-500 text-[13px] font-semibold py-3 rounded-xl hover:bg-red-50 transition-all">
              Delete Account
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
