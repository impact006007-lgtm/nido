import { Document, Page, Text, View, StyleSheet, Font, pdf } from '@react-pdf/renderer'

// Styles
const styles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    backgroundColor: '#f5f2ed',
    padding: 0,
  },

  // Header
  header: {
    backgroundColor: '#1a1814',
    paddingHorizontal: 40,
    paddingVertical: 28,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  logo: {
    fontSize: 36,
    color: '#ffffff',
    letterSpacing: -0.5,
    fontFamily: 'Helvetica-Bold',
  },
  logoAccent: {
    color: '#8b6914',
  },
  headerRight: {
    alignItems: 'flex-end',
  },
  headerDate: {
    fontSize: 9,
    color: 'rgba(255,255,255,0.4)',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  headerAdresse: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.7)',
  },

  // Verdict banner
  verdictBanner: {
    paddingHorizontal: 40,
    paddingVertical: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  verdictLeft: {},
  verdictDecision: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  verdictPrix: {
    fontSize: 32,
    fontFamily: 'Helvetica-Bold',
    color: '#1a1814',
    letterSpacing: -0.5,
  },
  verdictPrixMax: {
    fontSize: 9,
    color: '#8a7d6b',
    marginTop: 2,
  },
  verdictResume: {
    fontSize: 10,
    color: '#4a4035',
    lineHeight: 1.6,
    maxWidth: 280,
    fontStyle: 'italic',
  },
  scoreCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#1a1814',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreNum: {
    fontSize: 28,
    fontFamily: 'Helvetica-Bold',
    color: '#ffffff',
    lineHeight: 1,
  },
  scoreDenom: {
    fontSize: 10,
    color: '#8b6914',
  },

  // Body
  body: {
    paddingHorizontal: 40,
    paddingBottom: 40,
  },

  // Scores row
  scoresRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  scoreBox: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 10,
    alignItems: 'center',
    border: '1pt solid #e8e2d9',
  },
  scoreBoxLabel: {
    fontSize: 7,
    color: '#a09480',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  scoreBoxVal: {
    fontSize: 20,
    fontFamily: 'Helvetica-Bold',
    lineHeight: 1,
  },
  scoreBoxMax: {
    fontSize: 8,
    color: '#c4b99a',
  },

  // Section card
  sectionCard: {
    backgroundColor: '#ffffff',
    borderRadius: 10,
    marginBottom: 10,
    border: '1pt solid #e8e2d9',
    overflow: 'hidden',
  },
  sectionHead: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottom: '1pt solid #f5f2ed',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  sectionBody: {
    padding: 14,
  },

  // Alerte items
  alerteItem: {
    flexDirection: 'row',
    gap: 10,
    paddingVertical: 6,
    borderBottom: '1pt solid #f8f5f0',
    alignItems: 'flex-start',
  },
  alerteDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    marginTop: 3,
  },
  alerteCat: {
    fontSize: 8,
    color: '#a09480',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    width: 90,
    flexShrink: 0,
  },
  alerteText: {
    fontSize: 9,
    color: '#2d2a24',
    lineHeight: 1.5,
    flex: 1,
  },

  // Budget table
  tableHeader: {
    flexDirection: 'row',
    paddingBottom: 6,
    borderBottom: '1pt solid #e8e2d9',
    marginBottom: 4,
  },
  tableHeaderCell: {
    fontSize: 7,
    color: '#a09480',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    fontFamily: 'Helvetica-Bold',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 5,
    borderBottom: '1pt solid #f8f5f0',
    alignItems: 'flex-start',
  },
  tableCell: {
    fontSize: 9,
    color: '#2d2a24',
  },
  col1: { flex: 3 },
  col2: { flex: 1.5, textAlign: 'right' },
  col3: { flex: 1.5, textAlign: 'right' },
  col4: { flex: 1.5, textAlign: 'right' },

  // Marché boxes
  marcheRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  marcheBox: {
    flex: 1,
    backgroundColor: '#faf8f5',
    borderRadius: 6,
    padding: 10,
    alignItems: 'center',
    border: '1pt solid #ede8e0',
  },
  marcheLabel: {
    fontSize: 7,
    color: '#a09480',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 3,
  },
  marcheVal: {
    fontSize: 18,
    fontFamily: 'Helvetica-Bold',
    color: '#1a1814',
    lineHeight: 1,
  },
  marcheUnit: {
    fontSize: 7,
    color: '#a09480',
  },

  // Négociation
  negoRow: {
    flexDirection: 'row',
    gap: 8,
  },
  negoCard: {
    flex: 1,
    backgroundColor: '#faf8f5',
    borderRadius: 8,
    padding: 12,
    border: '1pt solid #ede8e0',
  },
  negoNom: {
    fontSize: 7,
    color: '#8a7d6b',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 5,
    fontFamily: 'Helvetica-Bold',
  },
  negoPrix: {
    fontSize: 20,
    fontFamily: 'Helvetica-Bold',
    color: '#1a1814',
    lineHeight: 1,
    marginBottom: 2,
  },
  negoRemise: {
    fontSize: 9,
    color: '#8b6914',
    fontFamily: 'Helvetica-Bold',
    marginBottom: 6,
  },
  negoStrat: {
    fontSize: 8,
    color: '#4a4035',
    lineHeight: 1.5,
    marginBottom: 5,
  },
  negoRisque: {
    fontSize: 7,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    fontFamily: 'Helvetica-Bold',
  },

  // Visite
  visiteItem: {
    flexDirection: 'row',
    gap: 10,
    paddingVertical: 6,
    borderBottom: '1pt solid #f8f5f0',
    alignItems: 'flex-start',
  },
  visiteNum: {
    fontSize: 16,
    color: '#e8e2d9',
    fontFamily: 'Helvetica-Bold',
    width: 20,
    flexShrink: 0,
    lineHeight: 1,
  },
  visitePoint: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    color: '#1a1814',
    marginBottom: 2,
  },
  visiteDetail: {
    fontSize: 8,
    color: '#8a7d6b',
    lineHeight: 1.5,
  },

  // Photo analyse grid
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  photoZone: {
    width: '47%',
    backgroundColor: '#faf8f5',
    borderRadius: 6,
    padding: 10,
    border: '1pt solid #ede8e0',
    marginBottom: 4,
  },
  photoZoneTitle: {
    fontSize: 7,
    color: '#8a7d6b',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 4,
    fontFamily: 'Helvetica-Bold',
  },
  photoZoneText: {
    fontSize: 8,
    color: '#4a4035',
    lineHeight: 1.5,
  },

  // DPE
  dpeRow: {
    flexDirection: 'row',
    gap: 8,
  },
  dpeBox: {
    flex: 1,
    backgroundColor: '#faf8f5',
    borderRadius: 6,
    padding: 10,
    border: '1pt solid #ede8e0',
  },
  dpeLabel: {
    fontSize: 7,
    color: '#a09480',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  dpeText: {
    fontSize: 8,
    color: '#2d2a24',
    lineHeight: 1.5,
  },

  // Footer
  footer: {
    position: 'absolute',
    bottom: 20,
    left: 40,
    right: 40,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 7,
    color: '#c4b99a',
    letterSpacing: 0.5,
  },

  // Colors
  rouge: { color: '#dc2626' },
  orange: { color: '#f97316' },
  vert: { color: '#16a34a' },
  bleu: { color: '#1d4ed8' },
  or: { color: '#92400e' },
  ardoise: { color: '#475569' },
})

