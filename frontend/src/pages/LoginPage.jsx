import React, { useState } from 'react'
import { useAuth } from '../context/AuthContext'

export default function LoginPage() {
  const { loginEmail, registerEmail, loginGoogle } = useAuth()
  const [mode, setMode]     = useState('login') // 'login' | 'register'
  const [error, setError]   = useState('')
  const [loading, setLoading] = useState(false)
  const [form, setForm]     = useState({ name: '', email: '', password: '' })

  const errMsg = (code) => ({
    'auth/wrong-password':     'Mot de passe incorrect.',
    'auth/user-not-found':     'Aucun compte avec cet email.',
    'auth/email-already-in-use': 'Email déjà utilisé.',
    'auth/weak-password':      'Mot de passe trop faible (min. 6 caractères).',
    'auth/invalid-email':      'Email invalide.',
    'auth/network-request-failed': 'Erreur réseau.',
  })[code] || `Erreur : ${code}`

  const handle = async (fn) => {
    setError(''); setLoading(true)
    try { await fn() }
    catch(e) { setError(errMsg(e.code)) }
    finally { setLoading(false) }
  }

  const inp = 'w-full bg-[#1a1a1a] border border-white/[0.07] text-white text-[15px] px-4 py-3 rounded-xl outline-none focus:border-[#00C896]/40 mb-3 block font-sans'
  const btn = (color) => `w-full ${color} text-black font-bold text-[15px] py-4 rounded-xl cursor-pointer mb-3 border-none font-sans disabled:opacity-50`

  return (
    <div className="fixed inset-0 bg-[#080808] flex flex-col items-center justify-center px-7 overflow-y-auto">
      <div className="text-4xl mb-5">₿</div>
      <h1 className="text-2xl font-extrabold mb-2 tracking-tight">BTC Signal Pro</h1>
      <p className="text-sm text-[#666] mb-8 text-center max-w-xs leading-relaxed">
        {mode === 'login'
          ? 'Connecte-toi pour synchroniser tes données sur tous tes appareils'
          : 'Crée ton compte gratuit pour commencer'}
      </p>

      <div className="w-full max-w-sm">
        {error && (
          <div className="bg-[#FF4D4D]/15 text-[#FF4D4D] rounded-xl px-4 py-3 text-sm mb-4">
            {error}
          </div>
        )}

        {mode === 'register' && (
          <input className={inp} placeholder="Ton prénom" value={form.name}
            onChange={e => setForm(p => ({...p, name: e.target.value}))} />
        )}
        <input className={inp} type="email" placeholder="Email" autoComplete="email"
          value={form.email} onChange={e => setForm(p => ({...p, email: e.target.value}))} />
        <input className={inp} type="password" placeholder="Mot de passe" autoComplete="current-password"
          value={form.password} onChange={e => setForm(p => ({...p, password: e.target.value}))} />

        {mode === 'login' ? (
          <button className={btn('bg-[#00C896]')} disabled={loading}
            onClick={() => handle(() => loginEmail(form.email, form.password))}>
            {loading ? 'Connexion...' : 'Se connecter'}
          </button>
        ) : (
          <button className={btn('bg-[#00C896]')} disabled={loading}
            onClick={() => handle(() => registerEmail(form.name, form.email, form.password))}>
            {loading ? 'Création...' : 'Créer mon compte'}
          </button>
        )}

        <div className="flex items-center gap-3 my-1 mb-3">
          <div className="flex-1 h-px bg-white/[0.07]" />
          <span className="text-xs text-[#666]">ou</span>
          <div className="flex-1 h-px bg-white/[0.07]" />
        </div>

        <button className="w-full bg-[#111] text-white border border-white/[0.07] font-semibold text-sm py-4 rounded-xl cursor-pointer mb-4 flex items-center justify-center gap-3 font-sans"
          onClick={() => handle(loginGoogle)} disabled={loading}>
          <GoogleIcon />
          Continuer avec Google
        </button>

        <p className="text-center text-sm text-[#666]">
          {mode === 'login' ? "Pas de compte ? " : "Déjà un compte ? "}
          <button className="text-[#00C896] font-semibold bg-none border-none cursor-pointer font-sans text-sm"
            onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError('') }}>
            {mode === 'login' ? 'Créer un compte' : 'Se connecter'}
          </button>
        </p>
      </div>
    </div>
  )
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" fill="#4285F4"/>
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
      <path d="M3.964 10.707A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.039l3.007-2.332z" fill="#FBBC05"/>
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.961L3.964 6.293C4.672 4.166 6.656 3.58 9 3.58z" fill="#EA4335"/>
    </svg>
  )
}
