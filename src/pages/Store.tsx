import { useEffect, useState, useRef } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { Product, CATEGORY_ICONS, CATEGORIES, fmt } from '../types'
import { useCart } from '../hooks/useCart'
import OrderChatbot from '../components/chat/OrderChatbot'
import Modal from '../components/ui/Modal'
import DarkModeToggle from '../components/ui/DarkModeToggle'

export default function StorePage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [activeMenuCat, setActiveMenuCat] = useState('all')
  const [activeOrderCat, setActiveOrderCat] = useState('all')
  const [cartOpen, setCartOpen] = useState(false)
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const [orderSuccess, setOrderSuccess] = useState(false)
  const [lastOrderId, setLastOrderId] = useState('')
  const [copied, setCopied] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', phone: '', notes: '' })
  const orderRef = useRef<HTMLElement>(null)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const { cart, cartItems, cartCount, cartTotal, cartTotalFmt, addToCart, removeFromCart, clearCart } = useCart()

  useEffect(() => {
    supabase
      .from('products')
      .select('*')
      .eq('is_available', true)
      .order('category')
      .order('name')
      .then(({ data }) => {
        setProducts((data as Product[]) ?? [])
        setLoading(false)
      })
  }, [])

  const menuItems = activeMenuCat === 'all'
    ? products
    : products.filter(p => p.category === activeMenuCat)

  const orderItems = activeOrderCat === 'all'
    ? products
    : products.filter(p => p.category === activeOrderCat)

  async function handleSubmitOrder(e: React.FormEvent) {
    e.preventDefault()
    if (!cartItems.length) return
    setSubmitting(true)

    const { data: orderId, error } = await supabase.rpc('place_order', {
      p_customer_name: form.name.trim(),
      p_customer_email: form.email.trim() || null,
      p_customer_phone: form.phone.trim(),
      p_notes: form.notes.trim() || null,
      p_total_amount: cartTotal,
      p_items: cartItems.map(({ product, qty }) => ({
        productId: product.id,
        productName: product.name,
        quantity: qty,
        unitPrice: product.price,
        lineTotal: qty * product.price,
      })),
    })

    if (error || !orderId) {
      setSubmitting(false)
      alert(error?.message ?? 'Something went wrong. Please try again.')
      return
    }

    clearCart()
    setForm({ name: '', email: '', phone: '', notes: '' })
    setLastOrderId(orderId)
    setOrderSuccess(true)
    setSubmitting(false)
  }

  const categories = CATEGORIES.filter(cat => products.some(p => p.category === cat))

  return (
    <div className="min-h-screen bg-cream font-body dark:bg-espresso-900">
      {/* ── NAVBAR ──────────────────────────────────── */}
      <header className={`sticky top-0 z-40 transition-all duration-300 ${
          scrolled
            ? 'bg-white/80 backdrop-blur border-b border-espresso-100'
            : 'bg-transparent border-b border-transparent'
        }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <a href="#home" className={`flex items-center gap-2 font-display font-semibold text-lg transition-colors duration-300 ${
              scrolled ? 'text-espresso-900' : 'text-cream'
            }`}>
            <span className="text-2xl">☕</span>
            Cozy Corner <em>Café</em>
          </a>
          <nav className={`hidden md:flex items-center gap-6 text-sm font-medium transition-colors duration-300 ${
              scrolled ? 'text-espresso-700' : 'text-cream/80'
            }`}>
            <a href="#menu"  className={`transition-colors ${
                scrolled ? 'hover:text-espresso-900' : 'hover:text-cream'
              }`}>Menu</a>
            <a href="#about" className={`transition-colors ${
                scrolled ? 'hover:text-espresso-900' : 'hover:text-cream'
              }`}>About</a>
            <a href="#contact" className={`transition-colors ${
                scrolled ? 'hover:text-espresso-900' : 'hover:text-cream'
              }`}>Contact</a>
            <a href="#order" className={`btn-primary btn-sm ${
                scrolled ? '' : 'bg-cream text-[#3e1f0a] hover:bg-cream/90'
              }`}>Order Now</a>
            <Link to="/login" className={`transition-colors text-xs ${
                scrolled
                  ? 'text-espresso-400 hover:text-espresso-700'
                  : 'text-cream/60 hover:text-cream'
              }`}>Staff Login</Link>
            <DarkModeToggle />
          </nav>
          {/* Mobile actions */}
          <div className="flex md:hidden items-center gap-2">
            <DarkModeToggle />
            <button
              onClick={() => setMobileNavOpen(true)}
              className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${
                scrolled
                  ? 'text-espresso-700 hover:bg-espresso-100 dark:text-espresso-300 dark:hover:bg-espresso-700'
                  : 'text-cream/80 hover:text-cream'
              }`}
              aria-label="Open menu"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
              </svg>
            </button>
          </div>
          {/* Cart button */}
          <button
            onClick={() => setCartOpen(!cartOpen)}
            className={`relative btn-sm border-0 transition-colors duration-300 ${
              scrolled
                ? 'btn-ghost'
                : 'text-cream hover:text-cream/80'
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="9" cy="21" r="1"/>
              <circle cx="20" cy="21" r="1"/>
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
            </svg>
            {cartCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-espresso-700 text-cream text-xs rounded-full flex items-center justify-center font-semibold">
                {cartCount}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* Mobile nav overlay */}
      {mobileNavOpen && (
        <div className="fixed inset-0 z-50 md:hidden" onClick={() => setMobileNavOpen(false)}>
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
          <div
            className="absolute top-0 right-0 w-72 h-full bg-cream shadow-2xl animate-slide-up flex flex-col dark:bg-espresso-800"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-espresso-100 dark:border-espresso-700">
              <span className="font-display font-semibold text-espresso-900 dark:text-cream">Menu</span>
              <button onClick={() => setMobileNavOpen(false)} className="text-espresso-400 hover:text-espresso-700 text-2xl leading-none dark:text-espresso-300 dark:hover:text-cream">×</button>
            </div>
            <nav className="flex-1 p-4 space-y-1">
              {[
                ['☕', 'Menu', '#menu'],
                ['📖', 'About', '#about'],
                ['📍', 'Contact', '#contact'],
                ['🛵', 'Order Now', '#order'],
              ].map(([icon, label, href]) => (
                <a
                  key={label}
                  href={href}
                  onClick={() => setMobileNavOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-espresso-700 hover:bg-espresso-100 transition-colors dark:text-espresso-200 dark:hover:bg-espresso-700"
                >
                  <span className="text-lg">{icon}</span>
                  {label}
                </a>
              ))}
              <hr className="my-3 border-espresso-100 dark:border-espresso-700" />
              <Link
                to="/login"
                onClick={() => setMobileNavOpen(false)}
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-espresso-500 hover:bg-espresso-100 transition-colors dark:text-espresso-300 dark:hover:bg-espresso-700"
              >
                🔐 Staff Login
              </Link>
            </nav>
          </div>
        </div>
      )}

      {/* ── HERO ─────────────────────────────────────── */}
      <section id="home" className="relative -mt-16 h-[85vh] min-h-[520px] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 hero-bg" />
        <div className="absolute inset-0 bg-gradient-to-b from-espresso-900/70 via-espresso-900/50 to-cream dark:to-espresso-900" />
        <div className="relative z-10 text-center px-4 max-w-3xl mx-auto pt-16">
          <p className="text-espresso-200 text-sm uppercase tracking-widest mb-4">Est. 2026 · Specialty Coffee</p>
          <h1 className="font-display text-5xl md:text-7xl text-cream mb-6 leading-tight">
            Where Every Cup<br /><em>Tells a Story</em>
          </h1>
          <p className="text-espresso-100 text-lg md:text-xl mb-8 max-w-xl mx-auto">
            Handcrafted coffee, fresh-baked pastries, and warm conversations — your perfect third place.
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <a href="#menu"  className="btn-primary">Explore Our Menu</a>
            <a href="#order" className="btn bg-white/20 text-white border border-white/30 hover:bg-white/30">Order for Pickup</a>
          </div>
          <div className="flex flex-wrap gap-4 justify-center mt-8 text-sm text-espresso-200">
            <span>⭐ 4.9 Rating</span>
            <span>🌱 Ethically Sourced</span>
            <span>🥐 Baked Daily</span>
          </div>
        </div>
      </section>

      {/* ── HIGHLIGHTS BAR ───────────────────────────── */}
      <div className="bg-espresso-900 text-cream py-4">
        <div className="max-w-7xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          {[
            ['☕', 'Premium Beans', 'Single-origin, direct trade'],
            ['🥐', 'Baked Daily', 'Pastries from scratch every morning'],
            ['🕐', 'Open Daily', 'Mon–Fri 7AM–8PM · Sat–Sun 8AM–9PM'],
            ['📍', 'Find Us', 'Cuasi, Loon, Bohol'],
          ].map(([icon, title, sub]) => (
            <div key={title} className="flex items-center gap-3">
              <span className="text-2xl">{icon}</span>
              <div>
                <div className="font-semibold text-espresso-100">{title}</div>
                <div className="text-espresso-400 text-xs">{sub}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── MENU SECTION ─────────────────────────────── */}
      <section id="menu" className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-espresso-500 text-sm uppercase tracking-widest mb-2">Our Offerings</p>
            <h2 className="font-display text-4xl text-espresso-900">The Menu</h2>
          </div>

          {/* Category Filter */}
          <div className="flex flex-wrap gap-2 justify-center mb-10">
            {['all', ...categories].map(cat => (
              <button
                key={cat}
                onClick={() => setActiveMenuCat(cat)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  activeMenuCat === cat
                    ? 'bg-espresso-900 text-cream shadow'
                    : 'bg-white text-espresso-700 border border-espresso-200 hover:border-espresso-400 dark:bg-espresso-700 dark:border-espresso-600'
                }`}
              >
                {cat === 'all' ? 'All Items' : `${CATEGORY_ICONS[cat] ?? ''} ${cat}`}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="flex justify-center py-16"><div className="spinner" /></div>
          ) : (
            <div className="menu-grid">
              {menuItems.map(product => (
                <div
                  key={product.id}
                  onClick={() => { addToCart(product); orderRef.current?.scrollIntoView({ behavior: 'smooth' }) }}
                  className="card overflow-hidden cursor-pointer hover:shadow-md hover:-translate-y-0.5 transition-all group"
                >
                  {product.image_url ? (
                    <img
                      src={product.image_url}
                      alt={product.name}
                      className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-48 bg-espresso-100 flex items-center justify-center text-4xl">
                      {CATEGORY_ICONS[product.category] ?? '☕'}
                    </div>
                  )}
                  <div className="p-4">
                    <div className="text-xs text-espresso-400 mb-1">{product.category}</div>
                    <h3 className="font-display font-semibold text-espresso-900 mb-1">{product.name}</h3>
                    <p className="text-xs text-espresso-500 mb-3 line-clamp-2">{product.description}</p>
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-espresso-700">{fmt(product.price)}</span>
                      <button className="w-8 h-8 rounded-full bg-espresso-900 text-cream flex items-center justify-center text-lg hover:bg-espresso-700 transition-colors">
                        +
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── ABOUT ────────────────────────────────────── */}
      <section id="about" className="py-20 bg-espresso-900 text-cream">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <p className="text-espresso-400 text-sm uppercase tracking-widest mb-4">Our Story</p>
          <h2 className="font-display text-4xl mb-6">A Corner Made for You</h2>
          <p className="text-espresso-200 text-lg leading-relaxed max-w-2xl mx-auto">
            Nestled in the heart of Loon, Bohol, Cozy Corner Café was born from a simple belief:
            that a great cup of coffee can transform a moment. We source single-origin beans,
            bake fresh pastries every morning, and pour every drink with care — because you deserve more
            than just a caffeine fix.
          </p>
        </div>
      </section>

      {/* ── ORDER SECTION ────────────────────────────── */}
      <section id="order" ref={orderRef as React.RefObject<HTMLElement>} className="py-20 px-4 bg-foam">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-espresso-500 text-sm uppercase tracking-widest mb-2">Pickup Order</p>
            <h2 className="font-display text-4xl text-espresso-900">Order Now</h2>
            <p className="text-espresso-500 mt-2">Select items and fill in your details for a pickup order.</p>
          </div>

          <Modal open={orderSuccess} onClose={() => setOrderSuccess(false)} title="Order Placed! 🎉" maxWidth="max-w-sm">
            <div className="text-center py-2">
              <div className="text-5xl mb-4">🎉</div>
              <p className="font-semibold text-espresso-900 text-lg mb-2">Order placed successfully!</p>
              {lastOrderId && (
                <div className="bg-espresso-50 rounded-xl p-3 mb-4">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-[10px] text-espresso-400 uppercase tracking-wider">Order ID</p>
                    <button
                      onClick={() => { navigator.clipboard.writeText(lastOrderId); setCopied(true); setTimeout(() => setCopied(false), 2000) }}
                      className="text-base text-espresso-500 hover:text-espresso-700 transition-colors"
                    >
                      {copied ? '✅' : (
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                        </svg>
                      )}
                    </button>
                  </div>
                  <p className="text-xs font-mono text-espresso-700 break-all select-all">{lastOrderId}</p>
                </div>
              )}
              <p className="text-sm text-espresso-500 mb-6">We'll have it ready for you shortly.</p>
              <button onClick={() => setOrderSuccess(false)} className="btn-primary w-full justify-center py-3">
                Got it!
              </button>
            </div>
          </Modal>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Product selector */}
            <div className="card p-6">
              <h3 className="font-display text-xl mb-4">Select Items</h3>
              {/* Category filter */}
              <div className="flex flex-wrap gap-2 mb-4">
                {['all', ...categories].map(cat => (
                  <button
                    key={cat}
                    onClick={() => setActiveOrderCat(cat)}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                      activeOrderCat === cat
                        ? 'bg-espresso-900 text-cream'
                        : 'bg-espresso-100 text-espresso-700 hover:bg-espresso-200'
                    }`}
                  >
                    {cat === 'all' ? 'All' : cat}
                  </button>
                ))}
              </div>

              <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
                {orderItems.map(product => {
                  const qty = cart[product.id]?.qty ?? 0
                  return (
                    <div key={product.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-espresso-50 transition-colors">
                      {product.image_url ? (
                        <img src={product.image_url} alt={product.name} className="w-12 h-12 rounded-lg object-cover flex-shrink-0" loading="lazy" />
                      ) : (
                        <div className="w-12 h-12 rounded-lg bg-espresso-100 flex items-center justify-center text-xl flex-shrink-0">
                          {CATEGORY_ICONS[product.category] ?? '☕'}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-espresso-900 truncate">{product.name}</p>
                        <p className="text-xs text-espresso-500">{fmt(product.price)}</p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <button
                          onClick={() => removeFromCart(product.id)}
                          className="w-7 h-7 rounded-full border border-espresso-300 flex items-center justify-center text-espresso-600 hover:bg-espresso-100 transition-colors"
                        >−</button>
                        <span className="w-6 text-center text-sm font-medium">{qty}</span>
                        <button
                          onClick={() => addToCart(product)}
                          className="w-7 h-7 rounded-full bg-espresso-900 text-cream flex items-center justify-center hover:bg-espresso-700 transition-colors"
                        >+</button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Cart + customer form */}
            <div className="space-y-4">
              {/* Cart summary */}
              <div className="card p-6">
                <h3 className="font-display text-xl mb-4">Your Order</h3>
                {cartItems.length === 0 ? (
                  <p className="text-espresso-400 text-sm text-center py-4">No items added yet.</p>
                ) : (
                  <>
                    <div className="space-y-2 mb-4">
                      {cartItems.map(({ product, qty }) => (
                        <div key={product.id} className="flex justify-between text-sm">
                          <span className="text-espresso-700">{qty}× {product.name}</span>
                          <span className="font-medium">{fmt(qty * product.price)}</span>
                        </div>
                      ))}
                    </div>
                    <div className="border-t border-espresso-100 pt-3 flex justify-between font-semibold text-espresso-900">
                      <span>Total</span>
                      <span>{cartTotalFmt}</span>
                    </div>
                  </>
                )}
              </div>

              {/* Customer details form */}
              <form onSubmit={handleSubmitOrder} className="card p-6 space-y-4">
                <h3 className="font-display text-xl mb-2">Your Details</h3>
                <div>
                  <input className="input" required placeholder="Full Name *"
                    value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
                </div>
                <div>
                  <label className="label"></label>
                  <input className="input" required type="tel" placeholder="Phone Number *"
                    value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
                </div>
                <div>
                  <input className="input" type="email" placeholder="Email address (optional)"
                    value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
                </div>
                <div>
                  <label className="label">Notes (optional)</label>
                  <textarea className="input resize-none" rows={2} placeholder="Any special requests…"
                    value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
                </div>
                <button
                  type="submit"
                  disabled={submitting || cartItems.length === 0}
                  className="btn-primary w-full justify-center py-3 disabled:opacity-50"
                >
                  {submitting ? (
                    <><span className="inline-block w-4 h-4 border-2 border-cream/30 border-t-cream rounded-full animate-spin" /> Placing Order…</>
                  ) : `Place Order · ${cartTotalFmt}`}
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* ── CONTACT ──────────────────────────────────── */}
      <section id="contact" className="py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="font-display text-3xl text-espresso-900 mb-8">Find Us</h2>
          <div className="grid sm:grid-cols-3 gap-6">
            {[
              ['📍', 'Address', 'Cuasi, Loon, Bohol, Philippines'],
              ['🕐', 'Hours', 'Mon–Fri 7AM–8PM\nSat–Sun 8AM–9PM'],
              ['📞', 'Contact Us', '09361679546'],
            ].map(([icon, title, info]) => (
              <div key={title} className="card p-6">
                <div className="text-3xl mb-3">{icon}</div>
                <h3 className="font-semibold text-espresso-900 mb-1">{title}</h3>
                <p className="text-sm text-espresso-500 whitespace-pre-line">{info}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FOOTER ───────────────────────────────────── */}
      <footer className="bg-espresso-900 text-espresso-400 py-8 text-center text-sm">
        <p className="font-display text-cream text-lg mb-1">Cozy Corner Café</p>
        <p>© {new Date().getFullYear()} · Cuasi, Loon, Bohol</p>
        <Link to="/login" className="mt-2 inline-block text-xs text-espresso-500 hover:text-espresso-300 transition-colors">
          Staff Login
        </Link>
      </footer>

      {/* ── FLOATING CART PANEL ───────────────────────── */}
      {cartOpen && (
        <div
          className="fixed inset-0 z-50 flex justify-end"
          onClick={e => { if (e.target === e.currentTarget) setCartOpen(false) }}
        >
          <div className="w-full max-w-sm bg-white shadow-2xl flex flex-col animate-slide-up dark:bg-espresso-800">
            <div className="flex items-center justify-between px-6 py-4 border-b border-espresso-100">
              <h2 className="font-display text-xl">Cart ({cartCount})</h2>
              <button onClick={() => setCartOpen(false)} className="text-espresso-400 hover:text-espresso-700 text-2xl">×</button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {cartItems.length === 0 ? (
                <p className="text-center text-espresso-400 py-8">Your cart is empty.</p>
              ) : cartItems.map(({ product, qty }) => (
                <div key={product.id} className="flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{product.name}</p>
                    <p className="text-xs text-espresso-500">{fmt(product.price)} each</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => removeFromCart(product.id)} className="w-7 h-7 rounded-full border border-espresso-300 flex items-center justify-center">−</button>
                    <span className="w-5 text-center text-sm">{qty}</span>
                    <button onClick={() => addToCart(product)} className="w-7 h-7 rounded-full bg-espresso-900 text-cream flex items-center justify-center">+</button>
                  </div>
                  <span className="text-sm font-medium w-16 text-right">{fmt(qty * product.price)}</span>
                </div>
              ))}
            </div>
            {cartItems.length > 0 && (
              <div className="p-4 border-t border-espresso-100">
                <div className="flex justify-between font-semibold mb-4">
                  <span>Total</span>
                  <span>{cartTotalFmt}</span>
                </div>
                <a
                  href="#order"
                  onClick={() => setCartOpen(false)}
                  className="btn-primary w-full justify-center py-3"
                >
                  Proceed to Order
                </a>
              </div>
            )}
          </div>
        </div>
      )}

      <OrderChatbot />
    </div>
  )
}
