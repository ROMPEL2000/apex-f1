import { useEffect, useState } from 'react'
import { fetchJolpica, getSnapshot } from './jolpica'

export interface ResourceState<T> {
  data?: T
  checkedAt?: number
  status: 'loading' | 'online' | 'saved' | 'bundle' | 'unavailable'
}

function cached<T>(key: string, parse: (raw: unknown) => T): ResourceState<T> {
  try {
    const entry = JSON.parse(localStorage.getItem(key) ?? 'null') as { checkedAt: number; payload: unknown } | null
    if (entry && Number.isFinite(entry.checkedAt)) return { data: parse(entry.payload), checkedAt: entry.checkedAt, status: 'saved' }
  } catch { /* Optional storage. */ }
  return { status: 'loading' }
}

export function useResource<T>(year: number, path: string, parse: (raw: unknown) => T) {
  const key = 'apex-sport-v1-' + year + '/' + path
  const [state, setState] = useState<{ key: string; value: ResourceState<T> }>(() => ({ key, value: cached(key, parse) }))

  useEffect(() => {
    if (!year || !path) return
    const controller = new AbortController()
    let lastAttempt = 0
    let pending = false
    let lastGood = cached(key, parse)
    const show = (value: ResourceState<T>) => {
      if (!controller.signal.aborted) setState({ key, value })
    }
    show(lastGood)

    async function refresh() {
      if (pending || Date.now() - lastAttempt < 60_000) return
      pending = true
      lastAttempt = Date.now()
      try {
        const payload = await fetchJolpica(year + '/' + path + '/?limit=100', controller.signal)
        const data = parse(payload)
        if (controller.signal.aborted) return
        const checkedAt = Date.now()
        lastGood = { data, checkedAt, status: 'online' }
        show(lastGood)
        try { localStorage.setItem(key, JSON.stringify({ checkedAt, payload })) } catch { /* Optional storage. */ }
      } catch {
        if (controller.signal.aborted) return
        if (lastGood.checkedAt !== undefined) {
          show({ ...lastGood, status: lastGood.status === 'bundle' ? 'bundle' : 'saved' })
          return
        }
        if (year === 2025 || year === 2026) {
          try {
            const snapshot = await getSnapshot(year)
            if (path in snapshot.resources) {
              lastGood = { data: parse(snapshot.resources[path]), checkedAt: Date.parse(snapshot.checkedAt), status: 'bundle' }
              show(lastGood)
              return
            }
          } catch { /* A missing packaged classification remains unknown. */ }
        }
        show({ status: 'unavailable' })
      } finally { pending = false }
    }

    const recheck = () => { if (document.visibilityState === 'visible') void refresh() }
    const timer = window.setInterval(recheck, 15 * 60_000)
    document.addEventListener('visibilitychange', recheck)
    window.addEventListener('online', recheck)
    void refresh()
    return () => {
      controller.abort()
      window.clearInterval(timer)
      document.removeEventListener('visibilitychange', recheck)
      window.removeEventListener('online', recheck)
    }
  }, [key, parse, path, year])

  if (!year || !path) return { status: 'loading' } as ResourceState<T>
  return state.key === key ? state.value : cached(key, parse)
}
