import { Empty } from '../ui'
import { monthLabel, rupiah } from '../../app/formatters'
import logo from '../../logo.png'

export function LaporanPage({ data }) {
  const { reportMonth, setReportMonth, copyReportSummary, reportMasuk, reportNyicilCount, reportDanusanCount, reportKeluar, reportBati, reportSaldo, reportByCategory, belumLunas, vendorBelumDisetor } = data

  return (
<>
      <section className="box box-compact no-print">
        <div className="toolbar">
          <label className="field narrow">
            <span>Pilih bulan</span>
            <input
              className="input"
              type="month"
              value={reportMonth}
              onChange={(e) => setReportMonth(e.target.value)}
            />
          </label>

          <span className="spacer" />

          <button type="button" className="btn btn-ghost" onClick={copyReportSummary}>
            Salin Ringkasan Teks
          </button>
          <button type="button" className="btn btn-primary" onClick={() => window.print()}>
            Cetak / Simpan PDF
          </button>
        </div>
        <p className="hint">
          "Salin Ringkasan Teks" menyalin versi teks singkat, cocok ditempel ke
          grup WhatsApp. "Cetak / Simpan PDF" membuka dialog cetak browser,
          pilih "Simpan sebagai PDF" untuk mengarsipkan atau membagikannya.
        </p>
      </section>

      <section className="box report-sheet section-gap">
        <div className="report-head">
          <img src={logo} alt="Logo Karta Kencana RW 02" className="report-logo" />
          <div>
            <h3>Laporan Keuangan Karang Taruna</h3>
            <p className="hint">Periode {monthLabel(reportMonth)}</p>
          </div>
        </div>

        <div className="cards report-cards">
          <div className="card">
            <span>Uang Masuk</span>
            <h2>{rupiah(reportMasuk)}</h2>
            <small className="card-note">
              {reportNyicilCount} nyicil, {reportDanusanCount} danusan
            </small>
          </div>
          <div className="card">
            <span>Pengeluaran Disetujui</span>
            <h2>{rupiah(reportKeluar)}</h2>
          </div>
          <div className="card">
            <span>Bati Karang Taruna</span>
            <h2>{rupiah(reportBati)}</h2>
          </div>
          <div className="card">
            <span>Saldo Bulan Ini</span>
            <h2>{rupiah(reportSaldo)}</h2>
          </div>
        </div>

        <h4 className="subhead">Rincian Pengeluaran per Kategori</h4>
        {reportByCategory.length === 0 ? (
          <Empty>Tidak ada pengeluaran disetujui pada periode ini.</Empty>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Kategori</th>
                <th className="num">Total</th>
              </tr>
            </thead>
            <tbody>
              {reportByCategory.map(([cat, amount]) => (
                <tr key={cat}>
                  <td>{cat}</td>
                  <td className="num">{rupiah(amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        <h4 className="subhead">Anggota Belum Lunas (status terkini)</h4>
        {belumLunas.length === 0 ? (
          <Empty>Semua anggota aktif sudah lunas.</Empty>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Nama</th>
                <th className="num">Sisa</th>
              </tr>
            </thead>
            <tbody>
              {belumLunas.map((m) => (
                <tr key={m.id}>
                  <td>{m.name}</td>
                  <td className="num">{rupiah(m.sisa)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {vendorBelumDisetor > 0 && (
          <p className="hint report-warn">
            Perhatian: masih ada {rupiah(vendorBelumDisetor)} bagian vendor yang
            belum disetor.
          </p>
        )}

        <p className="hint report-footer">
          Dibuat otomatis dari aplikasi KT Finance pada{' '}
          {new Date().toLocaleString('id-ID', { dateStyle: 'long', timeStyle: 'short' })}.
        </p>
      </section>
    </>
  )
}
