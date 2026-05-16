import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuthContext } from '../context/AuthContext'
import DashboardLayout from '../components/layout/DashboardLayout'
import PasswordInput from '../components/ui/PasswordInput'

export default function ChangePassword() {
  const { profile } = useAuthContext()
  const navigate = useNavigate()
  const [currentPw, setCurrentPw] = useState('')
  const [newPw, setNewPw] = useState('')
  const [confirmPw, setConfirmPw] = useState('')
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState('')
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setMsg('')

    if (newPw !== confirmPw) {
      setError('New passwords do not match.')
      return
    }
    if (newPw.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }

    setLoading(true)
    const { error: err } = await supabase.auth.updateUser({ password: newPw })

    if (err) {
      setError(err.message)
      setLoading(false)
      return
    }

    // Clear must_change_password flag
    if (profile) {
      await supabase
        .from('profiles')
        .update({ must_change_password: false })
        .eq('id', profile.id)
    }

    setLoading(false)
    setMsg('Password changed successfully!')
    setTimeout(() => navigate(profile?.role === 'admin' ? '/admin' : '/dashboard'), 1500)
  }

  return (
    <DashboardLayout title="Change Password" subtitle="Update your account password">
      <div className="max-w-md">
        <div className="card p-8">
          {profile?.must_change_password && (
            <div className="mb-6 px-4 py-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl text-sm">
              🔑 You must change your password before continuing.
            </div>
          )}

          {msg && (
            <div className="mb-4 px-4 py-3 bg-green-50 border border-green-200 text-green-800 rounded-xl text-sm">
              {msg}
            </div>
          )}
          {error && (
            <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 text-red-800 rounded-xl text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <PasswordInput label="Current Password" required
              value={currentPw} onChange={e => setCurrentPw(e.target.value)} />
            <PasswordInput label="New Password" required minLength={6}
              value={newPw} onChange={e => setNewPw(e.target.value)} />
            <PasswordInput label="Confirm New Password" required
              value={confirmPw} onChange={e => setConfirmPw(e.target.value)} />
            <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-3 mt-2">
              {loading ? 'Updating…' : 'Update Password'}
            </button>
          </form>
        </div>
      </div>
    </DashboardLayout>
  )
}
