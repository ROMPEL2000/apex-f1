import { memo, useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { createRoot } from 'react-dom/client'
import { LazyMotion, MotionConfig, domAnimation, useReducedMotion } from 'motion/react'
import '@fontsource-variable/golos-text'
import '@fontsource/barlow-condensed/latin-700-italic.css'
import '@fontsource/barlow-condensed/latin-800-italic.css'
import * as m from 'motion/react-m'
import { isUpcoming, season } from './calendar'
import { DriverProfile, Garage, MediaPhoto, teamLink } from './Garage'
import { ApexMark, Icon } from './icons'
import { media, mediaUrl } from './media'
import { NextRace, Schedule } from './Schedule'
import { driversSource, driversTitleSource, editorialDate, teams, teamTitleSource, type Team } from './teams'
import { useSchedule } from './useSchedule'
import './styles.css'

const videoCredit = media['warm-up.mp4']
const heroPhoto = 'hero.webp'
const repository = 'https://github.com/ROMPEL2000/apex-f1'

function getRoute() {
  const [section, teamId, driverId] = location.hash.slice(1).split('/')
  return { section, teamId, driverId }
}

function Modal({ children, close, wide = false }: { children: ReactNode; close: () => void; wide?: boolean }) {
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
  return <dialog ref={element} className={wide ? 'dialog video-dialog' : 'dialog'} aria-labelledby="dialog-title"
    onCancel={event => { event.preventDefault(); callback.current() }}
    onClick={event => { if (event.target === event.currentTarget) callback.current() }}>
    <div className="dialog-inner">
      <button type="button" className="dialog-close" aria-label="Закрыть" onClick={() => callback.current()}><Icon name="close" /></button>
      {children}
    </div>
  </dialog>
}

function Film() {
  const [failed, setFailed] = useState(false)
  const reduce = useReducedMotion()
  return <div className="film">
    <div className="film-heading"><p className="eyebrow">Сочи / 2021</p><h2 id="dialog-title">Прогревочный круг</h2></div>
    {failed || !videoCredit
      ? <div className="video-fallback"><MediaPhoto file={heroPhoto} alt="" eager /><p>Ролик временно недоступен. <a href={videoCredit?.source}>Открыть оригинал на Wikimedia Commons</a></p></div>
      : <video src={mediaUrl('warm-up.mp4')} poster={mediaUrl('warm-up-poster.webp')} autoPlay={!reduce} muted playsInline controls preload="metadata" onError={() => setFailed(true)} aria-label="Выезд болидов Formula 1 на прогревочный круг в Сочи" />}
    {videoCredit && <p className="film-credit"><a href={videoCredit.source}>Съёмка {videoCredit.author}</a> · <a href={videoCredit.licenseUrl}>{videoCredit.license}</a> · {videoCredit.changes}</p>}
  </div>
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
        <p>Составы, статистика и титулы сверены {editorialDate}. Названия и товарные знаки принадлежат их владельцам.</p>
        <ul className="credits-sources">
          <li><a href={driversSource}>Составы пилотов Formula 1</a></li>
          <li><a href={driversTitleSource}>Личный титул 2026</a></li>
          <li><a href={teamTitleSource}>Кубок конструкторов 2026</a></li>
        </ul>
        <ul className="media-list">{Object.values(media).map(item => <li key={item.file}>
          <a href={item.source}>{item.title}</a><small>{item.author || 'Автор указан в карточке файла'} · {item.licenseUrl ? <a href={item.licenseUrl}>{item.license}</a> : item.license} · {item.changes}</small>
        </li>)}</ul>
      </div>
    </details>
  </div>
})

