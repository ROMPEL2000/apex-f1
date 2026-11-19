import { formatDate, terms, type Weekend } from './calendar'
import { Icon } from './icons'
import { leaderGap, type Classification, type Participant } from './sport'
import type { ResourceState } from './useResource'

export type StandingsTab = 'drivers' | 'constructors'
export type OpenParticipant = (driver: Participant, teams: Participant[], year: number) => void

const statuses = {
  loading: 'Проверяем данные',
  online: 'Источник проверен',
  saved: 'Копия из браузера',
  bundle: 'Резервная копия сайта',
  unavailable: 'Источник временно недоступен',
}

export function SourceStatus({ state, zone }: { state: ResourceState<unknown>; zone: string }) {
  return <span role="status" className="data-status"><i className={state.status} /> {statuses[state.status]}
    {state.checkedAt !== undefined && Number.isFinite(state.checkedAt) ? ' · ' + formatDate(state.checkedAt, zone, { dateStyle: 'medium', timeStyle: 'short' }) : ''}</span>
}

export function TeamPill({ item, onTeam }: { item: Participant; onTeam: (id: string) => boolean }) {
  const teamId = item.id
  if (!['mercedes','ferrari','red-bull','mclaren','racing-bulls','alpine','haas','audi','williams','aston-martin','cadillac'].includes(teamId)) return <span>{item.name}</span>
  return <a href={'#teams/' + teamId} className="participant-link" onClick={event => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
    if (onTeam(teamId)) event.preventDefault()
  }}>{item.name}</a>
}

export function Standings({ view, year, calendar, seasons, changeSeason, zone, drivers, constructors, onDriver, onTeam }: {
  view: StandingsTab
  year: number
  calendar: Weekend[]
  seasons: number[]
  changeSeason: (year: number) => void
  zone: string
  drivers: ResourceState<Classification | null>
  constructors: ResourceState<Classification | null>
  onDriver: OpenParticipant
  onTeam: (id: string) => boolean
}) {
  const individual = view === 'drivers'
  const source = individual ? drivers : constructors
  const rows = source.data?.rows ?? []
  const round = source.data?.round
  const race = round ? calendar.find(item => item.round === round) : undefined
  const leader = rows[0]?.points ?? null
  const official = 'https://www.formula1.com/en/results/' + year + (individual ? '/drivers' : '/team')

  return <section className="race-hub standings-hub" id="drivers" aria-labelledby="standing-title">
    <span id="constructors" className="section-anchor" />
    <div className="wrap">
      <div className="editorial-heading table-heading">
        <div><p className="index-label"><i /> Сезон {year}</p><h2 id="standing-title">Чемпионат</h2></div>
        <nav className="line-tabs" aria-label="Вид зачёта">
          <a href="#drivers" aria-current={individual ? 'page' : undefined}>Личный зачёт</a>
          <a href="#constructors" aria-current={!individual ? 'page' : undefined}>Конструкторы</a>
        </nav>
      </div>
      <div className="data-meta">
        <label className="season-control">Сезон данных <select value={year} onChange={event => changeSeason(Number(event.target.value))}>{seasons.map(item => <option key={item}>{item}</option>)}</select></label>
        <span>{round ? 'После этапа ' + String(round).padStart(2, '0') + (race ? ' · ' + race.title : '') : 'Классификация сезона ' + year}</span>
        <SourceStatus state={source} zone={zone} />
      </div>
      {rows.length > 0 ? <div className="table-scroll" tabIndex={0} role="region" aria-label={individual ? 'Таблица личного зачёта' : 'Таблица Кубка конструкторов'}>
        <table className="timing-table">
          <thead><tr><th scope="col">Поз.</th><th scope="col">{individual ? 'Пилот' : 'Команда'}</th>
            {individual && <th scope="col">Команда</th>}
            <th scope="col" className="num">Очки</th><th scope="col" className="num">Победы</th><th scope="col" className="num">От лидера</th></tr></thead>
          <tbody>{rows.map((row, index) => {
            const behind = leaderGap(leader, row.points)
            return <tr key={row.participant.id} className={index < 3 ? 'top-three' : ''}>
              <td className="table-position">{row.position}</td>
              <th scope="row">{individual
                ? <button className="participant-link" type="button" onClick={() => onDriver(row.participant, row.constructors, year)}>{row.participant.name}</button>
                : <TeamPill item={row.participant} onTeam={onTeam} />}</th>
              {individual && <td>{row.constructors.map(team => team.name).join(' / ') || '—'}</td>}
              <td className="num points">{row.points ?? '—'}</td>
              <td className="num">{row.wins ?? '—'}</td>
              <td className="num">{behind === null || index === 0 ? '—' : behind}</td>
            </tr>
          })}</tbody>
        </table>
      </div> : <p className="data-empty">{source.status === 'loading' ? 'Загружаем таблицу зачёта…' : source.status === 'unavailable' ? 'Таблица зачёта недоступна. Сверьтесь с Formula 1.' : 'Классификация сезона пока не опубликована в источнике.'}</p>}
      <p className="source-line"><a href={terms}>Jolpica F1</a><a href={official}>Классификация Formula 1 <Icon name="external" size={14} /></a></p>
    </div>
  </section>
}
