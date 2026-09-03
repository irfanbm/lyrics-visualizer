import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type * as React from 'react'
import { parseLRC } from './utils/lrcParser'
import type { LyricLine } from './utils/lrcParser'
import type { EditorLine } from './types'
import { CanvasPreview } from './components/CanvasPreview'
import { AudioPanel, formatTimeShort } from './components/panels/AudioPanel'
import { RenderSettingsPanel } from './components/panels/RenderSettingsPanel'
import { TextInputPanel } from './components/panels/TextInputPanel'
import { ExportPanel } from './components/panels/ExportPanel'
import { EditorListPanel } from './components/panels/EditorListPanel'
import { getLayoutById } from './layouts'
import { VisualizerPanel } from './components/panels/VisualizerPanel'
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
  const [pasteTxt, setPasteTxt] = useState("")

  const [config, setConfig] = useState(() => {
    const defaults: any = {
      resolution: '1080p', customWidth: 1920, customHeight: 1080,
      showDuration: true, showProgressBar: true, showLineCounter: false,
      showTitle: false, karaokeMode: true, lyricPosition: 'center',
      bgColor: '#0a0a0a', fontFamily: 'Poppins',
      lineGap: 1.85, fadeEdges: true, visibleLines: 5,
      fontWeight: 700, fontItalic: false, transparentBg: false, inactiveOpacity: 0.28,
      visualizer: 'none', visualizerOpacity: 0.55, visualizerPosition: 'background', visualizerColor: '#22C55E', visualizerSize: 1, visualizerSensitivity: 1, visualizerSmoothing: 0.35, visualizerBars: 48, visualizerConfigs: {},
    }
    const saved = localStorage.getItem('lyric-config')
    if (saved) try { const parsed = JSON.parse(saved); return { ...defaults, ...parsed, visualizerConfigs: parsed.visualizerConfigs || {} }; } catch {}
    return defaults
  })

  const [_selectedLayoutId] = useState(() => localStorage.getItem('lyric-layout-id') || 'focus-canvas')

  const [exportFmt, setExportFmt] = useState('lrc')
  const [isExporting, setIsExporting] = useState(false)
  const [exportProgress, setExportProgress] = useState(0)
  const [exportVideoUrl, setExportVideoUrl] = useState<string | null>(null)

  // baris kosong = jeda visual, tidak perlu di-tap — hanya hitung baris berisi teks
  const editorTotalLines = editorLines.filter(l => l.text.trim() !== '').length
  const totalLines = editorTotalLines
  const markedCount = editorLines.filter(l => l.startTime !== null && l.text.trim() !== '').length
  const nextIndex = editorLines.findIndex(l => l.startTime === null && l.text.trim() !== '')

  const displayLines = useMemo(() => {
    if (offset === 0) return lines
    return lines.map(l => ({
      ...l,
      startTime: l.startTime + offset,
      endTime: l.endTime + offset,
      words: l.words.map(w => ({ ...w, startTime: w.startTime + offset, endTime: w.endTime + offset }))
    }))
  }, [lines, offset])

  const _activeIndex = useMemo(() => {
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
  void _activeIndex

  const modeRef = useRef(mode)
  const currentTimeRef = useRef(currentTime)
  const offsetRef = useRef(offset)
  const configRef = useRef(config)
  const displayLinesRef = useRef(displayLines)
  useEffect(() => { modeRef.current = mode }, [mode])
  useEffect(() => { currentTimeRef.current = currentTime }, [currentTime])
  useEffect(() => { offsetRef.current = offset }, [offset])
  useEffect(() => { configRef.current = config }, [config])
  useEffect(() => { displayLinesRef.current = displayLines }, [displayLines])

  useEffect(() => { localStorage.setItem('lyric-config', JSON.stringify(config)) }, [config])

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
      if (tag === 'INPUT' || tag === 'TEXTAREA' || (e.target as HTMLElement).isContentEditable) return
      if (e.code === 'Space') {
        e.preventDefault()
        if (modeRef.current === 'editor') handleMark()
        else handlePlayToggle()
      }
      if (e.code === 'ArrowLeft' || e.code === 'ArrowRight') {
        if (!audioRef.current) return
        e.preventDefault()
        const delta = e.altKey ? 0.05 : 1
        const dir = e.code === 'ArrowLeft' ? -delta : delta
        const next = Math.max(0, Math.min((audioRef.current.duration || 1e9), (audioRef.current.currentTime || 0) + dir))
        audioRef.current.currentTime = next
        setCurrentTime(next)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [handleMark, handlePlayToggle, isExporting])

  const handleClearTimes = () => setEditorLines(prev => prev.map(l => ({ ...l, startTime: null })))

  useEffect(() => {
    if (mode !== 'editor') return
    const marked = editorLines.filter(l => l.startTime !== null && l.text.trim() !== '').sort((a, b) => (a.startTime || 0) - (b.startTime || 0))
    if (marked.length === 0) { setLines([]); return }
    const newLines: LyricLine[] = marked.map((l, i) => {
      const s = l.startTime!
      const nextStart = marked[i + 1]?.startTime
      const end = nextStart != null ? Math.min(s + 3.4, nextStart) : s + 3.4
      const txt = l.text.trim()
      const ws = txt.split(/\s+/).filter(Boolean)
      const per = ws.length ? (end - s) / ws.length : (end - s)
      return { startTime: s, endTime: end, text: txt, words: ws.map((w, wi) => ({ text: w, startTime: s + wi * per, endTime: s + (wi + 1) * per })) }
    })
    setLines(newLines)
  }, [editorLines, mode])

  const handleApplyEditor = () => {
    const sorted = editorLines.filter(l => l.startTime !== null && l.text.trim() !== '').sort((a, b) => (a.startTime || 0) - (b.startTime || 0))
    const newLines: LyricLine[] = sorted.map((l, i) => {
      const s = l.startTime!
      const nextStart = sorted[i + 1]?.startTime
      const end = nextStart != null ? Math.min(s + 3.4, nextStart) : s + 3.4
      const txt = l.text.trim()
      const per = txt.split(/\s+/).filter(Boolean).length ? (end - s) / txt.split(/\s+/).filter(Boolean).length : 4
      return { startTime: s, endTime: end, text: txt, words: txt.split(/\s+/).filter(Boolean).map((w, wi) => ({ text: w, startTime: s + wi * per, endTime: s + (wi + 1) * per })) }
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
        const raw = txt.split(/\r?\n/).map(t => t.trim())
        if (raw.every(t => t.length === 0)) return
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
    const raw = pasteTxt.split(/\r?\n/).map(t => t.trim())
    // simpan baris kosong sebagai calon jeda — jangan filter
    if (raw.every(t => t.length === 0)) return
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
      if (capture) audioTracks = capture.call(audioRef.current).getAudioTracks()
    } catch {}

    const combined = new MediaStream([...stream.getVideoTracks(), ...audioTracks])
    const mime = ['video/webm;codecs=vp9,opus','video/webm;codecs=vp8,opus','video/webm'].find(t => MediaRecorder.isTypeSupported(t)) || 'video/webm'
    const recorder = new MediaRecorder(combined, { mimeType: mime, videoBitsPerSecond: 8_000_000 })
    const chunks: Blob[] = []
    recorder.ondataavailable = e => { if (e.data.size) chunks.push(e.data) }
    const done = new Promise<void>(res => { recorder.onstop = () => res() })

    // visualizer analyser for export (share live frequency)
    let exportAnalyser: AnalyserNode | null = null
    let exportData: Uint8Array | null = null
    try {
      const ac = new (window.AudioContext || (window as any).webkitAudioContext)()
      const src = ac.createMediaElementSource(audioRef.current!)
      exportAnalyser = ac.createAnalyser()
      exportAnalyser.fftSize = 512
      exportData = new Uint8Array(exportAnalyser.frequencyBinCount)
      src.connect(exportAnalyser)
      exportAnalyser.connect(ac.destination)
    } catch {}

    audioRef.current.currentTime = 0
    await audioRef.current.play()
    recorder.start()

    const finalDur = isFinite(duration) && duration > 0 ? duration : (audioRef.current.duration || 10)

    const renderLoop = () => {
      const el = audioRef.current!
      const time = el.currentTime
      setExportProgress(finalDur ? Math.min(100, (time / finalDur) * 100) : 0)
      const curCfg = configRef.current
      const curLines = displayLinesRef.current
      if (exportAnalyser && exportData && (curCfg as any).visualizer && (curCfg as any).visualizer !== 'none') {
        try { exportAnalyser.getByteFrequencyData(exportData as Uint8Array<ArrayBuffer>) } catch {}
      }
      renderLyricFrame(ctx, curCfg, { lines: curLines, time, duration: finalDur, title: '', analyserData: exportData as any })
      if (!el.ended && !el.paused) {
        requestAnimationFrame(renderLoop)
      } else {
        if (recorder.state === 'recording') recorder.stop()
      }
    }
    requestAnimationFrame(renderLoop)
    // safety: paksa stop jika audio tidak fire ended (mis. capture tanpa audio track)
    setTimeout(() => { if (recorder.state === 'recording') recorder.stop() }, (finalDur + 1) * 1000)

    await done

    audioRef.current.pause()
    const blob = new Blob(chunks, { type: 'video/webm' })
    const url = URL.createObjectURL(blob)
    if (exportVideoUrl) URL.revokeObjectURL(exportVideoUrl)
    setExportVideoUrl(url)
    // auto-download juga
    const a = document.createElement('a')
    a.href = url
    a.download = `${audioName||'lyric'}-${dimsW}x${dimsH}.webm`
    a.click()
    setIsExporting(false)
    setExportProgress(0)
  }

  const header = (
    <header className="h-[52px] px-3 flex items-center justify-between gap-3">
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-7 h-7 rounded-lg bg-[var(--color-accent)] grid place-items-center text-black font-black text-sm shrink-0 neon-glow">LV</div>
        <div className="min-w-0 hidden sm:block">
          <h1 className="text-[14px] font-bold font-display leading-none tracking-tight neon-text">Lyric Visualizer</h1>
          <p className="text-[10px] text-white/50 font-mono tracking-widest">NEON GLASS · WYSIWYG</p>
        </div>
        <h1 className="text-[14px] font-bold font-display sm:hidden neon-text">Lyric Visualizer</h1>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <span className="hidden sm:inline-flex items-center gap-1.5 text-[10px] font-mono tracking-widest text-white/35 border border-white/10 rounded-full px-2.5 py-1 glass">FOCUS CANVAS</span>
        <button
          onClick={() => setMode(m => m === 'player' ? 'editor' : 'player')}
          aria-pressed={mode === 'editor'}
          aria-label={mode === 'editor' ? 'Switch to player mode' : 'Switch to editor mode'}
          className={`min-h-[36px] px-4 py-2 rounded-full text-xs font-bold transition border ${mode === 'editor' ? 'bg-amber-500 text-black border-amber-500 shadow-[0_0_14px_rgba(245,158,11,0.4)]' : 'glass text-white/70 hover:bg-white/10 border-white/10'}`}
        >
          {mode === 'player' ? 'Editor' : 'Player'}
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
      videoUrl={exportVideoUrl}
      onDownloadVideo={() => {
        if (!exportVideoUrl) return
        const a = document.createElement('a')
        a.href = exportVideoUrl
        a.download = `${audioName||'lyric'}-video.webm`
        a.click()
      }}
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

  const visualizerPanel = (
    <VisualizerPanel audioRef={audioRef} audioSrc={audioSrc} currentTime={currentTime} duration={duration} config={config} onConfigChange={(patch) => setConfig({ ...config, ...patch })} />
  )

  const LayoutEntry = getLayoutById(_selectedLayoutId)

  return (
    <>
      <audio ref={audioRef} src={audioSrc} onLoadedMetadata={e => setDuration(e.currentTarget.duration)} onEnded={() => setIsPlaying(false)} hidden />
      <LayoutEntry.Component
        header={header}
        previewArea={previewArea}
        audioPanel={audioPanel}
        visualizerPanel={visualizerPanel}
        renderSettingsPanel={renderSettingsPanel}
        textPanel={textPanel}
        exportPanel={exportPanel}
        editorList={editorList}
        mode={mode}
      />
    </>
  )
}
