import { useEffect, useRef, type RefObject } from 'react'

interface PointerTrackingOptions {
  containerRef: RefObject<HTMLElement | null>
  enabled: boolean
  eventRotation: string
  eventDirection: 'default' | 'reverse'
}

function parseRotation(eventRotation: string): { numeral: number; unit: string } {
  const unit = eventRotation.match(/[a-z]+/)?.[0] ?? 'deg'
  const numeral = parseFloat(eventRotation)
  if (isNaN(numeral)) return { numeral: 30, unit: 'deg' }
  return { numeral, unit }
}

export function usePointerTracking({
  containerRef,
  enabled,
  eventRotation,
  eventDirection,
}: PointerTrackingOptions): void {
  const pointerRef = useRef({ x: 0, y: 0 })
  const rafIdRef = useRef(0)
  const pendingRef = useRef(false)

  useEffect(() => {
    if (!enabled || typeof window === 'undefined') return

    const { numeral: rotationNumeral, unit: rotationUnit } = parseRotation(eventRotation)
    const directionAdj = eventDirection === 'reverse' ? -1 : 1
    const maxAngle = Math.min(rotationNumeral, 75)

    const update = () => {
      const el = containerRef.current
      if (el) {
        const xTilt = Math.max(-maxAngle, Math.min(maxAngle, pointerRef.current.x * rotationNumeral * directionAdj))
        const yTilt = Math.max(-maxAngle, Math.min(maxAngle, -pointerRef.current.y * rotationNumeral * directionAdj))
        el.style.setProperty('--ztext-rotate-x', `${yTilt}${rotationUnit}`)
        el.style.setProperty('--ztext-rotate-y', `${xTilt}${rotationUnit}`)
      }
      pendingRef.current = false
    }

    const scheduleUpdate = () => {
      if (pendingRef.current) return
      pendingRef.current = true
      rafIdRef.current = requestAnimationFrame(update)
    }

    const onMouseMove = (e: MouseEvent) => {
      const xPct = (e.clientX / window.innerWidth - 0.5) * 2
      const yPct = (e.clientY / window.innerHeight - 0.5) * 2
      pointerRef.current = { x: xPct, y: yPct }
      scheduleUpdate()
    }

    const onTouchMove = (e: TouchEvent) => {
      const touch = e.touches[0]
      if (!touch) return
      const xPct = (touch.clientX / window.innerWidth - 0.5) * 2
      const yPct = (touch.clientY / window.innerHeight - 0.5) * 2
      pointerRef.current = { x: xPct, y: yPct }
      scheduleUpdate()
    }

    window.addEventListener('mousemove', onMouseMove, { passive: true })
    window.addEventListener('touchmove', onTouchMove, { passive: true })

    return () => {
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('touchmove', onTouchMove)
      cancelAnimationFrame(rafIdRef.current)
    }
  }, [enabled, eventRotation, eventDirection])
}
