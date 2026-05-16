import { useEffect, useState, useCallback, Fragment } from 'react'
import { supabase } from '../../lib/supabase'
import { Product, Order, OrderStatus, CATEGORIES, STATUS_LABELS, STATUS_COLORS, fmt } from '../../types'
import DashboardLayout from '../../components/layout/DashboardLayout'
import Modal from '../../components/ui/Modal'
import { useAuthContext } from '../../context/AuthContext'

type Tab = 'products' | 'orders'

const emptyProduct: Omit<Product, 'id' | 'created_at'> = {
  name: '', category: 'Coffee', description: '', price: 0, image_url: '', is_available: true,
}

function playChime() {
  try {
    const ctx = new AudioContext()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.frequency.setValueAtTime(523.25, ctx.currentTime)
    osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.1)
    osc.frequency.setValueAtTime(783.99, ctx.currentTime + 0.2)
    gain.gain.setValueAtTime(0.25, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.6)
    osc.start(ctx.currentTime)
    osc.stop(ctx.currentTime + 0.6)
  } catch {}
}

export default function StoreDashboard() {
  const { profile } = useAuthContext()
  const [tab, setTab] = useState<Tab>('products')
  const [products, setProducts] = useState<Product[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [loadingProducts, setLoadingProducts] = useState(true)
  const [loadingOrders, setLoadingOrders] = useState(true)
  const [productModal, setProductModal] = useState(false)
  const [editProduct, setEditProduct] = useState<Partial<Product>>(emptyProduct)
  const [isEditing, setIsEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null)
  const [msg, setMsg] = useState('')
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null)
  const [orderStatusFilter, setOrderStatusFilter] = useState<OrderStatus | 'all'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [newOrderAlert, setNewOrderAlert] = useState<{orderId: string; customerName: string} | null>(null)

  const loadProducts = useCallback(async () => {
    setLoadingProducts(true)
    const { data } = await supabase
      .from('products')
      .select('*')
      .order('category').order('name')
    setProducts((data ?? []) as Product[])
    setLoadingProducts(false)
  }, [])

  const loadOrders = useCallback(async () => {
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
      .limit(100)
    setOrders((data ?? []) as unknown as Order[])
    setLoadingOrders(false)
  }, [])

  useEffect(() => {
    loadProducts()
    loadOrders()

    const channel = supabase
      .channel('orders-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
        loadOrders()
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [loadProducts, loadOrders])

  useEffect(() => {
    const newOrderChannel = supabase
      .channel('new-orders-alert')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'orders' }, (payload) => {
        const o = payload.new as Order
        setNewOrderAlert({ orderId: o.id, customerName: o.customer_name })
        playChime()
        setTimeout(() => setNewOrderAlert(null), 6000)
      })
      .subscribe()

    return () => { supabase.removeChannel(newOrderChannel) }
  }, [])

  // ── Product CRUD ──────────────────────────────────────────
  function openNewProduct() {
    setEditProduct(emptyProduct)
    setIsEditing(false)
    setProductModal(true)
  }

  function openEditProduct(p: Product) {
    setEditProduct({ ...p })
    setIsEditing(true)
    setProductModal(true)
  }

  async function handleSaveProduct() {
    if (!editProduct.name || !editProduct.price) return
    setSaving(true)

    if (isEditing && editProduct.id) {
      await supabase.from('products').update({
        name: editProduct.name,
        category: editProduct.category,
        description: editProduct.description,
        price: editProduct.price,
        image_url: editProduct.image_url || null,
        is_available: editProduct.is_available,
      }).eq('id', editProduct.id)
    } else {
      await supabase.from('products').insert({
        name: editProduct.name,
        category: editProduct.category,
        description: editProduct.description,
        price: editProduct.price,
        image_url: editProduct.image_url || null,
        is_available: editProduct.is_available ?? true,
      })
    }

    setSaving(false)
    setProductModal(false)
    setMsg(isEditing ? 'Product updated.' : 'Product added.')
    loadProducts()
  }

  async function handleToggleAvailable(p: Product) {
    await supabase.from('products').update({ is_available: !p.is_available }).eq('id', p.id)
    loadProducts()
  }

  async function handleDeleteProduct() {
    if (!deleteTarget) return
    setSaving(true)
    await supabase.from('products').delete().eq('id', deleteTarget.id)
    setSaving(false)
    setDeleteTarget(null)
    setMsg('Product deleted.')
    loadProducts()
  }

  // ── Order management ──────────────────────────────────────
  async function updateOrderStatus(orderId: string, status: OrderStatus) {
    await supabase
      .from('orders')
      .update({ status, processed_by: profile?.id })
      .eq('id', orderId)
    loadOrders()
  }

  const today = new Date().toISOString().slice(0, 10)
  const todayOrders = orders.filter(o => o.created_at.startsWith(today))
  const todayByStatus = {
    pending: todayOrders.filter(o => o.status === 'pending').length,
    preparing: todayOrders.filter(o => o.status === 'preparing').length,
    ready: todayOrders.filter(o => o.status === 'ready').length,
    completed: todayOrders.filter(o => o.status === 'completed').length,
    cancelled: todayOrders.filter(o => o.status === 'cancelled').length,
  }

  const filteredOrders = orderStatusFilter === 'all'
    ? orders
    : orders.filter(o => o.status === orderStatusFilter)

  const searchedOrders = filteredOrders.filter(o =>
    !searchQuery ||
    o.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    o.customer_phone.includes(searchQuery) ||
    o.id.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const orderStatuses: (OrderStatus | 'all')[] = ['all', 'pending', 'preparing', 'ready', 'completed', 'cancelled']

  const stats = {
    totalProducts: products.length,
    available: products.filter(p => p.is_available).length,
    pending: orders.filter(o => ['pending', 'preparing'].includes(o.status)).length,
    today: todayOrders.length,
  }

  function handlePrintReceipt(order: Order) {
    const w = window.open('', '_blank')
    if (!w) return
    w.document.write(`<!DOCTYPE html>
<html><head><title>Order Receipt</title>
<style>
  body{font-family:'Courier New',monospace;width:280px;margin:0 auto;padding:16px;font-size:13px;color:#222}
  h1{text-align:center;font-size:18px;margin:0 0 4px}
  .sub{text-align:center;font-size:11px;color:#666;margin:0 0 12px}
  .divider{border-top:1px dashed #999;margin:8px 0}
  .row{display:flex;justify-content:space-between;margin:2px 0}
  .total{font-weight:bold;font-size:15px}
  .label{color:#666;font-size:11px}
  .center{text-align:center}
</style></head><body>
<h1>☕ Cozy Corner Cafe</h1>
<p class="sub">Cuasi, Loon, Bohol</p>
<div class="divider"></div>
<p class="label">Order #${order.id.slice(0, 8).toUpperCase()}</p>
<p class="label">${new Date(order.created_at).toLocaleString('en-PH')}</p>
<div class="divider"></div>
<p><strong>${order.customer_name}</strong> &mdash; ${order.customer_phone}</p>
${order.customer_email ? `<p>${order.customer_email}</p>` : ''}
<div class="divider"></div>
${(order.items ?? []).map(i =>
  `<div class="row"><span>${i.quantity}x ${i.product_name}</span><span>${fmt(i.line_total)}</span></div>`
).join('')}
<div class="divider"></div>
<div class="row total"><span>TOTAL</span><span>${fmt(order.total_amount)}</span></div>
<p class="label">Status: ${STATUS_LABELS[order.status]}</p>
${order.notes ? `<p class="label">Note: ${order.notes}</p>` : ''}
<div class="divider"></div>
<p class="center label">Thank you for your order!</p>
<script>window.print();window.close();</script>
</body></html>`)
    w.document.close()
  }

  return (
    <DashboardLayout title="Store Dashboard" subtitle="Manage products and incoming orders">
      {/* New order toast */}
      {newOrderAlert && (
        <div className="fixed top-4 right-4 z-50 bg-white border border-green-200 text-green-800 rounded-xl shadow-2xl p-4 animate-slide-up max-w-sm dark:bg-espresso-800 dark:border-green-700">
          <div className="flex items-start gap-3">
            <span className="text-2xl">🛒</span>
            <div className="flex-1">
              <p className="font-semibold text-espresso-900 dark:text-cream">New Order!</p>
              <p className="text-sm text-espresso-600 dark:text-espresso-300">{newOrderAlert.customerName} placed an order</p>
            </div>
            <button onClick={() => setNewOrderAlert(null)} className="text-espresso-400 hover:text-espresso-700 dark:text-espresso-300 dark:hover:text-cream">&times;</button>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        {[
          { icon: '📦', label: 'Total Products',   value: stats.totalProducts, color: 'bg-espresso-50' },
          { icon: '✅', label: 'Available',         value: stats.available,     color: 'bg-green-50' },
          { icon: '⏳', label: 'Active Orders',     value: stats.pending,       color: 'bg-amber-50' },
          { icon: '📅', label: "Today's Orders",    value: stats.today,         color: 'bg-blue-50' },
        ].map(s => (
          <div key={s.label} className={`stat-card ${s.color}`}>
            <div className={`stat-icon ${s.color} text-2xl`}>{s.icon}</div>
            <div>
              <p className="text-xs text-espresso-500 font-medium">{s.label}</p>
              <p className="text-2xl font-display font-semibold text-espresso-900">{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Today's Orders Breakdown */}
      <div className="mb-6">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-espresso-400 mb-2">Today's Breakdown</p>
        <div className="grid grid-cols-5 gap-2">
          {[
            { label: 'Pending',   value: todayByStatus.pending,   color: 'bg-amber-50 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300' },
            { label: 'Preparing', value: todayByStatus.preparing, color: 'bg-blue-50 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300' },
            { label: 'Ready',     value: todayByStatus.ready,     color: 'bg-green-50 text-green-800 dark:bg-green-900/40 dark:text-green-300' },
            { label: 'Completed', value: todayByStatus.completed, color: 'bg-gray-50 text-gray-600 dark:bg-gray-800 dark:text-gray-400' },
            { label: 'Cancelled', value: todayByStatus.cancelled, color: 'bg-red-50 text-red-700 dark:bg-red-900/40 dark:text-red-300' },
          ].map(s => (
            <div key={s.label} className={`${s.color} rounded-xl p-2.5 text-center`}>
              <p className="text-lg font-bold leading-tight">{s.value}</p>
              <p className="text-[9px] font-medium uppercase tracking-wider">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {msg && (
        <div className="mb-4 px-4 py-3 bg-green-50 border border-green-200 text-green-800 rounded-xl text-sm dark:bg-green-900/40 dark:border-green-800 dark:text-green-300">
          {msg} <button onClick={() => setMsg('')} className="ml-2 text-green-600 dark:text-green-400">×</button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-espresso-100 p-1 rounded-xl w-fit mb-6 dark:bg-espresso-900">
        {(['products', 'orders'] as Tab[]).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${
              tab === t ? 'bg-white text-espresso-900 shadow-sm dark:bg-espresso-600 dark:text-cream' : 'text-espresso-600 hover:text-espresso-900 dark:text-espresso-400 dark:hover:text-cream dark:hover:bg-espresso-800'
            }`}
          >
            {t === 'products' ? '📦 Products' : '📋 Orders'}
          </button>
        ))}
      </div>

      {/* ── PRODUCTS TAB ── */}
      {tab === 'products' && (
        <div className="card overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-espresso-100">
            <h2 className="font-display text-xl">Products</h2>
            <button onClick={openNewProduct} className="btn-primary btn-sm">+ Add Product</button>
          </div>

          {loadingProducts ? (
            <div className="flex justify-center py-12"><div className="spinner" /></div>
          ) : (
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Category</th>
                    <th>Price</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map(p => (
                    <tr key={p.id}>
                      <td>
                        <div className="flex items-center gap-3">
                          {p.image_url ? (
                            <img src={p.image_url} alt={p.name} className="w-10 h-10 rounded-lg object-cover" loading="lazy" />
                          ) : (
                            <div className="w-10 h-10 rounded-lg bg-espresso-100 flex items-center justify-center">☕</div>
                          )}
                          <div>
                            <p className="font-medium text-espresso-900">{p.name}</p>
                            <p className="text-xs text-espresso-400 max-w-[200px] truncate">{p.description}</p>
                          </div>
                        </div>
                      </td>
                      <td className="text-espresso-500">{p.category}</td>
                      <td className="font-medium">{fmt(p.price)}</td>
                      <td>
                        <button
                          onClick={() => handleToggleAvailable(p)}
                          className={`badge ${p.is_available ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'} cursor-pointer`}
                        >
                          {p.is_available ? '● Available' : '○ Hidden'}
                        </button>
                      </td>
                      <td>
                        <div className="flex gap-2">
                          <button onClick={() => openEditProduct(p)} className="btn-ghost btn-sm">✏️ Edit</button>
                          <button onClick={() => setDeleteTarget(p)} className="btn-ghost btn-sm text-red-600 border-red-200 hover:bg-red-50">🗑 Delete</button>
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
              <input
                type="text"
                placeholder="Search name, phone, or order ID..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="input py-1.5 text-xs w-44"
              />
              <select
                value={orderStatusFilter}
                onChange={e => setOrderStatusFilter(e.target.value as OrderStatus | 'all')}
                className="input py-1.5 text-xs w-28"
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
          ) : searchedOrders.length === 0 ? (
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
                  {searchedOrders.map(order => (
                    <Fragment key={order.id}>
                      <tr className="cursor-pointer" onClick={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}>
                        <td>
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono text-xs text-espresso-500">
                              #{order.id.slice(0, 8).toUpperCase()}
                            </span>
                            {order.notes && (
                              <span className="text-[10px] text-espresso-400" title={order.notes}>📝</span>
                            )}
                          </div>
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
                          <div className="flex items-center gap-1.5">
                            {/* Quick status buttons */}
                            {order.status === 'pending' && (
                              <button
                                onClick={() => updateOrderStatus(order.id, 'preparing')}
                                className="text-[10px] px-2 py-1 rounded-lg bg-blue-100 text-blue-800 hover:bg-blue-200 font-medium transition-colors"
                              >
                                🔄 Prep
                              </button>
                            )}
                            {order.status === 'preparing' && (
                              <button
                                onClick={() => updateOrderStatus(order.id, 'ready')}
                                className="text-[10px] px-2 py-1 rounded-lg bg-green-100 text-green-800 hover:bg-green-200 font-medium transition-colors"
                              >
                                ✅ Ready
                              </button>
                            )}
                            {order.status === 'ready' && (
                              <button
                                onClick={() => updateOrderStatus(order.id, 'completed')}
                                className="text-[10px] px-2 py-1 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 font-medium transition-colors"
                              >
                                ✔ Done
                              </button>
                            )}
                            {/* Full status dropdown */}
                            <select
                              value={order.status}
                              onChange={e => updateOrderStatus(order.id, e.target.value as OrderStatus)}
                              className="input py-1.5 text-[10px] w-24"
                            >
                              {(Object.keys(STATUS_LABELS) as OrderStatus[]).map(s => (
                                <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                              ))}
                            </select>
                            {/* Print receipt */}
                            {order.status === 'completed' && (
                              <button
                                onClick={() => handlePrintReceipt(order)}
                                className="text-[10px] px-2 py-1 rounded-lg bg-espresso-100 text-espresso-700 hover:bg-espresso-200 font-medium transition-colors"
                                title="Print receipt"
                              >
                                🖨️
                              </button>
                            )}
                          </div>
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

      {/* ── Product Modal ── */}
      <Modal
        open={productModal}
        onClose={() => setProductModal(false)}
        title={isEditing ? 'Edit Product' : 'Add Product'}
        maxWidth="max-w-lg"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="label">Product Name *</label>
              <input className="input" required placeholder="Espresso"
                value={editProduct.name ?? ''}
                onChange={e => setEditProduct(p => ({ ...p, name: e.target.value }))} />
            </div>
            <div>
              <label className="label">Category</label>
              <select className="input" value={editProduct.category ?? 'Coffee'}
                onChange={e => setEditProduct(p => ({ ...p, category: e.target.value }))}>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Price (₱) *</label>
              <input className="input" type="number" step="0.01" min="0" placeholder="0.00"
                value={editProduct.price ?? ''}
                onChange={e => setEditProduct(p => ({ ...p, price: parseFloat(e.target.value) || 0 }))} />
            </div>
            <div className="sm:col-span-2">
              <label className="label">Description</label>
              <textarea className="input resize-none" rows={2} placeholder="Brief description…"
                value={editProduct.description ?? ''}
                onChange={e => setEditProduct(p => ({ ...p, description: e.target.value }))} />
            </div>
            <div className="sm:col-span-2">
              <label className="label">Image URL</label>
              <input className="input" placeholder="https://…"
                value={editProduct.image_url ?? ''}
                onChange={e => setEditProduct(p => ({ ...p, image_url: e.target.value }))} />
              {editProduct.image_url && (
                <img src={editProduct.image_url} alt="preview" className="mt-2 h-24 w-full object-cover rounded-xl" />
              )}
            </div>
            <div className="sm:col-span-2 flex items-center gap-3">
              <input type="checkbox" id="available" className="w-4 h-4 accent-espresso-900"
                checked={editProduct.is_available ?? true}
                onChange={e => setEditProduct(p => ({ ...p, is_available: e.target.checked }))} />
              <label htmlFor="available" className="text-sm text-espresso-700 cursor-pointer">
                Available on menu
              </label>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button onClick={() => setProductModal(false)} className="btn-ghost flex-1">Cancel</button>
            <button onClick={handleSaveProduct} disabled={saving} className="btn-primary flex-1">
              {saving ? 'Saving…' : isEditing ? 'Save Changes' : 'Add Product'}
            </button>
          </div>
        </div>
      </Modal>

      {/* ── Delete Confirm Modal ── */}
      <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Delete Product">
        <div className="text-center">
          <div className="text-4xl mb-4">🗑️</div>
          <p className="text-espresso-700 mb-6">
            Delete <strong>{deleteTarget?.name}</strong>? This cannot be undone.
          </p>
          <div className="flex gap-3 justify-center">
            <button onClick={() => setDeleteTarget(null)} className="btn-ghost">Cancel</button>
            <button onClick={handleDeleteProduct} disabled={saving} className="btn-danger">
              {saving ? 'Deleting…' : 'Delete'}
            </button>
          </div>
        </div>
      </Modal>
    </DashboardLayout>
  )
}
