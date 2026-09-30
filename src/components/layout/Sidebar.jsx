import { useEffect, useRef, useState } from 'react'
import logo from '../../logo.png'
import { NAV_GROUPS, ROLE_LABEL } from '../../app/config'
import { ICONS } from '../../app/icons'

export function Sidebar({ data, actions }) {
  const { page, session, role, pendingExpenses, canApprove } = data
  const { goTo, handleLogout, openTutorial } = actions
  const visibleGroups = role === 'member'
    ? NAV_GROUPS.map((group) => ({
        ...group,
        items: group.items.filter((item) => ['dashboard', 'anggota', 'transaksi', 'laporan', 'data-reports'].includes(item.id)),
      })).filter((group) => group.items.length > 0)
    : role === 'pengurus'
      ? NAV_GROUPS.map((group) => ({ ...group, items: group.items.filter((item) => item.id !== 'data-reports') }))
        .filter((group) => group.items.length > 0)
      : NAV_GROUPS
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const menuToggleRef = useRef(null)

  const closeMobileMenu = () => {
    setMobileMenuOpen(false)
    menuToggleRef.current?.focus()
  }

  useEffect(() => {
    if (!mobileMenuOpen) return

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') closeMobileMenu()
    }
    const mobileViewport = window.matchMedia('(max-width: 700px)')
    const handleViewportChange = (event) => {
      if (!event.matches) setMobileMenuOpen(false)
    }
    const previousOverflow = document.body.style.overflow

    document.body.style.overflow = 'hidden'
    document.addEventListener('keydown', handleKeyDown)
    mobileViewport.addEventListener('change', handleViewportChange)

    return () => {
      document.body.style.overflow = previousOverflow
      document.removeEventListener('keydown', handleKeyDown)
      mobileViewport.removeEventListener('change', handleViewportChange)
    }
  }, [mobileMenuOpen])

  return (
    <>
      <div className="mobile-nav-bar">
        <img src={logo} alt="" className="logo" />
        <span>KT Finance</span>
        <button
          ref={menuToggleRef}
          className="mobile-menu-toggle"
          type="button"
          aria-label={mobileMenuOpen ? 'Tutup menu' : 'Buka menu'}
          aria-expanded={mobileMenuOpen}
          aria-controls="primary-navigation"
          onClick={() => mobileMenuOpen ? closeMobileMenu() : setMobileMenuOpen(true)}
        >
          {mobileMenuOpen ? (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="m6 6 12 12M18 6 6 18" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M4 7h16M4 12h16M4 17h16" />
            </svg>
          )}
        </button>
      </div>

      {mobileMenuOpen && (
        <button
          className="mobile-nav-backdrop"
          type="button"
          aria-label="Tutup menu navigasi"
          onClick={closeMobileMenu}
        />
      )}

      <aside className={`sidebar no-print${mobileMenuOpen ? ' mobile-menu-open' : ''}`}>
        <h2>
          <img src={logo} alt="Logo Karta Kencana RW 02" className="logo" />
          <span>KT Finance</span>
        </h2>

        <nav id="primary-navigation" aria-label="Navigasi utama">
          {visibleGroups.map((group) => (
            <div className="nav-group" key={group.label}>
              <div className="nav-group-label">{group.label}</div>
              {group.items.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  className={page === p.id ? 'active' : ''}
                  aria-current={page === p.id ? 'page' : undefined}
                  onClick={() => {
                    goTo(p.id)
                    closeMobileMenu()
                  }}
                >
                  <span className="nav-icon">{ICONS[p.id] || ICONS.laporan}</span>
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
          <button type="button" onClick={openTutorial}>Panduan</button>
          <button type="button" onClick={handleLogout}>
            Keluar
          </button>
        </div>
      </aside>
    </>
  )
}
