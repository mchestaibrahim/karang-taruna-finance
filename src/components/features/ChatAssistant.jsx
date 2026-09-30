import { FormError } from '../ui'

export function ChatAssistant({ chat, permissions }) {
  const { canEdit, canApprove } = permissions
  const {
    chatOpen,
    setChatOpen,
    chatMessages,
    chatInput,
    setChatInput,
    chatImage,
    setChatImage,
    chatBusy,
    chatError,
    sendChatMessage,
  } = chat

  return (
    <div className="ai-chat-wrap no-print">
      {chatOpen && (
        <div className="ai-chat-panel">
          <div className="ai-chat-head">
            <div>
              <strong>Asisten KT Finance</strong>
              <p className="hint">
                {canEdit
                  ? 'Tanya soal kas, atau catat pengeluaran/pemasukan lewat chat'
                  : canApprove
                    ? 'Tanya soal kas, atau setujui/tolak pengeluaran lewat chat'
                    : 'Tanya apa saja soal kas Karang Taruna'}
              </p>
            </div>
            <button
              type="button"
              className="ai-chat-close"
              onClick={() => setChatOpen(false)}
              aria-label="Tutup asisten"
            >
              ×
            </button>
          </div>

          <div className="ai-chat-body">
            {chatMessages.length === 0 ? (
              <p className="ai-chat-empty">
                {canEdit
                  ? 'Coba: "berapa sisa kas sekarang?" atau lampirkan foto nota lalu tulis "catat pengeluaran transportasi 20000".'
                  : canApprove
                    ? 'Coba: "ada pengeluaran menunggu apa saja?" atau "setujui pengeluaran transportasi".'
                    : 'Coba: "berapa anggota yang belum lunas?"'}
              </p>
            ) : (
              chatMessages.map((m) => (
                <div className={`ai-chat-msg ai-chat-${m.role}`} key={m.id}>
                  {m.hasImage && <span className="ai-chat-attachment">📎 Foto terlampir</span>}
                  <p>{m.text}</p>
                </div>
              ))
            )}
            {chatBusy && <p className="ai-chat-typing">Asisten mengetik...</p>}
          </div>

          {chatError && <FormError message={chatError} />}

          {chatImage && (
            <div className="ai-chat-preview">
              <span>📎 {chatImage.name}</span>
              <button type="button" onClick={() => setChatImage(null)}>
                Hapus
              </button>
            </div>
          )}

          <form
            className="ai-chat-input-row"
            onSubmit={(e) => {
              e.preventDefault()
              sendChatMessage()
            }}
          >
            {canEdit && (
              <label className="ai-chat-attach" title="Lampirkan foto nota/bukti (maksimal 2 MB)">
                📎
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0] || null
                    if (!setChatImage(file)) e.target.value = ''
                  }}
                />
              </label>
            )}
            <input
              className="input input-sm"
              type="text"
              placeholder="Tulis pesan..."
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              disabled={chatBusy}
            />
            <button
              type="submit"
              className="btn btn-primary btn-sm"
              disabled={chatBusy || (!chatInput.trim() && !chatImage)}
            >
              Kirim
            </button>
          </form>
        </div>
      )}

      <button
        type="button"
        className="ai-chat-bubble"
        onClick={() => setChatOpen((v) => !v)}
        aria-label={chatOpen ? 'Tutup asisten AI' : 'Buka asisten AI'}
      >
        {chatOpen ? '×' : '💬'}
      </button>
    </div>
  )
}
