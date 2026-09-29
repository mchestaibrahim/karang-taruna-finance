import { supabase } from '../lib/supabaseClient'
import { fileToDataUrl } from './helpers'

// AI Receipt Scanner: mengirim foto nota ke Supabase Edge Function
// "scan-receipt" yang membaca tanggal, vendor, nominal, dan kategori dari
// gambar (mis. lewat Claude vision API di sisi server, supaya API key tidak
// pernah ada di browser). Fungsi ini HANYA memanggil endpoint-nya; fungsi
// edge-nya sendiri perlu di-deploy terpisah di proyek Supabase (lihat
// catatan di respons chat untuk contoh implementasinya).
export async function scanReceiptWithAI(file, categories) {
  const imageBase64 = await fileToDataUrl(file)

  const { data, error } = await supabase.functions.invoke('scan-receipt', {
    body: { image: imageBase64, categories },
  })

  if (error) throw error
  return data
}
