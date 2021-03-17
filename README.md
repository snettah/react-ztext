# react-ztext

> [Ztext.js](https://github.com/bennettfeely/ztext) implementation in React

[![NPM](https://img.shields.io/npm/v/react-ztext.svg)](https://www.npmjs.com/package/react-ztext) [![JavaScript Style Guide](https://img.shields.io/badge/code_style-standard-brightgreen.svg)](https://standardjs.com)

## Install

```bash
npm install --save react-ztext
```

```bash
yarn add react-ztext
```

## Usage

```tsx
import React from 'react'
import Ztext from 'react-ztext'

const Example = () => (
  <Ztext
    depth='1rem'
    direction='both'
    event='pointer'
    eventRotation='30deg'
    eventDirection='default'
    fade={false}
    layers={10}
    perspective='500px'
    style={{
      fontSize: '4rem'
    }}
  >
    <span role='img' aria-label='emoji'>
      😂🔥🍔
    </span>
  </Ztext>
)
```

[ZText.js Documentation](https://bennettfeely.com/ztext/)

## License

MIT © [snettah](https://github.com/snettah)
