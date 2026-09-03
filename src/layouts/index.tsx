import { FocusCanvasLayout } from './FocusCanvasLayout'
import type { ComponentType } from 'react'
import type { LayoutProps, LayoutDefinition } from '../types'

export { FocusCanvasLayout }

export interface LayoutEntry extends LayoutDefinition {
  Component: ComponentType<LayoutProps>
}

export const AVAILABLE_LAYOUTS: LayoutEntry[] = [
  {
    id: 'focus-canvas',
    name: 'Focus Canvas',
    description: '1 rail tabbed (Import/Mark/Style) + canvas besar — simpel',
    Component: FocusCanvasLayout
  }
]

export function getLayoutById(_id: string): LayoutEntry {
  return AVAILABLE_LAYOUTS[0]
}
