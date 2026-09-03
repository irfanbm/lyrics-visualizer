// Elegant visualizers — Bars retained, 6 more
export type VisualizerType = 'bars' | 'mirrored' | 'wave' | 'circular' | 'particles' | 'spectrum' | 'horizon'

function hexToRgb(hex: string): [number, number, number] {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  if (!m) return [34, 197, 94]
  return [parseInt(m[1], 16), parseInt(m[2], 16), parseInt(m[3], 16)]
}

export function drawBars(ctx: CanvasRenderingContext2D, data: Uint8Array, len: number, w: number, h: number, opts: { alpha?: number; color?: string; sensitivity?: number; bars?: number } = {}) {
  const { alpha = 0.9, color = '#22C55E', sensitivity = 1, bars = 48 } = opts
  const [r, g, b] = hexToRgb(color)
  const count = Math.min(len, bars)
  const step = len / count
  const gap = 2
  const barW = (w / count) * 0.72
  for (let i = 0; i < count; i++) {
    const idx = Math.floor(i * step)
    const v = Math.min(1, (data[idx] / 255) * sensitivity)
    const bh = v * h * 0.82
    const x = i * (barW + gap) + gap / 2
    ctx.fillStyle = `rgba(${r},${g},${b},${alpha * (0.5 + v * 0.5)})`
    const y = h - bh
    const rad = Math.min(4, barW / 2)
    ctx.beginPath()
    // @ts-ignore
    if (ctx.roundRect) ctx.roundRect(x, y, barW, bh, [rad, rad, 0, 0])
    else ctx.rect(x, y, barW, bh)
    ctx.fill()
  }
}

export function drawMirrored(ctx: CanvasRenderingContext2D, data: Uint8Array, len: number, w: number, h: number, opts: { alpha?: number; color?: string; sensitivity?: number; bars?: number } = {}) {
  const { alpha = 0.85, color = '#06B6D4', sensitivity = 1, bars = 48 } = opts
  const [r, g, b] = hexToRgb(color)
  const count = Math.min(len, bars)
  const step = len / count
  const barW = (w / count) * 0.68
  const gap = (w / count) * 0.32
  const mid = h / 2
  for (let i = 0; i < count; i++) {
    const idx = Math.floor(i * step)
    const v = Math.min(1, (data[idx] / 255) * sensitivity)
    const bh = v * (h * 0.42)
    const x = i * (barW + gap)
    ctx.fillStyle = `rgba(${r},${g},${b},${alpha})`
    ctx.fillRect(x, mid - bh, barW, bh)
    ctx.fillRect(x, mid, barW, bh)
  }
}

export function drawWave(ctx: CanvasRenderingContext2D, data: Uint8Array, len: number, w: number, h: number, opts: { alpha?: number; color?: string; sensitivity?: number } = {}) {
  const { alpha = 0.9, color = '#A855F7', sensitivity = 1 } = opts
  const [r, g, b] = hexToRgb(color)
  const slice = w / len
  ctx.beginPath()
  let x = 0
  for (let i = 0; i < len; i++) {
    const v = (data[i] / 128 - 1) * sensitivity
    const y = h / 2 + v * (h * 0.28)
    if (i === 0) ctx.moveTo(x, y)
    else {
      const prevX = x - slice
      const prevY = h / 2 + (data[i - 1] / 128 - 1) * sensitivity * (h * 0.28)
      const cx = (prevX + x) / 2
      ctx.quadraticCurveTo(prevX, prevY, cx, (prevY + y) / 2)
    }
    x += slice
  }
  ctx.lineTo(w, h / 2)
  ctx.lineTo(0, h / 2)
  ctx.closePath()
  const grad = ctx.createLinearGradient(0, 0, 0, h)
  grad.addColorStop(0, `rgba(${r},${g},${b},${alpha * 0.35})`)
  grad.addColorStop(0.5, `rgba(${r},${g},${b},${alpha * 0.18})`)
  grad.addColorStop(1, `rgba(${r},${g},${b},0)`)
  ctx.fillStyle = grad
  ctx.fill()
  ctx.strokeStyle = `rgba(${r},${g},${b},${alpha})`
  ctx.lineWidth = 1.5
  ctx.beginPath()
  x = 0
  for (let i = 0; i < len; i++) {
    const v = (data[i] / 128 - 1) * sensitivity
    const y = h / 2 + v * (h * 0.28)
    if (i === 0) ctx.moveTo(x, y)
    else ctx.lineTo(x, y)
    x += slice
  }
  ctx.stroke()
}

