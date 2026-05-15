import { useState, useRef, useEffect } from 'react'
import { useNotifications } from '../../hooks/useNotifications'
import type { Notification as NotificationType } from '../../types'

const TYPE_ICONS: Record<string, string> = {
  new_order: '🛒',
  order_ready: '✅',
  staff_created: '👤',
}

export default function NotificationBell() {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    if (open) document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(prev => !prev)}
        className="relative w-9 h-9 rounded-xl bg-espresso-100 flex items-center justify-center hover:bg-espresso-200 transition-colors dark:bg-espresso-700 dark:hover:bg-espresso-600"
        title="Notifications"
      >
        <span className="text-lg">🔔</span>
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-4.5 h-4.5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center min-w-[18px] px-1 shadow">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 sm:left-0 sm:right-auto mt-2 w-80 bg-white rounded-2xl shadow-xl border border-espresso-100 z-50 animate-slide-up max-h-[480px] flex flex-col dark:bg-espresso-800 dark:border-espresso-700">
          <div className="flex items-center justify-between px-4 py-3 border-b border-espresso-100 dark:border-espresso-700">
            <h3 className="font-display font-semibold text-espresso-900 text-sm dark:text-cream">Notifications</h3>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button onClick={markAllAsRead} className="text-xs text-espresso-500 hover:text-espresso-700 transition-colors dark:text-espresso-300 dark:hover:text-cream">
                  Mark all read
                </button>
              )}
              <button onClick={() => setOpen(false)} className="text-espresso-400 hover:text-espresso-700 text-lg leading-none dark:text-espresso-300 dark:hover:text-cream">×</button>
            </div>
          </div>

          <div className="overflow-y-auto flex-1">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-espresso-400 text-sm">No notifications yet.</div>
            ) : (
              notifications.map(n => (
                <NotificationItem key={n.id} notification={n} onRead={markAsRead} />
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function NotificationItem({ notification: n, onRead }: { notification: NotificationType; onRead: (id: string) => void }) {
  const ago = getTimeAgo(new Date(n.created_at))

  return (
    <div
      className={`px-4 py-3 border-b border-espresso-50 hover:bg-espresso-50 transition-colors cursor-pointer dark:border-espresso-700 dark:hover:bg-espresso-700/50 ${
        !n.is_read ? 'bg-espresso-50/50 dark:bg-espresso-700/30' : ''
      }`}
      onClick={() => { if (!n.is_read) onRead(n.id) }}
    >
      <div className="flex items-start gap-3">
        <span className="text-lg mt-0.5">{TYPE_ICONS[n.type] ?? '🔔'}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <p className={`text-sm ${!n.is_read ? 'font-semibold text-espresso-900 dark:text-cream' : 'text-espresso-700 dark:text-espresso-200'}`}>
              {n.title}
            </p>
            {!n.is_read && <span className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" />}
          </div>
          <p className="text-xs text-espresso-500 mt-0.5 line-clamp-2 dark:text-espresso-300">{n.message}</p>
          <p className="text-[10px] text-espresso-400 mt-1 dark:text-espresso-400">{ago}</p>
        </div>
      </div>
    </div>
  )
}

function getTimeAgo(date: Date): string {
  const now = Date.now()
  const diff = now - date.getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}
