import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type * as React from 'react'
import { parseLRC } from './utils/lrcParser'
import type { LyricLine } from './utils/lrcParser'
import { getDimensions } from './types'
import type { EditorLine } from './types'
import { CanvasPreview } from './components/CanvasPreview'
import { AudioPanel, formatTimeShort } from './components/panels/AudioPanel'
import { RenderSettingsPanel } from './components/panels/RenderSettingsPanel'
import { TextInputPanel } from './components/panels/TextInputPanel'
import { ExportPanel } from './components/panels/ExportPanel'
import { EditorListPanel } from './components/panels/EditorListPanel'
import { AVAILABLE_LAYOUTS, getLayoutById } from './layouts'
import { buildExport, EXPORT_FORMATS } from './utils/exportFormats'
import { ensureFontLoaded } from './utils/fonts'
import { renderLyricFrame } from './render/lyricRenderer'

export default function App() {
  const audioRef = useRef<HTMLAudioElement | null>(null)

  const [lines, setLines] = useState<LyricLine[]>(() => [])
  const [editorLines, setEditorLines] = useState<EditorLine[]>(() => [])

  const [mode, setMode] = useState<'player' | 'editor'>('player')
  const [audioSrc, setAudioSrc] = useState("")
  const [audioName, setAudioName] = useState("")
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [offset, setOffset] = useState(0)
  const [coverUrl] = useState("")
  const [pasteTxt, setPasteTxt] = useState("")

  const [config, setConfig] = useState(() => {
    const saved = localStorage.getItem('lyric-config')
    if (saved) try { return JSON.parse(saved); } catch {}
    return {
      resolution: '1080p', customWidth: 1920, customHeight: 1080,
      showDuration: true, showProgressBar: true, showLineCounter: false,
      showTitle: false, karaokeMode: true, lyricPosition: 'center',
      bgColor: '#0a0a0a', fontFamily: 'Poppins',
      lineGap: 1.85, fadeEdges: true, visibleLines: 5,
      inactiveOpacity: 0.28, hideOnGap: false, gapOpacity: 0.35,
    } as any
  })

  const [selectedLayoutId, setSelectedLayoutId] = useState(() => localStorage.getItem('lyric-layout-id') || 'classic')

  const [exportFmt, setExportFmt] = useState('lrc')
  const [isExporting, setIsExporting] = useState(false)
  const [exportProgress, setExportProgress] = useState(0)

  const modeRef = useRef(mode)
  const currentTimeRef = useRef(currentTime)
  const offsetRef = useRef(offset)
  useEffect(() => { modeRef.current = mode }, [mode])
  useEffect(() => { currentTimeRef.current = currentTime }, [currentTime])
  useEffect(() => { offsetRef.current = offset }, [offset])

  const totalLines = lines.length
  const markedCount = editorLines.filter(l => l.startTime !== null).length
  const nextIndex = editorLines.findIndex(l => l.startTime === null)

  const displayLines = useMemo(() => {
    if (offset === 0) return lines
    return lines.map(l => ({
      ...l,
      startTime: l.startTime + offset,
      endTime: l.endTime + offset,
      words: l.words.map(w => ({ ...w, startTime: w.startTime + offset, endTime: w.endTime + offset }))
    }))
  }, [lines, offset])

  const activeIndex = useMemo(() => {
    if (displayLines.length === 0) return -1
    let idx = -1
    for (let i = 0; i < displayLines.length; i++) {
      if (displayLines[i].startTime <= currentTime) idx = i
      else break
    }
    if (idx >= 0 && idx < displayLines.length - 1) {
      const gap = displayLines[idx + 1].startTime - displayLines[idx].endTime
      if (gap > 1.2 && currentTime > displayLines[idx].endTime + 0.15 && currentTime < displayLines[idx + 1].startTime - 0.15) return -1
    }
    return idx
  }, [currentTime, displayLines])

  useEffect(() => { localStorage.setItem('lyric-config', JSON.stringify(config)) }, [config])
  useEffect(() => { localStorage.setItem('lyric-layout-id', selectedLayoutId) }, [selectedLayoutId])

  useEffect(() => {
    let raf = 0
    const tick = () => {
      if (audioRef.current && !audioRef.current.paused) {
        setCurrentTime(audioRef.current.currentTime)
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [])

  const handlePlayToggle = useCallback(() => {
    if (!audioRef.current) return
    if (audioRef.current.paused) { audioRef.current.play().then(() => setIsPlaying(true)).catch(() => {}) }
    else { audioRef.current.pause(); setIsPlaying(false) }
  }, [])

  const handleSeek = useCallback((val: number) => {
    if (audioRef.current) { audioRef.current.currentTime = val; setCurrentTime(val) }
  }, [])

  const onMarkAt = useCallback((i: number) => {
    const t = Math.max(0, currentTimeRef.current - offsetRef.current)
    setEditorLines(prev => prev.map((l, idx) => idx === i ? { ...l, startTime: t } : l))
  }, [])

  const handleMark = useCallback(() => {
    const idx = editorLines.findIndex(l => l.startTime === null)
    if (idx >= 0) onMarkAt(idx)
  }, [editorLines, onMarkAt])

  const handleStartFromZero = useCallback(() => {
    if (audioRef.current) { audioRef.current.currentTime = 0; setCurrentTime(0) }
    setEditorLines(prev => prev.map(l => ({ ...l, startTime: null })))
    setOffset(0)
  }, [])

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (isExporting) return
      const tag = (e.target as HTMLElement).tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA') return
      if (e.code === 'Space') {
        e.preventDefault()
        if (modeRef.current === 'editor') handleMark()
        else handlePlayToggle()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [handleMark, handlePlayToggle, isExporting])

  const handleClearTimes = () => setEditorLines(prev => prev.map(l => ({ ...l, startTime: null })))

  useEffect(() => {
    if (mode !== 'editor') return
    const marked = editorLines.filter(l => l.startTime !== null && l.text.trim()).sort((a, b) => (a.startTime || 0) - (b.startTime || 0))
    if (marked.length === 0) { setLines([]); return }
    const newLines: LyricLine[] = marked.map((l, i) => {
      const s = l.startTime!
      const end = marked[i + 1]?.startTime ?? s + 4
      const ws = l.text.trim().split(/\s+/).filter(Boolean)
      const per = ws.length ? (end - s) / ws.length : (end - s)
      return { startTime: s, endTime: end, text: l.text.trim(), words: ws.map((w, wi) => ({ text: w, startTime: s + wi * per, endTime: s + (wi + 1) * per })) }
    })
    setLines(newLines)
  }, [editorLines, mode])

  const handleApplyEditor = () => {
    const sorted = editorLines.filter(l => l.startTime !== null && l.text.trim()).sort((a, b) => (a.startTime || 0) - (b.startTime || 0))
    const newLines: LyricLine[] = sorted.map((l, i) => {
      const s = l.startTime!
      const end = sorted[i + 1]?.startTime ?? s + 4
      const per = l.text.split(/\s+/).filter(Boolean).length ? (end - s) / l.text.split(/\s+/).filter(Boolean).length : 4
      return {
        startTime: s,
        endTime: end,
        text: l.text.trim(),
        words: l.text.trim().split(/\s+/).filter(Boolean).map((w, wi) => ({ text: w, startTime: s + wi * per, endTime: s + (wi + 1) * per }))
      }
    })
    setLines(newLines)
    setMode('player')
  }

  const onTextChange = (i: number, v: string) => setEditorLines(prev => prev.map((l, idx) => idx === i ? { ...l, text: v } : l))
  const onDeleteLine = (i: number) => setEditorLines(prev => prev.filter((_, idx) => idx !== i))
  const onAddLine = () => setEditorLines(prev => [...prev, { id: Date.now(), text: '', startTime: null }])
  const onAdjustTime = (i: number, delta: number) => setEditorLines(prev => prev.map((l, idx) => idx === i ? { ...l, startTime: (l.startTime || 0) + delta } : l))
  const onOffsetAll = (delta: number) => setOffset(o => Math.round((o + delta) * 100) / 100)
  const onUndoLast = () => setEditorLines(prev => {
    let last = -1
    for (let i = prev.length - 1; i >= 0; i--) if (prev[i].startTime !== null) { last = i; break }
    if (last < 0) return prev
    return prev.map((l, idx) => idx === last ? { ...l, startTime: null } : l)
  })

  const handleImportAudio = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const url = URL.createObjectURL(file)
      setAudioSrc(url)
      setAudioName(file.name.replace(/\.[^/.]+$/, ""))
    }
  }

  const handleImportLrc = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = () => {
        try {
          const parsed = parseLRC(String(reader.result))
          setLines(parsed)
          const edited: EditorLine[] = parsed.map((l, i) => ({ id: i, text: l.text, startTime: l.startTime }))
          setEditorLines(edited)
          setPasteTxt(parsed.map(l => l.text).join('\n'))
          setMode('editor')
        } catch {}
      }
      reader.readAsText(file)
    }
  }

  const handleImportTxt = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target as HTMLInputElement
    const file = input.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = () => {
        const txt = String(reader.result || "")
        const raw = txt.split(/\r?\n/).map(t => t.trim()).filter(t => t.length > 0)
        setPasteTxt(raw.join('\n'))
        const ed = raw.map((t, i) => ({ id: Date.now() + i, text: t, startTime: null as number | null }))
        setEditorLines(ed)
        setLines([])
        setMode('editor')
        input.value = ''
      }
      reader.readAsText(file)
    }
  }

  const handlePasteToEditor = () => {
    const raw = pasteTxt.split(/\r?\n/).map(t => t.trim()).filter(t => t.length > 0)
    if (raw.length === 0) return
    const ed = raw.map((t, i) => ({ id: Date.now() + i, text: t, startTime: null as number | null }))
    setEditorLines(ed)
    setLines([])
    setMode('editor')
  }

  const demoClick = () => {}

  const exportContent = useMemo(() => {
    const fmt = exportFmt as keyof typeof EXPORT_FORMATS
    return buildExport(fmt, displayLines)
  }, [displayLines, exportFmt])

  const downloadExport = () => {
    const ext = EXPORT_FORMATS[exportFmt as keyof typeof EXPORT_FORMATS].ext
    const blob = new Blob([exportContent], { type: 'text/plain' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `${audioName || 'lyrics'}${ext}`
    a.click()
  }

  const handleExportVideo = async () => {
    if (!audioRef.current || !audioSrc) { alert('Load audio first'); return }

    setIsExporting(true)
    setExportProgress(0)

    const dimsW = config.resolution === 'custom' ? config.customWidth || 1920 : config.resolution === '720p' ? 1280 : config.resolution === 'vertical' ? 1080 : 1920
    const dimsH = config.resolution === 'custom' ? config.customHeight || 1080 : config.resolution === '720p' ? 720 : config.resolution === 'vertical' ? 1920 : 1080

    const canvas = document.createElement('canvas')
    canvas.width = dimsW
    canvas.height = dimsH
    const ctx = canvas.getContext('2d')
    if (!ctx) { setIsExporting(false); return }

    await ensureFontLoaded(config.fontFamily)

    const stream = canvas.captureStream(30)
    let audioTracks: MediaStreamTrack[] = []
    try {
      const capture = (audioRef.current as any).captureStream || (audioRef.current as any).mozCaptureStream
      if (capture) audioTracks = capture.call(audioRef.current).getAudioTracks()()
    } catch {}

    const combined = new MediaStream([...stream.getVideoTracks(), ...audioTracks])
    const mime = ['video/webm;codecs=vp9,opus','video/webm;codecs=vp8,opus','video/webm'].find(t => MediaRecorder.isTypeSupported(t)) || 'video/webm'
    const recorder = new MediaRecorder(combined, { mimeType: mime, videoBitsPerSecond: 8_000_000 })
    const chunks: Blob[] = []
    recorder.ondataavailable = e => { if (e.data.size) chunks.push(e.data) }
    const done = new Promise<void>(res => { recorder.onstop = () => res })

    audioRef.current.currentTime = 0
    await audioRef.current.play()
    recorder.start()

    const finalDur = isFinite(duration) && duration > 0 ? duration : (audioRef.current.duration || 1)

    const renderLoop = () => {
      if (!audioRef.current!.ended && !audioRef.current!.paused) {
        const time = audioRef.current!.currentTime
        setExportProgress(finalDur ? (time / finalDur) * 100 : 0)

        renderLyricFrame(ctx, config, {
          lines: displayLines,
          time: time,
          duration: finalDur,
          title: ''
        })
        requestAnimationFrame(renderLoop)
      }
    }
    requestAnimationFrame(renderLoop)

    await done

    audioRef.current.pause()
    const blob = new Blob(chunks, { type: 'video/webm' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `${audioName||'lyric'}-${dimsW}x${dimsH}.webm`
    a.click()
    setIsExporting(false)
    setExportProgress(0)
  }

  const header = (
    <header className="p-4 border-b border-white/10 flex items-center justify-between">
      <h1 className="text-lg font-bold">🎵 Lyric Visualizer</h1>
      <div className="flex items-center gap-3">
        <label className="text-[11px] text-white/60 hidden sm:block">UI Layout:</label>
        <select
          value={selectedLayoutId}
          onChange={(e) => setSelectedLayoutId(e.target.value)}
          className="bg-white/10 border border-white/10 rounded-lg px-3 py-1.5 text-xs outline-none focus:border-emerald-500 text-white"
        >
          {AVAILABLE_LAYOUTS.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
        </select>
        <button
          onClick={() => setMode(m => m === 'player' ? 'editor' : 'player')}
          className={`px-3 py-2 rounded-lg text-xs font-bold transition ${mode === 'editor' ? 'bg-amber-500 text-black' : 'bg-white/10 text-white/70 hover:bg-white/15 border border-white/10'}`}
        >
          {mode === 'player' ? '📝 Editor Mode' : '▶️ Player Mode'}
        </button>
      </div>
    </header>
  )

  const previewArea = (
    <div className="w-full h-full min-h-0 flex items-center justify-center">
      <CanvasPreview config={config} lines={displayLines} audioRef={audioRef} />
    </div>
  )

  const audioPanel = <AudioPanel
    audioRef={audioRef} audioName={audioName} isPlaying={isPlaying} currentTime={currentTime} duration={duration}
    isExporting={isExporting} exportProgress={exportProgress} mode={mode} nextIndex={nextIndex}
    totalLines={totalLines} markedCount={markedCount}
    onPlayToggle={handlePlayToggle} onSeek={handleSeek} onMark={handleMark} onClearTimes={handleClearTimes}
    onImportAudio={handleImportAudio} onImportLrc={handleImportLrc} onImportTxt={handleImportTxt} onDemo={demoClick}
    onStartFromZero={handleStartFromZero}
  />

  const renderSettingsPanel = (
    <RenderSettingsPanel
      config={config}
      onChange={(patch) => setConfig({ ...config, ...patch })}
    />
  )

  const textPanel = (
    <TextInputPanel
      pasteTxt={pasteTxt}
      setPasteTxt={setPasteTxt}
      onPasteToEditor={handlePasteToEditor}
    />
  )

  const exportPanel = (
    <ExportPanel
      exportFmt={exportFmt}
      setExportFmt={setExportFmt}
      content={exportContent}
      formatTimeTotal={displayLines.length}
      downloadContent={downloadExport}
      startVideoExport={handleExportVideo}
      isExporting={isExporting}
      exportProgress={exportProgress}
    />
  )

  const editorList = (
    <EditorListPanel
      editorLines={editorLines} mode={mode} nextIndex={nextIndex} markedCount={markedCount} totalLines={totalLines}
      formatTimeShort={formatTimeShort} currentTime={currentTime}
      onTextChange={onTextChange} onDeleteLine={onDeleteLine} onAddLine={onAddLine} onMarkAt={onMarkAt}
      onAdjustTime={onAdjustTime} onOffsetAll={onOffsetAll} onClearTimes={handleClearTimes}
      onApplyEditor={handleApplyEditor} offset={offset} onUndoLast={onUndoLast} onMarkNext={handleMark}
      onStartFromZero={handleStartFromZero}
    />
  )

  const LayoutEntry = getLayoutById(selectedLayoutId)

  return (
    <>
      <audio ref={audioRef} src={audioSrc} onLoadedMetadata={e => setDuration(e.currentTarget.duration)} onEnded={() => setIsPlaying(false)} hidden />
      <LayoutEntry.Component
        header={header}
        previewArea={previewArea}
        audioPanel={audioPanel}
        renderSettingsPanel={renderSettingsPanel}
        textPanel={textPanel}
        exportPanel={exportPanel}
        editorList={editorList}
        mode={mode}
      />
    </>
  )
}
