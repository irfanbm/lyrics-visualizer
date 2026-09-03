import type { LyricLine } from '../utils/lrcParser'
import type { RenderConfig } from '../types'
import { getDimensions } from '../types'
import { getDefaultFontSize } from '../utils/fonts'
import { drawByType, type VisualizerType } from '../visualizers/draw'

export interface RenderState {
  lines: LyricLine[]
  time: number
  duration: number
  title: string
  analyserData?: Uint8Array | null
}

function easeOutCubic(x: number): number {
  return 1 - Math.pow(1 - x, 3)
}

/**
 * Unified canvas renderer for lyrics.
 * Used by both preview (real-time) and export (rendered video) => WYSIWYG guarantee.
 */
export function renderLyricFrame(
  ctx: CanvasRenderingContext2D,
  config: RenderConfig,
  state: RenderState
): void {
  const { w, h } = getDimensions(config)

  // ---- Background ----
  if ((config as any).transparentBg) {
    ctx.clearRect(0, 0, w, h)
  } else {
    ctx.fillStyle = config.bgColor
    ctx.fillRect(0, 0, w, h)
    const grad = ctx.createLinearGradient(0, 0, 0, h)
    grad.addColorStop(0, config.bgColor + '00')
    grad.addColorStop(0.5, config.bgColor + '55')
    grad.addColorStop(1, config.bgColor + 'CC')
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, w, h)
  }

  // ---- Visualizer (behind lyrics, from oscillator-visualizer) ----
  const viz = (config as any).visualizer as VisualizerType | 'none' | undefined
  const vizAlpha = (config as any).visualizerOpacity ?? 0.55
  const vizPos = (config as any).visualizerPosition || 'background'
  const vizColor = (config as any).visualizerColor || '#22C55E'
  const vizSize = (config as any).visualizerSize ?? 1
  const vizSens = (config as any).visualizerSensitivity ?? 1
  const vizBars = (config as any).visualizerBars ?? 48
  const vizSmooth = (config as any).visualizerSmoothing ?? 0.35
  // clip region by position & size
  const vizH = vizPos === 'background' ? h : Math.round(h * 0.32 * vizSize)
  const vizY = vizPos === 'top' ? 0 : vizPos === 'bottom' ? h - vizH : 0
  const drawH = vizPos === 'background' ? h : vizH

  // smoothing buffer
  const smoothed: Uint8Array = (() => {
    const d = state.analyserData
    if (!d || vizSmooth <= 0) return d as any
    const prev = (globalThis as any).__vizPrev as Uint8Array | undefined
    if (!prev || prev.length !== d.length) {
      ;(globalThis as any).__vizPrev = new Uint8Array(d)
      return d
    }
    const out = new Uint8Array(d.length)
    for (let i = 0; i < d.length; i++) out[i] = Math.round(prev[i] * vizSmooth + d[i] * (1 - vizSmooth))
    ;(globalThis as any).__vizPrev = out
    return out
  })() as any

  const drawViz = (data: Uint8Array, len: number) => {
    ctx.save()
    if (vizPos !== 'background') {
      ctx.beginPath(); ctx.rect(0, vizY, w, vizH); ctx.clip()
    }
    if (vizSize !== 1 && vizPos === 'background') {
      ctx.translate(w / 2, h / 2); ctx.scale(vizSize, vizSize); ctx.translate(-w / 2, -h / 2)
    }
    try {
      drawByType(viz as VisualizerType, ctx, data, len, w, drawH, { alpha: vizAlpha, color: vizColor, sensitivity: vizSens, bars: vizBars })
    } catch {}
    ctx.restore()
  }

  if (viz && viz !== 'none') {
    const srcData = smoothed && (smoothed as Uint8Array).length ? (smoothed as Uint8Array) : state.analyserData
    if (srcData && srcData.length > 0) {
      drawViz(srcData, srcData.length)
    } else {
      const fakeLen = vizBars || 64
      const fake = new Uint8Array(fakeLen)
      for (let i = 0; i < fakeLen; i++) {
        const base = 80 + 70 * Math.sin(state.time * 2 + i * 0.3) + 30 * Math.sin(state.time * 5 + i)
        fake[i] = Math.max(0, Math.min(255, Math.round(base)))
      }
      drawViz(fake, fakeLen)
    }
  }

  const fontRef = getDefaultFontSize(w, h, config.fontFamily)

  if (state.lines.length === 0) {
    ctx.fillStyle = 'rgba(255,255,255,0.35)'
    ctx.font = `600 ${Math.round(22 * Math.min(w / 1920, h / 1080))}px "${config.fontFamily}", sans-serif`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('Belum ada lirik — import TXT / LRC', w / 2, h / 2)
  }

  // ---- Title (optional) ----
  if (config.showTitle && state.title.trim()) {
    const fontSize = Math.round(36 * Math.min(w / 1920, h / 1080))
    ctx.font = `700 ${fontSize}px "${config.fontFamily}", sans-serif`
    ctx.fillStyle = 'rgba(255, 255, 255, 0.85)'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(state.title, w / 2, h * 0.08)
  }

  // ---- Compute active index ----
  let idx = -1
  for (let i = 0; i < state.lines.length; i++) {
    if (state.time >= state.lines[i].startTime) idx = i
    else break
  }
  const lastIdx = idx

  // ---- Motion: slide halus terkonsentrasi saat pergantian baris + zoom-in halus ----
  const TRANSITION = 0.42 // durasi slide up saat ganti baris
  const activeForMotion = idx >= 0 ? idx : lastIdx
  const lineAge = activeForMotion >= 0 ? state.time - state.lines[activeForMotion].startTime : 99
  let enterP = 1
  if (activeForMotion >= 0 && lineAge >= 0 && lineAge < TRANSITION) {
    enterP = easeOutCubic(lineAge / TRANSITION)
  }
  const floatIdx = activeForMotion >= 0
    ? (lineAge >= 0 && lineAge < TRANSITION ? activeForMotion - (1 - enterP) : activeForMotion)
    : -1

  // ---- Lyrics ----
  const posRatio =
    config.lyricPosition === 'top' ? 0.32 :
    config.lyricPosition === 'bottom' ? 0.68 :
    (typeof config.lyricPosition === 'number' ? config.lyricPosition / 100 : 0.5)
  const baseY = h * posRatio
  const gapMult = (config as any).lineGap ?? 1.85
  const lineGap = fontRef.active * gapMult
  const fadeEdges = (config as any).fadeEdges ?? true
  const vis = Math.max(3, Math.min(11, (config as any).visibleLines ?? 5))
  const half = Math.floor(vis / 2)

  const startIdx = Math.max(0, Math.floor(floatIdx) - half)
  const endIdx = Math.min(state.lines.length, Math.ceil(floatIdx) + half + 1)

  for (let i = startIdx; i < endIdx; i++) {
    const line = state.lines[i]
    if (!line || !line.text) continue

    const activeness = Math.max(0, 1 - Math.abs(i - floatIdx))
    const isTarget = i === idx
    const baseScale = 0.96 + 0.04 * activeness
    let scale = baseScale
    if (isTarget) {
      const zp = Math.min(1, Math.max(0, lineAge / TRANSITION))
      const punch = 0.06 * easeOutCubic(zp) * (1 - 0.45 * easeOutCubic(zp))
      scale = baseScale + punch
    }
    const y = baseY + (i - floatIdx) * lineGap
    const baseOp = (config as any).inactiveOpacity ?? 0.28
    let opacity = baseOp + (1 - baseOp) * activeness
    if (fadeEdges) {
      const edgeDist = Math.abs(i - floatIdx)
      const edgeFade = Math.max(0.35, 1 - Math.max(0, edgeDist - half) * 0.55)
      opacity *= edgeFade
    }
    const fw = (config as any).fontWeight ?? 700
    const isItalic = !!(config as any).fontItalic
    const fontSize = Math.round(fontRef.inactive + (fontRef.active - fontRef.inactive) * activeness)

    ctx.globalAlpha = opacity
    ctx.save()
    ctx.translate(w / 2, y)
    ctx.scale(scale, scale)
    ctx.translate(-w / 2, -y)

    if (isTarget && config.karaokeMode && line.words && line.words.length > 0) {
      drawKaraokeLine(ctx, line, state.time, w, y, fontSize, config.fontFamily, fw, isItalic)
    } else {
      drawPlainLine(ctx, line.text, w, y, fontSize, activeness, config.fontFamily, fw, isItalic)
    }
    ctx.restore()
  }
  ctx.globalAlpha = 1

  // ---- Progress bar ----
  if (config.showProgressBar) {
    const barH = Math.max(4, Math.round(h * 0.004))
    const barX = w * 0.1
    const barW = w * 0.8
    const barY = h - 60 * (h / 1080)

    ctx.fillStyle = 'rgba(255, 255, 255, 0.15)'
    ctx.fillRect(barX, barY, barW, barH)

    if (state.duration > 0 && isFinite(state.duration)) {
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(barX, barY, barW * Math.min(1, state.time / state.duration), barH)
    }
  }

  // ---- Duration timer ----
  if (config.showDuration) {
    const timerY = config.showProgressBar ? h - 30 * (h / 1080) : h - 55 * (h / 1080)
    const fs = Math.round(18 * Math.min(w / 1920, h / 1080))
    ctx.font = `${fs}px monospace`
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(`${formatTime(state.time)} / ${formatTime(state.duration)}`, w / 2, timerY)
  }

  // ---- Line counter pill (top-right) ----
  if (config.showLineCounter && state.lines.length > 0 && idx >= 0) {
    const fs = Math.round(14 * Math.min(w / 1920, h / 1080))
    ctx.font = `700 ${fs}px monospace`
    const label = `${idx + 1} / ${state.lines.length}`
    const textW = ctx.measureText(label).width
    const padX = Math.round(w * 0.02)
    const pillW = textW + padX * 2
    const pillH = fs * 1.6
    const pillX = w - pillW - padX
    const pillY = h * 0.05

    ctx.fillStyle = 'rgba(255, 255, 255, 0.15)'
    roundRect(ctx, pillX, pillY, pillW, pillH, pillH / 2)
    ctx.fill()

    ctx.fillStyle = '#ffffff'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(label, pillX + pillW / 2, pillY + pillH / 2)
  }
}

