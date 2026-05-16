import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import DashboardLayout from '../../components/layout/DashboardLayout'

interface StoreSettings {
  store_name: string
  weekday_hours: string
  weekend_hours: string
  address: string
  phone: string
  email: string
  about_text: string
}

const defaults: StoreSettings = {
  store_name: 'Cozy Corner Café',
  weekday_hours: '7:00 AM – 8:00 PM',
  weekend_hours: '8:00 AM – 9:00 PM',
  address: 'Cuasi, Loon, Bohol, Philippines',
  phone: '09361679546',
  email: 'wlaniba330@gmail.com',
  about_text: '',
}

export default function AdminSettings() {
  const [form, setForm] = useState<StoreSettings>(defaults)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')

  useEffect(() => {
    supabase
      .from('store_settings')
      .select('*')
      .limit(1)
      .single()
      .then(({ data }) => {
        if (data) {
          const { id, updated_at, ...settings } = data
          setForm(settings as StoreSettings)
        }
        setLoading(false)
      })
  }, [])

  async function handleSave() {
    setSaving(true)
    setMsg('')
    const { error } = await supabase
      .from('store_settings')
      .update({ ...form, updated_at: new Date().toISOString() })
      .eq('id', 1)

    setSaving(false)
    if (error) {
      setMsg('Error: ' + error.message)
    } else {
      setMsg('Settings saved successfully.')
    }
  }

  return (
    <DashboardLayout title="Store Settings" subtitle="Manage your café information displayed on the store page">
      <div className="max-w-2xl">
        <div className="card p-8">
          {loading ? (
            <div className="flex justify-center py-12"><div className="spinner" /></div>
          ) : (
            <div className="space-y-5">
              {msg && (
                <div className={`px-4 py-3 border rounded-xl text-sm ${
                  msg.includes('Error')
                    ? 'bg-red-50 border-red-200 text-red-800'
                    : 'bg-green-50 border-green-200 text-green-800 dark:bg-green-900/40 dark:border-green-800 dark:text-green-300'
                }`}>
                  {msg} <button onClick={() => setMsg('')} className="ml-2 float-right">×</button>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="label">Store Name</label>
                  <input className="input" value={form.store_name}
                    onChange={e => setForm(f => ({ ...f, store_name: e.target.value }))} />
                </div>
                <div>
                  <label className="label">Weekday Hours</label>
                  <input className="input" value={form.weekday_hours}
                    onChange={e => setForm(f => ({ ...f, weekday_hours: e.target.value }))} />
                </div>
                <div>
                  <label className="label">Weekend Hours</label>
                  <input className="input" value={form.weekend_hours}
                    onChange={e => setForm(f => ({ ...f, weekend_hours: e.target.value }))} />
                </div>
                <div className="sm:col-span-2">
                  <label className="label">Address</label>
                  <input className="input" value={form.address}
                    onChange={e => setForm(f => ({ ...f, address: e.target.value }))} />
                </div>
                <div>
                  <label className="label">Phone</label>
                  <input className="input" value={form.phone}
                    onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
                </div>
                <div>
                  <label className="label">Email</label>
                  <input className="input" type="email" value={form.email}
                    onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
                </div>
                <div className="sm:col-span-2">
                  <label className="label">About Text</label>
                  <textarea className="input resize-none" rows={4} value={form.about_text}
                    onChange={e => setForm(f => ({ ...f, about_text: e.target.value }))} />
                </div>
              </div>

              <div className="pt-2">
                <button onClick={handleSave} disabled={saving} className="btn-primary px-8 py-3">
                  {saving ? 'Saving…' : 'Save Settings'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}