function scoreColor(s: number) {
  return s >= 7 ? '#16a34a' : s >= 5 ? '#d97706' : '#dc2626'
}

function verdictColor(d: string) {
  return d === 'ACHETER' ? '#16a34a' : d === 'FUIR' ? '#dc2626' : '#d97706'
}

function dotColor(niveau: string) {
  return niveau === 'rouge' ? '#dc2626' : niveau === 'orange' ? '#f97316' : '#16a34a'
}

function risqueColor(r: string) {
  return r === 'faible' ? '#16a34a' : r === 'moyen' ? '#f97316' : '#dc2626'
}

export function NidoPDFDocument({ data, ville, typeBien }: { data: any, ville?: string, typeBien?: string }) {
  const v = data.verdict
  const decision = v?.decision || 'NÉGOCIER'
  const today = new Date().toLocaleDateString('fr-FR')

  return (
    <Document title="Rapport NIDO" author="NIDO" subject="Analyse immobilière">
      <Page size="A4" style={styles.page}>

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.logo}>NIDO</Text>
          <View style={styles.headerRight}>
            <Text style={styles.headerDate}>Rapport d'analyse · {today}</Text>
            {ville && <Text style={styles.headerAdresse}>{ville}{typeBien ? ` · ${typeBien}` : ''}</Text>}
          </View>
        </View>

        {/* Verdict banner */}
        <View style={[styles.verdictBanner, { backgroundColor: decision === 'ACHETER' ? '#f0fdf4' : decision === 'FUIR' ? '#fef2f2' : '#fffbeb' }]}>
          <View style={styles.verdictLeft}>
            <Text style={[styles.verdictDecision, { color: verdictColor(decision) }]}>
              {decision === 'ACHETER' ? '✓ ' : decision === 'FUIR' ? '✕ ' : '~ '}{decision}
            </Text>
            {v?.prix_recommande && (
              <>
                <Text style={styles.verdictPrix}>{v.prix_recommande.toLocaleString('fr-FR')} €</Text>
                {v.prix_max_a_ne_pas_depasser && (
                  <Text style={styles.verdictPrixMax}>Ne pas dépasser {v.prix_max_a_ne_pas_depasser.toLocaleString('fr-FR')} €</Text>
                )}
              </>
            )}
          </View>
          <View>
            {v?.resume && <Text style={styles.verdictResume}>« {v.resume} »</Text>}
          </View>
          {data.scores && (
            <View style={styles.scoreCircle}>
              <Text style={styles.scoreNum}>{data.scores.global}</Text>
              <Text style={styles.scoreDenom}>/10</Text>
            </View>
          )}
        </View>

        <View style={styles.body}>

          {/* Scores */}
          {data.scores && (
            <View style={styles.scoresRow}>
              {[
                { label: 'État bâti', key: 'etat_bati' },
                { label: 'Qualité/Prix', key: 'rapport_qualite_prix' },
                { label: 'Potentiel', key: 'potentiel' },
                { label: 'DPE', key: 'dpe' },
              ].map(({ label, key }) => (
                <View key={key} style={styles.scoreBox}>
                  <Text style={styles.scoreBoxLabel}>{label}</Text>
                  <Text style={[styles.scoreBoxVal, { color: scoreColor(data.scores[key]) }]}>
                    {data.scores[key]}<Text style={styles.scoreBoxMax}>/10</Text>
                  </Text>
                </View>
              ))}
            </View>
          )}

          {/* Alertes */}
          {data.alertes?.length > 0 && (
            <View style={styles.sectionCard}>
              <View style={styles.sectionHead}>
                <Text style={[styles.sectionTitle, styles.rouge]}>Alertes prioritaires</Text>
              </View>
              <View style={styles.sectionBody}>
                {data.alertes.map((a: any, i: number) => (
                  <View key={i} style={[styles.alerteItem, i === data.alertes.length - 1 ? { borderBottom: 'none' } : {}]}>
                    <View style={[styles.alerteDot, { backgroundColor: dotColor(a.niveau) }]} />
                    <Text style={styles.alerteCat}>{a.categorie}</Text>
                    <Text style={styles.alerteText}>{a.observation}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Marché */}
          {data.marche && (
            <View style={styles.sectionCard}>
              <View style={styles.sectionHead}>
                <Text style={[styles.sectionTitle, styles.bleu]}>Prix de marché</Text>
              </View>
              <View style={styles.sectionBody}>
                <View style={styles.marcheRow}>
                  <View style={styles.marcheBox}>
                    <Text style={styles.marcheLabel}>Annonce</Text>
                    <Text style={styles.marcheVal}>{data.marche.prix_m2_annonce?.toLocaleString('fr-FR') || '—'}</Text>
                    <Text style={styles.marcheUnit}>€/m²</Text>
                  </View>
                  <View style={styles.marcheBox}>
                    <Text style={styles.marcheLabel}>Marché bas</Text>
                    <Text style={styles.marcheVal}>{data.marche.prix_m2_marche_bas?.toLocaleString('fr-FR') || '—'}</Text>
                    <Text style={styles.marcheUnit}>€/m²</Text>
                  </View>
                  <View style={styles.marcheBox}>
                    <Text style={styles.marcheLabel}>Marché haut</Text>
                    <Text style={styles.marcheVal}>{data.marche.prix_m2_marche_haut?.toLocaleString('fr-FR') || '—'}</Text>
                    <Text style={styles.marcheUnit}>€/m²</Text>
                  </View>
                </View>
                {data.marche.commentaire && <Text style={{ fontSize: 9, color: '#4a4035', lineHeight: 1.5 }}>{data.marche.commentaire}</Text>}
              </View>
            </View>
          )}

          {/* Budget */}
          {data.budget && (
            <View style={styles.sectionCard}>
              <View style={styles.sectionHead}>
                <Text style={[styles.sectionTitle, styles.or]}>Budget total réel</Text>
                <Text style={{ marginLeft: 'auto', fontSize: 14, fontFamily: 'Helvetica-Bold', color: '#1a1814' }}>
                  {data.budget.total_min?.toLocaleString('fr-FR')} € — {data.budget.total_max?.toLocaleString('fr-FR')} €
                </Text>
              </View>
              <View style={styles.sectionBody}>
                <View style={styles.tableHeader}>
                  <Text style={[styles.tableHeaderCell, styles.col1]}>Poste</Text>
                  <Text style={[styles.tableHeaderCell, styles.col2]}>Min</Text>
                  <Text style={[styles.tableHeaderCell, styles.col3]}>Max</Text>
                  <Text style={[styles.tableHeaderCell, styles.col4]}>Urgence</Text>
                </View>
                <View style={styles.tableRow}>
                  <Text style={[styles.tableCell, styles.col1]}>Prix d'achat</Text>
                  <Text style={[styles.tableCell, styles.col2]}>{data.budget.prix_demande?.toLocaleString('fr-FR')} €</Text>
                  <Text style={[styles.tableCell, styles.col3]}>—</Text>
                  <Text style={[styles.tableCell, styles.col4]}></Text>
                </View>
                <View style={styles.tableRow}>
                  <Text style={[styles.tableCell, styles.col1]}>Frais de notaire</Text>
                  <Text style={[styles.tableCell, styles.col2]}>{data.budget.frais_notaire?.toLocaleString('fr-FR')} €</Text>
                  <Text style={[styles.tableCell, styles.col3]}>—</Text>
                  <Text style={[styles.tableCell, styles.col4]}></Text>
                </View>
                {data.budget.detail_travaux?.map((t: any, i: number) => (
                  <View key={i} style={styles.tableRow}>
                    <Text style={[styles.tableCell, styles.col1]}>{t.poste}</Text>
                    <Text style={[styles.tableCell, styles.col2]}>{t.min?.toLocaleString('fr-FR')} €</Text>
                    <Text style={[styles.tableCell, styles.col3]}>{t.max?.toLocaleString('fr-FR')} €</Text>
                    <Text style={[styles.tableCell, styles.col4, { color: t.urgence === 'immédiat' ? '#dc2626' : t.urgence === 'court terme' ? '#f97316' : '#16a34a' }]}>{t.urgence}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Négociation */}
          {data.negociation?.length > 0 && (
            <View style={styles.sectionCard}>
              <View style={styles.sectionHead}>
                <Text style={[styles.sectionTitle, styles.ardoise]}>Scénarios de négociation</Text>
              </View>
              <View style={[styles.sectionBody]}>
                <View style={styles.negoRow}>
                  {data.negociation.map((n: any, i: number) => (
                    <View key={i} style={styles.negoCard}>
                      <Text style={styles.negoNom}>{n.nom}</Text>
                      <Text style={styles.negoPrix}>{n.prix?.toLocaleString('fr-FR')} €</Text>
                      <Text style={styles.negoRemise}>-{n.remise_pct}%</Text>
                      <Text style={styles.negoStrat}>{n.strategie}</Text>
                      <Text style={[styles.negoRisque, { color: risqueColor(n.risque) }]}>Risque {n.risque}</Text>
                    </View>
                  ))}
                </View>
              </View>
            </View>
          )}

          {/* Analyse photos */}
          {data.analyse_photos && typeof data.analyse_photos === 'object' && (
            <View style={styles.sectionCard}>
              <View style={styles.sectionHead}>
                <Text style={[styles.sectionTitle, styles.ardoise]}>Analyse visuelle</Text>
              </View>
              <View style={styles.sectionBody}>
                <View style={styles.photoGrid}>
                  {Object.entries(data.analyse_photos).map(([zone, texte]) => (
                    <View key={zone} style={styles.photoZone}>
                      <Text style={styles.photoZoneTitle}>{zone}</Text>
                      <Text style={styles.photoZoneText}>{String(texte)}</Text>
                    </View>
                  ))}
                </View>
              </View>
            </View>
          )}

          {/* DPE */}
          {data.dpe_analyse && (
            <View style={styles.sectionCard}>
              <View style={styles.sectionHead}>
                <Text style={[styles.sectionTitle, styles.vert]}>Énergie & DPE</Text>
              </View>
              <View style={styles.sectionBody}>
                <View style={styles.dpeRow}>
                  <View style={styles.dpeBox}>
                    <Text style={styles.dpeLabel}>Coût annuel estimé</Text>
                    <Text style={styles.dpeText}>{data.dpe_analyse.cout_annuel_estime}</Text>
                  </View>
                  <View style={styles.dpeBox}>
                    <Text style={styles.dpeLabel}>Travaux pour classe B</Text>
                    <Text style={styles.dpeText}>{data.dpe_analyse.travaux_pour_classe_b}</Text>
                  </View>
                  <View style={styles.dpeBox}>
                    <Text style={styles.dpeLabel}>Retour investissement</Text>
                    <Text style={styles.dpeText}>{data.dpe_analyse.retour_investissement}</Text>
                  </View>
                </View>
              </View>
            </View>
          )}

          {/* Visite */}
          {data.visite?.length > 0 && (
            <View style={styles.sectionCard}>
              <View style={styles.sectionHead}>
                <Text style={[styles.sectionTitle, styles.bleu]}>Points à vérifier en visite</Text>
              </View>
              <View style={styles.sectionBody}>
                {data.visite.map((v: any, i: number) => (
                  <View key={i} style={[styles.visiteItem, i === data.visite.length - 1 ? { borderBottom: 'none' } : {}]}>
                    <Text style={styles.visiteNum}>{v.priorite || i + 1}</Text>
                    <View>
                      <Text style={styles.visitePoint}>{v.point}</Text>
                      <Text style={styles.visiteDetail}>{v.quoi_verifier}</Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          )}

        </View>

        {/* Footer */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>NIDO · Analyse immobilière par IA · {today}</Text>
          <Text style={styles.footerText}>Outil d'aide à la décision — ne remplace pas un diagnostic certifié</Text>
        </View>

      </Page>
    </Document>
  )
}

export async function genererPDF(data: any, ville?: string, typeBien?: string): Promise<void> {
  const blob = await pdf(<NidoPDFDocument data={data} ville={ville} typeBien={typeBien} />).toBlob()
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `NIDO-rapport-${new Date().toISOString().split('T')[0]}.pdf`
  a.click()
  URL.revokeObjectURL(url)
}
