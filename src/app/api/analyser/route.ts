import { NextRequest, NextResponse } from 'next/server'
import { analyserAnnonce } from '@/lib/claude'
import { supabaseAdmin } from '@/lib/supabase'
import { createBrowserClient } from '@supabase/ssr'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { texte, url, dpe, ges, prix, surface, ville, typeBien, profilAcheteur, assainissement, anneeConstruction, photos } = body

    if (!texte?.trim()) {
      return NextResponse.json({ error: 'Texte de l\'annonce manquant' }, { status: 400 })
    }

    // Récupérer l'user connecté depuis le cookie
    const authHeader = request.headers.get('authorization')
    const userId = authHeader ? authHeader.replace('Bearer ', '') : null

    const analyse = await analyserAnnonce({
      texte, dpe, ges, prix, surface, ville,
      typeBien, profilAcheteur, assainissement, anneeConstruction,
      photos: photos || []
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
        score_global: analyse.scores?.global,
        decision: analyse.verdict?.decision,
        verdict_resume: analyse.verdict?.resume,
        rapport_complet: analyse,
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
