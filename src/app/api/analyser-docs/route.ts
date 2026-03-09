import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { supabaseAdmin } from '@/lib/supabase'

const anthropic = new Anthropic()

// Extraire le texte d'un PDF base64 via pdf-parse
async function extraireTextePDF(base64: string): Promise<string> {
  try {
    const pdfParse = (await import('pdf-parse')).default
    const buffer = Buffer.from(base64, 'base64')
    const result = await pdfParse(buffer, { max: 3 }) // max 3 pages
    return result.text
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 4000) // max 4000 caractères par doc
  } catch (e) {
    console.error('Erreur extraction PDF:', e)
    return '[Texte non extractible]'
  }
}

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

    // Récupérer l'analyse originale
    const { data: analyse, error: analyseError } = await supabaseAdmin
      .from('analyses')
      .select('rapport_complet, ville, type_bien, analyse_complementaire')
      .eq('id', analyse_id)
      .single()

    if (analyseError || !analyse) {
      console.error('Analyse introuvable:', analyseError, 'analyse_id:', analyse_id)
      return NextResponse.json({ error: 'Analyse introuvable' }, { status: 404 })
    }

    // Compter les analyses docs existantes
    const { count: nbActuel } = await supabaseAdmin
      .from('documents')
      .select('id', { count: 'exact', head: true })
      .eq('analyse_id', analyse_id)

    if ((nbActuel || 0) >= 3) {
      return NextResponse.json({ error: 'Limite de 3 analyses par bien atteinte' }, { status: 429 })
    }

    const rapportOriginal = analyse.rapport_complet

    // Extraire le texte de chaque document
    const docsTextes: string[] = []
    for (const doc of documents) {
      if (doc.base64) {
        if (doc.media_type === 'application/pdf') {
          const texte = await extraireTextePDF(doc.base64)
          docsTextes.push(`=== ${doc.type.toUpperCase()} : ${doc.nom_fichier} ===\n${texte}`)
        } else {
          docsTextes.push(`=== ${doc.type.toUpperCase()} : ${doc.nom_fichier} ===\n[Document image]`)
        }
      }
    }

    const prompt = `Tu es NIDO, expert immobilier français. Voici l'analyse initiale d'un bien :

SCORE INITIAL : ${rapportOriginal?.scores?.global}/10
VERDICT INITIAL : ${rapportOriginal?.verdict?.decision} — ${rapportOriginal?.verdict?.resume}
ALERTES INITIALES : ${rapportOriginal?.alertes?.map((a: any) => `${a.categorie}: ${a.observation}`).join(' | ')}

Documents techniques fournis après visite :

${docsTextes.join('\n\n')}

Analyse ces documents et génère :
1. Les nouvelles observations par document
2. Les points qui CONFIRMENT ou CONTREDISENT l'analyse initiale
3. Un score révisé (peut augmenter ou baisser selon ce que révèlent les docs)
4. Une recommandation finale mise à jour

IMPORTANT : Texte brut uniquement. N'utilise JAMAIS de markdown (**gras**, *italique*).

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

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-5',
      max_tokens: 2000,
      temperature: 0.3,
      messages: [{ role: 'user', content: prompt }]
    })

    const text = response.content.map((b: any) => b.text || '').join('')
    const cleanText = text.replace(/```json|```/g, '').trim()
    const analyseComplementaire = JSON.parse(cleanText)

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

    // Mettre à jour l'analyse
    await supabaseAdmin
      .from('analyses')
      .update({
        score_global: analyseComplementaire.score_revise,
        decision: analyseComplementaire.verdict_revise?.decision,
        verdict_resume: analyseComplementaire.verdict_revise?.resume,
        analyse_complementaire: analyseComplementaire,
        has_docs: true,
        nb_analyses_docs: (nbActuel ?? 0) + 1
      })
      .eq('id', analyse_id)

    return NextResponse.json({ success: true, analyseComplementaire, nb_analyses_docs: (nbActuel ?? 0) + 1 })

  } catch (error: any) {
    console.error('Erreur analyse docs:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
