export function Badge({ tone, children }) {
  return <span className={`badge badge-${tone}`}>{children}</span>
}

export function Progress({ value }) {
  const percentage = Math.min(100, Math.max(0, value))

  return (
    <div
      className="progress"
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(percentage)}
    >
      <div
        className={`progress-fill${percentage >= 100 ? ' done' : ''}`}
        style={{ width: `${percentage}%` }}
      />
    </div>
  )
}

export function Empty({ children }) {
  return <p className="empty">{children}</p>
}

export function FormError({ message }) {
  return message ? (
    <p className="form-error" role="alert">
      {message}
    </p>
  ) : null
}

export function ProofButton({ value, openProof }) {
  return value ? (
    <button
      type="button"
      className="btn btn-ghost btn-sm"
      onClick={() => openProof(value)}
    >
      Lihat Bukti
    </button>
  ) : (
    <span className="sub">Tidak ada</span>
  )
}

export function ProofPicker({ label, file, setFile, wide }) {
  return (
    <label className={`field file-field${wide ? ' wide-field' : ''}`}>
      <span>{label}</span>

      <div className="file-upload">
        <input
          type="file"
          accept="image/*,.pdf"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
        />

        <span className="file-upload-button">Pilih File</span>

        <span className="file-upload-name">
          {file ? file.name : 'Belum ada file dipilih'}
        </span>
      </div>
    </label>
  )
}

export function VoidButton({ canEdit, item, kind, label, askVoid }) {
  return canEdit && !item.voided ? (
    <button
      type="button"
      className="btn btn-danger btn-sm"
      onClick={() => askVoid({ kind, id: item.id, label })}
    >
      Batalkan
    </button>
  ) : null
}

export function VoidNote({ item }) {
  return item.voided ? (
    <div className="void-note">
      <Badge tone="muted">Dibatalkan</Badge> {item.voidReason}
    </div>
  ) : null
}

export function ApprovalBadge({ status }) {
  if (status === 'pending') return <Badge tone="pending">Menunggu</Badge>
  if (status === 'rejected') return <Badge tone="rejected">Ditolak</Badge>
  return <Badge tone="ok">Disetujui</Badge>
}
