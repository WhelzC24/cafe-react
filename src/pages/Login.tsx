import { useState, FormEvent } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuthContext } from '../context/AuthContext'

export default function LoginPage() {
  const { signIn, profile } = useAuthContext()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // Already logged in?
  if (profile) {
    const dest = profile.role === 'admin' ? '/admin' : '/dashboard'
    navigate(dest, { replace: true })
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const { error: err } = await signIn(email, password)
    setLoading(false)
    if (err) {
      setError('Invalid email or password. Please try again.')
      return
    }
    // profile loaded by useAuth listener — redirect
    navigate(profile?.role === 'admin' ? '/admin' : '/dashboard', { replace: true })
  }

  return (
    <div className="min-h-screen bg-cream flex dark:bg-espresso-900">
      {/* Left panel */}
      <div
        className="hidden lg:flex flex-col justify-end w-[45%] p-12 relative overflow-hidden"
        style={{
          background: 'linear-gradient(160deg, #3e1f0a 0%, #7f4519 50%, #c47a28 100%)',
        }}
      >
        <div className="absolute inset-0 hero-bg opacity-20" />
        <div className="relative z-10">
          <div className="text-4xl mb-6">☕</div>
          <h1 className="font-display text-5xl text-cream leading-tight mb-4">
            Cozy Corner<br /><em>Café</em>
          </h1>
          <p className="text-espresso-200 dark:text-espresso-400 text-lg mb-8">
            Staff & Admin portal. Manage your menu, orders, and team from one place.
          </p>
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-espresso-300 dark:text-espresso-400 hover:text-cream transition-colors text-sm"
          >
            ← View the customer menu
          </Link>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <div className="text-3xl mb-2">🔐</div>
            <h2 className="font-display text-2xl font-semibold text-espresso-900">Welcome back</h2>
            <p className="text-sm text-espresso-500 mt-1">Sign in to your staff account</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <input
                type="email"
                className="input"
                placeholder="Email address"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>
            <div>
              <input
                type="password"
                className="input"
                placeholder="Password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
            </div>

            {error && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                {error}
              </p>
            )}

            <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-3 text-base">
              {loading ? (
                <><span className="inline-block w-4 h-4 border-2 border-cream/30 border-t-cream rounded-full animate-spin" /> Signing in…</>
              ) : 'Sign In'}
            </button>
          </form>

          <p className="text-center text-xs text-espresso-400 mt-6">
            <Link to="/" className="hover:text-espresso-700 transition-colors">← Back to café site</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
