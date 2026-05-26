import { useState } from 'react'
import DashboardLayout from '../../components/layout/DashboardLayout'
import Modal from '../../components/ui/Modal'
import { supabase } from '../../lib/supabase'

const DEFAULT_STAFF_PASSWORD = '123456'

interface CreateStaffForm {
  fullname: string
  username: string
  email: string
}

interface CreatedStaffAccount {
  fullname: string
  username: string
  email: string
  password: string
  userId?: string
}

export default function StaffManagement() {
  const [form, setForm] = useState<CreateStaffForm>({ fullname: '', username: '', email: '' })
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')
  const [createdAccount, setCreatedAccount] = useState<CreatedStaffAccount | null>(null)

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const { data: sessionData } = await supabase.auth.getSession()
      const accessToken = sessionData.session?.access_token

      if (!accessToken) {
        throw new Error('You must be signed in to create staff accounts.')
      }

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-staff`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          ...form,
          password: DEFAULT_STAFF_PASSWORD,
        }),
      })

      const responseBody = await response.json().catch(() => null)

      if (!response.ok) {
        throw new Error(responseBody?.error ?? 'Failed to create staff account.')
      }

      if (!responseBody?.success) {
        throw new Error('Failed to create staff account.')
      }

      setCreatedAccount({
        fullname: form.fullname,
        username: form.username,
        email: form.email,
        password: DEFAULT_STAFF_PASSWORD,
        userId: responseBody.userId,
      })
      setSuccess(`Staff account created for ${form.fullname} (@${form.username}).`)
      setForm({ fullname: '', username: '', email: '' })
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create staff account.')
    }

    setLoading(false)
  }

  return (
    <DashboardLayout title="Add Staff" subtitle="Create a new staff account">
      <div className="max-w-lg">
        <Modal
          open={Boolean(createdAccount)}
          onClose={() => setCreatedAccount(null)}
          title="Staff Account Created"
          maxWidth="max-w-lg"
        >
          {createdAccount && (
            <div className="space-y-4 text-sm text-espresso-700 dark:text-espresso-100">
              <p className="text-espresso-500 dark:text-espresso-300">
                Share these details with the staff member. They will be prompted to change their password on first login.
              </p>

              <div className="grid gap-3 rounded-2xl bg-cream/70 p-4 dark:bg-espresso-900/50">
                <div>
                  <p className="text-xs uppercase tracking-wide text-espresso-400">Full name</p>
                  <p className="font-medium text-espresso-900 dark:text-cream">{createdAccount.fullname}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-espresso-400">Username</p>
                  <p className="font-medium text-espresso-900 dark:text-cream">@{createdAccount.username}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-espresso-400">Email</p>
                  <p className="font-medium text-espresso-900 dark:text-cream">{createdAccount.email}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-espresso-400">Temporary password</p>
                  <p className="font-mono font-semibold text-espresso-900 dark:text-cream">{createdAccount.password}</p>
                </div>
                {createdAccount.userId && (
                  <div>
                    <p className="text-xs uppercase tracking-wide text-espresso-400">User ID</p>
                    <p className="font-mono text-xs break-all text-espresso-700 dark:text-espresso-200">{createdAccount.userId}</p>
                  </div>
                )}
              </div>

              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-100">
                <p className="font-medium">Important</p>
                <p className="mt-1">
                  The staff account is created with a temporary password and must change it at first login.
                </p>
              </div>
            </div>
          )}
        </Modal>

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

            <div className="rounded-xl border border-espresso-100 bg-cream/70 px-4 py-3 text-xs text-espresso-500 dark:border-espresso-700 dark:bg-espresso-900/40 dark:text-espresso-300">
              Staff will be created with temporary password <span className="font-mono font-semibold text-espresso-900 dark:text-cream">{DEFAULT_STAFF_PASSWORD}</span> and must change it on first login.
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