export function drawCircular(ctx: CanvasRenderingContext2D, data: Uint8Array, len: number, w: number, h: number, opts: { alpha?: number; color?: string; sensitivity?: number } = {}) {
  const { alpha = 0.9, color = '#22C55E', sensitivity = 1 } = opts
  const [r, g, b] = hexToRgb(color)
  const cx = w / 2
  const cy = h / 2
  const baseR = Math.min(w, h) * 0.18
  const count = Math.min(len, 72)
  const step = len / count
  for (let i = 0; i < count; i++) {
    const idx = Math.floor(i * step)
    const v = Math.min(1, (data[idx] / 255) * sensitivity)
    const barLen = v * Math.min(w, h) * 0.22
    const ang = (i / count) * Math.PI * 2 - Math.PI / 2
    const x1 = cx + Math.cos(ang) * baseR
    const y1 = cy + Math.sin(ang) * baseR
    const x2 = cx + Math.cos(ang) * (baseR + barLen)
    const y2 = cy + Math.sin(ang) * (baseR + barLen)
    ctx.strokeStyle = `rgba(${r},${g},${b},${alpha * (0.4 + v * 0.6)})`
    ctx.lineWidth = 1.8
    ctx.lineCap = 'round'
    ctx.beginPath()
    ctx.moveTo(x1, y1)
    ctx.lineTo(x2, y2)
    ctx.stroke()
  }
  ctx.strokeStyle = `rgba(${r},${g},${b},0.18)`
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.arc(cx, cy, baseR, 0, Math.PI * 2)
  ctx.stroke()
}

export function drawParticles(ctx: CanvasRenderingContext2D, data: Uint8Array, len: number, w: number, h: number, opts: { alpha?: number; color?: string; sensitivity?: number } = {}) {
  const { alpha = 0.9, color = '#F59E0B', sensitivity = 1 } = opts
  const [r, g, b] = hexToRgb(color)
  const count = Math.min(len, 48)
  const step = len / count
  for (let i = 0; i < count; i++) {
    const idx = Math.floor(i * step)
    const v = Math.min(1, (data[idx] / 255) * sensitivity)
    const cols = 8
    const col = i % cols
    const row = Math.floor(i / cols)
    const x = (col + 0.5) * (w / cols) + Math.sin(i * 0.7) * 6
    const y = (row + 0.5) * (h / Math.ceil(count / cols)) + Math.cos(i * 0.9) * 6
    const rad = 2 + v * 6
    ctx.beginPath()
    ctx.arc(x, y, rad, 0, Math.PI * 2)
    ctx.fillStyle = `rgba(${r},${g},${b},${alpha * (0.35 + v * 0.65)})`
    ctx.shadowColor = `rgba(${r},${g},${b},0.6)`
    ctx.shadowBlur = rad * 1.2
    ctx.fill()
    ctx.shadowBlur = 0
  }
}

