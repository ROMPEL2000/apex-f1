import { useEffect, useState } from 'react'
import { parseSchedule, scheduleApi, season, type ScheduleData, type Weekend } from './calendar'

const interval = 15 * 60_000
const minRetry = 60_000
const bundleTime = Date.parse('2026-11-19T06:32:44Z')
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

    if (year === season && lastGood.status === 'loading') {
      fetch(import.meta.env.BASE_URL + 'schedule-2026.json', { signal: controller.signal })
        .then(response => {
          if (!response.ok) throw new Error('Резервный календарь недоступен')
          return response.json()
        })
        .then(payload => {
          if (controller.signal.aborted || lastGood.status === 'online') return
          lastGood = { year, races: parseSchedule(payload, year), checkedAt: bundleTime, status: 'bundle' }
          setState(lastGood)
        })
        .catch(() => { /* The network request can still succeed. */ })
    }

    const refresh = async () => {
      if (pending || Date.now() - lastAttempt < minRetry) return
      lastAttempt = Date.now()
      pending = true
      try {
        const response = await fetch(scheduleApi(year), { signal: AbortSignal.any([controller.signal, AbortSignal.timeout(10_000)]) })
        if (!response.ok) throw new Error(String(response.status))
        const payload: unknown = await response.json()
        const races = parseSchedule(payload, year)
        if (controller.signal.aborted) return
        const checkedAt = Date.now()
        lastGood = { year, races, checkedAt, status: 'online' }
        setState(lastGood)
        try { localStorage.setItem(cacheKey(year), JSON.stringify({ payload, checkedAt })) } catch { /* Optional cache. */ }
      } catch {
        if (!controller.signal.aborted) {
          setState({ ...lastGood, status: lastGood.checkedAt ? (lastGood.status === 'bundle' ? 'bundle' : 'saved') : 'unavailable' })
        }
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

