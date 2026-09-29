import { PAGE_INFO, ROLE_LABEL } from '../../app/config'
import { currentMonthKey, greetingForNow, initialsFromEmail, monthLabel } from '../../app/formatters'
import { NotificationPanel } from './NotificationPanel'

export function Topbar({ data, notificationPanel }) {
  const { page, session, role } = data

  return (
    <div className="topbar no-print">
      <div className="topbar-greeting">
        <h1>
          {page === 'dashboard'
            ? greetingForNow(session.user.email.split('@')[0])
            : PAGE_INFO[page].title}
        </h1>
        <p>
          {page === 'dashboard'
            ? `Periode ${monthLabel(currentMonthKey())}`
            : PAGE_INFO[page].subtitle}
        </p>
      </div>

      <div className="topbar-right">
        <NotificationPanel data={notificationPanel.data} actions={notificationPanel.actions} />

        <div className="topbar-profile">
          <div className="topbar-avatar">{initialsFromEmail(session.user.email)}</div>
          <div className="topbar-profile-text">
            <div className="topbar-profile-name">{session.user.email}</div>
            <div className="topbar-profile-role">{ROLE_LABEL[role]}</div>
          </div>
        </div>
      </div>
    </div>
  )
}
