'use client'

import { createElement, forwardRef, type CSSProperties } from 'react'
import { useZtext } from './useZtext'
import { DEFAULTS, type ZtextProps } from './types'
import './ztext.css'

export const Ztext = forwardRef<HTMLElement, ZtextProps>(function Ztext(
  {
    depth = DEFAULTS.depth,
    layers: layerCount = DEFAULTS.layers,
    direction = DEFAULTS.direction,
    fade = DEFAULTS.fade,
    perspective = DEFAULTS.perspective,
    event = DEFAULTS.event,
    eventRotation = DEFAULTS.eventRotation,
    eventDirection = DEFAULTS.eventDirection,
    as: Tag = 'div',
    className,
    style,
    children,
  },
  ref
) {
  const { containerRef, layers } = useZtext({
    depth,
    layers: layerCount,
    direction,
    fade,
    perspective,
    event,
    eventRotation,
    eventDirection,
  })

  const wrapperStyle: CSSProperties = {
    ...style,
    perspective,
  }

  return createElement(
    Tag,
    {
      ref: (node: HTMLElement | null) => {
        if (typeof ref === 'function') ref(node)
        else if (ref) (ref as React.MutableRefObject<HTMLElement | null>).current = node
      },
      className: className ? `ztext ${className}` : 'ztext',
      style: wrapperStyle,
    },
    <span
      ref={containerRef as React.RefObject<HTMLSpanElement>}
      className="ztext-inner"
    >
      {layers.map((layer, i) => (
        <span
          key={i}
          className="ztext-layer"
          style={layer.style}
          aria-hidden={layer.ariaHidden || undefined}
        >
          {children}
        </span>
      ))}
    </span>
  )
})
