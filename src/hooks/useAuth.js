import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

export function useAuth() {
  const [session, setSession] = useState(null)
  const [authReady, setAuthReady] = useState(false)
  const [role, setRole] = useState(undefined)
  const [roleError, setRoleError] = useState('')

  useEffect(() => {
    let active = true

    supabase.auth.getSession().then(({ data }) => {
      if (!active) return
      setSession(data.session)
      setAuthReady(true)
    })

    const { data } = supabase.auth.onAuthStateChange((_event, newSession) => {
      if (active) setSession(newSession)
    })

    return () => {
      active = false
      data.subscription.unsubscribe()
    }
  }, [])

  const userId = session?.user?.id

  useEffect(() => {
    // Reset role immediately when the authenticated user changes.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setRole(undefined)
    setRoleError('')
    if (!userId) return undefined

    let cancelled = false

    supabase
      .from('pengurus_roles')
      .select('role')
      .eq('user_id', userId)
      .maybeSingle()
      .then(({ data, error }) => {
        if (cancelled) return

        if (error) {
          console.error('Gagal membaca peran:', error)
          setRoleError(
            'Peran akun tidak bisa dibaca. Pastikan tabel pengurus_roles sudah dijalankan di Supabase.'
          )
          setRole(null)
          return
        }

        setRole(data?.role ?? null)
      })

    return () => {
      cancelled = true
    }
  }, [userId])

  async function logout() {
    await supabase.auth.signOut()
    setSession(null)
    setRole(undefined)
  }

  return {
    session,
    authReady,
    role,
    roleError,
    userId,
    logout,
  }
}
