import { useCallback, useEffect, useState } from 'react'
import { dataLicense, firstFuture, formatDate, isUpcoming, terms, timeLeft, weekendDates, type Weekend } from './calendar'
import { Icon } from './icons'
import { CircuitMap } from './tracks'
import { parseResults, resultPosition, resultStatus, weekendPanel, type ResultRow } from './sport'
import { SourceStatus, type OpenParticipant } from './Standings'
import { useResource } from './useResource'
import type { useSchedule } from './useSchedule'

type Filter = 'upcoming' | 'past' | 'all'
type Panel = 'schedule' | 'race' | 'sprint'
const filterLabels: Record<Filter, string> = { upcoming: 'Ближайшие', past: 'Прошедшие', all: 'Весь сезон' }

function StageNumber({ value }: { value: number }) {
  return <span className="round-num">{String(value).padStart(2, '0')}</span>
}

function Countdown({ target, now }: { target: number; now: number }) {
  const values = timeLeft(target, now)
  return <div className="countdown" aria-label={'До старта: ' + values.map((value, index) => value + [' дн.', ' ч.', ' мин.', ' сек.'][index]).join(' ')}>
    {values.map((value, index) => <span key={index} aria-hidden="true"><b>{String(value).padStart(2, '0')}</b><small>{['дни', 'часы', 'мин', 'сек'][index]}</small></span>)}
  </div>
}

function sessionStarted(weekend: Weekend, kind: 'Race' | 'Sprint', now: number) {
  const session = weekend.sessions.find(item => item.key === kind)
  if (!session) return false
  return (session.start ?? Date.parse(session.date) + 36 * 3600_000) <= now
}

function ResultTable({ rows, year, onDriver, sprint }: { rows: ResultRow[]; year: number; onDriver: OpenParticipant; sprint: boolean }) {
  const winner = rows.find(row => row.position === '1')
  return <div className="table-scroll result-scroll" role="region" tabIndex={0} aria-label={sprint ? 'Таблица спринта' : 'Таблица гонки'}>
    <table className="timing-table">
      <thead><tr><th scope="col">Финиш</th><th scope="col">Пилот</th><th scope="col">Команда</th>
        <th scope="col" className="num">Старт</th><th scope="col" className="num">Круги</th><th scope="col">Итог</th><th scope="col" className="num">Очки</th></tr></thead>
      <tbody>{rows.map(row => <tr key={row.driver.id}>
        <td className="table-position">{resultPosition(row.position)}</td>
        <th scope="row"><button className="participant-link" type="button" onClick={() => onDriver(row.driver, [row.constructor], year)}>{row.driver.name}</button></th>
        <td>{row.constructor.name}</td>
        <td className="num">{row.grid === 0 ? row.status === 'Did not start' ? '—' : 'Пит-лейн' : row.grid ?? '—'}</td>
        <td className="num">{row.laps ?? '—'}</td><td className="result-status">{resultStatus(row, winner)}</td>
        <td className="num points">{row.points ?? '—'}</td>
      </tr>)}</tbody>
    </table>
  </div>
}

