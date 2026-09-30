import { Empty } from '../ui'

const TYPE_LABELS = {
  nominal: 'Nominal salah',
  description: 'Nama/keterangan salah',
  date: 'Tanggal salah',
  duplicate: 'Data duplikat',
  mismatch: 'Data tidak sesuai',
  other: 'Lainnya',
}

export function DataReportsPage({ reports, canEdit, loading, error, busyId, onReview }) {
  return (
    <section className="box box-compact">
      <div className="report-page-head">
        <div><h3>Laporan Kesalahan Data</h3><p className="hint">Laporan diteruskan kepada Bendahara untuk ditinjau.</p></div>
        <span className="report-count">{reports.filter((report) => report.status === 'pending').length} menunggu</span>
      </div>
      {error && <p className="banner banner-error" role="alert">{error}</p>}
      {loading ? <p className="hint">Memuat laporan...</p> : reports.length === 0 ? <Empty>Belum ada laporan.</Empty> : (
        <div className="report-list">
          {reports.map((report) => (
            <article className="report-item" key={report.id}>
              <div className="report-item-head">
                <div><span className={`report-status ${report.status}`}>{report.status === 'pending' ? 'Menunggu ditinjau' : 'Sudah ditinjau'}</span><h4>{TYPE_LABELS[report.report_type] || 'Lainnya'}</h4></div>
                <time dateTime={report.created_at}>{new Date(report.created_at).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}</time>
              </div>
              <p className="report-record">{report.record_label} <span>({report.record_table} #{report.record_id})</span></p>
              <p>{report.description}</p>
              {report.additional_note && <p className="sub">Catatan: {report.additional_note}</p>}
              {report.status === 'reviewed' && <p className="sub">Ditinjau {report.reviewed_at ? new Date(report.reviewed_at).toLocaleString('id-ID') : ''}</p>}
              {canEdit && report.status === 'pending' && <button className="btn btn-primary btn-sm" type="button" disabled={busyId === report.id} onClick={() => onReview(report)}>{busyId === report.id ? 'Menyimpan...' : 'Tandai sudah ditinjau'}</button>}
            </article>
          ))}
        </div>
      )}
    </section>
  )
}
