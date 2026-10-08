// Bilan marche / équilibre : bilan flexible (seuls les choix cochés et les champs remplis apparaissent dans le compte rendu).
// Repris de l’application DATALS (bilan_initial), libellés corrigés. Trois niveaux : le bilan, ses sous-modules (onglets),
// leurs rubriques. L’ordre du compte rendu est fixe et indépendant du rangement en onglets.
import { escapeHtml, htmlToText } from '../features/bilan/richText'
import type { TestRecord } from './tinetti'

// Un choix multiple coché est rangé dans choices sous l’identifiant `${clé}.${rang}` (rang dans la liste, à partir de 1) :
// ne jamais réordonner ni retirer une option, en ajouter seulement en fin de liste.
// Les autres champs (texte, nombre, choix unique, « Autre ») sont des chaînes dans values, sous leur clé.
export type FlexControl =
  | { kind: 'multi'; key: string; label?: string; options: string[] }
  | { kind: 'single'; key: string; label?: string; options: string[]; compact?: boolean }
  | { kind: 'number'; key: string; label: string; unit: string }
  | { kind: 'text'; key: string; label: string; long?: boolean }
// test : test standardisé suivi dans le temps (★ dernière mesure).
export interface FlexRubric { id: string; title: string; test?: boolean; controls: FlexControl[] }
export interface FlexModule { id: string; title: string; rubrics: FlexRubric[] }
export type FlexInput = Pick<TestRecord, 'choices' | 'values'>

export const otherKey = (key: string) => `${key}.autre`
export const choiceId = (key: string, index: number) => `${key}.${index + 1}`
const group = (id: string, title: string, options: string[]): FlexRubric => ({ id, title, controls: [{ kind: 'multi', key: id, options }, { kind: 'text', key: otherKey(id), label: 'Autre' }] })
const AIDS = ['rollator', 'canne simple', 'déambulateur 2 roues', 'canne anglaise']
const SCOPES: Record<string, string> = { Chambre: 'lui permettant de marcher dans sa chambre', Couloir: 'lui permettant de marcher dans le couloir de son étage', RDC: 'lui permettant de marcher jusqu’au rez-de-chaussée' }
export const MERGED_MEANS = { first: 'travail de l’équilibre', second: 'travail des réactions parachute', merged: 'travail de l’équilibre et des réactions parachute' }

