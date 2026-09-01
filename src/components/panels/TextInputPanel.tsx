interface Props {
  pasteTxt: string
  setPasteTxt: (val: string) => void
  onPasteToEditor: () => void
}

export function TextInputPanel({ pasteTxt, setPasteTxt, onPasteToEditor }: Props) {
  return (
    <section className="bg-black/40 border border-white/10 rounded-3xl overflow-hidden shrink-0">
      <div className="p-4 border-b border-white/10">
        <h3 className="font-bold text-sm">Import Text</h3>
        <p className="text-[11px] text-white/50 mt-0.5">Paste plain lyrics • One line = one bar</p>
      </div>
      <div className="p-4 space-y-3">
        <textarea
          value={pasteTxt}
          onChange={(e) => setPasteTxt(e.target.value)}
          placeholder={'Di bawah langit malam yang sunyi\nAku menatap bintang bercahaya\n...'}
          rows={6}
          className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs outline-none focus:border-emerald-500 text-white resize-none custom-scrollbar"
        />
        <button
          onClick={onPasteToEditor}
          className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-400 text-black font-bold rounded-xl text-xs transition"
        >
          📝 Send to Editor
        </button>
        <div className="text-[10px] text-white/40 leading-relaxed">
          💡 Untuk word-by-word karaoke, import file LRC enhanced:
          <code className="block bg-white/5 rounded px-2 py-1 mt-1 font-mono text-[10px]">[00:12.34] &lt;00:12.50&gt;kata &lt;00:13.10&gt;kata</code>
        </div>
      </div>
    </section>
  )
}
