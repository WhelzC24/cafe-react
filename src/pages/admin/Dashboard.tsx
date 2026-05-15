import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { Profile } from '../../types'
import DashboardLayout from '../../components/layout/DashboardLayout'
import Modal from '../../components/ui/Modal'

interface Stats {
  totalUsers: number
  staffCount: number
  totalOrders: number
  todayOrders: number
}

export default function AdminDashboard() {
  const [users, setUsers] = useState<Profile[]>([])
  const [stats, setStats] = useState<Stats>({ totalUsers: 0, staffCount: 0, totalOrders: 0, todayOrders: 0 })
  const [loading, setLoading] = useState(true)
  const [resetTarget, setResetTarget] = useState<Profile | null>(null)
  const [editTarget, setEditTarget] = useState<Profile | null>(null)
  const [editForm, setEditForm] = useState({ fullname: '', username: '', role: 'staff' })
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')

  async function load() {
    setLoading(true)
    const [{ data: profiles }, { count: totalOrders }, { count: todayCount }] = await Promise.all([
      supabase.from('profiles').select('*').order('created_at'),
      supabase.from('orders').select('*', { count: 'exact', head: true }),
      supabase.from('orders').select('*', { count: 'exact', head: true })
        .gte('created_at', new Date().toISOString().slice(0, 10)),
    ])

    const p = (profiles ?? []) as Profile[]
    setUsers(p)
    setStats({
      totalUsers: p.length,
      staffCount: p.filter(u => u.role === 'staff').length,
      totalOrders: totalOrders ?? 0,
      todayOrders: todayCount ?? 0,
    })
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function handleResetPassword() {
    if (!resetTarget) return
    setSaving(true)
    // In Supabase, admins reset via the service role key on the server.
    // Here we flag must_change_password and set a temp password via admin API.
    // Since we only have anon key client-side, we update the flag as a signal to the user.
    await supabase
      .from('profiles')
      .update({ must_change_password: true })
      .eq('id', resetTarget.id)

    setMsg(`Password reset flag set for @${resetTarget.username}. Staff will be prompted to change on next login.`)
    setResetTarget(null)
    setSaving(false)
    load()
  }

  function openEdit(user: Profile) {
    setEditTarget(user)
    setEditForm({ fullname: user.fullname, username: user.username, role: user.role })
  }

  async function handleSaveEdit() {
    if (!editTarget) return
    setSaving(true)
    const { error } = await supabase
      .from('profiles')
      .update({ fullname: editForm.fullname, username: editForm.username, role: editForm.role })
      .eq('id', editTarget.id)
    setSaving(false)
    if (error) { setMsg('Error: ' + error.message); return }
    setEditTarget(null)
    setMsg('User updated successfully.')
    load()
  }

  const roleColors: Record<string, string> = {
    admin: 'bg-espresso-900 text-cream',
    staff: 'bg-blue-100 text-blue-800',
  }

  const statCards = [
    { icon: '👥', label: 'Total Users',    value: stats.totalUsers,  color: 'bg-espresso-50' },
    { icon: '🧑‍💼', label: 'Staff Members', value: stats.staffCount,  color: 'bg-blue-50' },
    { icon: '📋', label: 'Total Orders',   value: stats.totalOrders, color: 'bg-amber-50' },
    { icon: '📅', label: "Today's Orders", value: stats.todayOrders, color: 'bg-green-50' },
  ]

  return (
    <DashboardLayout title="Admin Dashboard" subtitle="Manage your team and monitor activity">
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statCards.map(s => (
          <div key={s.label} className={`stat-card ${s.color}`}>
            <div className={`stat-icon ${s.color}`}>{s.icon}</div>
            <div>
              <p className="text-xs text-espresso-500 font-medium">{s.label}</p>
              <p className="text-2xl font-display font-semibold text-espresso-900">{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      {msg && (
        <div className="mb-4 px-4 py-3 bg-green-50 border border-green-200 text-green-800 rounded-xl text-sm dark:bg-green-900/40 dark:border-green-800 dark:text-green-300">
          {msg} <button onClick={() => setMsg('')} className="ml-2 text-green-600 hover:text-green-800 dark:text-green-400">×</button>
        </div>
      )}

      {/* Users table */}
      <div className="card overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-espresso-100">
          <h2 className="font-display text-xl">All Users</h2>
          <a href="/admin/staff" className="btn-primary btn-sm">+ Add Staff</a>
        </div>

        {loading ? (
          <div className="flex justify-center py-12"><div className="spinner" /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Username</th>
                  <th>Role</th>
                  <th>Registered</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(user => (
                  <tr key={user.id}>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-espresso-100 flex items-center justify-center font-semibold text-espresso-700 text-sm">
                          {user.fullname[0]?.toUpperCase()}
                        </div>
                        <span className="font-medium text-espresso-900">{user.fullname}</span>
                      </div>
                    </td>
                    <td className="text-espresso-500">@{user.username}</td>
                    <td>
                      <span className={`badge ${roleColors[user.role] ?? 'bg-gray-100 text-gray-600'}`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="text-espresso-400 text-xs">
                      {new Date(user.created_at).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' })}
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openEdit(user)}
                          className="btn-ghost btn-sm"
                        >
                          ✏️ Edit
                        </button>
                        {user.role !== 'admin' && (
                          <button
                            onClick={() => setResetTarget(user)}
                            className="btn-ghost btn-sm text-amber-700 border-amber-200 hover:bg-amber-50"
                          >
                            🔑 Reset PW
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Reset Password Modal */}
      <Modal open={!!resetTarget} onClose={() => setResetTarget(null)} title="Reset Password">
        <div className="text-center">
          <div className="w-14 h-14 bg-amber-50 rounded-full flex items-center justify-center text-3xl mx-auto mb-4">🔑</div>
          <p className="text-espresso-700 mb-6">
            This will flag <strong>@{resetTarget?.username}</strong> to change their password on next login.
          </p>
          <div className="flex gap-3 justify-center">
            <button onClick={() => setResetTarget(null)} className="btn-ghost">Cancel</button>
            <button onClick={handleResetPassword} disabled={saving} className="btn-danger">
              {saving ? 'Saving…' : 'Confirm Reset'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Edit User Modal */}
      <Modal open={!!editTarget} onClose={() => setEditTarget(null)} title="Edit User">
        <div className="space-y-4">
          <div>
            <label className="label">Full Name</label>
            <input className="input" value={editForm.fullname}
              onChange={e => setEditForm(f => ({ ...f, fullname: e.target.value }))} />
          </div>
          <div>
            <label className="label">Username</label>
            <input className="input" value={editForm.username}
              onChange={e => setEditForm(f => ({ ...f, username: e.target.value }))} />
          </div>
          <div>
            <label className="label">Role</label>
            <select className="input" value={editForm.role}
              onChange={e => setEditForm(f => ({ ...f, role: e.target.value }))}>
              <option value="staff">Staff</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div className="flex gap-3 pt-2">
            <button onClick={() => setEditTarget(null)} className="btn-ghost flex-1">Cancel</button>
            <button onClick={handleSaveEdit} disabled={saving} className="btn-primary flex-1">
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        </div>
      </Modal>
    </DashboardLayout>
  )
}
