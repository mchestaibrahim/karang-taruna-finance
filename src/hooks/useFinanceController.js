import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAudit } from './useAudit'
import { useChatAssistant } from './useChatAssistant'
import { useNotifications } from './useNotifications'
import {
  DEFAULT_TARGET,
  EXPENSE_CATEGORIES,
  MIN_REJECT_REASON,
  MIN_VOID_REASON,
  PRODUCTS,
  PROOF_BUCKET,
  VENDOR_CATEGORY,
} from '../app/config'
import { describeAudit, downloadFile, findPossibleDuplicate, proofPath } from '../app/helpers'
import { toDanusan, toExpense, toOtherIncome, toPayment } from '../app/mappers'
import { scanReceiptWithAI } from '../app/receiptScan'
import {
  currentMonthKey,
  monthKeyFromTime,
  monthLabel,
  newDanusanItems,
  rupiah,
  todayISO,
} from '../app/formatters'

export function useFinanceController({ page, setPage, role, userId, logout }) {

  const { auditRows, auditLoading, auditError } = useAudit({ page, role })

  const [members, setMembers] = useState([])
  const [payments, setPayments] = useState([])
  const [danusanTransactions, setDanusanTransactions] = useState([])
  const [expenses, setExpenses] = useState([])
  const [otherIncome, setOtherIncome] = useState([])
  const [carwashAllocations, setCarwashAllocations] = useState([])
  const [loading, setLoading] = useState(false)
  const [loadError, setLoadError] = useState('')
  const [loadErrorAt, setLoadErrorAt] = useState(null)
  const [saving, setSaving] = useState(false)

  // Form anggota
  const [newName, setNewName] = useState('')
  const [newTarget, setNewTarget] = useState(String(DEFAULT_TARGET))
  const [search, setSearch] = useState('')
  const [editingId, setEditingId] = useState(null)
  const [editName, setEditName] = useState('')
  const [editTarget, setEditTarget] = useState('')

  // Form nyicil
  const [nyicilMember, setNyicilMember] = useState('')
  const [paymentAmount, setPaymentAmount] = useState('')
  const [nyicilProof, setNyicilProof] = useState(null)

  // Form danusan
  const [danusanMember, setDanusanMember] = useState('')
  const [danusanItems, setDanusanItems] = useState(() => newDanusanItems(PRODUCTS))
  const [danusanProof, setDanusanProof] = useState(null)

  // Form pengeluaran
  const [expDate, setExpDate] = useState(todayISO)
  const [expCategory, setExpCategory] = useState(EXPENSE_CATEGORIES[0])
  const [expDesc, setExpDesc] = useState('')
  const [expAmount, setExpAmount] = useState('')
  const [expProof, setExpProof] = useState(null)
  // Form pemasukan lainnya
const [incomeDate, setIncomeDate] = useState(todayISO)
const [incomeType, setIncomeType] = useState('nyuci')
const [incomeSource, setIncomeSource] = useState('')
const [incomeDesc, setIncomeDesc] = useState('')
const [incomeAmount, setIncomeAmount] = useState('')
const [incomeProof, setIncomeProof] = useState(null)
// Form pembagian Nyuci
const [carwashLabel, setCarwashLabel] = useState('Day 1')
const [carwashAmount, setCarwashAmount] = useState('')
const [carwashMembers, setCarwashMembers] = useState([])
 // Filter transaksi
const [txMember, setTxMember] = useState('')
const [txType, setTxType] = useState('all')
const [txStatus, setTxStatus] = useState('all')
const [txSearch, setTxSearch] = useState('')
const [txSort, setTxSort] = useState('date-desc')

// Filter log aktivitas
const [logSearch, setLogSearch] = useState('')

  // Laporan bulanan
  const [reportMonth, setReportMonth] = useState(currentMonthKey)

  // Pembatalan
  const [voidTarget, setVoidTarget] = useState(null)
  const [voidReason, setVoidReason] = useState('')
  const [voidError, setVoidError] = useState('')
  const [voidBusy, setVoidBusy] = useState(false)

  // Persetujuan pengeluaran
  const [approveBusyId, setApproveBusyId] = useState(null)
  const [rejectTarget, setRejectTarget] = useState(null)
  const [rejectReason, setRejectReason] = useState('')
  const [rejectError, setRejectError] = useState('')
  const [rejectBusy, setRejectBusy] = useState(false)

  // Pesan
  const [formError, setFormError] = useState('')
  const [toast, setToast] = useState('')

  // AI Receipt Scanner (form Pengeluaran)
  const [aiScanBusy, setAiScanBusy] = useState(false)
  const [aiScanError, setAiScanError] = useState('')
  const [aiScanResult, setAiScanResult] = useState(null)

  const canEdit = role === 'bendahara'
  // Pengurus berperan sebagai verifikator: tidak bisa input transaksi, tapi
  // bisa menyetujui/menolak pengeluaran yang dicatat bendahara. Ini yang
  // mencegah satu orang pegang kendali penuh atas uang kas.
  const canApprove = role === 'pengurus'

  /* ----- Muat data (hanya kalau sudah login dan punya peran) ----- */

  useEffect(() => {
    if (!userId || !role) {
      // Kosongkan data lama saat logout / belum ada peran, sebelum efek ini
      // fetch ulang begitu userId atau role berubah. Pola reset-lalu-fetch
      // standar untuk data fetching manual, bukan derived state dari render.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setMembers([])
      setPayments([])
      setDanusanTransactions([])
      setExpenses([])
      setOtherIncome([])
      return
    }

    let cancelled = false

    async function loadAll() {
      setLoading(true)
      setLoadError('')
      setLoadErrorAt(null)

      const [
  membersRes,
  txRes,
  expRes,
  incomeRes,
  carwashRes,
] = await Promise.all([
  supabase.from('members').select('*').order('id', { ascending: true }),
  supabase.from('transactions').select('*').order('id', { ascending: true }),
  supabase.from('expenses').select('*').order('id', { ascending: true }),
  supabase.from('other_income').select('*').order('id', { ascending: true }),
  supabase
    .from('carwash_allocations')
    .select('*')
    .order('id', { ascending: true }),
])

      if (cancelled) return

      const failed =
  membersRes.error ||
  txRes.error ||
  expRes.error ||
  incomeRes.error ||
  carwashRes.error

      if (failed) {
        console.error('Gagal memuat data:', failed)
        setLoadError('Gagal memuat data dari database. Periksa koneksi lalu muat ulang halaman.')
        setLoadErrorAt(Date.now())
        setLoading(false)
        return
      }

      setMembers(membersRes.data)
      setPayments(txRes.data.filter((r) => r.type === 'nyicil').map(toPayment))
      setDanusanTransactions(txRes.data.filter((r) => r.type === 'danusan').map(toDanusan))
      setExpenses(expRes.data.map(toExpense))
setOtherIncome(incomeRes.data.map(toOtherIncome))
setCarwashAllocations(carwashRes.data)
setLoading(false)
    }

    loadAll()

    return () => {
      cancelled = true
    }
  }, [userId, role])

  useEffect(() => {
    if (!toast) return
    const timer = setTimeout(() => setToast(''), 2200)
    return () => clearTimeout(timer)
  }, [toast])

  function goTo(id) {
    setPage(id)
    setFormError('')
    setEditingId(null)
  }

  async function handleLogout() {
    await logout()
    setPage('dashboard')
  }

  /* ----- Data turunan ----- */

  const activeMembers = members.filter((m) => m.active !== false)

  // Hanya catatan yang TIDAK dibatalkan yang dihitung
  const livePayments = payments.filter((p) => !p.voided)
  const liveDanusan = danusanTransactions.filter((t) => !t.voided)
  // Pengeluaran yang dihitung ke kas: tidak dibatalkan DAN sudah disetujui.
  // Yang masih menunggu atau ditolak sengaja tidak mengurangi saldo, supaya
  // saldo kas selalu mencerminkan uang yang benar-benar sudah keluar & sah.
  // Dimemo supaya jadi dependency yang stabil untuk memo lain (notifications,
  // dashboardCategoryBreakdown), bukan array baru di setiap render.
  const liveExpenses = useMemo(
    () => expenses.filter((x) => !x.voided && x.status === 'approved'),
    [expenses]
  )
  const pendingExpenses = useMemo(
    () => expenses.filter((x) => !x.voided && x.status === 'pending'),
    [expenses]
  )

  // ID pemasukan lainnya yang sudah dibatalkan. Dipakai supaya potongan
  // Nyuci yang induknya dibatalkan otomatis tidak lagi dihitung ke anggota,
  // tanpa perlu menghapus baris carwash_allocations itu sendiri.
  const voidedIncomeIds = useMemo(
    () => new Set(otherIncome.filter((x) => x.voided).map((x) => x.id)),
    [otherIncome]
  )

  const stats = useMemo(
    () =>
      members.map((member) => {
        const nyicil = payments
  .filter((p) => !p.voided && p.memberId === member.id)
  .reduce((sum, p) => sum + p.amount, 0)

const danusan = danusanTransactions
  .filter((t) => !t.voided && t.memberId === member.id)
  .reduce((sum, t) => sum + t.profit, 0)

const carwash = carwashAllocations
  .filter(
    (a) =>
      a.member_id === member.id && !voidedIncomeIds.has(a.other_income_id)
  )
  .reduce((sum, a) => sum + Number(a.amount || 0), 0)

const total = nyicil + danusan + carwash

        return {
  ...member,
  aktif: member.active !== false,
  nyicil,
  danusan,
  carwash,
  total,
  sisa: Math.max(member.target - total, 0),
  pct: member.target > 0 ? (total / member.target) * 100 : 0,
  lunas: total >= member.target,
}
      }),
    [members, payments, danusanTransactions, carwashAllocations, voidedIncomeIds]
  )

  const activeStats = stats.filter((s) => s.aktif)

  const totalNyicil = livePayments.reduce((sum, p) => sum + p.amount, 0)
const totalDanusan = liveDanusan.reduce((sum, t) => sum + t.total, 0)
const totalBati = liveDanusan.reduce((sum, t) => sum + t.profit, 0)
const totalVendor = liveDanusan.reduce((sum, t) => sum + t.vendor, 0)

const totalOtherIncome = otherIncome
  .filter((x) => !x.voided)
  .reduce((sum, x) => sum + x.amount, 0)

const totalMasuk = totalNyicil + totalDanusan + totalOtherIncome
  const totalKeluar = liveExpenses.reduce((sum, x) => sum + x.amount, 0)
  const totalPending = pendingExpenses.reduce((sum, x) => sum + x.amount, 0)
  const setorVendor = liveExpenses
    .filter((x) => x.category === VENDOR_CATEGORY)
    .reduce((sum, x) => sum + x.amount, 0)
  const vendorBelumDisetor = Math.max(totalVendor - setorVendor, 0)
  const saldoKas = totalMasuk - totalKeluar
  const saldoBersih = saldoKas - vendorBelumDisetor

  const lunasCount = activeStats.filter((s) => s.lunas).length
  const totalTarget = activeStats.reduce((sum, s) => sum + s.target, 0)
  const totalCollected = activeStats.reduce(
    (sum, s) => sum + Math.min(s.total, s.target),
    0
  )
  const belumLunas = activeStats
    .filter((s) => !s.lunas)
    .sort((a, b) => b.sisa - a.sisa)

  const nameOfMember = (id) =>
    members.find((m) => m.id === id)?.name ?? '(anggota tidak ditemukan)'

  // Baris carwash_allocations milik satu catatan Pemasukan Lainnya (Nyuci),
  // dipakai untuk menampilkan rincian siapa saja yang kepotong di riwayat.
  const carwashAllocationsFor = (incomeId) =>
    carwashAllocations.filter((a) => a.other_income_id === incomeId)

  const allTransactions = useMemo(() => {
    const nameOf = (id) =>
      members.find((m) => m.id === id)?.name ?? '(anggota tidak ditemukan)'

    const nyicilRows = payments.map((p) => ({
      key: `n-${p.id}`,
      id: p.id,
      kind: 'nyicil',
      type: 'Nyicil',
      memberId: p.memberId,
      name: nameOf(p.memberId),
      date: p.date,
      sortTime: p.sortTime,
      amount: p.amount,
      detail: 'Pembayaran cicilan',
      status: 'approved',
      voided: p.voided,
      voidReason: p.voidReason,
    }))

    const danusanRows = danusanTransactions.map((t) => ({
      key: `d-${t.id}`,
      id: t.id,
      kind: 'danusan',
      type: 'Danusan',
      memberId: t.memberId,
      name: nameOf(t.memberId),
      date: t.date,
      sortTime: t.sortTime,
      amount: t.total,
      profit: t.profit,
      vendor: t.vendor,
      detail: (t.items || [])
        .map((item) => `${item.product} x${item.quantity}`)
        .join(', '),
      status: 'approved',
      voided: t.voided,
      voidReason: t.voidReason,
    }))

    const expenseRows = expenses.map((x) => ({
      key: `e-${x.id}`,
      id: x.id,
      kind: 'pengeluaran',
      type: 'Pengeluaran',
      memberId: null,
      name: x.category,
      date: x.date,
      sortTime: x.sortTime,
      amount: x.amount,
      detail: x.description,
      status: x.status,
      rejectReason: x.rejectReason,
      voided: x.voided,
      voidReason: x.voidReason,
    }))
    const otherIncomeRows = otherIncome.map((x) => ({
  key: `i-${x.id}`,
  id: x.id,
  kind: 'pemasukan-lainnya',
  type: 'Pemasukan Lainnya',
  memberId: null,
  name:
    x.sourceName ||
    (x.type === 'nyuci'
      ? 'Nyuci'
      : x.type === 'bantuan'
        ? 'Bantuan'
        : 'Lainnya'),
  date: x.date,
  sortTime: x.sortTime,
  amount: x.amount,
  detail: x.description,
  status: 'approved',
  voided: x.voided,
  voidReason: x.voidReason,
}))
   return [
  ...nyicilRows,
  ...danusanRows,
  ...expenseRows,
  ...otherIncomeRows,
].sort((a, b) => b.sortTime - a.sortTime || b.id - a.id)
 }, [members, payments, danusanTransactions, expenses, otherIncome])

  const {
    notifOpen,
    setNotifOpen,
    readNotifIds,
    notifications,
    unreadNotifCount,
    markAllNotifsRead,
  } = useNotifications({ pendingExpenses, expenses, allTransactions, loadError, loadErrorAt })

 const filteredTx = allTransactions.filter((t) => {
  const query = txSearch.trim().toLowerCase()

  const matchesSearch =
    !query ||
    [
      t.name,
      t.type,
      t.detail,
      t.date,
      rupiah(t.amount),
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()
      .includes(query)

  const matchesType = txType === 'all' || t.kind === txType

  const matchesMember =
    txMember === '' || t.memberId === Number(txMember)

  const matchesStatus =
    txStatus === 'all' ||
    (txStatus === 'voided' ? t.voided : !t.voided && t.status === txStatus)

  return matchesSearch && matchesType && matchesMember && matchesStatus
})
  .sort((a, b) => {
    if (txSort === 'date-asc') return a.sortTime - b.sortTime
    if (txSort === 'amount-desc') return b.amount - a.amount
    if (txSort === 'amount-asc') return a.amount - b.amount
    return b.sortTime - a.sortTime
  })

  // Nominal yang belum disetujui tidak dihitung ke ringkasan masuk/keluar,
  // supaya angka di halaman Transaksi selalu selaras dengan Dashboard.
  const filteredMasuk = filteredTx
    .filter((t) => !t.voided && t.kind !== 'pengeluaran')
    .reduce((sum, t) => sum + t.amount, 0)
  const filteredKeluar = filteredTx
    .filter((t) => !t.voided && t.kind === 'pengeluaran' && t.status === 'approved')
    .reduce((sum, t) => sum + t.amount, 0)

  const chartData = useMemo(() => {
    const grouped = {}

    allTransactions
      .filter((t) => !t.voided && (t.kind !== 'pengeluaran' || t.status === 'approved'))
      .forEach((t) => {
        if (!grouped[t.date]) {
          grouped[t.date] = { tanggal: t.date, masuk: 0, bati: 0, keluar: 0 }
        }

        if (t.kind === 'pengeluaran') {
          grouped[t.date].keluar += Number(t.amount) || 0
          return
        }

        grouped[t.date].masuk += Number(t.amount) || 0

        if (t.kind === 'danusan') {
          grouped[t.date].bati += Number(t.profit) || 0
        }
      })

    return Object.values(grouped).reverse()
  }, [allTransactions])

  const filteredStats = stats.filter((s) =>
    s.name.toLowerCase().includes(search.trim().toLowerCase())
  )

  // Data untuk halaman Laporan Bulanan: semua transaksi sah (tidak dibatalkan,
  // dan khusus pengeluaran hanya yang sudah disetujui) pada bulan yang dipilih.
  const reportTransactions = useMemo(
    () =>
      allTransactions.filter(
        (t) =>
          !t.voided &&
          (t.kind !== 'pengeluaran' || t.status === 'approved') &&
          monthKeyFromTime(t.sortTime) === reportMonth
      ),
    [allTransactions, reportMonth]
  )

  const reportMasuk = reportTransactions
    .filter((t) => t.kind !== 'pengeluaran')
    .reduce((sum, t) => sum + t.amount, 0)
  const reportKeluar = reportTransactions
    .filter((t) => t.kind === 'pengeluaran')
    .reduce((sum, t) => sum + t.amount, 0)
  const reportBati = reportTransactions
    .filter((t) => t.kind === 'danusan')
    .reduce((sum, t) => sum + (t.profit || 0), 0)
  const reportVendor = reportTransactions
    .filter((t) => t.kind === 'danusan')
    .reduce((sum, t) => sum + (t.vendor || 0), 0)
  const reportSaldo = reportMasuk - reportKeluar
  const reportNyicilCount = reportTransactions.filter((t) => t.kind === 'nyicil').length
  const reportDanusanCount = reportTransactions.filter((t) => t.kind === 'danusan').length

  const reportByCategory = useMemo(() => {
    const grouped = {}
    reportTransactions
      .filter((t) => t.kind === 'pengeluaran')
      .forEach((t) => {
        grouped[t.name] = (grouped[t.name] || 0) + t.amount
      })
    return Object.entries(grouped).sort((a, b) => b[1] - a[1])
  }, [reportTransactions])

  function reportSummaryText() {
    const lines = [
      `Laporan Keuangan Karang Taruna - ${monthLabel(reportMonth)}`,
      '',
      `Uang masuk: ${rupiah(reportMasuk)} (${reportNyicilCount} nyicil, ${reportDanusanCount} danusan)`,
      `Bati Karang Taruna: ${rupiah(reportBati)}`,
      `Bagian vendor bulan ini: ${rupiah(reportVendor)}`,
      `Pengeluaran (disetujui): ${rupiah(reportKeluar)}`,
      `Saldo bulan ini: ${rupiah(reportSaldo)}`,
    ]

    if (reportByCategory.length > 0) {
      lines.push('', 'Rincian pengeluaran per kategori:')
      reportByCategory.forEach(([cat, amount]) => {
        lines.push(`- ${cat}: ${rupiah(amount)}`)
      })
    }

    if (belumLunas.length > 0) {
      lines.push('', `Anggota belum lunas (status terkini, ${belumLunas.length} orang):`)
      belumLunas.slice(0, 10).forEach((m) => {
        lines.push(`- ${m.name}: sisa ${rupiah(m.sisa)}`)
      })
      if (belumLunas.length > 10) {
        lines.push(`- dan ${belumLunas.length - 10} lainnya`)
      }
    }

    if (vendorBelumDisetor > 0) {
      lines.push('', `Perhatian: vendor belum disetor ${rupiah(vendorBelumDisetor)}.`)
    }

    return lines.join('\n')
  }

  async function copyReportSummary() {
    try {
      await navigator.clipboard.writeText(reportSummaryText())
      setToast('Ringkasan disalin, siap ditempel ke WhatsApp/rapat')
    } catch (copyError) {
      console.error('Gagal menyalin ringkasan:', copyError)
      setToast('Gagal menyalin. Coba lagi atau salin manual.')
    }
  }

  const danusanResult = useMemo(() => {
    let total = 0
    let profit = 0

    danusanItems.forEach((item) => {
      total += item.price * item.quantity
      const product = PRODUCTS.find((p) => p.name === item.product)
      if (product) profit += product.profit * item.quantity
    })

    return { total, profit, vendor: total - profit }
  }, [danusanItems])

  const nyicilTarget = stats.find((s) => String(s.id) === nyicilMember)

  // Ringkasan kategori pengeluaran bulan berjalan, untuk dashboard.
  const dashboardCategoryBreakdown = useMemo(() => {
    const thisMonth = currentMonthKey()
    const grouped = {}
    liveExpenses
      .filter((x) => monthKeyFromTime(x.sortTime) === thisMonth)
      .forEach((x) => {
        grouped[x.category] = (grouped[x.category] || 0) + x.amount
      })
    return Object.entries(grouped).sort((a, b) => b[1] - a[1])
  }, [liveExpenses])

  /* ----- Bukti (bucket privat, link sementara) ----- */

  async function openProof(value) {
    const path = proofPath(value)
    if (!path) return

    // Buka tab dulu (masih dalam klik pengguna) supaya tidak diblokir popup blocker.
    const tab = window.open('', '_blank')

    const { data, error } = await supabase.storage
      .from(PROOF_BUCKET)
      .createSignedUrl(path, 120)

    if (error || !data?.signedUrl) {
      console.error('Gagal membuka bukti:', error)
      if (tab) tab.close()
      setToast('Gagal membuka bukti')
      return
    }

    if (tab) {
      tab.opener = null
      tab.location.href = data.signedUrl
    } else {
      setToast('Izinkan pop-up di browser untuk melihat bukti')
    }
  }

  // Upload file bukti. Mengembalikan path file, atau melempar error.
  async function uploadProof(folder, file) {
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '-')
    const filePath = `${folder}/${crypto.randomUUID()}-${safeName}`

    const { error } = await supabase.storage
      .from(PROOF_BUCKET)
      .upload(filePath, file, { contentType: file.type, upsert: false })

    if (error) throw error
    return filePath
  }

  function removeProof(filePath) {
    // Dipakai kalau upload sudah berhasil tapi simpan catatan gagal.
    return supabase.storage.from(PROOF_BUCKET).remove([filePath])
  }

  /* ----- Pembatalan ----- */

  function askVoid(target) {
    setVoidTarget(target)
    setVoidReason('')
    setVoidError('')
  }

  function closeVoid() {
    setVoidTarget(null)
  }

  async function confirmVoid(e) {
    e.preventDefault()
    const reason = voidReason.trim()

    if (reason.length < MIN_VOID_REASON) {
      return setVoidError(`Tulis alasan pembatalan (minimal ${MIN_VOID_REASON} huruf).`)
    }

    setVoidBusy(true)
    setVoidError('')

    const table =
  voidTarget.kind === 'pengeluaran'
    ? 'expenses'
    : voidTarget.kind === 'pemasukan-lainnya'
      ? 'other_income'
      : 'transactions'

    const { data, error } = await supabase
      .from(table)
      .update({ voided_at: new Date().toISOString(), void_reason: reason })
      .eq('id', voidTarget.id)
      .select()
      .single()

    setVoidBusy(false)

    if (error) {
      console.error('Gagal membatalkan:', error)
      return setVoidError('Gagal membatalkan. Pastikan kamu login sebagai bendahara.')
    }

    const swap = (convert) => (list) =>
      list.map((item) => (item.id === voidTarget.id ? convert(data) : item))

    if (voidTarget.kind === 'nyicil') setPayments(swap(toPayment))
    if (voidTarget.kind === 'danusan') setDanusanTransactions(swap(toDanusan))
    if (voidTarget.kind === 'pengeluaran') setExpenses(swap(toExpense))
      if (voidTarget.kind === 'pemasukan-lainnya') {
  setOtherIncome(swap(toOtherIncome))
}

    setVoidTarget(null)
    setToast('Catatan dibatalkan')
  }

  /* ----- Persetujuan pengeluaran (khusus pengurus/verifikator) ----- */

 async function approveExpense(expense) {
  if (role !== 'pengurus') {
    setToast('Akun ini bukan pengurus.')
    return
  }

  setApproveBusyId(expense.id)

  const { data, error } = await supabase.rpc('review_expense', {
    p_expense_id: expense.id,
    p_status: 'approved',
    p_reason: null,
  })

  setApproveBusyId(null)

  if (error) {
    console.error('Gagal menyetujui:', error)
    setToast(`Gagal menyetujui: ${error.message}`)
    return
  }

  setExpenses((list) =>
    list.map((x) => (x.id === expense.id ? toExpense(data) : x))
  )

  setToast('Pengeluaran disetujui')
}
  function askReject(expense) {
    setRejectTarget(expense)
    setRejectReason('')
    setRejectError('')
  }

  function closeReject() {
    setRejectTarget(null)
  }

 async function confirmReject(e) {
  e.preventDefault()

  if (role !== 'pengurus') {
    return setRejectError('Akun ini bukan pengurus.')
  }

  const reason = rejectReason.trim()

  if (reason.length < MIN_REJECT_REASON) {
    return setRejectError(
      `Tulis alasan penolakan (minimal ${MIN_REJECT_REASON} huruf).`
    )
  }

  setRejectBusy(true)
  setRejectError('')

  const { data, error } = await supabase.rpc('review_expense', {
    p_expense_id: rejectTarget.id,
    p_status: 'rejected',
    p_reason: reason,
  })

  setRejectBusy(false)

  if (error) {
    console.error('Gagal menolak:', error)
    return setRejectError(`Gagal menolak: ${error.message}`)
  }

  setExpenses((list) =>
    list.map((x) => (x.id === rejectTarget.id ? toExpense(data) : x))
  )

  setRejectTarget(null)
  setToast('Pengeluaran ditolak')
}

  const chatAssistant = useChatAssistant({
    role,
    canEdit,
    canApprove,
    totals: { totalMasuk, totalKeluar, saldoBersih, totalPending, vendorBelumDisetor },
    pendingExpenses,
    belumLunas,
    categories: EXPENSE_CATEGORIES,
    actions: { saveExpense, saveOtherIncome, approveExpense },
    setExpenses,
    setToast,
  })

  /* ----- Aksi: anggota ----- */

  async function addMember(e) {
    e.preventDefault()
    const name = newName.trim()
    const target = Number(newTarget)

    if (!name) return setFormError('Nama anggota tidak boleh kosong.')
    if (members.some((m) => m.name.toLowerCase() === name.toLowerCase())) {
      return setFormError('Nama anggota sudah ada.')
    }
    if (!(target > 0)) return setFormError('Target harus lebih dari 0.')

    const { data, error } = await supabase
      .from('members')
      .insert([{ name, target, active: true }])
      .select()
      .single()

    if (error) {
      console.error('Gagal menambah anggota:', error)
      return setFormError('Gagal menyimpan anggota ke database.')
    }

    setMembers((list) => [...list, data])
    setNewName('')
    setNewTarget(String(DEFAULT_TARGET))
    setFormError('')
    setToast('Anggota ditambahkan')
  }

  function startEdit(member) {
    setEditingId(member.id)
    setEditName(member.name)
    setEditTarget(String(member.target))
    setFormError('')
  }

  async function saveEdit(id) {
    const name = editName.trim()
    const target = Number(editTarget)

    if (!name) return setFormError('Nama tidak boleh kosong.')
    if (members.some((m) => m.id !== id && m.name.toLowerCase() === name.toLowerCase())) {
      return setFormError('Nama anggota sudah ada.')
    }
    if (!(target > 0)) return setFormError('Target harus lebih dari 0.')

    const { data, error } = await supabase
      .from('members')
      .update({ name, target })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Gagal mengubah anggota:', error)
      return setFormError('Gagal menyimpan perubahan ke database.')
    }

    setMembers((list) => list.map((m) => (m.id === id ? data : m)))
    setEditingId(null)
    setFormError('')
    setToast('Perubahan disimpan')
  }

  async function toggleActive(member) {
    const nextActive = member.active === false

    if (!nextActive) {
      const ok = window.confirm(
        `Nonaktifkan "${member.name}"? Riwayatnya tetap tersimpan, tapi ia tidak muncul di pilihan anggota dan tidak dihitung dalam target.`
      )
      if (!ok) return
    }

    const { data, error } = await supabase
      .from('members')
      .update({ active: nextActive })
      .eq('id', member.id)
      .select()
      .single()

    if (error) {
      console.error('Gagal mengubah status anggota:', error)
      setFormError('Gagal mengubah status anggota.')
      return
    }

    setMembers((list) => list.map((m) => (m.id === member.id ? data : m)))

    if (!nextActive) {
      if (nyicilMember === String(member.id)) setNyicilMember('')
      if (danusanMember === String(member.id)) setDanusanMember('')
    }

    setToast(nextActive ? 'Anggota diaktifkan' : 'Anggota dinonaktifkan')
  }

  /* ----- Aksi: nyicil ----- */

  async function addPayment(e) {
    e.preventDefault()
    const amount = Number(paymentAmount)

    if (!nyicilMember) return setFormError('Pilih anggota dulu.')
    if (!(amount > 0)) return setFormError('Nominal harus lebih dari 0.')
    if (!nyicilProof) return setFormError('Upload bukti pembayaran dulu.')
    if (nyicilProof.size > 6 * 1024 * 1024) {
      return setFormError('Ukuran file maksimal 6 MB.')
    }

    setSaving(true)
    setFormError('')

    let filePath
    try {
      filePath = await uploadProof('nyicil', nyicilProof)
    } catch (uploadError) {
      console.error('Gagal upload bukti:', uploadError)
      setSaving(false)
      return setFormError('Gagal mengupload bukti pembayaran.')
    }

    const { data, error } = await supabase
      .from('transactions')
      .insert([
        {
          member_id: Number(nyicilMember),
          type: 'nyicil',
          amount,
          profit: 0,
          vendor: 0,
          items: [],
          proof_url: filePath,
        },
      ])
      .select()
      .single()

    if (error) {
      console.error('Gagal menyimpan pembayaran:', error)
      await removeProof(filePath)
      setSaving(false)
      return setFormError('Gagal menyimpan pembayaran ke database.')
    }

    setPayments((list) => [...list, toPayment(data)])
    setNyicilMember('')
    setPaymentAmount('')
    setNyicilProof(null)
    setSaving(false)
    setToast('Pembayaran + bukti disimpan')
  }

  /* ----- Aksi: danusan ----- */

  function updateItem(index, changes) {
    setDanusanItems((items) =>
      items.map((item, i) => (i === index ? { ...item, ...changes } : item))
    )
  }

  async function saveDanusan(e) {
    e.preventDefault()

    if (!danusanMember) return setFormError('Pilih anggota dulu.')
    if (danusanResult.total === 0) {
      return setFormError('Isi jumlah minimal satu produk.')
    }
    if (!danusanProof) return setFormError('Upload bukti pembayaran dulu.')
    if (danusanProof.size > 6 * 1024 * 1024) {
      return setFormError('Ukuran file maksimal 6 MB.')
    }

    setSaving(true)
    setFormError('')

    let filePath
    try {
      filePath = await uploadProof('danusan', danusanProof)
    } catch (uploadError) {
      console.error('Gagal upload bukti Danusan:', uploadError)
      setSaving(false)
      return setFormError('Gagal mengupload bukti Danusan.')
    }

    const { data, error } = await supabase
      .from('transactions')
      .insert([
        {
          member_id: Number(danusanMember),
          type: 'danusan',
          amount: danusanResult.total,
          profit: danusanResult.profit,
          vendor: danusanResult.vendor,
          items: danusanItems.filter((item) => item.quantity > 0),
          proof_url: filePath,
        },
      ])
      .select()
      .single()

    if (error) {
      console.error('Gagal menyimpan Danusan:', error)
      await removeProof(filePath)
      setSaving(false)
      return setFormError('Gagal menyimpan Danusan ke database.')
    }

    setDanusanTransactions((list) => [...list, toDanusan(data)])
    setDanusanItems((items) => items.map((item) => ({ ...item, quantity: 0 })))
    setDanusanMember('')
    setDanusanProof(null)
    setSaving(false)
    setToast('Danusan + bukti disimpan')
  }

  /* ----- Aksi: pengeluaran ----- */

  // AI Receipt Scanner: membaca nota lewat scanReceiptWithAI (fungsi ini
  // memanggil Supabase Edge Function "scan-receipt" -- lihat catatan di
  // definisinya). Hasilnya selalu ditampilkan dulu untuk dikoreksi/disetujui
  // pengguna, tidak pernah langsung menimpa form atau tersimpan ke database.
  async function handleAiScan() {
    if (!expProof) {
      setAiScanError('Pilih file nota dulu sebelum membaca dengan AI.')
      return
    }

    setAiScanBusy(true)
    setAiScanError('')
    setAiScanResult(null)

    try {
      const result = await scanReceiptWithAI(expProof, EXPENSE_CATEGORIES)
      setAiScanResult({
        tanggal: result?.tanggal || expDate,
        vendor: result?.vendor || '',
        deskripsi: result?.deskripsi || '',
        nominal: result?.nominal != null ? String(result.nominal) : '',
        kategori: EXPENSE_CATEGORIES.includes(result?.kategori)
          ? result.kategori
          : EXPENSE_CATEGORIES[0],
      })
    } catch (scanError) {
      console.error('Gagal membaca nota dengan AI:', scanError)
      setAiScanError(
        'Fitur pembaca AI belum aktif untuk proyek ini. Perlu men-deploy Edge Function "scan-receipt" dulu di Supabase (lihat catatan setup).'
      )
    } finally {
      setAiScanBusy(false)
    }
  }

  function applyAiScanResult() {
    if (!aiScanResult) return
    if (aiScanResult.tanggal) setExpDate(aiScanResult.tanggal)
    if (aiScanResult.kategori) setExpCategory(aiScanResult.kategori)
    const desc = [aiScanResult.vendor, aiScanResult.deskripsi].filter(Boolean).join(' - ')
    if (desc) setExpDesc(desc)
    if (aiScanResult.nominal) setExpAmount(aiScanResult.nominal)
    setAiScanResult(null)
    setToast('Data dari AI diterapkan ke form, cek lagi sebelum menyimpan')
  }

  function discardAiScanResult() {
    setAiScanResult(null)
    setAiScanError('')
  }

  // Kemungkinan duplikat: heuristik lokal, dihitung ulang tiap tanggal/nominal
  // di form berubah. Lihat findPossibleDuplicate().
  const possibleExpenseDuplicate = useMemo(
    () => findPossibleDuplicate(expenses, { amount: Number(expAmount), date: expDate }),
    [expenses, expAmount, expDate]
  )

  // `overrides` diisi kalau dipanggil dari AI Assistant (chat), bukan dari
  // form manual. Kalau ada overrides: validasi pakai data dari chat, jangan
  // reset field form (form tidak sedang dipakai), dan kembalikan
  // {ok, error} alih-alih menulis ke formError, supaya chat bisa
  // menampilkan pesannya sendiri.
  async function saveExpense(e, overrides) {
    if (e) e.preventDefault()

    const isChat = Boolean(overrides)
    const date = overrides?.date ?? expDate
    const category = overrides?.category ?? expCategory
    const description = overrides?.description ?? expDesc
    const amount = isChat ? Number(overrides.amount) : Number(expAmount)
    const proofFile = overrides?.proofFile ?? expProof

    const fail = (msg) => {
      if (isChat) return { ok: false, error: msg }
      setFormError(msg)
      return { ok: false, error: msg }
    }

    if (!date) return fail('Pilih tanggal pengeluaran.')
    if (!description.trim()) return fail('Isi keterangan pengeluaran.')
    if (!(amount > 0)) return fail('Nominal harus lebih dari 0.')
    if (!proofFile) return fail('Upload nota atau bukti pengeluaran dulu.')
    if (proofFile.size > 6 * 1024 * 1024) {
      return fail('Ukuran file maksimal 6 MB.')
    }

    setSaving(true)
    if (!isChat) setFormError('')

    let filePath
    try {
      filePath = await uploadProof('pengeluaran', proofFile)
    } catch (uploadError) {
      console.error('Gagal upload nota:', uploadError)
      setSaving(false)
      return fail('Gagal mengupload nota pengeluaran.')
    }

    // Pengeluaran baru selalu masuk sebagai 'pending' -- baru dihitung ke
    // kas setelah pengurus (verifikator) menyetujuinya. Ini yang mencegah
    // uang keluar tanpa ada yang mengecek selain bendahara sendiri.
    const { data, error } = await supabase
      .from('expenses')
      .insert([
        {
          expense_date: date,
          category,
          description: description.trim(),
          amount,
          proof_url: filePath,
          status: 'pending',
        },
      ])
      .select()
      .single()

    if (error) {
      console.error('Gagal menyimpan pengeluaran:', error)
      await removeProof(filePath)
      setSaving(false)
      return fail('Gagal menyimpan pengeluaran ke database.')
    }

    setExpenses((list) => [...list, toExpense(data)])

    if (!isChat) {
      setExpDate(todayISO())
      setExpDesc('')
      setExpAmount('')
      setExpProof(null)
      setAiScanResult(null)
      setAiScanError('')
    }

    setSaving(false)
    setToast('Pengeluaran dikirim, menunggu persetujuan pengurus')
    return { ok: true }
  }
  /* ----- Aksi: pemasukan lainnya ----- */
