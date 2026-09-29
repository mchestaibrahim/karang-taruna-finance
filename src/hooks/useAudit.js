import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

export function useAudit({ page, role }) {
  const [auditRows, setAuditRows] = useState([])
  const [auditLoading, setAuditLoading] = useState(false)
  const [auditError, setAuditError] = useState('')

  useEffect(() => {
    if (page !== 'log' || !role) return

    let cancelled = false

    async function loadAudit() {
      setAuditLoading(true)

      const { data, error } = await supabase
        .from('audit_log')
        .select('*')
        .order('id', { ascending: false })
        .limit(200)

      if (cancelled) return

      setAuditLoading(false)

      if (error) {
        console.error('Gagal memuat log:', error)
        setAuditError('Gagal memuat log aktivitas.')
        return
      }

      setAuditError('')
      setAuditRows(data)
    }

    loadAudit()

    return () => {
      cancelled = true
    }
  }, [page, role])

  return { auditRows, auditLoading, auditError }
}
