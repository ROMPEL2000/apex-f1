import { mkdir, rename, writeFile } from 'node:fs/promises'
import { setTimeout } from 'node:timers/promises'

const base = 'https://api.jolpi.ca/ergast/f1/'
const seasons = process.argv.slice(2).map(Number)
const out = new URL('../public/sport/', import.meta.url)
await mkdir(out, { recursive: true })

async function get(path) {
  await setTimeout(300)
  const response = await fetch(base + path, { signal: AbortSignal.timeout(16_000) })
  if (!response.ok) throw new Error(path + ' HTTP ' + response.status)
  const payload = await response.json()
  if (!payload.MRData || !Number.isFinite(Number(payload.MRData.total))) throw new Error('Invalid response ' + path)
  return payload
}

function safeResult(row) {
  const { position, positionText, points, grid, laps, status, Driver, Constructor, Time } = row
  return { position, positionText, points, grid, laps, status, Driver, Constructor, Time }
}

async function classifications(year, type, field) {
  const rounds = new Map()
  const idsByRound = new Map()
  let offset = 0
  let total
  do {
    const page = await get(year + '/' + type + '/?limit=100&offset=' + offset)
    const { MRData: { RaceTable, total: pageTotal } } = page
    const expected = Number(pageTotal)
    if (total !== undefined && expected !== total) throw new Error('Classification changed while paging')
    total = expected
    let count = 0
    for (const race of RaceTable.Races) {
      const round = Number(race.round)
      const saved = rounds.get(round) ?? { ...race, [field]: [] }
      const ids = idsByRound.get(round) ?? new Set()
      for (const row of race[field]) {
        if (ids.has(row.Driver.driverId)) throw new Error('Repeated classification row')
        ids.add(row.Driver.driverId)
        saved[field].push(safeResult(row))
        count++
      }
      idsByRound.set(round, ids)
      rounds.set(round, saved)
    }
    if (!count && offset < total) throw new Error('Incomplete classification')
    offset += count
  } while (offset < total)
  return rounds
}

for (const year of seasons.length ? seasons : [2025, 2026]) {
  if (!Number.isInteger(year) || year < 1950 || year > 2100) throw new Error('Invalid season ' + year)
  const resources = {}
  const schedule = await get(year + '/races/?limit=100')
  const races = schedule.MRData.RaceTable.Races
  if (races.length !== Number(schedule.MRData.total)) throw new Error('Incomplete schedule')
  resources.races = schedule
  resources.driverstandings = await get(year + '/driverstandings/?limit=100')
  resources.constructorstandings = await get(year + '/constructorstandings/?limit=100')
  for (const [key, field] of [['results', 'Results'], ['sprint', 'SprintResults']]) {
    const rounds = await classifications(year, key, field)
    for (const [round, race] of rounds) {
      if (!races.some(event => Number(event.round) === round && event.Circuit.circuitId === race.Circuit.circuitId)) throw new Error('Circuit mismatch')
      resources[round + '/' + key] = { MRData: {
        total: String(race[field].length), RaceTable: { season: String(year), round: String(round), Races: [race] },
      } }
    }
  }
  const file = new URL(year + '.json', out)
  const temp = new URL(year + '.tmp', out)
  await writeFile(temp, JSON.stringify({ checkedAt: new Date().toISOString(), resources }) + '\n')
  await rename(temp, file)
  console.log(year, races.length + ' weekends', Object.keys(resources).length + ' resources')
}
