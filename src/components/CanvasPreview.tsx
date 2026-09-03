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
    let analyser: AnalyserNode | null = (audioRef.current as any)?.__lyricAnalyser || null
    let analyserData: Uint8Array | null = (audioRef.current as any)?.__lyricData || null
    let audioCtx: AudioContext | null = (audioRef.current as any)?.__lyricCtx || null

    const initAnalyser = () => {
      const el = audioRef.current
      if (!el || (el as any).__lyricAnalyser) {
        analyser = (el as any).__lyricAnalyser || analyser
        analyserData = (el as any).__lyricData || analyserData
        audioCtx = (el as any).__lyricCtx || audioCtx
        return
      }
      try {
        audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)()
        const src = audioCtx.createMediaElementSource(el)
        analyser = audioCtx.createAnalyser()
        analyser.fftSize = 512
        analyserData = new Uint8Array(analyser.frequencyBinCount)
        src.connect(analyser)
        analyser.connect(audioCtx.destination)
        ;(el as any).__lyricAnalyser = analyser
        ;(el as any).__lyricData = analyserData
        ;(el as any).__lyricCtx = audioCtx
      } catch {}
    }
    initAnalyser()
    const onCanPlay = () => {
      // resume context on user gesture
      try { (audioCtx as any)?.resume?.() } catch {}
      initAnalyser()
    }
    const onPlay = () => { try { (audioCtx as any)?.resume?.() } catch {} }
    audioRef.current?.addEventListener('canplay', onCanPlay)
    audioRef.current?.addEventListener('play', onPlay)

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

      // live analyser data for visualizer
      if (analyser && analyserData && (cfg as any).visualizer && (cfg as any).visualizer !== 'none') {
        try { analyser.getByteFrequencyData(analyserData as Uint8Array<ArrayBuffer>) } catch {}
      }

      renderLyricFrame(ctx, cfg, { lines: ls, time: currentTime, duration: dur, title: '', analyserData: analyserData as any })
      raf = requestAnimationFrame(draw)
    }
    raf = requestAnimationFrame(draw)
    return () => {
      cancelAnimationFrame(raf)
      audioRef.current?.removeEventListener('canplay', onCanPlay)
      audioRef.current?.removeEventListener('play', onPlay)
    }
  }, [audioRef])

  const aspect = config.resolution === 'custom' ? `${config.customWidth || 1920} / ${config.customHeight || 1080}` : config.resolution === 'vertical' ? '9 / 16' : '16 / 9'
  return (
    <div className="w-full flex items-center justify-center">
      <canvas
        ref={canvasRef}
        className="w-full h-auto rounded-xl bg-black/80 border border-white/10 shadow-[0_0_30px_rgba(6,182,214,0.15)]"
        style={{ maxWidth: '960px', aspectRatio: aspect, width: '100%' }}
      />
    </div>
  )
}
