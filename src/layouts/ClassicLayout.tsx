import type { LayoutProps } from '../types'
import React from 'react'

export function ClassicLayout({ header, previewArea, audioPanel, renderSettingsPanel, textPanel, exportPanel, editorList }: LayoutProps) {
  return (
    <div className="min-h-screen flex flex-col">
      {header}
      <div className="flex-1 w-full mx-auto flex flex-col lg:flex-row gap-4 p-4 md:p-6">
        {/* Left sidebar: panels */}
        <aside className="lg:w-[380px] shrink-0 flex flex-col gap-4 lg:sticky lg:top-[70px] lg:h-[calc(100vh-86px)] overflow-y-auto custom-scrollbar">
          {audioPanel}
          {renderSettingsPanel}
          {textPanel}
          {exportPanel}
        </aside>
        {/* Main: preview */}
        <main className="flex-1 min-w-0 flex flex-col items-center justify-center">
          {previewArea}
        </main>
      </div>
      {/* Editor mode: list below preview */}
      {editorList && (
        <div className="px-4 pb-6">{editorList}</div>
      )}
    </div>
  )
}
