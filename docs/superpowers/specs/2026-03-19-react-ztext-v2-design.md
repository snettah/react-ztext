# react-ztext v2 — Complete Rewrite Design Spec

## Overview

Full rewrite of react-ztext, a React component that creates 3D layered effects on text and content. The current codebase (v1.0.3, last updated March 2021) is completely outdated. This rewrite modernizes everything: tooling, architecture, performance, and API.

## Goals

1. **Zero runtime dependencies** — pure CSS instead of styled-components
2. **Zero re-renders during interaction** — CSS custom properties updated via DOM
3. **Modern stack** — Vite 8, TypeScript 5.8, ESLint 9, Vitest, React 18+
4. **Clean API** — component + custom hook for advanced usage
5. **No memory leaks** — proper event listener cleanup
6. **Accessible** — screen readers only read content once

## Known Bugs in v1 (Fixed in v2)

- **Memory leak**: `useEffect` in `index.tsx` adds mousemove/touchmove listeners but never returns a cleanup function. Each re-render adds new listeners without removing old ones.
- **Stale closure in `useCallback`**: `tilt` callback depends on `eventRotation` but the dependency array only includes `eventDirection`.
- **Empty `useMemo` deps**: `Layers.tsx` line 47 uses `useMemo(() => ..., [])` — layers never recompute when props change.
- **`defaultProps` deprecated**: `React.FC` + `defaultProps` is deprecated in React 18 and removed in React 19.
- **Broken test**: `index.test.tsx` imports `ExampleComponent` which doesn't exist (default export is `Ztext`).

## Architecture

### File Structure

```
src/
├── index.ts              # Public exports: Ztext, useZtext, types
├── Ztext.tsx             # Main component, renders layers
├── useZtext.ts           # Hook: 3D logic, layer computation, rotation
├── usePointerTracking.ts # Hook: mousemove/touch with RAF throttle
├── types.ts              # Exported TypeScript types
└── ztext.css             # Pure CSS with custom properties
```

### Component Hierarchy

Single `Ztext` component that renders:
1. An outer wrapper (`div.ztext`) with `perspective` CSS
2. An inner container (`div.ztext-inner`) with `transform-style: preserve-3d` and `will-change: transform`
3. N layer `<span.ztext-layer>` elements with computed `transform` and `opacity`

No sub-components. Layers are generated inline via `.map()`.

The component uses `React.forwardRef` to allow consumers to get a ref to the outer DOM element.

### Hook Design

**`usePointerTracking(ref, enabled)`**
- `enabled` maps to `options.event === 'pointer'`
- Attaches mousemove/touchmove listeners to `window` with `{ passive: true }` to avoid blocking scroll
- Stores pointer position in a `useRef` (no state, no re-render)
- Uses `requestAnimationFrame` with a flag-based throttle pattern: a `pendingRaf` ref is set to `true` when a RAF is scheduled, incoming events are skipped while the flag is true, the RAF callback clears the flag after updating CSS properties
- Updates CSS custom properties `--ztext-rotate-x` and `--ztext-rotate-y` directly on the container DOM element via `ref.current.style.setProperty()`
- Returns cleanup via `useEffect` return (removes all listeners + cancels pending RAF)

**`useZtext(options)`**
- Computes layer styles once via `useMemo` with correct dependency array: `[depth, layers, direction, fade]`
- Creates a `containerRef`
- Calls `usePointerTracking(containerRef, options.event === 'pointer')` internally
- Returns `{ containerRef, layers }` where `layers` is an array of `{ style, ariaHidden }` objects

### SSR / Server-Side Rendering

The component renders layers statically on the server (no event tracking). `usePointerTracking` guards all `window`/`requestAnimationFrame` calls behind a `typeof window !== 'undefined'` check. The hooks only activate on the client after hydration. A `"use client"` directive is added to `Ztext.tsx` for Next.js App Router compatibility.

## Public API

### Component

