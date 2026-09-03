import { useEffect, useRef, useState } from 'react'
import type { RenderConfig } from '../../types'
import { VISUALIZERS, drawByType, type VisualizerType } from '../../visualizers/draw'

interface Props {
  audioRef: React.RefObject<HTMLAudioElement | null>
  audioSrc: string
  currentTime: number
  duration: number
  config: RenderConfig
  onConfigChange: (patch: Partial<RenderConfig>) => void
}

function Thumb({ type, active, peaks, analyserData, color, sensitivity, bars }: { type: VisualizerType | 'none'; active: boolean; peaks?: number[] | null; analyserData?: Uint8Array | null; color?: string; sensitivity?: number; bars?: number }) {
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const dpr = window.devicePixelRatio || 1
    const w = 140
    const h = 80
    canvas.width = w * dpr
    canvas.height = h * dpr
    canvas.style.width = w + 'px'
    canvas.style.height = h + 'px'
    ctx.scale(dpr, dpr)
    ctx.clearRect(0, 0, w, h)
    if (type === 'none') {
      ctx.fillStyle = 'rgba(255,255,255,0.04)'
      ctx.fillRect(0, 0, w, h)
      ctx.fillStyle = 'rgba(255,255,255,0.25)'
      ctx.font = '10px Geist Mono, monospace'
      ctx.textAlign = 'center'
      ctx.fillText('No visualizer', w / 2, h / 2)
      return
    }
    // Use analyser live if available else peaks fake
    let data: Uint8Array
    let len: number
    if (analyserData && analyserData.length > 0) {
      data = analyserData
      len = analyserData.length
    } else if (peaks && peaks.length) {
      // convert peaks 0-1 to 0-255 Uint8Array fake
      data = new Uint8Array(peaks.length)
      peaks.forEach((p, i) => (data[i] = Math.round(p * 255)))
      len = data.length
    } else {
      data = new Uint8Array(64)
      for (let i = 0; i < 64; i++) data[i] = Math.round((Math.sin(i / 64 * Math.PI * 2) * 0.5 + 0.5) * 200 + Math.random() * 20)
      len = 64
    }
    // small padding
    ctx.save()
    ctx.beginPath()
    ctx.roundRect(0, 0, w, h, 8)
    ctx.clip()
    // bg
    ctx.fillStyle = 'rgba(0,0,0,0.35)'
    ctx.fillRect(0, 0, w, h)
    try {
      drawByType(type as VisualizerType, ctx, data, len, w, h, { color: color || '#22C55E', sensitivity: sensitivity || 1, bars: bars || 48 })
    } catch {}
    ctx.restore()
    if (active) {
      ctx.strokeStyle = '#22C55E'
      ctx.lineWidth = 2
      ctx.strokeRect(1, 1, w - 2, h - 2)
    }
  }, [type, active, peaks, analyserData])

  return <canvas ref={ref} width={140} height={80} className="w-full h-[80px] rounded-lg block" />
}

