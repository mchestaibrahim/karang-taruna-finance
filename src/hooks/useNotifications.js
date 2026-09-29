import { useEffect, useMemo, useState } from 'react'
import { rupiah } from '../app/formatters'

export function useNotifications({ pendingExpenses, expenses, allTransactions, loadError, loadErrorAt }) {
  const [notifOpen, setNotifOpen] = useState(false)
  const [readNotifIds, setReadNotifIds] = useState(() => new Set())

  useEffect(() => {
    if (!notifOpen) return
    const onClick = (e) => {
      if (!e.target.closest('.notif-wrap')) setNotifOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [notifOpen])

  const notifications = useMemo(() => {
    const items = []

    pendingExpenses.forEach((x) => {
      items.push({
        id: `appr-pending-${x.id}`,
        group: 'approval',
        title: 'Menunggu approval',
        desc: `${x.category}: ${rupiah(x.amount)} - ${x.description}`,
        sortTime: x.sortTime,
      })
    })

    expenses
      .filter((x) => x.status === 'approved' && x.approvedAt)
      .forEach((x) => {
        items.push({
          id: `appr-ok-${x.id}`,
          group: 'approval',
          title: 'Pengeluaran disetujui',
          desc: `${x.category}: ${rupiah(x.amount)}`,
          sortTime: new Date(x.approvedAt).getTime(),
        })
      })

    expenses
      .filter((x) => x.status === 'rejected')
      .forEach((x) => {
        items.push({
          id: `appr-rej-${x.id}`,
          group: 'approval',
          title: 'Pengeluaran ditolak',
          desc: `${x.category}: ${rupiah(x.amount)}${x.rejectReason ? ` - ${x.rejectReason}` : ''}`,
          sortTime: x.sortTime,
        })
      })

    allTransactions
      .filter((t) => !t.voided && t.kind !== 'pengeluaran')
      .slice(0, 5)
      .forEach((t) => {
        items.push({
          id: `tx-${t.key}`,
          group: 'transaksi',
          title: 'Transaksi baru ditambahkan',
          desc: `${t.type} ${t.name}: ${rupiah(t.amount)}`,
          sortTime: t.sortTime,
        })
      })

    if (loadError) {
      items.push({
        id: 'sys-load-error',
        group: 'sistem',
        title: 'Error sinkronisasi',
        desc: loadError,
        sortTime: loadErrorAt ?? 0,
      })
    }

    return items.sort((a, b) => b.sortTime - a.sortTime).slice(0, 20)
  }, [pendingExpenses, expenses, allTransactions, loadError, loadErrorAt])

  const unreadNotifCount = notifications.filter((n) => !readNotifIds.has(n.id)).length

  function markAllNotifsRead() {
    setReadNotifIds(new Set(notifications.map((n) => n.id)))
  }

  return {
    notifOpen,
    setNotifOpen,
    readNotifIds,
    notifications,
    unreadNotifCount,
    markAllNotifsRead,
  }
}
