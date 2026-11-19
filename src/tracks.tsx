import { useState } from 'react'
import type { Weekend } from './calendar'
import { trackArchiveSource, trackFor, trackGeoSource } from './track-data'

const directions: Record<string, string> = {
  CLOCKWISE: 'По часовой стрелке',
  ANTI_CLOCKWISE: 'Против часовой стрелки',
  FIGURE_OF_EIGHT: 'Петля в форме восьмёрки',
}

export function CircuitMap({ race }: { race: Weekend }) {
  const track = trackFor(race.circuitId, race.year)
  const [failed, setFailed] = useState(false)
  if (!track || failed) return <p className="track-missing">Схема конфигурации {race.year} пока недоступна.</p>
  const direction = directions[track.direction]
  return <figure className="track-figure" data-layout={track.id}>
    <img src={import.meta.env.BASE_URL + 'tracks/' + track.id + '.svg'} alt={'Контур ' + race.circuit + ', конфигурация ' + race.year}
      onError={() => setFailed(true)} loading="lazy" />
    <figcaption>
      <a href={track.source}>{new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 3 }).format(track.length)} км · {track.turns} пов.</a>
      {direction && <span>{direction}</span>}
      <a href={track.geo ? trackGeoSource : trackArchiveSource}>{track.geo ? 'Старт/финиш (примерно) и направление' : 'Старт/финиш и направление'}</a>
    </figcaption>
  </figure>
}
