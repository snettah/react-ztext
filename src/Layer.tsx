import React from 'react'
import styled from 'styled-components'

interface Props {
  index: number
  transform: string
  opacity: number
  children: React.ReactNode
  style?: React.CSSProperties
}

const Layer = React.memo(({ index, opacity, transform, children }: Props) => {
  return (
    <StyledLayer
      style={{
        //@ts-expect-error
        '--transform': transform,
        '--opacity': opacity,
        ...(index >= 1 && backLayersStyle)
      }}
    >
      {children}
    </StyledLayer>
  )
})

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

const StyledLayer = styled.span`
  display: inline-block;
  opacity: var(--opacity);
  transform: var(--transform);
`

export default Layer
