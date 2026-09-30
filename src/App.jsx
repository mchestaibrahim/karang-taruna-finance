import { useEffect, useState } from 'react'
import './dashboard.css'
import bg from './bg.jpg'
import { AuthShell, LoginScreen, NoRoleScreen } from './components/auth'
import { RejectDialog, VoidDialog } from './components/dialogs'
import { ChatAssistant } from './components/features/ChatAssistant'
import { DashboardPage } from './components/features/DashboardPage'
import { LogPage } from './components/features/LogPage'
import { LaporanPage } from './components/features/LaporanPage'
import { TransaksiPage } from './components/features/TransaksiPage'
import { AnggotaPage } from './components/features/AnggotaPage'
import { NyicilPage } from './components/features/NyicilPage'
import { DanusanPage } from './components/features/DanusanPage'
import { PemasukanPage } from './components/features/PemasukanPage'
import { PengeluaranPage } from './components/features/PengeluaranPage'
import { DataReportsPage } from './components/features/DataReportsPage'
import { Sidebar } from './components/layout/Sidebar'
import { Topbar } from './components/layout/Topbar'
import { useAuth } from './hooks/useAuth'
import { useFinanceController } from './hooks/useFinanceController'
import { rupiah } from './app/formatters'
import { DataReportDialog } from './components/DataReportDialog'
import { GuideDialog } from './components/GuideDialog'

/* ---------- Aplikasi ---------- */

