import { NextRequest, NextResponse } from 'next/server'
import { analyserAnnonce } from '@/lib/claude'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { texte, url, dpe, ges, prix, surface, ville, typeBien, profilAcheteur, assainissement, anneeConstruction, photos, profil } = body

    if (!texte?.trim()) {
      return NextResponse.json({ error: 'Texte de l\'annonce manquant' }, { status: 400 })
    }

    // Récupérer l'user depuis le token
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '') || ''
    let userId = null
    if (token) {
      const { data: { user } } = await supabaseAdmin.auth.getUser(token)
      userId = user?.id || null
    }

    console.log('👤 User ID:', userId)

    const analyse = await analyserAnnonce({
      texte, dpe, ges, prix, surface, ville,
      typeBien, profilAcheteur, assainissement, anneeConstruction,
      photos: photos || [],
      profil: profil || null
    })

    const { data: saved, error } = await supabaseAdmin
      .from('analyses')
      .insert({
        user_id: userId,
        url_annonce: url || null,
        ville: ville || null,
        type_bien: typeBien || null,
        prix: prix ? parseInt(prix) : null,
        surface: surface ? parseInt(surface) : null,
        score_global: analyse.scores?.global || null,
        decision: analyse.verdict?.decision || null,
        verdict_resume: analyse.verdict?.resume || null,
        rapport_complet: analyse,
        statut: 'complete'
      })
      .select()
      .single()

    if (error) console.error('❌ Supabase error:', JSON.stringify(error))
    else console.log('✅ Sauvegardé ID:', saved?.id)

    return NextResponse.json({
      success: true,
      analyse: { id: saved?.id, ...analyse }
    })

  } catch (error: any) {
    console.error('Erreur analyse:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
