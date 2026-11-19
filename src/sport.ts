export interface Participant {
  id: string
  name: string
  nationality?: string
  url?: string
}

export interface StandingRow {
  position: string
  points: number | null
  wins: number | null
  participant: Participant
  constructors: Participant[]
}

export interface Classification {
  round: number
  rows: StandingRow[]
}

export interface ResultRow {
  position: string
  driver: Participant
  constructor: Participant
  grid: number | null
  laps: number | null
  points: number | null
  status: string
  time?: string
}

interface RawDriver {
  driverId: string
  givenName: string
  familyName: string
  nationality?: string
  url?: string
}

interface RawConstructor { constructorId: string; name: string }
interface RawStanding {
  position: string
  positionText?: string
  points: string
  wins?: string
  Driver?: RawDriver
  Constructor?: RawConstructor
  Constructors?: RawConstructor[]
}
interface RawClassification {
  season: string
  round: string
  DriverStandings?: RawStanding[]
  ConstructorStandings?: RawStanding[]
}
interface RawResult {
  position: string
  positionText?: string
  Driver: RawDriver
  Constructor: RawConstructor
  grid?: string
  laps?: string
  points?: string
  status?: string
  Time?: { time: string }
}
interface RawRace {
  season: string
  round: string
  Circuit: { circuitId: string }
  Results?: RawResult[]
  SprintResults?: RawResult[]
}
interface Envelope {
  total: string
  StandingsTable?: { season: string; StandingsLists: RawClassification[] }
  RaceTable?: { season: string; round?: string; Races: RawRace[] }
}

const constructorAliases: Record<string, string> = { red_bull: 'red-bull', rb: 'racing-bulls', racing_bulls: 'racing-bulls', aston_martin: 'aston-martin' }
const constructorNames: Record<string, string> = { 'red-bull': 'Red Bull Racing', 'racing-bulls': 'Racing Bulls' }
const driverAliases: Record<string, string> = { max_verstappen: 'verstappen', arvid_lindblad: 'lindblad', rafael_camara: 'camara' }

export const teamKey = (id: string) => constructorAliases[id] ?? id
export const driverKey = (id: string) => driverAliases[id] ?? id

function mrData(raw: unknown) {
  const data = (raw as { MRData?: Envelope } | null)?.MRData
  if (!data || !/^\d+$/.test(data.total)) throw new Error('Некорректный ответ Jolpica')
  return data
}

function asNumber(value: string | undefined) {
  return value != null && String(value).trim() !== '' && Number.isFinite(Number(value)) ? Number(value) : null
}

function constructor(raw: RawConstructor): Participant {
  if (!raw?.constructorId || !raw.name) throw new Error('Некорректная команда')
  const id = teamKey(raw.constructorId)
  return { id, name: constructorNames[id] ?? raw.name }
}

function driver(raw: RawDriver): Participant {
  if (!raw?.driverId || !raw.givenName || !raw.familyName) throw new Error('Некорректный пилот')
  const id = driverKey(raw.driverId)
  const name = id === 'antonelli' ? 'Kimi Antonelli' : id === 'camara' ? 'Rafael Câmara' : raw.givenName + ' ' + raw.familyName
  const url = raw.url?.replace(/^http:/, 'https:')
  return { id, name, nationality: raw.nationality, url: url?.startsWith('https://en.wikipedia.org/') ? url : undefined }
}

export function parseStandings(raw: unknown, year: number, kind: 'drivers' | 'constructors'): Classification | null {
  const data = mrData(raw)
  const table = data.StandingsTable
  if (!table || Number(table.season) !== year || !Array.isArray(table.StandingsLists)) throw new Error('Сезон зачёта не совпадает')
  if (Number(data.total) === 0 && table.StandingsLists.length === 0) return null
  const current = table.StandingsLists[0]
  const entries = kind === 'drivers' ? current?.DriverStandings : current?.ConstructorStandings
  if (!current || Number(current.season) !== year || !(Number(current.round) > 0) || !Array.isArray(entries) || entries.length !== Number(data.total)) {
    throw new Error('Неполная таблица зачёта')
  }
  return {
    round: Number(current.round),
    rows: entries.map(row => ({
      position: row.positionText || row.position, points: asNumber(row.points), wins: asNumber(row.wins),
      participant: kind === 'drivers' ? driver(row.Driver!) : constructor(row.Constructor!),
      constructors: kind === 'drivers' ? (row.Constructors ?? []).map(constructor) : [],
    })),
  }
}

export function parseResults(raw: unknown, year: number, round: number, circuitId: string, kind: 'results' | 'sprint'): ResultRow[] {
  const data = mrData(raw)
  const table = data.RaceTable
  if (!table || Number(table.season) !== year || Number(table.round) !== round || !Array.isArray(table.Races)) throw new Error('Этап не совпадает')
  if (Number(data.total) === 0 && table.Races.length === 0) return []
  const race = table.Races[0]
  const rows = kind === 'sprint' ? race?.SprintResults : race?.Results
  if (!race || Number(race.season) !== year || Number(race.round) !== round || race.Circuit?.circuitId !== circuitId ||
      !Array.isArray(rows) || rows.length !== Number(data.total)) throw new Error('Неполная классификация')
  return rows.map(row => ({
    position: row.positionText || row.position, driver: driver(row.Driver), constructor: constructor(row.Constructor),
    grid: asNumber(row.grid), laps: asNumber(row.laps), points: asNumber(row.points),
    status: row.status ?? '', time: row.Time?.time,
  }))
}

const statusLabels: Record<string, string> = {
  Finished: 'Финишировал', Lapped: 'С отставанием в круг', Retired: 'Сход', Disqualified: 'Дисквалификация',
  'Did not start': 'Не стартовал', 'Did not qualify': 'Не квалифицировался', 'Not classified': 'Не классифицирован',
  Withdrawn: 'Снялся', Accident: 'Авария', Collision: 'Столкновение', Excluded: 'Исключён', Engine: 'Двигатель',
}

const positions: Record<string, string> = { R: 'Сход', D: 'DSQ', E: 'Искл.', W: 'DNS', F: 'DNQ', N: 'НК' }

export function resultPosition(position: string) { return positions[position] ?? position }

export function resultStatus(row: ResultRow, winner: ResultRow | undefined) {
  const explicitLaps = row.status.match(/^\+(\d+) Laps?$/i)
  if (explicitLaps) return '+' + explicitLaps[1] + ' кр.'
  if (row.status === 'Lapped' && winner?.laps != null && row.laps != null && winner.laps > row.laps) return '+' + (winner.laps - row.laps) + ' кр.'
  if ((row.status === 'Finished' || !row.status) && row.time) return row.time
  return statusLabels[row.status] ?? (row.status || '—')
}

export function leaderGap(leader: number | null, points: number | null) {
  if (leader === null || points === null) return null
  return leader - points
}

export function weekendPanel(hasClassification: boolean, raceStarted: boolean): 'race' | 'schedule' {
  return hasClassification || raceStarted ? 'race' : 'schedule'
}
