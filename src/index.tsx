import * as React from 'react'
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

const Ztext = (props: Props) => {
  const [style, setStyle] = React.useState<React.CSSProperties>({
    display: 'inline-block',
    WebkitTransformStyle: 'preserve-3d',
    transformStyle: 'preserve-3d'
  })

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
      const transform =
        'rotateX(' +
        yTilt +
        eventRotationUnit +
        ') rotateY(' +
        xTilt +
        eventRotationUnit +
        ')'
      setStyle({ ...style, transform, WebkitTransform: transform })
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
    <div
      style={{
        display: 'inline-block',
        position: 'relative',
        WebkitPerspective: props.perspective,
        perspective: props.perspective
      }}
    >
      <span className='z-text' style={style}>
        <Layers
          layers={props.layers}
          direction={props.direction}
          depth={props.depth}
          fade={props.fade}
          style={props.style}
        >
          {props.children}
        </Layers>
      </span>
    </div>
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

export default Ztext
