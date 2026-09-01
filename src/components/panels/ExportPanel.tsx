interface Props {
  exportFmt: string
  setExportFmt: (fmt: string) => void
  content: string
  formatTimeTotal: number // for display "N lines / M kb"
  downloadContent: () => void
  startVideoExport: () => void
  isExporting: boolean
  exportProgress: number
}

const FORMATS = [
  { id: 'lrc', label: 'LRC', ext: '.lrc', desc: 'Spotify/Apple sync' },
  { id: 'enhanced', label: 'Enhanced LRC', ext: '.lrc', desc: 'Word-by-word karaoke' },
  { id: 'srt', label: 'SRT', ext: '.srt', desc: 'CapCut/Premiere' },
  { id: 'vtt', label: 'VTT', ext: '.vtt', desc: 'Web video' },
  { id: 'json', label: 'JSON', ext: '.json', desc: 'Data format' },
  { id: 'ass', label: 'ASS', ext: '.ass', desc: 'FFmpeg burn-in' }
]

export function ExportPanel({ exportFmt, setExportFmt, content, formatTimeTotal, downloadContent, startVideoExport, isExporting, exportProgress }: Props) {
  const ext = FORMATS.find(f => f.id === exportFmt)?.ext || '.lrc'

  return (
    <section className="bg-black/40 border border-white/10 rounded-3xl overflow-hidden shrink-0">
      <div className="p-4 border-b border-white/10">
        <h3 className="font-bold text-sm">Export Lyrics</h3>
        <p className="text-[11px] text-white/50 mt-0.5">Preview & Download or Render Video</p>
      </div>

      {/* Format selector */}
      <div className="p-4 space-y-2 border-b border-white/10">
        <label className="text-[11px] text-white/60 block mb-1">Format</label>
        <div className="grid grid-cols-3 gap-1.5">
          {FORMATS.map(({ id, label, desc }) => (
            <button key={id} onClick={() => setExportFmt(id)} className={`px-2 py-2 rounded-lg text-[11px] font-bold transition ${exportFmt === id ? 'bg-emerald-500 text-black border-emerald-500' : 'bg-white/5 hover:bg-white/15 border border-white/10 text-white/60'}`} title={desc}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Preview */}
      <div className="p-4 space-y-2 border-b border-white/10">
        <label className="text-[11px] text-white/60 block">Preview</label>
        <div className="bg-black/50 border border-white/10 rounded-xl p-3 max-h-[180px] overflow-y-auto custom-scrollbar">
          <code className="block text-[10px] leading-relaxed text-white/70 whitespace-pre-wrap">{content || 'No lyrics loaded'}</code>
        </div>
      </div>

      {/* Actions */}
      <div className="p-4 space-y-2">
        {!isExporting ? (
          <>
            <button onClick={downloadContent} className="w-full py-2.5 bg-white hover:bg-gray-100 text-black font-bold rounded-xl text-xs transition flex items-center justify-center gap-2">
              ⬇️ Download {ext}
            </button>
            <button onClick={startVideoExport} className="w-full py-2.5 bg-gradient-to-r from-violet-500 to-fuchsia-500 hover:opacity-90 text-white font-bold rounded-xl text-xs transition flex items-center justify-center gap-2">
              🎥 Render Video WebM
            </button>
          </>
        ) : (
          <div className="space-y-2">
            <div className="text-[11px] font-bold text-emerald-300">🎬 Rendering... {Math.round(exportProgress)}%</div>
            <div className="h-2 bg-white/10 rounded-full overflow-hidden">
              <div className="h-full bg-emerald-500 transition-all" style={{ width: `${exportProgress}%` }} />
            </div>
          </div>
        )}
      </div>

      {/* Helper */}
      <div className="p-3 bg-amber-500/5 border-t border-white/10">
        <div className="text-[10px] text-amber-200/80 leading-relaxed">
          💡 <b>LRC:</b> Spotify sync<br/>
          💡 <b>SRT/VTT:</b> Edit di CapCut<br/>
          💡 <b>ASS:</b> Burn-in ffmpeg<br/>
          💡 <b>Video:</b> MP4-like quality (WebM/VP9)
        </div>
      </div>
    </section>
  )
}
