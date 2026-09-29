import { Empty, FormError } from '../ui'
import { describeAudit } from '../../app/helpers'
import { formatDateTime } from '../../app/formatters'

export function LogPage({ data }) {
  const { auditError, auditLoading, filteredAuditRows, auditRows, logSearch, setLogSearch, nameOfMember } = data

  return (
<section className="box box-compact">
      <h3>Log Aktivitas</h3>

<div className="toolbar">
  <input
    className="input"
    type="search"
    placeholder="Cari aktivitas atau pengguna..."
    aria-label="Cari aktivitas atau pengguna"
    value={logSearch}
    onChange={(e) => setLogSearch(e.target.value)}
  />

  {logSearch && (
    <button
      type="button"
      className="btn btn-ghost"
      onClick={() => setLogSearch('')}
    >
      Bersihkan
    </button>
  )}
</div>

<p className="hint">
  Dicatat otomatis oleh database setiap ada perubahan. Tidak bisa diubah
  atau dihapus dari aplikasi. Menampilkan 200 aktivitas terakhir.
</p>
 {logSearch && (
      <p className="hint">
        Menampilkan {filteredAuditRows.length} dari {auditRows.length} aktivitas.
      </p>
    )}

      {auditError && <FormError message={auditError} />}

      {auditLoading ? (
        <Empty>Memuat log...</Empty>
     ) : filteredAuditRows.length === 0 ? (
  <Empty>
    {auditRows.length === 0
      ? 'Belum ada aktivitas.'
      : 'Tidak ada aktivitas yang cocok.'}
  </Empty>
) : (
  <table className="table wide section-gap">
          <thead>
            <tr>
              <th>Waktu</th>
              <th>Pengguna</th>
              <th>Aktivitas</th>
            </tr>
          </thead>
          <tbody>
            {filteredAuditRows.map((row) => (
              <tr key={row.id}>
                <td className="nowrap">{formatDateTime(row.at)}</td>
                <td className="sub">{row.actor_email || 'Sistem'}</td>
                <td>{describeAudit(row, nameOfMember)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  )
}
