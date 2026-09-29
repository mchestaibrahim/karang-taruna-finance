import { useEffect } from 'react'
import { FormError } from './ui'

function useEscape(onCancel) {
  useEffect(() => {
    const handleKeyDown = (event) => event.key === 'Escape' && onCancel()
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onCancel])
}

function ReasonDialog({ target, reason, setReason, error, busy, onCancel, onSubmit, mode }) {
  useEscape(onCancel)
  const isReject = mode === 'reject'
  const title = isReject ? 'Tolak pengeluaran ini?' : 'Batalkan catatan ini?'

  return (
    <div className="modal-backdrop" onClick={onCancel}>
      <form className="modal box box-compact" role="dialog" aria-modal="true" aria-labelledby={`${mode}-title`} onClick={(event) => event.stopPropagation()} onSubmit={onSubmit} noValidate>
        <h3 id={`${mode}-title`}>{title}</h3>
        <p className="modal-target">{target.label}</p>
        <p className="hint">
          {isReject
            ? 'Bendahara akan melihat status "Ditolak" beserta alasannya, dan nominalnya tidak akan dihitung ke kas sampai dicatat ulang.'
            : 'Catatan tidak dihapus. Ia ditandai dibatalkan, tidak dihitung dalam total, dan alasannya tercatat di Log Aktivitas.'}
        </p>
        <label className="field">
          <span>{isReject ? 'Alasan penolakan' : 'Alasan pembatalan'}</span>
          <textarea className="input textarea" rows={3} autoFocus placeholder={isReject ? 'Contoh: nota tidak jelas, minta difoto ulang' : 'Contoh: salah input nominal, seharusnya Rp20.000'} value={reason} onChange={(event) => setReason(event.target.value)} />
        </label>
        <FormError message={error} />
        <div className="modal-actions">
          <button type="button" className="btn btn-ghost" onClick={onCancel}>Tidak jadi</button>
          <button type="submit" className="btn btn-danger" disabled={busy}>{busy ? (isReject ? 'Menolak...' : 'Membatalkan...') : (isReject ? 'Tolak pengeluaran' : 'Batalkan catatan')}</button>
        </div>
      </form>
    </div>
  )
}

export function VoidDialog(props) {
  return <ReasonDialog {...props} mode="void" />
}

export function RejectDialog(props) {
  return <ReasonDialog {...props} mode="reject" />
}
