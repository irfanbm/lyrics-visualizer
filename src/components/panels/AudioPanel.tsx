import { useRef } from 'react'
import type * as React from 'react'

interface AudioPanelProps {
  audioRef: React.RefObject<HTMLAudioElement | null>
  audioName: string
  isPlaying: boolean
  currentTime: number
  duration: number
  isExporting: boolean
  exportProgress: number
  mode: 'player' | 'editor'
  nextIndex: number
  totalLines: number
  markedCount: number
  onPlayToggle: () => void
  onSeek: (value: number) => void
  onMark: () => void
  onClearTimes: () => void
  onImportAudio: (e: React.ChangeEvent<HTMLInputElement>) => void
  onImportLrc: (e: React.ChangeEvent<HTMLInputElement>) => void
  onImportTxt: (e: React.ChangeEvent<HTMLInputElement>) => void
  onDemo: () => void
  onStartFromZero: () => void
}

export function formatTimeShort(s: number): string {
  if (!isFinite(s) || s === null || s < 0) return '0:00'
  const m = Math.floor(s / 60)
  const sec = Math.floor(s % 60).toString().padStart(2, '0')
  return `${m}:${sec}`
}

// Inline SVG icons — Phosphor weight 1.5, no emoji, no external dep
function IconMusic(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} aria-hidden {...props}>
      <path d="M9 18V6l10-2v12" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={7} cy={18} r={2.5} />
      <circle cx={17} cy={16} r={2.5} />
    </svg>
  )
}
function IconPlay(props: React.SVGProps<SVGSVGElement>) {
  return <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden {...props}><path d="M8 5.14v14l11-7-11-7z" /></svg>
}
function IconPause(props: React.SVGProps<SVGSVGElement>) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} aria-hidden {...props}><rect x={7} y={5} width={3.5} height={14} rx={1} fill="currentColor" stroke="none" /><rect x={13.5} y={5} width={3.5} height={14} rx={1} fill="currentColor" stroke="none" /></svg>
}
function IconFolder(props: React.SVGProps<SVGSVGElement>) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} aria-hidden {...props}><path d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v7a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" strokeLinejoin="round" /></svg>
}