function toggleCarwashMember(memberId) {
  setCarwashMembers((list) =>
    list.includes(memberId)
      ? list.filter((id) => id !== memberId)
      : [...list, memberId]
  )
}
  // `overrides` diisi kalau dipanggil dari AI Assistant (chat). Chat hanya
  // mendukung jenis 'bantuan'/'lainnya' -- jenis 'nyuci' tetap wajib lewat
  // form manual karena perlu memilih anggota yang hadir untuk pembagian.
  async function saveOtherIncome(e, overrides) {
    if (e) e.preventDefault()

    const isChat = Boolean(overrides)
    const incType = overrides?.type ?? incomeType
    const isCarwash = incType === 'nyuci'
    const date = overrides?.date ?? incomeDate
    const source = overrides?.source ?? incomeSource
    const descField = overrides?.description ?? incomeDesc
    const amount = isCarwash
      ? Number(carwashAmount)
      : Number(isChat ? overrides.amount : incomeAmount)
    const proofFile = overrides?.proofFile ?? incomeProof
    const carwashLabelClean = carwashLabel.trim() || 'Nyuci'

    const fail = (msg) => {
      if (isChat) return { ok: false, error: msg }
      setFormError(msg)
      return { ok: false, error: msg }
    }

    if (!date) return fail('Pilih tanggal pemasukan.')

    if (isCarwash) {
      if (isChat) {
        return fail(
          'Pemasukan jenis Nyuci belum didukung lewat chat karena perlu memilih anggota yang hadir. Catat manual di halaman Pemasukan Lainnya.'
        )
      }
      if (!(amount > 0)) return fail('Isi total hasil car wash dulu.')
      if (carwashMembers.length === 0) {
        return fail('Pilih minimal satu anggota yang hadir nyuci.')
      }
    } else {
      if (!descField.trim()) return fail('Isi keterangan pemasukan.')
      if (!(amount > 0)) return fail('Nominal harus lebih dari 0.')
    }

    if (proofFile && proofFile.size > 6 * 1024 * 1024) {
      return fail('Ukuran file maksimal 6 MB.')
    }

    setSaving(true)
    if (!isChat) setFormError('')

    let filePath = null

    try {
      if (proofFile) {
        filePath = await uploadProof('pemasukan-lainnya', proofFile)
      }
    } catch (uploadError) {
      console.error('Gagal upload bukti pemasukan:', uploadError)
      setSaving(false)
      return fail('Gagal mengupload bukti pemasukan.')
    }

    // Pembagian rata ke tiap anggota yang hadir. Sisa pembulatan (kalau
    // nominal tidak habis dibagi) sengaja tidak dipotong ke siapa pun,
    // supaya potongan per orang tidak pernah lebih besar dari yang tertulis.
    const perPerson = isCarwash
      ? Math.floor(amount / carwashMembers.length)
      : 0

    const description = isCarwash
      ? `Car Wash ${carwashLabelClean} (${carwashMembers.length} orang hadir)`
      : descField.trim()

    const { data, error } = await supabase
      .from('other_income')
      .insert([
        {
          income_date: date,
          income_type: incType,
          source_name: isCarwash
            ? carwashLabelClean
            : source.trim() || null,
          description,
          amount,
          proof_url: filePath,
        },
      ])
      .select()
      .single()

    if (error) {
      console.error('Gagal menyimpan pemasukan lainnya:', error)

      if (filePath) {
        await removeProof(filePath)
      }

      setSaving(false)
      return fail('Gagal menyimpan pemasukan ke database.')
    }

    // Kalau ini Nyuci, bagi hasilnya ke tiap anggota yang hadir lewat tabel
    // carwash_allocations, supaya langsung mengurangi sisa tagihan mereka.
    if (isCarwash) {
      const rows = carwashMembers.map((memberId) => ({
  income_id: data.id,
  member_id: memberId,
  amount: perPerson,
  other_income_id: data.id,
  carwash_day: carwashLabelClean,
}))
      const { data: allocData, error: allocError } = await supabase
        .from('carwash_allocations')
        .insert(rows)
        .select()

      if (allocError) {
        console.error('Gagal menyimpan pembagian nyuci:', allocError)
        // Rollback: hapus catatan pemasukan supaya tidak nyangkut sendirian
        // tanpa pembagian ke anggota.
        await supabase.from('other_income').delete().eq('id', data.id)
        if (filePath) await removeProof(filePath)
        setSaving(false)
        return fail(
          'Gagal membagi hasil nyuci ke anggota. Pastikan tabel carwash_allocations sudah punya kolom other_income_id dan carwash_day (lihat SQL yang disertakan).'
        )
      }

      setCarwashAllocations((list) => [...list, ...allocData])
    }

    setOtherIncome((list) => [...list, toOtherIncome(data)])

    if (!isChat) {
      setIncomeDate(todayISO())
      setIncomeType('nyuci')
      setIncomeSource('')
      setIncomeDesc('')
      setIncomeAmount('')
      setIncomeProof(null)
      setCarwashLabel('Day 1')
      setCarwashAmount('')
      setCarwashMembers([])
    }

    setSaving(false)
    setToast(
      isCarwash
        ? `Nyuci disimpan, ${rupiah(perPerson)} dipotong ke ${carwashMembers.length} anggota`
        : 'Pemasukan lainnya disimpan'
    )
    return { ok: true }
  }
  /* ----- Aksi: ekspor ----- */

  function exportBackup() {
    const data = {
      app: 'kt-finance',
      version: 3,
      exportedAt: new Date().toISOString(),
      members,
      payments,
      danusan: danusanTransactions,
      expenses,
      otherIncome,
    }
    const date = new Date().toISOString().slice(0, 10)
    downloadFile(
      `kt-finance-arsip-${date}.json`,
      JSON.stringify(data, null, 2),
      'application/json'
    )
    setToast('Arsip diunduh')
  }

  function exportCsv() {
    const rows = [
      [
        'Tanggal',
        'Nama/Kategori',
        'Jenis',
        'Detail',
        'Nominal',
        'Bati',
        'Vendor',
        'Status Persetujuan',
        'Status',
        'Alasan batal',
      ],
      ...filteredTx.map((t) => [
        t.date,
        t.name,
        t.type,
        t.detail,
        t.kind === 'pengeluaran' ? -t.amount : t.amount,
        t.profit ?? '',
        t.vendor ?? '',
        t.kind === 'pengeluaran' ? t.status : '-',
        t.voided ? 'Dibatalkan' : 'Sah',
        t.voidReason || t.rejectReason || '',
      ]),
    ]
    const csv = rows
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n')

    downloadFile('transaksi-karang-taruna.csv', '\uFEFF' + csv, 'text/csv;charset=utf-8')
    setToast('CSV diunduh')
  }



  

  

  

  
  
  

  

  