function App() {
  const [route, setRoute] = useState(getRoute)
  const [direction, setDirection] = useState(1)
  const [film, setFilm] = useState(false)
  const [trackTime, setTrackTime] = useState(false)
  const [now, setNow] = useState(Date.now)
  const reduce = useReducedMotion()
  const localZone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
  const visitorYear = Number(new Intl.DateTimeFormat('en', { year: 'numeric', timeZone: localZone }).format(now))
  const currentYearCalendar = useSchedule(Math.max(season, visitorYear))
  const [calendarYear, setCalendarYear] = useState<number>()
  const primaryUpcoming = currentYearCalendar.races.find(race => isUpcoming(race, now))
  const seasonFinished = currentYearCalendar.races.length > 0 && !primaryUpcoming
  const nextYear = currentYearCalendar.year + 1
  const nextCalendar = useSchedule(seasonFinished ? nextYear : 0)
  const manuallySelected = calendarYear !== undefined && calendarYear !== currentYearCalendar.year
  const auxiliaryCalendar = useSchedule(manuallySelected && (!seasonFinished || calendarYear !== nextYear) ? calendarYear : 0)
  const state = manuallySelected ? (calendarYear === nextCalendar.year ? nextCalendar : auxiliaryCalendar) : currentYearCalendar
  const upcoming = primaryUpcoming ?? nextCalendar.races.find(race => isUpcoming(race, now))
  const activeTeam = teams.find(team => team.id === route.teamId) ?? teams[0]
  const driver = activeTeam.drivers.find(item => item.id === route.driverId)

  useEffect(() => {
    const syncRoute = () => setRoute(getRoute())
    const syncTime = () => setNow(Date.now())
    const ticker = window.setInterval(syncTime, 1000)
    window.addEventListener('hashchange', syncRoute)
    window.addEventListener('popstate', syncRoute)
    document.addEventListener('visibilitychange', syncTime)
    if (getRoute().section === 'teams') document.getElementById('teams')?.scrollIntoView({ behavior: 'instant' })
    return () => {
      window.clearInterval(ticker)
      window.removeEventListener('hashchange', syncRoute)
      window.removeEventListener('popstate', syncRoute)
      document.removeEventListener('visibilitychange', syncTime)
    }
  }, [])

  const navigate = useCallback((team: Team, offset = 1, driverId?: string) => {
    const url = teamLink(team, driverId)
    setDirection(offset)
    if (location.hash !== url) {
      history.pushState(driverId ? { apexDriver: true } : null, '', url)
      setRoute(getRoute())
    }
  }, [])

  function closeDriver() {
    if (history.state?.apexDriver) {
      history.back()
    } else {
      history.replaceState(null, '', teamLink(activeTeam))
      setRoute(getRoute())
    }
  }

  return <MotionConfig reducedMotion="user"><LazyMotion features={domAnimation} strict>
    <a className="skip" href="#content">Перейти к содержанию</a>
    <header className="site-header" id="top">
      <div className="wrap navigation">
        <a className="brand" href="#top" aria-label="APEX, главная"><ApexMark /><span>APEX</span></a>
        <nav aria-label="Основная навигация"><a href="#calendar">Календарь</a><a href="#teams">Команды</a></nav>
        <a className="nav-season" href="#calendar"><span /> Сезон {currentYearCalendar.year}</a>
      </div>
    </header>
    <main id="content">
      <section className="hero" aria-labelledby="hero-title">
        <MediaPhoto file={heroPhoto} className="hero-image" alt="" eager />
        <div className="hero-scrim" />
        <div className="hero-lanes" aria-hidden="true"><i /><i /><i /></div>
        <div className="wrap hero-inner">
          <m.div className="hero-copy" initial={reduce ? false : { opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: reduce ? 0 : 0.6 }}>
            <p className="hero-kicker"><i /> Независимый гид по сезону</p>
            <h1 id="hero-title">FORMULA<span> 1</span></h1>
            <p className="hero-description">От старта до клетчатого флага. Расписание гонок, команды и пилоты Формулы-1.</p>
            <div className="hero-actions">
              <a className="primary-button" href="#calendar" onClick={() => setCalendarYear(seasonFinished ? nextYear : undefined)}>Смотреть расписание <Icon name="down" size={18} /></a>
              <button className="film-button" type="button" onClick={() => setFilm(true)}><span><Icon name="play" size={17} /></span> Смотреть видео</button>
            </div>
          </m.div>
          <div className="hero-bottom">
            <NextRace race={upcoming} now={now} loading={currentYearCalendar.status === 'loading' || (seasonFinished && nextCalendar.status === 'loading')} zone={trackTime && upcoming?.zone ? upcoming.zone : localZone} />
            <div className="hero-index" aria-hidden="true"><span /><span /><span /><span /><span /></div>
          </div>
        </div>
      </section>
      <Schedule state={state} now={now} localZone={localZone} trackTime={trackTime} onZoneChange={setTrackTime} />
      <div className="season-links"><div className="wrap">
        <button type="button" className="text-btn" onClick={() => { setCalendarYear(manuallySelected ? undefined : currentYearCalendar.year === season ? season + 1 : season); document.getElementById('calendar')?.scrollIntoView() }}>
          {manuallySelected ? 'Вернуться к сезону ' + currentYearCalendar.year : 'Календарь ' + (currentYearCalendar.year === season ? season + 1 : season)} <Icon name="arrow" size={17} />
        </button>
      </div></div>
      <Garage team={activeTeam} direction={direction} navigate={navigate} />
    </main>
    <footer className="site-footer"><Credits /></footer>
    {film && <Modal close={() => setFilm(false)} wide><Film /></Modal>}
    {driver && <Modal close={closeDriver}><DriverProfile team={activeTeam} driverId={driver.id} /></Modal>}
  </LazyMotion></MotionConfig>
}

createRoot(document.getElementById('root')!).render(<App />)

