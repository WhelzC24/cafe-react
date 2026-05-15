import { useEffect, useState, useCallback, useRef } from 'react'
import { supabase } from '../lib/supabase'
import type { Notification } from '../types'
import { useAuth } from './useAuth'
import { RealtimePostgresChangesPayload } from '@supabase/supabase-js'

export function useNotifications() {
  const { profile } = useAuth()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const channelRef = useRef<string | null>(null)

  useEffect(() => {
    if (!profile) return

    supabase
      .from('notifications')
      .select('*')
      .eq('profile_id', profile.id)
      .order('created_at', { ascending: false })
      .limit(50)
      .then(({ data }) => {
        if (data) setNotifications(data as Notification[])
        setLoading(false)
      })

    const channelName = 'notifications-' + profile.id + '-' + Math.random().toString(36).slice(2, 8)
    channelRef.current = channelName
    const channel = supabase
      .channel(channelName)
      .on<Notification>(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications' },
        (payload: RealtimePostgresChangesPayload<Notification>) => {
          const notif = payload.new as Notification
          if (notif.profile_id === profile.id) {
            setNotifications(prev => [notif, ...prev])
          }
        },
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [profile])

  const unreadCount = notifications.filter(n => !n.is_read).length

  const markAsRead = useCallback(async (id: string) => {
    setNotifications(prev =>
      prev.map(n => (n.id === id ? { ...n, is_read: true } : n)),
    )
    await supabase.from('notifications').update({ is_read: true }).eq('id', id)
  }, [])

  const markAllAsRead = useCallback(async () => {
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
    const ids = notifications.filter(n => !n.is_read).map(n => n.id)
    if (ids.length > 0) {
      await supabase.from('notifications').update({ is_read: true }).in('id', ids)
    }
  }, [notifications])

  return { notifications, unreadCount, loading, markAsRead, markAllAsRead }
}
