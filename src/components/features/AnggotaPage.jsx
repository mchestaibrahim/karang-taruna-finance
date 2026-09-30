import { Badge, Empty, FormError, Progress } from '../ui'
import { rupiah } from '../../app/formatters'

export function AnggotaPage({ data }) {
  const { canEdit, canReport, onReport, addMember, newName, setNewName, newTarget, setNewTarget, formError, editingId, search, setSearch, filteredStats, members, editName, setEditName, editTarget, setEditTarget, saveEdit, toggleActive, startEdit, setEditingId, setFormError } = data

  return (
<>
      {canEdit && (
        <section className="box box-compact">
          <h3>Tambah Anggota</h3>

          <form className="form-row" onSubmit={addMember} noValidate>
            <label className="field">
              <span>Nama anggota</span>
              <input
                className="input"
                type="text"
                placeholder="Contoh: Budi"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
              />
            </label>

            <label className="field narrow">
              <span>Target (Rp)</span>
              <input
                className="input"
                type="number"
                min="1"
                value={newTarget}
                onChange={(e) => setNewTarget(e.target.value)}
              />
            </label>

            <button type="submit" className="btn btn-primary">
              + Tambah
            </button>
          </form>

          {editingId === null && <FormError message={formError} />}
        </section>
      )}

      <section className={`box box-compact${canEdit ? ' section-gap' : ''}`}>
        <h3>Daftar Anggota</h3>

        <div className="toolbar">
          <input
            className="input"
            type="search"
            placeholder="Cari nama anggota"
            aria-label="Cari nama anggota"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <span className="sub">
            {filteredStats.length} dari {members.length} anggota
          </span>
        </div>

        {editingId !== null && <FormError message={formError} />}

        {filteredStats.length === 0 ? (
          <Empty>
            {members.length === 0
              ? 'Belum ada anggota.'
              : 'Tidak ada anggota dengan nama itu.'}
          </Empty>
        ) : (
          <table className="table wide">
            <thead>
              <tr>
                <th>Nama</th>
                <th className="num">Nyicil</th>
                <th className="num">Danusan</th>
                <th className="num">Nyuci</th>
                <th className="num">Total</th>
                <th className="num">Target</th>
                <th className="num">Sisa</th>
                <th>Progress</th>
                <th>Status</th>
                {(canEdit || canReport) && <th />}
              </tr>
            </thead>

            <tbody>
              {filteredStats.map((m) => {
                const editing = editingId === m.id

                return (
                  <tr key={m.id} className={m.aktif ? '' : 'row-void'}>
                    <td>
                      {editing ? (
                        <input
                          className="input input-sm"
                          aria-label="Edit nama anggota"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          autoFocus
                        />
                      ) : (
                        <strong>{m.name}</strong>
                      )}
                    </td>
                    <td className="num">{rupiah(m.nyicil)}</td>
                    <td className="num">{rupiah(m.danusan)}</td>
                    <td className="num">{rupiah(m.carwash)}</td>
                    <td className="num">{rupiah(m.total)}</td>
                    <td className="num">
                      {editing ? (
                        <input
                          className="input input-sm"
                          type="number"
                          min="1"
                          aria-label="Edit target"
                          value={editTarget}
                          onChange={(e) => setEditTarget(e.target.value)}
                        />
                      ) : (
                        rupiah(m.target)
                      )}
                    </td>
                    <td className="num">{rupiah(m.sisa)}</td>
                    <td>
                      <Progress value={m.pct} />
                      <div className="pct">{Math.min(100, Math.round(m.pct))}%</div>
                    </td>
                    <td>
                      {m.aktif ? (
                        <Badge tone={m.lunas ? 'ok' : 'warn'}>
                          {m.lunas ? 'Lunas' : 'Belum lunas'}
                        </Badge>
                      ) : (
                        <Badge tone="muted">Nonaktif</Badge>
                      )}
                    </td>
                    {(canEdit || canReport) && (
                      <td>
                        <div className="actions">
                          {canReport ? <button type="button" className="btn btn-ghost btn-sm" aria-label={`Laporkan data ${m.name}`} onClick={() => onReport({ table: 'members', id: m.id, label: `Anggota · ${m.name} · target ${rupiah(m.target)}` })}>Laporkan</button> : editing ? (
                            <>
                              <button
                                type="button"
                                className="btn btn-primary btn-sm"
                                onClick={() => saveEdit(m.id)}
                              >
                                Simpan
                              </button>
                              <button
                                type="button"
                                className="btn btn-ghost btn-sm"
                                onClick={() => {
                                  setEditingId(null)
                                  setFormError('')
                                }}
                              >
                                Batal
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                type="button"
                                className="btn btn-ghost btn-sm"
                                onClick={() => startEdit(m)}
                              >
                                Edit
                              </button>
                              <button
                                type="button"
                                className="btn btn-ghost btn-sm"
                                onClick={() => toggleActive(m)}
                              >
                                {m.aktif ? 'Nonaktifkan' : 'Aktifkan'}
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}

        <p className="hint note">
          Kolom Danusan dihitung dari bati (keuntungan) penjualan, bukan total penjualan.
          Kolom Nyuci adalah potongan hasil Car Wash yang sudah dibagi ke anggota ini.
          Anggota tidak dihapus, hanya dinonaktifkan, supaya riwayatnya tetap utuh.
        </p>
      </section>
    </>
  )
}
