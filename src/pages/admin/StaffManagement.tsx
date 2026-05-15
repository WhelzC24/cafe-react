import { useState } from 'react'
import DashboardLayout from '../../components/layout/DashboardLayout'

interface CreateStaffForm {
  fullname: string
  username: string
  email: string
  password: string
}

export default function StaffManagement() {
  const [form, setForm] = useState<CreateStaffForm>({ fullname: '', username: '', email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    // NOTE: Creating users in Supabase requires the service role key for the
    // admin.createUser() call. Since we only have the anon key in the browser,
    // the correct production approach is a Supabase Edge Function that uses the
    // service role key securely. The code below shows that pattern clearly.
    //
    // For a quick local setup without an Edge Function you can:
    //   1. Temporarily use the Supabase dashboard to create the user.
    //   2. Or call supabase.auth.admin.createUser() from a trusted server.
    //
    // This form will POST to a Supabase Edge Function named "create-staff".

    try {
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-staff`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify(form),
      })

      const body = await res.json()
      if (!res.ok) throw new Error(body.error ?? 'Unknown error')

      setSuccess(`Staff account created for ${form.fullname} (@${form.username}).`)
      setForm({ fullname: '', username: '', email: '', password: '' })
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create staff account.')
    }

    setLoading(false)
  }

  return (
    <DashboardLayout title="Add Staff" subtitle="Create a new staff account">
      <div className="max-w-lg">
        <div className="card p-8">
          <p className="text-sm text-espresso-500 mb-6">
            Staff accounts get access to the Store Dashboard (products & orders).
            Admin accounts additionally get full User Management access.
          </p>

          {success && (
            <div className="mb-4 px-4 py-3 bg-green-50 border border-green-200 text-green-800 rounded-xl text-sm">
              {success}
            </div>
          )}
          {error && (
            <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 text-red-800 rounded-xl text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <input
                className="input"
                required
                placeholder="Full Name *"
                value={form.fullname}
                onChange={e => setForm(f => ({ ...f, fullname: e.target.value }))}
              />
            </div>
            <div>
              <input
                className="input"
                required
                placeholder="Username *"
                pattern="[a-z0-9_]+"
                title="Lowercase letters, numbers and underscores only"
                value={form.username}
                onChange={e => setForm(f => ({ ...f, username: e.target.value.toLowerCase() }))}
              />
            </div>
            <div>
              <input
                className="input"
                required
                type="email"
                placeholder="Email address *"
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              />
            </div>
            <div>
              <input
                className="input"
                required
                type="password"
                minLength={6}
                placeholder="Password *"
                value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
              />
              <p className="text-xs text-espresso-400 mt-1">Staff will be required to change this on first login.</p>
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-3">
              {loading ? (
                <><span className="inline-block w-4 h-4 border-2 border-cream/30 border-t-cream rounded-full animate-spin" /> Creating…</>
              ) : '+ Create Staff Account'}
            </button>
          </form>
        </div>

        {/* Edge Function hint */}
        <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800">
          <strong>⚠️ Edge Function required:</strong> Creating Supabase users requires a service role key.
          See <code className="font-mono">supabase/functions/create-staff/index.ts</code> in this project
          for the Edge Function code to deploy.
        </div>
      </div>
    </DashboardLayout>
  )
}
