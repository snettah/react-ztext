import React from 'react'
// @ts-ignore
import Ztext from 'react-ztext'

const App = () => {
  return (
    <div style={{ textAlign: 'center' }}>
      <Ztext
        depth='1rem'
        direction='both'
        event='pointer'
        eventRotation='30deg'
        eventDirection='default'
        fade={false}
        layers={10}
        perspective='500px'
      >
        <span role='img' aria-label='emoji'>
          😂🔥🍔
        </span>
      </Ztext>
    </div>
  )
}

export default App
