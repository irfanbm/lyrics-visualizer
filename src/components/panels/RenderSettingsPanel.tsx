import { useEffect } from 'react'
import type { RenderConfig } from '../../types'
import { GOOGLE_FONTS } from '../../utils/fonts'

interface Props {
  config: RenderConfig
  onChange: (patch: Partial<RenderConfig>) => void
}

export function RenderSettingsPanel({ config, onChange }: Props) {
  // Ensure font is loaded when changed
  useEffect(() => {
    import('../../utils/fonts').then(({ ensureFontLoaded }) => ensureFontLoaded(config.fontFamily).catch(() => {}))
  }, [config.fontFamily])

  const updateRes = (res: RenderConfig['resolution']) => {
    if (res === 'custom') onChange({ resolution: 'custom', customWidth: 1920, customHeight: 1080 })
    else onChange({ resolution: res })
  }

  return (
    <section className="glass rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.35)] overflow-hidden shrink-0">
      <div className="p-4 border-b border-white/10">
        <h3 className="font-bold text-sm font-display">Render Inspector</h3>
        <p className="text-[11px] text-white/50 mt-0.5">WYSIWYG — preview = export</p>
      </div>

      {/* Resolution */}
      <div className="p-2.5 space-y-2 border-b border-white/10">
        <label className="text-[11px] text-white/60 block mb-1 font-medium">Canvas</label>
        <div className="grid grid-cols-4 gap-1.5">
          <button aria-pressed={config.resolution==='1080p'} onClick={() => updateRes('1080p')} className={`min-h-[36px] px-2 py-2 rounded-lg text-[11px] font-bold transition border ${config.resolution === '1080p' ? 'bg-[var(--color-accent)] text-black neon-glow border-transparent' : 'glass hover:bg-white/10 border-white/10 text-white/60'}`}>1080p</button>
          <button aria-pressed={config.resolution==='720p'} onClick={() => updateRes('720p')} className={`min-h-[36px] px-2 py-2 rounded-lg text-[11px] font-bold transition border ${config.resolution === '720p' ? 'bg-[var(--color-accent)] text-black neon-glow border-transparent' : 'glass hover:bg-white/10 border-white/10 text-white/60'}`}>720p</button>
          <button aria-pressed={config.resolution==='vertical'} onClick={() => updateRes('vertical')} className={`min-h-[36px] px-2 py-2 rounded-lg text-[11px] font-bold transition border ${config.resolution === 'vertical' ? 'bg-[var(--color-accent)] text-black neon-glow border-transparent' : 'glass hover:bg-white/10 border-white/10 text-white/60'}`}>9:16</button>
          <button aria-pressed={config.resolution==='custom'} onClick={() => updateRes('custom')} className={`min-h-[36px] px-2 py-2 rounded-lg text-[11px] font-bold transition border ${config.resolution === 'custom' ? 'bg-[var(--color-accent)] text-black neon-glow border-transparent' : 'glass hover:bg-white/10 border-white/10 text-white/60'}`}>Custom</button>
        </div>
        {config.resolution === 'custom' && (
          <div className="grid grid-cols-2 gap-1.5 pt-2">
            <input type="number" aria-label="Custom width" placeholder="Width" value={config.customWidth || 1920} onChange={(e) => onChange({ customWidth: Math.max(16, parseInt(e.target.value) || 1920) })} className="w-full min-h-[36px] bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-[11px] outline-none focus:border-[var(--color-accent)] text-white" />
            <input type="number" aria-label="Custom height" placeholder="Height" value={config.customHeight || 1080} onChange={(e) => onChange({ customHeight: Math.max(16, parseInt(e.target.value) || 1080) })} className="w-full min-h-[36px] bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-[11px] outline-none focus:border-[var(--color-accent)] text-white" />
          </div>
        )}
        <p className="text-[10px] text-white/40 pt-1 font-mono">Current: {getDimensions(config)}</p>
      </div>

      {/* Lyric Position */}
      <div className="p-2.5 space-y-2 border-b border-white/10">
        <label className="text-[11px] text-white/60 block font-medium">Lyric Position</label>
        <div className="grid grid-cols-3 gap-1.5">
          {(['top', 'center', 'bottom'] as const).map(pos => (
            <button key={pos} aria-pressed={config.lyricPosition===pos} onClick={() => onChange({ lyricPosition: pos })} className={`min-h-[36px] px-2 py-2 rounded-lg text-[11px] font-bold transition capitalize border ${config.lyricPosition === pos ? 'bg-[var(--color-accent)] text-black neon-glow border-transparent' : 'glass hover:bg-white/10 border-white/10 text-white/60'}`}>{pos}</button>
          ))}
        </div>
      </div>

      <div className="p-2.5 space-y-2 border-b border-white/10">
        <label className="text-[11px] text-white/60 block font-medium">Font Family</label>
        <select value={config.fontFamily} onChange={(e) => onChange({ fontFamily: e.target.value })} className="w-full min-h-[36px] bg-white/5 border border-white/10 rounded-lg px-2.5 py-2 text-[11px] outline-none focus:border-[var(--color-accent)] text-white appearance-none">
          {GOOGLE_FONTS.map(f => <option key={f.family} value={f.family}>{f.label}</option>)}
        </select>
      </div>

      {/* Background Color */}
      <div className="p-2.5 space-y-2 border-b border-white/10">
        <label className="text-[11px] text-white/60 block">Background Color</label>
        <div className="flex items-center gap-2">
          <input type="color" value={config.bgColor} onChange={(e) => onChange({ bgColor: e.target.value })} className="w-10 h-10 rounded-lg cursor-pointer border-0 p-0.5 bg-transparent" />
          <span className="text-xs text-white/50 font-mono">{config.bgColor}</span>
        </div>
      </div>

      {/* Jarak & Jumlah baris & Fade tepi */}
      <div className="p-2.5 space-y-2 border-b border-white/10">
        <div className="grid grid-cols-2 gap-2">
          <label className="flex flex-col gap-1 text-[11px] text-white/70">Jarak antar baris
            <input type="range" min={1.15} max={2.6} step={0.05} value={(config as any).lineGap ?? 1.85} onChange={e => onChange({ lineGap: parseFloat(e.target.value) } as any)} className="accent-emerald-500" />
            <span className="font-mono text-[10px] text-white/50">{((config as any).lineGap ?? 1.85).toFixed(2)}×</span>
          </label>
          <label className="flex flex-col gap-1 text-[11px] text-white/70">Jumlah tampil
            <input type="range" min={3} max={11} step={2} value={(config as any).visibleLines ?? 5} onChange={e => onChange({ visibleLines: parseInt(e.target.value) } as any)} className="accent-emerald-500" />
            <span className="font-mono text-[10px] text-white/50">{(config as any).visibleLines ?? 5} baris</span>
          </label>
        </div>
        <label className="flex items-center gap-1.5.5 text-[11px] cursor-pointer select-none">
          <input type="checkbox" checked={(config as any).fadeEdges ?? true} onChange={e => onChange({ fadeEdges: e.target.checked } as any)} className="accent-emerald-500 w-4 h-4 rounded" />
          <span className="text-white/70">Fade opacity tepi atas/bawah</span>
        </label>
      </div>

      {/* Opacity */}
      <div className="p-2.5 space-y-2 border-b border-white/10">
        <label className="flex flex-col gap-1 text-[11px] text-white/70">Opacity lirik tidak aktif
          <input type="range" aria-label="Inactive lyric opacity" min={0.05} max={1} step={0.01} value={(config as any).inactiveOpacity ?? 0.28} onChange={e => onChange({ inactiveOpacity: parseFloat(e.target.value) } as any)} className="accent-[var(--color-accent)]" />
          <span className="font-mono text-[10px] text-white/50">{Math.round(((config as any).inactiveOpacity ?? 0.28)*100)}%</span>
        </label>
      </div>

      {/* Font Style */}
      <div className="p-2.5 space-y-2 border-b border-white/10">
        <label className="text-[11px] text-white/60 block font-medium">Font Style</label>
        <div className="grid grid-cols-4 gap-1.5">
          {[400,600,700,800].map(w => (
            <button key={w} aria-pressed={((config as any).fontWeight ?? 700)===w} onClick={() => onChange({ fontWeight: w } as any)} className={`min-h-[36px] px-2 py-2 rounded-lg text-[11px] font-bold transition border ${((config as any).fontWeight ?? 700) === w ? 'bg-[var(--color-accent)] text-black neon-glow border-transparent' : 'glass hover:bg-white/10 border-white/10 text-white/60'}`}>{w}</button>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-1.5">
          <label className="flex items-center gap-1.5 text-[11px] cursor-pointer select-none bg-white/5 border border-white/10 rounded-lg px-3 py-2">
            <input type="checkbox" checked={!!(config as any).fontItalic} onChange={e => onChange({ fontItalic: e.target.checked } as any)} className="accent-emerald-500 w-4 h-4 rounded" />
            <span className="text-white/70 italic">Italic</span>
          </label>
          <div className="flex items-center justify-center text-[10px] text-white/30 border border-dashed border-white/10 rounded-lg">Preview: <span style={{ fontWeight: (config as any).fontWeight ?? 700, fontStyle: (config as any).fontItalic ? 'italic' : 'normal', fontFamily: config.fontFamily }} className="ml-1 text-white">Aa</span></div>
        </div>
      </div>

      {/* Export Transparan */}
      <div className="p-2.5 space-y-2 border-b border-white/10">
        <label className="flex items-center gap-1.5.5 text-[11px] cursor-pointer select-none">
          <input type="checkbox" checked={!!(config as any).transparentBg} onChange={e => onChange({ transparentBg: e.target.checked } as any)} className="accent-emerald-500 w-4 h-4 rounded" />
          <span className="text-white/70">Background transparan (export)</span>
        </label>
        <p className="text-[10px] text-white/35 leading-relaxed">Jika aktif, preview & export video jadi transparan (VP9 alpha) — cocok untuk overlay di Premiere/CapCut. Background color diabaikan.</p>
      </div>

      {/* Toggleable Elements */}
      <div className="p-2.5 space-y-2">
        <label className="text-[11px] text-white/60 block uppercase tracking-wide">Show Elements (Preview + Export)</label>
        {[
          { k: 'showDuration', l: 'Duration Timer' },
          { k: 'showProgressBar', l: 'Progress Bar' },
          { k: 'showLineCounter', l: 'Line Counter X/N' },
          { k: 'showTitle', l: 'Song Title' },
          { k: 'karaokeMode', l: 'Word-by-Word Karaoke' }
        ].map(({ k, l }) => (
          <label key={k} className="flex items-center gap-1.5.5 text-[11px] cursor-pointer select-none">
            <input type="checkbox" checked={(config as any)[k]} onChange={(e) => onChange({ [k]: e.target.checked })} className="accent-emerald-500 w-4 h-4 rounded peer" />
            <span className="text-white/70 peer-checked:text-white">{l}</span>
          </label>
        ))}
      </div>
    </section>
  )
}

function getDimensions(cfg: RenderConfig): string {
  if (cfg.resolution === '720p') return '1280×720 (HD)'
  if (cfg.resolution === 'vertical') return '1080×1920 (9:16)'
  if (cfg.resolution === 'custom') return `${cfg.customWidth||1920}×${cfg.customHeight||1080}`
  return '1920×1080 (FHD)'
}
