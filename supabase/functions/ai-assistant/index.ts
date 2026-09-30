// Supabase Edge Function: ai-assistant
//
// React -> Supabase Edge Function -> Gemini API
//
// API key Gemini TIDAK pernah dikirim ke browser.
// API key disimpan di Supabase Secrets:
//   GEMINI_API_KEY
//
// Deploy:
//   npx supabase functions deploy ai-assistant

import { serve } from 'https://deno.land/std@0.203.0/http/server.ts'

const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY')
const MODEL = 'gemini-3.8-flash'
const MAX_IMAGE_SIZE = 2 * 1024 * 1024
const MAX_IMAGE_LENGTH = Math.ceil(MAX_IMAGE_SIZE / 3) * 4 + 100
const APP_ORIGIN = Deno.env.get('APP_ORIGIN') || '*'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': APP_ORIGIN,
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const SYSTEM_PROMPT = `
Kamu adalah asisten keuangan untuk aplikasi kas Karang Taruna (KT Finance).

Jawab dalam Bahasa Indonesia yang santai, jelas, singkat, dan sopan.

ATURAN DATA:
- Kamu HANYA boleh menggunakan data yang ada di Context.
- Jangan mengarang angka, nama, ID, tanggal, saldo, atau transaksi.
- Kalau data yang ditanyakan tidak ada di Context, katakan bahwa datanya tidak tersedia.
- Jangan menebak ID pengeluaran.
- Kalau permintaan ambigu, minta pengguna memperjelas.
- Jangan melakukan perubahan database sendiri.
- Kamu hanya mengembalikan instruksi action. Aplikasi React yang akan menjalankan action tersebut.

ACTION YANG BOLEH:

1. create_expense
Untuk mencatat pengeluaran baru.

SYARAT:
- Pengguna harus melampirkan foto.
- context.hasImage harus true.
- Data nominal harus jelas.
- Kategori harus berasal dari context.categories.

Payload:
{
  "date": "YYYY-MM-DD",
  "category": "salah satu context.categories",
  "description": "keterangan",
  "amount": angka
}

2. create_income
Untuk mencatat pemasukan lainnya.

Hanya boleh:
- type = "bantuan"
- type = "lainnya"

Tidak boleh membuat pemasukan "nyuci".

Payload:
{
  "date": "YYYY-MM-DD",
  "type": "bantuan" atau "lainnya",
  "source": "sumber",
  "description": "keterangan",
  "amount": angka
}

3. approve_expense
Untuk menyetujui pengeluaran yang ada di context.pendingExpenses.

Harus mencocokkan pengeluaran berdasarkan data yang diberikan pengguna.

Payload:
{
  "id": "ID pengeluaran"
}

4. reject_expense
Untuk menolak pengeluaran yang ada di context.pendingExpenses.

Harus ada alasan yang jelas.

Payload:
{
  "id": "ID pengeluaran",
  "reason": "alasan penolakan"
}

Kalau pengguna hanya bertanya:
action harus null.

Kalau pengguna meminta aksi tetapi datanya kurang:
action harus null dan minta data yang kurang.

FORMAT OUTPUT:
Kembalikan HANYA JSON valid.

Format:
{
  "reply": "jawaban untuk pengguna",
  "action": null
}

atau:

{
  "reply": "jawaban untuk pengguna",
  "action": {
    "type": "create_expense",
    "payload": {}
  }
}
`

