import { PROOF_BUCKET } from './config'
import { rupiah } from './formatters'

// Membaca file gambar sebagai data URL base64, dipakai sebelum mengirim
// nota ke fungsi pembaca AI.
export function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })
}

// Deteksi kemungkinan duplikat: transaksi lain dengan nominal sama persis
// dalam rentang beberapa hari. Ini heuristik sederhana berbasis data yang
// sudah ada (bukan panggilan AI terpisah), supaya selalu bisa jalan tanpa
// backend tambahan.
export function findPossibleDuplicate(list, { amount, date, excludeId }) {
  if (!(amount > 0) || !date) return null
  const target = new Date(date).getTime()
  const THREE_DAYS = 3 * 24 * 60 * 60 * 1000

  return (
    list.find((item) => {
      if (item.voided) return false
      if (excludeId != null && item.id === excludeId) return false
      if (Number(item.amount) !== Number(amount)) return false
      const itemTime = new Date(item.date.split('/').reverse().join('-')).getTime()
      return Math.abs(itemTime - target) <= THREE_DAYS
    }) || null
  )
}

// Data lama menyimpan URL publik lengkap, data baru menyimpan path saja.
// Fungsi ini mengembalikan path di dalam bucket untuk keduanya.
export function proofPath(value) {
  if (!value) return null

  const marker = `/${PROOF_BUCKET}/`
  const index = value.indexOf(marker)

  return index === -1 ? value : value.slice(index + marker.length)
}

export function downloadFile(filename, content, type) {
  const blob = new Blob([content], { type })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

// Kalimat manusiawi untuk satu baris log aktivitas
export function describeAudit(row, nameOfMember) {
  const now = row.new_data || {}
  const old = row.old_data || {}
  const data = row.new_data || row.old_data || {}

  if (row.table_name === 'members') {
    if (row.action === 'INSERT') return `Menambah anggota ${now.name}`
    if (row.action === 'UPDATE') {
      if (old.active !== now.active) {
        return `${now.active ? 'Mengaktifkan' : 'Menonaktifkan'} anggota ${now.name}`
      }
      if (old.name !== now.name) return `Mengganti nama anggota ${old.name} menjadi ${now.name}`
      if (old.target !== now.target) {
        return `Mengubah target ${now.name}: ${rupiah(old.target)} menjadi ${rupiah(now.target)}`
      }
      return `Mengubah data anggota ${now.name}`
    }
  }

  if (row.table_name === 'transactions') {
    const label = data.type === 'danusan' ? 'Danusan' : 'Nyicil'
    const who = nameOfMember(data.member_id)

    if (row.action === 'INSERT') return `Mencatat ${label} ${who}: ${rupiah(now.amount)}`
    if (row.action === 'UPDATE' && now.voided_at) {
      return `Membatalkan ${label} ${who} ${rupiah(now.amount)}. Alasan: ${now.void_reason}`
    }
  }

  if (row.table_name === 'expenses') {
    if (row.action === 'INSERT') {
      return `Mencatat pengeluaran ${now.category}: ${rupiah(now.amount)} (${now.description})`
    }
    if (row.action === 'UPDATE' && now.voided_at) {
      return `Membatalkan pengeluaran ${now.category} ${rupiah(now.amount)}. Alasan: ${now.void_reason}`
    }
    if (row.action === 'UPDATE' && old.status !== now.status) {
      if (now.status === 'approved') {
        return `Menyetujui pengeluaran ${now.category}: ${rupiah(now.amount)}`
      }
      if (now.status === 'rejected') {
        return `Menolak pengeluaran ${now.category} ${rupiah(now.amount)}. Alasan: ${now.reject_reason}`
      }
    }
  }
  if (row.table_name === 'other_income') {
    const label =
      data.income_type === 'nyuci'
        ? 'Nyuci'
        : data.income_type === 'bantuan'
          ? 'Bantuan'
          : 'Pemasukan lainnya'

    if (row.action === 'INSERT') {
      return `Mencatat ${label}: ${rupiah(now.amount)} (${now.description})`
    }

    if (row.action === 'UPDATE' && now.voided_at) {
      return `Membatalkan ${label} ${rupiah(now.amount)}. Alasan: ${now.void_reason}`
    }
  }
  return `${row.action} pada ${row.table_name}`
}
