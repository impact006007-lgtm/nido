'use client'

import { useState } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function AuthPage() {
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [erreur, setErreur] = useState('')
  const [success, setSuccess] = useState('')

  const INVITATION_CODE = process.env.NEXT_PUBLIC_INVITATION_CODE || 'NIDO2026'

  async function handleSubmit() {
    setErreur('')
    setSuccess('')
    setLoading(true)

    try {
      if (mode === 'signup') {
        if (code !== INVITATION_CODE) {
          setErreur('Code d\'invitation invalide.')
          setLoading(false)
          return
        }
        const { error } = await supabase.auth.signUp({ email, password })
        if (error) throw error
        setSuccess('Compte créé ! Vérifiez votre email pour confirmer.')
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
        if (data.session) {
          await new Promise(r => setTimeout(r, 500))
          window.location.replace('/')
        }
      }
    } catch (e: any) {
      const msgs: Record<string, string> = {
        'Invalid login credentials': 'Email ou mot de passe incorrect.',
        'Email not confirmed': 'Confirmez votre email avant de vous connecter.',
        'User already registered': 'Cet email est déjà utilisé.',
        'Password should be at least 6 characters': 'Le mot de passe doit faire au moins 6 caractères.',
      }
      setErreur(msgs[e.message] || e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400&family=DM+Sans:wght@300;400;500&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #f5f2ed; font-family: 'DM Sans', sans-serif; min-height: 100vh; display: flex; align-items: center; justify-content: center; }
        .wrap { width: 100%; max-width: 420px; padding: 24px; }
        .logo { font-family: 'Cormorant Garamond', serif; font-size: 52px; font-weight: 700; color: #1a1814; text-align: center; line-height: 1; margin-bottom: 6px; }
        .logo em { color: #8b6914; font-style: normal; }
        .tagline { font-size: 11px; font-weight: 300; letter-spacing: 0.18em; text-transform: uppercase; color: #a09480; text-align: center; margin-bottom: 40px; }
        .card { background: #fff; border: 1px solid #e8e2d9; border-radius: 16px; padding: 32px; box-shadow: 0 2px 20px rgba(0,0,0,0.05); }
        .tabs { display: flex; margin-bottom: 28px; border-bottom: 1px solid #e8e2d9; }
        .tab { flex: 1; padding: 10px; text-align: center; font-size: 13px; font-weight: 500; color: #a09480; cursor: pointer; border-bottom: 2px solid transparent; transition: all 0.2s; margin-bottom: -1px; }
        .tab.active { color: #1a1814; border-bottom-color: #8b6914; }
        .label { display: block; font-size: 10px; font-weight: 500; letter-spacing: 0.12em; text-transform: uppercase; color: #8a7d6b; margin-bottom: 6px; }
        .input { width: 100%; background: #faf8f5; border: 1px solid #e8e2d9; border-radius: 8px; padding: 12px 14px; font-family: 'DM Sans', sans-serif; font-size: 14px; color: #1a1814; outline: none; transition: border-color 0.2s; margin-bottom: 16px; }
        .input:focus { border-color: #8b6914; }
        .input::placeholder { color: #c4b99a; }
        .btn { width: 100%; background: #1a1814; color: #f5f2ed; border: none; border-radius: 9px; padding: 13px; font-family: 'DM Sans', sans-serif; font-size: 14px; font-weight: 500; cursor: pointer; transition: all 0.2s; margin-top: 4px; }
        .btn:hover { background: #2d2a24; }
        .btn:disabled { opacity: 0.4; cursor: not-allowed; }
        .erreur { background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 10px 14px; font-size: 13px; color: #dc2626; margin-bottom: 16px; }
        .success { background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 10px 14px; font-size: 13px; color: #16a34a; margin-bottom: 16px; }
        .hint { font-size: 12px; color: #a09480; text-align: center; margin-top: 16px; line-height: 1.6; }
        .hint em { font-style: normal; color: #8b6914; }
      `}</style>

      <div className="wrap">
        <div className="logo">NID<em>O</em></div>
        <div className="tagline">Analyse immobilière par IA</div>

        <div className="card">
          <div className="tabs">
            <div className={`tab ${mode === 'login' ? 'active' : ''}`} onClick={() => { setMode('login'); setErreur(''); setSuccess('') }}>
              Connexion
            </div>
            <div className={`tab ${mode === 'signup' ? 'active' : ''}`} onClick={() => { setMode('signup'); setErreur(''); setSuccess('') }}>
              Inscription
            </div>
          </div>

          {erreur && <div className="erreur">{erreur}</div>}
          {success && <div className="success">{success}</div>}

          <label className="label">Email</label>
          <input className="input" type="email" placeholder="vous@email.com" value={email} onChange={e => setEmail(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSubmit()} />

          <label className="label">Mot de passe</label>
          <input className="input" type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSubmit()} />

          {mode === 'signup' && (
            <>
              <label className="label">Code d'invitation</label>
              <input className="input" type="text" placeholder="XXXX0000" value={code} onChange={e => setCode(e.target.value.toUpperCase())} onKeyDown={e => e.key === 'Enter' && handleSubmit()} />
            </>
          )}

          <button className="btn" disabled={loading || !email || !password} onClick={handleSubmit}>
            {loading ? '…' : mode === 'login' ? 'Se connecter' : 'Créer mon compte'}
          </button>

          {mode === 'signup' && (
            <div className="hint">Vous avez besoin d'un code d'invitation.<br />Contactez-nous sur <em>contact@nido.immo</em></div>
          )}
        </div>
      </div>
    </>
  )
}
