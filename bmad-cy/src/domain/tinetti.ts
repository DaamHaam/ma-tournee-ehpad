// Test de Tinetti (POMA, 28 points), libellés de la grille habituelle de l’utilisateur.
// Échelle adaptée d’après Tinetti M., J Am Geriatr Soc 1986;34:119-126.
// Types de tests rangés dans entries[id].tests : Tinetti (grille cotée) et bilan marche / équilibre (bilan flexible, domain/marcheEquilibre.ts).
export type TestType = 'tinetti' | 'marcheEquilibre'
export const TEST_TYPES: TestType[] = ['tinetti', 'marcheEquilibre']
// resultHtml : texte final validé (synthèse IA relue), prêt à copier ; effacé dès que la cotation ou la dictée change.
// choices / values : bilan flexible (choix multiples cochés ; textes, nombres et choix uniques), scores restant vide.
// ai* : dernière synthèse IA (observations rédigées, lignes à vérifier, lignes cotées par l’IA, dictée résumée), pour la revoir sans nouvel appel.
export interface AiCheck { row: string; reason: string }
export interface TestRecord { scores: Record<string, number>; notes: string; notesHtml?: string; resultHtml?: string; at: string; copied?: boolean; aiObservations?: string; aiChecks?: AiCheck[]; aiFilled?: string[]; aiSource?: string; choices?: string[]; values?: Record<string, string> }
export interface TestRow { id: string; sub?: string; options: { score: number; label: string }[] }
export interface TestItem { number: number; title: string; rows: TestRow[] }
export interface TestSection { id: 'equilibre' | 'marche'; title: string; instructions: string; items: TestItem[] }

const row = (id: string, ...labels: string[]): TestRow => ({ id, options: labels.map((label, score) => ({ score, label })) })
const sub = (id: string, name: string, ...labels: string[]): TestRow => ({ ...row(id, ...labels), sub: name })

export const TINETTI: TestSection[] = [
  { id: 'equilibre', title: 'Équilibre', instructions: 'Assise sur une chaise dure, sans accoudoirs, la personne testée effectue les manœuvres suivantes.', items: [
    { number: 1, title: 'Équilibre en position assise', rows: [row('e1', 'penche ou s’affale', 'position assise stable et sûre')] },
    { number: 2, title: 'Se mettre debout', rows: [row('e2', 'impossible sans aide', 'possible à l’aide d’un appui des bras', 'possible sans l’aide d’un appui des bras')] },
    { number: 3, title: 'Tentatives pour se mettre debout', rows: [row('e3', 'impossible sans aide', 'possible > 1 tentative', 'possible après 1 tentative')] },
    { number: 4, title: 'Équilibre debout (5 premières sec.)', rows: [row('e4', 'instable (vacille, bouge les pieds et le tronc)', 'stable avec appui (déambulateur, canne ou autre)', 'stable sans le moindre appui')] },
    { number: 5, title: 'Équilibre debout', rows: [row('e5', 'instable', 'stable, écart entre les pieds > 10 cm ou appui des bras', 'pieds joints, sans appui des bras')] },
    { number: 6, title: 'Poussée sur le sternum (3x, pieds joints)', rows: [row('e6', 'commence à vaciller', 'vacille mais se redresse', 'stable')] },
    { number: 7, title: 'Yeux fermés (pieds joints)', rows: [row('e7', 'instable', 'stable')] },
    { number: 8, title: 'Rotation de 360°', rows: [sub('e8a', 'Pas', 'petits pas irréguliers', 'petits pas réguliers'), sub('e8b', 'Stabilité', 'instable (vacille)', 'stable')] },
    { number: 9, title: 'S’asseoir', rows: [row('e9', 'peu sûr (tombe, calcule mal la distance)', 'utilise les bras', 'mouvements sûrs et aisés')] },
  ] },
  { id: 'marche', title: 'Marche', instructions: 'Debout avec l’examinateur dans un couloir ou une chambre, la personne marche d’abord à un rythme ordinaire, puis revient d’un pas plus rapide mais sûr (avec ses propres aides : canne ou cadre de marche).', items: [
    { number: 10, title: 'Se mettre en marche au premier signal', rows: [row('m10', 'hésitation ou diverses tentatives', 'sans hésitation')] },
    { number: 11, title: 'Longueur et hauteur du pas', rows: [
      sub('m11a', 'Pied D en mouvement', 'ne dépasse pas le pied G au repos', 'dépasse le pied G au repos'), sub('m11b', 'Pied D en mouvement', 'ne se détache pas du sol', 'se détache du sol'),
      sub('m11c', 'Pied G en mouvement', 'ne dépasse pas le pied D au repos', 'dépasse le pied D au repos'), sub('m11d', 'Pied G en mouvement', 'ne se détache pas du sol', 'se détache du sol'),
    ] },
    { number: 12, title: 'Symétrie du pas', rows: [row('m12', 'inégalité des pas G et D', 'égalité des pas G et D')] },
    { number: 13, title: 'Continuité du pas', rows: [row('m13', 'arrêts ou discontinuité des pas', 'les pas semblent continus')] },
    { number: 14, title: 'Marche déviante', rows: [row('m14', 'nette déviance', 'déviance moyenne ou utilisation d’une aide à la marche', 'marche droite sans aide')] },
    { number: 15, title: 'Tronc', rows: [row('m15', 'mouvement prononcé du tronc ou utilisation d’une aide à la marche', 'pas de mouvement du tronc mais flexion des genoux, du dos ou écartement des bras', 'droit sans aide à la marche')] },
    { number: 16, title: 'Écartement des pieds', rows: [row('m16', 'talons séparés', 'talons se touchant presque lors de la marche')] },
  ] },
]
export const TINETTI_INTERPRETATION = 'Un score inférieur à 26 signifie généralement qu’il y a un problème ; plus le score est bas, plus le problème est important. Un score inférieur à 19 signifie que le risque de chute est multiplié par cinq.'

