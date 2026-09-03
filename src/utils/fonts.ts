export interface FontDefinition {
  family: string
  label: string
}

export const GOOGLE_FONTS: FontDefinition[] = [
  { family: 'Inter', label: 'Inter (Clean Modern)' },
  { family: 'Poppins', label: 'Poppins (Friendly Rounded)' },
  { family: 'Montserrat', label: 'Montserrat (Geometric Bold)' },
  { family: 'Raleway', label: 'Raleway (Elegant Thin)' },
  { family: 'Oswald', label: 'Oswald (Condensed Strong)' },
  { family: 'Bebas Neue', label: 'Bebas Neue (Display Tall)' },
  { family: 'Quicksand', label: 'Quicksand (Soft Rounded)' },
  { family: 'Nunito', label: 'Nunito (Friendly Round)' },
  { family: 'Playfair Display', label: 'Playfair (Serif Elegant)' },
  { family: 'Anton', label: 'Anton (Heavy Display)' }
]

/**
 * Load Google Fonts by injecting stylesheet and waiting for ready
 */
export async function ensureFontLoaded(family: string): Promise<void> {
  // Only load each font once via link
  if (!document.querySelector(`link[data-font="${family}"]`)) {
    const cleanFamily = family.replace(/\s+/g, '+')
    const url = `https://fonts.googleapis.com/css2?family=${cleanFamily}:ital,wght@0,400;0,600;0,800;1,400&display=swap`
    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = url
    link.dataset.font = family
    link.crossOrigin = 'anonymous'
    document.head.appendChild(link)
  }
  
  // Wait for font availability with timeout
  if (!window.document.fonts) return
  
  try {
    await Promise.race([
      Promise.all([
        window.document.fonts!.load(`400 100px "${family}"`),
        window.document.fonts!.load(`600 100px "${family}"`),
        window.document.fonts!.load(`800 100px "${family}"`)
      ]),
      new Promise(resolve => setTimeout(resolve, 3000)) // 3s max wait
    ])
  } catch {
    // Ignore errors — browser will handle gracefully
  }
}

/**
 * Get base font sizes for active/inactive lines based on dimensions
 */
export function getDefaultFontSize(w: number, h: number, _fontFamily: string): { active: number, inactive: number } {
  const isPortrait = w < h
  const scaleFactor = w / (isPortrait ? 1080 : 1920)
  const baseActive = isPortrait ? 56 : 52
  const baseInactive = isPortrait ? 42 : 36
  return {
    active: Math.round(baseActive * scaleFactor),
    inactive: Math.round(baseInactive * scaleFactor)
  }
}