function WeekendDetails({ race, now, zone, localZone, trackTime, latestRound, onDriver }: {
  race: Weekend
  now: number
  zone: string
  localZone: string
  trackTime: boolean
  latestRound: number
  onDriver: OpenParticipant
}) {
  const [selected, setSelected] = useState<Panel>()
  const raceStarted = sessionStarted(race, 'Race', now)
  const sprintStarted = sessionStarted(race, 'Sprint', now)
  const hasSprint = race.sessions.some(session => session.key === 'Sprint')
  const raceEligible = raceStarted || race.round <= latestRound
  const sprintEligible = hasSprint && (sprintStarted || raceEligible)
  const parseRace = useCallback((payload: unknown) => parseResults(payload, race.year, race.round, race.circuitId, 'results'), [race.year, race.round, race.circuitId])
  const parseSprint = useCallback((payload: unknown) => parseResults(payload, race.year, race.round, race.circuitId, 'sprint'), [race.year, race.round, race.circuitId])
  const raceResult = useResource(race.year, raceEligible ? race.round + '/results' : '', parseRace)
  const tab = selected ?? weekendPanel(Boolean(raceResult.data?.length), raceEligible)
  const sprintResult = useResource(race.year, tab === 'sprint' && sprintEligible ? race.round + '/sprint' : '', parseSprint)
  const shownResult = tab === 'sprint' ? sprintResult : raceResult
  const upcoming = firstFuture(race, now)
  return <div className="weekend">
    <div className="weekend-head">
      <div>
        <p className="index-label"><i /> Этап {String(race.round).padStart(2, '0')}</p>
        <h3>{race.title}</h3>
        <p>{race.circuit} <span>·</span> {race.country}</p>
        <p className="weekend-local">{weekendDates(race)} · {race.zone ? 'даты по времени трассы' : 'даты в UTC'}</p>
      </div>
      <CircuitMap race={race} />
    </div>
    <div className="line-tabs" role="group" aria-label="Данные этапа">
      <button type="button" aria-pressed={tab === 'schedule'} onClick={() => setSelected('schedule')}>Расписание</button>
      {raceEligible && <button type="button" aria-pressed={tab === 'race'} onClick={() => setSelected('race')}>Гонка</button>}
      {sprintEligible && <button type="button" aria-pressed={tab === 'sprint'} onClick={() => setSelected('sprint')}>Спринт</button>}
    </div>
    {tab === 'schedule' ? <>
      <div className="session-zone"><Icon name="globe" size={16} /> Сессии · {zone}{trackTime && !race.zone ? ' · пояс трассы неизвестен' : ''}</div>
      <ul className="sessions">{race.sessions.map(session => <li key={session.key} className={session === upcoming ? 'session next-session' : 'session'}>
        <span className="session-label">{session.name}{session === upcoming && <span className="next-tag">Ближайшая</span>}</span>
        {session.start !== null
          ? <time dateTime={new Date(session.start).toISOString()}><span>{formatDate(session.start, zone, { day: 'numeric', month: 'short' })}</span><strong>{formatDate(session.start, zone, { hour: '2-digit', minute: '2-digit', hourCycle: 'h23' })}</strong></time>
          : <span className="missing-time"><time dateTime={session.date}>{formatDate(Date.parse(session.date + 'T12:00:00Z'), 'UTC', { day: 'numeric', month: 'short' })}</time> · время не объявлено</span>}
      </li>)}</ul>
    </> : <>
      <div className="data-meta event-meta"><span>{tab === 'sprint' ? 'Классификация спринта' : 'Классификация гонки'}</span><SourceStatus state={shownResult} zone={localZone} /></div>
      {shownResult.data?.length
        ? <ResultTable rows={shownResult.data} year={race.year} sprint={tab === 'sprint'} onDriver={onDriver} />
        : <p className="data-empty">{shownResult.status === 'loading' ? 'Проверяем, опубликована ли классификация…' : shownResult.status === 'unavailable' ? 'Классификацию не удалось загрузить. Проверьте результаты Formula 1.' : 'Классификация этой сессии ещё не опубликована в источнике.'}</p>}
    </>}
  </div>
}

type CalendarState = ReturnType<typeof useSchedule>

