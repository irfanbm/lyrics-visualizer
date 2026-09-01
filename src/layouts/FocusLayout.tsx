import { useState } from 'react'
import type { LayoutProps } from '../types'

export function FocusLayout({ header, previewArea, audioPanel, renderSettingsPanel, textPanel, exportPanel, editorList }: LayoutProps) {
  const [showPanel, setShowPanel] = useState(false)

  return (
    <div className="min-h-screen flex flex-col relative">
      {header}

      {/* Full preview area */}
      <main className="flex-1 w-full flex items-center justify-center p-4 md:p-6">
        {previewArea}
      </main>

      {/* Editor list inline below preview */}
      {editorList && <div className="px-4 pb-4">{editorList}</div>}

      {/* Floating panel toggle */}
      <button
        onClick={() => setShowPanel(!showPanel)}
        className="fixed bottom-6 right-6 z-50 px-4 py-3 bg-emerald-500 hover:bg-emerald-400 text-black font-bold rounded-full shadow-xl transition text-sm"
      >
        {showPanel ? '✕ Close' : '⚙️ Panels'}
      </button>

      {/* Slide-over drawer with panels */}
      {showPanel && (
        <>
          <div className="fixed inset-0 bg-black/70 z-40" onClick={() => setShowPanel(false)} />
          <aside className="fixed right-0 top-0 bottom-0 w-[420px] max-w-[90vw] bg-zinc-900/95 backdrop-blur border-l border-white/10 shadow-2xl z-50 overflow-y-auto custom-scrollbar p-4 space-y-4">
            <div className="flex items-center justify-between sticky top-0 bg-zinc-900/95 backdrop-blur py-2 -mx-4 px-4 -mt-2 border-b border-white/10 mb-2">
              <h3 className="font-bold text-sm">Settings & Tools</h3>
              <button onClick={() => setShowPanel(false)} className="px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-xs font-bold">Close</button>
            </div>
            {audioPanel}
            {renderSettingsPanel}
            {textPanel}
            {exportPanel}
          </aside>
        </>
      )}
    </div>
  )
}