function buildParts(
  message: string,
  context: unknown,
  image: string | null,
) {
  const parts: Record<string, unknown>[] = []

  if (image) {
    const match = /^data:(.+?);base64,(.+)$/.exec(image)

    if (match) {
      parts.push({
        inlineData: {
          mimeType: match[1],
          data: match[2],
        },
      })
    }
  }

  parts.push({
    text: `
Context (JSON):
${JSON.stringify({
  ...(context as object),
  hasImage: Boolean(image),
})}

Pesan pengguna:
${message || '(tidak ada teks, hanya foto)'}
`,
  })

  return parts
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: CORS_HEADERS,
    })
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method tidak diizinkan.' }), {
      status: 405,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    })
  }

  if (!GEMINI_API_KEY) {
    return new Response(
      JSON.stringify({
        error: 'GEMINI_API_KEY belum diset di Supabase secrets.',
      }),
      {
        status: 500,
        headers: {
          ...CORS_HEADERS,
          'Content-Type': 'application/json',
        },
      },
    )
  }

  try {
    const {
      message,
      history,
      context,
      image,
    } = await req.json()

    if (typeof message !== 'string' || message.length > 4000) {
      return new Response(JSON.stringify({ error: 'Pesan tidak valid atau terlalu panjang.' }), {
        status: 400,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      })
    }

    if (image != null && (typeof image !== 'string' || image.length > MAX_IMAGE_LENGTH)) {
      return new Response(JSON.stringify({ error: 'Gambar maksimal 2 MB.' }), {
        status: 400,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      })
    }

    const historyParts: Record<string, unknown>[] = []

    if (Array.isArray(history)) {
      history.slice(-10).forEach(
        (h: { role: string; text: string }) => {
          historyParts.push({
            text: `${h.role === 'assistant' ? 'Asisten' : 'Pengguna'}: ${h.text}`,
          })
        },
      )
    }

    const currentParts = buildParts(
      String(message || ''),
      context,
      image || null,
    )

    const contents = [
      ...(historyParts.length > 0
        ? [
            {
              role: 'user',
              parts: historyParts,
            },
          ]
        : []),
      {
        role: 'user',
        parts: currentParts,
      },
    ]

    const responseSchema = {
      type: 'object',
      properties: {
        reply: {
          type: 'string',
          description: 'Jawaban singkat untuk pengguna.',
        },
        action: {
          anyOf: [
            {
              type: 'object',
              properties: {
                type: {
                  type: 'string',
                  enum: [
                    'create_expense',
                    'create_income',
                    'approve_expense',
                    'reject_expense',
                  ],
                },
                payload: {
                  type: 'object',
                },
              },
              required: ['type', 'payload'],
            },
            {
              type: 'null',
            },
          ],
        },
      },
      required: ['reply', 'action'],
    }

    const response = await fetch(
      'https://generativelanguage.googleapis.com/v1beta/models/' +
        MODEL +
        ':generateContent',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': GEMINI_API_KEY,
        },
        body: JSON.stringify({
          systemInstruction: {
            parts: [
              {
                text: SYSTEM_PROMPT,
              },
            ],
          },

          contents,

          generationConfig: {
            temperature: 0.2,
            maxOutputTokens: 700,

            responseMimeType: 'application/json',

            responseSchema,
          },
        }),
      },
    )

    if (!response.ok) {
      const errText = await response.text()

      console.error('Gemini API error:', errText)

      return new Response(
        JSON.stringify({
          error: 'Gagal menghubungi Gemini API.',
          details: errText,
        }),
        {
          status: 502,
          headers: {
            ...CORS_HEADERS,
            'Content-Type': 'application/json',
          },
        },
      )
    }

    const data = await response.json()

    const rawText =
      data?.candidates?.[0]?.content?.parts
        ?.map((part: { text?: string }) => part.text || '')
        .join('')
        .trim() || ''

    let parsed: {
      reply?: string
      action?: unknown
    } = {}

    try {
      parsed = JSON.parse(rawText)
    } catch (parseError) {
      console.error(
        'Gagal parse JSON dari Gemini:',
        parseError,
        rawText,
      )

      parsed = {
        reply:
          rawText ||
          'Maaf, saya belum bisa menjawab itu sekarang.',
        action: null,
      }
    }

    return new Response(
      JSON.stringify({
        reply: parsed.reply || '',
        action: parsed.action || null,
      }),
      {
        headers: {
          ...CORS_HEADERS,
          'Content-Type': 'application/json',
        },
      },
    )
  } catch (err) {
    console.error('ai-assistant error:', err)

    return new Response(
      JSON.stringify({
        error: 'Terjadi kesalahan di server.',
      }),
      {
        status: 500,
        headers: {
          ...CORS_HEADERS,
          'Content-Type': 'application/json',
        },
      },
    )
  }
})