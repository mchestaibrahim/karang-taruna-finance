import { formatDate, formatDateOnly } from './formatters'

export const voidInfo = (row) => ({
  voided: Boolean(row.voided_at),
  voidReason: row.void_reason || '',
})

// Baris tabel database -> bentuk yang dipakai tampilan
export const toPayment = (row) => ({
  id: row.id,
  memberId: row.member_id,
  amount: Number(row.amount),
  proofUrl: row.proof_url,
  date: formatDate(row.transaction_date),
  sortTime: new Date(row.transaction_date).getTime(),
  ...voidInfo(row),
})

export const toDanusan = (row) => ({
  id: row.id,
  memberId: row.member_id,
  items: row.items || [],
  total: Number(row.amount),
  profit: Number(row.profit),
  vendor: Number(row.vendor),
  proofUrl: row.proof_url,
  date: formatDate(row.transaction_date),
  sortTime: new Date(row.transaction_date).getTime(),
  ...voidInfo(row),
})

// Status persetujuan pengeluaran. Data lama (sebelum fitur ini ada) tidak
// punya kolom status, jadi dianggap 'approved' supaya histori lama tidak
// tiba-tiba hilang dari perhitungan kas.
export const toExpense = (row) => ({
  id: row.id,
  category: row.category,
  description: row.description,
  amount: Number(row.amount),
  proofUrl: row.proof_url,
  date: formatDateOnly(row.expense_date),
  sortTime: new Date(row.created_at || row.expense_date).getTime(),
  status: row.status || 'approved',
  rejectReason: row.reject_reason || '',
  approvedByEmail: row.approved_by_email || '',
  approvedAt: row.approved_at || null,
  ...voidInfo(row),
})

export const toOtherIncome = (row) => ({
  id: row.id,
  type: row.income_type,
  sourceName: row.source_name || '',
  description: row.description,
  amount: Number(row.amount),
  proofUrl: row.proof_url,
  date: formatDateOnly(row.income_date),
  sortTime: new Date(row.income_date).getTime(),
  ...voidInfo(row),
})