export const MARCHE_EQUILIBRE: FlexModule[] = [
  { id: 'contexte', title: 'Contexte', rubrics: [
    group('contexte', 'Contexte', ['évaluation de suivi', 'arrivée récente dans la structure', 'entrée dans la structure pour perte d’autonomie à domicile', 'perte récente des capacités', 'altération de l’état général', 'chute récente', 'évolution de la pathologie', 'retour d’hospitalisation', 'attitudes vicieuses en station assise']),
    { id: 'atcd', title: 'Antécédents', controls: [{ kind: 'text', key: 'atcd', label: 'Antécédents', long: true }] },
    group('installation', 'Installation', ['au lit', 'au fauteuil confort', 'au fauteuil roulant', 'assis sur une chaise', 'station debout', 'avec contention', 'sans contention']),
    group('troublesComplementaires', 'Troubles complémentaires', ['déficit visuel', 'déficit auditif', 'troubles cognitifs', 'pas de compréhension des consignes simples', 'mais comprend les consignes simples', 'difficultés à s’exprimer', 'ralentissement psychomoteur']),
    group('troublesComportement', 'Troubles du comportement', ['manque d’intérêt (apathie)', 'lié à la pathologie neurologique', 'lié à la dépression', 'agressivité', 'agitation', 'opposition', 'trouble du comportement vocal (logorrhée)', 'déambulation excessive']),
  ] },
  { id: 'examen', title: 'Examen', rubrics: [
    group('raideurs', 'Raideurs', ['rétractions', 'aux membres inférieurs', 'aux membres supérieurs', 'perte de flexion dorsale de cheville environ 10°', 'flexum de genou environ 15-20°', 'flexum de hanche environ 15-20°', 'abduction de hanche limitée à 20°', 'élévation latérale d’épaule limitée à 80°', 'élévation antérieure d’épaule limitée à 80°', 'rotation latérale d’épaule limitée à 20°', 'extension du coude limitée à -20°']),
    group('douleur', 'Douleur', ['pas de douleur exprimée lors des transferts et de la marche', 'à la mobilisation', 'à la palpation', 'permanente', 'à l’appui à droite', 'à l’appui à gauche', 'douleurs rhumatismales', 'au rachis (tassement vertébral, canal lombaire étroit, arthrose, spondylolisthésis)', 'aux genoux', 'tassement']),
    { id: 'eva', title: 'EVA', controls: [{ kind: 'single', key: 'eva', options: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'], compact: true }, { kind: 'text', key: otherKey('eva'), label: 'Autre' }] },
  ] },
  { id: 'transferts', title: 'Transferts', rubrics: [
    group('verticalisation', 'Verticalisation', ['seul sans accoudoirs', 'seul avec accoudoirs', 'seul avec accoudoirs, mais une aide est recommandée', 'avec aide légère', 'avec aide modérée (un soignant nécessaire)', 'avec aide importante (deux soignants nécessaires)', 'plusieurs tentatives sont nécessaires', 'avec verticalisateur uniquement', 'avec lève-malade (impossibilité)', 'présence d’une rétropulsion modérée', 'présence d’une rétropulsion sévère']),
    { id: 'allongeAssis', title: 'Passage allongé-assis au bord du lit', controls: [{ kind: 'single', key: 'allongeAssis', options: ['réalisé seul', 'réalisé avec une aide légère', 'réalisé avec une aide modérée', 'réalisé avec une aide importante'] }] },
    { id: 'assisDebout30s', title: 'Assis-debout en 30s', test: true, controls: [{ kind: 'number', key: 'assisDebout30s', label: 'Passages', unit: 'passages' }] },
    group('passageDeboutAssis', 'Passage debout-assis', ['possible seul', 'impossible seul', 'utilise les accoudoirs', 'ne saisit pas les accoudoirs', 'précipitation', 'panique', 'tendance à la rétropulsion', 'perte du schéma moteur', 'risque de chute à ce moment']),
    group('transferts', 'Transferts et pivots', ['réalisés seul', 'réalisés seul mais avec risque de chute', 'réalisés seul avec rollator', 'réalisés avec rollator et un soignant', 'réalisés avec un soignant', 'réalisés avec deux soignants', 'réalisés avec verticalisateur', 'réalisés avec lève-malade', 'pivot possible', 'pivot difficile']),
    { id: 'tug', title: 'Timed Up and Go', test: true, controls: [{ kind: 'number', key: 'tug', label: 'Temps', unit: 'sec' }] },
    { id: 'stationDebout', title: 'Durée de maintien de la station debout', test: true, controls: [{ kind: 'number', key: 'stationDebout', label: 'Durée', unit: 'sec' }] },
  ] },
  { id: 'marche', title: 'Marche', rubrics: [
    group('marche', 'Marche', ['possible seul', 'possible seul mais avec risque de chute', 'possible avec une surveillance', 'possible avec une guidance', 'possible avec un soutien', 'possible avec deux soutiens', 'impossible']),
    group('aideTechnique', 'Aide technique', ['sans aide technique', 'sans aide technique. Une aide technique serait adaptée mais ne pense pas à la prendre.', 'sans aide technique, incapacité à reconnaître son utilité', 'avec une canne simple', 'avec une canne anglaise', 'avec un cadre de marche', 'avec un déambulateur 2 roues', 'avec un rollator']),
    group('marcheArriere', 'Marche arrière', ['possible', 'impossible', 'seul', 'avec un soignant', 'du fait de la rétropulsion', 'par perte du schéma moteur']),
    { id: 'perimetre', title: 'Périmètre de marche', test: true, controls: [
      { kind: 'single', key: 'perimetre.prefixe', options: ['supérieur à'], compact: true },
      { kind: 'number', key: 'perimetre.distance', label: 'Distance', unit: 'm' },
      { kind: 'multi', key: 'perimetre.aides', label: 'Aide technique', options: AIDS },
      { kind: 'multi', key: 'perimetre.limites', label: 'Limitations', options: ['limité par l’essoufflement', 'limité par la fatigue musculaire', 'limité par la fatigabilité'] },
      { kind: 'single', key: 'perimetre.lieu', label: 'Lui permettant de marcher', options: Object.keys(SCOPES), compact: true },
      { kind: 'text', key: 'perimetre.commentaire', label: 'Commentaire' },
    ] },
    { id: 'trajet', title: 'Temps trajet chambre-RDC', test: true, controls: [
      { kind: 'text', key: 'trajet.duree', label: 'Durée (ex. 2 min 30 s)' },
      { kind: 'multi', key: 'trajet.aides', label: 'Aide technique', options: AIDS },
      { kind: 'text', key: 'trajet.commentaire', label: 'Commentaire' },
    ] },
    { id: 'test10m', title: 'Test des 10m', test: true, controls: [{ kind: 'number', key: 'test10m.temps', label: 'Temps', unit: 'sec' }, { kind: 'number', key: 'test10m.pas', label: 'Nombre de pas', unit: 'pas' }] },
    group('analyseMarche', 'Analyse de la marche', ['légère déviation lors de la marche en ligne droite', 'les pas sont réguliers', 'les pas sont irréguliers', 'marche lente', 'marche rapide', 'bonne longueur des pas', 'longueur des pas réduite', 'hauteur des pas suffisante', 'les pieds décollent légèrement du sol', 'les pieds ne décollent pas du sol', 'pieds légèrement écartés', 'les membres inférieurs partent en adduction', 'perte de dissociation des ceintures', 'boiterie', 'cherche un appui', 'blocages au cours de la marche', 'rétropulsion modérée', 'rétropulsion importante']),
    { id: 'test6min', title: 'Test des 6min', test: true, controls: [{ kind: 'number', key: 'test6min', label: 'Distance', unit: 'm' }] },
    group('doubleTache', 'Test de double tâche', ['s’arrête de marcher en parlant, double tâche cognitive et motrice difficile', 'ne s’arrête pas de marcher en parlant, double tâche cognitive et motrice possible']),
    { id: 'escaliers', title: 'Escaliers', controls: [
      { kind: 'number', key: 'escaliers.marches', label: 'Marches montées', unit: 'marches' },
      { kind: 'multi', key: 'escaliers.pas', options: ['pas alternés', 'sans alternance des pas'] },
      { kind: 'text', key: otherKey('escaliers'), label: 'Autre' },
    ] },
  ] },
  { id: 'equilibre', title: 'Équilibre', rubrics: [
    group('equilibre', 'Équilibre', ['impossible sans appui', 'tient maximum 5s en statique sans appui', 'tient maximum 10s en statique sans appui', 'tient maximum 10s pieds joints yeux ouverts', 'tient maximum 10s pieds joints yeux fermés', 'tient plus de 5s en unipodal', 'impossible pieds joints', 'impossible les yeux fermés', 'impossible en unipodal']),
  ] },
  { id: 'objectifs', title: 'Objectifs', rubrics: [
    group('objectifs', 'Objectifs kiné', ['lutter contre la douleur', 'entretenir les capacités fonctionnelles des membres supérieurs en lien avec les AVQ (repas, toilette, habillage...)', 'récupérer les capacités fonctionnelles des membres supérieurs en lien avec les AVQ (repas, toilette, habillage...)', 'entretenir les amplitudes articulaires', 'récupérer les amplitudes articulaires', 'lutter contre le ralentissement psychomoteur', 'ralentir le déclin cognitif', 'entretenir la marche autonome', 'entretenir les capacités de déplacement', 'récupérer la marche autonome', 'récupérer les capacités de déplacement', 'lutter contre la rétropulsion', 'entretenir le périmètre de marche', 'augmenter le périmètre de marche', 'entretenir les capacités de marche avec accompagnement', 'entretenir la participation active aux transferts', 'entretenir l’autonomie des transferts', 'récupérer la participation active aux transferts', 'récupérer le tonus musculaire des membres inférieurs', 'lutter contre l’apathie', 'lutter contre la camptocormie', 'éviter le syndrome post-chute', 'réduire le risque de chute', 'prévenir le syndrome de glissement', 'retrouver la confiance en soi', 'sécuriser les déplacements', 'entretien des capacités cardio-respiratoires', 'amélioration de la condition physique générale', 'réadaptation à la marche', 'réentraînement à l’effort individualisé', 'éviter la majoration des rétractions musculaires et articulaires', 'maintien à son domicile', 'éviter l’entrée en institution médicalisée', 'faciliter les soins et la toilette', 'améliorer le transit']),
  ] },
  { id: 'traitement', title: 'Traitement', rubrics: [
    group('moyens', 'Moyens', ['massage à visée antalgique', 'mobilisation active des MS avec ou sans équipements (Blazepods)', 'mobilisation active des MI avec ou sans équipements (Blazepods)', 'mobilisation active avec ou sans résistance', 'travail de la marche', 'travail de marches variées (avant, arrière, latérale...)', 'travail de la marche entre barres parallèles', MERGED_MEANS.first, MERGED_MEANS.second, 'travail de renforcement des membres inférieurs', 'travail de la phase d’impulsion lors du passage assis-debout', 'entre les barres parallèles', 'travail de la posture (redressement, auto-grandissement)', 'travail de coordination', 'travail de dissociation des ceintures', 'mobilisation passive des MS', 'mobilisation passive des MI', 'habituation progressive à l’effort', 'travail cardio-respi', 'pédalier', 'escaliers', 'séances individuelles au parcours d’équilibre', 'fiche d’accompagnement à l’attention des AS']),
    { id: 'seances', title: 'Nombre de séances kiné par semaine', controls: [{ kind: 'single', key: 'seances', options: ['1', '2', '3', '4', '5'], compact: true }] },
    { id: 'commentaires', title: 'Autres commentaires', controls: [{ kind: 'text', key: 'commentaires', label: 'Autres commentaires', long: true }] },
  ] },
]
export const MARCHE_EQUILIBRE_TITLE = 'Évaluation kiné marche / équilibre'

const RUBRICS = new Map(MARCHE_EQUILIBRE.flatMap(module => module.rubrics).map(rubric => [rubric.id, rubric]))
const MULTI = new Map([...RUBRICS.values()].flatMap(rubric => rubric.controls).flatMap(control => control.kind === 'multi' ? [[control.key, control.options] as const] : []))
const keysOf = (rubric: FlexRubric) => rubric.controls.map(control => control.key)

// Lecture des champs : libellés cochés (ordre du catalogue, sans doublon), texte rogné, nombre arrondi (0 compris, vide = absent).
function reader(input: FlexInput) {
  const choices = new Set(input.choices ?? [])
  const values = input.values ?? {}
  const text = (key: string) => (values[key] ?? '').trim()
  const html = (key: string) => escapeHtml(text(key)).replace(/\r?\n/g, '<br>')
  const multi = (key: string): string[] => [...new Set((MULTI.get(key) ?? []).filter((_, index) => choices.has(choiceId(key, index))))]
  const number = (key: string): number | null => {
    const raw = text(key).replace(',', '.')
    if (!raw) return null
    const value = Number(raw)
    return Number.isFinite(value) ? Math.round(value) : null
  }
  // Choix cochés puis « Autre », joints par une virgule.
  const list = (key: string, extra = otherKey(key)) => [...multi(key).map(escapeHtml), html(extra)].filter(Boolean).join(', ')
  return { text, html, multi, number, list }
}

// Ligne du compte rendu : libellé (gras souligné, italique, normal ou sous-ligne en italique des Observations) et contenu HTML.
type Style = 'bu' | 'i' | 'plain' | 'sub'
interface Line { label: string; style: Style; content: string }
const line = (label: string, style: Style, content: string): Line | null => content ? { label, style, content } : null

// Contenu de chaque rubrique ; null si elle est vide.
function rubricLine(id: string, input: FlexInput): Line | null {
  const read = reader(input)
  switch (id) {
    case 'contexte': return line('Contexte', 'bu', read.list('contexte'))
    case 'atcd': return line('Antécédents', 'bu', read.html('atcd'))
    case 'troublesComplementaires': return line('Troubles complémentaires', 'sub', read.list(id))
    case 'troublesComportement': return line('Troubles du comportement', 'sub', read.list(id))
    case 'installation': return line('Installation', 'sub', read.list(id))
    case 'raideurs': return line('Mobilités', 'sub', read.list(id))
    case 'douleur': return line('Douleur', 'sub', read.list(id))
    case 'eva': {
      const eva = read.number('eva')
      return line('EVA', 'sub', read.html(otherKey('eva')) || (eva === null ? '' : `${eva}/10`))
    }
    case 'verticalisation': { const content = read.list(id); return line('Verticalisation', 'sub', content && `réalisée ${content}`) }
    case 'allongeAssis': return line('Passage allongé-assis au bord du lit', 'sub', read.html('allongeAssis'))
    case 'assisDebout30s': { const count = read.number(id); return line('Nombre de passages assis-debout en 30s', 'plain', count === null ? '' : String(count)) }
    case 'passageDeboutAssis': return line('Passage debout-assis', 'i', read.list(id))
    case 'transferts': return line('Transferts et pivots', 'i', read.list(id))
    case 'tug': { const time = read.number(id); return line('Timed Up and Go', 'plain', time === null ? '' : `${time}sec`) }
    case 'stationDebout': { const time = read.number(id); return line('Durée de maintien de la station debout', 'plain', time === null ? '' : `${time}sec`) }
    case 'marche': {
      const walk = read.list('marche'), aid = read.list('aideTechnique')
      return walk ? line('Marche', 'i', [walk, aid].filter(Boolean).join(', ')) : line('Aide technique', 'i', aid)
    }
    case 'marcheArriere': return line('Marche arrière', 'i', read.list(id))
    case 'perimetre': {
      const distance = read.number('perimetre.distance')
      if (distance === null) return null
      const aids = read.multi('perimetre.aides').map(escapeHtml)
      const scope = SCOPES[read.text('perimetre.lieu')]
      return line('Périmètre de marche', 'plain', [`${read.text('perimetre.prefixe') ? 'supérieur à ' : ''}${distance}m`, aids.length ? `avec ${aids.join(', ')}` : '', ...read.multi('perimetre.limites').map(escapeHtml), scope ? escapeHtml(scope) : '', read.html('perimetre.commentaire')].filter(Boolean).join(', '))
    }
    case 'trajet': {
      const duration = read.html('trajet.duree')
      if (!duration) return null
      const aids = read.multi('trajet.aides').map(escapeHtml)
      return line('Temps trajet chambre-RDC', 'plain', [duration, aids.length ? `avec ${aids.join(', ')}` : '', read.html('trajet.commentaire')].filter(Boolean).join(', '))
    }
    case 'test10m': {
      const time = read.number('test10m.temps'), steps = read.number('test10m.pas')
      return line('Test des 10m', 'plain', [time === null ? '' : `${time}sec`, steps === null ? '' : `${steps} pas`].filter(Boolean).join(' et '))
    }
    case 'analyseMarche': return line('Analyse de la marche', 'i', read.list(id))
    case 'test6min': { const distance = read.number(id); return line('Évaluation endurance, test des 6min', 'plain', distance === null ? '' : `${distance}m`) }
    case 'doubleTache': return line('Test de double tâche', 'i', read.list(id))
    case 'equilibre': return line('Équilibre', 'i', read.list(id))
    case 'escaliers': {
      const steps = read.number('escaliers.marches')
      return line('Escaliers', 'i', [steps === null ? '' : `${steps} marches montées`, read.list('escaliers.pas', otherKey('escaliers'))].filter(Boolean).join(', '))
    }
    case 'objectifs': return line('Objectifs kiné', 'bu', read.list(id))
    case 'moyens': {
      // « travail de l’équilibre » et « travail des réactions parachute » cochés ensemble : fusionnés à la place du premier.
      let means = read.multi('moyens')
      if (means.includes(MERGED_MEANS.first) && means.includes(MERGED_MEANS.second)) means = means.filter(item => item !== MERGED_MEANS.second).map(item => item === MERGED_MEANS.first ? MERGED_MEANS.merged : item)
      return line('Traitement kiné', 'bu', [...means.map(escapeHtml), read.html(otherKey('moyens'))].filter(Boolean).join(', '))
    }
    case 'seances': return line('Nombre de séances kiné par semaine', 'i', read.html('seances'))
    case 'commentaires': return line('Autres commentaires', 'i', read.html('commentaires'))
    default: return null
  }
}

const OBSERVATIONS = ['troublesComplementaires', 'troublesComportement', 'installation', 'raideurs', 'douleur', 'eva', 'verticalisation', 'allongeAssis']
const BEFORE = ['contexte', 'atcd']
const AFTER = ['assisDebout30s', 'passageDeboutAssis', 'transferts', 'tug', 'stationDebout', 'marche', 'marcheArriere', 'perimetre', 'trajet', 'test10m', 'analyseMarche', 'test6min', 'doubleTache', 'equilibre', 'escaliers', 'objectifs', 'moyens', 'seances', 'commentaires']
const LABEL: Record<Style, (label: string) => string> = { bu: label => `<b><u>${label}</u></b>`, i: label => `<i>${label}</i>`, plain: label => label, sub: label => `- <i>${label}</i>` }
const render = (item: Line) => `${LABEL[item.style](escapeHtml(item.label))} : ${item.content}`
const lines = (ids: string[], input: FlexInput) => ids.map(id => rubricLine(id, input)).filter((item): item is Line => !!item).map(render)

// Compte rendu mis en forme : titre toujours présent, une ligne par rubrique renseignée, rubriques vides omises avec leur titre.
export function marcheEquilibreHtml(input: FlexInput): string {
  const observations = lines(OBSERVATIONS, input)
  return [`<i><u>${MARCHE_EQUILIBRE_TITLE}</u></i>`, ...lines(BEFORE, input), ...(observations.length ? ['<b><u>Observations</u></b>', ...observations] : []), ...lines(AFTER, input)].join('<br>')
}
export function marcheEquilibreText(input: FlexInput): string { return htmlToText(marcheEquilibreHtml(input)) }

export function hasFlexContent(input: FlexInput): boolean { return !!input.choices?.length || Object.values(input.values ?? {}).some(value => value.trim() !== '') }
// Rubrique renseignée (au moins un choix ou un champ), pour les compteurs des onglets.
export function rubricFilled(rubric: FlexRubric, input: FlexInput): boolean {
  const keys = keysOf(rubric)
  return keys.some(key => (input.values?.[key] ?? '').trim() !== '') || (input.choices ?? []).some(id => keys.some(key => id.startsWith(`${key}.`) && /^\d+$/.test(id.slice(key.length + 1))))
}

// ★ : dernier bilan antérieur (choix précédents) et, pour chaque test standardisé, sa dernière mesure antérieure avec sa date.
export interface PreviousMeasure { date: string; text: string }
export interface PreviousFlex { last: { date: string; record: TestRecord } | null; measures: Record<string, PreviousMeasure> }
export function previousMarcheEquilibre(days: { date: string; entries: Record<string, { tests?: Partial<Record<string, TestRecord>> }> }[], id: string, date: string): PreviousFlex {
  const found = days.filter(day => day.date < date).map(day => ({ date: day.date, record: day.entries[id]?.tests?.marcheEquilibre })).filter((item): item is { date: string; record: TestRecord } => !!item.record && hasFlexContent(item.record)).sort((x, y) => y.date.localeCompare(x.date))
  const measures: Record<string, PreviousMeasure> = {}
  for (const rubric of RUBRICS.values()) {
    if (!rubric.test) continue
    for (const item of found) {
      const measure = rubricLine(rubric.id, item.record)
      if (measure) { measures[rubric.id] = { date: item.date, text: htmlToText(measure.content) }; break }
    }
  }
  return { last: found[0] ?? null, measures }
}
