import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { supabaseAdmin } from '@/lib/supabase'

const anthropic = new Anthropic()

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '') || ''
    let userId = null
    if (token) {
      const { data: { user } } = await supabaseAdmin.auth.getUser(token)
      userId = user?.id || null
    }
    if (!userId) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

    const body = await request.json()
    const { analyse_id, documents } = body
    // documents = [{ type, nom_fichier, storage_path, base64, media_type }]

    // Récupérer l'analyse originale
    const { data: analyse } = await supabaseAdmin
      .from('analyses')
      .select('rapport_complet, ville, type_bien, nb_analyses_docs')
      .eq('id', analyse_id)
      .single()

    if (!analyse) return NextResponse.json({ error: 'Analyse introuvable' }, { status: 404 })

    // Garde-fou : max 3 analyses de docs par bien
    const nbActuel = analyse.nb_analyses_docs || 0
    if (nbActuel >= 3) {
      return NextResponse.json({ error: 'Limite de 3 analyses par bien atteinte' }, { status: 429 })
    }

    const rapportOriginal = analyse.rapport_complet

    // Construire le prompt avec les docs
    const docsDesc = documents.map((d: any) => `- ${d.type.toUpperCase()} : ${d.nom_fichier}`).join('\n')

    // Construire les content blocks pour Claude
    const contentBlocks: any[] = [
      {
        type: 'text',
        text: `Tu es NIDO, expert immobilier français. Voici l'analyse initiale d'un bien :

SCORE INITIAL : ${rapportOriginal.scores?.global}/10
VERDICT INITIAL : ${rapportOriginal.verdict?.decision} — ${rapportOriginal.verdict?.resume}
ALERTES INITIALES : ${rapportOriginal.alertes?.map((a: any) => `${a.categorie}: ${a.observation}`).join(' | ')}

Documents fournis après visite :
${docsDesc}

Analyse ces documents et génère :
1. Les nouvelles observations par document
2. Les points qui CONFIRMENT ou CONTREDISENT l'analyse initiale
3. Un score révisé (peut augmenter ou baisser selon ce que révèlent les docs)
4. Une recommandation finale mise à jour

IMPORTANT : Texte brut uniquement dans tous les champs string. N'utilise JAMAIS de markdown (**gras**, *italique*).

Réponds UNIQUEMENT en JSON valide :
{
  "observations_docs": [
    { "type": "dpe|elec|gaz|spanc|divers", "nom": "string", "observations": ["string"], "impact": "positif|neutre|négatif", "points_cles": "string" }
  ],
  "score_revise": number,
  "delta_score": number,
  "verdict_revise": { "decision": "ACHETER|NÉGOCIER|FUIR", "resume": "string" },
  "nouvelles_alertes": [{ "niveau": "rouge|orange|vert", "categorie": "string", "observation": "string" }],
  "synthese": "string"
}`
      }
    ]

    // Ajouter les documents comme content blocks
    for (const doc of documents) {
      if (doc.base64 && doc.media_type) {
        if (doc.media_type === 'application/pdf') {
          contentBlocks.push({
            type: 'document',
            source: { type: 'base64', media_type: 'application/pdf', data: doc.base64 }
          })
        } else {
          contentBlocks.push({
            type: 'image',
            source: { type: 'base64', media_type: doc.media_type, data: doc.base64 }
          })
        }
      }
    }

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-5',
      max_tokens: 3000,
      temperature: 0.3,
      messages: [{ role: 'user', content: contentBlocks }]
    })

    const text = response.content.map((b: any) => b.text || '').join('')
    const clean = text.replace(/```json|```/g, '').trim()
    const analyseComplementaire = JSON.parse(clean)

    // Sauvegarder chaque document en DB
    for (const doc of documents) {
      await supabaseAdmin.from('documents').insert({
        analyse_id,
        user_id: userId,
        type: doc.type,
        nom_fichier: doc.nom_fichier,
        storage_path: doc.storage_path,
        analyse_complementaire: analyseComplementaire
      })
    }

    // Mettre à jour le score global de l'analyse
    await supabaseAdmin
      .from('analyses')
      .update({
        score_global: analyseComplementaire.score_revise,
        decision: analyseComplementaire.verdict_revise?.decision,
        verdict_resume: analyseComplementaire.verdict_revise?.resume,
        analyse_complementaire: analyseComplementaire,
        has_docs: true,
        nb_analyses_docs: nbActuel + 1
      })
      .eq('id', analyse_id)

    return NextResponse.json({ success: true, analyseComplementaire, nb_analyses_docs: nbActuel + 1 })

  } catch (error: any) {
    console.error('Erreur analyse docs:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