function App() {
  const { session, authReady, role, roleError, userId, logout } = useAuth()
  const [page, setPage] = useState('dashboard')
  const [reportTarget, setReportTarget] = useState(null)
  const [guideOpen, setGuideOpen] = useState(false)

  useEffect(() => {
    if (!userId || !role) return
    const timer = window.setTimeout(() => {
      try {
        if (localStorage.getItem(`kt-finance-guide:${userId}`) !== 'done') setGuideOpen(true)
      } catch {
        setGuideOpen(true)
      }
    }, 0)
    return () => window.clearTimeout(timer)
  }, [userId, role])
  const {
    auditRows,
    auditLoading,
    auditError,
    loading,
    loadError,
    saving,
    canEdit,
    canApprove,
    dataReports,
    reportError,
    reportBusy,
    reportBusyId,
    submitDataReport,
    reviewDataReport,
    pendingExpenses,
    totalMasuk,
    totalKeluar,
    saldoBersih,
    totalPending,
    totalBati,
    vendorBelumDisetor,
    setorVendor,
    lunasCount,
    activeMembers,
    saldoKas,
    chartData,
    approveBusyId,
    approveExpense,
    askReject,
    askVoid,
    dashboardCategoryBreakdown,
    allTransactions,
    totalCollected,
    totalTarget,
    belumLunas,
    exportBackup,
    saveDanusan,
    danusanMember,
    setDanusanMember,
    danusanProof,
    setDanusanProof,
    danusanItems,
    updateItem,
    danusanResult,
    danusanTransactions,
    addPayment,
    nyicilMember,
    setNyicilMember,
    paymentAmount,
    setPaymentAmount,
    nyicilProof,
    setNyicilProof,
    nyicilTarget,
    payments,
    saveOtherIncome,
    incomeDate,
    setIncomeDate,
    incomeType,
    setIncomeType,
    incomeSource,
    setIncomeSource,
    incomeDesc,
    setIncomeDesc,
    incomeAmount,
    setIncomeAmount,
    carwashLabel,
    setCarwashLabel,
    carwashAmount,
    setCarwashAmount,
    carwashMembers,
    toggleCarwashMember,
    incomeProof,
    setIncomeProof,
    otherIncome,
    carwashAllocationsFor,
    saveExpense,
    expDate,
    setExpDate,
    expCategory,
    setExpCategory,
    expDesc,
    setExpDesc,
    expAmount,
    setExpAmount,
    expProof,
    setExpProof,
    handleAiScan,
    aiScanBusy,
    aiScanError,
    aiScanResult,
    setAiScanResult,
    applyAiScanResult,
    discardAiScanResult,
    possibleExpenseDuplicate,
    expenses,
    newName,
    setNewName,
    addMember,
    newTarget,
    setNewTarget,
    formError,
    editingId,
    search,
    setSearch,
    filteredStats,
    members,
    editName,
    setEditName,
    editTarget,
    setEditTarget,
    saveEdit,
    toggleActive,
    startEdit,
    setEditingId,
    setFormError,
    txSearch,
    setTxSearch,
    txMember,
    setTxMember,
    txType,
    setTxType,
    txStatus,
    setTxStatus,
    txSort,
    setTxSort,
    exportCsv,
    filteredTx,
    filteredMasuk,
    filteredKeluar,
    reportMonth,
    setReportMonth,
    copyReportSummary,
    reportMasuk,
    reportNyicilCount,
    reportDanusanCount,
    reportKeluar,
    reportBati,
    reportSaldo,
    reportByCategory,
    logSearch,
    setLogSearch,
    filteredAuditRows,
    nameOfMember,
    openProof,
    voidTarget,
    voidReason,
    setVoidReason,
    voidError,
    voidBusy,
    closeVoid,
    confirmVoid,
    rejectTarget,
    rejectReason,
    setRejectReason,
    rejectError,
    rejectBusy,
    closeReject,
    confirmReject,
    toast,
    chatAssistant,
    notifOpen,
    setNotifOpen,
    unreadNotifCount,
    notifications,
    readNotifIds,
    markAllNotifsRead,
    goTo,
    handleLogout,
  } = useFinanceController({ page, setPage, role, userId, logout })
  /* ---------- Tampilan utama ---------- */

  if (!authReady) {
    return (
      <AuthShell>
        <p className="auth-loading">Memuat...</p>
      </AuthShell>
    )
  }

  if (!session) {
    return <LoginScreen />
  }

  if (role === undefined) {
    return (
      <AuthShell>
        <p className="auth-loading">Memuat...</p>
      </AuthShell>
    )
  }

  if (role === null) {
    return (
      <NoRoleScreen
        email={session.user.email}
        message={
          roleError ||
          'Akun ini belum diberi peran. Minta bendahara menambahkannya di Supabase (tabel pengurus_roles), lalu masuk lagi.'
        }
        onLogout={handleLogout}
      />
    )
  }

  return (
    <div className="app" style={{ '--bg-image': `url(${bg})` }}>
      <Sidebar
        data={{ page, session, role, pendingExpenses, canApprove }}
        actions={{ goTo, handleLogout, openTutorial: () => setGuideOpen(true) }}
      />

      <main className="main">
        <Topbar
          data={{ page, session, role }}
          notificationPanel={{
            data: { notifOpen, unreadNotifCount, notifications, readNotifIds },
            actions: { setNotifOpen, markAllNotifsRead },
          }}
        />

        {loadError && (
          <p className="banner banner-error" role="alert">
            {loadError}
          </p>
        )}
        {loading && <p className="banner banner-info">Memuat data...</p>}
        {!canEdit && !canApprove && (
          <p className="banner banner-info">
            Mode lihat saja: akun ini tidak bisa menambah atau membatalkan catatan.
          </p>
        )}
        {canApprove && (
          <p className="banner banner-info">
            Mode verifikator: kamu bisa menyetujui/menolak pengeluaran, tapi
            tidak bisa mencatat transaksi baru.
          </p>
        )}

        {page === 'dashboard' && <DashboardPage
      totalMasuk={totalMasuk}
      totalKeluar={totalKeluar}
      saldoBersih={saldoBersih}
      totalPending={totalPending}
      pendingExpenses={pendingExpenses}
      totalBati={totalBati}
      vendorBelumDisetor={vendorBelumDisetor}
      setorVendor={setorVendor}
      lunasCount={lunasCount}
      activeMembers={activeMembers}
      saldoKas={saldoKas}
      chartData={chartData}
      canApprove={canApprove}
      approveBusyId={approveBusyId}
      approveExpense={approveExpense}
      askReject={askReject}
      dashboardCategoryBreakdown={dashboardCategoryBreakdown}
      allTransactions={allTransactions}
      totalCollected={totalCollected}
      totalTarget={totalTarget}
      belumLunas={belumLunas}
      exportBackup={exportBackup}
    />}
        {page === 'danusan' && <DanusanPage data={{ canEdit, saveDanusan, danusanMember, setDanusanMember, activeMembers, danusanProof, setDanusanProof, danusanItems, updateItem, danusanResult, saving, formError, danusanTransactions, nameOfMember, openProof, askVoid }} />}
        {page === 'nyicil' && <NyicilPage data={{ canEdit, addPayment, nyicilMember, setNyicilMember, activeMembers, paymentAmount, setPaymentAmount, nyicilProof, setNyicilProof, saving, nyicilTarget, formError, payments, nameOfMember, openProof, askVoid }} />}
        {page === 'pemasukan' && <PemasukanPage data={{ canEdit, saveOtherIncome, incomeDate, setIncomeDate, incomeType, setIncomeType, incomeSource, setIncomeSource, incomeDesc, setIncomeDesc, incomeAmount, setIncomeAmount, carwashLabel, setCarwashLabel, carwashAmount, setCarwashAmount, activeMembers, carwashMembers, toggleCarwashMember, incomeProof, setIncomeProof, saving, formError, otherIncome, carwashAllocationsFor, nameOfMember, openProof, askVoid }} />} 
        {page === 'pengeluaran' && <PengeluaranPage data={{ canEdit, saveExpense, expDate, setExpDate, expCategory, setExpCategory, expDesc, setExpDesc, expAmount, setExpAmount, expProof, setExpProof, handleAiScan, aiScanBusy, aiScanError, aiScanResult, setAiScanResult, applyAiScanResult, discardAiScanResult, possibleExpenseDuplicate, saving, formError, canApprove, pendingExpenses, approveBusyId, approveExpense, askReject, expenses, openProof, askVoid }} />}
        {page === 'anggota' && <AnggotaPage data={{ canEdit, canReport: role === 'member', onReport: setReportTarget, addMember, newName, setNewName, newTarget, setNewTarget, formError, editingId, search, setSearch, filteredStats, members, editName, setEditName, editTarget, setEditTarget, saveEdit, toggleActive, startEdit, setEditingId, setFormError }} />}
        {page === 'transaksi' && <TransaksiPage data={{ txSearch, setTxSearch, txMember, setTxMember, members, txType, setTxType, txStatus, setTxStatus, txSort, setTxSort, exportCsv, filteredTx, allTransactions, filteredMasuk, filteredKeluar, canEdit, canReport: role === 'member', askVoid, onReport: setReportTarget }} />}
        {page === 'laporan' && <LaporanPage data={{ reportMonth, setReportMonth, copyReportSummary, reportMasuk, reportNyicilCount, reportDanusanCount, reportKeluar, reportBati, reportSaldo, reportByCategory, belumLunas, vendorBelumDisetor }} />}
        {page === 'data-reports' && (role === 'member' || canEdit) && <DataReportsPage reports={dataReports} canEdit={canEdit} loading={loading} error={reportError} busyId={reportBusyId} onReview={reviewDataReport} />}
        {page === 'log' && <LogPage data={{ auditError, auditLoading, filteredAuditRows, auditRows, logSearch, setLogSearch, nameOfMember }} />}
      </main>

      {voidTarget && (
        <VoidDialog
          target={voidTarget}
          reason={voidReason}
          setReason={setVoidReason}
          error={voidError}
          busy={voidBusy}
          onCancel={closeVoid}
          onSubmit={confirmVoid}
        />
      )}

      {reportTarget && role === 'member' && (
        <DataReportDialog target={reportTarget} busy={reportBusy} error={reportError} onClose={() => setReportTarget(null)} onSubmit={async (report) => { if (await submitDataReport(report)) setReportTarget(null) }} />
      )}
      {guideOpen && (
        <GuideDialog role={role} onClose={() => {
          try { localStorage.setItem(`kt-finance-guide:${userId}`, 'done') } catch { /* storage may be disabled */ }
          setGuideOpen(false)
        }} />
      )}

      {rejectTarget && (
        <RejectDialog
          target={{
            label: `${rejectTarget.category}, ${rejectTarget.date}: ${rupiah(rejectTarget.amount)}`,
          }}
          reason={rejectReason}
          setReason={setRejectReason}
          error={rejectError}
          busy={rejectBusy}
          onCancel={closeReject}
          onSubmit={confirmReject}
        />
      )}

      {toast && (
        <div className="toast" role="status">
          {toast}
        </div>
      )}

      <ChatAssistant chat={chatAssistant} permissions={{ canEdit, canApprove }} />
    </div>
  )
}

export default App