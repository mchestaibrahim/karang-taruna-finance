import { useState } from 'react'
import { MAX_PROOF_SIZE, MIN_REJECT_REASON } from '../app/config'
import { fileToDataUrl } from '../app/helpers'
import { toExpense } from '../app/mappers'
import { todayISO } from '../app/formatters'
import { supabase } from '../lib/supabaseClient'

export function useChatAssistant({
  role,
  canEdit,
  canApprove,
  totals,
  pendingExpenses,
  belumLunas,
  categories,
  actions,
  setExpenses,
  setToast,
}) {
  const [chatOpen, setChatOpen] = useState(false)
  const [chatMessages, setChatMessages] = useState([])
  const [chatInput, setChatInput] = useState('')
  const [chatImage, setChatImage] = useState(null)
  const [chatBusy, setChatBusy] = useState(false)
  const [chatError, setChatError] = useState('')

  function appendSystemChat(text) {
    setChatMessages((list) => [
      ...list,
      { id: crypto.randomUUID(), role: 'system', text, time: Date.now() },
    ])
  }

  function selectChatImage(file) {
    if (file && file.size > MAX_PROOF_SIZE) {
      setChatImage(null)
      setChatError('Ukuran foto maksimal 2 MB.')
      return false
    }
    setChatImage(file)
    setChatError('')
    return true
  }

  // Uses the same review RPC as the reject dialog, keeping server rules consistent.
  async function performReject(expenseId, reason) {
    const { data, error } = await supabase.rpc('review_expense', {
      p_expense_id: expenseId,
      p_status: 'rejected',
      p_reason: reason,
    })

    if (error) {
      console.error('Gagal menolak (chat):', error)
      appendSystemChat(`Gagal menolak: ${error.message}`)
      return
    }

    setExpenses((list) => list.map((x) => (x.id === expenseId ? toExpense(data) : x)))
    setToast('Pengeluaran ditolak')
    appendSystemChat('Pengeluaran ditolak.')
  }

  async function performAssistantAction(action) {
    try {
      if (action.type === 'create_expense') {
        if (!canEdit) return appendSystemChat('Hanya bendahara yang bisa mencatat pengeluaran.')
        if (!chatImage) return appendSystemChat('Lampirkan foto nota dulu (ikon 📎) supaya pengeluaran bisa dicatat.')

        const result = await actions.saveExpense(null, {
          date: action.payload?.date || todayISO(),
          category: categories.includes(action.payload?.category)
            ? action.payload.category
            : categories[0],
          description: action.payload?.description || '',
          amount: Number(action.payload?.amount) || 0,
          proofFile: chatImage,
        })

        appendSystemChat(
          result.ok
            ? 'Pengeluaran tercatat, menunggu persetujuan pengurus.'
            : result.error || 'Gagal mencatat pengeluaran.'
        )
      } else if (action.type === 'create_income') {
        if (!canEdit) return appendSystemChat('Hanya bendahara yang bisa mencatat pemasukan.')

        const result = await actions.saveOtherIncome(null, {
          date: action.payload?.date || todayISO(),
          type: ['bantuan', 'lainnya'].includes(action.payload?.type) ? action.payload.type : 'lainnya',
          source: action.payload?.source || '',
          description: action.payload?.description || '',
          amount: Number(action.payload?.amount) || 0,
          proofFile: chatImage,
        })

        appendSystemChat(result.ok ? 'Pemasukan tercatat.' : result.error || 'Gagal mencatat pemasukan.')
      } else if (action.type === 'approve_expense') {
        if (!canApprove) return appendSystemChat('Hanya pengurus yang bisa menyetujui pengeluaran.')

        const target = pendingExpenses.find((x) => x.id === action.payload?.id)
        if (!target) return appendSystemChat('Pengeluaran itu tidak ditemukan atau sudah diproses.')

        await actions.approveExpense(target)
      } else if (action.type === 'reject_expense') {
        if (!canApprove) return appendSystemChat('Hanya pengurus yang bisa menolak pengeluaran.')

        const target = pendingExpenses.find((x) => x.id === action.payload?.id)
        if (!target) return appendSystemChat('Pengeluaran itu tidak ditemukan atau sudah diproses.')

        const reason = String(action.payload?.reason || '').trim()
        if (reason.length < MIN_REJECT_REASON) {
          return appendSystemChat(
            `Sebutkan alasan penolakan yang lebih jelas (minimal ${MIN_REJECT_REASON} huruf).`
          )
        }

        await performReject(target.id, reason)
      }
    } catch (actionError) {
      console.error('Gagal menjalankan aksi asisten:', actionError)
      appendSystemChat('Terjadi kesalahan saat menjalankan aksi.')
    }
  }

  async function sendChatMessage() {
    const text = chatInput.trim()
    if (!text && !chatImage) return
    if (chatBusy) return
    if (chatImage && chatImage.size > MAX_PROOF_SIZE) {
      setChatError('Ukuran foto maksimal 2 MB.')
      return
    }

    const userMsg = {
      id: crypto.randomUUID(),
      role: 'user',
      text: text || '(mengirim foto)',
      hasImage: Boolean(chatImage),
      time: Date.now(),
    }
    const historyForRequest = chatMessages
      .filter((m) => m.role === 'user' || m.role === 'assistant')
      .slice(-10)
      .map((m) => ({ role: m.role, text: m.text }))

    setChatMessages((list) => [...list, userMsg])
    setChatInput('')
    setChatBusy(true)
    setChatError('')

    try {
      const imageBase64 = chatImage ? await fileToDataUrl(chatImage) : null

      const contextSnapshot = {
        role,
        today: todayISO(),
        totals: {
          totalMasuk: totals.totalMasuk,
          totalKeluar: totals.totalKeluar,
          saldoBersih: totals.saldoBersih,
          totalPending: totals.totalPending,
          vendorBelumDisetor: totals.vendorBelumDisetor,
        },
        pendingExpenses: pendingExpenses.map((x) => ({
          id: x.id,
          category: x.category,
          description: x.description,
          amount: x.amount,
          date: x.date,
        })),
        belumLunas: belumLunas.slice(0, 15).map((m) => ({ name: m.name, sisa: m.sisa })),
        categories,
      }

      const { data, error } = await supabase.functions.invoke('ai-assistant', {
        body: {
          message: text,
          history: historyForRequest,
          context: contextSnapshot,
          image: imageBase64,
        },
      })

      if (error) throw error

      setChatMessages((list) => [
        ...list,
        {
          id: crypto.randomUUID(),
          role: 'assistant',
          text: data?.reply || 'Maaf, saya tidak punya jawaban untuk itu.',
          time: Date.now(),
        },
      ])

      if (data?.action) {
        await performAssistantAction(data.action)
      }
    } catch (chatErr) {
      console.error('Gagal menghubungi asisten AI:', chatErr)
      setChatError(
        'Asisten AI belum aktif untuk proyek ini. Perlu men-deploy Edge Function "ai-assistant" dulu di Supabase (lihat catatan setup).'
      )
    } finally {
      setChatBusy(false)
      setChatImage(null)
    }
  }

  return {
    chatOpen,
    setChatOpen,
    chatMessages,
    chatInput,
    setChatInput,
    chatImage,
    setChatImage: selectChatImage,
    chatBusy,
    chatError,
    sendChatMessage,
  }
}
