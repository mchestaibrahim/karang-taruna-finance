import { useState } from 'react'

export function GuideDialog({ role, onClose }) {
  const [step, setStep] = useState(0)
  const roleLabel = role === 'member' ? 'Member hanya dapat melihat data dan mengirim laporan kesalahan. Bendahara dan Pengurus memiliki akses pengelolaan sesuai perannya.' : 'Setiap pengguna mendapat akses sesuai peran. Bendahara mencatat data dan Pengurus meninjau pengeluaran.'
  const steps = [
    ['Selamat datang di Karang Taruna Finance', 'Tempat untuk mencatat dan memantau keuangan Karang Taruna.'],
    ['Dashboard', 'Lihat ringkasan saldo, pemasukan, pengeluaran, dan aktivitas terbaru.'],
    ['Data keuangan', 'Telusuri transaksi, data anggota, dan laporan keuangan sesuai akses akunmu.'],
    ['Laporkan kesalahan', 'Jika menemukan data yang tidak sesuai, kirim laporan agar Bendahara dapat meninjaunya.'],
    ['Role & akses', roleLabel],
    ['Mulai', 'Panduan selesai. Kamu dapat membukanya kembali kapan saja dari menu.'],
  ]
  const [title, body] = steps[step]

  return (
    <div className="modal-backdrop guide-backdrop" onClick={(event) => event.target === event.currentTarget && onClose()}>
      <section className="box guide-dialog" role="dialog" aria-modal="true" aria-labelledby="guide-title">
        <div className="guide-progress" aria-label={`Langkah ${step + 1} dari ${steps.length}`}>
          {steps.map((_, index) => <span key={index} className={index <= step ? 'active' : ''} />)}
        </div>
        <p className="guide-kicker">PANDUAN · {String(step + 1).padStart(2, '0')} / {String(steps.length).padStart(2, '0')}</p>
        <h2 id="guide-title">{title}</h2>
        <p className="guide-copy">{body}</p>
        <div className="guide-actions">
          <button type="button" className="btn btn-ghost" onClick={onClose}>Lewati</button>
          <div>
            <button type="button" className="btn btn-ghost" onClick={() => setStep((current) => Math.max(0, current - 1))} disabled={step === 0}>Sebelumnya</button>
            {step === steps.length - 1 ? <button type="button" className="btn btn-primary" onClick={onClose}>Selesai</button> : <button type="button" className="btn btn-primary" onClick={() => setStep((current) => current + 1)}>Lanjut</button>}
          </div>
        </div>
      </section>
    </div>
  )
}
