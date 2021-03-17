import React from 'react'
import Layer from './Layer'

interface Props {
  layers: number
  fade: boolean
  children: React.ReactNode
  direction: string
  depth: string
  style?: React.CSSProperties
}

const Layers = React.memo(
  ({ layers, fade, children, direction, depth, style }: Props) => {
    const depthUnit = depth.match(/[a-z]+/)?.[0] ?? ''

    const getDirection = React.useCallback(
      (pct: number) => {
        const depthNumeral = parseFloat(depth.replace(depthUnit, ''))
        if (direction === 'backwards') {
          return -pct * depthNumeral
        }
        if (direction === 'both') {
          return -(pct * depthNumeral) + depthNumeral / 2
        }
        if (direction === 'forwards') {
          return -(pct * depthNumeral) + depthNumeral
        }
        return null
      },
      [depthUnit]
    )

    return (
      <React.Fragment>
        {Array(layers)
          .fill(0)
          .map((_, i) => {
            const pct = i / layers
            const transform = `translateZ(${getDirection(pct)}${depthUnit})`
            const opacity = fade ? (1 - pct) / 2 : 1

            return (
              <Layer
                key={i}
                index={i}
                opacity={opacity}
                transform={transform}
                style={style}
              >
                {children}
              </Layer>
            )
          })}
      </React.Fragment>
    )
  }
)
export default Layers
