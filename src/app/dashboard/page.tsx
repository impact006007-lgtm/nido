'use client'

import { useState, useEffect } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { genererPDF } from '@/lib/NidoPDF'

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function Dashboard() {
  const [analyses, setAnalyses] = useState<any[]>([])
  const [profils, setProfils] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<any>(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) { window.location.replace('/auth'); return }
      chargerAnalyses(session.user.id)
      supabase.from('profils').select('*').then(({ data }) => setProfils(data || []))
    })
  }, [])

  async function chargerAnalyses(userId: string) {
    const { data } = await supabase
      .from('analyses')
      .select('id, created_at, ville, type_bien, prix, surface, score_global, decision, verdict_resume, rapport_complet')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50)
    setAnalyses(data || [])
    setLoading(false)
  }

  async function telechargerPDF(a: any) {
    const { genererPDF } = await import('@/lib/NidoPDF')
    await genererPDF(a.rapport_complet, a.ville, a.type_bien)
  }

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
  }

  const decisionColor = (d: string) => d === 'ACHETER' ? '#16a34a' : d === 'FUIR' ? '#dc2626' : '#d97706'
  const decisionBg = (d: string) => d === 'ACHETER' ? '#f0fdf4' : d === 'FUIR' ? '#fef2f2' : '#fffbeb'
  const scoreColor = (s: number) => s >= 7 ? '#16a34a' : s >= 5 ? '#d97706' : '#dc2626'

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;600;700&family=DM+Sans:wght@300;400;500&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #f5f2ed; font-family: 'DM Sans', sans-serif; min-height: 100vh; }
        .page { max-width: 1000px; margin: 0 auto; padding: 48px 24px 80px; }
        .header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 40px; }
        .logo { font-family: 'Cormorant Garamond', serif; font-size: 36px; font-weight: 700; color: #1a1814; }
        .logo em { color: #8b6914; font-style: normal; }
        .nav { display: flex; gap: 10px; align-items: center; }
        .btn-nav { background: transparent; border: 1px solid #d9d2c7; border-radius: 8px; padding: 8px 16px; font-family: 'DM Sans', sans-serif; font-size: 12px; color: #8a7d6b; cursor: pointer; transition: all 0.2s; text-decoration: none; display: inline-block; }
        .btn-nav:hover { border-color: #8a7d6b; color: #1a1814; }
        .btn-primary { background: #1a1814; color: #f5f2ed; border: none; border-radius: 8px; padding: 9px 18px; font-family: 'DM Sans', sans-serif; font-size: 12px; font-weight: 500; cursor: pointer; transition: all 0.2s; text-decoration: none; display: inline-block; }
        .btn-primary:hover { background: #2d2a24; }
        .page-title { font-family: 'Cormorant Garamond', serif; font-size: 32px; font-weight: 600; color: #1a1814; margin-bottom: 6px; }
        .page-sub { font-size: 13px; color: #8a7d6b; font-weight: 300; margin-bottom: 32px; }
        .empty { text-align: center; padding: 80px 24px; }
        .empty-icon { font-size: 40px; margin-bottom: 16px; }
        .empty-title { font-family: 'Cormorant Garamond', serif; font-size: 24px; color: #1a1814; margin-bottom: 8px; }
        .empty-sub { font-size: 13px; color: #8a7d6b; margin-bottom: 24px; }
        .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 14px; }
        .card { background: #fff; border: 1px solid #e8e2d9; border-radius: 14px; overflow: hidden; box-shadow: 0 1px 10px rgba(0,0,0,0.04); transition: all 0.2s; cursor: pointer; }
        .card:hover { box-shadow: 0 4px 20px rgba(0,0,0,0.08); transform: translateY(-2px); border-color: #d4c9b8; }
        .card-verdict { padding: 16px 18px 12px; display: flex; align-items: center; justify-content: space-between; }
        .decision-badge { font-size: 10px; font-weight: 500; letter-spacing: 0.1em; text-transform: uppercase; padding: 4px 10px; border-radius: 5px; }
        .score-badge { font-family: 'Cormorant Garamond', serif; font-size: 24px; font-weight: 700; line-height: 1; }
        .score-denom { font-size: 10px; color: #c4b99a; }
        .card-body { padding: 0 18px 16px; }
        .card-ville { font-size: 14px; font-weight: 500; color: #1a1814; margin-bottom: 3px; }
        .card-meta { font-size: 11px; color: #a09480; margin-bottom: 10px; }
        .card-resume { font-size: 12px; color: #6b5c3e; line-height: 1.55; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; margin-bottom: 12px; font-style: italic; }
        .card-actions { display: flex; gap: 8px; }
        .card-btn { flex: 1; padding: 7px; border-radius: 7px; font-family: 'DM Sans', sans-serif; font-size: 11px; font-weight: 500; cursor: pointer; transition: all 0.15s; text-align: center; }
        .card-btn-voir { background: #faf8f5; border: 1px solid #e8e2d9; color: #4a4035; }
        .card-btn-voir:hover { background: #f0ebe3; }
        .card-btn-pdf { background: #1a1814; border: 1px solid #1a1814; color: #f5f2ed; }
        .card-btn-pdf:hover { background: #2d2a24; }
        .card-date { font-size: 10px; color: #c4b99a; text-align: right; padding: 0 18px 12px; }
        .loading { text-align: center; padding: 80px; color: #a09480; font-size: 13px; }

        /* Modal rapport */
        .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 100; display: flex; align-items: flex-start; justify-content: center; padding: 24px; overflow-y: auto; }
        .modal { background: #f5f2ed; border-radius: 16px; width: 100%; max-width: 820px; padding: 32px; position: relative; margin: auto; }
        .modal-close { position: absolute; top: 16px; right: 16px; background: #fff; border: 1px solid #e8e2d9; border-radius: 8px; padding: 6px 12px; font-size: 12px; color: #8a7d6b; cursor: pointer; font-family: 'DM Sans', sans-serif; }
        .modal-close:hover { color: #1a1814; }

        @media (max-width: 640px) { .grid { grid-template-columns: 1fr; } }
      `}</style>

      <div className="page">
        <div className="header">
          <div className="logo">NID<em>O</em></div>
          <div className="nav">
            <a className="btn-primary" href="/">+ Nouvelle analyse</a>
            <a className="btn-nav" href="/profil">Mes profils</a>
            <button className="btn-nav" onClick={async () => { await supabase.auth.signOut(); window.location.replace('/auth') }}>Déconnexion</button>
          </div>
        </div>

        <div className="page-title">Mes analyses</div>
        <div className="page-sub">{analyses.length} analyse{analyses.length > 1 ? 's' : ''} enregistrée{analyses.length > 1 ? 's' : ''}</div>

        {/* Bannière gamification profil */}
        {profils.length === 0 ? (
          <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '12px', padding: '16px 20px', marginBottom: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
            <div>
              <div style={{ fontSize: '13px', fontWeight: 500, color: '#92400e', marginBottom: '3px' }}>⭐ Vos scores sont génériques</div>
              <div style={{ fontSize: '12px', color: '#a07840' }}>Créez votre profil pour des scores personnalisés selon votre projet</div>
            </div>
            <a href="/profil" style={{ background: '#8b6914', color: '#fff', borderRadius: '8px', padding: '9px 18px', fontSize: '12px', fontWeight: 500, textDecoration: 'none', whiteSpace: 'nowrap' }}>Créer mon profil →</a>
          </div>
        ) : profils.some(p => {
          const fields = ['projet', 'zone', 'priorite', 'budget_max', 'pieces_min']
          return fields.filter(f => p[f] !== null && p[f] !== '' && p[f] !== undefined).length < 5
        }) ? (
          <div style={{ background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: '12px', padding: '16px 20px', marginBottom: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
            <div>
              <div style={{ fontSize: '13px', fontWeight: 500, color: '#0369a1', marginBottom: '3px' }}>◑ Profil incomplet — scores semi-personnalisés</div>
              <div style={{ fontSize: '12px', color: '#0284c7' }}>Complétez votre profil pour des scores ultra-précis</div>
            </div>
            <a href="/profil" style={{ background: '#0369a1', color: '#fff', borderRadius: '8px', padding: '9px 18px', fontSize: '12px', fontWeight: 500, textDecoration: 'none', whiteSpace: 'nowrap' }}>Compléter →</a>
          </div>
        ) : (
          <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '12px', padding: '14px 20px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '16px' }}>✓</span>
            <div style={{ fontSize: '13px', color: '#16a34a', fontWeight: 500 }}>Profil complet — vos scores sont ultra-personnalisés</div>
            <a href="/profil" style={{ marginLeft: 'auto', fontSize: '11px', color: '#16a34a', textDecoration: 'underline' }}>Gérer mes profils</a>
          </div>
        )}

        {loading ? (
          <div className="loading">Chargement…</div>
        ) : analyses.length === 0 ? (
          <div className="empty">
            <div className="empty-icon">🏠</div>
            <div className="empty-title">Aucune analyse pour l'instant</div>
            <div className="empty-sub">Lancez votre première analyse immobilière</div>
            <a className="btn-primary" href="/">Analyser un bien →</a>
          </div>
        ) : (
          <div className="grid">
            {analyses.map(a => (
              <div key={a.id} className="card">
                <div className="card-verdict" style={{ backgroundColor: decisionBg(a.decision) }}>
                  <span className="decision-badge" style={{ backgroundColor: `${decisionColor(a.decision)}18`, color: decisionColor(a.decision) }}>
                    {a.decision === 'ACHETER' ? '✓ ' : a.decision === 'FUIR' ? '✕ ' : '~ '}{a.decision}
                  </span>
                  <span className="score-badge" style={{ color: scoreColor(a.score_global) }}>
                    {a.score_global}<span className="score-denom">/10</span>
                  </span>
                </div>
                <div className="card-body">
                  <div className="card-ville">{a.ville || 'Localisation non renseignée'}</div>
                  <div className="card-meta">
                    {a.type_bien && `${a.type_bien} · `}
                    {a.prix && `${Math.round(a.prix).toLocaleString('fr-FR')} € `}
                    {a.surface && `· ${a.surface} m²`}
                  </div>
                  {a.verdict_resume && <div className="card-resume">« {a.verdict_resume} »</div>}
                  <div className="card-actions">
                    <button className="card-btn card-btn-voir" onClick={() => setSelected(a)}>Voir le rapport</button>
                    <button className="card-btn card-btn-pdf" onClick={() => telechargerPDF(a)}>↓ PDF</button>
                  </div>
                </div>
                <div className="card-date">{formatDate(a.created_at)}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal rapport */}
      {selected && (
        <div className="modal-overlay" onClick={() => setSelected(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setSelected(null)}>✕ Fermer</button>
            <RapportModal data={selected.rapport_complet} ville={selected.ville} typeBien={selected.type_bien} onPDF={() => telechargerPDF(selected)} />
          </div>
        </div>
      )}
    </>
  )
}

// Rapport simplifié pour la modal — réutilise les mêmes styles visuels
function RapportModal({ data, ville, typeBien, onPDF }: { data: any, ville: string, typeBien: string, onPDF: () => void }) {
  if (!data) return <div style={{ padding: '40px', textAlign: 'center', color: '#a09480' }}>Rapport non disponible</div>

  const v = data.verdict
  const decision = v?.decision || 'NÉGOCIER'
  const cls = decision === 'ACHETER' ? '#052e16' : decision === 'FUIR' ? '#1f0505' : '#1c1003'
  const scoreColor = (s: number) => s >= 7 ? '#16a34a' : s >= 5 ? '#d97706' : '#dc2626'

  return (
    <div>
      {/* Verdict hero */}
      <div style={{ background: cls, borderRadius: '14px', padding: '28px', marginBottom: '16px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px', flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontSize: '10px', letterSpacing: '0.12em', textTransform: 'uppercase', color: decision === 'ACHETER' ? '#4ade80' : decision === 'FUIR' ? '#f87171' : '#fbbf24', marginBottom: '8px', fontWeight: 500 }}>
              {decision === 'ACHETER' ? '✓ ' : decision === 'FUIR' ? '✕ ' : '~ '}{decision}
            </div>
            {v?.prix_recommande && <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '40px', fontWeight: 700, color: '#fff', lineHeight: 1 }}>{v.prix_recommande.toLocaleString('fr-FR')} €</div>}
          </div>
          {data.scores && (
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '48px', fontWeight: 700, color: '#fff', lineHeight: 1 }}>
                {data.scores.global}<span style={{ fontSize: '16px', color: '#8b6914' }}>/10</span>
              </div>
            </div>
          )}
        </div>
        {v?.resume && <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.65)', lineHeight: 1.7, marginTop: '14px', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '14px' }}>{v.resume}</div>}
      </div>

      {/* Scores */}
      {data.scores && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', marginBottom: '12px' }}>
          {[['État bâti', 'etat_bati'], ['Qualité/Prix', 'rapport_qualite_prix'], ['Potentiel', 'potentiel'], ['DPE', 'dpe']].map(([label, key]) => (
            <div key={key} style={{ background: '#fff', border: '1px solid #e8e2d9', borderRadius: '10px', padding: '12px', textAlign: 'center' }}>
              <div style={{ fontSize: '9px', color: '#a09480', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '4px' }}>{label}</div>
              <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '28px', fontWeight: 700, color: scoreColor(data.scores[key as string]), lineHeight: 1 }}>
                {data.scores[key as string]}<span style={{ fontSize: '11px', color: '#c4b99a' }}>/10</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Alertes */}
      {data.alertes?.length > 0 && (
        <div style={{ background: '#fff', border: '1px solid #e8e2d9', borderRadius: '12px', marginBottom: '10px', overflow: 'hidden' }}>
          <div style={{ padding: '14px 18px 10px', borderBottom: '1px solid #f5f2ed' }}>
            <span style={{ fontSize: '9px', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#dc2626' }}>Alertes prioritaires</span>
          </div>
          <div style={{ padding: '10px 18px 14px' }}>
            {data.alertes.map((a: any, i: number) => (
              <div key={i} style={{ display: 'flex', gap: '10px', padding: '7px 0', borderBottom: i < data.alertes.length - 1 ? '1px solid #f8f5f0' : 'none' }}>
                <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: a.niveau === 'rouge' ? '#dc2626' : a.niveau === 'orange' ? '#f97316' : '#16a34a', marginTop: '5px', flexShrink: 0 }} />
                <div style={{ fontSize: '11px', color: '#a09480', textTransform: 'uppercase', letterSpacing: '0.05em', minWidth: '100px', flexShrink: 0 }}>{a.categorie}</div>
                <div style={{ fontSize: '12px', color: '#2d2a24', lineHeight: 1.5 }}>{a.observation}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Budget résumé */}
      {data.budget && (
        <div style={{ background: '#fff', border: '1px solid #e8e2d9', borderRadius: '12px', padding: '14px 18px', marginBottom: '10px' }}>
          <div style={{ fontSize: '9px', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#92400e', marginBottom: '10px' }}>Budget total réel</div>
          <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '28px', fontWeight: 700, color: '#1a1814' }}>
            {data.budget.total_min?.toLocaleString('fr-FR')} € <span style={{ color: '#c4b99a', fontSize: '16px' }}>—</span> {data.budget.total_max?.toLocaleString('fr-FR')} €
          </div>
        </div>
      )}

      <div style={{ textAlign: 'center', marginTop: '20px' }}>
        <button onClick={onPDF} style={{ background: '#1a1814', color: '#f5f2ed', border: 'none', borderRadius: '9px', padding: '12px 24px', fontFamily: 'DM Sans, sans-serif', fontSize: '13px', fontWeight: 500, cursor: 'pointer' }}>
          ↓ Télécharger le rapport PDF complet
        </button>
      </div>
    </div>
  )
}