// Spectrum — thin line spectrum with gradient (fixed visibility, no getImageData)
export function drawSpectrum(ctx: CanvasRenderingContext2D, data: Uint8Array, len: number, w: number, h: number, opts: { alpha?: number; color?: string; sensitivity?: number; bars?: number } = {}) {
  const { alpha = 0.9, color = '#06B6D4', sensitivity = 1, bars = 64 } = opts
  const [r, g, b] = hexToRgb(color)
  const count = Math.min(len, bars)
  const step = len / count
  const slice = w / count
  ctx.strokeStyle = `rgba(${r},${g},${b},${alpha})`
  ctx.lineWidth = 1.5
  ctx.lineJoin = 'round'
  ctx.beginPath()
  for (let i = 0; i < count; i++) {
    const idx = Math.floor(i * step)
    const v = Math.min(1, (data[idx] / 255) * sensitivity)
    const y = h - v * h * 0.82 - h * 0.04
    const x = i * slice + slice / 2
    if (i === 0) ctx.moveTo(x, y)
    else ctx.lineTo(x, y)
  }
  ctx.stroke()
  ctx.lineTo(w, h)
  ctx.lineTo(0, h)
  ctx.closePath()
  const grad = ctx.createLinearGradient(0, 0, 0, h)
  grad.addColorStop(0, `rgba(${r},${g},${b},${alpha * 0.32})`)
  grad.addColorStop(0.6, `rgba(${r},${g},${b},${alpha * 0.12})`)
  grad.addColorStop(1, `rgba(${r},${g},${b},0)`)
  ctx.fillStyle = grad
  ctx.fill()
}

// Horizon — layered mountains (more visible)
export function drawHorizon(ctx: CanvasRenderingContext2D, data: Uint8Array, len: number, w: number, h: number, opts: { alpha?: number; color?: string; sensitivity?: number } = {}) {
  const { alpha = 0.85, color = '#A855F7', sensitivity = 1 } = opts
  const [r, g, b] = hexToRgb(color)
  const layers = 3
  for (let l = 0; l < layers; l++) {
    const yOff = h * (0.58 + l * 0.1)
    const amp = (h * 0.22 * sensitivity) * (1 - l * 0.22)
    ctx.beginPath()
    ctx.moveTo(0, yOff)
    const step = w / len
    for (let i = 0; i < len; i++) {
      const v = (data[i] / 255) * amp
      const x = i * step
      const y = yOff - v + Math.sin(i * 0.12 + l * 1.3) * 3
      if (i === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    }
    ctx.lineTo(w, h)
    ctx.lineTo(0, h)
    ctx.closePath()
    const layerAlpha = alpha * (0.42 - l * 0.09)
    ctx.fillStyle = `rgba(${r},${g},${b},${layerAlpha})`
    ctx.fill()
    ctx.strokeStyle = `rgba(${r},${g},${b},${alpha * (0.65 - l * 0.14)})`
    ctx.lineWidth = 1.2
    ctx.stroke()
  }
}

export function drawByType(type: VisualizerType, ctx: CanvasRenderingContext2D, data: Uint8Array, len: number, w: number, h: number, opts: any = {}) {
  switch (type) {
    case 'bars': return drawBars(ctx, data, len, w, h, opts)
    case 'mirrored': return drawMirrored(ctx, data, len, w, h, opts)
    case 'wave': return drawWave(ctx, data, len, w, h, opts)
    case 'circular': return drawCircular(ctx, data, len, w, h, opts)
    case 'particles': return drawParticles(ctx, data, len, w, h, opts)
    case 'spectrum': return drawSpectrum(ctx, data, len, w, h, opts)
    case 'horizon': return drawHorizon(ctx, data, len, w, h, opts)
  }
}

export const VISUALIZERS: { id: VisualizerType | 'none'; label: string; desc: string }[] = [
  { id: 'none', label: 'None', desc: 'Lirik saja' },
  { id: 'bars', label: 'Bars', desc: 'Vertical' },
  { id: 'mirrored', label: 'Mirrored', desc: 'Center' },
  { id: 'wave', label: 'Wave', desc: 'Smooth fill' },
  { id: 'circular', label: 'Circle', desc: 'Radial' },
  { id: 'particles', label: 'Dots', desc: 'Glow' },
  { id: 'spectrum', label: 'Spectrum', desc: 'Line' },
  { id: 'horizon', label: 'Horizon', desc: 'Mountains' },
]
