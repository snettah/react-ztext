import React from 'react'

interface Props {
  index: number
  transform: string
  opacity: number
  children: React.ReactNode
  style?: React.CSSProperties
}

const backLayersStyle: React.CSSProperties = {
  position: 'absolute',
  top: 0,
  left: 0,
  pointerEvents: 'none',
  MozUserSelect: 'none',
  msUserSelect: 'none',
  WebkitUserSelect: 'none',
  userSelect: 'none'
}

const Layer = React.memo(
  ({ index, opacity, style, transform, children }: Props) => {
    return (
      <span
        className='z-layer'
        style={{
          display: 'inline-block',
          WebkitTransform: transform,
          transform,
          fontSize: '80px',
          opacity,
          ...style,
          ...(index >= 1 && backLayersStyle)
        }}
      >
        {children}
      </span>
    )
  }
)

export default Layer
