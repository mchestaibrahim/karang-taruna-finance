import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { ApprovalBadge, Badge, Empty, Progress } from '../ui'
import { compactRupiah, rupiah } from '../../app/formatters'

export function DashboardPage({
  totalMasuk,
  totalKeluar,
  saldoBersih,
  totalPending,
  pendingExpenses,
  totalBati,
  vendorBelumDisetor,
  setorVendor,
  lunasCount,
  activeMembers,
  saldoKas,
  chartData,
  canApprove,
  approveBusyId,
  approveExpense,
  askReject,
  dashboardCategoryBreakdown,
  allTransactions,
  totalCollected,
  totalTarget,
  belumLunas,
  exportBackup,
}) {
  return (
    <>
      <section className="stat-row">
        <div className="stat-item"><span className="stat-label">Total Pemasukan</span><div className="stat-value">{rupiah(totalMasuk)}</div></div>
        <div className="stat-item"><span className="stat-label">Total Pengeluaran</span><div className="stat-value">{rupiah(totalKeluar)}</div><span className="stat-note">Yang sudah disetujui saja</span></div>
        <div className="stat-item"><span className="stat-label">Saldo</span><div className="stat-value">{rupiah(saldoBersih)}</div><span className="stat-note">Bersih, setelah kewajiban vendor</span></div>
        <div className="stat-item"><span className="stat-label">Menunggu Approval</span><div className="stat-value">{rupiah(totalPending)}</div><span className="stat-note">{pendingExpenses.length} pengeluaran</span></div>
      </section>

      <section className="stat-row section-gap">
        <div className="stat-item"><span className="stat-label">Bati Karang Taruna</span><div className="stat-value">{rupiah(totalBati)}</div></div>
        <div className="stat-item"><span className="stat-label">Vendor Belum Disetor</span><div className="stat-value">{rupiah(vendorBelumDisetor)}</div><span className="stat-note">Sudah disetor {rupiah(setorVendor)}</span></div>
        <div className="stat-item"><span className="stat-label">Anggota Lunas</span><div className="stat-value">{lunasCount} / {activeMembers.length}</div></div>
        <div className="stat-item"><span className="stat-label">Saldo Kas (kotor)</span><div className="stat-value">{rupiah(saldoKas)}</div><span className="stat-note">Sebelum kewajiban vendor</span></div>
      </section>

      <section className="box chart-box">
        <div className="chart-header"><div><h3>Grafik Keuangan</h3><p className="hint">Uang masuk, bati Karang Taruna, dan pengeluaran per hari</p></div></div>
        {chartData.length === 0 ? <Empty>Belum ada data untuk grafik.</Empty> : (
          <div className="chart-wrap">
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={chartData}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="tanggal" /><YAxis /><Tooltip formatter={(value) => rupiah(value)} /><Legend />
                <Bar dataKey="masuk" name="Uang Masuk" fill="#6D28D9" radius={[6, 6, 0, 0]} animationDuration={700}><LabelList dataKey="masuk" position="top" formatter={compactRupiah} /></Bar>
                <Bar dataKey="bati" name="Bati KT" fill="#4C1D95" radius={[6, 6, 0, 0]} animationDuration={700}><LabelList dataKey="bati" position="top" formatter={compactRupiah} /></Bar>
                <Bar dataKey="keluar" name="Pengeluaran" fill="#E5484D" radius={[6, 6, 0, 0]} animationDuration={700}><LabelList dataKey="keluar" position="top" formatter={compactRupiah} /></Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </section>

      {((canApprove && pendingExpenses.length > 0) || dashboardCategoryBreakdown.length > 0) && (
        <section className="content section-gap">
          {canApprove && pendingExpenses.length > 0 ? <div className="box"><h3>Approval Menunggu Tindakan</h3>{pendingExpenses.slice(0, 4).map((expense) => <div className="list-row" key={expense.id}><div><strong>{expense.category}</strong><div className="sub">{expense.date}, {expense.description}</div></div><div className="list-end"><strong>{rupiah(expense.amount)}</strong><div className="actions"><button type="button" className="btn btn-primary btn-sm" disabled={approveBusyId === expense.id} onClick={() => approveExpense(expense)}>Setujui</button><button type="button" className="btn btn-danger btn-sm" onClick={() => askReject(expense)}>Tolak</button></div></div></div>)}{pendingExpenses.length > 4 && <p className="hint">dan {pendingExpenses.length - 4} lainnya di halaman Pengeluaran.</p>}</div> : <div className="box"><h3>Approval</h3><Empty>Tidak ada pengeluaran menunggu persetujuan.</Empty></div>}
          <div className="box"><h3>Kategori Pengeluaran Bulan Ini</h3>{dashboardCategoryBreakdown.length === 0 ? <Empty>Belum ada pengeluaran disetujui bulan ini.</Empty> : dashboardCategoryBreakdown.map(([category, amount]) => <div className="list-row" key={category}><span>{category}</span><strong>{rupiah(amount)}</strong></div>)}</div>
        </section>
      )}

      <section className="content section-gap">
        <div className="box"><h3>Transaksi Terakhir</h3>{allTransactions.filter((transaction) => !transaction.voided).length === 0 ? <Empty>Belum ada transaksi.</Empty> : allTransactions.filter((transaction) => !transaction.voided).slice(0, 5).map((transaction) => <div className="list-row" key={transaction.key}><div><strong>{transaction.name}</strong><div className="sub">{transaction.date}, {transaction.detail}</div></div><div className="list-end"><strong className={transaction.kind === 'pengeluaran' ? 'neg' : ''}>{transaction.kind === 'pengeluaran' ? '-' : ''}{rupiah(transaction.amount)}</strong><div><Badge tone={transaction.kind}>{transaction.type}</Badge>{transaction.kind === 'pengeluaran' && transaction.status !== 'approved' && <span className="badge-gap"><ApprovalBadge status={transaction.status} /></span>}</div></div></div>)}</div>
        <div className="box"><h3>Status Anggota</h3>{activeMembers.length === 0 ? <Empty>Belum ada anggota.</Empty> : <><p className="hint">Terkumpul {rupiah(totalCollected)} dari target {rupiah(totalTarget)}</p><Progress value={totalTarget ? (totalCollected / totalTarget) * 100 : 0} /><h4 className="subhead">Belum lunas</h4>{belumLunas.length === 0 ? <p className="hint">Semua anggota sudah lunas.</p> : belumLunas.slice(0, 5).map((member) => <div className="list-row" key={member.id}><strong>{member.name}</strong><span>sisa {rupiah(member.sisa)}</span></div>)}{belumLunas.length > 5 && <p className="hint">dan {belumLunas.length - 5} anggota lainnya.</p>}</>}</div>
      </section>

      <section className="box box-compact section-gap"><h3>Arsip Data</h3><p className="hint">Data tersimpan di database online. Unduh salinan arsip (.json) secara berkala sebagai cadangan pribadi.</p><div className="form-row section-gap"><button type="button" className="btn btn-primary" onClick={exportBackup}>Unduh arsip (.json)</button></div></section>
    </>
  )
}
