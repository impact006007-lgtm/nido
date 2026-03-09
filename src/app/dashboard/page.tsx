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
  const [selectedOnglet, setSelectedOnglet] = useState<'avant' | 'apres'>('avant')
  const [onglet, setOnglet] = useState<'avant' | 'apres'>('avant')
  const [uploadModal, setUploadModal] = useState<any>(null)
  const [uploadDocs, setUploadDocs] = useState<any[]>([]) // docs en attente d'upload
  const [docsExistants, setDocsExistants] = useState<any[]>([]) // docs déjà uploadés
  const [uploading, setUploading] = useState(false)
  const [uploadResult, setUploadResult] = useState<any>(null)
  const [nbAnalyses, setNbAnalyses] = useState(0) // compteur analyses docs
  const [docsModifies, setDocsModifies] = useState(false) // garde-fou relance
  const [showHistorique, setShowHistorique] = useState(false)
  const [historiqueAnalyses, setHistoriqueAnalyses] = useState<any[]>([])

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
      .select('id, created_at, ville, type_bien, prix, surface, score_global, decision, verdict_resume, rapport_complet, analyse_complementaire, has_docs, statut_visite')
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

  async function supprimerAnalyse(id: string) {
    if (!confirm('Supprimer cette analyse ?')) return
    await supabase.from('analyses').delete().eq('id', id)
    setAnalyses(prev => prev.filter(a => a.id !== id))
  }

  async function basculerStatut(id: string, statut: 'avant_visite' | 'apres_visite') {
    await supabase.from('analyses').update({ statut_visite: statut }).eq('id', id)
    setAnalyses(prev => prev.map(a => a.id === id ? { ...a, statut_visite: statut } : a))
  }

  function ouvrirUpload(a: any) {
    setUploadModal(a)
    setUploadDocs([])
    setUploadResult(null)
    setDocsModifies(false)
    setShowHistorique(false)
    // Charger les docs existants et le compteur
    supabase.from('documents').select('*').eq('analyse_id', a.id).order('created_at', { ascending: false })
      .then(({ data }) => {
        // Garder uniquement le dernier doc de chaque type
        const dernierParType: any = {}
        ;(data || []).forEach((d: any) => { if (!dernierParType[d.type]) dernierParType[d.type] = d })
        setDocsExistants(Object.values(dernierParType))
      })
    // Compter nb d'analyses déjà faites
    supabase.from('documents').select('id', { count: 'exact' }).eq('analyse_id', a.id)
      .then(({ count }) => setNbAnalyses(Math.floor((count || 0) / 1)))
    // Charger historique analyses
    supabase.from('analyses_docs_historique').select('*').eq('analyse_id', a.id).order('created_at', { ascending: false })
      .then(({ data }) => setHistoriqueAnalyses(data || []))
  }

  async function resetDoc(type: string) {
    // Supprimer du storage et de la DB
    const doc = docsExistants.find(d => d.type === type)
    if (doc?.storage_path) await supabase.storage.from('documents').remove([doc.storage_path])
    if (doc?.id) await supabase.from('documents').delete().eq('id', doc.id)
    setDocsExistants(prev => prev.filter(d => d.type !== type))
    setUploadDocs(prev => prev.filter(d => d.type !== type))
    setDocsModifies(true)
  }

  async function ajouterDoc(file: File, type: string) {
    const base64 = await new Promise<string>((res, rej) => {
      const r = new FileReader()
      r.onload = () => res((r.result as string).split(',')[1])
      r.onerror = () => rej(new Error('Lecture échouée'))
      r.readAsDataURL(file)
    })
    // Remplace si déjà un doc de ce type en attente
    setUploadDocs(prev => {
      const filtered = prev.filter(d => d.type !== type)
      return [...filtered, {
        type, nom_fichier: file.name, base64, media_type: file.type,
        storage_path: `${uploadModal.id}/${type}_${Date.now()}_${file.name}`
      }]
    })
    setDocsModifies(true)
  }

  async function analyserDocs() {
    if (!uploadModal || uploadDocs.length === 0) return
    if (nbAnalyses >= 3) { alert('Limite de 3 analyses atteinte pour ce bien.'); return }
    setUploading(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token || ''

      for (const doc of uploadDocs) {
        const bytes = Uint8Array.from(atob(doc.base64), c => c.charCodeAt(0))
        await supabase.storage.from('documents').upload(doc.storage_path, bytes, { contentType: doc.media_type, upsert: true })
      }

      const res = await fetch('/api/analyser-docs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ analyse_id: uploadModal.id, documents: uploadDocs })
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)

      setUploadResult(data.analyseComplementaire)
      setNbAnalyses(prev => prev + 1)
      setDocsModifies(false)

      // Sauvegarder dans historique
      await supabase.from('analyses_docs_historique').insert({
        analyse_id: uploadModal.id,
        user_id: session?.user.id,
        analyse_complementaire: data.analyseComplementaire,
        nb_docs: uploadDocs.length
      })

      setAnalyses(prev => prev.map(a => a.id === uploadModal.id ? {
        ...a,
        score_global: data.analyseComplementaire.score_revise,
        decision: data.analyseComplementaire.verdict_revise?.decision,
        verdict_resume: data.analyseComplementaire.verdict_revise?.resume,
        analyse_complementaire: data.analyseComplementaire,
        has_docs: true
      } : a))

    } catch (e: any) { alert('Erreur : ' + e.message) }
    setUploading(false)
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
        .card-btn-delete { flex: 0 !important; padding: 7px 10px; background: #fef2f2; border: 1px solid #fecaca; color: #dc2626; }
        .card-btn-delete:hover { background: #fee2e2; }
        .card-btn-visite { background: #f0fdf4; border: 1px solid #bbf7d0; color: #16a34a; font-weight: 500; }
        .card-btn-visite:hover { background: #dcfce7; }
        .card-btn-back { flex: 0 !important; padding: 7px 10px; background: #faf8f5; border: 1px solid #e8e2d9; color: #8a7d6b; }
        .card-btn-back:hover { background: #f0ebe3; }
        .card-btn-docs { background: #f0f4ff; border: 1px solid #c7d2fe; color: #4338ca; font-weight: 500; }
        .card-btn-docs:hover { background: #e0e7ff; }
        .card-btn-back:hover { background: #f0ebe3; }
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

        {/* Onglets */}
        <div style={{ display: 'flex', gap: '4px', background: '#ede8e0', borderRadius: '10px', padding: '4px', marginBottom: '24px', width: 'fit-content' }}>
          <button onClick={() => setOnglet('avant')} style={{ padding: '8px 20px', borderRadius: '7px', border: 'none', fontFamily: 'DM Sans, sans-serif', fontSize: '13px', fontWeight: 500, cursor: 'pointer', transition: 'all 0.2s', background: onglet === 'avant' ? '#fff' : 'transparent', color: onglet === 'avant' ? '#1a1814' : '#8a7d6b', boxShadow: onglet === 'avant' ? '0 1px 4px rgba(0,0,0,0.08)' : 'none' }}>
            🔍 Avant visite <span style={{ fontSize: '11px', color: '#a09480', marginLeft: '4px' }}>{analyses.filter(a => !a.statut_visite || a.statut_visite === 'avant_visite').length}</span>
          </button>
          <button onClick={() => setOnglet('apres')} style={{ padding: '8px 20px', borderRadius: '7px', border: 'none', fontFamily: 'DM Sans, sans-serif', fontSize: '13px', fontWeight: 500, cursor: 'pointer', transition: 'all 0.2s', background: onglet === 'apres' ? '#fff' : 'transparent', color: onglet === 'apres' ? '#1a1814' : '#8a7d6b', boxShadow: onglet === 'apres' ? '0 1px 4px rgba(0,0,0,0.08)' : 'none' }}>
            ✓ Après visite <span style={{ fontSize: '11px', color: '#a09480', marginLeft: '4px' }}>{analyses.filter(a => a.statut_visite === 'apres_visite').length}</span>
          </button>
        </div>

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
          <>
            {(() => {
              const filtered = analyses.filter(a => onglet === 'avant'
                ? (!a.statut_visite || a.statut_visite === 'avant_visite')
                : a.statut_visite === 'apres_visite'
              )
              return filtered.length === 0 ? (
                <div className="empty">
                  <div className="empty-icon">{onglet === 'avant' ? '🔍' : '✓'}</div>
                  <div className="empty-title">{onglet === 'avant' ? 'Aucune analyse en attente de visite' : 'Aucune analyse après visite'}</div>
                  <div className="empty-sub">{onglet === 'avant' ? 'Lancez une nouvelle analyse' : 'Basculez une analyse depuis l\'onglet "Avant visite"'}</div>
                </div>
              ) : (
                <div className="grid">
                  {filtered.map(a => (
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
                          <button className="card-btn card-btn-voir" onClick={() => { setSelected(a); setSelectedOnglet(a.has_docs ? 'apres' : 'avant') }}>Voir</button>
                          <button className="card-btn card-btn-pdf" onClick={() => telechargerPDF(a)}>↓ PDF</button>
                          {onglet === 'avant' ? (
                            <button className="card-btn card-btn-visite" onClick={() => basculerStatut(a.id, 'apres_visite')} title="Marquer comme visité">✓ Visité</button>
                          ) : (
                            <>
                              <button className="card-btn card-btn-docs" onClick={() => ouvrirUpload(a)}>📎 Docs{a.has_docs ? ' ✓' : ''}</button>
                              <button className="card-btn card-btn-back" onClick={() => basculerStatut(a.id, 'avant_visite')} title="Remettre en avant visite">↩</button>
                            </>
                          )}
                          <button className="card-btn card-btn-delete" onClick={() => supprimerAnalyse(a.id)}>✕</button>
                        </div>
                      </div>
                      <div className="card-date">{formatDate(a.created_at)}</div>
                    </div>
                  ))}
                </div>
              )
            })()}
          </>
        )}
      </div>

      {/* Modal rapport */}
      {selected && (
        <div className="modal-overlay" onClick={() => setSelected(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setSelected(null)}>✕ Fermer</button>

            {/* Onglets avant/après */}
            <div style={{ display: 'flex', gap: '4px', background: '#ede8e0', borderRadius: '8px', padding: '3px', marginBottom: '20px', width: 'fit-content' }}>
              <button onClick={() => setSelectedOnglet('avant')} style={{ padding: '7px 16px', borderRadius: '6px', border: 'none', fontFamily: 'DM Sans, sans-serif', fontSize: '12px', fontWeight: 500, cursor: 'pointer', background: selectedOnglet === 'avant' ? '#fff' : 'transparent', color: selectedOnglet === 'avant' ? '#1a1814' : '#8a7d6b', boxShadow: selectedOnglet === 'avant' ? '0 1px 4px rgba(0,0,0,0.08)' : 'none' }}>
                🔍 Analyse initiale
              </button>
              <button onClick={() => { if (selected.has_docs) { setSelectedOnglet('apres'); supabase.from('analyses_docs_historique').select('*').eq('analyse_id', selected.id).order('created_at', { ascending: false }).then(({ data }) => setHistoriqueAnalyses(data || [])) } }} style={{ padding: '7px 16px', borderRadius: '6px', border: 'none', fontFamily: 'DM Sans, sans-serif', fontSize: '12px', fontWeight: 500, cursor: selected.has_docs ? 'pointer' : 'not-allowed', background: selectedOnglet === 'apres' ? '#fff' : 'transparent', color: selectedOnglet === 'apres' ? '#1a1814' : selected.has_docs ? '#8a7d6b' : '#c4b99a', boxShadow: selectedOnglet === 'apres' ? '0 1px 4px rgba(0,0,0,0.08)' : 'none', opacity: selected.has_docs ? 1 : 0.5 }}>
                📎 Après visite {selected.has_docs ? '✓' : '—'}
              </button>
            </div>

            {selectedOnglet === 'avant' ? (
              <RapportModal data={selected.rapport_complet} ville={selected.ville} typeBien={selected.type_bien} onPDF={() => telechargerPDF(selected)} />
            ) : (
              <RapportApresVisite
                data={selected.analyse_complementaire}
                scoreInitial={selected.rapport_complet?.scores?.global}
                historique={historiqueAnalyses}
                showHistorique={showHistorique}
                setShowHistorique={setShowHistorique}
                onPDF={async () => {
                  const { genererPDFApresVisite } = await import('@/lib/NidoPDF')
                  await genererPDFApresVisite(selected.analyse_complementaire, selected.rapport_complet, selected.ville, selected.type_bien)
                }}
              />
            )}
          </div>
        </div>
      )}

      {/* Modal upload documents */}
      {uploadModal && (
        <div className="modal-overlay" onClick={() => { setUploadModal(null); setUploadResult(null); setUploadDocs([]) }}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '600px' }}>
            <button className="modal-close" onClick={() => { setUploadModal(null); setUploadResult(null); setUploadDocs([]) }}>✕ Fermer</button>

            <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '26px', fontWeight: 600, color: '#1a1814', marginBottom: '4px' }}>Documents post-visite</div>
            <div style={{ fontSize: '12px', color: '#8a7d6b', marginBottom: '16px' }}>{uploadModal.ville}</div>

            {/* Garde-fou compteur */}
            <div style={{ background: nbAnalyses >= 3 ? '#fef2f2' : nbAnalyses >= 2 ? '#fffbeb' : '#f0fdf4', border: `1px solid ${nbAnalyses >= 3 ? '#fecaca' : nbAnalyses >= 2 ? '#fde68a' : '#bbf7d0'}`, borderRadius: '10px', padding: '10px 14px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: '12px', color: nbAnalyses >= 3 ? '#dc2626' : nbAnalyses >= 2 ? '#92400e' : '#16a34a', fontWeight: 500 }}>
                {nbAnalyses >= 3 ? '🚫 Limite atteinte — 3 analyses max par bien' : `🔍 ${nbAnalyses}/3 analyses utilisées — ${3 - nbAnalyses} restante${3 - nbAnalyses > 1 ? 's' : ''}`}
              </div>
              <div style={{ fontSize: '10px', color: '#a09480' }}>Max 3 / bien</div>
            </div>

            {!uploadResult ? (
              <>
                {[
                  { type: 'dpe', label: '⚡ DPE', desc: 'Diagnostic de performance énergétique' },
                  { type: 'elec', label: '🔌 Électricité', desc: 'Diagnostic électrique' },
                  { type: 'gaz', label: '🔥 Gaz', desc: 'Diagnostic gaz' },
                  { type: 'spanc', label: '🚽 SPANC', desc: 'Assainissement non collectif' },
                  { type: 'divers', label: '📄 Divers', desc: 'Autres documents' },
                ].map(({ type, label, desc }) => {
                  const docExistant = docsExistants.find(d => d.type === type)
                  const docEnAttente = uploadDocs.find(d => d.type === type)
                  const doc = docEnAttente || docExistant
                  const isExistant = !docEnAttente && !!docExistant
                  return (
                    <div key={type} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: doc ? (isExistant ? '#f0fdf4' : '#f0f4ff') : '#faf8f5', border: `1px solid ${doc ? (isExistant ? '#bbf7d0' : '#c7d2fe') : '#e8e2d9'}`, borderRadius: '10px', marginBottom: '8px', gap: '12px' }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '13px', fontWeight: 500, color: '#1a1814', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          {doc && <span style={{ color: isExistant ? '#16a34a' : '#4338ca', fontSize: '14px' }}>✓</span>}
                          {label}
                          {isExistant && <span style={{ fontSize: '10px', color: '#16a34a', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '4px', padding: '1px 6px' }}>déjà uploadé</span>}
                          {docEnAttente && <span style={{ fontSize: '10px', color: '#4338ca', background: '#f0f4ff', border: '1px solid #c7d2fe', borderRadius: '4px', padding: '1px 6px' }}>nouveau</span>}
                        </div>
                        <div style={{ fontSize: '11px', color: '#8a7d6b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {doc ? doc.nom_fichier : desc}
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                        {doc && (
                          <button onClick={() => docExistant && !docEnAttente ? resetDoc(type) : setUploadDocs(prev => prev.filter(d => d.type !== type))}
                            style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', borderRadius: '6px', padding: '5px 10px', fontSize: '11px', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' }}>
                            ✕ {isExistant ? 'Suppr.' : 'Reset'}
                          </button>
                        )}
                        {nbAnalyses < 3 && (
                          <label style={{ background: doc ? '#faf8f5' : '#1a1814', color: doc ? '#4a4035' : '#fff', border: `1px solid ${doc ? '#e8e2d9' : '#1a1814'}`, borderRadius: '7px', padding: '6px 12px', fontSize: '11px', fontWeight: 500, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                            {doc ? '↺ Changer' : '+ Ajouter'}
                            <input type="file" accept=".pdf,image/*" style={{ display: 'none' }} onChange={e => { if (e.target.files?.[0]) ajouterDoc(e.target.files[0], type) }} />
                          </label>
                        )}
                      </div>
                    </div>
                  )
                })}

                {uploadDocs.length > 0 && nbAnalyses < 3 && (
                  <button onClick={analyserDocs} disabled={uploading} style={{ width: '100%', marginTop: '16px', background: uploading ? '#a09480' : '#1a1814', color: '#f5f2ed', border: 'none', borderRadius: '10px', padding: '14px', fontFamily: 'DM Sans, sans-serif', fontSize: '14px', fontWeight: 500, cursor: uploading ? 'not-allowed' : 'pointer' }}>
                    {uploading ? '⏳ Analyse en cours…' : `🔍 Analyser ${uploadDocs.length} nouveau${uploadDocs.length > 1 ? 'x' : ''} document${uploadDocs.length > 1 ? 's' : ''}`}
                  </button>
                )}
              </>
            ) : (
              <div>
                <div style={{ background: (uploadResult.delta_score || 0) >= 0 ? '#f0fdf4' : '#fef2f2', border: `1px solid ${(uploadResult.delta_score || 0) >= 0 ? '#bbf7d0' : '#fecaca'}`, borderRadius: '12px', padding: '20px', marginBottom: '16px', textAlign: 'center' }}>
                  <div style={{ fontSize: '11px', color: '#8a7d6b', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '8px' }}>Score révisé</div>
                  <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '48px', fontWeight: 700, color: '#1a1814', lineHeight: 1 }}>
                    {uploadResult.score_revise}<span style={{ fontSize: '16px', color: '#a09480' }}>/10</span>
                  </div>
                  <div style={{ fontSize: '13px', marginTop: '6px', color: (uploadResult.delta_score || 0) >= 0 ? '#16a34a' : '#dc2626', fontWeight: 500 }}>
                    {(uploadResult.delta_score || 0) >= 0 ? '▲' : '▼'} {Math.abs(uploadResult.delta_score || 0)} point{Math.abs(uploadResult.delta_score || 0) > 1 ? 's' : ''} vs analyse initiale
                  </div>
                </div>
                <div style={{ fontSize: '13px', color: '#2d2a24', lineHeight: 1.7, marginBottom: '12px', fontStyle: 'italic', background: '#faf8f5', border: '1px solid #e8e2d9', borderRadius: '10px', padding: '14px' }}>
                  {uploadResult.synthese}
                </div>
                {uploadResult.observations_docs?.map((obs: any, i: number) => (
                  <div key={i} style={{ background: '#fff', border: '1px solid #e8e2d9', borderRadius: '10px', padding: '12px 16px', marginBottom: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <div style={{ fontSize: '12px', fontWeight: 600, color: '#1a1814' }}>{obs.nom}</div>
                      <span style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '4px', background: obs.impact === 'positif' ? '#f0fdf4' : obs.impact === 'négatif' ? '#fef2f2' : '#fafafa', color: obs.impact === 'positif' ? '#16a34a' : obs.impact === 'négatif' ? '#dc2626' : '#8a7d6b', border: `1px solid ${obs.impact === 'positif' ? '#bbf7d0' : obs.impact === 'négatif' ? '#fecaca' : '#e8e2d9'}` }}>{obs.impact}</span>
                    </div>
                    <div style={{ fontSize: '12px', color: '#4a4035', lineHeight: 1.6 }}>{obs.points_cles}</div>
                  </div>
                ))}
                <div style={{ display: 'flex', gap: '10px', marginTop: '12px' }}>
                  <button onClick={() => { setUploadResult(null); setUploadDocs([]) }} style={{ flex: 1, background: '#faf8f5', color: '#4a4035', border: '1px solid #e8e2d9', borderRadius: '10px', padding: '12px', fontFamily: 'DM Sans, sans-serif', fontSize: '13px', cursor: 'pointer' }}>
                    ↺ Ajouter d'autres docs
                  </button>
                  <button onClick={() => { setUploadModal(null); setUploadResult(null); setUploadDocs([]) }} style={{ flex: 1, background: '#1a1814', color: '#f5f2ed', border: 'none', borderRadius: '10px', padding: '12px', fontFamily: 'DM Sans, sans-serif', fontSize: '13px', cursor: 'pointer' }}>
                    Voir le rapport →
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}

function RapportModal({ data, ville, typeBien, onPDF }: { data: any, ville: string, typeBien: string, onPDF: () => void }) {
  if (!data) return <div style={{ padding: '40px', textAlign: 'center', color: '#a09480' }}>Rapport non disponible</div>
  const v = data.verdict
  const decision = v?.decision || 'NÉGOCIER'
  const cls = decision === 'ACHETER' ? '#052e16' : decision === 'FUIR' ? '#1f0505' : '#1c1003'
  const scoreColor = (s: number) => s >= 7 ? '#16a34a' : s >= 5 ? '#d97706' : '#dc2626'
  return (
    <div>
      <div style={{ background: cls, borderRadius: '14px', padding: '28px', marginBottom: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px', flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontSize: '10px', letterSpacing: '0.12em', textTransform: 'uppercase', color: decision === 'ACHETER' ? '#4ade80' : decision === 'FUIR' ? '#f87171' : '#fbbf24', marginBottom: '8px', fontWeight: 500 }}>
              {decision === 'ACHETER' ? '✓ ' : decision === 'FUIR' ? '✕ ' : '~ '}{decision}
            </div>
            {v?.prix_recommande && <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '40px', fontWeight: 700, color: '#fff', lineHeight: 1 }}>{v.prix_recommande.toLocaleString('fr-FR')} €</div>}
          </div>
          {data.scores && <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '48px', fontWeight: 700, color: '#fff', lineHeight: 1 }}>{data.scores.global}<span style={{ fontSize: '16px', color: '#8b6914' }}>/10</span></div>}
        </div>
        {v?.resume && <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.65)', lineHeight: 1.7, marginTop: '14px', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '14px' }}>{v.resume}</div>}
      </div>
      {data.scores && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', marginBottom: '12px' }}>
          {[['État bâti', 'etat_bati'], ['Qualité/Prix', 'rapport_qualite_prix'], ['Potentiel', 'potentiel'], ['DPE', 'dpe']].map(([label, key]) => (
            <div key={key} style={{ background: '#fff', border: '1px solid #e8e2d9', borderRadius: '10px', padding: '12px', textAlign: 'center' }}>
              <div style={{ fontSize: '9px', color: '#a09480', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '4px' }}>{label}</div>
              <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '28px', fontWeight: 700, color: scoreColor(data.scores[key as string]), lineHeight: 1 }}>{data.scores[key as string]}<span style={{ fontSize: '11px', color: '#c4b99a' }}>/10</span></div>
            </div>
          ))}
        </div>
      )}
      {data.alertes?.length > 0 && (
        <div style={{ background: '#fff', border: '1px solid #e8e2d9', borderRadius: '12px', marginBottom: '10px', overflow: 'hidden' }}>
          <div style={{ padding: '14px 18px 10px', borderBottom: '1px solid #f5f2ed' }}><span style={{ fontSize: '9px', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#dc2626' }}>Alertes prioritaires</span></div>
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
      {data.budget && (
        <div style={{ background: '#fff', border: '1px solid #e8e2d9', borderRadius: '12px', padding: '14px 18px', marginBottom: '10px' }}>
          <div style={{ fontSize: '9px', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#92400e', marginBottom: '10px' }}>Budget total réel</div>
          <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '28px', fontWeight: 700, color: '#1a1814' }}>
            {data.budget.total_min?.toLocaleString('fr-FR')} € <span style={{ color: '#c4b99a', fontSize: '16px' }}>—</span> {data.budget.total_max?.toLocaleString('fr-FR')} €
          </div>
        </div>
      )}
      <div style={{ textAlign: 'center', marginTop: '20px' }}>
        <button onClick={onPDF} style={{ background: '#1a1814', color: '#f5f2ed', border: 'none', borderRadius: '9px', padding: '12px 24px', fontFamily: 'DM Sans, sans-serif', fontSize: '13px', fontWeight: 500, cursor: 'pointer' }}>↓ PDF Analyse initiale</button>
      </div>
    </div>
  )
}

function RapportApresVisite({ data, scoreInitial, historique, showHistorique, setShowHistorique, onPDF, onChargerHistorique }: any) {
  if (!data) return <div style={{ textAlign: 'center', padding: '40px', color: '#a09480' }}>Aucune analyse post-visite disponible</div>
  const delta = data.delta_score || 0
  return (
    <div>
      {/* Score révisé */}
      <div style={{ background: delta >= 0 ? '#052e16' : '#1f0505', borderRadius: '14px', padding: '28px', marginBottom: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ fontSize: '10px', letterSpacing: '0.12em', textTransform: 'uppercase', color: delta >= 0 ? '#4ade80' : '#f87171', marginBottom: '8px', fontWeight: 500 }}>
              {data.verdict_revise?.decision}
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px' }}>
              <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '48px', fontWeight: 700, color: '#fff', lineHeight: 1 }}>
                {data.score_revise}<span style={{ fontSize: '16px', color: '#8b6914' }}>/10</span>
              </div>
              <div style={{ fontSize: '13px', color: delta >= 0 ? '#4ade80' : '#f87171', fontWeight: 500 }}>
                {delta >= 0 ? '▲' : '▼'} {Math.abs(delta)} vs {scoreInitial}/10 initial
              </div>
            </div>
          </div>
        </div>
        {data.verdict_revise?.resume && (
          <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.65)', lineHeight: 1.7, marginTop: '14px', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '14px' }}>
            {data.verdict_revise.resume}
          </div>
        )}
      </div>

      {/* Synthèse */}
      <div style={{ fontSize: '13px', color: '#2d2a24', lineHeight: 1.7, marginBottom: '12px', fontStyle: 'italic', background: '#faf8f5', border: '1px solid #e8e2d9', borderRadius: '10px', padding: '14px' }}>
        {data.synthese}
      </div>

      {/* Nouvelles alertes */}
      {data.nouvelles_alertes?.length > 0 && (
        <div style={{ background: '#fff', border: '1px solid #e8e2d9', borderRadius: '12px', marginBottom: '12px', overflow: 'hidden' }}>
          <div style={{ padding: '12px 16px', borderBottom: '1px solid #f5f2ed' }}>
            <span style={{ fontSize: '9px', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#dc2626' }}>Nouvelles alertes — diagnostics</span>
          </div>
          <div style={{ padding: '8px 16px 12px' }}>
            {data.nouvelles_alertes.map((a: any, i: number) => (
              <div key={i} style={{ display: 'flex', gap: '10px', padding: '7px 0', borderBottom: i < data.nouvelles_alertes.length - 1 ? '1px solid #f8f5f0' : 'none' }}>
                <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: a.niveau === 'rouge' ? '#dc2626' : a.niveau === 'orange' ? '#f97316' : '#16a34a', marginTop: '5px', flexShrink: 0 }} />
                <div style={{ fontSize: '11px', color: '#a09480', textTransform: 'uppercase', letterSpacing: '0.05em', minWidth: '90px', flexShrink: 0 }}>{a.categorie}</div>
                <div style={{ fontSize: '12px', color: '#2d2a24', lineHeight: 1.5 }}>{a.observation}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Observations par doc */}
      {data.observations_docs?.map((obs: any, i: number) => (
        <div key={i} style={{ background: '#fff', border: '1px solid #e8e2d9', borderRadius: '10px', padding: '12px 16px', marginBottom: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
            <div style={{ fontSize: '12px', fontWeight: 600, color: '#1a1814' }}>{obs.nom}</div>
            <span style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '4px', background: obs.impact === 'positif' ? '#f0fdf4' : obs.impact === 'négatif' ? '#fef2f2' : '#fafafa', color: obs.impact === 'positif' ? '#16a34a' : obs.impact === 'négatif' ? '#dc2626' : '#8a7d6b', border: `1px solid ${obs.impact === 'positif' ? '#bbf7d0' : obs.impact === 'négatif' ? '#fecaca' : '#e8e2d9'}` }}>{obs.impact}</span>
          </div>
          <div style={{ fontSize: '12px', color: '#4a4035', lineHeight: 1.6 }}>{obs.points_cles}</div>
        </div>
      ))}

      {/* Historique */}
      {!showHistorique ? (
        <button onClick={onChargerHistorique} style={{ width: '100%', marginTop: '12px', background: 'transparent', border: '1px solid #e8e2d9', borderRadius: '8px', padding: '10px', fontFamily: 'DM Sans, sans-serif', fontSize: '12px', color: '#8a7d6b', cursor: 'pointer' }}>
          Voir l'historique des analyses →
        </button>
      ) : (
        <div style={{ marginTop: '12px' }}>
          <div style={{ fontSize: '10px', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#8a7d6b', marginBottom: '8px' }}>Historique</div>
          {historique.map((h: any, i: number) => (
            <div key={h.id} style={{ background: i === 0 ? '#faf8f5' : '#fff', border: '1px solid #e8e2d9', borderRadius: '8px', padding: '10px 14px', marginBottom: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: '12px', color: '#1a1814' }}>
                {i === 0 && <span style={{ fontSize: '10px', color: '#8b6914', marginRight: '6px' }}>● Dernière</span>}
                Score : {h.analyse_complementaire?.score_revise}/10
              </div>
              <div style={{ fontSize: '11px', color: '#a09480' }}>{new Date(h.created_at).toLocaleDateString('fr-FR')}</div>
            </div>
          ))}
        </div>
      )}

      <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
        <button onClick={onPDF} style={{ flex: 1, background: '#1a1814', color: '#f5f2ed', border: 'none', borderRadius: '9px', padding: '12px', fontFamily: 'DM Sans, sans-serif', fontSize: '13px', fontWeight: 500, cursor: 'pointer' }}>
          ↓ PDF Après visite
        </button>
      </div>
    </div>
  )
}

  const v = data.verdict
  const decision = v?.decision || 'NÉGOCIER'
  const cls = decision === 'ACHETER' ? '#052e16' : decision === 'FUIR' ? '#1f0505' : '#1c1003'

  return (
    <div>
      <div style={{ background: cls, borderRadius: '14px', padding: '28px', marginBottom: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px', flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontSize: '10px', letterSpacing: '0.12em', textTransform: 'uppercase', color: decision === 'ACHETER' ? '#4ade80' : decision === 'FUIR' ? '#f87171' : '#fbbf24', marginBottom: '8px', fontWeight: 500 }}>
              {decision === 'ACHETER' ? '✓ ' : decision === 'FUIR' ? '✕ ' : '~ '}{decision}
            </div>
            {v?.prix_recommande && <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '40px', fontWeight: 700, color: '#fff', lineHeight: 1 }}>{v.prix_recommande.toLocaleString('fr-FR')} €</div>}
          </div>
          {data.scores && (
            <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '48px', fontWeight: 700, color: '#fff', lineHeight: 1 }}>
              {data.scores.global}<span style={{ fontSize: '16px', color: '#8b6914' }}>/10</span>
            </div>
          )}
        </div>
        {v?.resume && <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.65)', lineHeight: 1.7, marginTop: '14px', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '14px' }}>{v.resume}</div>}
      </div>

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
          ↓ PDF Analyse initiale
        </button>
      </div>
    </div>
  )
}

function ApresVisiteContent({ data, ac, scoreColor, onPDFApres, showHistorique, setShowHistorique }: any) {
  if (!ac) return <div style={{ textAlign: 'center', padding: '40px', color: '#a09480' }}>Aucune analyse post-visite</div>

  const delta = ac.delta_score || 0
  const scoreInitial = data.scores?.global

  return (
    <div>
      {/* Score révisé vs initial */}
      <div style={{ background: delta >= 0 ? '#052e16' : '#1f0505', borderRadius: '14px', padding: '28px', marginBottom: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ fontSize: '10px', letterSpacing: '0.12em', textTransform: 'uppercase', color: delta >= 0 ? '#4ade80' : '#f87171', marginBottom: '8px', fontWeight: 500 }}>
              {ac.verdict_revise?.decision}
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px' }}>
              <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '48px', fontWeight: 700, color: '#fff', lineHeight: 1 }}>
                {ac.score_revise}<span style={{ fontSize: '16px', color: '#8b6914' }}>/10</span>
              </div>
              <div style={{ fontSize: '13px', color: delta >= 0 ? '#4ade80' : '#f87171', fontWeight: 500 }}>
                {delta >= 0 ? '▲' : '▼'} {Math.abs(delta)} vs {scoreInitial}/10
              </div>
            </div>
          </div>
        </div>
        {ac.verdict_revise?.resume && (
          <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.65)', lineHeight: 1.7, marginTop: '14px', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '14px' }}>
            {ac.verdict_revise.resume}
          </div>
        )}
      </div>

      {/* Synthèse */}
      <div style={{ fontSize: '13px', color: '#2d2a24', lineHeight: 1.7, marginBottom: '12px', fontStyle: 'italic', background: '#faf8f5', border: '1px solid #e8e2d9', borderRadius: '10px', padding: '14px' }}>
        {ac.synthese}
      </div>

      {/* Nouvelles alertes */}
      {ac.nouvelles_alertes?.length > 0 && (
        <div style={{ background: '#fff', border: '1px solid #e8e2d9', borderRadius: '12px', marginBottom: '12px', overflow: 'hidden' }}>
          <div style={{ padding: '12px 16px 10px', borderBottom: '1px solid #f5f2ed' }}>
            <span style={{ fontSize: '9px', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#dc2626' }}>Nouvelles alertes — diagnostics</span>
          </div>
          <div style={{ padding: '8px 16px 12px' }}>
            {ac.nouvelles_alertes.map((a: any, i: number) => (
              <div key={i} style={{ display: 'flex', gap: '10px', padding: '7px 0', borderBottom: i < ac.nouvelles_alertes.length - 1 ? '1px solid #f8f5f0' : 'none' }}>
                <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: a.niveau === 'rouge' ? '#dc2626' : a.niveau === 'orange' ? '#f97316' : '#16a34a', marginTop: '5px', flexShrink: 0 }} />
                <div style={{ fontSize: '11px', color: '#a09480', textTransform: 'uppercase', letterSpacing: '0.05em', minWidth: '90px', flexShrink: 0 }}>{a.categorie}</div>
                <div style={{ fontSize: '12px', color: '#2d2a24', lineHeight: 1.5 }}>{a.observation}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Observations par doc */}
      {ac.observations_docs?.map((obs: any, i: number) => (
        <div key={i} style={{ background: '#fff', border: '1px solid #e8e2d9', borderRadius: '10px', padding: '12px 16px', marginBottom: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
            <div style={{ fontSize: '12px', fontWeight: 600, color: '#1a1814' }}>{obs.nom}</div>
            <span style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '4px', background: obs.impact === 'positif' ? '#f0fdf4' : obs.impact === 'négatif' ? '#fef2f2' : '#fafafa', color: obs.impact === 'positif' ? '#16a34a' : obs.impact === 'négatif' ? '#dc2626' : '#8a7d6b', border: `1px solid ${obs.impact === 'positif' ? '#bbf7d0' : obs.impact === 'négatif' ? '#fecaca' : '#e8e2d9'}` }}>{obs.impact}</span>
          </div>
          <div style={{ fontSize: '12px', color: '#4a4035', lineHeight: 1.6 }}>{obs.points_cles}</div>
        </div>
      ))}

      <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
        <button onClick={onPDFApres} style={{ flex: 1, background: '#1a1814', color: '#f5f2ed', border: 'none', borderRadius: '9px', padding: '12px', fontFamily: 'DM Sans, sans-serif', fontSize: '13px', fontWeight: 500, cursor: 'pointer' }}>
          ↓ PDF Après visite
        </button>
      </div>
    </div>
  )
}
