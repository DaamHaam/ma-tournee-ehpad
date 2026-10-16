import { describe, expect, it } from 'vitest'
import { choiceId, MARCHE_EQUILIBRE, pickRubric, withoutRubric } from './marcheEquilibre'
import { filledMeasures, latestMeasures, MEASURE_RUBRICS, measureHistory, mesuresHtml } from './mesures'
import { TINETTI } from './tinetti'
import { chronoDisplay, countdownDisplay, durationText, secondsValue } from '../features/bilan/chronoFormat'

const record = (values: Record<string, string>, choices: string[] = []) => ({ scores: {}, notes: '', at: '', values, choices })
const pick = (key: string, option: string) => {
  for (const rubric of MARCHE_EQUILIBRE.flatMap(module => module.rubrics)) for (const control of rubric.controls) if (control.key === key && control.kind === 'multi') return choiceId(key, control.options.indexOf(option))
  throw new Error(option)
}

describe('mesures des tests standardisés', () => {
  it('reprend les tests du bilan marche / équilibre, avec les 5 levers de chaise et l’EVA', () => {
    expect(MEASURE_RUBRICS.map(rubric => rubric.id)).toEqual(['eva', 'assisDebout30s', 'cinqLevers', 'tug', 'stationDebout', 'perimetre', 'trajet', 'test10m', 'test6min'])
  })
  it('met en ligne les tests rapides du jour, dans l’ordre du catalogue', () => {
    const input = { values: { tug: '18,4', assisDebout30s: '8', 'assisDebout30s.accoudoirs': 'avec accoudoirs', eva: '3', cinqLevers: '14' } }
    expect(filledMeasures(input)).toEqual(['eva', 'assisDebout30s', 'cinqLevers', 'tug'])
    expect(mesuresHtml(input).split('<br>')).toEqual(['EVA : 3/10', 'Nombre de passages assis-debout en 30s : 8, avec accoudoirs', 'Test des 5 levers de chaise : 14sec', 'Timed Up and Go : 18sec'])
  })
  it('isole ou retire un test sans toucher aux autres', () => {
    const input = { choices: [pick('perimetre.aides', 'rollator'), pick('marche', 'impossible')], values: { 'perimetre.distance': '50', tug: '20', marche: 'x' } }
    expect(pickRubric(input, 'perimetre')).toEqual({ choices: [pick('perimetre.aides', 'rollator')], values: { 'perimetre.distance': '50' } })
    expect(withoutRubric(input, 'perimetre')).toEqual({ choices: [pick('marche', 'impossible')], values: { tug: '20', marche: 'x' } })
  })
  it('rassemble l’historique de toutes les sources et donne la dernière mesure antérieure', () => {
    const fullTinetti = Object.fromEntries(TINETTI.flatMap(section => section.items.flatMap(item => item.rows)).map(row => [row.id, Math.max(...row.options.map(option => option.score))]))
    const days = [
      { date: '2026-06-01', entries: { p: { tests: { marcheEquilibre: record({ tug: '25', 'test10m.temps': '15' }) } } } },
      { date: '2026-07-01', entries: { p: { tests: { tinetti: { scores: fullTinetti, notes: '', at: '' } } } } },
      { date: '2026-09-01', entries: { p: { bilanMeasures: { values: { tug: '21' } } } } },
      // Le même jour, le test rapide l’emporte sur le bilan marche / équilibre.
      { date: '2026-10-01', entries: { p: { tests: { mesures: record({ tug: '19' }), marcheEquilibre: record({ tug: '30' }) } } } },
      { date: '2026-10-08', entries: { p: { tests: { mesures: record({ tug: '17' }) } } } },
    ]
    expect(measureHistory(days, 'p').tug.map(measure => measure.text)).toEqual(['17sec', '19sec', '21sec', '25sec'])
    expect(latestMeasures(days, 'p', '2026-10-08')).toEqual({ tug: { date: '2026-10-01', text: '19sec', copied: false }, test10m: { date: '2026-06-01', text: '15sec', copied: false }, tinetti: { date: '2026-07-01', text: '28/28', copied: false } })
  })
  it('signale si la mesure vient d’un test ou d’un bilan copié (transmis)', () => {
    const days = [
      { date: '2026-06-01', entries: { p: { tests: { marcheEquilibre: { ...record({ tug: '25' }), copied: true } } } } },
      { date: '2026-07-01', entries: { p: { bilanMeasures: { values: { tug: '22' } }, bilanCopied: true } } },
      { date: '2026-08-01', entries: { p: { bilanMeasures: { values: { tug: '21' } } } } },
      { date: '2026-09-01', entries: { p: { tests: { mesures: { ...record({ tug: '19' }), copied: true } } } } },
    ]
    expect(measureHistory(days, 'p').tug.map(measure => measure.copied)).toEqual([true, false, true, true])
  })
  it('met en forme le chronomètre', () => {
    expect(chronoDisplay(17_650)).toBe('17,6 s')
    expect(chronoDisplay(150_000)).toBe('2:30,0')
    expect(countdownDisplay(29_100)).toBe('30 s')
    expect(countdownDisplay(360_000)).toBe('6:00')
    expect(secondsValue(17_650)).toBe('17,7')
    expect(durationText(150_400)).toBe('2 min 30 s')
    expect(durationText(45_000)).toBe('45 s')
  })
})
