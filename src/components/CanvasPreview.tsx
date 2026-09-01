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
  
  // Keep latest render data in ref (avoids re-render every frame)
  const dataRef = useRef<{ config: RenderConfig; lines: LyricLine[]; duration: number }>({ config, lines, duration: 0 })
  dataRef.current = { config, lines, duration: 0 }
  
  // Also track duration separately
  const durationRef = useRef<number>(0)
  
  useEffect(() => { dataRef.current.lines = lines }, [lines])
  useEffect(() => { dataRef.current.config = config }, [config])
  useEffect(() => {
    if (audioRef.current && isFinite(audioRef.current.duration)) {
      durationRef.current = audioRef.current.duration
      dataRef.current.duration = audioRef.current.duration
    }
  }, [audioRef])
  
  // RAF loop for smooth rendering
  useEffect(() => {
    let raf = 0
    
    const draw = () => {
      const canvas = canvasRef.current
      if (!canvas) return
      
      const ctx = canvas.getContext('2d')
      if (!ctx) return
      
      const { config: cfg, lines: ls, duration: dur } = dataRef.current
      
      // Ensure canvas size matches resolution
      const dimsW = cfg.resolution === 'custom' ? cfg.customWidth || 1920 : cfg.resolution === '720p' ? 1280 : cfg.resolution === 'vertical' ? 1080 : 1920
      const dimsH = cfg.resolution === 'custom' ? cfg.customHeight || 1080 : cfg.resolution === '720p' ? 720 : cfg.resolution === 'vertical' ? 1920 : 1080
      
      if (canvas.width !== dimsW || canvas.height !== dimsH) {
        canvas.width = dimsW
        canvas.height = dimsH
      }
      
      // Get current time from audio or fallback
      const audio = audioRef.current
      const currentTime = audio ? (isFinite(audio.currentTime) ? audio.currentTime : 0) : 0
      
      // Use stored duration
      const finalDuration = Math.max(0.001, isFinite(dur) ? dur : 1)
      
      renderLyricFrame(ctx, cfg, { lines: ls, time: currentTime, duration: finalDuration, title: '' })
      
      raf = requestAnimationFrame(draw)
    }
    
    raf = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(raf)
  }, [audioRef])
  
  return (
    <div className="w-full flex items-center justify-center">
      <canvas
        ref={canvasRef}
        className="rounded-2xl border border-white/10 shadow-2xl bg-black"
        style={{ maxWidth: '100%', maxHeight: 'calc(100vh - 320px)', aspectRatio: `${config.resolution === 'custom' ? `${config.customWidth||1920}/${config.customHeight||1080}` : config.resolution === 'vertical' ? '9/16' : config.resolution === '720p' ? '16/9' : '16/9' }` }}
      />
    </div>
  )
}
