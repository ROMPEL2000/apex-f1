import { useEffect, useRef, useState } from 'react'
import { useReducedMotion } from 'motion/react'
import { MediaPhoto } from './Garage'
import { mediaUrl } from './media'
import config from './hero-video.json'
import { chooseVideo, type VideoVariant } from './video-quality'

interface VideoCredit {
  source: string
  author: string
  license?: string
  licenseUrl?: string
}

interface HeroVideoConfig {
  sources: VideoVariant[]
  credit?: VideoCredit | null
  poster?: string
  logo?: string
}

const publicConfig: HeroVideoConfig = config
const pendingConfig: HeroVideoConfig = { sources: [] }
const previewMode = import.meta.env.DEV && import.meta.env.MODE === 'preview-media'
const previewUrl = (file: string) => import.meta.env.BASE_URL + 'preview-media.local/' + file
export const heroVideoCredit = publicConfig.credit
export const openingLogoUrl = previewMode
  ? previewUrl(publicConfig.logo ?? 'f1-mark.svg')
  : publicConfig.logo && mediaUrl(publicConfig.logo)

export function HeroMedia() {
  const container = useRef<HTMLDivElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const reduce = useReducedMotion()
  const [manifest, setManifest] = useState(previewMode ? pendingConfig : publicConfig)
  const heroMediaUrl = previewMode && manifest !== publicConfig ? previewUrl : mediaUrl
  const [source, setSource] = useState<VideoVariant>()
  const [visible, setVisible] = useState(false)
  const [paused, setPaused] = useState(false)
  const [playing, setPlaying] = useState(false)
  const [blocked, setBlocked] = useState(false)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    if (!previewMode) return
    const controller = new AbortController()
    void fetch(previewUrl('manifest.json'), { signal: controller.signal })
      .then(response => { if (response.ok) return response.json() as Promise<HeroVideoConfig> })
      .then(local => {
        if (!controller.signal.aborted) setManifest(local ?? publicConfig)
      })
      .catch(() => { if (!controller.signal.aborted) setManifest(publicConfig) })
    return () => controller.abort()
  }, [])

  useEffect(() => {
    if (reduce !== false || !manifest.sources.length || !container.current) return
    let inView = false
    const sync = () => setVisible(inView && document.visibilityState === 'visible')
    const observer = new IntersectionObserver(([entry]) => {
      inView = entry.isIntersecting
      sync()
    }, { threshold: .18 })
    observer.observe(container.current)
    document.addEventListener('visibilitychange', sync)
    return () => {
      observer.disconnect()
      document.removeEventListener('visibilitychange', sync)
    }
  }, [manifest.sources, reduce])

  useEffect(() => {
    if (reduce !== false || !visible || !manifest.sources.length || source) return
    const connection = (navigator as Navigator & { connection?: { saveData?: boolean; effectiveType?: string } }).connection
    const video = document.createElement('video')
    let cancelled = false
    const compact = matchMedia('(max-width: 680px)').matches
    const frame = container.current?.querySelector('.hero-image')?.getBoundingClientRect()
    const target = { width: frame?.width || innerWidth, height: frame?.height || innerHeight, density: devicePixelRatio, saveData: connection?.saveData ?? false, effectiveType: connection?.effectiveType }
    const candidates = manifest.sources.filter(variant => (!compact || variant.width <= 1920) && video.canPlayType(variant.type))
    async function select() {
      const supported = await Promise.all(candidates.map(async variant => {
        if (!navigator.mediaCapabilities?.decodingInfo) return variant.width < 3840
        try {
          const info = await navigator.mediaCapabilities.decodingInfo({
            type: 'file',
            video: { contentType: variant.type, width: variant.width, height: variant.height, bitrate: variant.bitrate, framerate: variant.fps },
          })
          return info.supported && (variant.width < 3840 || info.smooth && info.powerEfficient)
        } catch { return variant.width < 3840 }
      }))
      if (!cancelled) setSource(chooseVideo(candidates.filter((_, index) => supported[index]), target, () => true))
    }
    void select()
    return () => { cancelled = true }
  }, [manifest.sources, reduce, visible, source])

  useEffect(() => {
    const player = videoRef.current
    if (!player) return
    if (visible && !paused && !reduce) {
      void player.play().catch(error => {
        if (error.name !== 'AbortError') {
          setPlaying(false)
          setBlocked(true)
        }
      })
    } else {
      player.pause()
    }
  }, [visible, paused, reduce, source])

  function togglePlayback() {
    if (blocked || paused) {
      setPaused(false)
      void videoRef.current?.play().catch(() => setBlocked(true))
    } else {
      setPaused(true)
    }
  }

  return <div className="hero-media" ref={container}>
    <MediaPhoto file="hero.webp" className="hero-image" alt="" eager />
    {manifest.poster && <img src={heroMediaUrl(manifest.poster)} className="hero-image" alt="" onError={event => { event.currentTarget.hidden = true }} />}
    {source && !reduce && !failed && <>
      <video ref={videoRef} src={heroMediaUrl(source.file)} className={playing ? 'hero-video playing' : 'hero-video'}
        muted playsInline loop preload="none" aria-hidden="true"
        onPlaying={() => { setPlaying(true); setBlocked(false) }}
        onError={() => { setFailed(true); setPlaying(false) }} />
      {(playing || paused || blocked) && <button type="button" className="video-toggle" onClick={togglePlayback}
        aria-label={paused || blocked ? 'Воспроизвести фоновое видео' : 'Приостановить фоновое видео'}>{paused || blocked ? '▶' : 'Ⅱ'}</button>}
    </>}
    {manifest.credit && <a className="hero-video-credit" href={manifest.credit.source}>{manifest.credit.author} · анимация RB22</a>}
  </div>
}
