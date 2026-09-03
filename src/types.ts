import type React from 'react'

// ===================== Editor =====================

export interface EditorLine {
  id: number
  text: string
  startTime: number | null
}

// ===================== Render Config =====================

export type ResolutionId = '1080p' | '720p' | 'vertical' | 'custom'

export interface RenderConfig {
  resolution: ResolutionId
  customWidth: number
  customHeight: number
  /** Toggleable elements — affect BOTH preview and export */
  showDuration: boolean
  showProgressBar: boolean
  showLineCounter: boolean
  showTitle: boolean
  karaokeMode: boolean
  lyricPosition: 'top' | 'center' | 'bottom'
  bgColor: string
  fontFamily: string
  /** Jarak antar baris (multiplier) */
  lineGap: number
  /** Opacity tepi atas/bawah memudar ke 0 */
  fadeEdges: boolean
  /** Jumlah baris lirik yang tampil di sekitar baris aktif */
  visibleLines: number
  /** Font styling */
  fontWeight: number
  fontItalic: boolean
  /** Export transparan (background alpha 0) */
  transparentBg: boolean
  /** Opacity lirik tidak aktif */
  inactiveOpacity: number
  /** Visualizer background — grid picker di tab Visualizer (bars retained + elegant) */
  visualizer: 'none' | 'bars' | 'mirrored' | 'wave' | 'circular' | 'particles' | 'spectrum' | 'horizon'
  visualizerOpacity: number
  visualizerPosition: 'background' | 'bottom' | 'top' | 'center'
  visualizerColor: string
  visualizerSize: number
  visualizerSensitivity: number
  visualizerSmoothing: number
  visualizerBars: number
  visualizerConfigs: Record<string, Partial<RenderConfig>>
}

export const DEFAULT_RENDER_CONFIG: RenderConfig = {
  resolution: '1080p',
  customWidth: 1920,
  customHeight: 1080,
  showDuration: true,
  showProgressBar: true,
  showLineCounter: false,
  showTitle: false,
  karaokeMode: true,
  lyricPosition: 'center',
  bgColor: '#0a0a0a',
  fontFamily: 'Poppins',
  lineGap: 1.85,
  fadeEdges: true,
  visibleLines: 5,
  fontWeight: 700,
  fontItalic: false,
  transparentBg: false,
  inactiveOpacity: 0.28,
  visualizer: 'none',
  visualizerOpacity: 0.55,
  visualizerPosition: 'background',
  visualizerColor: '#22C55E',
  visualizerSize: 1,
  visualizerSensitivity: 1,
  visualizerSmoothing: 0.35,
  visualizerBars: 48,
  visualizerConfigs: {},
}

export interface Dimension {
  w: number
  h: number
}

export function getDimensions(cfg: RenderConfig): Dimension {
  switch (cfg.resolution) {
    case '720p': return { w: 1280, h: 720 }
    case 'vertical': return { w: 1080, h: 1920 }
    case 'custom': return { w: Math.max(16, cfg.customWidth || 1920), h: Math.max(16, cfg.customHeight || 1080) }
    default: return { w: 1920, h: 1080 }
  }
}

// ===================== Layout System =====================

export type AppMode = 'player' | 'editor'

export interface LayoutProps {
  mode: AppMode
  header: React.ReactNode
  previewArea: React.ReactNode
  audioPanel: React.ReactNode
  renderSettingsPanel: React.ReactNode
  textPanel: React.ReactNode
  exportPanel: React.ReactNode
  editorList: React.ReactNode
  visualizerPanel?: React.ReactNode
}

export interface LayoutDefinition {
  id: string
  name: string
  description: string
}
