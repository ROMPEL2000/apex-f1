import manifest from './media.json'

export interface MediaCredit {
  file: string
  title: string
  author: string
  license: string
  licenseUrl: string
  source: string
  changes: string
}

export const media: Record<string, MediaCredit> = manifest
export const mediaUrl = (file: string) => import.meta.env.BASE_URL + 'media/' + file

