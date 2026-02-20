'use client'

import { createContext, useContext, useEffect, useState, useCallback, useMemo, useRef } from 'react'
import { createSupabaseBrowserClient } from './supabase'
import type { User, Session } from '@supabase/supabase-js'
import type { Profile } from './types'

interface AuthContextType {
  user: User | null
  profile: Profile | null
  session: Session | null
  loading: boolean
  signInWithDiscord: () => Promise<void>
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const initAttempted = useRef(false)

  // Use memoized client to avoid re-creating
  const supabase = useMemo(() => createSupabaseBrowserClient(), [])

  const fetchProfile = useCallback(async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (error) {
      // Profile might not exist yet for new users - that's OK
      if (error.code !== 'PGRST116') {
        console.error('Error fetching profile:', error)
      }
      return null
    }

    return data as Profile
  }, [supabase])

  const refreshProfile = useCallback(async () => {
    if (!user) return
    const profileData = await fetchProfile(user.id)
    if (profileData) {
      setProfile(profileData)
    }
  }, [user, fetchProfile])

  useEffect(() => {
    // Prevent double initialization in strict mode
    if (initAttempted.current) return
    initAttempted.current = true

    // Get initial session with retry logic
    const initAuth = async () => {
      try {
        // First try to get existing session
        const { data: { session: initialSession }, error: sessionError } = await supabase.auth.getSession()

        if (sessionError) {
          console.error('Session error, clearing state:', sessionError)
          // Clear potentially corrupted auth state
          setSession(null)
          setUser(null)
          setProfile(null)
          setLoading(false)
          return
        }

        // If session exists, validate it's still fresh
        if (initialSession) {
          const expiresAt = initialSession.expires_at
          const now = Math.floor(Date.now() / 1000)

          // If session is expired or will expire in next 60 seconds, try refresh
          if (expiresAt && expiresAt - now < 60) {
            const { data: { session: refreshedSession }, error: refreshError } = await supabase.auth.refreshSession()

            if (refreshError || !refreshedSession) {
              // Refresh failed, clear session
              console.log('Session expired, clearing auth state')
              setSession(null)
              setUser(null)
              setProfile(null)
              setLoading(false)
              return
            }

            setSession(refreshedSession)
            setUser(refreshedSession.user)

            if (refreshedSession.user) {
              const profileData = await fetchProfile(refreshedSession.user.id)
              setProfile(profileData)
            }
          } else {
            // Session is valid
            setSession(initialSession)
            setUser(initialSession.user ?? null)

            if (initialSession?.user) {
              const profileData = await fetchProfile(initialSession.user.id)
              setProfile(profileData)
            }
          }
        }
      } catch (error) {
        console.error('Error initializing auth:', error)
        // On any error, clear auth state to prevent stuck loading
        setSession(null)
        setUser(null)
        setProfile(null)
      } finally {
        setLoading(false)
      }
    }

    initAuth()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        // Handle token refresh and sign out events
        if (event === 'TOKEN_REFRESHED' || event === 'SIGNED_IN') {
          setSession(newSession)
          setUser(newSession?.user ?? null)

          if (newSession?.user) {
            const profileData = await fetchProfile(newSession.user.id)
            setProfile(profileData)
          }
        } else if (event === 'SIGNED_OUT') {
          setSession(null)
          setUser(null)
          setProfile(null)
        } else {
          // For other events, just update state
          setSession(newSession)
          setUser(newSession?.user ?? null)

          if (newSession?.user) {
            const profileData = await fetchProfile(newSession.user.id)
            setProfile(profileData)
          } else {
            setProfile(null)
          }
        }
      }
    )

    return () => {
      subscription.unsubscribe()
    }
  }, [supabase, fetchProfile])

  const signInWithDiscord = async () => {
    const redirectUrl = typeof window !== 'undefined'
      ? `${window.location.origin}/auth/callback`
      : '/auth/callback'

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'discord',
      options: {
        redirectTo: redirectUrl,
      },
    })

    if (error) {
      console.error('Error signing in with Discord:', error)
      throw error
    }
  }

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) {
      console.error('Error signing out:', error)
      throw error
    }
    setUser(null)
    setProfile(null)
    setSession(null)
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        session,
        loading,
        signInWithDiscord,
        signOut,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
