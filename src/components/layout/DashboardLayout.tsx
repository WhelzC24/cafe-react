import { useState } from 'react'
import Sidebar from './Sidebar'
import NotificationBell from '../notifications/NotificationBell'
import DarkModeToggle from '../ui/DarkModeToggle'
import { useAuthContext } from '../../context/AuthContext'

interface DashboardLayoutProps {
  children: React.ReactNode
  title: string
  subtitle?: string
}

export default function DashboardLayout({ children, title, subtitle }: DashboardLayoutProps) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const { profile, signOut } = useAuthContext()

  return (
    <div className="flex min-h-screen bg-cream dark:bg-espresso-900">
      <Sidebar mobileOpen={mobileNavOpen} onMobileClose={() => setMobileNavOpen(false)} />

      {/* Mobile header */}
      <div className="fixed top-0 left-0 right-0 z-30 flex md:hidden items-center justify-between px-4 h-14 bg-white/90 backdrop-blur border-b border-espresso-100 dark:bg-espresso-800/90 dark:border-espresso-700">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMobileNavOpen(true)}
            className="w-9 h-9 rounded-xl flex items-center justify-center text-espresso-700 hover:bg-espresso-100 transition-colors dark:text-espresso-300 dark:hover:bg-espresso-700"
            aria-label="Open menu"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
            </svg>
          </button>
          <div>
            <h1 className="text-sm font-display font-semibold text-espresso-900 dark:text-cream leading-tight">{title}</h1>
            {subtitle && <p className="text-[10px] text-espresso-500 dark:text-espresso-300 truncate max-w-[180px]">{subtitle}</p>}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <NotificationBell />
          <DarkModeToggle />
          <div className="flex items-center gap-2 pl-2 border-l border-espresso-200 dark:border-espresso-700">
            <div className="w-7 h-7 rounded-lg bg-espresso-900 text-cream flex items-center justify-center font-display font-semibold text-[10px] dark:bg-espresso-700">
              {profile?.fullname?.[0]?.toUpperCase() ?? '?'}
            </div>
            <button
              onClick={signOut}
              title="Logout"
              className="text-espresso-400 hover:text-red-500 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-auto mt-14 md:mt-0">
        <div className="max-w-7xl mx-auto">
          <div className="mb-6 md:mb-8 hidden md:block">
            {subtitle && <p className="text-sm text-espresso-500 mb-1 dark:text-espresso-300">{subtitle}</p>}
            <h1 className="text-3xl font-display font-semibold text-espresso-900 dark:text-cream">
              {title}
            </h1>
          </div>
          {children}
        </div>
      </main>
    </div>
  )
}
