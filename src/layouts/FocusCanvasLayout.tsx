import { useState } from 'react'
import type { LayoutProps } from '../types'

type TabId = 'import' | 'mark' | 'style' | 'visualizer'

export function FocusCanvasLayout({ header, previewArea, audioPanel, renderSettingsPanel, textPanel, exportPanel, editorList, mode, visualizerPanel }: LayoutProps & { visualizerPanel?: React.ReactNode }) {
  const [tab, setTab] = useState<TabId>(mode === 'editor' ? 'mark' : 'import')

  // sync tab when mode changes externally
  // (editor mode should jump to Mark)
  if (mode === 'editor' && tab === 'import') {
    // let effect handle — avoid render loop by not auto-switching aggressively
  }

  const tabs: { id: TabId; label: string; desc: string }[] = [
    { id: 'import', label: 'Import', desc: 'Audio & Text' },
    { id: 'mark', label: 'Mark', desc: 'Tap timing' },
    { id: 'style', label: 'Style', desc: 'Render & Export' },
    { id: 'visualizer', label: 'Visualizer', desc: 'Waveform' },
  ]

  return (
    <div className="min-h-screen flex flex-col overflow-x-clip">
      <div className="sticky top-0 z-30 glass-strong border-b border-white/10">
        {header}
      </div>

      <div className="flex-1 w-full max-w-[1520px] mx-auto grid grid-cols-1 lg:grid-cols-[380px_minmax(0,1fr)] gap-3 lg:gap-4 p-2.5 lg:p-4 items-start">
        {/* Left rail — single tabbed */}
        <aside className="order-2 lg:order-1 lg:sticky lg:top-[64px] lg:max-h-[calc(100vh-76px)] flex flex-col glass rounded-2xl overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.35)] min-h-[380px] lg:min-h-0">
          {/* Tab bar */}
          <div className="flex items-center gap-1 p-1.5 border-b border-white/10 bg-white/[0.04]">
            {tabs.map(t => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                aria-pressed={tab === t.id}
                title={t.desc}
                className={`group relative flex-1 min-h-[36px] rounded-full px-3 py-2 text-[11px] font-bold transition border flex items-center justify-center ${tab === t.id ? 'bg-[var(--color-accent)] text-black border-transparent neon-glow' : 'glass text-white/60 hover:text-white border-white/10'}`}
              >
                <span>{t.label}</span>
                {/* sub desc — hover only */}
                <span className="pointer-events-none absolute left-1/2 -translate-x-1/2 top-[calc(100%+6px)] whitespace-nowrap rounded-full bg-black/85 border border-white/10 px-2 py-1 text-[10px] font-normal tracking-wide text-white/70 opacity-0 translate-y-1 group-hover:opacity-100 group-hover:translate-y-0 transition duration-150 z-10 backdrop-blur">
                  {t.desc}
                </span>
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div className="flex-1 overflow-y-auto custom-scrollbar p-2.5 space-y-2.5 min-h-0">
            {tab === 'import' && (
              <>
                {audioPanel}
                {textPanel}
                <p className="text-[11px] text-white/35 text-center leading-relaxed px-2">
                  1. Load audio → 2. Paste lirik → <span className="text-white/60">Switch ke Mark</span>
                </p>
              </>
            )}
            {tab === 'mark' && (
              <div className="space-y-2.5">
                {editorList}
              </div>
            )}
            {tab === 'style' && (
              <>
                {renderSettingsPanel}
                {exportPanel}
              </>
            )}
            {tab === 'visualizer' && (
              <div className="space-y-2.5">
                {visualizerPanel}
                <p className="text-[10px] text-white/30 text-center leading-relaxed">Waveform untuk cek timing, bukan untuk export. Canvas utama tetap WYSIWYG lyric.</p>
              </div>
            )}
          </div>

          {/* Footer hint */}
          <div className="px-2.5 py-2 border-t border-white/10 bg-white/[0.03] text-[10px] text-white/30 font-mono text-center">
            {tab === 'import' && 'Tab Import → Mark untuk TAP timing'}
            {tab === 'mark' && 'Space = TAP · ←→ scrub · Alt+←→ fine'}
            {tab === 'style' && 'Style langsung WYSIWYG di canvas'}
          </div>
        </aside>

        {/* Right canvas — hero */}
        <main className="order-1 lg:order-2 min-w-0 space-y-3 min-h-0">
          <div className="glass rounded-2xl p-2.5 lg:p-3.5 shadow-[0_8px_40px_rgba(0,0,0,0.45),0_0_30px_rgba(168,85,247,0.12)]">
            <div className="flex items-center justify-between mb-2 px-1 gap-2">
              <span className="text-[10px] tracking-[0.18em] text-white/60 font-bold uppercase font-mono">Canvas · Neon Glass</span>
              <span className="text-[10px] text-white/30 font-mono hidden sm:block">preview = export</span>
            </div>
            <div className="min-h-[280px] lg:min-h-[520px] flex items-center justify-center bg-black/70 rounded-2xl overflow-hidden border border-white/10 shadow-inner">
              {previewArea}
            </div>
          </div>

          {/* Mobile: show hint to switch tab */}
          <div className="lg:hidden glass rounded-2xl p-3 text-center text-xs text-white/50">
            Gunakan tab <b className="text-white">Import → Mark → Style</b> di atas untuk workflow. Canvas selalu sinkron.
          </div>
        </main>
      </div>
    </div>
  )
}
