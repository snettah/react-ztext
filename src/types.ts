import type { CSSProperties, ReactNode, RefObject } from 'react'

export interface ZtextProps {
  depth?: string
  layers?: number
  direction?: 'both' | 'forwards' | 'backwards'
  fade?: boolean
  perspective?: string
  event?: 'pointer' | 'none'
  eventRotation?: string
  eventDirection?: 'default' | 'reverse'
  as?: keyof JSX.IntrinsicElements
  className?: string
  style?: CSSProperties
  children: ReactNode
}

export interface UseZtextOptions {
  depth?: string
  layers?: number
  direction?: 'both' | 'forwards' | 'backwards'
  fade?: boolean
  perspective?: string
  event?: 'pointer' | 'none'
  eventRotation?: string
  eventDirection?: 'default' | 'reverse'
}

export interface LayerData {
  style: CSSProperties
  ariaHidden: boolean
}

export interface UseZtextReturn {
  containerRef: RefObject<HTMLElement | null>
  layers: LayerData[]
}

export const DEFAULTS = {
  depth: '1rem',
  layers: 10,
  direction: 'both' as const,
  fade: false,
  perspective: '500px',
  event: 'pointer' as const,
  eventRotation: '30deg',
  eventDirection: 'default' as const,
} satisfies Required<UseZtextOptions>
