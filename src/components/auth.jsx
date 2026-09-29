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

  return (
    <AuthShell>
      <div className="box box-compact auth-card">
        <img src={logo} alt="Logo Karta Kencana RW 02" className="auth-logo" />
        <h1>KT Finance</h1>
        <p>Masuk untuk pengurus Karang Taruna</p>
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
