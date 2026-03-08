'use client'

import { useState, useEffect } from 'react'
import { createBrowserClient } from '@supabase/ssr'

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

interface Profil {
  id: string
  nom: string
  projet: string
  zone: string
  priorite: string
  budget_max: number | null
  pieces_min: number | null
  jardin: boolean
  est_defaut: boolean
}

const EMPTY_PROFIL = {
  nom: '',
  projet: '',
  zone: '',
  priorite: '',
  budget_max: null as number | null,
  pieces_min: null as number | null,
  jardin: false,
  est_defaut: false,
}

function genererNom(p: typeof EMPTY_PROFIL): string {
  const parts = []
  if (p.zone === 'urbain') parts.push('Urbain')
  else if (p.zone === 'peri_urbain') parts.push('Péri-urbain')
  else if (p.zone === 'rural') parts.push('Rural')
  if (p.priorite === 'cle_en_main') parts.push('Clé en main')
  else if (p.priorite === 'a_renover') parts.push('À rénover')
  if (p.projet === 'residence_principale') parts.push('RP')
  else if (p.projet === 'investissement') parts.push('Invest')
  else if (p.projet === 'vacances') parts.push('Vacances')
  return parts.length > 0 ? parts.join(' · ') : 'Mon profil'
}

function completionPct(p: any): number {
  const fields = ['projet', 'zone', 'priorite', 'budget_max', 'pieces_min']
  const filled = fields.filter(f => p[f] !== null && p[f] !== '' && p[f] !== undefined).length
  return Math.round((filled / fields.length) * 100)
}

