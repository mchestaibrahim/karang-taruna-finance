import { Empty, FormError, ProofButton, ProofPicker, VoidButton, VoidNote } from '../ui'
import { rupiah } from '../../app/formatters'

export function DanusanPage({ data }) {
  const { canEdit, saveDanusan, danusanMember, setDanusanMember, activeMembers, danusanProof, setDanusanProof, danusanItems, updateItem, danusanResult, saving, formError, danusanTransactions, nameOfMember, openProof, askVoid } = data

  return (
<>
      {canEdit && (
        <section className="box box-compact">
          <div className="section-head">
            <div>
              <h3>Input Danusan</h3>
              <p className="hint">Pilih anggota dan isi jumlah produk. Harga serta pembagian hasil dihitung otomatis.</p>
            </div>
          </div>

          <form className="danusan-form" onSubmit={saveDanusan} noValidate>
            <label className="field">
              <span>Anggota</span>
              <select
                className="input"
                value={danusanMember}
                onChange={(e) => setDanusanMember(e.target.value)}
              >
                <option value="">Pilih anggota</option>
                {activeMembers.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </label>

            <ProofPicker label="Bukti Pembayaran" file={danusanProof} setFile={setDanusanProof} wide />

            <div className="danusan-items" role="group" aria-label="Jumlah produk danusan">
              <div className="danusan-items-heading">
                <span>Produk</span>
                <span>Harga</span>
                <span>Jumlah</span>
                <span>Subtotal</span>
              </div>
              {danusanItems.map((item, index) => (
                <div className="item-row" key={item.product}>
                  <strong className="danusan-product-name">{item.product}</strong>
                  <span className="danusan-item-price">{rupiah(item.price)}</span>
                  <input
                    className="input input-sm"
                    type="number"
                    min="0"
                    inputMode="numeric"
                    aria-label={`Jumlah ${item.product}`}
                    placeholder="0"
                    value={item.quantity === 0 ? '' : item.quantity}
                    onChange={(e) =>
                      updateItem(index, {
                        quantity: Math.max(0, Math.floor(Number(e.target.value))),
                      })
                    }
                  />
                  <strong className="danusan-item-subtotal">{rupiah(item.price * item.quantity)}</strong>
                </div>
              ))}
            </div>

            <div className="summary danusan-summary">
              <div>
                <span>Total bayar</span>
                <strong>{rupiah(danusanResult.total)}</strong>
              </div>
              <div>
                <span>Bati Karang Taruna</span>
                <strong>{rupiah(danusanResult.profit)}</strong>
              </div>
              <div>
                <span>Bagian vendor · belum disetor</span>
                <strong>{rupiah(danusanResult.vendor)}</strong>
              </div>
            </div>

            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Menyimpan...' : '+ Simpan Danusan'}
            </button>
          </form>

          <FormError message={formError} />
        </section>
      )}

      <section className={`box box-compact${canEdit ? ' section-gap' : ''}`}>
        <h3>Riwayat Danusan</h3>

        {danusanTransactions.length === 0 ? (
          <Empty>Belum ada transaksi danusan.</Empty>
        ) : (
          <div className="table-wrap" role="region" aria-label="Riwayat Danusan" tabIndex="0">
            <table className="table wide">
              <thead>
                <tr>
                  <th>Tanggal</th>
                  <th>Nama</th>
                  <th>Item</th>
                  <th className="num">Total</th>
                  <th className="num">Bati</th>
                  <th className="num">Vendor</th>
                  <th>Bukti</th>
                  {canEdit && <th />}
                </tr>
              </thead>
              <tbody>
                {[...danusanTransactions]
                  .sort((a, b) => b.sortTime - a.sortTime || b.id - a.id)
                  .map((t) => (
                    <tr key={t.id} className={t.voided ? 'row-void' : ''}>
                      <td>{t.date}</td>
                      <td>
                        <strong>{nameOfMember(t.memberId)}</strong>
                        <VoidNote item={t} />
                      </td>
                      <td className="sub">
                        {(t.items || []).map((i) => `${i.product} x${i.quantity}`).join(', ')}
                      </td>
                      <td className="num">{rupiah(t.total)}</td>
                      <td className="num">{rupiah(t.profit)}</td>
                      <td className="num">{rupiah(t.vendor)}</td>
                      <td><ProofButton value={t.proofUrl} openProof={openProof} /></td>
                      {canEdit && (
                        <td>
                          <div className="actions">
                            <VoidButton canEdit={canEdit} item={t} kind="danusan" label={`Danusan ${nameOfMember(t.memberId)}, ${t.date}: ${rupiah(t.total)}`} askVoid={askVoid} />
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
