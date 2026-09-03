# DESIGN.md — LyricVisualizer (Google Stitch spec)

> Portabel — dibaca oleh Hallmark, Impeccable, Taste, UUPM, dan tool DESIGN.md-aware lain.

## Tokens
- **Primary:** `oklch(0.28 0.12 285)` #1E293B (ink slate)
- **Background:** `oklch(0.15 0.02 260)` #0F172A (deep slate), radial #1B2336 → #0B1220
- **Card:** `oklch(0.22 0.03 260)` #1B2336
- **Muted:** `oklch(0.32 0.03 260)` #272F42
- **Border:** `oklch(0.38 0.04 255)` #334155
- **Accent:** `oklch(0.70 0.17 145)` #22C55E (locked 1 accent untuk seluruh page)
- **Foreground:** `oklch(0.97 0.01 255)` #F8FAFC
- **Destructive:** #EF4444

## Typography
- **Display:** `Space Grotesk 700` (studio, underground music) — fallback `Geist`
- **Body:** `Geist 400/500` / `Inter 400` legacy — body 16px/1.5, max 65ch
- **Mono:** `Geist Mono` untuk timer & pill `idx/n` & SRT timestamps
- **Scale:** 12/14/16/20/24/36/48 — H1 `text-4xl md:text-6xl tracking-tighter leading-none`

## Spacing / Layout
- 4pt scale: `--space-xs 4` `--space-sm 8` `--space-md 16` `--space-lg 24` `--space-xl 32` `--space-2xl 48` `--space-3xl 64`
- Page: `max-w-[1600px] mx-auto`, `html/body overflow-x: clip` (bukan hidden)
- **Studio Workbench**: `[320px rail] [1fr canvas] [360px inspector]` di ≥1024px, single-column + drawer <768px

## Components
- **Btn primary:** `bg-[--color-accent] text-black font-bold rounded-xl 44px min-h`, hover `-translate-y-[1px]`, active `scale-[0.98]`
- **Btn ghost:** `bg-white/5 border-white/10`, hover `bg-white/10`
- **Card:** `bg-black/40 border white/10 rounded-3xl`, shadow `0 8px 32px rgba(0,0,0,.35)`, radius 16px locked
- **Input:** 44px min, label above, helper 11px, error below, no placeholder-as-label
- **Range:** `accent-emerald-500`, thumb 16px, focus ring 2px

## Motion
- Durasi 200ms `cubic-bezier(.16,1,.3,1)`, hanya `transform/opacity`
- Reduced-motion: `@media (prefers-reduced-motion: reduce) { * { animation:none transition:none } }`

## Iconography
- Phosphor `@phosphor-icons/react` weight 1.5, satu family per project. No emoji. Decorative `aria-hidden`, button wajib `aria-label`.

## Aesthetics
- **Genre:** Operate / utilitarian + soft neon (midnight studio)
- **Dials:** VARIANCE 6 / MOTION 4 / DENSITY 5
- **Macrostructure:** Workbench (Hallmark), Theme: Midnight (dark band, grotesk-sans, cool accent)
