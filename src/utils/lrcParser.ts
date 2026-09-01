export interface LyricWord {
  text: string
  startTime: number
  endTime: number
}

export interface LyricLine {
  startTime: number
  endTime: number
  text: string
  words: LyricWord[]
}

function toSeconds(min: string, sec: string, ms: string): number {
  const m = parseInt(min, 10)
  const s = parseFloat(sec + "." + ms.padEnd(2,"0").slice(0,3))
  return m * 60 + s
}

export function parseLRC(raw: string): LyricLine[] {
  const lines: LyricLine[] = []
  const lineRegex = /^\[(\d{1,2}):(\d{2})\.(\d{2,3})\](.*)$/

  for (const rawLine of raw.split("\n")) {
    const line = rawLine.trim()
    if (!line) continue
    if (/^\[(ti|ar|al|by|offset):/i.test(line)) continue

    const m = line.match(lineRegex)
    if (!m) continue
    const start = toSeconds(m[1], m[2], m[3])
    const content = m[4].trim()
    if (!content) continue

    const wordRegex = /<(\d{1,2}):(\d{2})\.(\d{2,3})>/g
    const wordMatches = [...content.matchAll(wordRegex)]

    let words: LyricWord[] = []
    let plainText = content

    if (wordMatches.length > 0) {
      const parts: { time: number; text: string }[] = []
      const regex = /<(\d{1,2}):(\d{2})\.(\d{2,3})>([^<]*)/g
      let match: RegExpExecArray | null
      while ((match = regex.exec(content)) !== null) {
        const t = toSeconds(match[1], match[2], match[3])
        const txt = match[4].trim()
        if (txt) parts.push({ time: t, text: txt })
      }
      if (parts.length > 0) {
        plainText = parts.map(p => p.text).join(" ")
        words = parts.map((p, i) => ({
          text: p.text,
          startTime: p.time,
          endTime: parts[i + 1]?.time ?? 0,
        }))
      }
    } else {
      const split = content.split(/\s+/).filter(Boolean)
      plainText = split.join(" ")
      words = split.map(w => ({ text: w, startTime: start, endTime: start }))
    }

    lines.push({
      startTime: start,
      endTime: 0,
      text: plainText,
      words,
    })
  }

  lines.sort((a, b) => a.startTime - b.startTime)

  for (let i = 0; i < lines.length; i++) {
    const nextStart = lines[i + 1]?.startTime ?? lines[i].startTime + 4
    lines[i].endTime = nextStart
    const w = lines[i].words
    if (w.length > 0) {
      const hasRealTiming = w.some(x => x.startTime !== lines[i].startTime)
      if (hasRealTiming) {
        for (let j = 0; j < w.length; j++) {
          if (j < w.length - 1) w[j].endTime = w[j + 1].startTime
          else w[j].endTime = lines[i].endTime
        }
      } else {
        const dur = lines[i].endTime - lines[i].startTime
        const per = dur / w.length
        for (let j = 0; j < w.length; j++) {
          w[j].startTime = lines[i].startTime + j * per
          w[j].endTime = lines[i].startTime + (j + 1) * per
        }
      }
    }
  }

  return lines
}
