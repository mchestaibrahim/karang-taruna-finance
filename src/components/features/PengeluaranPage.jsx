import { ApprovalBadge, Badge, Empty, FormError, ProofButton, ProofPicker, VoidButton, VoidNote } from '../ui'
import { EXPENSE_CATEGORIES, VENDOR_CATEGORY } from '../../app/config'
import { rupiah } from '../../app/formatters'

export function PengeluaranPage({ data }) {
  const { canEdit, saveExpense, expDate, setExpDate, expCategory, setExpCategory, expDesc, setExpDesc, expAmount, setExpAmount, expProof, setExpProof, handleAiScan, aiScanBusy, aiScanError, aiScanResult, setAiScanResult, applyAiScanResult, discardAiScanResult, possibleExpenseDuplicate, saving, formError, canApprove, pendingExpenses, approveBusyId, approveExpense, askReject, expenses, openProof, askVoid } = data

  return (
<>
      {canEdit && (
        <section className="box box-compact">
          <div className="section-head">
            <div>
              <h3>Catat Pengeluaran</h3>
              <p className="hint">Catat biaya kegiatan atau setoran vendor beserta bukti pembayarannya.</p>
            </div>
          </div>

          <form className="form-row expense-form" onSubmit={saveExpense} noValidate>
            <label className="field narrow">
              <span>Tanggal</span>
              <input
                className="input"
                type="date"
                value={expDate}
                onChange={(e) => setExpDate(e.target.value)}
              />
            </label>

            <label className="field">
              <span>Kategori</span>
              <select
                className="input"
                value={expCategory}
                onChange={(e) => setExpCategory(e.target.value)}
              >
                {EXPENSE_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </label>

            <label className="field">
              <span>Keterangan</span>
              <input
                className="input"
                type="text"
                placeholder="Contoh: Beli plastik dan kertas minyak"
                value={expDesc}
                onChange={(e) => setExpDesc(e.target.value)}
              />
            </label>

            <label className="field narrow">
              <span>Nominal (Rp)</span>
              <input
                className="input"
                type="number"
                min="1"
                inputMode="numeric"
                placeholder="Contoh: 45000"
                value={expAmount}
                onChange={(e) => setExpAmount(e.target.value)}
              />
            </label>

            <ProofPicker label="Nota / Bukti" file={expProof} setFile={setExpProof} wide={false} />

            <div className="expense-ai-action">
              <button
                type="button"
                className="btn btn-ai"
                onClick={handleAiScan}
                disabled={aiScanBusy || !expProof}
              >
                {aiScanBusy ? 'Membaca nota...' : 'Baca dengan AI'}
              </button>
            </div>

            {aiScanError && <FormError message={aiScanError} />}

            {aiScanResult && (
              <div className="ai-scan-box">
                <div className="ai-scan-head">Data ditemukan oleh AI</div>

                <div className="ai-scan-result">
                  <label className="field">
                    <span>Tanggal</span>
                    <input
                      className="input input-sm"
                      type="date"
                      value={aiScanResult.tanggal}
                      onChange={(e) =>
                        setAiScanResult((r) => ({ ...r, tanggal: e.target.value }))
                      }
                    />
                  </label>
                  <label className="field">
                    <span>Vendor</span>
                    <input
                      className="input input-sm"
                      value={aiScanResult.vendor}
                      onChange={(e) =>
                        setAiScanResult((r) => ({ ...r, vendor: e.target.value }))
                      }
                    />
                  </label>
                  <label className="field span-2">
                    <span>Deskripsi</span>
                    <input
                      className="input input-sm"
                      value={aiScanResult.deskripsi}
                      onChange={(e) =>
                        setAiScanResult((r) => ({ ...r, deskripsi: e.target.value }))
                      }
                    />
                  </label>
                  <label className="field">
                    <span>Nominal</span>
                    <input
                      className="input input-sm"
                      type="number"
                      value={aiScanResult.nominal}
                      onChange={(e) =>
                        setAiScanResult((r) => ({ ...r, nominal: e.target.value }))
                      }
                    />
                  </label>
                  <label className="field">
                    <span>Kategori</span>
                    <select
                      className="input input-sm"
                      value={aiScanResult.kategori}
                      onChange={(e) =>
                        setAiScanResult((r) => ({ ...r, kategori: e.target.value }))
                      }
                    >
                      {EXPENSE_CATEGORIES.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </label>
                </div>

                <div className="ai-scan-actions">
                  <button type="button" className="btn btn-primary btn-sm" onClick={applyAiScanResult}>
                    Gunakan Data
                  </button>
                  <button type="button" className="btn btn-ghost btn-sm" onClick={discardAiScanResult}>
                    Edit Manual
                  </button>
                  <button type="button" className="btn btn-ghost btn-sm" onClick={handleAiScan}>
                    Scan Ulang
                  </button>
                </div>
              </div>
            )}

            {possibleExpenseDuplicate && (
              <div className="banner banner-info section-gap">
                AI menemukan transaksi yang mirip: {possibleExpenseDuplicate.category},{' '}
                {possibleExpenseDuplicate.date}, {rupiah(possibleExpenseDuplicate.amount)}.
                Apakah ini pengeluaran yang sama?
              </div>
            )}

            <button type="submit" className="btn btn-primary section-gap" disabled={saving}>
              {saving ? 'Menyimpan...' : '+ Kirim untuk Disetujui'}
            </button>
          </form>

          <div className={`expense-guidance${expCategory === VENDOR_CATEGORY ? ' is-vendor' : ''}`} role="note">
            <strong>{expCategory === VENDOR_CATEGORY ? 'Mencatat setoran bagian vendor' : 'Tentang persetujuan pengeluaran'}</strong>
            <p>
              {expCategory === VENDOR_CATEGORY
                ? <>Pilih kategori <b>{VENDOR_CATEGORY}</b>, lalu isi nominal yang benar-benar dibayarkan. Setelah disetujui, saldo “Vendor Belum Disetor” di Dashboard otomatis berkurang. Nilai kewajiban tidak perlu diisi manual.</>
                : <>Pengeluaran baru berstatus “Menunggu” sampai disetujui pengurus, dan baru mengurangi saldo kas setelah disetujui. Untuk membayar bagian vendor Danusan, pilih kategori “{VENDOR_CATEGORY}”.</>}
            </p>
          </div>

          <FormError message={formError} />
        </section>
      )}

      {canApprove && pendingExpenses.length > 0 && (
        <section className="box box-compact approval-box section-gap">
          <h3>Menunggu Persetujuan Kamu</h3>
          <p className="hint">
            Cek nota di setiap pengajuan sebelum menyetujui. Nominal baru masuk
            hitungan kas setelah kamu setujui.
          </p>

          {pendingExpenses
            .slice()
            .sort((a, b) => b.sortTime - a.sortTime)
            .map((x) => (
              <div className="approval-row" key={x.id}>
                <div>
                  <strong>{x.category}</strong>
                  <div className="sub">
                    {x.date}, {x.description}
                  </div>
                </div>
                <div className="approval-end">
                  <strong>{rupiah(x.amount)}</strong>
                  <ProofButton value={x.proofUrl} openProof={openProof} />
                  <div className="actions">
                    <button
                      type="button"
                      className="btn btn-primary btn-sm"
                      disabled={approveBusyId === x.id}
                      onClick={() => approveExpense(x)}
                    >
                      {approveBusyId === x.id ? 'Menyetujui...' : 'Setujui'}
                    </button>
                    <button
                      type="button"
                      className="btn btn-danger btn-sm"
                      onClick={() => askReject(x)}
                    >
                      Tolak
                    </button>
                  </div>
                </div>
              </div>
            ))}
        </section>
      )}

      <section className={`box box-compact${canEdit || canApprove ? ' section-gap' : ''}`}>
        <h3>Riwayat Pengeluaran</h3>

        {expenses.length === 0 ? (
          <Empty>Belum ada pengeluaran.</Empty>
        ) : (
          <div className="table-wrap" role="region" aria-label="Riwayat Pengeluaran" tabIndex="0">
            <table className="table wide">
              <thead>
                <tr>
                  <th>Tanggal</th>
                  <th>Kategori</th>
                  <th>Keterangan</th>
                  <th className="num">Nominal</th>
                  <th>Persetujuan</th>
                  <th>Nota</th>
                  {canEdit && <th />}
                </tr>
              </thead>
              <tbody>
                {[...expenses]
                  .sort((a, b) => b.sortTime - a.sortTime || b.id - a.id)
                  .map((x) => (
                    <tr key={x.id} className={x.voided ? 'row-void' : ''}>
                      <td>{x.date}</td>
                      <td>
                        <Badge tone="pengeluaran">{x.category}</Badge>
                      </td>
                      <td>
                        {x.description}
                        <VoidNote item={x} />
                        {x.status === 'rejected' && x.rejectReason && (
                          <div className="void-note">
                            <Badge tone="rejected">Ditolak</Badge> {x.rejectReason}
                          </div>
                        )}
                      </td>
                      <td className="num neg">-{rupiah(x.amount)}</td>
                      <td><ApprovalBadge status={x.status} /></td>
                      <td><ProofButton value={x.proofUrl} openProof={openProof} /></td>
                      {canEdit && (
                        <td>
                          <div className="actions">
                            <VoidButton canEdit={canEdit} item={x} kind="pengeluaran" label={`Pengeluaran ${x.category}, ${x.date}: ${rupiah(x.amount)}`} askVoid={askVoid} />
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  )
}
