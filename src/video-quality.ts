export interface VideoVariant {
  file: string
  width: number
  height: number
  type: string
  bitrate: number
  fps: number
}

export interface VideoViewport {
  width: number
  height: number
  density: number
  saveData: boolean
  effectiveType?: string
}

export function chooseVideo(variants: VideoVariant[], target: VideoViewport, supported: (variant: VideoVariant) => boolean) {
  const limit = target.saveData || ['slow-2g', '2g', '3g'].includes(target.effectiveType ?? '') ? 960 : Infinity
  const available = variants.filter(variant => variant.width <= limit && supported(variant)).sort((a, b) => a.width - b.width)
  const ideal = Math.min(limit, Math.max(target.width, target.height * 16 / 9) * Math.min(target.density, 2))
  return available.find(variant => variant.width >= ideal) ?? available.at(-1)
}
