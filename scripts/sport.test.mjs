import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { test } from 'node:test'
import { parseSchedule } from '../src/calendar.ts'
import { parseResults, parseStandings, resultStatus, resultPosition, leaderGap, driverKey, teamKey, weekendPanel } from '../src/sport.ts'
import { trackFor } from '../src/track-data.ts'
import { chooseVideo } from '../src/video-quality.ts'

const snapshots = {}
for (const year of [2025, 2026]) snapshots[year] = JSON.parse(await readFile(new URL('../public/sport/' + year + '.json', import.meta.url), 'utf8')).resources

test('every supported weekend resolves its actual circuit and a season-specific layout', async () => {
  const svgIds = new Set()
  for (const year of [2025, 2026]) {
    for (const race of parseSchedule(snapshots[year].races, year)) {
      const track = trackFor(race.circuitId, year)
      assert.ok(track, race.circuitId + ' ' + year)
      assert.ok(track.length > 1 && track.turns > 1)
      const svg = await readFile(new URL('../public/tracks/' + track.id + '.svg', import.meta.url), 'utf8')
      assert.match(svg, /viewBox="0 0 500 500"/)
      assert.match(svg, /#ff6147/)
      svgIds.add(track.id)
    }
  }
  assert.equal(svgIds.size, 26)
  assert.equal(trackFor('catalunya', 2026).id, 'catalunya-6')
  assert.equal(trackFor('marina_bay', 2026).id, 'marina-bay-4')
  assert.equal(trackFor('vegas', 2026).id, 'las-vegas-1')
  assert.notEqual(trackFor('madring', 2026).id, trackFor('catalunya', 2026).id)
  assert.equal(trackFor('madring', 2025), undefined)
  assert.equal(trackFor('foo', 2026), undefined)
})

test('the standings preserve the source classification and include substitutes', () => {
  const d = parseStandings(snapshots[2026].driverstandings, 2026, 'drivers')
  const c = parseStandings(snapshots[2026].constructorstandings, 2026, 'constructors')
  assert.ok(d.round > 0 && c.round > 0)
  assert.ok(d.rows.length >= 25)
  assert.equal(c.rows.length, 11)
  assert.ok(d.rows.some(row => row.participant.id === 'camara'))
  assert.ok(d.rows.some(row => row.participant.id === 'ryo_hirakawa'))
  assert.equal(d.rows[0].participant.id, 'antonelli')
  assert.equal(c.rows[0].participant.id, 'mercedes')
  const ranked = snapshots[2026].driverstandings.MRData.StandingsTable.StandingsLists[0].DriverStandings
  assert.deepEqual(d.rows.map(row => row.participant.id), ranked.map(row => driverKey(row.Driver.driverId)))
  const tiedPayload = structuredClone(snapshots[2026].driverstandings)
  const tied = tiedPayload.MRData.StandingsTable.StandingsLists[0].DriverStandings
  tied[0].points = tied[1].points
  assert.deepEqual(parseStandings(tiedPayload, 2026, 'drivers').rows.slice(0, 2).map(row => row.participant.id),
    ranked.slice(0, 2).map(row => driverKey(row.Driver.driverId)))
  const prior = parseStandings(snapshots[2025].driverstandings, 2025, 'drivers')
  assert.equal(prior.round, 24)
  assert.ok(prior.rows.some(row => row.constructors.length > 1))
  assert.equal(leaderGap(390, 279), 111)
  assert.equal(leaderGap(390, null), null)
  assert.throws(() => parseStandings(snapshots[2026].driverstandings, 2025, 'drivers'))
})

test('stable participant identifiers preserve current links without changing predecessor teams', () => {
  assert.equal(teamKey('red_bull'), 'red-bull')
  assert.equal(teamKey('rb'), 'racing-bulls')
  assert.equal(teamKey('sauber'), 'sauber')
  assert.equal(driverKey('max_verstappen'), 'verstappen')
  assert.equal(driverKey('rafael_camara'), 'camara')
  assert.equal(driverKey('ocon'), 'ocon')
})

test('grand prix and sprint data retain published result codes and lap deficits', () => {
  const brazil = parseResults(snapshots[2026]['20/results'], 2026, 20, 'interlagos', 'results')
  assert.equal(brazil[0].driver.id, 'norris')
  assert.equal(resultStatus(brazil[0], brazil[0]), '1:35:23.504')
  assert.equal(resultStatus(brazil.find(r => r.driver.id === 'camara'), brazil[0]), '+2 кр.')
  assert.equal(resultStatus(brazil.find(r => r.driver.id === 'bottas'), brazil[0]), 'Не стартовал')
  assert.equal(resultStatus({ status: 'Disqualified' }, brazil[0]), 'Дисквалификация')
  assert.equal(resultPosition('D'), 'DSQ')
  assert.throws(() => parseResults(snapshots[2026]['20/results'], 2026, 20, 'monaco', 'results'))
  const sprint = parseResults(snapshots[2026]['2/sprint'], 2026, 2, 'shanghai', 'sprint')
  assert.equal(sprint[0].driver.id, 'russell')
  assert.equal(sprint[0].points, 8)
  const empty = { MRData: { total: '0', RaceTable: { season: '2026', round: '21', Races: [] } } }
  assert.deepEqual(parseResults(empty, 2026, 21, 'vegas', 'results'), [])
})

test('the default detail panel distinguishes a past start from a published classification', () => {
  assert.equal(weekendPanel(false, false), 'schedule')
  assert.equal(weekendPanel(false, true), 'race')
  assert.equal(weekendPanel(true, false), 'race')
})

test('the video profile selects a single supported file and honors data saving', () => {
  const small = { width: 854 }
  const medium = { width: 1920 }
  const large = { width: 3840 }
  const options = [large, small, medium]
  const target = { width: 1500, height: 820, density: 2, saveData: false }
  assert.equal(chooseVideo(options, target, () => true), large)
  assert.equal(chooseVideo(options, target, option => option !== large), medium)
  assert.equal(chooseVideo(options, { ...target, saveData: true }, () => true), small)
  assert.equal(chooseVideo([large], { ...target, saveData: true }, () => true), undefined)
})
