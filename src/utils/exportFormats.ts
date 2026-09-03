import type { LyricLine } from './lrcParser'

export type ExportFormat = 'lrc' | 'enhanced' | 'srt' | 'vtt' | 'json' | 'ass'

interface FormatDef {
  id: string
  label: string
  ext: string
  desc: string
}

export const EXPORT_FORMATS: Record<ExportFormat, FormatDef> = {
  lrc: { id: 'lrc', label: 'LRC', ext: '.lrc', desc: 'Spotify/Apple sync' },
  enhanced: { id: 'enhanced', label: 'Enhanced LRC', ext: '.lrc', desc: 'Word-by-word karaoke' },
  srt: { id: 'srt', label: 'SRT', ext: '.srt', desc: 'CapCut/Premiere' },
  vtt: { id: 'vtt', label: 'VTT', ext: '.vtt', desc: 'Web video' },
  json: { id: 'json', label: 'JSON', ext: '.json', desc: 'Data format' },
  ass: { id: 'ass', label: 'ASS', ext: '.ass', desc: 'FFmpeg burn-in' }
}

function formatLRCTime(s: number): string {
  const m = Math.floor(s / 60).toString().padStart(2, '0')
  const sec = Math.floor(s % 60).toString().padStart(2, '0')
  const ms = Math.floor((s % 1) * 100).toString().padStart(2, '0')
  return `[${m}:${sec}.${ms}]`
}

function formatSRTTime(s: number): string {
  const h = Math.floor(s / 3600).toString().padStart(2, '0')
  const m = Math.floor((s % 3600) / 60).toString().padStart(2, '0')
  const sec = Math.floor(s % 60).toString().padStart(2, '0')
  const ms = Math.floor((s % 1) * 1000).toString().padStart(3, '0')
  return `${h}:${m}:${sec},${ms}`
}

function toASSTime(s: number): string {
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60).toString().padStart(2, '0')
  const sc = Math.floor(s % 60).toString().padStart(2, '0')
  const cs = Math.floor((s % 1) * 100).toString().padStart(2, '0')
  return `${h}:${m}:${sc}.${cs}`
}

export function buildExport(fmt: ExportFormat, lines: LyricLine[]): string {
  switch (fmt) {
    case 'lrc':
      return lines.map(l => `${formatLRCTime(l.startTime)}${l.text}`).join('\n')
    
    case 'enhanced':
      return lines.map(l => {
        const ws = l.words.map(w => formatLRCTime(w.startTime).replace('[', '<').replace(']', '>') + w.text).join(' ')
        return `${formatLRCTime(l.startTime)}${ws}`
      }).join('\n')
    
    case 'srt':
      return lines.map((l, i) => {
        const s = formatSRTTime(l.startTime)
        const e = formatSRTTime(l.endTime)
        return `${i + 1}\n${s} --> ${e}\n${l.text}\n`
      }).join('\n')
    
    case 'vtt':
      const vttLines = lines.map((l, _i) => {
        const s = formatSRTTime(l.startTime).replace(',', '.')
        const e = formatSRTTime(l.endTime).replace(',', '.')
        return `${s} --> ${e}\n${l.text}\n`
      }).join('\n')
      return `WEBVTT\n\n${vttLines}`
    
    case 'json':
      return JSON.stringify(lines.map(l => ({ start: l.startTime, end: l.endTime, text: l.text })), null, 2)
    
    case 'ass':
      const header = [
        '[Script Info]',
        'Title: Lyric Visualizer Export',
        'ScriptType: v4.00+',
        '[V4+ Styles]',
        'Style: Default,Arial,48,&H00FFFFFF,,0,0,0,0,0,0,100,100,0,0,1,3,1,2,20,20,20,1',
        '[Events]',
        'Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text'
      ].join('\n')
      const ev = lines.map(l => {
        return `Dialogue: 0,${toASSTime(l.startTime)},${toASSTime(l.endTime)},Default,,0,0,0,,${l.text}`
      }).join('\n')
      return header + '\n' + ev
    
    default:
      return ''
  }
}