export function VisualizerPanel({ audioRef: _audioRef, audioSrc, currentTime, duration, config, onConfigChange }: Props) {
  const [peaks, setPeaks] = useState<number[] | null>(null)
  const [liveData] = useState<Uint8Array | null>(null)

  // decode peaks for thumbs
  useEffect(() => {
    if (!audioSrc) { setPeaks(null); return }
    let cancelled = false
    const ac = new (window.AudioContext || (window as any).webkitAudioContext)()
    fetch(audioSrc).then(r => r.arrayBuffer()).then(b => ac.decodeAudioData(b)).then(dec => {
      if (cancelled) return
      const ch = dec.getChannelData(0)
      const target = 120
      const block = Math.floor(ch.length / target)
      const out: number[] = []
      for (let i = 0; i < target; i++) {
        let s = 0
        for (let j = 0; j < block; j++) s += Math.abs(ch[i * block + j])
        out.push(s / block)
      }
      const max = Math.max(...out) || 1
      setPeaks(out.map(v => v / max))
      ac.close().catch(() => {})
    }).catch(() => {
      if (!cancelled) setPeaks(Array.from({ length: 120 }, () => Math.random() * 0.6 + 0.2))
      try { ac.close() } catch {}
    })
    return () => { cancelled = true; try { ac.close() } catch {} }
  }, [audioSrc])

  const selected = (config as any).visualizer || 'none'

  // per-visualizer configs map
  const vizConfigs: Record<string, any> = (config as any).visualizerConfigs || {}
  const savePerViz = (patch: any) => {
    const cur = vizConfigs[selected] || {}
    const next = { ...vizConfigs, [selected]: { ...cur, ...patch } }
    onConfigChange({ ...patch, visualizerConfigs: next } as any)
  }
  const handleSelectViz = (id: string) => {
    const stored = vizConfigs[id]
    if (stored) {
      onConfigChange({ visualizer: id as any, ...stored, visualizerConfigs: vizConfigs } as any)
    } else {
      // init with current global settings as base for new viz
      const base: any = {
        visualizerOpacity: (config as any).visualizerOpacity,
        visualizerPosition: (config as any).visualizerPosition,
        visualizerColor: (config as any).visualizerColor,
        visualizerSize: (config as any).visualizerSize,
        visualizerSensitivity: (config as any).visualizerSensitivity,
        visualizerSmoothing: (config as any).visualizerSmoothing,
        visualizerBars: (config as any).visualizerBars,
      }
      onConfigChange({ visualizer: id as any, visualizerConfigs: { ...vizConfigs, [id]: base } } as any)
    }
  }

  const positionOptions: Record<string, { value: string; label: string }[]> = {
    none: [],
    bars: [
      { value: 'background', label: 'Background penuh' },
      { value: 'bottom', label: 'Bottom bar' },
      { value: 'top', label: 'Top bar' },
    ],
    mirrored: [{ value: 'background', label: 'Tengah (center)' }],
    wave: [
      { value: 'background', label: 'Background penuh' },
      { value: 'bottom', label: 'Bottom bar' },
    ],
    circular: [{ value: 'background', label: 'Tengah (center)' }],
    particles: [{ value: 'background', label: 'Tengah (center)' }],
    spectrum: [
      { value: 'background', label: 'Background penuh' },
      { value: 'bottom', label: 'Bottom bar' },
    ],
    horizon: [
      { value: 'background', label: 'Background penuh' },
      { value: 'bottom', label: 'Bottom bar' },
    ],
  }
  const allowedPos = positionOptions[selected] || positionOptions['bars']

  // auto-correct position if not allowed for this visualizer
  useEffect(() => {
    const allowed = positionOptions[selected] || positionOptions['bars']
    const cur = (config as any).visualizerPosition
    if (allowed.length && !allowed.some(o => o.value === cur)) {
      onConfigChange({ visualizerPosition: allowed[0].value as any })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected])

  return (
    <section className="glass rounded-2xl overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.35)]">
      <div className="p-2.5 border-b border-white/10">
        <h3 className="font-bold text-xs font-display">Visualizer</h3>
        <p className="text-[10px] text-white/40 font-mono">Grid picker — tampil di canvas lirik (preview = export)</p>
      </div>

      <div className="p-2.5 space-y-2.5">
        {/* Grid */}
        <div className="grid grid-cols-2 gap-2">
          {VISUALIZERS.map(v => {
            const isActive = selected === v.id
            const stored = vizConfigs[v.id] || {}
            const thumbColor = (stored as any).visualizerColor || (config as any).visualizerColor
            const thumbSens = (stored as any).visualizerSensitivity ?? (config as any).visualizerSensitivity
            const thumbBars = (stored as any).visualizerBars ?? (config as any).visualizerBars
            return (
              <button
                key={v.id}
                onClick={() => handleSelectViz(v.id)}
                aria-pressed={isActive}
                className={`group relative rounded-xl overflow-hidden border text-left transition ${isActive ? 'border-[var(--color-accent)] shadow-[0_0_14px_rgba(34,197,94,0.35)]' : 'border-white/10 hover:border-white/20'}`}
              >
                <Thumb type={v.id as any} active={isActive} peaks={peaks} analyserData={liveData} color={thumbColor} sensitivity={thumbSens} bars={thumbBars} />
                <div className={`px-2 py-1.5 flex items-center justify-between ${isActive ? 'bg-[var(--color-accent)] text-black' : 'bg-black/40 text-white/70'}`}>
                  <span className="text-[11px] font-bold leading-none">{v.label}</span>
                  <span className={`text-[9px] font-mono tracking-wide ${isActive ? 'text-black/60' : 'text-white/35'}`}>{v.desc}</span>
                </div>
                {isActive && <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-[var(--color-accent)] shadow-[0_0_8px_rgba(34,197,94,0.8)]" />}
              </button>
            )
          })}
        </div>

        {/* Visualizer settings */}
        <div className="pt-2 border-t border-white/10 space-y-2.5">
          <div className="space-y-1.5">
            <label className="flex items-center justify-between text-[11px] text-white/60">
              <span>Opacity</span>
              <span className="font-mono text-white/80">{Math.round(((config as any).visualizerOpacity ?? 0.55) * 100)}%</span>
            </label>
            <input type="range" min={0.1} max={1} step={0.05} value={(config as any).visualizerOpacity ?? 0.55} onChange={e => savePerViz({ visualizerOpacity: parseFloat(e.target.value) })} className="w-full accent-[var(--color-accent)]" aria-label="Visualizer opacity" />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label className="text-[11px] text-white/60">Posisi</label>
              {allowedPos.length <= 1 ? (
                <div className="w-full glass rounded-lg px-2 py-1.5 text-[11px] text-white/40 border border-white/10">{allowedPos[0]?.label || 'Tengah'}</div>
              ) : (
                <select value={(config as any).visualizerPosition || 'background'} onChange={e => savePerViz({ visualizerPosition: e.target.value as any })} className="w-full glass rounded-lg px-2 py-1.5 text-[11px] text-white border-white/10">
                  {allowedPos.map(o => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              )}
            </div>
            <div className="space-y-1">
              <label className="text-[11px] text-white/60">Ukuran</label>
              <div className="flex items-center gap-1.5">
                <input type="range" min={0.6} max={1.6} step={0.1} value={(config as any).visualizerSize ?? 1} onChange={e => savePerViz({ visualizerSize: parseFloat(e.target.value) })} className="flex-1 accent-[var(--color-accent)]" aria-label="Visualizer size" />
                <span className="font-mono text-[10px] text-white/60 w-8">{((config as any).visualizerSize ?? 1).toFixed(1)}x</span>
              </div>
            </div>
          </div>

          <div className="space-y-1">
            <label className="flex items-center justify-between text-[11px] text-white/60">
              <span>Sensitivitas</span>
              <span className="font-mono text-white/70">{((config as any).visualizerSensitivity ?? 1).toFixed(1)}x</span>
            </label>
            <input type="range" min={0.5} max={2.2} step={0.1} value={(config as any).visualizerSensitivity ?? 1} onChange={e => savePerViz({ visualizerSensitivity: parseFloat(e.target.value) })} className="w-full accent-[var(--color-accent)]" aria-label="Visualizer sensitivity" />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label className="flex items-center justify-between text-[11px] text-white/60">
                <span>Smooth</span>
                <span className="font-mono text-white/60 text-[10px]">{Math.round(((config as any).visualizerSmoothing ?? 0.35) * 100)}%</span>
              </label>
              <input type="range" min={0} max={0.85} step={0.05} value={(config as any).visualizerSmoothing ?? 0.35} onChange={e => savePerViz({ visualizerSmoothing: parseFloat(e.target.value) })} className="w-full accent-[var(--color-accent)]" aria-label="Visualizer smoothing" />
            </div>
            <div className="space-y-1">
              <label className="flex items-center justify-between text-[11px] text-white/60">
                <span>Jumlah Bar</span>
                <span className="font-mono text-white/60 text-[10px]">{(config as any).visualizerBars ?? 48}</span>
              </label>
              <input type="range" min={24} max={96} step={8} value={(config as any).visualizerBars ?? 48} onChange={e => savePerViz({ visualizerBars: parseInt(e.target.value) })} className="w-full accent-[var(--color-accent)]" aria-label="Jumlah bar" disabled={selected === 'none' || selected === 'circular' || selected === 'particles'} />
            </div>
          </div>
          <p className="text-[10px] text-white/25">Smooth = halusnya gerakan, Bars = kerapatan (khusus Bars/Mirrored/Spectrum/Horizon)</p>

          <div className="space-y-1">
            <label className="text-[11px] text-white/60">Warna</label>
            <div className="flex items-center gap-2">
              <input type="color" value={(config as any).visualizerColor || '#22C55E'} onChange={e => savePerViz({ visualizerColor: e.target.value })} className="w-9 h-9 rounded-lg border border-white/10 p-0.5 bg-transparent cursor-pointer" aria-label="Visualizer color" />
              <div className="flex gap-1.5">
                {['#22C55E','#06B6D4','#A855F7','#EF4444','#F59E0B','#FFFFFF'].map(c => (
                  <button key={c} onClick={() => savePerViz({ visualizerColor: c })} aria-label={`Set color ${c}`} className={`w-6 h-6 rounded-full border-2 ${((config as any).visualizerColor||'#22C55E').toLowerCase()===c.toLowerCase() ? 'border-white' : 'border-white/20'}`} style={{ background: c }} />
                ))}
              </div>
              <span className="font-mono text-[10px] text-white/40 ml-auto">{(config as any).visualizerColor || '#22C55E'}</span>
            </div>
          </div>
          <p className="text-[10px] text-white/30 leading-relaxed">Posisi & warna dipakai saat preview & export. Background = full, Bottom/Top = bar setengah tinggi.</p>
        </div>

        {/* Live info */}
        <div className="flex items-center gap-1.5 text-[10px] font-mono text-white/40">
          <span className="w-10 text-right">{currentTime.toFixed(1)}s</span>
          <div className="flex-1 h-1 bg-white/10 rounded-full overflow-hidden">
            <div className="h-full bg-[var(--color-accent)]" style={{ width: `${duration ? (currentTime / duration) * 100 : 0}%` }} />
          </div>
          <span className="w-10">{duration ? duration.toFixed(1) + 's' : '--'}</span>
        </div>
      </div>
    </section>
  )
}
