import { memo, useEffect, useRef, type CSSProperties, type KeyboardEvent, type PointerEvent } from 'react'
import { AnimatePresence, useReducedMotion } from 'motion/react'
import * as m from 'motion/react-m'
import { Icon } from './icons'
import { media, mediaUrl } from './media'
import { driversTitleSource, editorialDate, standingSource, teams, teamTitleSource, type Team } from './teams'

export const teamLink = (team: Team, driver?: string) => '#teams/' + team.id + (driver ? '/' + driver : '')

export function MediaPhoto({ file, alt, className, eager = false }: { file: string; alt: string; className?: string; eager?: boolean }) {
  if (!media[file]) return null
  return <img className={className} src={mediaUrl(file)} alt={alt} loading={eager ? 'eager' : 'lazy'} decoding="async"
    onError={event => { event.currentTarget.style.visibility = 'hidden' }} />
}

export const Garage = memo(function Garage({ team, direction, navigate }: { team: Team; direction: number; navigate: (team: Team, offset?: number, driver?: string) => void }) {
  const reduce = useReducedMotion()
  const gesture = useRef<{ x: number; y: number; id: number } | null>(null)
  const selector = useRef<HTMLElement>(null)
  useEffect(() => {
    const container = selector.current
    const tab = container?.querySelector<HTMLAnchorElement>('.active')
    if (!tab || !container) return
    const item = tab.getBoundingClientRect()
    const rail = container.getBoundingClientRect()
    if (item.left < rail.left || item.right > rail.right) {
      container.scrollBy({ left: item.left - rail.left - (rail.width - item.width) / 2, behavior: reduce ? 'instant' : 'smooth' })
    }
  }, [team, reduce])
  const current = teams.indexOf(team)
  const move = (step: number) => navigate(teams[(current + step + teams.length) % teams.length], step)
  const enter = (delay: number, offset = 20) => ({
    initial: reduce ? false as const : { opacity: 0, y: offset },
    animate: { opacity: 1, y: 0 },
    transition: { duration: reduce ? 0 : 0.42, delay: reduce ? 0 : delay },
  })

  function onKeyDown(event: KeyboardEvent<HTMLElement>) {
    if (event.altKey || event.ctrlKey || event.metaKey || (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight')) return
    event.preventDefault()
    move(event.key === 'ArrowRight' ? 1 : -1)
  }

  function onPointerDown(event: PointerEvent<HTMLElement>) {
    if (event.pointerType === 'touch') gesture.current = { x: event.clientX, y: event.clientY, id: event.pointerId }
  }

  function onPointerUp(event: PointerEvent<HTMLElement>) {
    const start = gesture.current
    gesture.current = null
    if (!start || start.id !== event.pointerId) return
    const dx = event.clientX - start.x
    if (Math.abs(dx) > 54 && Math.abs(dx) > Math.abs(event.clientY - start.y) * 1.4) move(dx < 0 ? 1 : -1)
  }

  const carFile = 'car-' + team.id + '.webp'
  const logoFile = 'logo-' + team.id + '.webp'
  return <section className="garage" id="teams" aria-labelledby="garage-title" tabIndex={0} onKeyDown={onKeyDown}>
    <div className="wrap">
      <div className="section-heading garage-heading">
        <div><p className="eyebrow"><span /> Решётка 2026</p><h2 id="garage-title">Команды</h2></div>
        <div className="team-arrows">
          <button type="button" aria-label="Предыдущая команда" onClick={() => move(-1)}><Icon name="left" /></button>
          <span aria-live="polite" aria-atomic="true">{String(current + 1).padStart(2, '0')} <span>/</span> {teams.length}<span className="sr-only">, {team.label}</span></span>
          <button type="button" aria-label="Следующая команда" onClick={() => move(1)}><Icon name="right" /></button>
        </div>
      </div>
      <nav ref={selector} className="team-selector" aria-label="Выбор команды">
        {teams.map((item, index) => <a key={item.id} className={item === team ? 'active' : ''} aria-current={item === team ? 'true' : undefined} href={teamLink(item)}
          style={{ '--tab-color': item.accent } as CSSProperties} onClick={event => { if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return; event.preventDefault(); navigate(item, index < current ? -1 : 1) }}>
          <span />{item.label}
        </a>)}
      </nav>
    </div>
    <m.div className="team-stage" animate={{ backgroundColor: team.scene }} initial={false} transition={{ duration: reduce ? 0 : 0.55 }}
      style={{ '--team-accent': team.accent } as CSSProperties} onPointerDown={onPointerDown} onPointerUp={onPointerUp} onPointerCancel={() => { gesture.current = null }}>
      <div className="team-gridline" aria-hidden="true" />
      <div className="wrap scene-wrap">
        <div className="team-visuals">
          <AnimatePresence initial={false} custom={direction}>
            <m.div className="car-frame" key={team.id} custom={direction}
              variants={{
                enter: (side: number) => ({ x: reduce ? 0 : side * 90, opacity: 0 }),
                settled: { x: 0, opacity: 1 },
                leave: (side: number) => ({ x: reduce ? 0 : side * -60, opacity: 0 }),
              }}
              initial="enter" animate="settled" exit="leave" transition={{ duration: reduce ? 0 : 0.48, ease: [0.2, 0.65, 0.25, 1] }}>
              <MediaPhoto file={carFile} alt={team.label + ' ' + team.car + ' на трассе'} eager />
              <div className="car-shade" />
              <span className="car-caption">{team.car} <i /> 2026</span>
            </m.div>
          </AnimatePresence>
        </div>
        <div className="scene-foreground" key={team.id}>
          <div className="team-identity">
            <m.div className="team-mark" {...enter(0)} aria-hidden="true">
              {media[logoFile] ? <MediaPhoto file={logoFile} alt="" eager /> : <span>{team.mark}</span>}
            </m.div>
            <m.h3 {...enter(0.035, 28)}>{team.label}</m.h3>
            <m.p className="work-name" {...enter(0.07)}>{team.name}</m.p>
            {team.champion && <m.a className="champion-tag" href={teamTitleSource} {...enter(0.11)}><Icon name="trophy" size={17} /> Кубок конструкторов {team.champion}</m.a>}
          </div>
          <m.div className="team-facts" {...enter(0.17)}>
            <div><small>Болид</small><strong>{team.car}</strong></div>
            <div><small>База</small><strong>{team.base}</strong></div>
            <div><small>Очки к {editorialDate}</small><a href={standingSource}><strong>{team.points}</strong><Icon name="external" size={14} /></a></div>
          </m.div>
        </div>
      </div>
      <div className="wrap team-bottom" key={team.id + '-details'}>
        <m.div className="team-editorial" {...enter(0.16)}>
          <h4>История команды</h4><p>{team.history}</p>
          <div className="team-fact"><strong>Факт из истории</strong><p>{team.fact}</p><a href={'https://www.formula1.com/en/teams/' + team.source}>Профиль Formula 1 <Icon name="external" size={14} /></a></div>
        </m.div>
        <div className="drivers">
          <h4>Пилоты</h4>
          <div className="driver-pair">
            {team.drivers.map((driver, index) => <m.a href={teamLink(team, driver.id)} className="driver-tile" key={driver.id} {...enter(0.2 + index * 0.085, 28)}
              onClick={event => { if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return; event.preventDefault(); navigate(team, 0, driver.id) }}>
              <div className="driver-portrait">
                <span className="driver-number" aria-hidden="true">{driver.number}</span>
                <MediaPhoto file={'driver-' + driver.id + '.webp'} alt="" />
                {driver.champion && <span className="mini-title"><Icon name="trophy" size={15} /> Чемпион {driver.champion}</span>}
              </div>
              <div className="driver-meta"><span><b>{driver.name}</b><small>№ {driver.number} <i /> {driver.country}</small></span><Icon name="arrow" /></div>
            </m.a>)}
          </div>
        </div>
      </div>
    </m.div>
  </section>
})

export function DriverProfile({ team, driverId }: { team: Team; driverId: string }) {
  const driver = team.drivers.find(item => item.id === driverId)
  if (!driver) return null
  return <div className="profile" style={{ '--team-accent': team.accent } as CSSProperties}>
    <div className="profile-photo"><MediaPhoto file={'driver-' + driver.id + '.webp'} alt={driver.name} eager /></div>
    <div className="profile-copy">
      <p className="eyebrow">{team.label} / № {driver.number}</p>
      <h2 id="dialog-title">{driver.name}</h2>
      <p>{driver.country}</p>
      {driver.champion && <a className="champion-tag" href={driversTitleSource}><Icon name="trophy" size={18} /> Чемпион мира {driver.champion}</a>}
      <p>{driver.bio}</p>
      <a className="source-link" href={'https://www.formula1.com/en/drivers/' + driver.slug}>Профиль Formula 1 <Icon name="external" size={15} /></a>
    </div>
  </div>
}

