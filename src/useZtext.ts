import { useMemo, useRef } from 'react'
import { usePointerTracking } from './usePointerTracking'
import { DEFAULTS, type UseZtextOptions, type UseZtextReturn, type LayerData } from './types'

function parseDepth(depth: string): { numeral: number; unit: string } {
  const unit = depth.match(/[a-z]+/)?.[0] ?? 'px'
  const numeral = parseFloat(depth)
  if (isNaN(numeral)) return { numeral: parseFloat(DEFAULTS.depth), unit: 'rem' }
  return { numeral, unit }
}

function computeOffset(direction: string, pct: number, depthNumeral: number): number {
  if (direction === 'backwards') return -pct * depthNumeral
  if (direction === 'both') return -(pct * depthNumeral) + depthNumeral / 2
  // forwards
  return -(pct * depthNumeral) + depthNumeral
}

export function useZtext(options: UseZtextOptions = {}): UseZtextReturn {
  const {
    depth = DEFAULTS.depth,
    layers: layerCount = DEFAULTS.layers,
    direction = DEFAULTS.direction,
    fade = DEFAULTS.fade,
    event = DEFAULTS.event,
    eventRotation = DEFAULTS.eventRotation,
    eventDirection = DEFAULTS.eventDirection,
  } = options

  const containerRef = useRef<HTMLElement | null>(null)
  const clampedLayers = Math.max(1, Math.round(layerCount))

  usePointerTracking({
    containerRef,
    enabled: event === 'pointer',
    eventRotation,
    eventDirection,
  })

  const layers = useMemo((): LayerData[] => {
    const { numeral, unit } = parseDepth(depth)

    return Array.from({ length: clampedLayers }, (_, i) => {
      const pct = i / clampedLayers
      const offset = computeOffset(direction, pct, numeral)
      const opacity = fade ? (1 - pct) / 2 : 1

      return {
        style: {
          transform: `translateZ(${offset}${unit})`,
          opacity,
        },
        ariaHidden: i > 0,
      }
    })
  }, [depth, clampedLayers, direction, fade])

  return { containerRef, layers }
}
