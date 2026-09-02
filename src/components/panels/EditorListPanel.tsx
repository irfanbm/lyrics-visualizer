import { useEffect, useRef } from 'react'

interface Props {
  editorLines: any[]
  mode: 'player' | 'editor'
  nextIndex: number
  markedCount: number
  totalLines: number
  currentTime: number
  formatTimeShort: (s: number) => string
  onTextChange: (idx: number, val: string) => void
  onDeleteLine: (idx: number) => void
  onAddLine: () => void
  onMarkAt: (idx: number) => void
  onMarkNext: () => void
  onUndoLast: () => void
  onAdjustTime: (idx: number, delta: number) => void
  onOffsetAll: (delta: number) => void
  onClearTimes: () => void
  onApplyEditor: () => void
  offset: number
  onStartFromZero: () => void
}

export function EditorListPanel({
  editorLines,
  mode,
  nextIndex,
  markedCount,
  totalLines,
  currentTime,
  formatTimeShort,
  onTextChange,
  onDeleteLine,
  onAddLine,
  onMarkAt,
  onMarkNext,
  onUndoLast,
  onAdjustTime,
  onOffsetAll,
  onClearTimes,
  onApplyEditor,
  offset,
  onStartFromZero,
}: Props) {
  const nextItemRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (nextItemRef.current) {
      nextItemRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }, [nextIndex])

  if (mode !== 'editor') {
    return (
      <section className="bg-black/40 border border-white/10 rounded-3xl p-5 text-center">
        <p className="text-sm text-white/60">Switch to <b className="text-white">Editor Mode</b> untuk marking.</p>
        <p className="text-[11px] text-white/40 mt-1">Import audio + txt, lalu <b className="text-amber-300">Start from 0</b>.</p>
      </section>
    )
  }

  const nextLine = nextIndex >= 0 ? editorLines[nextIndex] : null
  const allDone = nextIndex < 0 && totalLines > 0
  const hasAudio = currentTime > 0 || markedCount > 0
  const pct = totalLines ? Math.round((markedCount / totalLines) * 100) : 0

  return (
    <section className="bg-black/40 border border-white/10 rounded-3xl overflow-hidden shrink-0">
      <div className="px-4 pt-4 pb-3 border-b border-white/10 bg-white/[0.03]">
        <div className="flex items-center gap-2 text-[11px] font-bold">
          <span className="w-6 h-6 rounded-full bg-amber-500 text-black grid place-items-center text-xs">!</span>
          <span className="text-amber-300">Marking Mode</span>
          <span className="text-white/25">—</span>
          <span className="text-white/60 font-normal">Space = tap waktu</span>
        </div>
        <div className="mt-2 flex items-center gap-2 text-[11px] text-white/50">
          <span className="font-mono bg-white/10 px-2 py-0.5 rounded text-emerald-300">⏱ {formatTimeShort(currentTime)}</span>
          <span>audio position</span>
        </div>
      </div>

      <div className="p-4 space-y-3 bg-gradient-to-b from-emerald-500/[0.07] to-transparent">
        <div className="flex items-center justify-between text-[11px]">
          <span className="text-white/60">{markedCount}/{totalLines} • {pct}%</span>
          <span className="font-mono text-white/50">offset {offset > 0 ? `+${offset.toFixed(1)}` : `${offset.toFixed(1)}`}s</span>
        </div>
        <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
          <div className="h-full bg-emerald-500 transition-all" style={{ width: `${pct}%` }} />
        </div>

        <div className={`rounded-2xl border p-3 ${allDone ? 'bg-emerald-500/15 border-emerald-500/30' : 'bg-white/[0.06] border-white/10'}`}>
          <div className="text-[10px] tracking-widest text-white/40 mb-1">{allDone ? 'SELESAI' : `BERIKUTNYA • #${nextIndex + 1}`}</div>
          <div className={`text-[15px] leading-snug font-bold min-h-[1.6em] ${allDone ? 'text-emerald-200' : 'text-white'}`}>
            {allDone ? 'Semua baris sudah di-mark. Cek list di bawah, lalu Apply.' : (nextLine?.text?.trim() ? `“${nextLine.text}”` : '(baris kosong)')}
          </div>
          {!allDone && nextIndex + 1 < totalLines && (
            <div className="text-xs text-white/35 mt-1 truncate">Berikutnya: {editorLines[nextIndex + 1]?.text || '—'}</div>
          )}
        </div>

        <div className="grid grid-cols-3 gap-2">
          {!hasAudio ? (
            <button
              onClick={onStartFromZero}
              className="col-span-3 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-black text-sm transition shadow-lg shadow-amber-500/20"
            >
              ⏮ Start from 0 — Reset &amp; Play
            </button>
          ) : (
            <>
              <button
                onClick={onMarkNext}
                disabled={allDone}
                className={`col-span-2 py-3 rounded-xl font-black text-sm tracking-wide transition ${allDone ? 'bg-white/10 text-white/30 cursor-not-allowed' : 'bg-emerald-500 hover:bg-emerald-400 text-black shadow-lg shadow-emerald-500/20 active:scale-[0.98]'}`}
              >
                ● TAP (Space)
              </button>
              <button onClick={onUndoLast} disabled={markedCount === 0} className="py-3 rounded-xl bg-white/10 hover:bg-white/15 disabled:opacity-30 text-xs font-bold border border-white/10">
                ↩ Undo
              </button>
            </>
          )}
        </div>

        <div className="grid grid-cols-4 gap-2">
          <button onClick={() => onOffsetAll(-0.5)} className="py-2 rounded-xl bg-white/5 border border-white/10 text-[11px] font-bold hover:bg-white/10">-0.5s semua</button>
          <button onClick={() => onOffsetAll(-0.1)} className="py-2 rounded-xl bg-white/5 border border-white/10 text-[11px] font-bold hover:bg-white/10">-0.1s</button>
          <button onClick={() => onOffsetAll(0.1)} className="py-2 rounded-xl bg-white/5 border border-white/10 text-[11px] font-bold hover:bg-white/10">+0.1s</button>
          <button onClick={() => onOffsetAll(0.5)} className="py-2 rounded-xl bg-white/5 border border-white/10 text-[11px] font-bold hover:bg-white/10">+0.5s</button>
        </div>

        <div className="flex gap-2">
          <button onClick={onClearTimes} className="flex-1 py-2 rounded-xl bg-white/5 border border-white/10 text-xs font-bold hover:bg-white/10">Reset</button>
          <button onClick={onStartFromZero} className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs font-bold hover:bg-white/10">⏮ From 0</button>
          <button onClick={onApplyEditor} disabled={markedCount === 0} className="flex-[1.4] py-2 rounded-xl bg-white text-black font-black text-xs disabled:opacity-30 hover:bg-white/90">Terapkan ke Player →</button>
        </div>
      </div>

      <div className="p-3 max-h-[320px] overflow-y-auto custom-scrollbar space-y-2">
        {editorLines.length === 0 && (
          <div className="text-center text-[11px] text-white/40 py-8">Belum ada baris. Paste di panel "Import Text" lalu Send to Editor.</div>
        )}
        {editorLines.map((line, i) => {
          const isNext = i === nextIndex
          const isDone = line.startTime !== null
          return (
            <div key={line.id} ref={isNext ? nextItemRef : null} className={`rounded-xl border p-2.5 flex gap-2.5 items-start transition-all ${isNext ? 'bg-emerald-500/10 border-emerald-500/30 shadow-[0_0_0_1px_rgba(16,185,129,0.2)]' : isDone ? 'bg-white/[0.05] border-white/10' : 'bg-white/[0.03] border-white/5'}`}>
              <div className={`w-7 h-7 rounded-lg grid place-items-center text-xs font-black shrink-0 ${isNext ? 'bg-emerald-500 text-black' : isDone ? 'bg-white text-black' : 'bg-white/10 text-white/50'}`}>{i + 1}</div>
              <div className="flex-1 min-w-0 space-y-1.5">
                <input value={line.text} onChange={e => onTextChange(i, e.target.value)} placeholder="(kosong — akan jadi jeda)" className="w-full bg-transparent outline-none text-[13px] leading-snug text-white placeholder:text-white/25" />
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className={`font-mono text-[11px] px-2 py-1 rounded-full border ${isDone ? 'bg-white text-black border-white' : 'bg-white/5 text-white/40 border-white/10'}`}>
                    {isDone ? formatTimeShort(line.startTime!) : '--:--'}
                  </span>
                  <button onClick={() => onMarkAt(i)} className={`px-2.5 py-1 rounded-full text-xs font-bold border ${isNext ? 'bg-emerald-500 text-black border-emerald-500' : 'bg-white/5 text-white/60 border-white/10 hover:bg-white/10'}`}>
                    {isNext ? '● Mark (Space)' : 'Re-set'}
                  </button>
                  {isDone && (
                    <>
                      <button onClick={() => onAdjustTime(i, -0.1)} className="px-2 py-1 rounded-full bg-white/5 border border-white/10 text-[11px] font-bold hover:bg-white/10">-0.1</button>
                      <button onClick={() => onAdjustTime(i, 0.1)} className="px-2 py-1 rounded-full bg-white/5 border border-white/10 text-[11px] font-bold hover:bg-white/10">+0.1</button>
                    </>
                  )}
                </div>
              </div>
              <button onClick={() => onDeleteLine(i)} className="shrink-0 w-7 h-7 rounded-full bg-white/5 border border-white/10 grid place-items-center text-white/40 hover:text-red-300 hover:border-red-500/30 text-xs">✕</button>
            </div>
          )
        })}
        <button onClick={onAddLine} className="w-full py-2.5 rounded-xl border border-dashed border-white/15 text-xs font-bold text-white/50 hover:text-white/80 hover:bg-white/5">+ Tambah baris</button>
      </div>
    </section>
  )
}
