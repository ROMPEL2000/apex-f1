import { memo, useEffect, useRef, useState, useSyncExternalStore, type CSSProperties } from 'react'
import { useReducedMotion, useScroll, useSpring, useTransform } from 'motion/react'
import * as m from 'motion/react-m'
import { Icon } from './icons'
import { media, mediaUrl } from './media'
import { driversTitleSource, editorialDate, teams, teamTitleSource, type Team } from './teams'

export const teamLink = (team: Team, driver?: string) => '#teams/' + team.id + (driver ? '/' + driver : '')

export function MediaPhoto({ file, alt, className, eager = false }: { file: string; alt: string; className?: string; eager?: boolean }) {
  if (!media[file]) return null
  return <img className={className} src={mediaUrl(file)} alt={alt} loading={eager ? 'eager' : 'lazy'} decoding="async"
    onError={event => { event.currentTarget.style.visibility = 'hidden' }} />
}

export interface TeamStanding {
  position: string
  points: number | null
  wins: number | null
}

interface GarageProps {
  year: number
  standings: ReadonlyMap<string, TeamStanding>
  navigate: (team: Team, driver?: string) => void
}

const compactView = '(max-width: 680px)'
function subscribeCompact(onChange: () => void) {
  const mediaQuery = matchMedia(compactView)
  mediaQuery.addEventListener('change', onChange)
  return () => mediaQuery.removeEventListener('change', onChange)
}
const isCompact = () => matchMedia(compactView).matches

function TeamScene({ team, index, year, standings, navigate, compact }: GarageProps & { team: Team; index: number; compact: boolean }) {
  const ref = useRef<HTMLElement>(null)
  const reduce = useReducedMotion()
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] })
  const progress = useSpring(scrollYProgress, { stiffness: 82, damping: 21, restDelta: .001, skipInitialAnimation: true })
  const distance = compact ? .28 : 1
  const titleX = useTransform(progress, [0, .18, .5, .83, 1], [-125, -100, 0, 0, 75].map(value => value * distance))
  const headingY = useTransform(progress, [0, .1, .44, 1], [54, 43, 0, 0].map(value => value * distance))
  const carX = useTransform(progress, [0, .08, .55, .82, 1], [230, 195, 0, 0, -66].map(value => value * distance))
  const carOpacity = useTransform(progress, [0, .09, .49, .84, 1], [.22, .35, 1, 1, .64])
  const firstY = useTransform(progress, [0, .19, .58, .86, 1], [107, 82, 0, 0, -30].map(value => value * distance))
  const secondY = useTransform(progress, [0, .26, .65, .89, 1], [145, 112, 0, 0, -24].map(value => value * distance))
  const firstOpacity = useTransform(progress, [.13, .58], [.57, 1])
  const secondOpacity = useTransform(progress, [.2, .65], [.57, 1])
  const storyY = useTransform(progress, [0, .28, .69, 1], [40, 29, 0, 0].map(value => value * distance))
  const storyOpacity = useTransform(progress, [.28, .69], [.76, 1])
  const background = useTransform(progress, [0, .53, .77, 1], [.28, .9, .9, .18])
  const mark = 'logo-' + team.id + '.webp'
  const standing = standings.get(team.id)

  return <article ref={ref} className="team-episode" id={teamLink(team).slice(1)} data-team={team.id}
    aria-labelledby={'team-title-' + team.id} style={{ '--accent': team.accent, '--team-tone': team.scene } as CSSProperties}>
    <div className="episode-stage">
      <m.div className="episode-light" aria-hidden="true" style={reduce ? undefined : { opacity: background }} />
      <div className="wrap episode-inner">
        <m.div className="episode-watermark large-type" aria-hidden="true" style={reduce ? undefined : { x: titleX }}>{team.label}</m.div>
        <m.figure className="episode-car" style={reduce ? undefined : { x: carX, opacity: carOpacity }}>
          <MediaPhoto file={'car-' + team.id + '.webp'} alt={team.label + ' ' + team.car + ' на трассе'} />
          <figcaption><span>{team.car}</span><i /> Сезон 2026</figcaption>
        </m.figure>

        <m.div className="episode-copy" style={reduce ? undefined : { y: headingY }}>
          <div className="episode-label">
            <span className="episode-number">{String(index + 1).padStart(2, '0')}</span>
            <span className="team-mark" aria-hidden="true">{media[mark] ? <MediaPhoto file={mark} alt="" /> : team.mark}</span>
          </div>
          <h3 className="large-type" id={'team-title-' + team.id}>{team.label}</h3>
          <p className="episode-team-name">{team.name}</p>
          {team.champion && <a className="champion-tag" href={teamTitleSource}><Icon name="trophy" size={16} /> Кубок конструкторов {team.champion}</a>}
        </m.div>

        <div className="episode-drivers" aria-label={'Пилоты ' + team.label}>
          {team.drivers.map((driver, index) => <m.a key={driver.id} className="pilot-plane" href={teamLink(team, driver.id)}
            style={reduce ? undefined : { y: index === 0 ? firstY : secondY, opacity: index === 0 ? firstOpacity : secondOpacity }}
            onClick={event => {
              if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
              event.preventDefault()
              navigate(team, driver.id)
            }}>
            <span className="pilot-number large-type" aria-hidden="true">{driver.number}</span>
            <MediaPhoto file={'driver-' + driver.id + '.webp'} alt="" />
            <span className="pilot-label"><b>{driver.name}</b><small>№ {driver.number} · {driver.country}</small></span>
            {driver.champion && <span className="mini-title"><Icon name="trophy" size={14} /> Чемпион {driver.champion}</span>}
          </m.a>)}
        </div>

        <m.div className="episode-story" style={reduce ? undefined : { y: storyY, opacity: storyOpacity }}>
          <dl className="episode-stat">
            <div><dt>Место · {year}</dt><dd>{standing?.position ?? '—'}</dd></div>
            <div><dt>Очки · {year}</dt><dd>{standing?.points ?? '—'}</dd></div>
            <div><dt>Победы · {year}</dt><dd>{standing?.wins ?? '—'}</dd></div>
          </dl>
          <p>{team.history}</p>
          <details><summary>Факт о команде</summary><p>{team.fact} <a href={'https://www.formula1.com/en/teams/' + team.source}>Источник <Icon name="external" size={13} /></a></p></details>
          <p className="episode-base">{team.base} <span>·</span> Состав на {editorialDate}</p>
        </m.div>
      </div>
    </div>
  </article>
}

