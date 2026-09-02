import type { LayoutProps } from '../types'

export function RightSidebarLayout({ header, previewArea, audioPanel, renderSettingsPanel, textPanel, exportPanel, editorList }: LayoutProps) {
  return (
    <div className="min-h-screen flex flex-col bg-[#0F172A] text-[#F8FAFC]">
      <div className="sticky top-0 z-30 backdrop-blur-xl bg-[#0F172A]/85 border-b border-[#334155]/60">{header}</div>
      <div className="flex-1 w-full max-w-[1600px] mx-auto grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_380px] gap-6 p-4 lg:p-6 items-start">
        <main className="min-w-0 space-y-6 order-1">
          <div className="bg-[#1B2336] rounded-[24px] border border-[#334155] p-3 lg:p-4 shadow-[0_8px_32px_rgba(0,0,0,0.35)]">
            <div className="flex items-center justify-between mb-3 px-1">
              <span className="text-[11px] tracking-widest text-[#94A3B8] font-bold">PREVIEW — WYSIWYG</span>
              <span className="text-[10px] text-[#64748B]">preview = export video</span>
            </div>
            <div className="min-h-[240px] lg:min-h-[460px] flex items-center justify-center bg-black rounded-2xl overflow-hidden border border-white/5">
              {previewArea}
            </div>
          </div>
          {editorList}
        </main>
        <aside className="space-y-4 lg:sticky lg:top-[72px] lg:max-h-[calc(100vh-84px)] lg:overflow-y-auto lg:pr-2 custom-scrollbar order-2">
          {audioPanel}
          {renderSettingsPanel}
          {textPanel}
          {exportPanel}
        </aside>
      </div>
    </div>
  )
}
