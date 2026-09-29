export const rupiah = (value) => 'Rp' + Number(value || 0).toLocaleString('id-ID')

export function compactRupiah(value) {
  const number = Number(value)

  if (!number) return ''
  if (number >= 1000000) return `Rp${(number / 1000000).toFixed(1)}jt`
  if (number >= 1000) return `Rp${(number / 1000).toFixed(0)}rb`
  return `Rp${number.toLocaleString('id-ID')}`
}

export function pad(value) {
  return String(value).padStart(2, '0')
}

export function todayISO() {
  const date = new Date()
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

export const formatDate = (value) => new Date(value).toLocaleDateString('id-ID')

export function formatDateOnly(value) {
  const [year, month, day] = String(value).slice(0, 10).split('-').map(Number)
  return new Date(year, month - 1, day).toLocaleDateString('id-ID')
}

export const formatDateTime = (value) =>
  new Date(value).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })

export function monthKeyFromTime(milliseconds) {
  const date = new Date(milliseconds)
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}`
}

export function currentMonthKey() {
  return monthKeyFromTime(Date.now())
}

export function monthLabel(key) {
  const [year, month] = key.split('-').map(Number)
  return new Date(year, month - 1, 1).toLocaleDateString('id-ID', {
    month: 'long',
    year: 'numeric',
  })
}

export function greetingForNow(name) {
  const hour = new Date().getHours()
  const time = hour < 11 ? 'pagi' : hour < 15 ? 'siang' : hour < 19 ? 'sore' : 'malam'
  return `Selamat ${time}, ${name}`
}

export function initialsFromEmail(email) {
  const name = String(email || '').split('@')[0]
  return name.slice(0, 2).toUpperCase() || '?'
}

export function newDanusanItems(products) {
  return products.map((product) => ({
    product: product.name,
    price: product.prices[product.prices.length - 1],
    quantity: 0,
  }))
}
