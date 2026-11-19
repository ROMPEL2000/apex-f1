import { useState } from 'react'
import { dataLicense, firstFuture, formatDate, isUpcoming, officialCalendar, season, terms, timeLeft, weekendDates, type Weekend } from './calendar'
import { CircuitGraphic, Icon } from './icons'
import { useSchedule } from './useSchedule'

export function StageNumber({ value }: { value: number }) {
  return <span className="round-num">{String(value).padStart(2, '0')}</span>
}

export function Countdown({ target, now }: { target: number; now: number }) {
  const values = timeLeft(target, now)
  return <div className="countdown" aria-label={'До старта: ' + values.map((value, index) => value + [' дн.', ' ч.', ' мин.', ' сек.'][index]).join(' ')}>
    {values.map((value, index) => <span key={index} aria-hidden="true"><b>{String(value).padStart(2, '0')}</b><small>{['дни', 'часы', 'мин', 'сек'][index]}</small></span>)}
  </div>
}

type ScheduleState = ReturnType<typeof useSchedule>

export function Schedule({ state, now, localZone, trackTime, onZoneChange }: {
  state: ScheduleState
  now: number
  localZone: string
  trackTime: boolean
  onZoneChange: (trackTime: boolean) => void
}) {
  const [selected, setSelected] = useState('')
  const [full, setFull] = useState(false)
  const upcoming = state.races.filter(race => isUpcoming(race, now))
  const active = state.races.find(race => race.id === selected) ?? upcoming[0] ?? state.races.at(-1)
  const visible = full ? state.races : upcoming.slice(0, 4)
  const zone = (trackTime && active?.zone) || localZone
  const sourceMessage = {
    loading: 'Проверяем расписание',
    online: 'Проверено через API',
    saved: 'Сохранённая копия',
    bundle: 'Резервная копия сайта',
    unavailable: 'Источник временно недоступен',
  }[state.status]
  const nextSession = active && firstFuture(active, now)
  return <section className="calendar" id="calendar" aria-labelledby="calendar-title">
    <div className="wrap">
      <div className="section-heading">
        <div><p className="eyebrow"><span /> Сезон {state.year}</p><h2 id="calendar-title">Календарь</h2></div>
        <div className="switch time-switch" role="group" aria-label="Часовой пояс">
          <button type="button" aria-pressed={!trackTime} onClick={() => onZoneChange(false)}>Моё время</button>
          <button type="button" aria-pressed={trackTime} onClick={() => onZoneChange(true)}>Время трассы</button>
        </div>
      </div>
      <div className="calendar-layout">
        <div className="race-list">
          <div className="list-heading"><h3>Этапы</h3><button type="button" className="text-btn" aria-pressed={full} onClick={() => setFull(!full)}>{full ? 'Ближайшие' : 'Весь сезон'} <Icon name={full ? 'left' : 'arrow'} size={16} /></button></div>
          {visible.length > 0 ? <ol className="race-options">{visible.map(race => <li key={race.id}>
            <button type="button" className="race-option" aria-pressed={race === active} onClick={() => setSelected(race.id)}>
              <StageNumber value={race.round} />
              <span><strong>{race.title}</strong><small>{weekendDates(race)}</small></span>
              <Icon name="right" size={16} />
            </button>
          </li>)}</ol> : <p className="empty">{state.status === 'loading' ? 'Загружаем этапы…' : state.status === 'unavailable' ? 'Проверьте расписание на сайте Formula 1.' : 'Предстоящие этапы пока не опубликованы в источнике.'}</p>}
        </div>
        {active && <div className="timing">
          <div className="timing-header">
            <CircuitGraphic />
            <div className="timing-copy">
              <p className="eyebrow">Этап {active.round} <span className="text-divider">/</span> {weekendDates(active)}</p>
              <h3>{active.title}</h3>
              <p>{active.country} <span className="text-divider">/</span> {active.circuit}</p>
            </div>
          </div>
          <div className="session-zone"><Icon name="globe" size={16} /> {zone}{trackTime && !active.zone ? ' · пояс трассы пока неизвестен' : ''}</div>
          <ul className="sessions">
            {active.sessions.map(session => <li key={session.key} className={session === nextSession ? 'session next-session' : 'session'}>
              <span className="session-label">{session.name}{session === nextSession && <span className="next-tag">Ближайшая</span>}</span>
              {session.start !== null
                ? <time dateTime={new Date(session.start).toISOString()}><span>{formatDate(session.start, zone, { day: 'numeric', month: 'short' })}</span><strong>{formatDate(session.start, zone, { hour: '2-digit', minute: '2-digit', hourCycle: 'h23' })}</strong></time>
                : <span className="missing-time"><time dateTime={session.date}>{formatDate(Date.parse(session.date + 'T12:00:00Z'), 'UTC', { day: 'numeric', month: 'short' })}</time> · время не объявлено</span>}
            </li>)}
          </ul>
        </div>}
      </div>
      <div className="calendar-footer">
        <span role="status"><b className={'status-dot ' + state.status} /> {sourceMessage}{state.checkedAt ? ' · ' + formatDate(state.checkedAt, localZone, { dateStyle: 'medium', timeStyle: 'short' }) : ''}</span>
        <span><a href={terms}>Jolpica F1</a> <span className="text-divider">/</span> <a href={dataLicense}>CC BY-NC-SA</a> <span className="text-divider">/</span> <a href={state.year === season ? officialCalendar : 'https://www.formula1.com/en/racing/' + state.year}>Календарь Formula 1 <Icon name="external" size={13} /></a></span>
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
      {race && <small>{weekendDates(race)} <span> / </span> {race.country}</small>}
    </div>
    {next?.start != null && <div className="next-count">
      <p>{next.name} · {formatDate(next.start, zone, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })} <span>({formatDate(next.start, zone, { timeZoneName: 'shortOffset' }).split(' ').at(-1)})</span></p>
      <Countdown target={next.start} now={now} />
    </div>}
    {race && !next && <p className="next-unknown">Время сессий пока не объявлено</p>}
  </div>
}

