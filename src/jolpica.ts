export const jolpicaBase = 'https://api.jolpi.ca/ergast/f1/'
let nextSlot = 0

export async function fetchJolpica(path: string, signal: AbortSignal) {
  const allotted = Math.max(nextSlot, Date.now())
  nextSlot = allotted + 285
  await new Promise<void>(resolve => setTimeout(resolve, Math.max(0, allotted - Date.now())))
  signal.throwIfAborted()
  const response = await fetch(jolpicaBase + path, { signal: AbortSignal.any([signal, AbortSignal.timeout(10_000)]) })
  if (!response.ok) throw new Error(String(response.status))
  return response.json() as Promise<unknown>
}

interface Snapshot {
  checkedAt: string
  resources: Record<string, unknown>
}

const copies = new Map<number, Promise<Snapshot>>()
export function getSnapshot(year: number) {
  const existing = copies.get(year)
  if (existing) return existing
  const request = fetch(import.meta.env.BASE_URL + 'sport/' + year + '.json').then(response => {
    if (!response.ok) throw new Error(String(response.status))
    return response.json() as Promise<Snapshot>
  }).catch(error => {
    copies.delete(year)
    throw error
  })
  copies.set(year, request)
  return request
}
