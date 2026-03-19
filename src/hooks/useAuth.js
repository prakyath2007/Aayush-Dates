import { useState, useEffect, useCallback } from 'react'
import { supabase, ready } from '../lib/supabase.js'

export function useAuth() {
  const [user, setUser] = useState(null)
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let mounted = true

    async function init() {
      await ready
      if (!supabase) {
        if (mounted) setLoading(false)
        return
      }
      try {
        const { data: { session: currentSession } } = await supabase.auth.getSession()
        if (mounted) {
          setSession(currentSession)
          setUser(currentSession?.user ?? null)
        }
      } catch (err) {
        console.warn('Auth init error:', err.message)
      } finally {
        if (mounted) setLoading(false)
      }
    }

    init()

    // Only set up listener if supabase exists
    let subscription = null
    ready.then(() => {
      if (!supabase || !mounted) return
      const { data } = supabase.auth.onAuthStateChange((_event, newSession) => {
        if (mounted) {
          setSession(newSession)
          setUser(newSession?.user ?? null)
          setLoading(false)
        }
      })
      subscription = data?.subscription
    })

    return () => {
      mounted = false
      subscription?.unsubscribe()
    }
  }, [])

  const login = useCallback(async (email, password) => {
    await ready
    setError(null)
    setLoading(true)

    if (!supabase) {
      // Demo mode
      const demoUser = { id: 'demo-' + Date.now(), email }
      setUser(demoUser)
      setLoading(false)
      return { success: true, user: demoUser }
    }

    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password })
      if (authError) throw authError
      setUser(data.user)
      setSession(data.session)
      return { success: true, user: data.user }
    } catch (err) {
      setError(err.message)
      return { success: false, error: err.message }
    } finally {
      setLoading(false)
    }
  }, [])

  const signup = useCallback(async (email, password, profileData = {}) => {
    await ready
    setError(null)
    setLoading(true)

    if (!supabase) {
      // Demo mode
      const demoUser = { id: 'demo-' + Date.now(), email, user_metadata: { name: profileData.name } }
      setUser(demoUser)
      setLoading(false)
      return { success: true, user: demoUser }
    }

    try {
      const { data, error: authError } = await supabase.auth.signUp({
        email, password,
        options: { data: { name: profileData.name || '' } }
      })
      if (authError) throw authError

      if (data.user) {
        await supabase.from('profiles').insert({
          user_id: data.user.id,
          name: profileData.name || 'New User',
          age: profileData.age || 25,
          location: profileData.location || '',
          height: profileData.height || null,
          education: profileData.education || null,
          job: profileData.job || null,
          company: profileData.company || null,
          bio: profileData.bio || '',
          interests: profileData.interests || [],
          instagram: profileData.instagram || false,
          linkedin: profileData.linkedin || false,
          strava: profileData.strava || false,
          ipo_price: 100.0,
          current_price: 100.0,
        }).then(({ error: profileError }) => {
          if (profileError) console.warn('Profile creation error:', profileError.message)
        })

        await supabase.from('token_ledger').insert({
          user_id: data.user.id,
          amount: 500,
          reason: 'initial_allocation',
          balance: 500,
        }).then(({ error: tokenError }) => {
          if (tokenError) console.warn('Token allocation error:', tokenError.message)
        })
      }

      setUser(data.user)
      setSession(data.session)
      return { success: true, user: data.user }
    } catch (err) {
      setError(err.message)
      return { success: false, error: err.message }
    } finally {
      setLoading(false)
    }
  }, [])

  const logout = useCallback(async () => {
    await ready
    setError(null)
    if (!supabase) {
      setUser(null)
      setSession(null)
      return { success: true }
    }
    try {
      await supabase.auth.signOut()
      setUser(null)
      setSession(null)
      return { success: true }
    } catch (err) {
      setError(err.message)
      return { success: false, error: err.message }
    }
  }, [])

  const getTokenBalance = useCallback(async () => {
    if (!user || !supabase) return 500
    try {
      const { data, error: rpcError } = await supabase.rpc('get_token_balance', { p_user_id: user.id })
      if (rpcError) throw rpcError
      return data || 0
    } catch {
      return 500
    }
  }, [user])

  return { user, session, loading, error, isAuthenticated: !!session, login, signup, logout, getTokenBalance }
}