```tsx
<Ztext
  depth="1rem"           // Depth of each layer
  layers={10}            // Number of layers
  direction="both"       // 'both' | 'forwards' | 'backwards'
  fade={false}           // Whether layers fade out
  perspective="500px"    // CSS perspective value
  event="pointer"        // 'pointer' | 'none'
  eventRotation="30deg"  // Max rotation amplitude
  eventDirection="default" // 'default' | 'reverse'
  as="span"              // HTML element to render (default: 'div')
  className="my-class"   // CSS class on the outer element
  style={{ fontSize: '4rem' }} // Inline styles on the outer element
>
  Hello
</Ztext>
```

### Hook

```tsx
const { containerRef, layers } = useZtext({
  depth: '2rem',
  layers: 5,
  direction: 'forwards',
  fade: true,
})

// Usage: render layers manually
return (
  <div ref={containerRef} className="ztext">
    <div className="ztext-inner">
      {layers.map((layer, i) => (
        <span key={i} className="ztext-layer" style={layer.style} aria-hidden={layer.ariaHidden}>
          My content
        </span>
      ))}
    </div>
  </div>
)
```

### Types

```typescript
interface ZtextProps {
  depth?: string
  layers?: number
  direction?: 'both' | 'forwards' | 'backwards'
  fade?: boolean
  perspective?: string
  event?: 'pointer' | 'none'
  eventRotation?: string
  eventDirection?: 'default' | 'reverse'
  as?: keyof JSX.IntrinsicElements
  className?: string
  style?: React.CSSProperties
  children: React.ReactNode
}

interface UseZtextOptions {
  depth?: string
  layers?: number
  direction?: 'both' | 'forwards' | 'backwards'
  fade?: boolean
  perspective?: string
  event?: 'pointer' | 'none'
  eventRotation?: string
  eventDirection?: 'default' | 'reverse'
}

interface LayerData {
  style: React.CSSProperties
  ariaHidden: boolean
}

interface UseZtextReturn {
  containerRef: React.RefObject<HTMLElement>
  layers: LayerData[]
}
```

All props optional except `children` on the component. Defaults:
- depth: `'1rem'`
- layers: `10`
- direction: `'both'`
- fade: `false`
- perspective: `'500px'`
- event: `'pointer'`
- eventRotation: `'30deg'`
- eventDirection: `'default'`
- as: `'div'`

**Prop validation**: `layers` is clamped to a minimum of 1. Invalid `depth`/`perspective`/`eventRotation` values that fail to parse fall back to defaults.

## Layer Computation

### Transform Formula

Preserved from v1 with the dependency bug fixed:

```typescript
const depthNumeral = parseFloat(depth) // e.g. '1rem' → 1
const depthUnit = depth.match(/[a-z]+/)?.[0] ?? 'px'

for (let i = 0; i < layers; i++) {
  const pct = i / layers
  let offset: number
  if (direction === 'backwards') offset = -pct * depthNumeral
  else if (direction === 'both') offset = -(pct * depthNumeral) + depthNumeral / 2
  else /* forwards */ offset = -(pct * depthNumeral) + depthNumeral

  transform = `translateZ(${offset}${depthUnit})`
}
```

### Opacity Formula (fade)

```typescript
const opacity = fade ? (1 - pct) / 2 : 1
```

When `fade` is `false`, all layers have opacity 1. When `true`, layers progressively fade: layer 0 = 0.5, last layer ≈ 0.

### Accessibility

All layers except the first (index 0) have `aria-hidden="true"` to prevent screen readers from reading duplicate content. Layer 0 is the visible "top" layer that carries the semantic content.

No animation on prop change — layers recompute instantly when props change.

## CSS File (`ztext.css`)

```css
.ztext {
  display: inline-block;
  position: relative;
}

.ztext-inner {
  display: inline-block;
  transform-style: preserve-3d;
  will-change: transform;
  transform: rotateX(var(--ztext-rotate-x, 0deg)) rotateY(var(--ztext-rotate-y, 0deg));
}

.ztext-layer {
  display: block;
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.ztext-layer:first-child {
  position: relative;
  pointer-events: auto;
}
```

