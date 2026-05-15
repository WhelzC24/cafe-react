import { createContext, useContext } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { Profile } from '../types'

interface AuthContextValue {
  user: User | null
  profile: Profile | null
  session: Session | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ data: unknown; error: unknown }>
  signOut: () => Promise<void>
}

export const AuthContext = createContext<AuthContextValue>({
  user: null,
  profile: null,
  session: null,
  loading: true,
  signIn: async () => ({ data: null, error: null }),
  signOut: async () => {},
})

export const useAuthContext = () => useContext(AuthContext)