const filteredAuditRows = auditRows.filter((row) => {
  const query = logSearch.trim().toLowerCase()

  if (!query) return true

  const activity = describeAudit(row, nameOfMember)

  return [
    row.actor_email,
    row.action,
    row.table_name,
    activity,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()
    .includes(query)
})
  


  return {
    auditRows,
    auditLoading,
    auditError,
    members,
    setMembers,
    payments,
    setPayments,
    danusanTransactions,
    setDanusanTransactions,
    expenses,
    setExpenses,
    otherIncome,
    setOtherIncome,
    carwashAllocations,
    setCarwashAllocations,
    loading,
    setLoading,
    loadError,
    setLoadError,
    loadErrorAt,
    setLoadErrorAt,
    saving,
    setSaving,
    newName,
    setNewName,
    newTarget,
    setNewTarget,
    search,
    setSearch,
    editingId,
    setEditingId,
    editName,
    setEditName,
    editTarget,
    setEditTarget,
    nyicilMember,
    setNyicilMember,
    paymentAmount,
    setPaymentAmount,
    nyicilProof,
    setNyicilProof,
    danusanMember,
    setDanusanMember,
    danusanItems,
    setDanusanItems,
    danusanProof,
    setDanusanProof,
    expDate,
    setExpDate,
    expCategory,
    setExpCategory,
    expDesc,
    setExpDesc,
    expAmount,
    setExpAmount,
    expProof,
    setExpProof,
    incomeDate,
    setIncomeDate,
    incomeType,
    setIncomeType,
    incomeSource,
    setIncomeSource,
    incomeDesc,
    setIncomeDesc,
    incomeAmount,
    setIncomeAmount,
    incomeProof,
    setIncomeProof,
    carwashLabel,
    setCarwashLabel,
    carwashAmount,
    setCarwashAmount,
    carwashMembers,
    setCarwashMembers,
    txMember,
    setTxMember,
    txType,
    setTxType,
    txStatus,
    setTxStatus,
    txSearch,
    setTxSearch,
    txSort,
    setTxSort,
    logSearch,
    setLogSearch,
    reportMonth,
    setReportMonth,
    voidTarget,
    setVoidTarget,
    voidReason,
    setVoidReason,
    voidError,
    setVoidError,
    voidBusy,
    setVoidBusy,
    approveBusyId,
    setApproveBusyId,
    rejectTarget,
    setRejectTarget,
    rejectReason,
    setRejectReason,
    rejectError,
    setRejectError,
    rejectBusy,
    setRejectBusy,
    formError,
    setFormError,
    toast,
    setToast,
    aiScanBusy,
    setAiScanBusy,
    aiScanError,
    setAiScanError,
    aiScanResult,
    setAiScanResult,
    canEdit,
    canApprove,
    goTo,
    handleLogout,
    activeMembers,
    livePayments,
    liveDanusan,
    liveExpenses,
    pendingExpenses,
    voidedIncomeIds,
    stats,
    activeStats,
    totalNyicil,
    totalDanusan,
    totalBati,
    totalVendor,
    totalOtherIncome,
    totalMasuk,
    totalKeluar,
    totalPending,
    setorVendor,
    vendorBelumDisetor,
    saldoKas,
    saldoBersih,
    lunasCount,
    totalTarget,
    totalCollected,
    belumLunas,
    nameOfMember,
    carwashAllocationsFor,
    allTransactions,
    notifOpen,
    setNotifOpen,
    readNotifIds,
    notifications,
    unreadNotifCount,
    markAllNotifsRead,
    filteredTx,
    filteredMasuk,
    filteredKeluar,
    chartData,
    filteredStats,
    reportTransactions,
    reportMasuk,
    reportKeluar,
    reportBati,
    reportVendor,
    reportSaldo,
    reportNyicilCount,
    reportDanusanCount,
    reportByCategory,
    reportSummaryText,
    copyReportSummary,
    danusanResult,
    nyicilTarget,
    dashboardCategoryBreakdown,
    openProof,
    uploadProof,
    removeProof,
    askVoid,
    closeVoid,
    confirmVoid,
    approveExpense,
    askReject,
    closeReject,
    confirmReject,
    chatAssistant,
    addMember,
    startEdit,
    saveEdit,
    toggleActive,
    addPayment,
    updateItem,
    saveDanusan,
    handleAiScan,
    applyAiScanResult,
    discardAiScanResult,
    possibleExpenseDuplicate,
    saveExpense,
    toggleCarwashMember,
    saveOtherIncome,
    exportBackup,
    exportCsv,
    filteredAuditRows,
  }
}
