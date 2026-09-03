interface Props {
  exportFmt: string
  setExportFmt: (fmt: string) => void
  content: string
  formatTimeTotal: number
  downloadContent: () => void
  startVideoExport: () => void
  isExporting: boolean
  exportProgress: number
  videoUrl?: string | null
  onDownloadVideo?: () => void
}

const FORMATS = [
  { id: 'lrc', label: 'LRC', ext: '.lrc', desc: 'Spotify/Apple sync' },
  { id: 'enhanced', label: 'Enhanced LRC', ext: '.lrc', desc: 'Word-by-word karaoke' },
  { id: 'srt', label: 'SRT', ext: '.srt', desc: 'CapCut/Premiere' },
  { id: 'vtt', label: 'VTT', ext: '.vtt', desc: 'Web video' },
  { id: 'json', label: 'JSON', ext: '.json', desc: 'Data format' },
  { id: 'ass', label: 'ASS', ext: '.ass', desc: 'FFmpeg burn-in' }
]

export function ExportPanel({ exportFmt, setExportFmt, content, downloadContent, startVideoExport, isExporting, exportProgress, videoUrl, onDownloadVideo }: Props) {
  const ext = FORMATS.find(f => f.id === exportFmt)?.ext || '.lrc'

  return (
    <section className="glass rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.35)] overflow-hidden shrink-0">
      <div className="p-4 border-b border-white/10">
        <h3 className="font-bold text-sm font-display">Export</h3>
        <p className="text-[11px] text-white/50 mt-0.5">Download LRC/SRT or render video</p>
      </div>

      <div className="p-2.5 space-y-2 border-b border-white/10">
        <label className="text-[11px] text-white/60 block mb-1 font-medium">Format</label>
        <div className="grid grid-cols-3 gap-1.5">
          {FORMATS.map(({ id, label, desc }) => (
            <button key={id} onClick={() => setExportFmt(id)} aria-pressed={exportFmt===id} title={desc} className={`min-h-[36px] px-2 py-2 rounded-lg text-[11px] font-bold transition border ${exportFmt === id ? 'bg-[var(--color-accent)] text-black neon-glow border-transparent' : 'glass hover:bg-white/10 border-white/10 text-white/60'}`}>
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="p-2.5 space-y-2 border-b border-white/10">
        <label className="text-[11px] text-white/60 block font-medium">Preview</label>
        <div className="bg-black/50 border border-white/10 rounded-xl p-3 max-h-[180px] overflow-y-auto custom-scrollbar">
          <code className="block text-[10px] leading-relaxed text-white/70 whitespace-pre-wrap font-mono">{content || 'No lyrics loaded'}</code>
        </div>
      </div>

      <div className="p-2.5 space-y-2">
        {!isExporting ? (
          <>
            <button onClick={downloadContent} className="w-full min-h-[36px] py-2.5 bg-white hover:bg-gray-100 text-black font-bold rounded-xl text-xs transition flex items-center justify-center gap-1.5">
              Download {ext}
            </button>
            <button onClick={startVideoExport} className="w-full min-h-[36px] py-2.5 bg-[var(--color-accent)] hover:bg-[#16A34A] neon-glow text-black font-bold rounded-xl text-xs transition flex items-center justify-center gap-1.5">
              Render Video WebM
            </button>
            {videoUrl && (
              <div className="space-y-2 pt-2 border-t border-white/10">
                <div className="text-[11px] font-bold text-emerald-300">Video siap!</div>
                <video src={videoUrl} controls className="w-full rounded-xl border border-white/10 bg-black" />
                <button onClick={onDownloadVideo} className="w-full min-h-[36px] py-2.5 bg-[var(--color-accent)] hover:bg-[#16A34A] neon-glow text-black font-bold rounded-xl text-xs transition">
                  Download Video
                </button>
                <a href={videoUrl} target="_blank" rel="noopener noreferrer" className="block text-center text-[11px] text-white/50 hover:text-white underline">Buka di tab baru</a>
              </div>
            )}
          </>
        ) : (
          <div className="space-y-2">
            <div className="text-[11px] font-bold text-emerald-300 font-mono">Rendering... {Math.round(exportProgress)}%</div>
            <div className="h-2 bg-white/10 rounded-full overflow-hidden">
              <div className="h-full bg-[var(--color-accent)] transition-all" style={{ width: `${exportProgress}%` }} />
            </div>
          </div>
        )}
      </div>

      <div className="p-3 bg-white/[0.03] border-t border-white/10">
        <div className="text-[10px] text-white/45 leading-relaxed font-mono">
          LRC: Spotify sync · SRT/VTT: CapCut · ASS: ffmpeg burn-in · Video: WebM/VP9
        </div>
      </div>
    </section>
  )
}
