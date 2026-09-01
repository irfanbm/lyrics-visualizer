import { useRef } from 'react'
import type * as React from 'react'
import type { LyricLine } from '../../utils/lrcParser'

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
}

export function formatTimeShort(s: number): string {
  if (!isFinite(s) || s === null || s < 0) return '0:00'
  const m = Math.floor(s / 60)
  const sec = Math.floor(s % 60).toString().padStart(2, '0')
  return `${m}:${sec}`
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
  onDemo
}: AudioPanelProps) {
  const audioInputRef = useRef<HTMLInputElement>(null)
  const lrcInputRef = useRef<HTMLInputElement>(null)
  const txtInputRef = useRef<HTMLInputElement>(null)

  return (
    <section className="bg-black/40 border border-white/10 rounded-3xl overflow-hidden shrink-0">
      {/* Header with track name */}
      <div className="p-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 grid place-items-center text-lg">🎵</div>
          <div className="min-w-0 flex-1">
            <h3 className="font-bold text-sm truncate">{audioName || 'No audio loaded'}</h3>
            <p className="text-[11px] text-white/50">{formatTimeShort(currentTime)} / {formatTimeShort(duration)}</p>
          </div>
        </div>
      </div>

      {/* Transport controls */}
      <div className="p-4 space-y-3">
        <div className="flex items-center gap-2">
          <button
            onClick={onPlayToggle}
            disabled={!audioRef.current}
            className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 disabled:cursor-not-allowed text-black font-bold rounded-xl text-sm transition"
          >
            {isPlaying ? '⏸ PAUSE' : '▶ PLAY'}
          </button>
        </div>

        {/* Seek bar */}
        <div className="flex items-center gap-2 text-[11px] font-mono text-white/70">
          <span className="w-10 text-right">{formatTimeShort(currentTime)}</span>
          <input
            type="range"
            min={0}
            max={duration || 1}
            step={0.01}
            value={Math.min(currentTime, duration || 1)}
            onChange={(e) => onSeek(parseFloat(e.target.value))}
            className="flex-1 accent-emerald-500"
          />
          <span className="w-10">{formatTimeShort(duration)}</span>
        </div>

        {/* Import buttons */}
        <div className="grid grid-cols-3 gap-2">
          <button onClick={() => audioInputRef.current?.click()} className="px-2 py-2 bg-white/5 hover:bg-white/15 rounded-xl text-[11px] font-bold transition border border-white/10">
            📁 Audio
          </button>
          <button onClick={() => lrcInputRef.current?.click()} className="px-2 py-2 bg-white/5 hover:bg-white/15 rounded-xl text-[11px] font-bold transition border border-white/10">
            🎵 LRC
          </button>
          <button onClick={() => txtInputRef.current?.click()} className="px-2 py-2 bg-white/5 hover:bg-white/15 rounded-xl text-[11px] font-bold transition border border-white/10">
            📝 TXT
          </button>
          <input ref={audioInputRef} type="file" accept="audio/*" onChange={onImportAudio} hidden />
          <input ref={lrcInputRef} type="file" accept=".lrc,.txt" onChange={onImportLrc} hidden />
          <input ref={txtInputRef} type="file" accept=".txt" onChange={onImportTxt} hidden />
        </div>

        {/* Editor marking controls */}
        {mode === 'editor' && (
          <div className="pt-2 border-t border-white/10 space-y-2">
            <div className="flex items-center justify-between text-[11px] font-bold">
              <span className="text-amber-200">Sync Marking</span>
              <span className="text-amber-200/70">{markedCount}/{totalLines} lines</span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={onMark}
                disabled={nextIndex < 0}
                className={`flex-1 py-2 rounded-xl text-xs font-bold transition ${nextIndex >= 0 ? 'bg-emerald-500 text-black animate-pulse' : 'bg-white/5 text-white/40 cursor-not-allowed'}`}
              >
                ● Mark {nextIndex >= 0 ? `#${nextIndex + 1}` : 'done'}
              </button>
              <button onClick={onClearTimes} className="px-3 py-2 rounded-xl bg-white/5 text-xs border border-white/10 hover:bg-white/10">
                Clear
              </button>
            </div>
          </div>
        )}

        {/* Exporting progress */}
        {isExporting && (
          <div className="pt-2 border-t border-white/10 space-y-2">
            <div className="text-[11px] font-bold text-emerald-300">🎬 Rendering video... {Math.round(exportProgress)}%</div>
            <div className="h-2 bg-white/10 rounded-full overflow-hidden">
              <div className="h-full bg-emerald-500 transition-all" style={{ width: `${exportProgress}%` }} />
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
