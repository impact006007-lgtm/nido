import { Document, Page, Text, View, StyleSheet, pdf } from '@react-pdf/renderer'

// Formatage des nombres — toLocaleString non fiable dans react-pdf
function fmt(n: number | undefined | null): string {
  if (n == null) return '—'
  return Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
}

const styles = StyleSheet.create({
  page: { fontFamily: 'Helvetica', backgroundColor: '#f5f2ed', paddingTop: 0 },
  pageContent: { paddingTop: 0 },
  header: { backgroundColor: '#1a1814', paddingHorizontal: 40, paddingVertical: 28, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  logo: { fontSize: 36, color: '#ffffff', fontFamily: 'Helvetica-Bold' },
  headerRight: { alignItems: 'flex-end' },
  headerDate: { fontSize: 9, color: 'rgba(255,255,255,0.4)', letterSpacing: 1, marginBottom: 2 },
  headerAdresse: { fontSize: 11, color: 'rgba(255,255,255,0.7)' },
  verdictBanner: { paddingHorizontal: 40, paddingVertical: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  verdictDecision: { fontSize: 11, fontFamily: 'Helvetica-Bold', letterSpacing: 1.5, marginBottom: 4 },
  verdictPrix: { fontSize: 32, fontFamily: 'Helvetica-Bold', color: '#1a1814' },
  verdictPrixMax: { fontSize: 9, color: '#8a7d6b', marginTop: 2 },
  verdictResume: { fontSize: 10, color: '#4a4035', lineHeight: 1.6, maxWidth: 260, fontStyle: 'italic' },
  scoreCircle: { width: 72, height: 72, borderRadius: 36, backgroundColor: '#1a1814', alignItems: 'center', justifyContent: 'center' },
  scoreNum: { fontSize: 28, fontFamily: 'Helvetica-Bold', color: '#ffffff', lineHeight: 1 },
  scoreDenom: { fontSize: 10, color: '#8b6914' },
  body: { paddingHorizontal: 40, paddingBottom: 16 },
  scoresRow: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  scoreBox: { flex: 1, backgroundColor: '#ffffff', borderRadius: 8, padding: 10, alignItems: 'center', border: '1pt solid #e8e2d9' },
  scoreBoxLabel: { fontSize: 7, color: '#a09480', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 4 },
  scoreBoxVal: { fontSize: 20, fontFamily: 'Helvetica-Bold', lineHeight: 1 },
  scoreBoxMax: { fontSize: 8, color: '#c4b99a' },
  sectionCard: { backgroundColor: '#ffffff', borderRadius: 10, marginBottom: 10, border: '1pt solid #e8e2d9', overflow: 'hidden' },
  sectionHead: { paddingHorizontal: 16, paddingVertical: 10, borderBottom: '1pt solid #f5f2ed', flexDirection: 'row', alignItems: 'center' },
  sectionTitle: { fontSize: 8, fontFamily: 'Helvetica-Bold', letterSpacing: 1, textTransform: 'uppercase' },
  sectionBody: { padding: 14 },
  alerteItem: { flexDirection: 'row', gap: 10, paddingVertical: 6, borderBottom: '1pt solid #f8f5f0', alignItems: 'flex-start' },
  alerteDot: { width: 5, height: 5, borderRadius: 3, marginTop: 3 },
  alerteCat: { fontSize: 8, color: '#a09480', textTransform: 'uppercase', letterSpacing: 0.5, width: 90, flexShrink: 0 },
  alerteText: { fontSize: 9, color: '#2d2a24', lineHeight: 1.5, flex: 1 },
  tableHeader: { flexDirection: 'row', paddingBottom: 6, borderBottom: '1pt solid #e8e2d9', marginBottom: 4 },
  tableHeaderCell: { fontSize: 7, color: '#a09480', letterSpacing: 0.8, textTransform: 'uppercase', fontFamily: 'Helvetica-Bold' },
  tableRow: { flexDirection: 'row', paddingVertical: 5, borderBottom: '1pt solid #f8f5f0', alignItems: 'flex-start' },
  tableCell: { fontSize: 9, color: '#2d2a24' },
  col1: { flex: 3 }, col2: { flex: 1.5, textAlign: 'right' }, col3: { flex: 1.5, textAlign: 'right' }, col4: { flex: 1.5, textAlign: 'right' },
  marcheRow: { flexDirection: 'row', gap: 8, marginBottom: 10 },
  marcheBox: { flex: 1, backgroundColor: '#faf8f5', borderRadius: 6, padding: 10, alignItems: 'center', border: '1pt solid #ede8e0' },
  marcheLabel: { fontSize: 7, color: '#a09480', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 3 },
  marcheVal: { fontSize: 18, fontFamily: 'Helvetica-Bold', color: '#1a1814', lineHeight: 1 },
  marcheUnit: { fontSize: 7, color: '#a09480' },
  negoRow: { flexDirection: 'row', gap: 8 },
  negoCard: { flex: 1, backgroundColor: '#faf8f5', borderRadius: 8, padding: 12, border: '1pt solid #ede8e0' },
  negoNom: { fontSize: 7, color: '#8a7d6b', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 5, fontFamily: 'Helvetica-Bold' },
  negoPrix: { fontSize: 20, fontFamily: 'Helvetica-Bold', color: '#1a1814', lineHeight: 1, marginBottom: 2 },
  negoRemise: { fontSize: 9, color: '#8b6914', fontFamily: 'Helvetica-Bold', marginBottom: 6 },
  negoStrat: { fontSize: 8, color: '#4a4035', lineHeight: 1.5, marginBottom: 5 },
  negoRisque: { fontSize: 7, textTransform: 'uppercase', letterSpacing: 0.8, fontFamily: 'Helvetica-Bold' },
  photoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  photoZone: { width: '47%', backgroundColor: '#faf8f5', borderRadius: 6, padding: 10, border: '1pt solid #ede8e0', marginBottom: 4 },
  photoZoneTitle: { fontSize: 7, color: '#8a7d6b', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 4, fontFamily: 'Helvetica-Bold' },
  photoZoneText: { fontSize: 8, color: '#4a4035', lineHeight: 1.5 },
  dpeRow: { flexDirection: 'row', gap: 8 },
  dpeBox: { flex: 1, backgroundColor: '#faf8f5', borderRadius: 6, padding: 10, border: '1pt solid #ede8e0' },
  dpeLabel: { fontSize: 7, color: '#a09480', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 4 },
  dpeText: { fontSize: 8, color: '#2d2a24', lineHeight: 1.5 },
  visiteItem: { flexDirection: 'row', gap: 10, paddingVertical: 6, borderBottom: '1pt solid #f8f5f0', alignItems: 'flex-start' },
  visiteNum: { fontSize: 16, color: '#e8e2d9', fontFamily: 'Helvetica-Bold', width: 20, flexShrink: 0, lineHeight: 1 },
  visitePoint: { fontSize: 9, fontFamily: 'Helvetica-Bold', color: '#1a1814', marginBottom: 2 },
  visiteDetail: { fontSize: 8, color: '#8a7d6b', lineHeight: 1.5 },
  footer: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 40, paddingVertical: 12, borderTop: '1pt solid #e8e2d9', marginTop: 8 },
  footerText: { fontSize: 7, color: '#c4b99a', letterSpacing: 0.5 },
})

function scoreColor(s: number) { return s >= 7 ? '#16a34a' : s >= 5 ? '#d97706' : '#dc2626' }
function verdictColor(d: string) { return d === 'ACHETER' ? '#16a34a' : d === 'FUIR' ? '#dc2626' : '#d97706' }
function dotColor(n: string) { return n === 'rouge' ? '#dc2626' : n === 'orange' ? '#f97316' : '#16a34a' }
function risqueColor(r: string) { return r === 'faible' ? '#16a34a' : r === 'moyen' ? '#f97316' : '#dc2626' }

export function NidoPDFDocument({ data, ville, typeBien }: { data: any, ville?: string, typeBien?: string }) {
  const v = data.verdict
  const decision = v?.decision || 'NÉGOCIER'
  const today = new Date().toLocaleDateString('fr-FR')

  return (
    <Document title="Rapport NIDO" author="NIDO">
      <Page size="A4" style={styles.page}>

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.logo}>NIDO</Text>
          <View style={styles.headerRight}>
            <Text style={styles.headerDate}>RAPPORT D'ANALYSE · {today}</Text>
            {ville && <Text style={styles.headerAdresse}>{ville}{typeBien ? ` · ${typeBien}` : ''}</Text>}
          </View>
        </View>

        {/* Verdict */}
        <View style={[styles.verdictBanner, { backgroundColor: decision === 'ACHETER' ? '#f0fdf4' : decision === 'FUIR' ? '#fef2f2' : '#fffbeb' }]}>
          <View>
            <Text style={[styles.verdictDecision, { color: verdictColor(decision) }]}>
              {decision === 'ACHETER' ? '✓ ' : decision === 'FUIR' ? '✕ ' : '~ '}{decision}
            </Text>
            {v?.prix_recommande && (
              <>
                <Text style={styles.verdictPrix}>{fmt(v.prix_recommande)} €</Text>
                {v.prix_max_a_ne_pas_depasser && (
                  <Text style={styles.verdictPrixMax}>Ne pas dépasser {fmt(v.prix_max_a_ne_pas_depasser)} €</Text>
                )}
              </>
            )}
          </View>
          {v?.resume && <Text style={styles.verdictResume}>« {v.resume} »</Text>}
          {data.scores && (
            <View style={styles.scoreCircle}>
              <Text style={styles.scoreNum}>{data.scores.global}</Text>
              <Text style={styles.scoreDenom}>/10</Text>
            </View>
          )}
        </View>

        {/* Espace en haut des pages suivantes */}
        <View style={{ height: 24, backgroundColor: '#f5f2ed' }} fixed />

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
            <View style={styles.sectionCard} wrap={false}>
              <View style={styles.sectionHead}>
                <Text style={[styles.sectionTitle, { color: '#dc2626' }]}>Alertes prioritaires</Text>
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
            <View style={styles.sectionCard} wrap={false}>
              <View style={styles.sectionHead}>
                <Text style={[styles.sectionTitle, { color: '#1d4ed8' }]}>Prix de marché</Text>
              </View>
              <View style={styles.sectionBody}>
                <View style={styles.marcheRow}>
                  <View style={styles.marcheBox}>
                    <Text style={styles.marcheLabel}>Annonce</Text>
                    <Text style={styles.marcheVal}>{fmt(data.marche.prix_m2_annonce)}</Text>
                    <Text style={styles.marcheUnit}>€/m²</Text>
                  </View>
                  <View style={styles.marcheBox}>
                    <Text style={styles.marcheLabel}>Marché bas</Text>
                    <Text style={styles.marcheVal}>{fmt(data.marche.prix_m2_marche_bas)}</Text>
                    <Text style={styles.marcheUnit}>€/m²</Text>
                  </View>
                  <View style={styles.marcheBox}>
                    <Text style={styles.marcheLabel}>Marché haut</Text>
                    <Text style={styles.marcheVal}>{fmt(data.marche.prix_m2_marche_haut)}</Text>
                    <Text style={styles.marcheUnit}>€/m²</Text>
                  </View>
                </View>
                {data.marche.commentaire && <Text style={{ fontSize: 9, color: '#4a4035', lineHeight: 1.5 }}>{data.marche.commentaire}</Text>}
              </View>
            </View>
          )}

          {/* Budget */}
          {data.budget && (
            <View style={styles.sectionCard} wrap={false}>
              <View style={styles.sectionHead}>
                <Text style={[styles.sectionTitle, { color: '#92400e' }]}>Budget total réel</Text>
                <Text style={{ marginLeft: 'auto', fontSize: 13, fontFamily: 'Helvetica-Bold', color: '#1a1814' }}>
                  {fmt(data.budget.total_min)} € — {fmt(data.budget.total_max)} €
                </Text>
              </View>
              <View style={styles.sectionBody}>
                <View style={styles.tableHeader}>
                  <Text style={[styles.tableHeaderCell, styles.col1]}>Poste</Text>
                  <Text style={[styles.tableHeaderCell, styles.col2]}>Min</Text>
                  <Text style={[styles.tableHeaderCell, styles.col3]}>Max</Text>
                  <Text style={[styles.tableHeaderCell, styles.col4]}>Urgence</Text>
                </View>
                <View style={styles.tableRow} wrap={false}>
                  <Text style={[styles.tableCell, styles.col1]}>Prix d'achat</Text>
                  <Text style={[styles.tableCell, styles.col2]}>{fmt(data.budget.prix_demande)} €</Text>
                  <Text style={[styles.tableCell, styles.col3]}>—</Text>
                  <Text style={[styles.tableCell, styles.col4]}></Text>
                </View>
                <View style={styles.tableRow} wrap={false}>
                  <Text style={[styles.tableCell, styles.col1]}>Frais de notaire</Text>
                  <Text style={[styles.tableCell, styles.col2]}>{fmt(data.budget.frais_notaire)} €</Text>
                  <Text style={[styles.tableCell, styles.col3]}>—</Text>
                  <Text style={[styles.tableCell, styles.col4]}></Text>
                </View>
                {data.budget.detail_travaux?.map((t: any, i: number) => (
                  <View key={i} style={styles.tableRow} wrap={false}>
                    <Text style={[styles.tableCell, styles.col1]}>{t.poste}</Text>
                    <Text style={[styles.tableCell, styles.col2]}>{fmt(t.min)} €</Text>
                    <Text style={[styles.tableCell, styles.col3]}>{fmt(t.max)} €</Text>
                    <Text style={[styles.tableCell, styles.col4, { color: t.urgence === 'immédiat' ? '#dc2626' : t.urgence === 'court terme' ? '#f97316' : '#16a34a' }]}>{t.urgence}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Négociation */}
          {data.negociation?.length > 0 && (
            <View style={styles.sectionCard} wrap={false}>
              <View style={styles.sectionHead}>
                <Text style={[styles.sectionTitle, { color: '#475569' }]}>Scénarios de négociation</Text>
              </View>
              <View style={styles.sectionBody}>
                <View style={styles.negoRow}>
                  {data.negociation.map((n: any, i: number) => (
                    <View key={i} style={styles.negoCard}>
                      <Text style={styles.negoNom}>{n.nom}</Text>
                      <Text style={styles.negoPrix}>{fmt(n.prix)} €</Text>
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
          {data.analyse_photos && (
            <View style={styles.sectionCard} wrap={true} minPresenceAhead={40}>
              <View style={styles.sectionHead}>
                <Text style={[styles.sectionTitle, { color: '#475569' }]}>Analyse visuelle</Text>
              </View>
              <View style={styles.sectionBody}>
                <View style={styles.photoGrid}>
                  {Array.isArray(data.analyse_photos) ? (
                    data.analyse_photos.map((piece: any, i: number) => (
                      <View key={i} style={[styles.photoZone, { marginBottom: 8 }]} wrap={false}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 }}>
                          <Text style={styles.photoZoneTitle}>{piece.piece}</Text>
                          <Text style={{ fontSize: 7, color: piece.etat === 'bon' ? '#16a34a' : piece.etat === 'a_renover' ? '#dc2626' : '#d97706', fontFamily: 'Helvetica-Bold' }}>
                            {piece.etat === 'bon' ? '✓ Bon état' : piece.etat === 'a_renover' ? '⚠ À rénover' : '◑ Correct'}
                          </Text>
                        </View>
                        <Text style={styles.photoZoneText}>{piece.observation}</Text>
                        {piece.points_attention?.length > 0 && (
                          <View style={{ marginTop: 3 }}>
                            {piece.points_attention.map((p: string, j: number) => (
                              <Text key={j} style={{ fontSize: 7, color: '#8a7d6b', marginBottom: 1 }}>· {p}</Text>
                            ))}
                          </View>
                        )}
                      </View>
                    ))
                  ) : (
                    Object.entries(data.analyse_photos).map(([zone, texte]) => (
                      <View key={zone} style={styles.photoZone}>
                        <Text style={styles.photoZoneTitle}>{zone}</Text>
                        <Text style={styles.photoZoneText}>{String(texte)}</Text>
                      </View>
                    ))
                  )}
                </View>
              </View>
            </View>
          )}

          {/* DPE */}
          {data.dpe_analyse && (
            <View style={styles.sectionCard} wrap={false}>
              <View style={styles.sectionHead}>
                <Text style={[styles.sectionTitle, { color: '#16a34a' }]}>Énergie & DPE</Text>
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
            <View style={styles.sectionCard} wrap={false}>
              <View style={styles.sectionHead}>
                <Text style={[styles.sectionTitle, { color: '#1d4ed8' }]}>Points à vérifier en visite</Text>
              </View>
              <View style={styles.sectionBody}>
                {data.visite.map((v: any, i: number) => (
                  <View key={i} wrap={false} style={[styles.visiteItem, i === data.visite.length - 1 ? { borderBottom: 'none' } : {}]}>
                    <Text style={styles.visiteNum}>{v.priorite || i + 1}</Text>
                    <View style={{ flex: 1 }}>
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
        <View style={styles.footer}>
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

// Document PDF après visite
function NidoPDFApresVisiteDocument({ data, ac, ville, typeBien }: { data: any, ac: any, ville?: string, typeBien?: string }) {
  const fmt = (n: number) => n ? n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ') : '—'
  const date = new Date().toLocaleDateString('fr-FR')
  const delta = ac?.delta_score || 0

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Spacer pages suivantes */}
        <View style={{ height: 24, backgroundColor: '#f5f2ed' }} fixed />

        {/* Header */}
        <View style={{ backgroundColor: '#1a1814', padding: 0 }}>
          <View style={{ paddingHorizontal: 40, paddingTop: 32, paddingBottom: 28 }}>
            <Text style={{ fontFamily: 'Helvetica-Bold', fontSize: 28, color: '#ffffff', letterSpacing: 2, marginBottom: 4 }}>NIDO</Text>
            <Text style={{ fontSize: 9, color: 'rgba(255,255,255,0.5)', letterSpacing: 1.5, textTransform: 'uppercase' }}>ANALYSE APRÈS VISITE · {date}</Text>
            <Text style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', marginTop: 8 }}>{ville || ''}{typeBien ? ` · ${typeBien}` : ''}</Text>
          </View>
        </View>

        <View style={styles.body}>
          {/* Score révisé */}
          <View style={[styles.sectionCard, { backgroundColor: delta >= 0 ? '#052e16' : '#1f0505', marginBottom: 12 }]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <View>
                <Text style={{ fontSize: 8, color: delta >= 0 ? '#4ade80' : '#f87171', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 6 }}>{ac?.verdict_revise?.decision}</Text>
                <Text style={{ fontFamily: 'Helvetica-Bold', fontSize: 40, color: '#ffffff' }}>
                  {ac?.score_revise}<Text style={{ fontSize: 14, color: '#8b6914' }}>/10</Text>
                </Text>
                <Text style={{ fontSize: 11, color: delta >= 0 ? '#4ade80' : '#f87171', marginTop: 4 }}>
                  {delta >= 0 ? '▲' : '▼'} {Math.abs(delta)} point{Math.abs(delta) > 1 ? 's' : ''} vs score initial ({data?.scores?.global}/10)
                </Text>
              </View>
            </View>
            {ac?.verdict_revise?.resume && (
              <Text style={{ fontSize: 10, color: 'rgba(255,255,255,0.6)', marginTop: 12, lineHeight: 1.6, borderTop: '1pt solid rgba(255,255,255,0.1)', paddingTop: 10 }}>
                {ac.verdict_revise.resume}
              </Text>
            )}
          </View>

          {/* Synthèse */}
          {ac?.synthese && (
            <View style={[styles.sectionCard, { marginBottom: 12 }]} wrap={false}>
              <Text style={[styles.sectionTitle, { marginBottom: 8 }]}>Synthèse</Text>
              <Text style={{ fontSize: 10, color: '#4a4035', lineHeight: 1.7, fontStyle: 'italic' }}>{ac.synthese}</Text>
            </View>
          )}

          {/* Nouvelles alertes */}
          {ac?.nouvelles_alertes?.length > 0 && (
            <View style={[styles.sectionCard, { marginBottom: 12 }]} wrap={false}>
              <View style={styles.sectionHead}>
                <Text style={[styles.sectionTitle, { color: '#dc2626' }]}>Nouvelles alertes — diagnostics</Text>
              </View>
              {ac.nouvelles_alertes.map((a: any, i: number) => (
                <View key={i} style={{ flexDirection: 'row', gap: 10, paddingVertical: 5, borderBottom: i < ac.nouvelles_alertes.length - 1 ? '0.5pt solid #f8f5f0' : 'none' }}>
                  <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: a.niveau === 'rouge' ? '#dc2626' : a.niveau === 'orange' ? '#f97316' : '#16a34a', marginTop: 3 }} />
                  <Text style={{ fontSize: 8, color: '#a09480', textTransform: 'uppercase', letterSpacing: 0.5, width: 80 }}>{a.categorie}</Text>
                  <Text style={{ fontSize: 9, color: '#2d2a24', flex: 1, lineHeight: 1.5 }}>{a.observation}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Observations par document */}
          {ac?.observations_docs?.map((obs: any, i: number) => (
            <View key={i} style={[styles.sectionCard, { marginBottom: 8 }]} wrap={false}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <Text style={{ fontFamily: 'Helvetica-Bold', fontSize: 10, color: '#1a1814' }}>{obs.nom}</Text>
                <Text style={{ fontSize: 8, color: obs.impact === 'positif' ? '#16a34a' : obs.impact === 'négatif' ? '#dc2626' : '#8a7d6b' }}>{obs.impact}</Text>
              </View>
              <Text style={{ fontSize: 9, color: '#4a4035', lineHeight: 1.6 }}>{obs.points_cles}</Text>
            </View>
          ))}

          {/* Rappel analyse initiale */}
          <View style={[styles.sectionCard, { backgroundColor: '#f5f2ed', marginTop: 8 }]} wrap={false}>
            <Text style={{ fontSize: 8, color: '#a09480', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>Rappel — Analyse initiale</Text>
            <Text style={{ fontSize: 10, color: '#4a4035', lineHeight: 1.6 }}>{data?.verdict?.resume}</Text>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>NIDO · Analyse après visite par IA · {date}</Text>
          <Text style={styles.footerText}>Outil d'aide à la décision — ne remplace pas un diagnostic certifié</Text>
        </View>
      </Page>
    </Document>
  )
}

export async function genererPDFApresVisite(data: any, ac: any, ville?: string, typeBien?: string): Promise<void> {
  const blob = await pdf(<NidoPDFApresVisiteDocument data={data} ac={ac} ville={ville} typeBien={typeBien} />).toBlob()
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `NIDO-apres-visite-${new Date().toISOString().split('T')[0]}.pdf`
  a.click()
  URL.revokeObjectURL(url)
}