The first layer is `position: relative` to establish the natural size of the container. All other layers are absolute-positioned on top of it. Only the first layer receives pointer events.

## Performance Strategy

### Problem: Current Implementation

- Event listeners never cleaned up (memory leak)
- No throttle on mousemove → computation every pixel moved
- styled-components recreates CSS on every style change
- React.memo partially effective (children prop breaks memoization)

### Solution: Zero Re-render Architecture

1. **RAF-throttled pointer tracking** — Flag-based pattern: `pendingRaf` ref is `true` while a RAF is scheduled, incoming events are skipped. RAF callback computes rotation, sets CSS custom properties, clears the flag. Max one computation per frame.

2. **Direct DOM updates via CSS custom properties** — Rotation values written directly to `ref.current.style.setProperty('--ztext-rotate-x', value)`. The CSS `transform` on `.ztext-inner` references these variables. Browser handles the visual update without React involvement.

3. **Static layer computation** — Layer transforms (translateZ offset, opacity) computed once in `useMemo` with deps `[depth, layers, direction, fade]`. Recomputed only when these props change.

4. **GPU compositing hint** — `will-change: transform` on `.ztext-inner` to promote to its own compositor layer.

5. **Proper cleanup** — All event listeners removed in `useEffect` cleanup. Pending RAF cancelled via `cancelAnimationFrame`. No dangling listeners on unmount.

6. **Passive touch listeners** — `{ passive: true }` on touchmove to avoid blocking scroll.

## Tooling & Build

### Stack

| Tool | Version | Purpose |
|------|---------|---------|
| Vite | 8 | Build (library mode) + dev server |
| TypeScript | 5.8 | Type checking, strict mode |
| ESLint | 9 | Linting, flat config |
| Vitest | latest | Unit tests |
| React | 18+ | Peer dependency |
| Node | 18+ | Engine minimum |

### Build Output

```
dist/
├── index.js      # ESM
├── index.cjs     # CommonJS
├── index.d.ts    # TypeScript declarations
└── ztext.css     # Styles
```

### npm Scripts

- `dev` — Vite dev server with demo page (`index.html` at root)
- `build` — Library build
- `test` — Vitest
- `lint` — ESLint

### Files Removed

- `.travis.yml`
- `.babelrc`
- `microbundle-crl` dependency
- `styled-components` dependency
- `react-scripts` dependency
- All Babel dependencies
- `example/` directory (replaced by root `index.html` + `demo/` for dev)

### package.json Key Fields

```json
{
  "name": "react-ztext",
  "version": "2.0.0",
  "type": "module",
  "main": "dist/index.cjs",
  "module": "dist/index.js",
  "types": "dist/index.d.ts",
  "exports": {
    ".": {
      "import": "./dist/index.js",
      "require": "./dist/index.cjs",
      "types": "./dist/index.d.ts"
    },
    "./styles": "./dist/ztext.css"
  },
  "files": ["dist"],
  "peerDependencies": {
    "react": ">=18",
    "react-dom": ">=18"
  },
  "engines": {
    "node": ">=18"
  }
}
```

## Testing Strategy

- **Unit tests** for `useZtext` hook (layer computation with all directions, defaults, fade formula, prop validation/clamping)
- **Unit tests** for `usePointerTracking` (RAF scheduling, cleanup, passive listeners, disabled state)
- **Component tests** for `Ztext` (renders correct number of layers, applies props, aria-hidden on layers > 0, cleanup on unmount, ref forwarding, `as` prop)
- **No E2E** — visual effects are hard to test automatically, manual verification via dev server

## Migration for Users

This is a **major version bump (v2.0.0)**. Breaking changes:

1. `styled-components` no longer required — remove from project dependencies
2. Must import CSS: `import 'react-ztext/styles'`
3. New `as`, `className`, and `ref` props available
4. Minimum React 18 (was 17)
5. `as` prop accepts HTML element names only (not custom components)
