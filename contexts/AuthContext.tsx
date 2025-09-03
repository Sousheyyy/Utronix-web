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
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true

    // Set a timeout to prevent infinite loading
    const timeoutId = setTimeout(() => {
      if (mounted) {
        console.warn('Auth loading timeout - setting loading to false')
        setLoading(false)
        
        // If we have a user but no profile, create a temporary profile
        if (user && !profile) {
          console.log('Creating temporary profile due to timeout')
          setProfile({
            id: user.id,
            email: user.email || '',
            full_name: user.user_metadata?.full_name || 'Unknown User',
            role: 'customer',
            company_name: user.user_metadata?.company_name || null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
        }
      }
    }, 5000) // Reduced to 5 second timeout

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return
      
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user) {
        fetchProfile(session.user.id)
      }
      setLoading(false)
      clearTimeout(timeoutId)
    }).catch((error) => {
      console.error('Error getting initial session:', error)
      if (mounted) {
        setLoading(false)
        clearTimeout(timeoutId)
      }
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return
      
      setSession(session)
      setUser(session?.user ?? null)
      
      if (session?.user) {
        await fetchProfile(session.user.id)
        
        // Set up real-time subscription for profile changes
        const profileChannel = supabase
          .channel('profile_changes')
          .on('postgres_changes', 
            { 
              event: 'UPDATE', 
              schema: 'public', 
              table: 'profiles',
              filter: `id=eq.${session.user.id}`
            }, 
            (payload) => {
              console.log('Profile updated:', payload)
              if (mounted) {
                setProfile(payload.new as Profile)
              }
            }
          )
          .subscribe()
        
        // Store channel for cleanup
        ;(window as any).profileChannel = profileChannel
      } else {
        setProfile(null)
        // Clean up profile channel
        if ((window as any).profileChannel) {
          supabase.removeChannel((window as any).profileChannel)
          delete (window as any).profileChannel
        }
      }
      
      setLoading(false)
      clearTimeout(timeoutId)
    })

    return () => {
      mounted = false
      clearTimeout(timeoutId)
      subscription.unsubscribe()
      
      // Clean up profile channel
      if ((window as any).profileChannel) {
        supabase.removeChannel((window as any).profileChannel)
        delete (window as any).profileChannel
      }
    }
  }, [])

  const fetchProfile = async (userId: string, forceRefresh = false) => {
    try {
      console.log('Fetching profile for user:', userId, 'Force refresh:', forceRefresh)
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) {
        console.error('Error fetching profile:', error)
        console.error('Error details:', {
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
          setProfile(null)
        }
        return
      }

      console.log('Profile fetched successfully:', data)
      setProfile(data)
    } catch (error) {
      console.error('Error fetching profile:', error)
      setProfile(null)
    }
  }

  const createDefaultProfile = async (userId: string) => {
    try {
      console.log('Creating default profile for user:', userId)
      
      // Get user email from auth
      const { data: { user: authUser } } = await supabase.auth.getUser()
      
      const { data, error } = await supabase
        .from('profiles')
        .insert([
          {
            id: userId,
            email: authUser?.email || '',
            full_name: authUser?.user_metadata?.full_name || 'Unknown User',
            role: 'customer', // Default role
            company_name: authUser?.user_metadata?.company_name || null,
          },
        ])
        .select()
        .single()

      if (error) {
        console.error('Error creating default profile:', error)
        setProfile(null)
        return
      }

      console.log('Default profile created successfully:', data)
      setProfile(data)
    } catch (error) {
      console.error('Error creating default profile:', error)
      setProfile(null)
    }
  }

  const refreshProfile = async () => {
    if (user?.id) {
      console.log('Refreshing profile...')
      
      // Debug: Check all profiles in the table
      const { data: allProfiles, error: debugError } = await supabase
        .from('profiles')
        .select('*')
      
      console.log('All profiles in database:', allProfiles)
      console.log('Debug error:', debugError)
      
      await fetchProfile(user.id, true)
    }
  }

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    return { error }
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
    refreshProfile,
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
