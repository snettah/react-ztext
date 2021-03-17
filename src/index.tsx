import React from 'react'
import styled from 'styled-components'
import Layers from './Layers'

interface Props {
  depth: string
  direction: string
  event: string
  eventRotation: string
  eventDirection: string
  fade: boolean
  layers: number
  perspective: string
  children: React.ReactNode
  style?: React.CSSProperties
}

const Ztext: React.FC<Props> = (props) => {
  const layersWrapperRef = React.useRef<HTMLSpanElement>(null)

  const tilt = React.useCallback(
    (xPct: number, yPct: number) => {
      const eventRotationUnit = props.eventRotation?.match(/[a-z]+/)?.[0] ?? ''
      const eventRotationNumeral = parseFloat(
        props.eventRotation.replace(eventRotationUnit, '')
      )
      // Switch neg/pos values if eventDirection is reversed
      let eventDirectionAdj = null
      if (props.eventDirection === 'reverse') {
        eventDirectionAdj = -1
      } else {
        eventDirectionAdj = 1
      }

      // Multiply pct rotation by eventRotation and eventDirection
      const xTilt = xPct * eventRotationNumeral * eventDirectionAdj
      const yTilt = -yPct * eventRotationNumeral * eventDirectionAdj

      // Rotate .z-layers as a function of x and y coordinates
      const transform = `rotateX(${yTilt}${eventRotationUnit}) rotateY(${xTilt}${eventRotationUnit})`

      layersWrapperRef.current?.style.setProperty('--transform', transform)
    },
    [props.eventDirection]
  )

  React.useEffect(() => {
    if (props.event === 'pointer') {
      window.addEventListener(
        'mousemove',
        (e) => {
          const xPct = (e.clientX / window.innerWidth - 0.5) * 2
          const yPct = (e.clientY / window.innerHeight - 0.5) * 2

          tilt(xPct, yPct)
        },
        false
      )

      window.addEventListener(
        'touchmove',
        (e) => {
          const xPct = (e.touches[0].clientX / window.innerWidth - 0.5) * 2
          const yPct = (e.touches[0].clientY / window.innerHeight - 0.5) * 2

          tilt(xPct, yPct)
        },
        false
      )
    }
  }, [props.event])

  return (
    <Wrapper
      style={{
        //@ts-expect-error
        '--perspective': props.perspective,
        ...props.style
      }}
    >
      <LayersWrapper ref={layersWrapperRef}>
        <Layers
          layers={props.layers}
          direction={props.direction}
          depth={props.depth}
          fade={props.fade}
        >
          {props.children}
        </Layers>
      </LayersWrapper>
    </Wrapper>
  )
}

Ztext.defaultProps = {
  depth: '1rem',
  direction: 'both',
  event: 'pointer',
  eventRotation: '30deg',
  eventDirection: 'default',
  fade: false,
  layers: 10,
  perspective: '500px'
}

const Wrapper = styled.div`
  display: inline-block;
  position: relative;
  perspective: var(--perspective);
`

const LayersWrapper = styled.span`
  display: inline-block;
  transform-style: preserve-3d;
  transform: var(--transform);
`

export default Ztext
