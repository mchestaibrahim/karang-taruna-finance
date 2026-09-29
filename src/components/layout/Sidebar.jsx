import logo from '../../logo.png'
import { NAV_GROUPS, ROLE_LABEL } from '../../app/config'
import { ICONS } from '../../app/icons'

export function Sidebar({ data, actions }) {
  const { page, session, role, pendingExpenses, canApprove } = data
  const { goTo, handleLogout } = actions

  return (
    <aside className="sidebar no-print">
      <h2>
        <img src={logo} alt="Logo Karta Kencana RW 02" className="logo" />
        KT Finance
      </h2>

      <nav>
        {NAV_GROUPS.map((group) => (
          <div className="nav-group" key={group.label}>
            <div className="nav-group-label">{group.label}</div>
            {group.items.map((p) => (
              <button
                key={p.id}
                type="button"
                className={page === p.id ? 'active' : ''}
                aria-current={page === p.id ? 'page' : undefined}
                onClick={() => goTo(p.id)}
              >
                <span className="nav-icon">{ICONS[p.id]}</span>
                <span className="nav-label">{p.label}</span>
                {p.id === 'pengeluaran' && canApprove && pendingExpenses.length > 0 && (
                  <span className="nav-count">{pendingExpenses.length}</span>
                )}
              </button>
            ))}
          </div>
        ))}
      </nav>

      <div className="sidebar-user">
        <div className="sidebar-email" title={session.user.email}>
          {session.user.email}
        </div>
        <div className="sidebar-role">{ROLE_LABEL[role]}</div>
        <button type="button" onClick={handleLogout}>
          Keluar
        </button>
      </div>
    </aside>
  )
}
