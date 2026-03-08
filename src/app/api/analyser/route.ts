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

    const analyse = await analyserAnnonce({
      texte, dpe, ges, prix, surface, ville,
      typeBien, profilAcheteur, assainissement, anneeConstruction,
      photos: photos || []
    })

    const insertData = {
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
    }

    console.log('💾 Sauvegarde Supabase...', JSON.stringify(insertData).slice(0, 200))

    const { data: saved, error } = await supabaseAdmin
      .from('analyses')
      .insert(insertData)
      .select()
      .single()

    if (error) {
      console.error('❌ Supabase error:', JSON.stringify(error))
    } else {
      console.log('✅ Sauvegardé ID:', saved?.id)
    }

    return NextResponse.json({
      success: true,
      analyse: { id: saved?.id, ...analyse }
    })

  } catch (error: any) {
    console.error('Erreur analyse:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
