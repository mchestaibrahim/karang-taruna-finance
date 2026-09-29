import { ApprovalBadge, Badge, Empty, VoidButton, VoidNote } from '../ui'
import { rupiah } from '../../app/formatters'

export function TransaksiPage({ data }) {
  const { txSearch, setTxSearch, txMember, setTxMember, members, txType, setTxType, txStatus, setTxStatus, txSort, setTxSort, exportCsv, filteredTx, allTransactions, filteredMasuk, filteredKeluar, canEdit, askVoid } = data

  return (
<section className="box box-compact">
      <h3>Riwayat Transaksi</h3>

      <div className="toolbar">
        <input
  className="input"
  type="search"
  placeholder="Cari transaksi..."
  aria-label="Cari transaksi"
  value={txSearch}
  onChange={(e) => setTxSearch(e.target.value)}
/>
        <select
          className="input"
          aria-label="Filter anggota"
          value={txMember}
          onChange={(e) => setTxMember(e.target.value)}
        >
          <option value="">Semua anggota</option>
          {members.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
        </select>

        <select
          className="input"
          aria-label="Filter jenis"
          value={txType}
          onChange={(e) => setTxType(e.target.value)}
        >
          <option value="all">Semua jenis</option>
          <option value="nyicil">Nyicil</option>
          <option value="danusan">Danusan</option>
          <option value="pengeluaran">Pengeluaran</option>
          <option value="pemasukan-lainnya">Pemasukan Lainnya</option>
        </select>

        <select
          className="input"
          aria-label="Filter status"
          value={txStatus}
          onChange={(e) => setTxStatus(e.target.value)}
        >
          <option value="all">Semua status</option>
          <option value="approved">Disetujui</option>
          <option value="pending">Menunggu</option>
          <option value="rejected">Ditolak</option>
          <option value="voided">Dibatalkan</option>
        </select>

        <select
          className="input"
          aria-label="Urutkan"
          value={txSort}
          onChange={(e) => setTxSort(e.target.value)}
        >
          <option value="date-desc">Terbaru dulu</option>
          <option value="date-asc">Terlama dulu</option>
          <option value="amount-desc">Nominal terbesar</option>
          <option value="amount-asc">Nominal terkecil</option>
        </select>

        <span className="spacer" />

        <button
          type="button"
          className="btn btn-ghost"
          onClick={exportCsv}
          disabled={filteredTx.length === 0}
        >
          Unduh CSV
        </button>
      </div>

      <p className="hint">
  Menampilkan {filteredTx.length} dari {allTransactions.length} transaksi.
  {' '}Masuk {rupiah(filteredMasuk)}, keluar {rupiah(filteredKeluar)}
  {' '}(yang sudah disetujui)
</p>

      {filteredTx.length === 0 ? (
        <Empty>Belum ada transaksi yang cocok.</Empty>
      ) : (
        <table className="table wide">
          <thead>
            <tr>
              <th>Tanggal</th>
              <th>Nama</th>
              <th>Jenis</th>
              <th>Detail</th>
              <th className="num">Nominal</th>
              {canEdit && <th />}
            </tr>
          </thead>
          <tbody>
            {filteredTx.map((t) => (
              <tr key={t.key} className={t.voided ? 'row-void' : ''}>
                <td>{t.date}</td>
                <td>
                  <strong>{t.name}</strong>
                </td>
                <td>
                  <Badge tone={t.kind}>{t.type}</Badge>
                  {t.kind === 'pengeluaran' && t.status !== 'approved' && (
                    <span className="badge-gap"><ApprovalBadge status={t.status} /></span>
                  )}
                </td>
                <td className="sub">
                  {t.detail}
                  <VoidNote item={t} />
                </td>
                <td className={`num${t.kind === 'pengeluaran' ? ' neg' : ''}`}>
                  {t.kind === 'pengeluaran' ? '-' : ''}
                  {rupiah(t.amount)}
                  {t.kind === 'danusan' && (
                    <div className="sub">Bati {rupiah(t.profit)}</div>
                  )}
                </td>
                {canEdit && (
                  <td>
                    <div className="actions">
                      <VoidButton canEdit={canEdit} item={t} kind={t.kind} label={`${t.type} ${t.name}, ${t.date}: ${rupiah(t.amount)}`} askVoid={askVoid} />
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  )
}