export const Garage = memo(function Garage(props: GarageProps) {
  const ref = useRef<HTMLElement>(null)
  const reduce = useReducedMotion()
  const compact = useSyncExternalStore(subscribeCompact, isCompact)
  const [current, setCurrent] = useState(teams[0].id)

  useEffect(() => {
    if (typeof IntersectionObserver !== 'function') return
    const observer = new IntersectionObserver(entries => {
      const visible = entries.find(entry => entry.isIntersecting)
      if (visible && visible.target instanceof HTMLElement && visible.target.dataset.team) setCurrent(visible.target.dataset.team)
    }, { rootMargin: '-32% 0px -55% 0px' })
    ref.current?.querySelectorAll('[data-team]').forEach(scene => observer.observe(scene))
    return () => observer.disconnect()
  }, [])

  const active = teams.findIndex(team => team.id === current)
  return <section id="teams" ref={ref} className="garage" aria-labelledby="garage-title">
    <div className="wrap editorial-heading">
      <m.div initial={reduce ? false : { y: 25, opacity: .35 }} whileInView={{ y: 0, opacity: 1 }}
        viewport={{ once: true, amount: .25 }} transition={{ duration: reduce ? 0 : .65, ease: 'easeOut' }}>
        <p className="index-label"><i /> Решётка 2026</p>
        <h2 id="garage-title">Команды</h2>
        <p>11 команд и 22 пилота сезона 2026.</p>
      </m.div>
    </div>
    <div className="episode-index">
      <div className="wrap episode-index-inner">
        <span className="index-count">{String(active + 1).padStart(2, '0')} <span>/</span> {teams.length}</span>
        <label htmlFor="team-jump" className="sr-only">Перейти к команде</label>
        <select id="team-jump" value={current} onChange={event => {
          const team = teams.find(item => item.id === event.target.value)
          if (team) {
            setCurrent(team.id)
            props.navigate(team)
          }
        }}>{teams.map(team => <option value={team.id} key={team.id}>{team.label}</option>)}</select>
        <div className="episode-progress" aria-hidden="true">
          {teams.map((team, index) => <span key={team.id} className={index <= active ? 'filled' : ''} style={{ '--segment': team.accent } as CSSProperties} />)}
        </div>
      </div>
    </div>
    {teams.map((team, index) => <TeamScene key={team.id} team={team} index={index} compact={compact} {...props} />)}
  </section>
})

export function DriverProfile({ team, driverId }: { team: Team; driverId: string }) {
  const driver = team.drivers.find(item => item.id === driverId)
  if (!driver) return null
  return <div className="profile" style={{ '--accent': team.accent } as CSSProperties}>
    <div className="profile-photo"><MediaPhoto file={'driver-' + driver.id + '.webp'} alt={driver.name} eager /></div>
    <div className="profile-copy">
      <p className="index-label">{team.label} / № {driver.number}</p>
      <h2 id="dialog-title">{driver.name}</h2>
      <p>{driver.country}</p>
      {driver.champion && <a className="champion-tag" href={driversTitleSource}><Icon name="trophy" size={18} /> Чемпион мира {driver.champion}</a>}
      <p>{driver.bio}</p>
      <a className="source-link" href={'https://www.formula1.com/en/drivers/' + driver.slug}>Профиль Formula 1 <Icon name="external" size={15} /></a>
    </div>
  </div>
}