export function AudioPanel({
  audioRef,
  audioName,
  isPlaying,
  currentTime,
  duration,
  isExporting,
  exportProgress,
  mode,
  nextIndex,
  totalLines,
  markedCount,
  onPlayToggle,
  onSeek,
  onMark,
  onClearTimes,
  onImportAudio,
  onImportLrc,
  onImportTxt,
  onStartFromZero
}: AudioPanelProps) {
  const audioInputRef = useRef<HTMLInputElement>(null)
  const lrcInputRef = useRef<HTMLInputElement>(null)
  const txtInputRef = useRef<HTMLInputElement>(null)

  return (
    <section className="glass rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.35)] overflow-hidden shrink-0">
      <div className="p-4 border-b border-white/10">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-[var(--color-accent)]/15 border border-[var(--color-accent)]/25 grid place-items-center text-[var(--color-accent)] shrink-0">
            <IconMusic className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-bold text-sm truncate font-display" title={audioName || 'No audio loaded'}>{audioName || 'No audio loaded'}</h3>
            <p className="text-[11px] text-white/50 font-mono">{formatTimeShort(currentTime)} / {formatTimeShort(duration)}</p>
          </div>
        </div>
      </div>

      <div className="p-2.5 space-y-2">
        <button
          onClick={onPlayToggle}
          disabled={!audioRef.current}
          aria-label={isPlaying ? 'Pause audio' : 'Play audio'}
          className="w-full min-h-[36px] py-2.5 bg-[var(--color-accent)] hover:bg-[#16A34A] neon-glow disabled:opacity-40 disabled:cursor-not-allowed text-black font-bold rounded-xl text-sm transition flex items-center justify-center gap-1.5"
        >
          {isPlaying ? <><IconPause className="w-4 h-4" /> Pause</> : <><IconPlay className="w-4 h-4" /> Play</>}
        </button>

        <div className="flex items-center gap-1.5 text-[11px] font-mono text-white/70">
          <span className="w-10 text-right tabular-nums">{formatTimeShort(currentTime)}</span>
          <input
            type="range"
            min={0}
            max={duration || 1}
            step={0.01}
            value={Math.min(currentTime, duration || 1)}
            onChange={(e) => onSeek(parseFloat(e.target.value))}
            aria-label="Seek audio position"
            className="flex-1 accent-[var(--color-accent)] min-h-[24px]"
          />
          <span className="w-10 tabular-nums">{formatTimeShort(duration)}</span>
        </div>

        <div className="grid grid-cols-3 gap-1.5">
          <button onClick={() => audioInputRef.current?.click()} aria-label="Import audio file" className="min-h-[36px] px-2 py-2 glass hover:bg-white/10 rounded-xl text-[11px] font-bold transition border border-white/10 flex items-center justify-center gap-1.5">
            <IconFolder className="w-3.5 h-3.5" /> Audio
          </button>
          <button onClick={() => lrcInputRef.current?.click()} aria-label="Import LRC file" className="min-h-[36px] px-2 py-2 glass hover:bg-white/10 rounded-xl text-[11px] font-bold transition border border-white/10 flex items-center justify-center gap-1.5">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-3.5 h-3.5" aria-hidden><path d="M8 6h8M8 12h8M8 18h5" strokeLinecap="round" /></svg> LRC
          </button>
          <button onClick={() => txtInputRef.current?.click()} aria-label="Import TXT file" className="min-h-[36px] px-2 py-2 glass hover:bg-white/10 rounded-xl text-[11px] font-bold transition border border-white/10 flex items-center justify-center gap-1.5">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-3.5 h-3.5" aria-hidden><path d="M14 2H7a2 2 0 00-2 2v16a2 2 0 002 2h10a2 2 0 002-2V8z" /><path d="M14 2v6h6" /></svg> TXT
          </button>
          <input ref={audioInputRef} type="file" accept="audio/*" onChange={onImportAudio} hidden />
          <input ref={lrcInputRef} type="file" accept=".lrc,.txt" onChange={onImportLrc} hidden />
          <input ref={txtInputRef} type="file" accept=".txt" onChange={onImportTxt} hidden />
        </div>

        {mode === 'editor' && (
          <div className="pt-3 border-t border-white/10 space-y-2">
            <div className="flex items-center justify-between text-[11px] font-bold">
              <span className="text-amber-200 font-display">Marking Mode</span>
              <span className="text-amber-200/70 font-mono">{markedCount}/{totalLines} marked</span>
            </div>
            <button
              onClick={onStartFromZero}
              className="w-full min-h-[36px] py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs transition"
              aria-label="Reset marking and start from zero"
            >
              Start from 0 — Reset &amp; Play
            </button>
            <div className="flex gap-1.5">
              <button
                onClick={onMark}
                disabled={nextIndex < 0}
                aria-label={`Mark lyric line ${nextIndex >= 0 ? nextIndex + 1 : 'done'}`}
                className={`flex-1 min-h-[36px] py-2 rounded-xl text-xs font-bold transition ${nextIndex >= 0 ? 'bg-[var(--color-accent)] text-black neon-glow' : 'bg-white/5 text-white/40 cursor-not-allowed'}`}
              >
                TAP #{nextIndex >= 0 ? nextIndex + 1 : 'done'} — Space
              </button>
              <button onClick={onClearTimes} aria-label="Reset all marks" className="min-h-[36px] px-3 py-2 rounded-xl bg-white/5 text-xs border border-white/10 hover:bg-white/10">
                Reset
              </button>
            </div>
            <p className="text-[10px] text-white/35 leading-relaxed">Space = TAP waktu baris berikutnya. ←→ scrub ±1s, Alt+←→ ±0.05s.</p>
          </div>
        )}

        {isExporting && (
          <div className="pt-3 border-t border-white/10 space-y-2">
            <div className="text-[11px] font-bold text-emerald-300 font-mono">Rendering video... {Math.round(exportProgress)}%</div>
            <div className="h-2 bg-white/10 rounded-full overflow-hidden">
              <div className="h-full bg-[var(--color-accent)] transition-all" style={{ width: `${exportProgress}%` }} />
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
