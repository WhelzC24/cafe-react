import { useEffect, useState, Fragment } from 'react'
import { supabase } from '../../lib/supabase'
import { Profile, Order, OrderStatus, STATUS_LABELS, STATUS_COLORS, fmt } from '../../types'
import DashboardLayout from '../../components/layout/DashboardLayout'
import Modal from '../../components/ui/Modal'

interface Stats {
  totalUsers: number
  staffCount: number
  totalOrders: number
  todayOrders: number
  totalRevenue: number
  todayRevenue: number
}

export default function AdminDashboard() {
  const [tab, setTab] = useState<'users' | 'orders'>('users')
  const [users, setUsers] = useState<Profile[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [stats, setStats] = useState<Stats>({ totalUsers: 0, staffCount: 0, totalOrders: 0, todayOrders: 0, totalRevenue: 0, todayRevenue: 0 })
  const [loading, setLoading] = useState(true)
  const [loadingOrders, setLoadingOrders] = useState(false)
  const [resetTarget, setResetTarget] = useState<Profile | null>(null)
  const [editTarget, setEditTarget] = useState<Profile | null>(null)
  const [editForm, setEditForm] = useState({ fullname: '', username: '', role: 'staff' })
  const [deleteTarget, setDeleteTarget] = useState<Profile | null>(null)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null)
  const [orderStatusFilter, setOrderStatusFilter] = useState<OrderStatus | 'all'>('all')

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
    setStats(prev => ({
      ...prev,
      totalUsers: p.length,
      staffCount: p.filter(u => u.role === 'staff').length,
      totalOrders: totalOrders ?? 0,
      todayOrders: todayCount ?? 0,
    }))
    setLoading(false)
  }

  async function loadOrders() {
    setLoadingOrders(true)
    const { data } = await supabase
      .from('orders')
      .select(`
        *,
        order_items (
          id, product_name, quantity, unit_price, line_total
        )
      `)
      .order('created_at', { ascending: false })
      .limit(200)

    const ordersData = (data ?? []) as unknown as Order[]
    setOrders(ordersData)

    const completed = ordersData.filter(o => o.status !== 'cancelled')
    const today = new Date().toISOString().slice(0, 10)
    const todayCompleted = completed.filter(o => o.created_at.startsWith(today))

    setStats(prev => ({
      ...prev,
      totalRevenue: completed.reduce((sum, o) => sum + Number(o.total_amount), 0),
      todayRevenue: todayCompleted.reduce((sum, o) => sum + Number(o.total_amount), 0),
    }))
    setLoadingOrders(false)
  }

  useEffect(() => {
    load()
    loadOrders()
  }, [])

  async function handleResetPassword() {
    if (!resetTarget) return
    setSaving(true)
    await supabase
      .from('profiles')
      .update({ must_change_password: true })
      .eq('id', resetTarget.id)

    setMsg(`Password reset flag set for @${resetTarget.username}. Staff will be prompted to change on next login.`)
    setResetTarget(null)
    setSaving(false)
    load()
  }

  async function handleDeleteUser() {
    if (!deleteTarget) return
    setSaving(true)
    const { error } = await supabase
      .from('profiles')
      .delete()
      .eq('id', deleteTarget.id)

    setSaving(false)
    if (error) { setMsg('Error: ' + error.message); return }
    setDeleteTarget(null)
    setMsg(`User @${deleteTarget.username} deleted.`)
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

  async function updateOrderStatus(orderId: string, status: OrderStatus) {
    await supabase
      .from('orders')
      .update({ status })
      .eq('id', orderId)
    loadOrders()
  }

  const roleColors: Record<string, string> = {
    admin: 'bg-espresso-900 text-cream',
    staff: 'bg-blue-100 text-blue-800',
  }

  const filteredOrders = orderStatusFilter === 'all'
    ? orders
    : orders.filter(o => o.status === orderStatusFilter)

  const orderStatuses: (OrderStatus | 'all')[] = ['all', 'pending', 'preparing', 'ready', 'completed', 'cancelled']

  return (
    <DashboardLayout title="Admin Dashboard" subtitle="Manage your team, orders, and monitor activity">
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { icon: '👥', label: 'Total Users',    value: stats.totalUsers,  color: 'bg-espresso-50' },
          { icon: '🧑‍💼', label: 'Staff Members', value: stats.staffCount,  color: 'bg-blue-50' },
          { icon: '📋', label: 'Total Orders',   value: stats.totalOrders, color: 'bg-amber-50' },
          { icon: '📅', label: "Today's Orders", value: stats.todayOrders, color: 'bg-green-50' },
          { icon: '💰', label: 'Total Revenue',  value: fmt(stats.totalRevenue), color: 'bg-emerald-50' },
          { icon: '📊', label: "Today's Revenue", value: fmt(stats.todayRevenue), color: 'bg-violet-50' },
          { icon: '🧾', label: 'Avg Order Value', value: stats.totalOrders > 0 ? fmt(stats.totalRevenue / stats.totalOrders) : '₱0.00', color: 'bg-rose-50' },
          { icon: '📈', label: 'Active Orders',  value: orders.filter(o => ['pending', 'preparing'].includes(o.status)).length, color: 'bg-orange-50' },
        ].map(s => (
          <div key={s.label} className={`stat-card ${s.color}`}>
            <div className={`stat-icon ${s.color}`}>{s.icon}</div>
            <div>
              <p className="text-xs text-espresso-500 font-medium">{s.label}</p>
              <p className={`font-display font-semibold text-espresso-900 ${s.label.includes('Revenue') || s.label.includes('Value') ? 'text-sm' : 'text-2xl'}`}>
                {s.value}
              </p>
            </div>
          </div>
        ))}
      </div>

      {msg && (
        <div className="mb-4 px-4 py-3 bg-green-50 border border-green-200 text-green-800 rounded-xl text-sm dark:bg-green-900/40 dark:border-green-800 dark:text-green-300">
          {msg} <button onClick={() => setMsg('')} className="ml-2 text-green-600 hover:text-green-800 dark:text-green-400">×</button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-espresso-100 p-1 rounded-xl w-fit mb-6 dark:bg-espresso-900">
        {([
          { key: 'users', label: '👥 Users' },
          { key: 'orders', label: '📋 Orders' },
        ] as { key: 'users' | 'orders'; label: string }[]).map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${
              tab === t.key ? 'bg-white text-espresso-900 shadow-sm dark:bg-espresso-600 dark:text-cream' : 'text-espresso-600 hover:text-espresso-900 dark:text-espresso-400 dark:hover:text-cream dark:hover:bg-espresso-800'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── USERS TAB ── */}
      {tab === 'users' && (
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
                            <>
                              <button
                                onClick={() => setResetTarget(user)}
                                className="btn-ghost btn-sm text-amber-700 border-amber-200 hover:bg-amber-50"
                              >
                                🔑 Reset PW
                              </button>
                              <button
                                onClick={() => setDeleteTarget(user)}
                                className="btn-ghost btn-sm text-red-600 border-red-200 hover:bg-red-50"
                              >
                                🗑 Delete
                              </button>
                            </>
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
      )}

      {/* ── ORDERS TAB ── */}
      {tab === 'orders' && (
        <div className="card overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-espresso-100">
            <h2 className="font-display text-xl">Orders</h2>
            <div className="flex items-center gap-2">
              <select
                value={orderStatusFilter}
                onChange={e => setOrderStatusFilter(e.target.value as OrderStatus | 'all')}
                className="input py-1.5 text-xs w-32"
              >
                {orderStatuses.map(s => (
                  <option key={s} value={s}>{s === 'all' ? 'All Status' : STATUS_LABELS[s as OrderStatus]}</option>
                ))}
              </select>
              <button onClick={loadOrders} className="btn-ghost btn-sm">↻ Refresh</button>
            </div>
          </div>

          {loadingOrders ? (
            <div className="flex justify-center py-12"><div className="spinner" /></div>
          ) : filteredOrders.length === 0 ? (
            <p className="text-center text-espresso-400 py-12">No orders found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Order</th>
                    <th>Customer</th>
                    <th>Total</th>
                    <th>Status</th>
                    <th>Time</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.map(order => (
                    <Fragment key={order.id}>
                      <tr className="cursor-pointer" onClick={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}>
                        <td>
                          <span className="font-mono text-xs text-espresso-500">
                            #{order.id.slice(0, 8).toUpperCase()}
                          </span>
                        </td>
                        <td>
                          <p className="font-medium text-espresso-900">{order.customer_name}</p>
                          <p className="text-xs text-espresso-400">{order.customer_phone}</p>
                        </td>
                        <td className="font-medium">{fmt(order.total_amount)}</td>
                        <td>
                          <span className={`badge ${STATUS_COLORS[order.status]}`}>
                            {STATUS_LABELS[order.status]}
                          </span>
                        </td>
                        <td className="text-xs text-espresso-400">
                          {new Date(order.created_at).toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' })}
                          <br />
                          {new Date(order.created_at).toLocaleDateString('en-PH', { month: 'short', day: 'numeric' })}
                        </td>
                        <td onClick={e => e.stopPropagation()}>
                          <select
                            value={order.status}
                            onChange={e => updateOrderStatus(order.id, e.target.value as OrderStatus)}
                            className="input py-1.5 text-xs w-36"
                          >
                            {(Object.keys(STATUS_LABELS) as OrderStatus[]).map(s => (
                              <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                            ))}
                          </select>
                        </td>
                      </tr>
                      {expandedOrder === order.id && (
                        <tr key={`${order.id}-expanded`} className="bg-espresso-50/50 dark:bg-espresso-700/50">
                          <td colSpan={6} className="px-6 py-3">
                            <div className="text-sm space-y-1">
                              {(order.items ?? []).map((item) => (
                                <div key={item.id} className="flex justify-between text-espresso-700">
                                  <span>{item.quantity}× {item.product_name}</span>
                                  <span>{fmt(item.line_total)}</span>
                                </div>
                              ))}
                              {order.notes && (
                                <p className="text-xs text-espresso-500 mt-1 italic">Note: {order.notes}</p>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

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

      {/* Delete User Modal */}
      <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Delete User">
        <div className="text-center">
          <div className="text-4xl mb-4">🗑️</div>
          <p className="text-espresso-700 mb-2">
            Delete <strong>{deleteTarget?.fullname}</strong> (@{deleteTarget?.username})?
          </p>
          <p className="text-xs text-espresso-500 mb-6">This will remove their profile and auth account. This cannot be undone.</p>
          <div className="flex gap-3 justify-center">
            <button onClick={() => setDeleteTarget(null)} className="btn-ghost">Cancel</button>
            <button onClick={handleDeleteUser} disabled={saving} className="btn-danger">
              {saving ? 'Deleting…' : 'Delete'}
            </button>
          </div>
        </div>
      </Modal>
    </DashboardLayout>
  )
}
