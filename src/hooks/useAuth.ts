import { useEffect, useState, useCallback } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import { type Profile } from '../types'
import { fetchProfile as adminFetchProfile } from '../lib/supabase-admin'

interface AuthState {
  user: User | null
  profile: Profile | null
  session: Session | null
  loading: boolean
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    user: null,
    profile: null,
    session: null,
    loading: true,
  })

  const fetchProfile = useCallback(async (userId: string) => {
    return adminFetchProfile(userId)
  }, [])

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        const profile = await fetchProfile(session.user.id)
        setState({ user: session.user, profile, session, loading: false })
      } else {
        setState({ user: null, profile: null, session: null, loading: false })
      }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (session?.user) {
          const profile = await fetchProfile(session.user.id)
          setState({ user: session.user, profile, session, loading: false })
        } else {
          setState({ user: null, profile: null, session: null, loading: false })
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [fetchProfile])

  const signIn = async (username: string, password: string) => {
    const { data: email, error: lookupError } = await supabase
      .rpc('get_email_by_username', { p_username: username })

    if (lookupError || !email) {
      return { data: null, error: new Error('Invalid username or password.') }
    }

    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    return { data, error }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
  }

  return { ...state, signIn, signOut }
}
