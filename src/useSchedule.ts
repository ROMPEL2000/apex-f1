import { useEffect, useState } from 'react'
import { parseSchedule, type ScheduleData, type Weekend } from './calendar'
import { fetchJolpica, getSnapshot } from './jolpica'

const interval = 15 * 60_000
const minRetry = 60_000
const cacheKey = (year: number) => 'apex-schedule-v1-' + year

interface CalendarState {
  year: number
  races: Weekend[]
  checkedAt?: number
  status: 'loading' | 'online' | 'saved' | 'bundle' | 'unavailable'
}

function cached(year: number): CalendarState {
  try {
    const saved = JSON.parse(localStorage.getItem(cacheKey(year)) ?? 'null') as ScheduleData | null
    if (saved && Number.isFinite(saved.checkedAt)) {
      return { year, races: parseSchedule(saved.payload, year), checkedAt: saved.checkedAt, status: 'saved' }
    }
  } catch { /* Storage may be disabled or stale. */ }
  return { year, races: [], status: 'loading' }
}

export function useSchedule(year: number) {
  const [state, setState] = useState(() => cached(year))

  useEffect(() => {
    if (year === 0) return
    const controller = new AbortController()
    let lastAttempt = 0
    let pending = false
    let lastGood = cached(year)
    setState(lastGood)

    const refresh = async () => {
      if (pending || Date.now() - lastAttempt < minRetry) return
      lastAttempt = Date.now()
      pending = true
      try {
        const payload = await fetchJolpica(year + '/races/?limit=100', controller.signal)
        const races = parseSchedule(payload, year)
        if (controller.signal.aborted) return
        const checkedAt = Date.now()
        lastGood = { year, races, checkedAt, status: 'online' }
        setState(lastGood)
        try { localStorage.setItem(cacheKey(year), JSON.stringify({ payload, checkedAt })) } catch { /* Optional cache. */ }
      } catch {
        if (controller.signal.aborted) return
        if (!lastGood.checkedAt && (year === 2025 || year === 2026)) {
          try {
            const snapshot = await getSnapshot(year)
            lastGood = { year, races: parseSchedule(snapshot.resources.races, year), checkedAt: Date.parse(snapshot.checkedAt), status: 'bundle' }
          } catch { /* Unavailable states are reported below. */ }
        }
        if (!controller.signal.aborted) setState({ ...lastGood, status: lastGood.checkedAt ? (lastGood.status === 'bundle' ? 'bundle' : 'saved') : 'unavailable' })
      } finally {
        pending = false
      }
    }

    const whenVisible = () => { if (document.visibilityState === 'visible') void refresh() }
    const timer = window.setInterval(whenVisible, interval)
    void refresh()
    document.addEventListener('visibilitychange', whenVisible)
    window.addEventListener('online', whenVisible)
    return () => {
      controller.abort()
      window.clearInterval(timer)
      document.removeEventListener('visibilitychange', whenVisible)
      window.removeEventListener('online', whenVisible)
    }
  }, [year])

  return state.year === year ? state : cached(year)
}

