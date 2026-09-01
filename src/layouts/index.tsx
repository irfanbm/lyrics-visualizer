import { ClassicLayout } from './ClassicLayout'
import { RightSidebarLayout } from './RightSidebarLayout'
import { FocusLayout } from './FocusLayout'
import type { ComponentType } from 'react'
import type { LayoutProps, LayoutDefinition } from '../types'

// Re-export for external consumers
export { ClassicLayout, RightSidebarLayout, FocusLayout }

export interface LayoutEntry extends LayoutDefinition {
  Component: ComponentType<LayoutProps>
}

export const AVAILABLE_LAYOUTS: LayoutEntry[] = [
  {
    id: 'classic',
    name: 'Classic',
    description: 'Sidebar kiri + preview kanan',
    Component: ClassicLayout
  },
  {
    id: 'right',
    name: 'Right Sidebar',
    description: 'Preview kiri + sidebar kanan',
    Component: RightSidebarLayout
  },
  {
    id: 'focus',
    name: 'Focus Mode',
    description: 'Preview full + panel drawer',
    Component: FocusLayout
  }
]

export function getLayoutById(id: string): LayoutEntry {
  return AVAILABLE_LAYOUTS.find(l => l.id === id) || AVAILABLE_LAYOUTS[0]
}