const rowsOf = (section: TestSection) => section.items.flatMap(item => item.rows)
const rowMax = (testRow: TestRow) => Math.max(...testRow.options.map(option => option.score))

// Raccourci de cotation : toutes les lignes encore vides prennent leur cotation maximale (ou minimale) ; les lignes cochées ne bougent pas.
export function fillEmptyRows(scores: Record<string, number>, level: 'max' | 'min'): Record<string, number> {
  const filled = { ...scores }
  for (const testRow of TINETTI.flatMap(rowsOf)) if (filled[testRow.id] === undefined) filled[testRow.id] = level === 'max' ? rowMax(testRow) : Math.min(...testRow.options.map(option => option.score))
  return filled
}
export interface SectionScore { score: number; max: number; complete: boolean }
export function sectionScore(section: TestSection, scores: Record<string, number>): SectionScore {
  const rows = rowsOf(section)
  return { score: rows.reduce((sum, testRow) => sum + (scores[testRow.id] ?? 0), 0), max: rows.reduce((sum, testRow) => sum + rowMax(testRow), 0), complete: rows.every(testRow => scores[testRow.id] !== undefined) }
}
export interface TinettiScore { equilibre: SectionScore; marche: SectionScore; total: number; max: number; complete: boolean; missing: number[] }
export function tinettiScore(scores: Record<string, number>): TinettiScore {
  const [equilibre, marche] = TINETTI.map(section => sectionScore(section, scores))
  const missing = TINETTI.flatMap(section => section.items).filter(item => item.rows.some(testRow => scores[testRow.id] === undefined)).map(item => item.number)
  return { equilibre, marche, total: equilibre.score + marche.score, max: equilibre.max + marche.max, complete: !missing.length, missing }
}
// Interprétation de la grille, seulement pour une cotation complète.
export function tinettiInterpretation(score: TinettiScore): string {
  if (!score.complete) return ''
  if (score.total < 19) return 'Score inférieur à 19 : risque de chute multiplié par cinq.'
  if (score.total < 26) return 'Score inférieur à 26 : problème d’équilibre ou de marche.'
  return ''
}
// Résultat court, mis en forme, à copier dans le logiciel métier (notesHtml déjà filtré par l’appelant).
export function tinettiResultHtml(record: Pick<TestRecord, 'scores'>, notesHtml = ''): string {
  const score = tinettiScore(record.scores)
  const lines = [`<u><b>Tinetti</b></u> : <b>${score.total}/${score.max}</b> (équilibre ${score.equilibre.score}/${score.equilibre.max}, marche ${score.marche.score}/${score.marche.max})${score.complete ? '' : ' – cotation incomplète'}`]
  const interpretation = tinettiInterpretation(score)
  if (interpretation) lines.push(interpretation)
  if (!score.complete) lines.push(`Items non cotés : ${score.missing.join(', ')}.`)
  if (notesHtml.trim()) lines.push(notesHtml)
  return lines.join('<br>')
}
// Cotation valide pour une ligne de la grille (sert à filtrer les cotations proposées par l’IA).
export function validScore(row: string, score: unknown): score is number {
  const testRow = TINETTI.flatMap(section => section.items.flatMap(item => item.rows)).find(candidate => candidate.id === row)
  return !!testRow && typeof score === 'number' && testRow.options.some(option => option.score === score)
}
export function hasTestContent(record: Pick<TestRecord, 'scores' | 'notes' | 'choices' | 'values'> | undefined): boolean {
  return !!record && (Object.keys(record.scores).length > 0 || record.notes.trim() !== '' || !!record.choices?.length || Object.values(record.values ?? {}).some(value => value.trim() !== ''))
}
// Dernier test du même type, strictement antérieur à la journée, pour afficher les cotations précédentes.
export function previousTest(days: { date: string; entries: Record<string, { tests?: Partial<Record<TestType, TestRecord>> }> }[], id: string, date: string, type: TestType): { date: string; record: TestRecord } | null {
  let found: { date: string; record: TestRecord } | null = null
  for (const day of days) {
    const record = day.entries[id]?.tests?.[type]
    if (day.date < date && hasTestContent(record) && (!found || day.date > found.date)) found = { date: day.date, record: record! }
  }
  return found
}
