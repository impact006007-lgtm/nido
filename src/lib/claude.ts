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
  profil?: {
    nom?: string
    projet?: string
    zone?: string
    priorite?: string
    budget_max?: number | null
    pieces_min?: number | null
    jardin?: boolean
    profil_acheteur?: string
    type_bien_prefere?: string
  } | null
}

export async function analyserAnnonce(annonce: AnnonceInput) {
  const { texte, dpe, ges, prix, surface, ville, typeBien, profilAcheteur, assainissement, anneeConstruction, photos, profil } = annonce

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
    temperature: 0.3,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: `Tu es NIDO, un expert immobilier et expert en bâtiment français, bienveillant mais totalement honnête.
Date : ${today}

PROFIL DE L'ACHETEUR : ${profil?.profil_acheteur === 'celibataire' ? 'Célibataire' : profil?.profil_acheteur === 'couple' ? 'Couple sans enfants' : profil?.profil_acheteur === 'famille' ? 'Famille avec enfants' : profil?.profil_acheteur === 'investisseur' ? 'Investisseur' : profilAcheteur || 'non précisé'}
${profil ? `
PROFIL PERSONNALISÉ ACTIF — adapte le scoring en conséquence :
- Projet : ${profil.projet === 'residence_principale' ? 'Résidence principale' : profil.projet === 'investissement' ? 'Investissement locatif' : profil.projet === 'vacances' ? 'Résidence secondaire' : 'Non précisé'}
- Zone souhaitée : ${profil.zone === 'urbain' ? 'Urbain' : profil.zone === 'peri_urbain' ? 'Péri-urbain' : profil.zone === 'rural' ? 'Rural' : 'Non précisé'}
- Priorité : ${profil.priorite === 'cle_en_main' ? 'Clé en main (pénalise les biens à rénover)' : profil.priorite === 'a_renover' ? 'À rénover (valorise le potentiel de rénovation)' : 'Peu importe'}
${profil.budget_max ? `- Budget max : ${profil.budget_max.toLocaleString('fr-FR')} € (pénalise si prix > budget)` : ''}
${profil.pieces_min ? `- Pièces minimum : ${profil.pieces_min} (pénalise si surface insuffisante)` : ''}
${profil.jardin ? `- Jardin obligatoire (valorise les biens avec extérieur, pénalise sans jardin)` : ''}

RÈGLES DE SCORING PERSONNALISÉ :
- Score potentiel : si zone annonce = zone souhaitée → bonus +1. Si incompatible → malus -1.5
- Score état bâti : si priorité "clé en main" → pénalise -1 pour chaque travaux importants. Si "à rénover" → bonus +1 pour potentiel de rénovation.
- Score qualité/prix : si prix > budget_max → malus -2. Si prix ≤ budget_max*0.85 → bonus +1.
- Score global : ajoute une note "Score générique : X/10 — Score avec votre profil : Y/10" dans le verdict.resume
` : 'Aucun profil personnalisé — scoring générique standard.'}
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

INSTRUCTIONS DE SCORING (critères stricts et non négociables) :

SCORE DPE (fixe, pas d'interprétation) :
A→10, B→8, C→6, D→4, E→2, F→1, G→0, inconnu→4

SCORE ÉTAT BÂTI (basé sur observations factuelles) :
- Neuf ou rénové entièrement, aucun travaux → 9-10
- Très bon état, rénovations récentes visibles → 7-8
- Bon état général, quelques travaux mineurs → 6-7
- État moyen, travaux importants à prévoir (toiture, façade) → 4-5
- Mauvais état, travaux lourds (structure, électricité) → 2-3
- Délabré → 0-1

SCORE RAPPORT QUALITÉ/PRIX (basé sur écart prix marché) :
- Prix > 15% sous marché → 9-10
- Prix 5-15% sous marché → 7-8
- Prix dans la moyenne marché (±5%) → 6
- Prix 5-10% au-dessus marché → 4-5
- Prix 10-20% au-dessus marché → 2-3
- Prix > 20% au-dessus marché → 0-1

SCORE POTENTIEL (localisation + dynamisme + évolutivité) :
- Métropole dynamique, foncier rare → 9-10
- Grande ville ou couronne métropolitaine → 7-8
- Ville moyenne avec bassin d'emploi correct → 6-7
- Zone péri-urbaine ou rural bien situé (< 30min ville) → 5-6
- Rural isolé, marché peu liquide → 4-5
- Zone sinistrée ou très isolée → 0-3

SCORE GLOBAL = moyenne arithmétique exacte des 4 scores, arrondie au 0.5 le plus proche.
Exemple : (6+7+6+5)/4 = 6.0 → 6.0

VERDICT (strict) :
- Score ≥ 7.0 → ACHETER
- Score 5.0 à 6.5 → NÉGOCIER
- Score < 5.0 → FUIR

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
