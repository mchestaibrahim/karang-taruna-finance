import { useEffect, useState } from 'react'
import { FormError } from './ui'

const REPORT_TYPES = [
  ['nominal', 'Nominal salah'],
  ['description', 'Nama/keterangan salah'],
  ['date', 'Tanggal salah'],
  ['duplicate', 'Data duplikat'],
  ['mismatch', 'Data tidak sesuai'],
  ['other', 'Lainnya'],
]

export function DataReportDialog({ target, busy, error, onClose, onSubmit }) {
  const [type, setType] = useState('mismatch')
  const [description, setDescription] = useState('')
  const [additionalNote, setAdditionalNote] = useState('')

  useEffect(() => {
    const onKeyDown = (event) => event.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <form className="modal box box-compact" role="dialog" aria-modal="true" aria-labelledby="report-title" onClick={(event) => event.stopPropagation()} onSubmit={(event) => { event.preventDefault(); onSubmit({ target, type, description, additionalNote }) }}>
        <h3 id="report-title">Laporkan Kesalahan Data</h3>
        <p className="modal-target">{target.label}</p>
        <label className="field">
          <span>Jenis masalah</span>
          <select className="input" value={type} onChange={(event) => setType(event.target.value)}>
            {REPORT_TYPES.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
        </label>
        <label className="field">
          <span>Deskripsi</span>
          <textarea className="input textarea" rows={3} required maxLength={1500} value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Jelaskan bagian yang menurutmu perlu diperiksa" />
        </label>
        <label className="field">
          <span>Catatan tambahan <span className="sub">(opsional)</span></span>
          <textarea className="input textarea" rows={2} maxLength={1000} value={additionalNote} onChange={(event) => setAdditionalNote(event.target.value)} />
        </label>
        <FormError message={error} />
        <div className="modal-actions">
          <button type="button" className="btn btn-ghost" onClick={onClose}>Batal</button>
          <button type="submit" className="btn btn-primary" disabled={busy || !description.trim()}>{busy ? 'Mengirim...' : 'Kirim laporan'}</button>
        </div>
      </form>
    </div>
  )
}
