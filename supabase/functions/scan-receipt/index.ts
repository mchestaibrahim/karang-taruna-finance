import { serve } from 'https://deno.land/std@0.203.0/http/server.ts'

const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY')
const MODEL = 'gemini-3.8-flash'
const MAX_IMAGE_SIZE = 2 * 1024 * 1024
const MAX_IMAGE_LENGTH = Math.ceil(MAX_IMAGE_SIZE / 3) * 4 + 100
const APP_ORIGIN = Deno.env.get('APP_ORIGIN') || '*'

const corsHeaders = {
  'Access-Control-Allow-Origin': APP_ORIGIN,
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return jsonResponse({ error: 'Method tidak diizinkan.' }, 405)
  if (!GEMINI_API_KEY) {
    return jsonResponse({ error: 'GEMINI_API_KEY belum diset di Supabase secrets.' }, 500)
  }

  try {
    const body = await req.json()
    const image = typeof body?.image === 'string' ? body.image : ''
    const categories = Array.isArray(body?.categories)
      ? body.categories.filter((item: unknown) => typeof item === 'string').slice(0, 20)
      : []
    const match = /^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=]+)$/.exec(image)

    if (!match || image.length > MAX_IMAGE_LENGTH) {
      return jsonResponse({ error: 'File harus berupa gambar JPG, PNG, atau WebP dan berukuran maksimal 2 MB.' }, 400)
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': GEMINI_API_KEY,
        },
        body: JSON.stringify({
          systemInstruction: {
            parts: [{
              text: `Baca nota pada gambar. Jangan mengarang data yang tidak terbaca. Kembalikan tanggal dalam format YYYY-MM-DD jika tersedia, nominal sebagai angka rupiah tanpa titik atau simbol, vendor, deskripsi singkat, dan kategori dari daftar ini: ${JSON.stringify(categories)}. Jika kategori tidak cocok, gunakan kategori pertama.`,
            }],
          },
          contents: [{
            role: 'user',
            parts: [
              { inlineData: { mimeType: match[1], data: match[2] } },
              { text: 'Ekstrak data nota ini.' },
            ],
          }],
          generationConfig: {
            temperature: 0,
            maxOutputTokens: 300,
            responseMimeType: 'application/json',
            responseSchema: {
              type: 'object',
              properties: {
                tanggal: { type: 'string' },
                vendor: { type: 'string' },
                deskripsi: { type: 'string' },
                nominal: { type: 'number' },
                kategori: { type: 'string' },
              },
              required: ['tanggal', 'vendor', 'deskripsi', 'nominal', 'kategori'],
            },
          },
        }),
      },
    )

    if (!response.ok) {
      console.error('Gemini receipt error:', await response.text())
      return jsonResponse({ error: 'Gagal membaca nota.' }, 502)
    }

    const data = await response.json()
    const rawText = data?.candidates?.[0]?.content?.parts
      ?.map((part: { text?: string }) => part.text || '')
      .join('')
      .trim()

    if (!rawText) return jsonResponse({ error: 'Nota tidak dapat dibaca.' }, 422)

    try {
      const result = JSON.parse(rawText)
      return jsonResponse({
        tanggal: typeof result.tanggal === 'string' ? result.tanggal : '',
        vendor: typeof result.vendor === 'string' ? result.vendor : '',
        deskripsi: typeof result.deskripsi === 'string' ? result.deskripsi : '',
        nominal: Number.isFinite(Number(result.nominal)) ? Number(result.nominal) : null,
        kategori: categories.includes(result.kategori) ? result.kategori : categories[0] || '',
      })
    } catch {
      return jsonResponse({ error: 'Respons pembaca nota tidak valid.' }, 502)
    }
  } catch (error) {
    console.error('scan-receipt error:', error)
    return jsonResponse({ error: 'Terjadi kesalahan di server.' }, 500)
  }
})