// ===================== Drawing helpers (pure functions) =====================

function drawKaraokeLine(
  ctx: CanvasRenderingContext2D,
  line: LyricLine,
  time: number,
  canvasW: number,
  y: number,
  fontSize: number,
  fontFamily: string,
  fontWeight = 800,
  italic = false
): void {
  const style = italic ? 'italic ' : ''
  ctx.font = `${style}${fontWeight} ${fontSize}px "${fontFamily}", sans-serif`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'

  const gap = ctx.measureText(' ').width
  const widths = line.words.map(w => ctx.measureText(w.text).width)
  const totalW = widths.reduce((a, b) => a + b, 0) + gap * (line.words.length - 1)

  // Fallback: if line too wide, scale down font
  let scale = 1
  if (totalW > canvasW * 0.9) {
    scale = (canvasW * 0.9) / totalW
    fontSize = Math.floor(fontSize * scale)
    const style2 = italic ? 'italic ' : ''
    ctx.font = `${style2}${fontWeight} ${fontSize}px "${fontFamily}", sans-serif`
  }

  let x = canvasW / 2 - totalW / 2
  const lineH = fontSize * 1.2

  line.words.forEach((word, wi) => {
    const wWidth = widths[wi]
    const wp = Math.max(0, Math.min(1, time < word.startTime ? 0 : time >= word.endTime ? 1 : (time - word.startTime) / (word.endTime - word.startTime)))

    // Faded base word
    ctx.fillStyle = 'rgba(255, 255, 255, 0.35)'
    ctx.fillText(word.text, x + wWidth / 2, y)

    // Highlighted clipped portion
    if (wp > 0) {
      ctx.save()
      ctx.beginPath()
      ctx.rect(x, y - lineH * 0.6, wWidth * wp, lineH * 1.2)
      ctx.clip()
      ctx.fillStyle = '#ffffff'
      ctx.fillText(word.text, x + wWidth / 2, y)
      ctx.restore()
    }

    x += wWidth + gap
  })
}

