'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { Profile, UserRole } from '@/types'

interface AuthContextType {
  user: User | null
  profile: Profile | null
  session: Session | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error: any }>
  signUp: (email: string, password: string, fullName: string, role: UserRole, companyName?: string) => Promise<{ error: any }>
  signOut: () => Promise<void>
  updateProfile: (updates: Partial<Profile>) => Promise<{ error: any }>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let isMounted = true

    // Get initial session with timeout
    const initAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('Error getting session:', error)
        }
        
        if (isMounted) {
          setSession(session)
          setUser(session?.user ?? null)
          if (session?.user) {
            await fetchProfile(session.user.id)
          }
          setLoading(false)
        }
      } catch (error) {
        console.error('Error initializing auth:', error)
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    initAuth()

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (isMounted) {
        setSession(session)
        setUser(session?.user ?? null)
        
        if (session?.user) {
          await fetchProfile(session.user.id)
        } else {
          setProfile(null)
        }
        
        setLoading(false)
      }
    })

    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
  }, [])

  const fetchProfile = async (userId: string) => {
    try {
      console.log('Fetching profile for user:', userId)
      
      // Add timeout to prevent hanging
      const profilePromise = supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Profile fetch timeout')), 5000)
      )

      const { data, error } = await Promise.race([profilePromise, timeoutPromise]) as any

      if (error) {
        console.error('Error fetching profile:', error)
        console.error('Profile fetch error details:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        })
        
        // If profile doesn't exist, create a default one
        if (error.code === 'PGRST116') {
          console.log('Profile not found, creating default profile...')
          await createDefaultProfile(userId)
        } else {
          // For other errors, try to create a default profile as fallback
          console.log('Profile fetch failed, attempting to create default profile...')
          await createDefaultProfile(userId)
        }
        return
      }

      console.log('Profile fetched successfully:', data)
      setProfile(data)
    } catch (error) {
      console.error('Error fetching profile:', error)
      if (error instanceof Error && error.message === 'Profile fetch timeout') {
        console.error('Profile fetch timed out - possible RLS or connection issue')
      }
    }
  }

  const createDefaultProfile = async (userId: string) => {
    try {
      console.log('Creating default profile for user:', userId)
      
      const { data: userData } = await supabase.auth.getUser()
      const user = userData.user
      
      if (!user) {
        console.error('No user data available for profile creation')
        return
      }

      const { data, error } = await supabase
        .from('profiles')
        .insert([
          {
            id: userId,
            email: user.email,
            full_name: user.user_metadata?.full_name || 'User',
            role: user.user_metadata?.role || 'customer',
            company_name: user.user_metadata?.company_name || null,
          },
        ])
        .select()
        .single()

      if (error) {
        console.error('Error creating profile:', error)
        
        // If profile already exists (duplicate key error), try to fetch it instead
        if (error.code === '23505') {
          console.log('Profile already exists, fetching existing profile...')
          const { data: existingProfile, error: fetchError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single()
          
          if (fetchError) {
            console.error('Error fetching existing profile:', fetchError)
            return
          }
          
          console.log('Existing profile fetched:', existingProfile)
          setProfile(existingProfile)
        }
        return
      }

      console.log('Default profile created:', data)
      setProfile(data)
    } catch (error) {
      console.error('Error creating default profile:', error)
    }
  }

  const signIn = async (email: string, password: string) => {
    try {
      console.log('Attempting to sign in user:', email)
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        console.error('Sign in error:', error)
        return { error }
      }

      console.log('Sign in successful:', data.user?.id)
      return { error: null }
    } catch (error) {
      console.error('Unexpected sign in error:', error)
      return { error: { message: 'An unexpected error occurred during sign in' } }
    }
  }

  const signUp = async (email: string, password: string, fullName: string, role: UserRole, companyName?: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: undefined, // Disable email confirmation
        data: {
          full_name: fullName,
          role,
          company_name: companyName,
        },
      },
    })

    // If there's an error about email confirmation, provide helpful message
    if (error && error.message.includes('email_not_confirmed')) {
      return { 
        error: { 
          message: 'Email confirmation is still enabled. Please disable it in Supabase dashboard under Authentication → Settings.' 
        } 
      }
    }

    if (error) return { error }

    // Create profile after successful signup
    if (data.user) {
      const { error: profileError } = await supabase
        .from('profiles')
        .insert([
          {
            id: data.user.id,
            email,
            full_name: fullName,
            role,
            company_name: companyName,
          },
        ])

      if (profileError) {
        console.error('Error creating profile:', profileError)
        return { error: profileError }
      }

      // After successful signup and profile creation, the auth state change
      // will automatically be triggered by Supabase, which will:
      // 1. Set the user and session
      // 2. Fetch the profile
      // 3. Redirect to the appropriate dashboard
    }

    return { error: null }
  }

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) {
        console.error('Error signing out:', error)
        return
      }
      
      // Clear local state
      setUser(null)
      setProfile(null)
      setSession(null)
    } catch (error) {
      console.error('Error during sign out:', error)
    }
  }

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!user) return { error: new Error('No user logged in') }

    const { error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', user.id)

    if (!error) {
      setProfile(prev => prev ? { ...prev, ...updates } : null)
    }

    return { error }
  }

  const value = {
    user,
    profile,
    session,
    loading,
    signIn,
    signUp,
    signOut,
    updateProfile,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