export function Schedule({ state, localZone, trackTime, onZoneChange, resultsView, latestRound, onDriver, seasons, changeSeason }: {
  state: CalendarState
  localZone: string
  trackTime: boolean
  onZoneChange: (trackTime: boolean) => void
  resultsView: boolean
  latestRound: number
  onDriver: OpenParticipant
  seasons: number[]
  changeSeason: (year: number) => void
}) {
  const [now, setNow] = useState(Date.now)
  const [selection, setSelection] = useState<{ context: string; filter: Filter; id: string }>()
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 20_000)
    return () => window.clearInterval(timer)
  }, [])
  const context = state.year + '/' + resultsView
  const defaults = resultsView || (state.races.length > 0 && !state.races.some(race => isUpcoming(race, now))) ? 'past' : 'upcoming'
  const filter = selection?.context === context ? selection.filter : defaults
  const selectedId = selection?.context === context ? selection.id : ''
  const isPast = (race: Weekend) => race.round <= latestRound || sessionStarted(race, 'Race', now)
  const filtered = filter === 'past' ? state.races.filter(isPast).reverse()
    : filter === 'upcoming' ? state.races.filter(race => !isPast(race)) : state.races
  const active = filtered.find(race => race.id === selectedId) ?? filtered[0]
  const zone = (trackTime && active?.zone) || localZone
  const calendarSource = 'https://www.formula1.com/en/racing/' + state.year

  return <section className="race-hub calendar" id="calendar" aria-labelledby="calendar-title">
    <span className="section-anchor" id="results" />
    <div className="wrap">
      <div className="editorial-heading table-heading">
        <div><p className="index-label"><i /> Сезон {state.year}</p><h2 id="calendar-title">{resultsView ? 'Результаты' : 'Календарь'}</h2></div>
        <label className="season-control">Сезон данных <select value={state.year} onChange={event => changeSeason(Number(event.target.value))}>{seasons.map(year => <option key={year}>{year}</option>)}</select></label>
      </div>
      <div className="calendar-layout">
        <div className="race-list">
          <div className="line-tabs race-filters" role="group" aria-label="Фильтр этапов">
            {(Object.keys(filterLabels) as Filter[]).map(option => <button type="button" aria-pressed={filter === option} key={option}
              onClick={() => setSelection({ context, filter: option, id: '' })}>{filterLabels[option]}</button>)}
          </div>
          <ol className="race-options">{filtered.map(race => <li key={race.id}>
            <button type="button" className="race-option" aria-pressed={race === active} onClick={() => setSelection({ context, filter, id: race.id })}>
              <StageNumber value={race.round} />
              <span><strong>{race.title}</strong><small>{weekendDates(race)}</small></span>
              <Icon name="right" size={15} />
            </button>
          </li>)}</ol>
          {!filtered.length && <p className="data-empty">{state.status === 'loading' ? 'Загружаем календарь…' : state.status === 'unavailable' ? 'Календарь недоступен.' : state.races.length ? 'В этой подборке пока нет этапов.' : 'Календарь сезона пока недоступен в источнике.'}</p>}
          <p className="calendar-date-note">Даты этапов указаны по времени трассы, либо в UTC, если пояс неизвестен.</p>
        </div>
        <div className="weekend-content">
          {active && <>
            <div className="switch time-switch" role="group" aria-label="Часовой пояс сессий">
              <button type="button" aria-pressed={!trackTime} onClick={() => onZoneChange(false)}>Моё время</button>
              <button type="button" aria-pressed={trackTime} onClick={() => onZoneChange(true)}>Время трассы</button>
            </div>
            <WeekendDetails key={active.id} race={active} now={now} zone={zone} localZone={localZone} trackTime={trackTime} latestRound={latestRound} onDriver={onDriver} />
          </>}
        </div>
      </div>
      <div className="calendar-footer">
        <SourceStatus state={state} zone={localZone} />
        <span className="source-line"><a href={terms}>Jolpica F1</a><a href={dataLicense}>CC BY-NC-SA 4.0</a>
          <a href={resultsView ? 'https://www.formula1.com/en/results/' + state.year + '/races' : calendarSource}>Formula 1 <Icon name="external" size={13} /></a></span>
      </div>
    </div>
  </section>
}

export function NextRace({ race, now, zone, loading }: { race?: Weekend; now: number; zone: string; loading: boolean }) {
  const next = race && firstFuture(race, now)
  return <div className="next-race">
    <div className="next-title">
      <p className="eyebrow"><span /> {race ? 'Ближайший этап · ' + String(race.round).padStart(2, '0') : 'Календарь Formula 1'}</p>
      <strong>{race?.title ?? (loading ? 'Проверяем расписание' : 'Нет данных о ближайшем этапе')}</strong>
      {race && <small>{weekendDates(race)} <span> / </span> {race.country} · {race.zone ? 'местные даты' : 'даты UTC'}</small>}
    </div>
    {next?.start != null && <div className="next-count">
      <p>{next.name} · {formatDate(next.start, zone, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })} <span>({formatDate(next.start, zone, { timeZoneName: 'shortOffset' }).split(' ').at(-1)})</span></p>
      <Countdown target={next.start} now={now} />
    </div>}
    {race && !next && <p className="next-unknown">Время сессий пока не объявлено</p>}
  </div>
}

