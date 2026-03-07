'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { createBrowserClient } from '@supabase/ssr'

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

type Etape = 'annonce' | 'photos' | 'analyse'

interface FormData {
  texte: string
  url: string
  dpe: string
  ges: string
  prix: string
  surface: string
  ville: string
  typeBien: string
  profilAcheteur: string
  assainissement: string
  anneeConstruction: string
  photos: File[]
}

const INITIAL_FORM: FormData = {
  texte: '', url: '', dpe: '', ges: '', prix: '', surface: '',
  ville: '', typeBien: '', profilAcheteur: '', assainissement: '', anneeConstruction: '', photos: []
}

export default function Home() {
  const [etape, setEtape] = useState<Etape>('annonce')
  const [form, setForm] = useState<FormData>(INITIAL_FORM)
  const [loading, setLoading] = useState(false)
  const [resultat, setResultat] = useState<any>(null)
  const [erreur, setErreur] = useState('')
  const [drag, setDrag] = useState(false)
  const [authChecked, setAuthChecked] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        window.location.replace('/auth')
      } else {
        setAuthChecked(true)
      }
    })
  }, [])

  const set = (key: keyof FormData, val: any) => setForm(p => ({ ...p, [key]: val }))

  const ajouterPhotos = useCallback((files: FileList | null) => {
    if (!files) return
    const nouvelles = Array.from(files).filter(f => f.type.startsWith('image/'))
    setForm(prev => ({ ...prev, photos: [...prev.photos, ...nouvelles].slice(0, 20) }))
  }, [])

  async function analyser() {
    if (!form.texte.trim()) return
    setLoading(true)
    setErreur('')
    setEtape('analyse')
    try {
      const photosBase64 = await Promise.all(
        form.photos.map(file => new Promise<string>((resolve, reject) => {
          const reader = new FileReader()
          reader.onload = () => resolve(reader.result as string)
          reader.onerror = reject
          reader.readAsDataURL(file)
        }))
      )
      const res = await fetch('/api/analyser', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, photos: photosBase64 })
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setResultat(data.analyse)
    } catch (e: any) {
      setErreur(e.message)
      setEtape('photos')
    } finally {
      setLoading(false)
    }
  }

  function reset() { setResultat(null); setEtape('annonce'); setForm(INITIAL_FORM); setErreur('') }

  if (!authChecked) return null

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400;1,600&family=DM+Sans:wght@300;400;500&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #f5f2ed; color: #1a1814; font-family: 'DM Sans', sans-serif; min-height: 100vh; }
        .page { max-width: 820px; margin: 0 auto; padding: 60px 24px 120px; }
        .header { text-align: center; margin-bottom: 52px; }
        .logo { font-family: 'Cormorant Garamond', serif; font-size: 60px; font-weight: 700; letter-spacing: -1px; color: #1a1814; line-height: 1; }
        .logo em { color: #8b6914; font-style: normal; }
        .tagline { font-size: 11px; font-weight: 300; letter-spacing: 0.2em; text-transform: uppercase; color: #a09480; margin-top: 8px; }
        .stepper { display: flex; align-items: center; justify-content: center; margin-bottom: 40px; }
        .step { display: flex; align-items: center; gap: 8px; font-size: 11px; font-weight: 500; letter-spacing: 0.1em; text-transform: uppercase; color: #c4b99a; transition: color 0.3s; }
        .step.active { color: #1a1814; }
        .step.done { color: #8b6914; }
        .step-num { width: 26px; height: 26px; border-radius: 50%; border: 1.5px solid currentColor; display: flex; align-items: center; justify-content: center; font-size: 10px; flex-shrink: 0; transition: all 0.3s; }
        .step.active .step-num { background: #1a1814; border-color: #1a1814; color: #f5f2ed; }
        .step.done .step-num { background: #8b6914; border-color: #8b6914; color: #fff; }
        .step-line { width: 40px; height: 1px; background: #d9d2c7; margin: 0 10px; }
        .card { background: #fff; border: 1px solid #e8e2d9; border-radius: 16px; padding: 32px; margin-bottom: 16px; box-shadow: 0 2px 16px rgba(0,0,0,0.04); }
        .card-title { font-family: 'Cormorant Garamond', serif; font-size: 22px; font-weight: 600; margin-bottom: 4px; }
        .card-sub { font-size: 13px; color: #8a7d6b; margin-bottom: 24px; font-weight: 300; }
        .label { display: block; font-size: 10px; font-weight: 500; letter-spacing: 0.12em; text-transform: uppercase; color: #8a7d6b; margin-bottom: 6px; }
        .input { width: 100%; background: #faf8f5; border: 1px solid #e8e2d9; border-radius: 8px; padding: 11px 14px; font-family: 'DM Sans', sans-serif; font-size: 14px; color: #1a1814; outline: none; transition: border-color 0.2s; margin-bottom: 16px; }
        .input:focus { border-color: #8b6914; }
        .input::placeholder { color: #c4b99a; }
        .textarea { width: 100%; background: #faf8f5; border: 1px solid #e8e2d9; border-radius: 8px; padding: 14px; font-family: 'DM Sans', sans-serif; font-size: 14px; color: #1a1814; outline: none; resize: vertical; min-height: 160px; transition: border-color 0.2s; margin-bottom: 16px; line-height: 1.6; }
        .textarea:focus { border-color: #8b6914; }
        .textarea::placeholder { color: #c4b99a; }
        .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        .grid-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; }
        .grid-2 .input, .grid-3 .input { margin-bottom: 0; }
        .mb16 { margin-bottom: 16px; }
        .dpe-row { display: flex; gap: 6px; margin-bottom: 16px; }
        .dpe-btn { flex: 1; padding: 9px 2px; border-radius: 7px; border: 1.5px solid #e8e2d9; background: #faf8f5; font-family: 'DM Sans', sans-serif; font-size: 13px; font-weight: 500; cursor: pointer; transition: all 0.15s; color: #8a7d6b; }
        .dpe-btn:hover { border-color: #8b6914; color: #1a1814; }
        .dpe-btn.sel { border-color: #8b6914; background: #8b6914; color: #fff; }
        .chip-row { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 16px; }
        .chip { padding: 7px 14px; border-radius: 100px; border: 1.5px solid #e8e2d9; background: #faf8f5; font-family: 'DM Sans', sans-serif; font-size: 12px; font-weight: 500; cursor: pointer; transition: all 0.15s; color: #8a7d6b; white-space: nowrap; }
        .chip:hover { border-color: #8b6914; color: #1a1814; }
        .chip.sel { border-color: #8b6914; background: #8b6914; color: #fff; }
        .upload-zone { border: 2px dashed #d9d2c7; border-radius: 10px; padding: 36px 24px; text-align: center; cursor: pointer; transition: all 0.2s; margin-bottom: 16px; background: #faf8f5; }
        .upload-zone:hover, .upload-zone.drag { border-color: #8b6914; background: #fdf9f3; }
        .upload-icon { font-size: 28px; margin-bottom: 10px; }
        .upload-text { font-size: 13px; color: #8a7d6b; line-height: 1.6; }
        .upload-text strong { color: #1a1814; font-weight: 500; }
        .photos-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(80px, 1fr)); gap: 8px; margin-bottom: 16px; }
        .photo-thumb { position: relative; aspect-ratio: 1; border-radius: 7px; overflow: hidden; border: 1px solid #e8e2d9; }
        .photo-thumb img { width: 100%; height: 100%; object-fit: cover; }
        .photo-rm { position: absolute; top: 3px; right: 3px; width: 18px; height: 18px; background: rgba(0,0,0,0.65); border: none; border-radius: 50%; color: white; font-size: 11px; cursor: pointer; display: flex; align-items: center; justify-content: center; }
        .photos-count { font-size: 12px; color: #8a7d6b; margin-bottom: 10px; }
        .btn-primary { background: #1a1814; color: #f5f2ed; border: none; border-radius: 9px; padding: 13px 28px; font-family: 'DM Sans', sans-serif; font-size: 13px; font-weight: 500; cursor: pointer; transition: all 0.2s; }
        .btn-primary:hover { background: #2d2a24; }
        .btn-primary:disabled { opacity: 0.4; cursor: not-allowed; }
        .btn-sec { background: transparent; color: #8a7d6b; border: 1px solid #d9d2c7; border-radius: 9px; padding: 13px 20px; font-family: 'DM Sans', sans-serif; font-size: 13px; cursor: pointer; transition: all 0.2s; margin-right: 10px; }
        .btn-sec:hover { border-color: #8a7d6b; color: #1a1814; }
        .btn-row { display: flex; align-items: center; justify-content: flex-end; margin-top: 8px; }
        .loading-card { background: #fff; border: 1px solid #e8e2d9; border-radius: 16px; padding: 72px 36px; text-align: center; box-shadow: 0 2px 16px rgba(0,0,0,0.04); }
        .loading-title { font-family: 'Cormorant Garamond', serif; font-size: 30px; font-weight: 600; margin-bottom: 10px; }
        .loading-sub { font-size: 13px; color: #8a7d6b; font-weight: 300; }
        .dots { display: flex; justify-content: center; gap: 7px; margin: 24px 0; }
        .dot { width: 7px; height: 7px; border-radius: 50%; background: #8b6914; animation: pulse 1.4s ease-in-out infinite; }
        .dot:nth-child(2) { animation-delay: 0.2s; }
        .dot:nth-child(3) { animation-delay: 0.4s; }
        @keyframes pulse { 0%,80%,100% { opacity:0.3; transform:scale(0.8); } 40% { opacity:1; transform:scale(1); } }
        .erreur { color: #c0392b; font-size: 13px; margin-top: 10px; text-align: center; }
        .section-divider { height: 1px; background: #f0ebe3; margin: 4px 0; }

        /* ===== RAPPORT ===== */
        .rapport { animation: fadeUp 0.5s ease forwards; }
        @keyframes fadeUp { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }

        /* Verdict hero */
        .verdict-hero { border-radius: 18px; padding: 36px 32px; margin-bottom: 12px; position: relative; overflow: hidden; }
        .verdict-hero.acheter { background: #052e16; }
        .verdict-hero.negocier { background: #1c1003; }
        .verdict-hero.fuir { background: #1f0505; }
        .verdict-glow { position: absolute; top: -60px; right: -60px; width: 200px; height: 200px; border-radius: 50%; opacity: 0.15; }
        .verdict-hero.acheter .verdict-glow { background: #22c55e; }
        .verdict-hero.negocier .verdict-glow { background: #f59e0b; }
        .verdict-hero.fuir .verdict-glow { background: #ef4444; }
        .verdict-top { display: flex; align-items: flex-start; justify-content: space-between; gap: 24px; flex-wrap: wrap; }
        .verdict-badge { display: inline-flex; align-items: center; gap: 8px; border-radius: 6px; padding: 6px 14px; font-size: 11px; font-weight: 500; letter-spacing: 0.1em; text-transform: uppercase; margin-bottom: 12px; }
        .verdict-hero.acheter .verdict-badge { background: rgba(34,197,94,0.15); color: #4ade80; }
        .verdict-hero.negocier .verdict-badge { background: rgba(245,158,11,0.15); color: #fbbf24; }
        .verdict-hero.fuir .verdict-badge { background: rgba(239,68,68,0.15); color: #f87171; }
        .verdict-prix-label { font-size: 11px; letter-spacing: 0.1em; text-transform: uppercase; opacity: 0.5; color: #fff; margin-bottom: 4px; }
        .verdict-prix { font-family: 'Cormorant Garamond', serif; font-size: 48px; font-weight: 700; color: #fff; line-height: 1; }
        .verdict-prix-max { font-size: 12px; opacity: 0.5; color: #fff; margin-top: 4px; }
        .verdict-resume { font-size: 14px; color: rgba(255,255,255,0.7); line-height: 1.7; margin-top: 16px; border-top: 1px solid rgba(255,255,255,0.08); padding-top: 16px; }

        /* Scores */
        .scores-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 12px; }
        .score-box { background: #fff; border: 1px solid #e8e2d9; border-radius: 12px; padding: 16px; text-align: center; box-shadow: 0 1px 8px rgba(0,0,0,0.04); }
        .score-box-label { font-size: 10px; font-weight: 500; letter-spacing: 0.08em; text-transform: uppercase; color: #a09480; margin-bottom: 6px; }
        .score-box-num { font-family: 'Cormorant Garamond', serif; font-size: 36px; font-weight: 700; line-height: 1; }
        .score-box-max { font-size: 14px; color: #c4b99a; }
        .score-global { background: #1a1814; color: #fff; }
        .score-global .score-box-label { color: #8b6914; }
        .score-global .score-box-max { color: #6b5c3e; }

        /* Sections */
        .r-card { background: #fff; border: 1px solid #e8e2d9; border-radius: 14px; margin-bottom: 10px; overflow: hidden; box-shadow: 0 1px 10px rgba(0,0,0,0.04); }
        .r-card-head { padding: 18px 24px 0; display: flex; align-items: center; gap: 10px; }
        .r-icon { width: 30px; height: 30px; border-radius: 7px; display: flex; align-items: center; justify-content: center; font-size: 14px; flex-shrink: 0; }
        .r-icon.rouge { background: #fef2f2; }
        .r-icon.orange { background: #fff7ed; }
        .r-icon.vert { background: #f0fdf4; }
        .r-icon.bleu { background: #eff6ff; }
        .r-icon.or { background: #fffbeb; }
        .r-icon.ardoise { background: #f8fafc; }
        .r-title { font-size: 10px; font-weight: 500; letter-spacing: 0.12em; text-transform: uppercase; }
        .r-title.rouge { color: #dc2626; }
        .r-title.orange { color: #ea580c; }
        .r-title.vert { color: #16a34a; }
        .r-title.bleu { color: #1d4ed8; }
        .r-title.or { color: #92400e; }
        .r-title.ardoise { color: #475569; }
        .r-count { margin-left: auto; font-size: 11px; color: #c4b99a; }
        .r-body { padding: 14px 24px 20px; }

        /* Alertes */
        .alerte-item { display: flex; gap: 12px; padding: 10px 0; border-bottom: 1px solid #f8f5f0; align-items: flex-start; }
        .alerte-item:last-child { border-bottom: none; padding-bottom: 0; }
        .alerte-dot { width: 8px; height: 8px; border-radius: 50%; margin-top: 5px; flex-shrink: 0; }
        .alerte-dot.rouge { background: #dc2626; }
        .alerte-dot.orange { background: #f97316; }
        .alerte-dot.vert { background: #16a34a; }
        .alerte-cat { font-size: 11px; font-weight: 500; color: #a09480; text-transform: uppercase; letter-spacing: 0.06em; min-width: 120px; flex-shrink: 0; padding-top: 1px; }
        .alerte-text { font-size: 13px; color: #2d2a24; line-height: 1.55; }

        /* Photos analyse */
        .photo-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
        .photo-zone { background: #faf8f5; border: 1px solid #ede8e0; border-radius: 8px; padding: 12px 14px; }
        .photo-zone-title { font-size: 10px; font-weight: 500; letter-spacing: 0.08em; text-transform: uppercase; color: #8a7d6b; margin-bottom: 5px; }
        .photo-zone-text { font-size: 13px; color: #4a4035; line-height: 1.55; }

        /* Budget */
        .budget-total { display: flex; align-items: baseline; gap: 12px; margin-bottom: 16px; }
        .budget-label { font-size: 11px; text-transform: uppercase; letter-spacing: 0.1em; color: #a09480; }
        .budget-montant { font-family: 'Cormorant Garamond', serif; font-size: 40px; font-weight: 700; color: #1a1814; line-height: 1; }
        .budget-sep { color: #c4b99a; }
        .budget-table { width: 100%; border-collapse: collapse; font-size: 13px; }
        .budget-table th { text-align: left; font-size: 10px; font-weight: 500; letter-spacing: 0.08em; text-transform: uppercase; color: #a09480; padding: 0 0 8px; border-bottom: 1px solid #f0ebe3; }
        .budget-table th:not(:first-child) { text-align: right; }
        .budget-table td { padding: 9px 0; border-bottom: 1px solid #f8f5f0; vertical-align: top; }
        .budget-table td:not(:first-child) { text-align: right; }
        .budget-table tr:last-child td { border-bottom: none; }
        .urgence-badge { display: inline-block; padding: 2px 7px; border-radius: 4px; font-size: 10px; font-weight: 500; }
        .urgence-badge.immediat { background: #fef2f2; color: #dc2626; }
        .urgence-badge.court { background: #fff7ed; color: #ea580c; }
        .urgence-badge.moyen { background: #f0fdf4; color: #16a34a; }

        /* Marché */
        .marche-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; margin-bottom: 14px; }
        .marche-box { background: #faf8f5; border: 1px solid #ede8e0; border-radius: 8px; padding: 12px 14px; text-align: center; }
        .marche-box-label { font-size: 10px; text-transform: uppercase; letter-spacing: 0.08em; color: #a09480; margin-bottom: 4px; }
        .marche-box-val { font-family: 'Cormorant Garamond', serif; font-size: 24px; font-weight: 600; color: #1a1814; }
        .marche-box-unit { font-size: 11px; color: #a09480; }
        .marche-eval { display: inline-flex; align-items: center; gap: 6px; padding: 4px 12px; border-radius: 6px; font-size: 12px; font-weight: 500; margin-bottom: 10px; }
        .marche-eval.sous { background: #f0fdf4; color: #16a34a; }
        .marche-eval.correct { background: #f8fafc; color: #475569; }
        .marche-eval.sur { background: #fef2f2; color: #dc2626; }
        .marche-comment { font-size: 13px; color: #4a4035; line-height: 1.6; }

        /* Négociation */
        .nego-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }
        .nego-card { background: #faf8f5; border: 1px solid #ede8e0; border-radius: 10px; padding: 16px; }
        .nego-nom { font-size: 11px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.08em; color: #8a7d6b; margin-bottom: 8px; }
        .nego-prix { font-family: 'Cormorant Garamond', serif; font-size: 28px; font-weight: 700; color: #1a1814; line-height: 1; margin-bottom: 2px; }
        .nego-remise { font-size: 12px; color: #8b6914; font-weight: 500; margin-bottom: 10px; }
        .nego-strat { font-size: 12px; color: #4a4035; line-height: 1.55; margin-bottom: 8px; }
        .nego-risque { font-size: 10px; font-weight: 500; letter-spacing: 0.06em; text-transform: uppercase; }
        .nego-risque.faible { color: #16a34a; }
        .nego-risque.moyen { color: #ea580c; }
        .nego-risque.eleve { color: #dc2626; }

        /* Visite */
        .visite-item { display: flex; gap: 14px; padding: 11px 0; border-bottom: 1px solid #f8f5f0; align-items: flex-start; }
        .visite-item:last-child { border-bottom: none; padding-bottom: 0; }
        .visite-num { font-family: 'Cormorant Garamond', serif; font-size: 22px; font-weight: 600; color: #e8e2d9; line-height: 1; flex-shrink: 0; width: 24px; text-align: right; margin-top: 1px; }
        .visite-content {}
        .visite-point { font-size: 13px; font-weight: 500; color: #1a1814; margin-bottom: 2px; }
        .visite-detail { font-size: 12px; color: #8a7d6b; line-height: 1.5; }

        /* DPE */
        .dpe-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; }
        .dpe-box { background: #faf8f5; border: 1px solid #ede8e0; border-radius: 8px; padding: 12px 14px; }
        .dpe-box-label { font-size: 10px; text-transform: uppercase; letter-spacing: 0.08em; color: #a09480; margin-bottom: 5px; }
        .dpe-box-text { font-size: 13px; color: #2d2a24; line-height: 1.55; }

        .nouvelle-analyse { text-align: center; margin-top: 32px; }
        .footer-note { text-align: center; font-size: 11px; color: #c4b99a; letter-spacing: 0.06em; margin-top: 40px; line-height: 1.8; }

        @media (max-width: 640px) {
          .grid-2, .grid-3 { grid-template-columns: 1fr; }
          .scores-grid { grid-template-columns: 1fr 1fr; }
          .nego-grid { grid-template-columns: 1fr; }
          .marche-grid { grid-template-columns: 1fr 1fr; }
          .photo-grid { grid-template-columns: 1fr; }
          .dpe-grid { grid-template-columns: 1fr; }
          .step-label { display: none; }
          .verdict-prix { font-size: 36px; }
        }
      `}</style>

      <div className="page">
        <div className="header">
          <div className="logo">NID<em>O</em></div>
          <div className="tagline">Analyse immobilière par intelligence artificielle</div>
          <button
            onClick={async () => { await supabase.auth.signOut(); window.location.href = '/auth' }}
            style={{ marginTop: '12px', background: 'transparent', border: '1px solid #d9d2c7', borderRadius: '7px', padding: '6px 14px', fontSize: '11px', color: '#a09480', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', letterSpacing: '0.06em' }}
          >
            Déconnexion
          </button>
        </div>

        {!resultat && (
          <div className="stepper">
            <div className={`step ${etape === 'annonce' ? 'active' : 'done'}`}>
              <div className="step-num">{etape === 'annonce' ? '1' : '✓'}</div>
              <span className="step-label">Annonce</span>
            </div>
            <div className="step-line" />
            <div className={`step ${etape === 'photos' ? 'active' : etape === 'analyse' ? 'done' : ''}`}>
              <div className="step-num">{etape === 'analyse' ? '✓' : '2'}</div>
              <span className="step-label">Photos</span>
            </div>
            <div className="step-line" />
            <div className={`step ${etape === 'analyse' ? 'active' : ''}`}>
              <div className="step-num">3</div>
              <span className="step-label">Analyse</span>
            </div>
          </div>
        )}

        {/* ÉTAPE 1 */}
        {etape === 'annonce' && (
          <div className="card">
            <div className="card-title">L'annonce</div>
            <div className="card-sub">Renseignez les informations du bien à analyser</div>

            <label className="label">Texte complet de l'annonce *</label>
            <textarea className="textarea" placeholder="Titre, description, caractéristiques, diagnostics..." value={form.texte} onChange={e => set('texte', e.target.value)} />

            <label className="label">Type de bien</label>
            <div className="chip-row mb16">
              {['Maison', 'Appartement', 'Terrain + maison'].map(t => (
                <button key={t} className={`chip ${form.typeBien === t ? 'sel' : ''}`} onClick={() => set('typeBien', form.typeBien === t ? '' : t)}>{t}</button>
              ))}
            </div>

            <label className="label">Profil acheteur</label>
            <div className="chip-row mb16">
              {['Célibataire', 'Couple sans enfants', 'Couple avec enfants', 'Investisseur'].map(p => (
                <button key={p} className={`chip ${form.profilAcheteur === p ? 'sel' : ''}`} onClick={() => set('profilAcheteur', form.profilAcheteur === p ? '' : p)}>{p}</button>
              ))}
            </div>

            <div className="grid-3 mb16">
              <div>
                <label className="label">Prix (€)</label>
                <input className="input" type="number" placeholder="250 000" value={form.prix} onChange={e => set('prix', e.target.value)} />
              </div>
              <div>
                <label className="label">Surface (m²)</label>
                <input className="input" type="number" placeholder="120" value={form.surface} onChange={e => set('surface', e.target.value)} />
              </div>
              <div>
                <label className="label">Année construction</label>
                <input className="input" type="number" placeholder="1985" value={form.anneeConstruction} onChange={e => set('anneeConstruction', e.target.value)} />
              </div>
            </div>

            <label className="label">Ville / Code postal</label>
            <input className="input" type="text" placeholder="Rouen 76000" value={form.ville} onChange={e => set('ville', e.target.value)} />

            <label className="label">Assainissement</label>
            <div className="chip-row mb16">
              {['Tout à l\'égout', 'Fosse septique', 'Inconnu'].map(a => (
                <button key={a} className={`chip ${form.assainissement === a ? 'sel' : ''}`} onClick={() => set('assainissement', form.assainissement === a ? '' : a)}>{a}</button>
              ))}
            </div>

            <label className="label">Classe énergie DPE</label>
            <div className="dpe-row">
              {['A','B','C','D','E','F','G'].map(l => (
                <button key={l} className={`dpe-btn ${form.dpe === l ? 'sel' : ''}`} onClick={() => set('dpe', form.dpe === l ? '' : l)}>{l}</button>
              ))}
            </div>

            <label className="label">Classe GES</label>
            <div className="dpe-row" style={{ marginBottom: '28px' }}>
              {['A','B','C','D','E','F','G'].map(l => (
                <button key={l} className={`dpe-btn ${form.ges === l ? 'sel' : ''}`} onClick={() => set('ges', form.ges === l ? '' : l)}>{l}</button>
              ))}
            </div>

            <label className="label">URL de l'annonce (optionnel)</label>
            <input className="input" type="url" placeholder="https://www.seloger.com/..." value={form.url} onChange={e => set('url', e.target.value)} />

            <div className="btn-row">
              <button className="btn-primary" disabled={!form.texte.trim()} onClick={() => setEtape('photos')}>Continuer → Photos</button>
            </div>
          </div>
        )}

        {/* ÉTAPE 2 */}
        {etape === 'photos' && (
          <div className="card">
            <div className="card-title">Les photos</div>
            <div className="card-sub">Ajoutez les photos du bien pour une analyse visuelle complète</div>

            <input ref={inputRef} type="file" accept="image/*" multiple style={{ display: 'none' }} onChange={e => ajouterPhotos(e.target.files)} />

            <div className={`upload-zone ${drag ? 'drag' : ''}`}
              onClick={() => inputRef.current?.click()}
              onDragOver={e => { e.preventDefault(); setDrag(true) }}
              onDragLeave={() => setDrag(false)}
              onDrop={e => { e.preventDefault(); setDrag(false); ajouterPhotos(e.dataTransfer.files) }}
            >
              <div className="upload-icon">📷</div>
              <div className="upload-text"><strong>Cliquez</strong> ou glissez-déposez vos photos<br />JPG, PNG, WEBP — 20 max</div>
            </div>

            {form.photos.length > 0 && (
              <>
                <div className="photos-count">{form.photos.length} photo{form.photos.length > 1 ? 's' : ''} sélectionnée{form.photos.length > 1 ? 's' : ''}</div>
                <div className="photos-grid">
                  {form.photos.map((p, i) => (
                    <div key={i} className="photo-thumb">
                      <img src={URL.createObjectURL(p)} alt="" />
                      <button className="photo-rm" onClick={() => set('photos', form.photos.filter((_, j) => j !== i))}>×</button>
                    </div>
                  ))}
                </div>
              </>
            )}

            {erreur && <div className="erreur">⚠ {erreur}</div>}

            <div className="btn-row">
              <button className="btn-sec" onClick={() => setEtape('annonce')}>← Retour</button>
              <button className="btn-primary" onClick={analyser}>Lancer l'analyse →</button>
            </div>
          </div>
        )}

        {/* LOADING */}
        {etape === 'analyse' && loading && (
          <div className="loading-card">
            <div className="loading-title">Analyse en cours…</div>
            <div className="loading-sub">NIDO examine le texte et les {form.photos.length} photo{form.photos.length > 1 ? 's' : ''}</div>
            <div className="dots"><div className="dot"/><div className="dot"/><div className="dot"/></div>
            <div className="loading-sub" style={{ fontSize: '12px' }}>30 à 60 secondes</div>
          </div>
        )}

        {/* RAPPORT */}
        {resultat && <Rapport data={resultat} form={form} onReset={reset} />}

        <div className="footer-note">Outil d'aide à la décision — ne remplace pas un diagnostic certifié · NIDO © 2026</div>
      </div>
    </>
  )
}

function Rapport({ data, form, onReset }: { data: any, form: FormData, onReset: () => void }) {
  const v = data.verdict
  const decision = v?.decision || 'NÉGOCIER'
  const cls = decision === 'ACHETER' ? 'acheter' : decision === 'FUIR' ? 'fuir' : 'negocier'

  const scoreColor = (s: number) => s >= 7 ? '#16a34a' : s >= 5 ? '#d97706' : '#dc2626'

  return (
    <div className="rapport">

      {/* VERDICT */}
      <div className={`verdict-hero ${cls}`}>
        <div className="verdict-glow" />
        <div className="verdict-top">
          <div>
            <div className="verdict-badge">
              {decision === 'ACHETER' ? '✓' : decision === 'FUIR' ? '✕' : '~'} {decision}
            </div>
            {v?.prix_recommande && (
              <>
                <div className="verdict-prix-label">Prix recommandé</div>
                <div className="verdict-prix">{v.prix_recommande.toLocaleString('fr-FR')} €</div>
                {v.prix_max_a_ne_pas_depasser && (
                  <div className="verdict-prix-max">Ne pas dépasser {v.prix_max_a_ne_pas_depasser.toLocaleString('fr-FR')} €</div>
                )}
              </>
            )}
          </div>
          {data.scores && (
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '10px', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#8b6914', marginBottom: '4px' }}>Score</div>
              <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '56px', fontWeight: 700, color: '#fff', lineHeight: 1 }}>
                {data.scores.global}<span style={{ fontSize: '20px', color: '#6b5c3e' }}>/10</span>
              </div>
            </div>
          )}
        </div>
        {v?.resume && <div className="verdict-resume">{v.resume}</div>}
      </div>

      {/* SCORES */}
      {data.scores && (
        <div className="scores-grid">
          {[
            { label: 'État bâti', key: 'etat_bati' },
            { label: 'Qualité/Prix', key: 'rapport_qualite_prix' },
            { label: 'Potentiel', key: 'potentiel' },
            { label: 'DPE', key: 'dpe' },
          ].map(({ label, key }) => (
            <div key={key} className="score-box">
              <div className="score-box-label">{label}</div>
              <div className="score-box-num" style={{ color: scoreColor(data.scores[key]) }}>
                {data.scores[key]}<span className="score-box-max">/10</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ALERTES */}
      {data.alertes?.length > 0 && (
        <div className="r-card">
          <div className="r-card-head">
            <div className="r-icon rouge">⚠</div>
            <div className="r-title rouge">Alertes prioritaires</div>
            <div className="r-count">{data.alertes.length}</div>
          </div>
          <div className="r-body">
            {data.alertes.map((a: any, i: number) => (
              <div key={i} className="alerte-item">
                <div className={`alerte-dot ${a.niveau}`} />
                <div className="alerte-cat">{a.categorie}</div>
                <div className="alerte-text">{a.observation}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ANALYSE PHOTOS */}
      {data.analyse_photos && typeof data.analyse_photos === 'object' && (
        <div className="r-card">
          <div className="r-card-head">
            <div className="r-icon ardoise">🔍</div>
            <div className="r-title ardoise">Analyse visuelle</div>
          </div>
          <div className="r-body">
            <div className="photo-grid">
              {Object.entries(data.analyse_photos).map(([zone, texte]) => (
                <div key={zone} className="photo-zone">
                  <div className="photo-zone-title">{zoneIcon(zone)} {zone}</div>
                  <div className="photo-zone-text">{String(texte)}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* MARCHÉ */}
      {data.marche && (
        <div className="r-card">
          <div className="r-card-head">
            <div className="r-icon bleu">📊</div>
            <div className="r-title bleu">Prix de marché</div>
          </div>
          <div className="r-body">
            <div className="marche-grid">
              <div className="marche-box">
                <div className="marche-box-label">Annonce</div>
                <div className="marche-box-val">{data.marche.prix_m2_annonce?.toLocaleString('fr-FR') || '—'}</div>
                <div className="marche-box-unit">€/m²</div>
              </div>
              <div className="marche-box">
                <div className="marche-box-label">Marché bas</div>
                <div className="marche-box-val">{data.marche.prix_m2_marche_bas?.toLocaleString('fr-FR') || '—'}</div>
                <div className="marche-box-unit">€/m²</div>
              </div>
              <div className="marche-box">
                <div className="marche-box-label">Marché haut</div>
                <div className="marche-box-val">{data.marche.prix_m2_marche_haut?.toLocaleString('fr-FR') || '—'}</div>
                <div className="marche-box-unit">€/m²</div>
              </div>
            </div>
            <div className={`marche-eval ${data.marche.evaluation === 'sous-évalué' ? 'sous' : data.marche.evaluation === 'surévalué' ? 'sur' : 'correct'}`}>
              {data.marche.evaluation === 'sous-évalué' ? '↓ Sous-évalué' : data.marche.evaluation === 'surévalué' ? '↑ Surévalué' : '= Prix correct'}
            </div>
            <div className="marche-comment">{data.marche.commentaire}</div>
          </div>
        </div>
      )}

      {/* BUDGET */}
      {data.budget && (
        <div className="r-card">
          <div className="r-card-head">
            <div className="r-icon or">💰</div>
            <div className="r-title or">Budget total réel</div>
          </div>
          <div className="r-body">
            <div className="budget-total">
              <div>
                <div className="budget-label">Total estimé</div>
                <div className="budget-montant">
                  {data.budget.total_min?.toLocaleString('fr-FR')} €
                  <span className="budget-sep"> — </span>
                  {data.budget.total_max?.toLocaleString('fr-FR')} €
                </div>
              </div>
            </div>
            <table className="budget-table">
              <thead>
                <tr>
                  <th>Poste</th>
                  <th>Min</th>
                  <th>Max</th>
                  <th>Urgence</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Prix d'achat</td>
                  <td>{data.budget.prix_demande?.toLocaleString('fr-FR')} €</td>
                  <td>—</td>
                  <td></td>
                </tr>
                <tr>
                  <td>Frais de notaire</td>
                  <td>{data.budget.frais_notaire?.toLocaleString('fr-FR')} €</td>
                  <td>—</td>
                  <td></td>
                </tr>
                {data.budget.detail_travaux?.map((t: any, i: number) => (
                  <tr key={i}>
                    <td>
                      {t.poste}
                      {t.aides && <div style={{ fontSize: '11px', color: '#16a34a', marginTop: '2px' }}>💡 {t.aides}</div>}
                    </td>
                    <td>{t.min?.toLocaleString('fr-FR')} €</td>
                    <td>{t.max?.toLocaleString('fr-FR')} €</td>
                    <td>
                      <span className={`urgence-badge ${t.urgence === 'immédiat' ? 'immediat' : t.urgence === 'court terme' ? 'court' : 'moyen'}`}>
                        {t.urgence}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ASSAINISSEMENT */}
      {data.assainissement && (
        <div className="r-card">
          <div className="r-card-head">
            <div className="r-icon orange">🔧</div>
            <div className="r-title orange">Assainissement</div>
          </div>
          <div className="r-body">
            <div style={{ fontSize: '13px', color: '#2d2a24', lineHeight: '1.6', marginBottom: data.assainissement.cout_mise_conformite_min ? '12px' : '0' }}>
              <strong>{data.assainissement.type}</strong> — {data.assainissement.observations}
            </div>
            {data.assainissement.cout_mise_conformite_min && (
              <div style={{ fontSize: '13px', color: '#ea580c' }}>
                Coût mise en conformité estimé : {data.assainissement.cout_mise_conformite_min?.toLocaleString('fr-FR')} € — {data.assainissement.cout_mise_conformite_max?.toLocaleString('fr-FR')} €
              </div>
            )}
          </div>
        </div>
      )}

      {/* DPE */}
      {data.dpe_analyse && (
        <div className="r-card">
          <div className="r-card-head">
            <div className="r-icon vert">⚡</div>
            <div className="r-title vert">Énergie & DPE</div>
          </div>
          <div className="r-body">
            <div className="dpe-grid">
              <div className="dpe-box">
                <div className="dpe-box-label">Coût annuel estimé</div>
                <div className="dpe-box-text">{data.dpe_analyse.cout_annuel_estime}</div>
              </div>
              <div className="dpe-box">
                <div className="dpe-box-label">Travaux pour classe B</div>
                <div className="dpe-box-text">{data.dpe_analyse.travaux_pour_classe_b}</div>
              </div>
              <div className="dpe-box">
                <div className="dpe-box-label">Retour investissement</div>
                <div className="dpe-box-text">{data.dpe_analyse.retour_investissement}</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* NÉGOCIATION */}
      {data.negociation?.length > 0 && (
        <div className="r-card">
          <div className="r-card-head">
            <div className="r-icon ardoise">🤝</div>
            <div className="r-title ardoise">Scénarios de négociation</div>
          </div>
          <div className="r-body">
            <div className="nego-grid">
              {data.negociation.map((n: any, i: number) => (
                <div key={i} className="nego-card">
                  <div className="nego-nom">{n.nom}</div>
                  <div className="nego-prix">{n.prix?.toLocaleString('fr-FR')} €</div>
                  <div className="nego-remise">-{n.remise_pct}%</div>
                  <div className="nego-strat">{n.strategie}</div>
                  <div className={`nego-risque ${n.risque === 'faible' ? 'faible' : n.risque === 'moyen' ? 'moyen' : 'eleve'}`}>
                    Risque {n.risque}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* VISITE */}
      {data.visite?.length > 0 && (
        <div className="r-card">
          <div className="r-card-head">
            <div className="r-icon bleu">📋</div>
            <div className="r-title bleu">Points à vérifier en visite</div>
          </div>
          <div className="r-body">
            <div>
              {data.visite.map((v: any, i: number) => (
                <div key={i} className="visite-item">
                  <div className="visite-num">{v.priorite || i + 1}</div>
                  <div className="visite-content">
                    <div className="visite-point">{v.point}</div>
                    <div className="visite-detail">{v.quoi_verifier}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="nouvelle-analyse">
        <button className="btn-sec" onClick={onReset}>← Nouvelle analyse</button>
      </div>

    </div>
  )
}

function zoneIcon(zone: string): string {
  const z = zone.toLowerCase()
  if (z.includes('façade') || z.includes('facade') || z.includes('extérieur')) return '🏠'
  if (z.includes('salon') || z.includes('séjour')) return '🛋️'
  if (z.includes('cuisine')) return '🍳'
  if (z.includes('chambre')) return '🛏️'
  if (z.includes('salle de bain') || z.includes('sdb') || z.includes("salle d'eau")) return '🚿'
  if (z.includes('toiture') || z.includes('toit')) return '🏗️'
  if (z.includes('cave') || z.includes('sous-sol')) return '⬇️'
  if (z.includes('grenier') || z.includes('comble')) return '⬆️'
  if (z.includes('jardin') || z.includes('terrain')) return '🌿'
  if (z.includes('garage')) return '🚗'
  if (z.includes('couloir') || z.includes('entrée')) return '🚪'
  return '📷'
}
