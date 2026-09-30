import { useState } from 'react'
import logo from '../logo.png'
import bg from '../bg.jpg'
import { supabase } from '../lib/supabaseClient'
import { FormError } from './ui'

export function AuthShell({ children }) {
  return (
    <div className="auth-screen" style={{ '--bg-image': `url(${bg})` }}>
      {children}
    </div>
  )
}

export function LoginScreen() {
  const [registerOpen, setRegisterOpen] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    if (!email.trim() || !password) return setError('Isi email dan password.')

    setBusy(true)
    setError('')
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    })
    setBusy(false)

    if (signInError) {
      setError(
        signInError.status === 400
          ? 'Email atau password salah.'
          : 'Gagal masuk. Periksa koneksi internet lalu coba lagi.'
      )
    }
  }

  if (registerOpen) return <RegisterScreen onBack={() => setRegisterOpen(false)} />

  return (
    <AuthShell>
      <div className="box box-compact auth-card">
        <img src={logo} alt="Logo Karta Kencana RW 02" className="auth-logo" />
        <h1>KT Finance</h1>
        <p>Masuk untuk memantau keuangan Karang Taruna</p>
        <form onSubmit={handleSubmit} noValidate>
          <label className="field">
            <span>Email</span>
            <input className="input" type="email" autoComplete="username" placeholder="bendahara@contoh.com" value={email} onChange={(event) => setEmail(event.target.value)} />
          </label>
          <label className="field">
            <span>Password</span>
            <input className="input" type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} />
          </label>
          <FormError message={error} />
          <button type="submit" className="btn btn-primary auth-submit" disabled={busy}>
            {busy ? 'Masuk...' : 'Masuk'}
          </button>
        </form>
        <p className="auth-switch">Belum punya akun? <button type="button" onClick={() => setRegisterOpen(true)}>Daftar sebagai member</button></p>
      </div>
    </AuthShell>
  )
}

function RegisterScreen({ onBack }) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [busy, setBusy] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    if (!name.trim() || !email.trim() || !password || !confirmation) {
      return setError('Lengkapi semua field terlebih dahulu.')
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      return setError('Masukkan alamat email yang valid.')
    }
    if (password.length < 8) return setError('Password minimal 8 karakter.')
    if (password !== confirmation) return setError('Konfirmasi password tidak sama.')

    setBusy(true)
    const { error: signUpError } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: { data: { full_name: name.trim() } },
    })
    setBusy(false)

    if (signUpError) {
      const message = signUpError.message.toLowerCase()
      if (/already registered|already exists|user exists/i.test(message)) {
        setError('Gmail ini sudah digunakan. Masuk dengan akun tersebut atau gunakan Gmail lain.')
      } else if (/password.*(weak|short|character)|should be at least/i.test(message)) {
        setError('Password belum memenuhi aturan keamanan Supabase.')
      } else if (/rate limit|too many requests/i.test(message)) {
        setError('Terlalu banyak percobaan. Tunggu sebentar lalu coba lagi.')
      } else if (/member.*(not found|not registered|already linked)|no matching member/i.test(message)) {
        setError('Nama tidak ditemukan atau anggota sudah memiliki akun. Gunakan nama anggota yang terdaftar dan belum terhubung.')
      } else if (/database error saving new user/i.test(message)) {
        setError('Database menolak pendaftaran. Pastikan nama cocok dengan anggota aktif yang belum memiliki akun dan migration MEMBER sudah diterapkan.')
      } else {
        setError(`Registrasi gagal: ${signUpError.message}`)
      }
      return
    }
    setSuccess(true)
  }

  return (
    <AuthShell>
      <div className="box box-compact auth-card">
        <img src={logo} alt="Logo Karta Kencana RW 02" className="auth-logo" />
        <h1>Daftar Member</h1>
        {success ? (
          <>
            <p role="status" className="auth-success">Registrasi berhasil. Periksa email untuk verifikasi, lalu masuk. Akun baru mendapat akses Member.</p>
            <button type="button" className="btn btn-primary auth-submit" onClick={onBack}>Kembali ke login</button>
          </>
        ) : (
          <>
            <p>Akun baru hanya mendapat akses baca sebagai Member.</p>
            <form onSubmit={handleSubmit} noValidate>
              <label className="field"><span>Nama anggota</span><input className="input" autoComplete="name" placeholder="Sesuai nama di Daftar Anggota" value={name} onChange={(event) => setName(event.target.value)} /></label>
              <label className="field"><span>Email</span><input className="input" type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} /></label>
              <label className="field"><span>Password</span><input className="input" type="password" autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} /></label>
              <label className="field"><span>Konfirmasi password</span><input className="input" type="password" autoComplete="new-password" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} /></label>
              <FormError message={error} />
              <button type="submit" className="btn btn-primary auth-submit" disabled={busy}>{busy ? 'Mendaftar...' : 'Daftar'}</button>
            </form>
            <p className="auth-switch">Sudah punya akun? <button type="button" onClick={onBack}>Masuk</button></p>
          </>
        )}
      </div>
    </AuthShell>
  )
}

export function NoRoleScreen({ email, message, onLogout }) {
  return (
    <AuthShell>
      <div className="box box-compact auth-card">
        <img src={logo} alt="Logo Karta Kencana RW 02" className="auth-logo" />
        <h1>Akses belum tersedia</h1>
        <p>{email}</p>
        <p className="auth-message">{message}</p>
        <button type="button" className="btn btn-ghost auth-submit" onClick={onLogout}>Keluar</button>
      </div>
    </AuthShell>
  )
}
