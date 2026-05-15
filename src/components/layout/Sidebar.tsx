import { Link, useLocation } from 'react-router-dom'
import { useAuthContext } from '../../context/AuthContext'
import NotificationBell from '../notifications/NotificationBell'
import DarkModeToggle from '../ui/DarkModeToggle'

interface NavItem {
  to: string
  icon: string
  label: string
  roles?: string[]
}

const navItems: NavItem[] = [
  { to: '/admin',        icon: '👥', label: 'User Management', roles: ['admin'] },
  { to: '/admin/staff',  icon: '➕', label: 'Add Staff',        roles: ['admin'] },
  { to: '/dashboard',    icon: '📦', label: 'Store Dashboard',  roles: ['admin', 'staff'] },
]

interface SidebarProps {
  mobileOpen?: boolean
  onMobileClose?: () => void
}

export default function Sidebar({ mobileOpen, onMobileClose }: SidebarProps) {
  const location = useLocation()
  const { profile, signOut } = useAuthContext()

  const visible = navItems.filter(item =>
    !item.roles || (profile && item.roles.includes(profile.role))
  )

  const brand = (
    <div className="p-6 border-b border-espresso-100 flex items-center gap-3 dark:border-espresso-700">
      <Link to="/" className="flex items-center gap-3 group flex-1" onClick={onMobileClose}>
        <div className="w-10 h-10 rounded-xl bg-espresso-900 flex items-center justify-center text-xl dark:bg-espresso-700">
          ☕
        </div>
        <div>
          <div className="font-display font-semibold text-espresso-900 leading-tight dark:text-cream">Cozy Corner</div>
          <div className="text-xs text-espresso-500 dark:text-espresso-300">
            {profile?.role === 'admin' ? 'Admin Panel' : 'Staff Panel'}
          </div>
        </div>
      </Link>
      <NotificationBell />
    </div>
  )

  const nav = (
    <nav className="flex-1 p-4 space-y-1">
        <p className="text-xs font-semibold uppercase tracking-widest text-espresso-400 px-3 mb-2 dark:text-espresso-300">
          Management
        </p>
      {visible.map(item => (
        <Link
          key={item.to}
          to={item.to}
          onClick={onMobileClose}
          className={`sidebar-link ${location.pathname === item.to ? 'active' : ''}`}
        >
          <span className="text-base">{item.icon}</span>
          {item.label}
        </Link>
      ))}

      <div className="pt-4">
        <p className="text-xs font-semibold uppercase tracking-widest text-espresso-400 px-3 mb-2 dark:text-espresso-300">
          System
        </p>
        <Link to="/" target="_blank" onClick={onMobileClose} className="sidebar-link">
          <span>🌐</span> View Café Site
        </Link>
        <Link to="/change-password" onClick={onMobileClose} className="sidebar-link">
          <span>🔑</span> Change Password
        </Link>
      </div>
    </nav>
  )

  const userInfo = (
    <div className="p-4 border-t border-espresso-100 dark:border-espresso-700">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-espresso-900 text-cream flex items-center justify-center font-display font-semibold text-sm dark:bg-espresso-700">
          {profile?.fullname?.[0]?.toUpperCase() ?? '?'}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-espresso-900 truncate dark:text-cream">{profile?.fullname}</p>
          <p className="text-xs text-espresso-500 dark:text-espresso-300">{profile?.role}</p>
        </div>
        <DarkModeToggle />
        <button
          onClick={signOut}
          title="Logout"
          className="text-espresso-400 hover:text-red-500 transition-colors text-lg"
        >
          ⏻
        </button>
      </div>
    </div>
  )

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-espresso-100 min-h-screen dark:bg-espresso-800 dark:border-espresso-700">
        {brand}
        {nav}
        {userInfo}
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onMobileClose} />
          <aside className="absolute top-0 left-0 w-72 h-full bg-white shadow-2xl animate-slide-up flex flex-col dark:bg-espresso-800">
            <div className="flex items-center justify-between px-5 py-4 border-b border-espresso-100 dark:border-espresso-700">
              <span className="font-display font-semibold text-espresso-900 dark:text-cream">Navigation</span>
              <button onClick={onMobileClose} className="text-espresso-400 hover:text-espresso-700 text-2xl leading-none dark:text-espresso-300 dark:hover:text-cream">×</button>
            </div>
            {nav}
            {userInfo}
          </aside>
        </div>
      )}
    </>
  )
}