export default function ProfilPage() {
  const [profils, setProfils] = useState<Profil[]>([])
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)
  const [editing, setEditing] = useState<string | null>(null) // id ou 'new'
  const [form, setForm] = useState(EMPTY_PROFIL)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) { window.location.replace('/auth'); return }
      setUserId(session.user.id)
      chargerProfils()
    })
  }, [])

  async function chargerProfils() {
    const { data } = await supabase.from('profils').select('*').order('created_at')
    setProfils(data || [])
    setLoading(false)
  }

  function ouvrirNouveau() {
    setForm(EMPTY_PROFIL)
    setEditing('new')
  }

  function ouvrirEdition(p: Profil) {
    setForm({ nom: p.nom, projet: p.projet, zone: p.zone, priorite: p.priorite, budget_max: p.budget_max, pieces_min: p.pieces_min, jardin: p.jardin, est_defaut: p.est_defaut })
    setEditing(p.id)
  }

  function setF(key: string, val: any) {
    setForm(prev => {
      const updated = { ...prev, [key]: val }
      if (key !== 'nom') updated.nom = genererNom(updated)
      return updated
    })
  }

  async function sauvegarder() {
    if (!userId) return
    setSaving(true)

    const payload = { ...form, user_id: userId }

    if (editing === 'new') {
      // Si défaut, retirer défaut des autres
      if (form.est_defaut) {
        await supabase.from('profils').update({ est_defaut: false }).eq('user_id', userId)
      }
      await supabase.from('profils').insert(payload)
    } else {
      if (form.est_defaut) {
        await supabase.from('profils').update({ est_defaut: false }).eq('user_id', userId)
      }
      await supabase.from('profils').update(payload).eq('id', editing)
    }

    await chargerProfils()
    setEditing(null)
    setSaving(false)
  }

  async function supprimer(id: string) {
    await supabase.from('profils').delete().eq('id', id)
    await chargerProfils()
  }

  async function setDefaut(id: string) {
    await supabase.from('profils').update({ est_defaut: false }).eq('user_id', userId!)
    await supabase.from('profils').update({ est_defaut: true }).eq('id', id)
    await chargerProfils()
  }

  const pct = form ? completionPct(form) : 0

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;600;700&family=DM+Sans:wght@300;400;500&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #f5f2ed; font-family: 'DM Sans', sans-serif; min-height: 100vh; }
        .page { max-width: 780px; margin: 0 auto; padding: 48px 24px 80px; }
        .header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 40px; }
        .logo { font-family: 'Cormorant Garamond', serif; font-size: 36px; font-weight: 700; color: #1a1814; text-decoration: none; }
        .logo em { color: #8b6914; font-style: normal; }
        .nav { display: flex; gap: 8px; }
        .btn-nav { background: transparent; border: 1px solid #d9d2c7; border-radius: 8px; padding: 8px 16px; font-family: 'DM Sans', sans-serif; font-size: 12px; color: #8a7d6b; cursor: pointer; transition: all 0.2s; text-decoration: none; display: inline-block; }
        .btn-nav:hover { border-color: #8a7d6b; color: #1a1814; }
        .btn-primary { background: #1a1814; color: #f5f2ed; border: none; border-radius: 8px; padding: 9px 18px; font-family: 'DM Sans', sans-serif; font-size: 12px; font-weight: 500; cursor: pointer; transition: background 0.2s; text-decoration: none; display: inline-block; }
        .btn-primary:hover { background: #2d2a24; }
        .page-title { font-family: 'Cormorant Garamond', serif; font-size: 32px; font-weight: 600; color: #1a1814; margin-bottom: 4px; }
        .page-sub { font-size: 13px; color: #8a7d6b; font-weight: 300; margin-bottom: 28px; }

        /* Profil cards */
        .profils-grid { display: grid; gap: 12px; margin-bottom: 16px; }
        .profil-card { background: #fff; border: 1px solid #e8e2d9; border-radius: 14px; padding: 20px 22px; display: flex; align-items: center; gap: 16px; box-shadow: 0 1px 8px rgba(0,0,0,0.04); }
        .profil-card.defaut { border-color: #8b6914; }
        .profil-icon { width: 44px; height: 44px; border-radius: 10px; background: #faf8f5; border: 1px solid #e8e2d9; display: flex; align-items: center; justify-content: center; font-size: 20px; flex-shrink: 0; }
        .profil-info { flex: 1; }
        .profil-nom { font-size: 14px; font-weight: 500; color: #1a1814; margin-bottom: 4px; display: flex; align-items: center; gap: 8px; }
        .defaut-badge { font-size: 9px; font-weight: 500; letter-spacing: 0.08em; text-transform: uppercase; background: #fffbeb; color: #92400e; border: 1px solid #fde68a; border-radius: 4px; padding: 2px 7px; }
        .profil-tags { display: flex; flex-wrap: wrap; gap: 5px; }
        .tag { font-size: 10px; color: #8a7d6b; background: #f5f2ed; border-radius: 4px; padding: 2px 8px; }
        .profil-completion { margin-top: 8px; }
        .completion-bar-bg { height: 3px; background: #f0ebe3; border-radius: 2px; overflow: hidden; }
        .completion-bar-fill { height: 100%; border-radius: 2px; transition: width 0.3s; }
        .completion-label { font-size: 10px; color: #a09480; margin-top: 3px; }
        .profil-actions { display: flex; gap: 6px; flex-shrink: 0; }
        .btn-sm { padding: 6px 12px; border-radius: 7px; font-size: 11px; font-family: 'DM Sans', sans-serif; cursor: pointer; transition: all 0.15s; }
        .btn-edit { background: #faf8f5; border: 1px solid #e8e2d9; color: #4a4035; }
        .btn-edit:hover { background: #f0ebe3; }
        .btn-star { background: #fffbeb; border: 1px solid #fde68a; color: #92400e; }
        .btn-delete { background: #fef2f2; border: 1px solid #fecaca; color: #dc2626; }
        .btn-delete:hover { background: #fee2e2; }

        /* Form */
        .form-card { background: #fff; border: 1px solid #e8e2d9; border-radius: 14px; padding: 28px; box-shadow: 0 2px 16px rgba(0,0,0,0.06); margin-bottom: 16px; }
        .form-title { font-family: 'Cormorant Garamond', serif; font-size: 22px; font-weight: 600; color: #1a1814; margin-bottom: 4px; }
        .form-sub { font-size: 12px; color: #8a7d6b; margin-bottom: 24px; }
        .form-section { margin-bottom: 20px; }
        .label { display: block; font-size: 10px; font-weight: 500; letter-spacing: 0.12em; text-transform: uppercase; color: #8a7d6b; margin-bottom: 8px; }
        .chip-row { display: flex; flex-wrap: wrap; gap: 8px; }
        .chip { padding: 8px 16px; border-radius: 100px; border: 1.5px solid #e8e2d9; background: #faf8f5; font-size: 12px; font-weight: 500; cursor: pointer; transition: all 0.15s; color: #8a7d6b; }
        .chip:hover { border-color: #8b6914; color: #1a1814; }
        .chip.sel { border-color: #8b6914; background: #8b6914; color: #fff; }
        .input { width: 100%; background: #faf8f5; border: 1px solid #e8e2d9; border-radius: 8px; padding: 11px 14px; font-family: 'DM Sans', sans-serif; font-size: 14px; color: #1a1814; outline: none; transition: border-color 0.2s; }
        .input:focus { border-color: #8b6914; }
        .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        .nom-preview { background: #faf8f5; border: 1px solid #e8e2d9; border-radius: 8px; padding: 11px 14px; font-size: 14px; color: #1a1814; margin-bottom: 20px; }
        .nom-preview-label { font-size: 10px; color: #a09480; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 4px; }
        .nom-editable { width: 100%; background: transparent; border: none; font-family: 'DM Sans', sans-serif; font-size: 14px; color: #1a1814; outline: none; font-weight: 500; }

        /* Completion in form */
        .form-completion { background: #faf8f5; border: 1px solid #e8e2d9; border-radius: 10px; padding: 14px 16px; margin-bottom: 20px; }
        .form-completion-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
        .form-completion-label { font-size: 11px; color: #4a4035; font-weight: 500; }
        .form-completion-pct { font-size: 13px; font-weight: 600; }
        .completion-bar-bg2 { height: 6px; background: #e8e2d9; border-radius: 3px; overflow: hidden; }
        .completion-bar-fill2 { height: 100%; border-radius: 3px; transition: width 0.4s; }
        .completion-hint { font-size: 11px; color: #8a7d6b; margin-top: 6px; }

        .form-actions { display: flex; gap: 10px; justify-content: flex-end; margin-top: 8px; }
        .btn-cancel { background: transparent; border: 1px solid #d9d2c7; border-radius: 8px; padding: 10px 18px; font-family: 'DM Sans', sans-serif; font-size: 13px; color: #8a7d6b; cursor: pointer; }

        .empty { text-align: center; padding: 60px 24px; }
        .empty-icon { font-size: 36px; margin-bottom: 12px; }
        .empty-title { font-family: 'Cormorant Garamond', serif; font-size: 22px; color: #1a1814; margin-bottom: 6px; }
        .empty-sub { font-size: 13px; color: #8a7d6b; margin-bottom: 20px; }
      `}</style>

      <div className="page">
        <div className="header">
          <a href="/" className="logo">NID<em>O</em></a>
          <div className="nav">
            <a href="/" className="btn-nav">+ Analyse</a>
            <a href="/dashboard" className="btn-nav">Mes analyses</a>
            <button className="btn-nav" onClick={async () => { await supabase.auth.signOut(); window.location.replace('/auth') }}>Déconnexion</button>
          </div>
        </div>

        <div className="page-title">Mes profils</div>
        <div className="page-sub">Personnalisez le scoring selon votre projet immobilier</div>

        {/* Form nouveau/édition */}
        {editing && (
          <div className="form-card">
            <div className="form-title">{editing === 'new' ? 'Nouveau profil' : 'Modifier le profil'}</div>
            <div className="form-sub">Le nom est généré automatiquement — vous pouvez le personnaliser</div>

            {/* Complétion */}
            <div className="form-completion">
              <div className="form-completion-top">
                <span className="form-completion-label">
                  {pct < 40 ? '⚠ Profil incomplet — scores génériques' : pct < 80 ? '◑ Profil partiel — scores semi-personnalisés' : '✓ Profil complet — scores ultra-personnalisés'}
                </span>
                <span className="form-completion-pct" style={{ color: pct < 40 ? '#dc2626' : pct < 80 ? '#d97706' : '#16a34a' }}>{pct}%</span>
              </div>
              <div className="completion-bar-bg2">
                <div className="completion-bar-fill2" style={{ width: `${pct}%`, background: pct < 40 ? '#dc2626' : pct < 80 ? '#d97706' : '#16a34a' }} />
              </div>
              {pct < 100 && <div className="completion-hint">Complétez tous les champs pour des scores parfaitement calibrés sur votre projet</div>}
            </div>

            {/* Nom */}
            <div className="nom-preview">
              <div className="nom-preview-label">Nom du profil</div>
              <input className="nom-editable" value={form.nom} onChange={e => setForm(p => ({ ...p, nom: e.target.value }))} placeholder="Ex: Rural · Clé en main · RP" />
            </div>

            <div className="form-section">
              <label className="label">Projet</label>
              <div className="chip-row">
                {[['residence_principale', '🏠 Résidence principale'], ['investissement', '📈 Investissement locatif'], ['vacances', '🌿 Résidence secondaire']].map(([val, label]) => (
                  <button key={val} className={`chip ${form.projet === val ? 'sel' : ''}`} onClick={() => setF('projet', form.projet === val ? '' : val)}>{label}</button>
                ))}
              </div>
            </div>

            <div className="form-section">
              <label className="label">Zone souhaitée</label>
              <div className="chip-row">
                {[['urbain', '🏙 Urbain'], ['peri_urbain', '🏘 Péri-urbain'], ['rural', '🌾 Rural']].map(([val, label]) => (
                  <button key={val} className={`chip ${form.zone === val ? 'sel' : ''}`} onClick={() => setF('zone', form.zone === val ? '' : val)}>{label}</button>
                ))}
              </div>
            </div>

            <div className="form-section">
              <label className="label">Priorité</label>
              <div className="chip-row">
                {[['cle_en_main', '✓ Clé en main'], ['a_renover', '🔨 À rénover'], ['peu_importe', '↔ Peu importe']].map(([val, label]) => (
                  <button key={val} className={`chip ${form.priorite === val ? 'sel' : ''}`} onClick={() => setF('priorite', form.priorite === val ? '' : val)}>{label}</button>
                ))}
              </div>
            </div>

            <div className="grid-2" style={{ marginBottom: '20px' }}>
              <div>
                <label className="label">Budget maximum (€)</label>
                <input className="input" type="number" placeholder="350 000" value={form.budget_max || ''} onChange={e => setF('budget_max', e.target.value ? parseInt(e.target.value) : null)} />
              </div>
              <div>
                <label className="label">Nombre de pièces minimum</label>
                <input className="input" type="number" placeholder="4" value={form.pieces_min || ''} onChange={e => setF('pieces_min', e.target.value ? parseInt(e.target.value) : null)} />
              </div>
            </div>

            <div className="form-section">
              <label className="label">Jardin</label>
              <div className="chip-row">
                <button className={`chip ${form.jardin ? 'sel' : ''}`} onClick={() => setF('jardin', true)}>🌿 Jardin obligatoire</button>
                <button className={`chip ${!form.jardin ? 'sel' : ''}`} onClick={() => setF('jardin', false)}>Sans préférence</button>
              </div>
            </div>

            <div className="form-section">
              <label className="label">Profil par défaut</label>
              <div className="chip-row">
                <button className={`chip ${form.est_defaut ? 'sel' : ''}`} onClick={() => setF('est_defaut', !form.est_defaut)}>⭐ Utiliser par défaut</button>
              </div>
            </div>

            <div className="form-actions">
              <button className="btn-cancel" onClick={() => setEditing(null)}>Annuler</button>
              <button className="btn-primary" onClick={sauvegarder} disabled={saving}>
                {saving ? 'Sauvegarde…' : 'Sauvegarder le profil'}
              </button>
            </div>
          </div>
        )}

        {/* Liste des profils */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#a09480', fontSize: '13px' }}>Chargement…</div>
        ) : profils.length === 0 && !editing ? (
          <div className="empty">
            <div className="empty-icon">👤</div>
            <div className="empty-title">Aucun profil créé</div>
            <div className="empty-sub">Créez votre profil pour des scores personnalisés</div>
            <button className="btn-primary" onClick={ouvrirNouveau}>Créer mon premier profil</button>
          </div>
        ) : (
          <>
            <div className="profils-grid">
              {profils.map(p => {
                const pct = completionPct(p)
                return (
                  <div key={p.id} className={`profil-card ${p.est_defaut ? 'defaut' : ''}`}>
                    <div className="profil-icon">
                      {p.projet === 'investissement' ? '📈' : p.projet === 'vacances' ? '🌿' : '🏠'}
                    </div>
                    <div className="profil-info">
                      <div className="profil-nom">
                        {p.nom}
                        {p.est_defaut && <span className="defaut-badge">⭐ Défaut</span>}
                      </div>
                      <div className="profil-tags">
                        {p.zone && <span className="tag">{p.zone === 'urbain' ? '🏙 Urbain' : p.zone === 'peri_urbain' ? '🏘 Péri-urbain' : '🌾 Rural'}</span>}
                        {p.priorite && <span className="tag">{p.priorite === 'cle_en_main' ? '✓ Clé en main' : p.priorite === 'a_renover' ? '🔨 À rénover' : '↔ Flexible'}</span>}
                        {p.budget_max && <span className="tag">≤ {p.budget_max.toLocaleString('fr-FR')} €</span>}
                        {p.pieces_min && <span className="tag">≥ {p.pieces_min} pièces</span>}
                        {p.jardin && <span className="tag">🌿 Jardin</span>}
                      </div>
                      <div className="profil-completion">
                        <div className="completion-bar-bg">
                          <div className="completion-bar-fill" style={{ width: `${pct}%`, background: pct < 40 ? '#dc2626' : pct < 80 ? '#d97706' : '#16a34a' }} />
                        </div>
                        <div className="completion-label">{pct}% complet {pct < 100 ? '— complétez pour des scores parfaits' : '— scores ultra-personnalisés ✓'}</div>
                      </div>
                    </div>
                    <div className="profil-actions">
                      {!p.est_defaut && <button className="btn-sm btn-star" onClick={() => setDefaut(p.id)}>⭐</button>}
                      <button className="btn-sm btn-edit" onClick={() => ouvrirEdition(p)}>Modifier</button>
                      <button className="btn-sm btn-delete" onClick={() => supprimer(p.id)}>✕</button>
                    </div>
                  </div>
                )
              })}
            </div>
            {!editing && (
              <button className="btn-primary" onClick={ouvrirNouveau}>+ Nouveau profil</button>
            )}
          </>
        )}
      </div>
    </>
  )
}
