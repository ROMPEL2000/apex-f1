export const season = 2026
export const officialCalendar = 'https://www.formula1.com/en/racing/2026'
export const terms = 'https://github.com/jolpica/jolpica-f1/blob/main/TERMS.md'
export const dataLicense = 'https://creativecommons.org/licenses/by-nc-sa/4.0/'
export const scheduleApi = (year: number) => 'https://api.jolpi.ca/ergast/f1/' + year + '/races/'

const locations: Record<string, [string, string, string]> = {
  albert_park: ['Австралия', 'Австралия', 'Australia/Melbourne'],
  shanghai: ['Китай', 'Китай', 'Asia/Shanghai'],
  suzuka: ['Япония', 'Япония', 'Asia/Tokyo'],
  miami: ['Майами', 'США', 'America/New_York'],
  villeneuve: ['Канада', 'Канада', 'America/Toronto'],
  monaco: ['Монако', 'Монако', 'Europe/Monaco'],
  catalunya: ['Барселона', 'Испания', 'Europe/Madrid'],
  red_bull_ring: ['Австрия', 'Австрия', 'Europe/Vienna'],
  silverstone: ['Великобритания', 'Великобритания', 'Europe/London'],
  spa: ['Бельгия', 'Бельгия', 'Europe/Brussels'],
  hungaroring: ['Венгрия', 'Венгрия', 'Europe/Budapest'],
  zandvoort: ['Нидерланды', 'Нидерланды', 'Europe/Amsterdam'],
  monza: ['Италия', 'Италия', 'Europe/Rome'],
  madring: ['Мадрид', 'Испания', 'Europe/Madrid'],
  baku: ['Азербайджан', 'Азербайджан', 'Asia/Baku'],
  sepang: ['Бахрейн в Малайзии', 'Малайзия', 'Asia/Kuala_Lumpur'],
  marina_bay: ['Сингапур', 'Сингапур', 'Asia/Singapore'],
  americas: ['США', 'США', 'America/Chicago'],
  rodriguez: ['Мехико', 'Мексика', 'America/Mexico_City'],
  interlagos: ['Сан-Паулу', 'Бразилия', 'America/Sao_Paulo'],
  vegas: ['Лас-Вегас', 'США', 'America/Los_Angeles'],
  losail: ['Катар', 'Катар', 'Asia/Qatar'],
  yas_marina: ['Абу-Даби', 'ОАЭ', 'Asia/Dubai'],
  bahrain: ['Бахрейн', 'Бахрейн', 'Asia/Bahrain'],
  jeddah: ['Саудовская Аравия', 'Саудовская Аравия', 'Asia/Riyadh'],
  istanbul: ['Турция', 'Турция', 'Europe/Istanbul'],
  portimao: ['Португалия', 'Португалия', 'Europe/Lisbon'],
}

const sessionNames = {
  FirstPractice: 'Практика 1',
  SecondPractice: 'Практика 2',
  ThirdPractice: 'Практика 3',
  SprintQualifying: 'Квалификация к спринту',
  SprintShootout: 'Квалификация к спринту',
  Sprint: 'Спринт',
  Qualifying: 'Квалификация',
  Race: 'Гонка',
} as const

type SessionKey = keyof typeof sessionNames
interface RawDate { date: string; time?: string }
type RawRace = RawDate & Partial<Record<SessionKey, RawDate>> & {
  season: string
  round: string
  raceName: string
  Circuit: { circuitId: string; circuitName: string; Location: { country: string; locality: string } }
}
export interface Session {
  key: SessionKey
  name: string
  date: string
  start: number | null
}
export interface Weekend {
  id: string
  round: number
  year: number
  title: string
  country: string
  circuit: string
  zone?: string
  sessions: Session[]
}
export interface ScheduleData {
  payload: unknown
  checkedAt: number
}

function timestamp(value: RawDate): number | null {
  if (!value.time) return null
  const offset = /(?:Z|[+-]\d{2}:\d{2})$/.test(value.time) ? '' : 'Z'
  const valueMs = Date.parse(value.date + 'T' + value.time + offset)
  return Number.isFinite(valueMs) ? valueMs : null
}

export function parseSchedule(payload: unknown, expectedYear: number): Weekend[] {
  const table = (payload as { MRData?: { total?: string; RaceTable?: { season?: string; Races?: RawRace[] } } } | null)?.MRData
  const rows = table?.RaceTable?.Races
  if (!Array.isArray(rows) || Number(table?.RaceTable?.season) !== expectedYear || Number(table?.total) !== rows.length) {
    throw new Error('Неполный ответ источника')
  }
  return rows.map(race => {
    const circuit = race.Circuit
    if (Number(race.season) !== expectedYear || !Number(race.round) || !race.raceName || !circuit?.circuitId ||
        !circuit.circuitName || !circuit.Location?.country || !/^\d{4}-\d{2}-\d{2}$/.test(race.date)) {
      throw new Error('Неизвестный формат этапа')
    }
    const [title, country, zone] = locations[circuit.circuitId] ?? [race.raceName, circuit.Location.country, undefined]
    const sessions = (Object.keys(sessionNames) as SessionKey[]).flatMap(key => {
      const value = key === 'Race' ? race : race[key]
      if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value.date) || (key === 'SprintShootout' && race.SprintQualifying)) return []
      return [{ key, name: sessionNames[key], date: value.date, start: timestamp(value) }]
    }).sort((a, b) => (a.start ?? Date.parse(a.date)) - (b.start ?? Date.parse(b.date)))
    return { id: race.season + '-' + race.round, round: Number(race.round), year: expectedYear, title, country, circuit: circuit.circuitName, zone, sessions }
  }).sort((a, b) => a.round - b.round)
}

export function firstFuture(weekend: Weekend, now: number) {
  return weekend.sessions.find(session => session.start !== null && session.start > now)
}

export function isUpcoming(weekend: Weekend, now: number) {
  const race = weekend.sessions.find(session => session.key === 'Race')
  if (!race) return false
  return (race.start ?? Date.parse(race.date) + 36 * 60 * 60 * 1000) > now
}

const formatters = new Map<string, Intl.DateTimeFormat>()

export function formatDate(date: number, timeZone: string, options: Intl.DateTimeFormatOptions) {
  const key = timeZone + JSON.stringify(options)
  let formatter = formatters.get(key)
  if (!formatter) {
    formatter = new Intl.DateTimeFormat('ru-RU', { ...options, timeZone })
    formatters.set(key, formatter)
  }
  return formatter.format(date)
}

export function weekendDates(weekend: Weekend) {
  const zone = weekend.zone ?? 'UTC'
  const dates = weekend.sessions.map(session => session.start ?? Date.parse(session.date + 'T12:00:00Z'))
  const start = Math.min(...dates)
  const end = Math.max(...dates)
  const day = (time: number) => formatDate(time, zone, { day: 'numeric' })
  const long = (time: number) => formatDate(time, zone, { month: 'long', day: 'numeric' })
  if (long(start) === long(end)) return long(end)
  if (formatDate(start, zone, { month: 'numeric' }) === formatDate(end, zone, { month: 'numeric' })) return day(start) + '–' + long(end)
  return long(start) + ' – ' + long(end)
}

export function timeLeft(target: number, now: number) {
  const seconds = Math.max(0, Math.ceil((target - now) / 1000))
  return [Math.floor(seconds / 86400), Math.floor(seconds / 3600) % 24, Math.floor(seconds / 60) % 60, seconds % 60]
}

