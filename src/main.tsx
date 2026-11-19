import { memo, useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { createRoot } from 'react-dom/client'
import { LazyMotion, MotionConfig, domAnimation, useReducedMotion, useScroll, useSpring, useTransform } from 'motion/react'
import * as m from 'motion/react-m'
import '@fontsource-variable/golos-text'
import '@fontsource/barlow-condensed/latin-700-italic.css'
import '@fontsource/barlow-condensed/latin-800-italic.css'
import { isUpcoming, season } from './calendar'
import { DriverProfile, Garage, teamLink, type TeamStanding } from './Garage'
import { HeroMedia, heroVideoCredit, previewMode, previewUrl } from './HeroMedia'
import { ApexMark, Icon } from './icons'
import { media, mediaUrl } from './media'
import { NextRace, Schedule } from './Schedule'
import { parseStandings, type Participant } from './sport'
import { Standings } from './Standings'
import { useResource } from './useResource'
import { trackArchiveSource, trackGeoSource } from './track-data'
import { driversSource, driversTitleSource, editorialDate, teams, teamTitleSource, type Team } from './teams'
import { useSchedule } from './useSchedule'
import './styles.css'
import './cinematic.css'
import './timing.css'

const repository = 'https://github.com/ROMPEL2000/apex-f1'
const localZone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'

function readRoute() {
  const [section, teamId, driverId] = location.hash.slice(1).split('/')
  return { section, teamId, driverId }
}

function Modal({ children, close }: { children: ReactNode; close: () => void }) {
  const element = useRef<HTMLDialogElement>(null)
  const callback = useRef(close)
  callback.current = close
  useEffect(() => {
    const dialog = element.current
    const wasFocused = document.activeElement
    dialog?.showModal()
    return () => {
      dialog?.close()
      if (wasFocused instanceof HTMLElement && wasFocused !== document.body) wasFocused.focus({ preventScroll: true })
    }
  }, [])
  return <dialog ref={element} className="dialog" aria-labelledby="dialog-title"
    onCancel={event => { event.preventDefault(); callback.current() }}
    onClick={event => { if (event.target === event.currentTarget) callback.current() }}>
    <div className="dialog-inner">
      <button type="button" className="dialog-close" aria-label="Закрыть" onClick={() => callback.current()}><Icon name="close" /></button>
      {children}
    </div>
  </dialog>
}

const Credits = memo(function Credits() {
  return <div className="wrap footer-layout">
    <div>
      <a className="brand" href="#top"><ApexMark /> <span>APEX</span></a>
      <p>Независимый некоммерческий фан-проект о Formula 1.</p>
      <a className="source-link" href={repository}>Код проекта <Icon name="external" size={15} /></a>
    </div>
    <details id="credits">
      <summary>Источники и авторство</summary>
      <div className="credits-body">
        <p>Составы и титулы сверены {editorialDate}. Названия и товарные знаки принадлежат их владельцам.</p>
        <ul className="credits-sources">
          <li><a href={driversSource}>Составы пилотов Formula 1</a></li>
          <li><a href={driversTitleSource}>Личный титул 2026</a></li>
          <li><a href={teamTitleSource}>Кубок конструкторов 2026</a></li>
          <li>Схемы трасс · <a href={trackArchiveSource}>Jules Roy / F1DB</a> · <a href="https://creativecommons.org/licenses/by/4.0/">CC BY 4.0</a></li>
          <li>Геометрия Имолы и Сепанга · <a href={trackGeoSource}>Tomislav Bacinger</a> · MIT</li>
          {heroVideoCredit && <li>Фоновый ролик <a href={heroVideoCredit.source}>{heroVideoCredit.author}</a>{heroVideoCredit.licenseUrl && <> · <a href={heroVideoCredit.licenseUrl}>{heroVideoCredit.license}</a></>}</li>}
        </ul>
        <ul className="media-list">{Object.values(media).map(item => <li key={item.file}>
          <a href={item.source}>{item.title}</a><small>{item.author || 'Автор указан в карточке файла'} · {item.licenseUrl ? <a href={item.licenseUrl}>{item.license}</a> : item.license} · {item.changes}</small>
        </li>)}</ul>
      </div>
    </details>
  </div>
})

function LiveNextRace({ state, trackTime }: { state: ReturnType<typeof useSchedule>; trackTime: boolean }) {
  const [now, setNow] = useState(Date.now)
  const current = state.races.find(race => isUpcoming(race, now))
  const next = useSchedule(state.races.length && !current ? state.year + 1 : 0)
  const upcoming = current ?? next.races.find(race => isUpcoming(race, now))
  useEffect(() => {
    const tick = () => setNow(Date.now())
    const timer = window.setInterval(tick, 1000)
    document.addEventListener('visibilitychange', tick)
    return () => {
      window.clearInterval(timer)
      document.removeEventListener('visibilitychange', tick)
    }
  }, [])
  return <NextRace race={upcoming} now={now} loading={state.status === 'loading' || Boolean(state.races.length && !current && next.status === 'loading')} zone={trackTime && upcoming?.zone ? upcoming.zone : localZone} />
}

function App() {
  const reveal = useRef<HTMLElement>(null)
  const overviewHeading = useRef<HTMLDivElement>(null)
  const reduce = useReducedMotion()
  const { scrollYProgress } = useScroll({ target: reveal, offset: ['start end', 'start 64%'] })
  const markOpacity = useTransform(scrollYProgress, [0, .24, .92], [1, .93, 0])
  const navY = useTransform(scrollYProgress, [0, .36], [22, 0])
  const { scrollYProgress: headingProgress } = useScroll({ target: overviewHeading, offset: ['start end', 'start 73%'] })
  const introProgress = useSpring(headingProgress, { stiffness: 115, damping: 23, skipInitialAnimation: true })
  const kickerOpacity = useTransform(introProgress, [.15, .48], [0, 1])
  const titleY = useTransform(introProgress, [.26, .88], [42, 0])
  const titleOpacity = useTransform(introProgress, [.26, .78], [0, 1])
  const actionsY = useTransform(introProgress, [.4, .97], [29, 0])
  const detailOpacity = useTransform(introProgress, [.36, .88], [.25, 1])
  const [route, setRoute] = useState(readRoute)
  const [trackTime, setTrackTime] = useState(false)
  const currentYear = Math.max(season, new Date().getFullYear())
  const [year, setYear] = useState(currentYear)
  const [archivedDriver, setArchivedDriver] = useState<{ person: Participant; teams: Participant[]; year: number }>()
  const liveCalendar = useSchedule(currentYear)
  const selectedCalendar = useSchedule(currentYear === year ? 0 : year)
  const calendar = currentYear === year ? liveCalendar : selectedCalendar
  const seasons = Array.from(new Set([Math.max(2027, currentYear), 2027, 2026, 2025])).sort((a, b) => b - a)
  const readDrivers = useCallback((payload: unknown) => parseStandings(payload, year, 'drivers'), [year])
  const readTeams = useCallback((payload: unknown) => parseStandings(payload, year, 'constructors'), [year])
  const drivers = useResource(year, 'driverstandings', readDrivers)
  const constructors = useResource(year, 'constructorstandings', readTeams)
  const teamStandings = useMemo(() => new Map<string, TeamStanding>(
    constructors.data?.rows.map(row => [row.participant.id, row]) ?? [],
  ), [constructors.data])
  const activeTeam = teams.find(team => team.id === route.teamId)
  const driver = activeTeam?.drivers.find(item => item.id === route.driverId)

  useEffect(() => {
    const syncRoute = () => setRoute(readRoute())
    const initialHash = location.hash
    const initial = readRoute()
    const initialAnchor = initial.section === 'teams' && initial.teamId ? 'teams/' + initial.teamId : initial.section
    const restoreInitialAnchor = () => {
      requestAnimationFrame(() => requestAnimationFrame(() => {
        if (location.hash === initialHash && initialAnchor) {
          document.getElementById(initialAnchor)?.scrollIntoView({ behavior: 'instant' })
        }
      }))
    }
    restoreInitialAnchor()
    if (document.readyState !== 'complete') window.addEventListener('load', restoreInitialAnchor, { once: true })
    window.addEventListener('hashchange', syncRoute)
    window.addEventListener('popstate', syncRoute)
    return () => {
      window.removeEventListener('load', restoreInitialAnchor)
      window.removeEventListener('hashchange', syncRoute)
      window.removeEventListener('popstate', syncRoute)
    }
  }, [])

  const navigate = useCallback((team: Team, driverId?: string) => {
    const url = teamLink(team, driverId)
    if (location.hash === url) {
      if (!driverId) document.getElementById(url.slice(1))?.scrollIntoView()
      return
    }
    const previousTeam = readRoute().teamId
    history.pushState(driverId ? { apexDriver: true } : null, '', url)
    setRoute(readRoute())
    if (!driverId || previousTeam !== team.id) document.getElementById(teamLink(team).slice(1))?.scrollIntoView()
  }, [])

  const onDriver = useCallback((person: Participant, teamsAtEvent: Participant[], season: number) => {
    const team = teams.find(item => item.drivers.some(driver => driver.id === person.id))
    if (team) navigate(team, person.id)
    else setArchivedDriver({ person, teams: teamsAtEvent, year: season })
  }, [navigate])

  const onTeam = useCallback((id: string) => {
    const team = teams.find(item => item.id === id)
    if (!team) return false
    navigate(team)
    return true
  }, [navigate])

  function closeDriver() {
    if (history.state?.apexDriver) {
      history.back()
    } else if (activeTeam) {
      history.replaceState(null, '', teamLink(activeTeam))
      setRoute(readRoute())
    }
  }

  return <MotionConfig reducedMotion="user"><LazyMotion features={domAnimation} strict>
    <a className="skip" href="#content">Перейти к содержанию</a>
    <section className="opening" id="top" aria-label="Заставка Formula 1">
      <HeroMedia />
      <div className="opening-shade" aria-hidden="true" />
      <m.div className="opening-mark" style={reduce ? undefined : { opacity: markOpacity }}>
        {previewMode && <img className="opening-logo" src={previewUrl('f1-mark.svg')} alt="Логотип F1"
          onError={event => { event.currentTarget.hidden = true }} />}
        <span className="opening-wordmark large-type">FORMULA 1</span>
      </m.div>
    </section>
    <header className="site-header" ref={reveal}>
      <m.div className="wrap navigation" style={reduce ? undefined : { y: navY }}>
        <a className="brand" href="#top" aria-label="APEX, главная"><ApexMark /><span>APEX</span></a>
        <nav aria-label="Основная навигация">
          <a href="#teams">Команды</a><a href="#calendar">Календарь</a><a href="#drivers">Личный зачёт</a><a href="#constructors">Конструкторы</a><a href="#results">Результаты</a>
        </nav>
        <span className="nav-season"><span /> {currentYear}</span>
      </m.div>
    </header>
    <main id="content">
      <section className="hero-overview" aria-labelledby="hero-title">
        <img className="overview-photo" src={mediaUrl('overview-vegas-1920.webp')} alt="" width="1920" height="1080"
          srcSet={[960, 1920, 3840].map(width => mediaUrl('overview-vegas-' + width + '.webp') + ' ' + width + 'w').join(', ')}
          sizes="(max-width: 680px) 100vw, 80vw" loading="lazy" decoding="async" />
        <div className="wrap overview-layout">
          <div>
            <div ref={overviewHeading} className="overview-heading">
              <m.p className="index-label" style={reduce ? undefined : { opacity: kickerOpacity }}><i /> Независимый гид по сезону</m.p>
              <m.h1 id="hero-title" className="large-type" style={reduce ? undefined : { y: titleY, opacity: titleOpacity }}>FORMULA<span> 1</span></m.h1>
            </div>
            <m.div className="hero-actions" style={reduce ? undefined : { y: actionsY }}>
              <a className="primary-button" href="#teams">Команды <Icon name="down" size={18} /></a>
              <a className="secondary-button" href="#calendar" onClick={() => setYear(currentYear)}>Расписание <Icon name="arrow" size={17} /></a>
            </m.div>
          </div>
          <m.div className="overview-timing" style={reduce ? undefined : { y: actionsY, opacity: detailOpacity }}>
            <LiveNextRace state={liveCalendar} trackTime={trackTime} />
          </m.div>
        </div>
      </section>
      <Garage year={year} standings={teamStandings} navigate={navigate} />
      <Schedule state={calendar} localZone={localZone} trackTime={trackTime} onZoneChange={setTrackTime}
        resultsView={route.section === 'results'} latestRound={Math.max(drivers.data?.round ?? 0, constructors.data?.round ?? 0)}
        seasons={seasons} changeSeason={setYear} onDriver={onDriver} />
      <Standings view={route.section === 'constructors' ? 'constructors' : 'drivers'} year={year}
        calendar={calendar.races} seasons={seasons} changeSeason={setYear} zone={localZone} drivers={drivers} constructors={constructors} onDriver={onDriver} onTeam={onTeam} />
    </main>
    <footer className="site-footer"><Credits /></footer>
    {archivedDriver && <Modal close={() => setArchivedDriver(undefined)}><div className="profile-copy archived-profile">
      <p className="index-label">Пилот · {archivedDriver.year}</p>
      <h2 id="dialog-title">{archivedDriver.person.name}</h2>
      <p>{archivedDriver.teams.map(team => team.name).join(' / ') || 'Команда не указана в классификации'}</p>
      {archivedDriver.person.url && <a className="source-link" href={archivedDriver.person.url}>Биография <Icon name="external" size={15} /></a>}
    </div></Modal>}
    {activeTeam && driver && <Modal close={closeDriver}><DriverProfile team={activeTeam} driverId={driver.id} /></Modal>}
  </LazyMotion></MotionConfig>
}

createRoot(document.getElementById('root')!).render(<App />)

