import { Badge, Empty, FormError, ProofButton, ProofPicker, VoidButton, VoidNote } from '../ui'
import { rupiah } from '../../app/formatters'

export function PemasukanPage({ data }) {
  const { canEdit, saveOtherIncome, incomeDate, setIncomeDate, incomeType, setIncomeType, incomeSource, setIncomeSource, incomeDesc, setIncomeDesc, incomeAmount, setIncomeAmount, carwashLabel, setCarwashLabel, carwashAmount, setCarwashAmount, activeMembers, carwashMembers, toggleCarwashMember, incomeProof, setIncomeProof, saving, formError, otherIncome, carwashAllocationsFor, nameOfMember, openProof, askVoid } = data

  return (
<>
      {canEdit && (
        <section className="box box-compact">
          <h3>Catat Pemasukan Lainnya</h3>

          <form onSubmit={saveOtherIncome} noValidate>
            <div className="form-row">
              <label className="field narrow">
                <span>Tanggal</span>
                <input
                  className="input"
                  type="date"
                  value={incomeDate}
                  onChange={(e) => setIncomeDate(e.target.value)}
                />
              </label>

              <label className="field narrow">
                <span>Jenis Pemasukan</span>
                <select
                  className="input"
                  value={incomeType}
                  onChange={(e) => setIncomeType(e.target.value)}
                >
                  <option value="nyuci">Nyuci</option>
                  <option value="bantuan">Bantuan</option>
                  <option value="lainnya">Lainnya</option>
                </select>
              </label>

              {incomeType !== 'nyuci' && (
                <>
                  <label className="field">
                    <span>Sumber</span>
                    <input
                      className="input"
                      type="text"
                      placeholder="Contoh: Warga / pelanggan"
                      value={incomeSource}
                      onChange={(e) => setIncomeSource(e.target.value)}
                    />
                  </label>

                  <label className="field">
                    <span>Keterangan</span>
                    <input
                      className="input"
                      type="text"
                      placeholder="Contoh: Jasa cuci karpet"
                      value={incomeDesc}
                      onChange={(e) => setIncomeDesc(e.target.value)}
                    />
                  </label>

                  <label className="field narrow">
                    <span>Nominal (Rp)</span>
                    <input
                      className="input"
                      type="number"
                      min="1"
                      inputMode="numeric"
                      placeholder="Contoh: 100000"
                      value={incomeAmount}
                      onChange={(e) => setIncomeAmount(e.target.value)}
                    />
                  </label>
                </>
              )}
            </div>

            {incomeType === 'nyuci' && (
              <div className="carwash-panel section-gap">
                <div className="form-row">
                  <label className="field">
                    <span>Label / Hari Car Wash</span>
                    <input
                      className="input"
                      type="text"
                      placeholder="Contoh: Day 1"
                      value={carwashLabel}
                      onChange={(e) => setCarwashLabel(e.target.value)}
                    />
                  </label>

                  <label className="field narrow">
                    <span>Total Hasil Hari Ini (Rp)</span>
                    <input
                      className="input"
                      type="number"
                      min="1"
                      inputMode="numeric"
                      placeholder="Contoh: 305000"
                      value={carwashAmount}
                      onChange={(e) => setCarwashAmount(e.target.value)}
                    />
                  </label>
                </div>

                <div className="field-block section-gap">
                  <span className="field-label">Anggota yang hadir</span>

                  <div className="member-check-list">
                    {activeMembers.map((member) => (
                      <label className="check-row" key={member.id}>
                        <input
                          type="checkbox"
                          checked={carwashMembers.includes(member.id)}
                          onChange={() => toggleCarwashMember(member.id)}
                        />
                        <span>{member.name}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="summary">
                  <div>
                    <span>Total hasil</span>
                    <strong>{rupiah(Number(carwashAmount) || 0)}</strong>
                  </div>

                  <div>
                    <span>Jumlah hadir</span>
                    <strong>{carwashMembers.length} orang</strong>
                  </div>

                  <div>
                    <span>Potongan per orang</span>
                    <strong>
                      {rupiah(
                        carwashMembers.length > 0
                          ? Math.floor(
                              (Number(carwashAmount) || 0) / carwashMembers.length
                            )
                          : 0
                      )}
                    </strong>
                  </div>
                </div>

                <p className="hint">
                  Potongan per orang akan langsung mengurangi sisa tagihan
                  masing-masing anggota yang dicentang di atas.
                </p>
              </div>
            )}

            <div className="form-row section-gap">
              <ProofPicker label="Bukti (opsional)" file={incomeProof} setFile={setIncomeProof} wide={false} />

              <button
                type="submit"
                className="btn btn-primary"
                disabled={saving}
              >
                {saving ? 'Menyimpan...' : '+ Simpan Pemasukan'}
              </button>
            </div>
          </form>

          <p className="hint">
            Pemasukan ini menambah kas Karang Taruna. Nyuci juga langsung
            mengurangi sisa tagihan anggota yang hadir; jenis lain tidak
            dihitung ke target kontribusi anggota.
          </p>

          <FormError message={formError} />
        </section>
      )}

      <section
        className={`box box-compact${canEdit ? ' section-gap' : ''}`}
      >
        <h3>Riwayat Pemasukan Lainnya</h3>

        {otherIncome.length === 0 ? (
          <Empty>Belum ada pemasukan lainnya.</Empty>
        ) : (
          <table className="table wide">
            <thead>
              <tr>
                <th>Tanggal</th>
                <th>Jenis</th>
                <th>Sumber</th>
                <th>Keterangan</th>
                <th className="num">Nominal</th>
                <th>Bukti</th>
                {canEdit && <th />}
              </tr>
            </thead>

            <tbody>
              {[...otherIncome]
                .sort(
                  (a, b) => b.sortTime - a.sortTime || b.id - a.id
                )
                .map((x) => (
                  <tr
                    key={x.id}
                    className={x.voided ? 'row-void' : ''}
                  >
                    <td>{x.date}</td>

                    <td>
                      <Badge tone="pemasukan-lainnya">
                        {x.type === 'nyuci'
                          ? 'Nyuci'
                          : x.type === 'bantuan'
                            ? 'Bantuan'
                            : 'Lainnya'}
                      </Badge>
                    </td>

                    <td>{x.sourceName || '-'}</td>

                    <td>
                      {x.description}
                      <VoidNote item={x} />
                      {x.type === 'nyuci' && (
                        <div className="sub carwash-breakdown">
                          {x.voided ? (
                            'Potongan dibatalkan bersama catatan ini'
                          ) : (
                            carwashAllocationsFor(x.id).map((a) => (
                              <div key={a.id}>
                                {nameOfMember(a.member_id)}: -{rupiah(a.amount)}
                              </div>
                            ))
                          )}
                        </div>
                      )}
                    </td>

                    <td className="num">
                      {rupiah(x.amount)}
                    </td>

                    <td><ProofButton value={x.proofUrl} openProof={openProof} /></td>

                    {canEdit && (
                      <td>
                        <div className="actions">
                          <VoidButton canEdit={canEdit} item={x} kind="pemasukan-lainnya" label={`Pemasukan ${x.description}, ${x.date}: ${rupiah(x.amount)}`} askVoid={askVoid} />
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
