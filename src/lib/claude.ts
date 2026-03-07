import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

interface AnnonceInput {
  texte: string
  dpe?: string
  ges?: string
  prix?: string
  surface?: string
  ville?: string
  typeBien?: string
  profilAcheteur?: string
  assainissement?: string
  anneeConstruction?: string
  photos: string[]
}

export async function analyserAnnonce(annonce: AnnonceInput) {
  const { texte, dpe, ges, prix, surface, ville, typeBien, profilAcheteur, assainissement, anneeConstruction, photos } = annonce

  const imagesContent = photos.slice(0, 16).map(dataUrl => {
    const [header, data] = dataUrl.split(',')
    const mediaType = header.match(/:(.*?);/)?.[1] || 'image/jpeg'
    return {
      type: 'image' as const,
      source: {
        type: 'base64' as const,
        media_type: mediaType as 'image/jpeg' | 'image/png' | 'image/webp' | 'image/gif',
        data
      }
    }
  })

  const prixM2 = prix && surface ? Math.round(parseInt(prix) / parseInt(surface)) : null
  const today = new Date().toLocaleDateString('fr-FR')

  const message = await client.messages.create({
    model: 'claude-sonnet-4-5',
    max_tokens: 5000,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: `Tu es NIDO, un expert immobilier et expert en bâtiment français, bienveillant mais totalement honnête.
Date : ${today}

PROFIL DE L'ACHETEUR : ${profilAcheteur || 'non précisé'}
TYPE DE BIEN : ${typeBien || 'non précisé'}

DONNÉES DE L'ANNONCE :
${prix ? `Prix demandé : ${prix} €` : ''}
${surface ? `Surface : ${surface} m²` : ''}
${prixM2 ? `Prix au m² annonce : ${prixM2} €/m²` : ''}
${ville ? `Localisation : ${ville}` : ''}
${anneeConstruction ? `Année de construction : ${anneeConstruction}` : ''}
${dpe ? `Classe DPE : ${dpe}` : ''}
${ges ? `Classe GES : ${ges}` : ''}
${assainissement ? `Assainissement : ${assainissement}` : ''}

TEXTE DE L'ANNONCE :
${texte}

${imagesContent.length > 0 ? `${imagesContent.length} photo(s) jointes.` : 'Aucune photo.'}

---

INSTRUCTIONS DE SCORING (applique ces critères fixes, sans variation) :

Score DPE → A:10, B:8, C:6, D:4, E:2, F:1, G:0
Score état général → déduit des photos et du texte (0-10)
Score rapport qualité/prix → basé sur écart prix marché (0-10)
Score potentiel → localisation + foncier + évolutivité (0-10)
Score global = moyenne des 4 sous-scores, arrondie à 0.5

Seuils verdict :
- Score ≥ 7 → ACHETER
- Score 5-6.5 → NÉGOCIER  
- Score < 5 → FUIR

---

Génère une analyse SYNTHÉTIQUE et DIRECTE. Chaque point = 1-2 phrases max.
Pas de remplissage, pas de langue de bois.

Réponds UNIQUEMENT en JSON valide avec exactement cette structure :

{
  "verdict": {
    "decision": "ACHETER" | "NÉGOCIER" | "FUIR",
    "prix_recommande": number,
    "prix_max_a_ne_pas_depasser": number,
    "resume": "3 lignes max, direct et honnête"
  },
  "scores": {
    "global": number,
    "etat_bati": number,
    "rapport_qualite_prix": number,
    "potentiel": number,
    "dpe": number
  },
  "alertes": [
    {
      "niveau": "rouge" | "orange" | "vert",
      "categorie": string,
      "observation": string
    }
  ],
  "analyse_photos": {
    "zone": "observation 1-2 phrases"
  },
  "budget": {
    "prix_demande": number,
    "frais_notaire": number,
    "travaux_min": number,
    "travaux_max": number,
    "total_min": number,
    "total_max": number,
    "detail_travaux": [
      {
        "poste": string,
        "min": number,
        "max": number,
        "urgence": "immédiat" | "court terme" | "moyen terme",
        "aides": string | null
      }
    ]
  },
  "marche": {
    "prix_m2_annonce": number | null,
    "prix_m2_marche_bas": number | null,
    "prix_m2_marche_haut": number | null,
    "evaluation": "sous-évalué" | "correct" | "surévalué",
    "commentaire": string
  },
  "assainissement": {
    "type": string,
    "observations": string,
    "cout_mise_conformite_min": number | null,
    "cout_mise_conformite_max": number | null
  } | null,
  "negociation": [
    {
      "nom": string,
      "prix": number,
      "remise_pct": number,
      "strategie": string,
      "risque": "faible" | "moyen" | "élevé"
    }
  ],
  "visite": [
    {
      "priorite": number,
      "point": string,
      "quoi_verifier": string
    }
  ],
  "dpe_analyse": {
    "cout_annuel_estime": string,
    "travaux_pour_classe_b": string,
    "retour_investissement": string
  }
}

Règles strictes :
- marche.prix_m2_marche_bas et prix_m2_marche_haut : utilise tes connaissances du marché immobilier français pour ${ville || 'cette zone'} en ${new Date().getFullYear()}. Si tu ne connais pas précisément, donne une fourchette réaliste basée sur le type de bien et la région.
- assainissement : si fosse septique, évalue le coût de mise en conformité SPANC (500€ à 15 000€ selon état)
- negociation : exactement 3 scénarios nommés "Coup de cœur", "Négociation argumentée", "Offre basse"
- visite : exactement 10 points, triés par priorité
- Ne jamais inventer des données non fournies sauf pour prix marché et estimations travaux
- Tous les montants en euros, sans symbole dans le JSON`
          },
          ...imagesContent
        ]
      }
    ]
  })

  const raw = message.content[0].type === 'text'
    ? message.content[0].text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    : ''

  return JSON.parse(raw)
}
