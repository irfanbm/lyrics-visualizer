import { useEffect, useRef } from 'react'
import type * as React from 'react'
import type { LyricLine } from '../utils/lrcParser'
import type { RenderConfig } from '../types'
import { renderLyricFrame } from '../render/lyricRenderer'

interface Props {
  config: RenderConfig
  lines: LyricLine[]
  audioRef: React.RefObject<HTMLAudioElement | null>
}

export function CanvasPreview({ config, lines, audioRef }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const dataRef = useRef<{ config: RenderConfig; lines: LyricLine[]; duration: number }>({ config, lines, duration: 0 })
  dataRef.current = { config, lines, duration: dataRef.current.duration }

  useEffect(() => { dataRef.current.lines = lines }, [lines])
  useEffect(() => { dataRef.current.config = config }, [config])

  useEffect(() => {
    let raf = 0
    const draw = () => {
      const canvas = canvasRef.current
      if (!canvas) { raf = requestAnimationFrame(draw); return }
      const ctx = canvas.getContext('2d')
      if (!ctx) { raf = requestAnimationFrame(draw); return }
      const { config: cfg, lines: ls } = dataRef.current
      const dimsW = cfg.resolution === 'custom' ? cfg.customWidth || 1920 : cfg.resolution === '720p' ? 1280 : cfg.resolution === 'vertical' ? 1080 : 1920
      const dimsH = cfg.resolution === 'custom' ? cfg.customHeight || 1080 : cfg.resolution === '720p' ? 720 : cfg.resolution === 'vertical' ? 1920 : 1080
      if (canvas.width !== dimsW || canvas.height !== dimsH) {
        canvas.width = dimsW
        canvas.height = dimsH
      }
      const audio = audioRef.current
      const currentTime = audio ? (isFinite(audio.currentTime) ? audio.currentTime : 0) : 0
      const dur = audio && isFinite(audio.duration) && audio.duration > 0 ? audio.duration : Math.max(1, ls[ls.length - 1]?.endTime || 10)
      dataRef.current.duration = dur
      renderLyricFrame(ctx, cfg, { lines: ls, time: currentTime, duration: dur, title: '' })
      raf = requestAnimationFrame(draw)
    }
    raf = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(raf)
  }, [audioRef])

  const aspect = config.resolution === 'custom' ? `${config.customWidth || 1920} / ${config.customHeight || 1080}` : config.resolution === 'vertical' ? '9 / 16' : '16 / 9'
  return (
    <div className="w-full flex items-center justify-center">
      <canvas
        ref={canvasRef}
        className="w-full h-auto rounded-xl bg-black border border-white/10 shadow-inner"
        style={{ maxWidth: '960px', aspectRatio: aspect, width: '100%' }}
      />
    </div>
  )
}
