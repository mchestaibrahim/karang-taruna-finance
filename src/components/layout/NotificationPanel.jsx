import { formatDateTime } from '../../app/formatters'

export function NotificationPanel({ data, actions }) {
  const { notifOpen, unreadNotifCount, notifications, readNotifIds } = data
  const { setNotifOpen, markAllNotifsRead } = actions

  return (
    <div className="notif-wrap">
      <button
        type="button"
        className="bell-btn"
        aria-label="Notifikasi"
        onClick={() => setNotifOpen((v) => !v)}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M6 9a6 6 0 0 1 12 0c0 4 1.5 5.5 1.5 5.5H4.5S6 13 6 9Z" />
          <path d="M10 19a2 2 0 0 0 4 0" />
        </svg>
        {unreadNotifCount > 0 && <span className="bell-dot" />}
      </button>

      {notifOpen && (
        <div className="notif-panel">
          <div className="notif-panel-head">
            <h4>Notifikasi</h4>
            <div className="notif-panel-actions">
              {notifications.length > 0 && (
                <button type="button" className="notif-mark-read" onClick={markAllNotifsRead}>
                  Tandai semua sudah dibaca
                </button>
              )}
              <button type="button" className="notif-close" aria-label="Tutup notifikasi" onClick={() => setNotifOpen(false)}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18" /></svg>
              </button>
            </div>
          </div>
          <div className="notif-list">
            {notifications.length === 0 ? (
              <p className="notif-empty">Belum ada notifikasi.</p>
            ) : (
              notifications.map((n) => (
                <div
                  className={`notif-item${readNotifIds.has(n.id) ? '' : ' unread'}`}
                  key={n.id}
                >
                  <span className={`notif-icon ${n.group}`}>
                    {n.group === 'approval' ? '!' : n.group === 'transaksi' ? '$' : 'i'}
                  </span>
                  <div className="notif-body">
                    <p className="notif-title">{n.title}</p>
                    <p className="notif-desc">{n.desc}</p>
                    <p className="notif-time">{formatDateTime(n.sortTime)}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
