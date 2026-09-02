import { useState } from 'react'
import type { LayoutProps } from '../types'

export function FocusLayout({ header, previewArea, audioPanel, renderSettingsPanel, textPanel, exportPanel, editorList }: LayoutProps) {
  const [showPanel, setShowPanel] = useState(false)
  return (
    <div className="min-h-screen flex flex-col bg-[#0F172A] text-[#F8FAFC] relative">
      <div className="sticky top-0 z-30 backdrop-blur-xl bg-[#0F172A]/85 border-b border-[#334155]/60">{header}</div>
      <main className="flex-1 w-full max-w-[1100px] mx-auto p-4 lg:p-6 space-y-6">
        <div className="bg-[#1B2336] rounded-[24px] border border-[#334155] p-3 lg:p-6 shadow-[0_8px_32px_rgba(0,0,0,0.35)]">
          <div className="flex items-center justify-between mb-3 px-1">
            <span className="text-[11px] tracking-widest text-[#94A3B8] font-bold">PREVIEW — WYSIWYG</span>
            <span className="text-[10px] text-[#64748B]">preview = export video</span>
          </div>
          <div className="min-h-[340px] lg:min-h-[540px] flex items-center justify-center bg-black rounded-2xl overflow-hidden border border-white/5">
            {previewArea}
          </div>
        </div>
        {editorList}
      </main>
      <button onClick={() => setShowPanel(!showPanel)} className="fixed bottom-6 right-6 z-40 px-5 py-3 bg-[#22C55E] hover:bg-[#16A34A] text-[#0F172A] font-black rounded-full shadow-xl transition cursor-pointer text-sm">
        {showPanel ? '✕ Close' : '⚙ Panels'}
      </button>
      {showPanel && (
        <>
          <div className="fixed inset-0 bg-black/60 z-40 backdrop-blur-sm" onClick={() => setShowPanel(false)} />
          <aside className="fixed right-0 top-0 bottom-0 w-[400px] max-w-[90vw] bg-[#1B2336] border-l border-[#334155] shadow-2xl z-50 overflow-y-auto p-4 space-y-4 custom-scrollbar">
            <div className="flex items-center justify-between sticky top-0 bg-[#1B2336] py-2 -mx-4 px-4 border-b border-[#334155] mb-2">
              <span className="font-bold text-sm text-white">Panels</span>
              <button onClick={() => setShowPanel(false)} className="px-3 py-1.5 bg-white/10 hover:bg-white/15 rounded-lg text-xs font-bold text-white cursor-pointer">Close</button>
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