function drawPlainLine(
  ctx: CanvasRenderingContext2D,
  text: string,
  canvasW: number,
  y: number,
  fontSize: number,
  activeness: number,
  fontFamily: string,
  baseWeight = 700,
  italic = false
): void {
  const style = italic ? 'italic ' : ''
  const weight = activeness > 0.82 ? baseWeight : 500
  ctx.font = `${style}${weight} ${fontSize}px "${fontFamily}", sans-serif`
  ctx.fillStyle = '#ffffff'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'

  // Word wrap
  const maxWidth = canvasW * 0.85
  const words = text.split(/\s+/)
  const rows: string[] = []
  let current = ''

  for (const word of words) {
    const test = current ? current + ' ' + word : word
    if (ctx.measureText(test).width > maxWidth && current) {
      rows.push(current)
      current = word
    } else {
      current = test
    }
  }
  if (current) rows.push(current)

  const lineHeight = fontSize * 1.25
  const totalH = rows.length * lineHeight
  let ry = y - totalH / 2 + lineHeight / 2

  for (const row of rows) {
    ctx.fillText(row, canvasW / 2, ry)
    ry += lineHeight
  }
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number): void {
  if (w < 2 * r) r = w / 2
  if (h < 2 * r) r = h / 2
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}

function formatTime(s: number): string {
  if (!isFinite(s) || s === null) return '0:00'
  const m = Math.floor(s / 60)
  const sec = Math.floor(s % 60).toString().padStart(2, '0')
  const ms = Math.floor((s % 1) * 100).toString().padStart(2, '0')
  return `${m}:${sec}.${ms}`
}
