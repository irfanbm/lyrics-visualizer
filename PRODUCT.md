# PRODUCT.md — LyricVisualizer

## Product
**LyricVisualizer** — Operate tool untuk musisi, editor video, dan kreator konten yang butuh sinkronisasi lirik ke audio dan export video lirik (WYSIWYG, overlay transparan).

## Audience
- **Primary:** Musisi indie / editor CapCut/Premiere usia 18-35, kerja cepat, di dark studio, butuh presisi frame 0.01s
- **Secondary:** Kreator TikTok/YouTube Shorts (9:16), butuh template cepat
- **Anti-audience:** Bukan penonton landing page — tool harus scanable, consistency > expression

## Use Case / Job-to-be-Done
1. Load audio + lirik (TXT/LRC/paste) → 2. Mark timing dengan Space / TAP per baris → 3. Fine-tune offset & kanvas → 4. Export LRC/SRT + video WebM (VP9 transparent overlay) → overlay di NLE.

**One action:** Selesaikan sync lirik → export video dalam < 5 menit.

## Mode — Operate
Visitor completes a task. Scanability, native expectations, real usage scene outrank expression. Brand lives in precise details: timeline, transport, marking.

## Constraints
- WYSIWYG: `CanvasPreview` (raf) = `lyricRenderer.renderLyricFrame` export loop. Satu source of truth `RenderConfig`.
- Performance: 30fps canvas capture, MediaRecorder VP9/VP8 fallback, 8 Mbps, no layout thrashing.
- Accessibility: 4.5:1 text, keyboard nav (Space mark/play, ←→ scrub ±1s/±0.05s), visible focus, reduced-motion.
- Platform: React 19 + Vite 8 + Tailwind v4, no Framer Motion (keep bundle kecil).

## Brand Voice
Calm, clinical, no hype. "Mark. Preview. Export." — bukan "Boost your productivity".

## Success Metrics
- Marking throughput: Space TAP < 100ms feedback
- No blank export: `exportProgress` real 0→100% + finished toast
- No data loss: `localStorage lyric-config + lyric-layout-id` persist
