export const DEFAULT_TARGET = 200000
export const PROOF_BUCKET = 'payment-proofs'
export const MIN_VOID_REASON = 5
export const MIN_REJECT_REASON = 5

export const PRODUCTS = [
  { name: 'Risol Manis', prices: [6000], profit: 2000 },
  { name: 'Risol Asin', prices: [5000], profit: 2000 },
  { name: 'Dimsum', prices: [5000], profit: 1000 },
  { name: 'Cheeseroll', prices: [5000], profit: 2000 },
  { name: 'Mi ayam', prices: [15000], profit: 2000 },
]

export const VENDOR_CATEGORY = 'Setor vendor'

export const EXPENSE_CATEGORIES = [
  VENDOR_CATEGORY,
  'Belanja danusan',
  'Konsumsi kegiatan',
  'Perlengkapan',
  'Transportasi',
  'Lainnya',
]

export const ROLE_LABEL = {
  bendahara: 'Bendahara',
  pengurus: 'Pengurus (verifikator)',
}

export const NAV_GROUPS = [
  { label: 'Utama', items: [{ id: 'dashboard', label: 'Dashboard' }] },
  {
    label: 'Pemasukan',
    items: [
      { id: 'danusan', label: 'Danusan' },
      { id: 'nyicil', label: 'Nyicil' },
      { id: 'pemasukan', label: 'Pemasukan Lainnya' },
    ],
  },
  { label: 'Pengeluaran', items: [{ id: 'pengeluaran', label: 'Pengeluaran' }] },
  {
    label: 'Data',
    items: [
      { id: 'anggota', label: 'Anggota' },
      { id: 'transaksi', label: 'Transaksi' },
    ],
  },
  {
    label: 'Laporan',
    items: [
      { id: 'laporan', label: 'Laporan Bulanan' },
      { id: 'log', label: 'Log Aktivitas' },
    ],
  },
]

export const PAGE_INFO = {
  dashboard: { title: 'Dashboard', subtitle: 'Karang Taruna Finance Management' },
  danusan: { title: 'Danusan', subtitle: 'Catat penjualan danusan' },
  nyicil: { title: 'Nyicil', subtitle: 'Catat pembayaran anggota' },
  pengeluaran: { title: 'Pengeluaran', subtitle: 'Catat uang keluar beserta notanya' },
  pemasukan: {
    title: 'Pemasukan Lainnya',
    subtitle: 'Catat pemasukan di luar nyicil dan danusan',
  },
  anggota: { title: 'Anggota', subtitle: 'Kelola anggota Karang Taruna' },
  transaksi: { title: 'Transaksi', subtitle: 'Semua uang masuk dan keluar' },
  laporan: { title: 'Laporan Bulanan', subtitle: 'Ringkasan per bulan, siap dicetak atau dibagikan' },
  log: { title: 'Log Aktivitas', subtitle: 'Siapa mengubah apa, dan kapan' },
}

