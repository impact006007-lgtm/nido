import { NextRequest, NextResponse } from 'next/server'
import { analyserAnnonce } from '@/lib/claude'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { texte, url, dpe, ges, prix, surface, ville, typeBien, profilAcheteur, assainissement, anneeConstruction, photos } = body

    if (!texte?.trim()) {
      return NextResponse.json({ error: 'Texte de l\'annonce manquant' }, { status: 400 })
    }

    console.log('🤖 Analyse NIDO...')
    console.log('📍 Ville:', ville || 'non renseignée')
    console.log('🏠 Type:', typeBien || 'non renseigné')
    console.log('👤 Profil:', profilAcheteur || 'non renseigné')
    console.log('🚽 Assainissement:', assainissement || 'non renseigné')
    console.log('🖼️ Photos:', photos?.length || 0)

    const analyse = await analyserAnnonce({
      texte, dpe, ges, prix, surface, ville,
      typeBien, profilAcheteur, assainissement, anneeConstruction,
      photos: photos || []
    })

    const { data: saved, error } = await supabaseAdmin
      .from('analyses')
      .insert({
        url_annonce: url || null,
        score_transparence: analyse.scores?.global,
        red_flags: analyse.alertes?.filter((a: any) => a.niveau === 'rouge').map((a: any) => a.observation),
        points_positifs: analyse.alertes?.filter((a: any) => a.niveau === 'vert').map((a: any) => a.observation),
        questions_visite: analyse.visite?.map((v: any) => v.point),
        analyse_photos: analyse.analyse_photos,
        estimation_travaux: analyse.budget,
        verdict: analyse.verdict?.resume,
        statut: 'complete'
      })
      .select()
      .single()

    if (error) console.error('Supabase error:', error)

    return NextResponse.json({
      success: true,
      analyse: { id: saved?.id, ...analyse }
    })

  } catch (error: any) {
    console.error('Erreur analyse:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
