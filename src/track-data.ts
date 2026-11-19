import catalogue from './tracks.json' with { type: 'json' }

export interface Track {
  id: string
  length: number
  turns: number
  direction: string
  source: string
  geo: boolean
}

export const trackCatalogue: Record<string, Record<number, Track>> = catalogue
export const trackFor = (circuitId: string, year: number): Track | undefined => trackCatalogue[circuitId]?.[year]

export const trackArchiveSource = 'https://github.com/f1db/f1-circuits-svg/tree/c1bcd6fcb1b6fdb662136daa6bc19f3a2f870f65'
export const trackGeoSource = 'https://github.com/bacinger/f1-circuits/tree/8094e957b8d6aa8b9f4510c93968556cccd30e02'
