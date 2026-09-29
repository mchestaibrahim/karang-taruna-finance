import { Empty, FormError, ProofButton, ProofPicker, VoidButton, VoidNote } from '../ui'
import { rupiah } from '../../app/formatters'

export function NyicilPage({ data }) {
  const { canEdit, addPayment, nyicilMember, setNyicilMember, activeMembers, paymentAmount, setPaymentAmount, nyicilProof, setNyicilProof, saving, nyicilTarget, formError, payments, nameOfMember, openProof, askVoid } = data

  return (
<>
      {canEdit && (
        <section className="box box-compact">
          <h3>Tambah Pembayaran</h3>

          <form className="form-row" onSubmit={addPayment} noValidate>
            <label className="field">
              <span>Anggota</span>
              <select
                className="input"
                value={nyicilMember}
                onChange={(e) => setNyicilMember(e.target.value)}
              >
                <option value="">Pilih anggota</option>
                {activeMembers.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="field">
              <span>Nominal (Rp)</span>
              <input
                className="input"
                type="number"
                min="1"
                inputMode="numeric"
                placeholder="Contoh: 20000"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
              />
            </label>

            <ProofPicker label="Bukti Pembayaran" file={nyicilProof} setFile={setNyicilProof} wide={false} />

            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Menyimpan...' : '+ Simpan Pembayaran'}
            </button>
          </form>

          {nyicilTarget && (
            <p className="hint">
              Sisa target {nyicilTarget.name}: {rupiah(nyicilTarget.sisa)}
            </p>
          )}

          <FormError message={formError} />
        </section>
      )}

      <section className={`box box-compact${canEdit ? ' section-gap' : ''}`}>
        <h3>Riwayat Pembayaran</h3>

        {payments.length === 0 ? (
          <Empty>Belum ada pembayaran.</Empty>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Tanggal</th>
                <th>Nama</th>
                <th className="num">Nominal</th>
                <th>Bukti</th>
                {canEdit && <th />}
              </tr>
            </thead>
            <tbody>
              {[...payments]
                .sort((a, b) => b.sortTime - a.sortTime || b.id - a.id)
                .map((p) => (
                  <tr key={p.id} className={p.voided ? 'row-void' : ''}>
                    <td>{p.date}</td>
                    <td>
                      <strong>{nameOfMember(p.memberId)}</strong>
                      <VoidNote item={p} />
                    </td>
                    <td className="num">{rupiah(p.amount)}</td>
                    <td><ProofButton value={p.proofUrl} openProof={openProof} /></td>
                    {canEdit && (
                      <td>
                        <div className="actions">
                          <VoidButton canEdit={canEdit} item={p} kind="nyicil" label={`Nyicil ${nameOfMember(p.memberId)}, ${p.date}: ${rupiah(p.amount)}`} askVoid={askVoid} />
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
            </tbody>
          </table>
        )}
      </section>
    </>
  )
}
