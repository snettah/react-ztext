# react-ztext v2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Complete rewrite of react-ztext with zero runtime dependencies, zero re-renders during interaction, and modern tooling (Vite 8, TypeScript 5.8, React 18+).

**Architecture:** Single `Ztext` component + `useZtext` hook + `usePointerTracking` hook. All interaction handled via CSS custom properties updated directly on the DOM (no React state). Pure CSS for styling.

**Tech Stack:** Vite 8, TypeScript 5.8, ESLint 9, Vitest, React 18+

**Spec:** `docs/superpowers/specs/2026-03-19-react-ztext-v2-design.md`

---

## File Structure

| File | Responsibility |
|------|---------------|
| `src/index.ts` | Public exports: `Ztext`, `useZtext`, all types |
| `src/types.ts` | TypeScript interfaces: `ZtextProps`, `UseZtextOptions`, `LayerData`, `UseZtextReturn` |
| `src/usePointerTracking.ts` | Hook: RAF-throttled mousemove/touchmove → CSS custom properties |
| `src/useZtext.ts` | Hook: layer computation via `useMemo`, wires `usePointerTracking` |
| `src/Ztext.tsx` | Component: `forwardRef`, renders layers, delegates to `useZtext` |
| `src/ztext.css` | Pure CSS: `.ztext`, `.ztext-inner`, `.ztext-layer` |
| `src/__tests__/usePointerTracking.test.ts` | Unit tests for pointer tracking hook |
| `src/__tests__/useZtext.test.ts` | Unit tests for layer computation hook |
| `src/__tests__/Ztext.test.tsx` | Component tests |
| `index.html` | Dev demo page for Vite dev server |
| `demo/App.tsx` | Demo component for dev |
| `demo/main.tsx` | Demo entry point |
| `vite.config.ts` | Vite config (library mode + dev server) |
| `tsconfig.json` | TypeScript strict config |
| `eslint.config.js` | ESLint 9 flat config |

---

### Task 1: Clean up old files and init Vite 8 project

**Files:**
- Delete: `.babelrc`, `.travis.yml`, `.eslintrc`, `.eslintignore`, `src/.eslintrc`, `src/Layer.tsx`, `src/Layers.tsx`, `src/index.tsx`, `src/index.test.tsx`, `src/typings.d.ts`, `src/styles.module.css`, `tsconfig.test.json`, `example/` (entire directory)
- Create: `vite.config.ts`, `tsconfig.json` (rewrite), `eslint.config.js`, `package.json` (rewrite)
- Keep: `.editorconfig`, `.prettierrc`, `.gitignore`, `README.md`

- [ ] **Step 1: Delete obsolete files**

```bash
rm -f .babelrc .travis.yml .eslintrc .eslintignore tsconfig.test.json
rm -f src/.eslintrc src/Layer.tsx src/Layers.tsx src/index.tsx src/index.test.tsx src/typings.d.ts src/styles.module.css
rm -rf example/
```

- [ ] **Step 2: Remove old dependencies and install new ones**

```bash
rm -rf node_modules yarn.lock
```

- [ ] **Step 3: Write new `package.json`**

```json
{
  "name": "react-ztext",
  "version": "2.0.0",
  "description": "React component for 3D layered text effects",
  "author": "snettah",
  "license": "MIT",
  "repository": "snettah/react-ztext",
  "type": "module",
  "main": "dist/index.cjs",
  "module": "dist/index.js",
  "types": "dist/index.d.ts",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js",
      "require": "./dist/index.cjs"
    },
    "./styles": "./dist/ztext.css"
  },
  "files": ["dist"],
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "test": "vitest run",
    "test:watch": "vitest",
    "lint": "eslint src/"
  },
  "peerDependencies": {
    "react": ">=18",
    "react-dom": ">=18"
  },
  "devDependencies": {
    "@testing-library/react": "^16.0.0",
    "@types/react": "^18.3.0",
    "@types/react-dom": "^18.3.0",
    "eslint": "^9.0.0",
    "typescript-eslint": "^8.0.0",
    "@eslint/js": "^9.0.0",
    "globals": "^15.0.0",
    "jsdom": "^25.0.0",
    "react": "^18.3.0",
    "react-dom": "^18.3.0",
    "typescript": "^5.8.0",
    "vite": "^8.0.0",
    "@vitejs/plugin-react": "^4.6.0",
    "vite-plugin-dts": "^4.0.0",
    "vitest": "^3.0.0"
  },
  "engines": {
    "node": "^20.19.0 || >=22.12.0"
  }
}
```

- [ ] **Step 4: Write `vite.config.ts`**

```typescript
/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import dts from 'vite-plugin-dts'
import { resolve } from 'path'

export default defineConfig({
  plugins: [
    react(),
    dts({ include: ['src'], exclude: ['src/__tests__', 'demo'] }),
  ],
  build: {
    lib: {
      entry: resolve(import.meta.dirname, 'src/index.ts'),
      formats: ['es', 'cjs'],
      fileName: (format) => format === 'es' ? 'index.js' : 'index.cjs',
    },
    rollupOptions: {
      external: ['react', 'react-dom', 'react/jsx-runtime'],
      output: {
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM',
        },
      },
    },
    cssFileName: 'ztext.css',
  },
  test: {
    environment: 'jsdom',
    globals: true,
  },
})
```

- [ ] **Step 5: Write `tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "lib": ["DOM", "DOM.Iterable", "ESNext"],
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "strict": true,
    "sourceMap": true,
    "declaration": true,
    "declarationDir": "dist",
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true
  },
  "include": ["src", "demo"],
  "exclude": ["node_modules", "dist"]
}
```

- [ ] **Step 6: Write `eslint.config.js`**

```javascript
import js from '@eslint/js'
import tseslint from 'typescript-eslint'
import globals from 'globals'

export default tseslint.config(
  js.configs.recommended,
  ...tseslint.configs.strict,
  {
    languageOptions: {
      globals: { ...globals.browser, ...globals.node },
    },
    rules: {
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    },
  },
  { ignores: ['dist/', 'node_modules/'] },
)
```

- [ ] **Step 7: Update `.gitignore`**

Add these entries if not already present:

```
dist/
node_modules/
*.local
```

- [ ] **Step 8: Install dependencies**

```bash
npm install
```

- [ ] **Step 9: Verify project initializes correctly**

```bash
npx tsc --noEmit
```

Expected: Success (no source files to check yet, but config is valid).

- [ ] **Step 10: Commit**

```bash
git add -A
git commit -m "chore: replace tooling with Vite 8, TypeScript 5.8, ESLint 9

Remove styled-components, microbundle-crl, Travis CI, Babel, react-scripts.
Set up Vite library mode, Vitest, modern tsconfig, ESLint flat config."
```

---

### Task 2: Implement types

**Files:**
- Create: `src/types.ts`

- [ ] **Step 1: Write `src/types.ts`**

```typescript
import type { CSSProperties, ReactNode, RefObject } from 'react'

export interface ZtextProps {
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
  style?: CSSProperties
  children: ReactNode
}

export interface UseZtextOptions {
  depth?: string
  layers?: number
  direction?: 'both' | 'forwards' | 'backwards'
  fade?: boolean
  perspective?: string
  event?: 'pointer' | 'none'
  eventRotation?: string
  eventDirection?: 'default' | 'reverse'
}

export interface LayerData {
  style: CSSProperties
  ariaHidden: boolean
}

export interface UseZtextReturn {
  containerRef: RefObject<HTMLElement | null>
  layers: LayerData[]
}

export const DEFAULTS = {
  depth: '1rem',
  layers: 10,
  direction: 'both' as const,
  fade: false,
  perspective: '500px',
  event: 'pointer' as const,
  eventRotation: '30deg',
  eventDirection: 'default' as const,
} satisfies Required<UseZtextOptions>
```

- [ ] **Step 2: Verify types compile**

```bash
npx tsc --noEmit
```

Expected: Success.

- [ ] **Step 3: Commit**

```bash
git add src/types.ts
git commit -m "feat: add TypeScript types and defaults for v2 API"
```

---

### Task 3: Implement `usePointerTracking` hook (TDD)

**Files:**
- Create: `src/usePointerTracking.ts`, `src/__tests__/usePointerTracking.test.ts`

- [ ] **Step 1: Write failing tests for `usePointerTracking`**

Create `src/__tests__/usePointerTracking.test.ts`:

```typescript
import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { usePointerTracking } from '../usePointerTracking'

const defaultOpts = (ref: { current: HTMLElement | null }) => ({
  containerRef: ref,
  enabled: true,
  eventRotation: '30deg',
  eventDirection: 'default' as const,
})

describe('usePointerTracking', () => {
  let rafCallback: FrameRequestCallback | null = null

  beforeEach(() => {
    rafCallback = null
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => {
      rafCallback = cb
      return 1
    })
    vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should not attach listeners when disabled', () => {
    const addSpy = vi.spyOn(window, 'addEventListener')
    const ref = { current: document.createElement('div') }

    renderHook(() => usePointerTracking({ ...defaultOpts(ref), enabled: false }))

    const moveListeners = addSpy.mock.calls.filter(
      ([type]) => type === 'mousemove' || type === 'touchmove'
    )
    expect(moveListeners).toHaveLength(0)
  })

  it('should attach mousemove and touchmove listeners when enabled', () => {
    const addSpy = vi.spyOn(window, 'addEventListener')
    const ref = { current: document.createElement('div') }

    renderHook(() => usePointerTracking(defaultOpts(ref)))

    const types = addSpy.mock.calls.map(([type]) => type)
    expect(types).toContain('mousemove')
    expect(types).toContain('touchmove')
  })

  it('should use passive listeners for touchmove', () => {
    const addSpy = vi.spyOn(window, 'addEventListener')
    const ref = { current: document.createElement('div') }

    renderHook(() => usePointerTracking(defaultOpts(ref)))

    const touchCall = addSpy.mock.calls.find(([type]) => type === 'touchmove')
    expect(touchCall?.[2]).toEqual({ passive: true })
  })

  it('should update CSS custom properties via RAF', () => {
    const el = document.createElement('div')
    const setSpy = vi.spyOn(el.style, 'setProperty')
    const ref = { current: el }

    renderHook(() => usePointerTracking(defaultOpts(ref)))

    act(() => {
      window.dispatchEvent(new MouseEvent('mousemove', { clientX: 400, clientY: 300 }))
    })

    expect(window.requestAnimationFrame).toHaveBeenCalled()

    act(() => {
      rafCallback?.(0)
    })

    expect(setSpy).toHaveBeenCalledWith('--ztext-rotate-x', expect.any(String))
    expect(setSpy).toHaveBeenCalledWith('--ztext-rotate-y', expect.any(String))
  })

  it('should apply eventRotation multiplier', () => {
    const el = document.createElement('div')
    const setSpy = vi.spyOn(el.style, 'setProperty')
    const ref = { current: el }

    // Use eventRotation of 45deg
    renderHook(() => usePointerTracking({
      ...defaultOpts(ref),
      eventRotation: '45deg',
    }))

    // Simulate mousemove at right edge: xPct=1, yPct=0
    Object.defineProperty(window, 'innerWidth', { value: 1000, writable: true })
    Object.defineProperty(window, 'innerHeight', { value: 1000, writable: true })

    act(() => {
      window.dispatchEvent(new MouseEvent('mousemove', { clientX: 1000, clientY: 500 }))
    })

    act(() => {
      rafCallback?.(0)
    })

    // xPct = (1000/1000 - 0.5) * 2 = 1, xTilt = 1 * 45 * 1 = 45
    expect(setSpy).toHaveBeenCalledWith('--ztext-rotate-y', '45deg')
  })

  it('should reverse direction when eventDirection is reverse', () => {
    const el = document.createElement('div')
    const setSpy = vi.spyOn(el.style, 'setProperty')
    const ref = { current: el }

    renderHook(() => usePointerTracking({
      ...defaultOpts(ref),
      eventRotation: '30deg',
      eventDirection: 'reverse',
    }))

    Object.defineProperty(window, 'innerWidth', { value: 1000, writable: true })
    Object.defineProperty(window, 'innerHeight', { value: 1000, writable: true })

    act(() => {
      window.dispatchEvent(new MouseEvent('mousemove', { clientX: 1000, clientY: 500 }))
    })

    act(() => {
      rafCallback?.(0)
    })

    // xPct = 1, xTilt = 1 * 30 * -1 = -30
    expect(setSpy).toHaveBeenCalledWith('--ztext-rotate-y', '-30deg')
  })

  it('should remove listeners on unmount', () => {
    const removeSpy = vi.spyOn(window, 'removeEventListener')
    const ref = { current: document.createElement('div') }

    const { unmount } = renderHook(() => usePointerTracking(defaultOpts(ref)))
    unmount()

    const types = removeSpy.mock.calls.map(([type]) => type)
    expect(types).toContain('mousemove')
    expect(types).toContain('touchmove')
  })

  it('should cancel pending RAF on unmount', () => {
    const ref = { current: document.createElement('div') }

    const { unmount } = renderHook(() => usePointerTracking(defaultOpts(ref)))

    act(() => {
      window.dispatchEvent(new MouseEvent('mousemove', { clientX: 100, clientY: 100 }))
    })

    unmount()

    expect(window.cancelAnimationFrame).toHaveBeenCalled()
  })

  it('should throttle — only one RAF pending at a time', () => {
    const ref = { current: document.createElement('div') }

    renderHook(() => usePointerTracking(defaultOpts(ref)))

    act(() => {
      window.dispatchEvent(new MouseEvent('mousemove', { clientX: 100, clientY: 100 }))
      window.dispatchEvent(new MouseEvent('mousemove', { clientX: 200, clientY: 200 }))
      window.dispatchEvent(new MouseEvent('mousemove', { clientX: 300, clientY: 300 }))
    })

    // Only one RAF should be scheduled despite 3 events
    expect(window.requestAnimationFrame).toHaveBeenCalledTimes(1)
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx vitest run src/__tests__/usePointerTracking.test.ts
```

Expected: FAIL — module `../usePointerTracking` not found.

- [ ] **Step 3: Implement `usePointerTracking`**

Create `src/usePointerTracking.ts`:

```typescript
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

    const update = () => {
      const el = containerRef.current
      if (el) {
        const xTilt = pointerRef.current.x * rotationNumeral * directionAdj
        const yTilt = -pointerRef.current.y * rotationNumeral * directionAdj
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

    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('touchmove', onTouchMove, { passive: true })

    return () => {
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('touchmove', onTouchMove)
      cancelAnimationFrame(rafIdRef.current)
    }
  }, [enabled, containerRef, eventRotation, eventDirection])
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx vitest run src/__tests__/usePointerTracking.test.ts
```

Expected: All 9 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/usePointerTracking.ts src/__tests__/usePointerTracking.test.ts
git commit -m "feat: add usePointerTracking hook with RAF throttle

Handles mousemove/touchmove with requestAnimationFrame throttling.
Updates CSS custom properties directly on DOM. Passive touch listeners.
Proper cleanup on unmount."
```

---

### Task 4: Implement `useZtext` hook (TDD)

**Files:**
- Create: `src/useZtext.ts`, `src/__tests__/useZtext.test.ts`

- [ ] **Step 1: Write failing tests for `useZtext`**

Create `src/__tests__/useZtext.test.ts`:

```typescript
import { renderHook } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { useZtext } from '../useZtext'

describe('useZtext', () => {
  it('should return default 10 layers', () => {
    const { result } = renderHook(() => useZtext({}))
    expect(result.current.layers).toHaveLength(10)
  })

  it('should return a containerRef', () => {
    const { result } = renderHook(() => useZtext({}))
    expect(result.current.containerRef).toBeDefined()
    expect(result.current.containerRef.current).toBeNull()
  })

  it('should respect custom layer count', () => {
    const { result } = renderHook(() => useZtext({ layers: 5 }))
    expect(result.current.layers).toHaveLength(5)
  })

  it('should clamp layers to minimum 1', () => {
    const { result } = renderHook(() => useZtext({ layers: 0 }))
    expect(result.current.layers).toHaveLength(1)

    const { result: result2 } = renderHook(() => useZtext({ layers: -5 }))
    expect(result2.current.layers).toHaveLength(1)
  })

  it('should set ariaHidden=false only for first layer', () => {
    const { result } = renderHook(() => useZtext({ layers: 3 }))
    expect(result.current.layers[0].ariaHidden).toBe(false)
    expect(result.current.layers[1].ariaHidden).toBe(true)
    expect(result.current.layers[2].ariaHidden).toBe(true)
  })

  it('should compute backwards direction correctly', () => {
    const { result } = renderHook(() =>
      useZtext({ layers: 3, depth: '10px', direction: 'backwards' })
    )
    // Layer 0: pct=0, offset = -0*10 = 0
    expect(result.current.layers[0].style.transform).toBe('translateZ(0px)')
    // Layer 1: pct=1/3, offset = -(1/3)*10 ≈ -3.333
    expect(result.current.layers[1].style.transform).toMatch(/translateZ\(-3\.333.*px\)/)
  })

  it('should compute both direction correctly', () => {
    const { result } = renderHook(() =>
      useZtext({ layers: 2, depth: '10px', direction: 'both' })
    )
    // Layer 0: pct=0, offset = -(0*10) + 10/2 = 5
    expect(result.current.layers[0].style.transform).toBe('translateZ(5px)')
  })

  it('should compute forwards direction correctly', () => {
    const { result } = renderHook(() =>
      useZtext({ layers: 2, depth: '10px', direction: 'forwards' })
    )
    // Layer 0: pct=0, offset = -(0*10) + 10 = 10
    expect(result.current.layers[0].style.transform).toBe('translateZ(10px)')
  })

  it('should apply fade opacity', () => {
    const { result } = renderHook(() =>
      useZtext({ layers: 3, fade: true })
    )
    // Layer 0: pct=0, opacity = (1-0)/2 = 0.5
    expect(result.current.layers[0].style.opacity).toBe(0.5)
    // Layer 2: pct=2/3, opacity = (1-2/3)/2 ≈ 0.167
    expect(result.current.layers[2].style.opacity).toBeCloseTo(0.167, 2)
  })

  it('should have opacity 1 when fade is false', () => {
    const { result } = renderHook(() => useZtext({ layers: 3, fade: false }))
    result.current.layers.forEach((layer) => {
      expect(layer.style.opacity).toBe(1)
    })
  })

  it('should handle depth with rem units', () => {
    const { result } = renderHook(() =>
      useZtext({ layers: 2, depth: '2rem', direction: 'backwards' })
    )
    expect(result.current.layers[0].style.transform).toBe('translateZ(0rem)')
  })

  it('should fall back to px when depth has no unit', () => {
    const { result } = renderHook(() =>
      useZtext({ layers: 2, depth: '10', direction: 'forwards' })
    )
    expect(result.current.layers[0].style.transform).toBe('translateZ(10px)')
  })

  it('should recompute layers when props change', () => {
    const { result, rerender } = renderHook(
      ({ layers }) => useZtext({ layers }),
      { initialProps: { layers: 3 } }
    )
    expect(result.current.layers).toHaveLength(3)

    rerender({ layers: 5 })
    expect(result.current.layers).toHaveLength(5)
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx vitest run src/__tests__/useZtext.test.ts
```

Expected: FAIL — module `../useZtext` not found.

- [ ] **Step 3: Implement `useZtext`**

Create `src/useZtext.ts`:

```typescript
import { useMemo, useRef } from 'react'
import { usePointerTracking } from './usePointerTracking'
import { DEFAULTS, type UseZtextOptions, type UseZtextReturn, type LayerData } from './types'

function parseDepth(depth: string): { numeral: number; unit: string } {
  const unit = depth.match(/[a-z]+/)?.[0] ?? 'px'
  const numeral = parseFloat(depth)
  if (isNaN(numeral)) return { numeral: parseFloat(DEFAULTS.depth), unit: 'rem' }
  return { numeral, unit }
}

function computeOffset(direction: string, pct: number, depthNumeral: number): number {
  if (direction === 'backwards') return -pct * depthNumeral
  if (direction === 'both') return -(pct * depthNumeral) + depthNumeral / 2
  // forwards
  return -(pct * depthNumeral) + depthNumeral
}

export function useZtext(options: UseZtextOptions = {}): UseZtextReturn {
  const {
    depth = DEFAULTS.depth,
    layers: layerCount = DEFAULTS.layers,
    direction = DEFAULTS.direction,
    fade = DEFAULTS.fade,
    event = DEFAULTS.event,
    eventRotation = DEFAULTS.eventRotation,
    eventDirection = DEFAULTS.eventDirection,
  } = options

  const containerRef = useRef<HTMLElement | null>(null)
  const clampedLayers = Math.max(1, Math.round(layerCount))

  usePointerTracking({
    containerRef,
    enabled: event === 'pointer',
    eventRotation,
    eventDirection,
  })

  const layers = useMemo((): LayerData[] => {
    const { numeral, unit } = parseDepth(depth)

    return Array.from({ length: clampedLayers }, (_, i) => {
      const pct = i / clampedLayers
      const offset = computeOffset(direction, pct, numeral)
      const opacity = fade ? (1 - pct) / 2 : 1

      return {
        style: {
          transform: `translateZ(${offset}${unit})`,
          opacity,
        },
        ariaHidden: i > 0,
      }
    })
  }, [depth, clampedLayers, direction, fade])

  return { containerRef, layers }
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx vitest run src/__tests__/useZtext.test.ts
```

Expected: All 13 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/useZtext.ts src/__tests__/useZtext.test.ts
git commit -m "feat: add useZtext hook with layer computation

Computes layer transforms and opacity via useMemo. Supports all
directions (backwards, both, forwards), fade, prop validation.
Delegates pointer tracking to usePointerTracking."
```

---

### Task 5: Implement CSS and `Ztext` component (TDD)

**Files:**
- Create: `src/ztext.css`, `src/Ztext.tsx`, `src/__tests__/Ztext.test.tsx`

- [ ] **Step 1: Write `src/ztext.css`**

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
  user-select: none;
}

.ztext-layer:first-child {
  position: relative;
  pointer-events: auto;
  user-select: auto;
}
```

- [ ] **Step 2: Write failing tests for `Ztext` component**

Create `src/__tests__/Ztext.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { createRef } from 'react'
import { Ztext } from '../Ztext'

describe('Ztext', () => {
  it('should render children', () => {
    render(<Ztext>Hello</Ztext>)
    expect(screen.getByText('Hello')).toBeDefined()
  })

  it('should render the correct number of layers', () => {
    const { container } = render(<Ztext layers={5}>Test</Ztext>)
    const layers = container.querySelectorAll('.ztext-layer')
    expect(layers).toHaveLength(5)
  })

  it('should set aria-hidden on all layers except the first', () => {
    const { container } = render(<Ztext layers={3}>Test</Ztext>)
    const layers = container.querySelectorAll('.ztext-layer')
    expect(layers[0].getAttribute('aria-hidden')).toBeNull()
    expect(layers[1].getAttribute('aria-hidden')).toBe('true')
    expect(layers[2].getAttribute('aria-hidden')).toBe('true')
  })

  it('should apply perspective as inline style', () => {
    const { container } = render(<Ztext perspective="800px">Test</Ztext>)
    const wrapper = container.querySelector('.ztext')
    expect(wrapper?.getAttribute('style')).toContain('perspective')
    expect(wrapper?.getAttribute('style')).toContain('800px')
  })

  it('should apply className to outer element', () => {
    const { container } = render(<Ztext className="custom">Test</Ztext>)
    const wrapper = container.querySelector('.ztext')
    expect(wrapper?.classList.contains('custom')).toBe(true)
  })

  it('should forward ref to outer element', () => {
    const ref = createRef<HTMLDivElement>()
    render(<Ztext ref={ref}>Test</Ztext>)
    expect(ref.current).toBeInstanceOf(HTMLElement)
    expect(ref.current?.classList.contains('ztext')).toBe(true)
  })

  it('should render with a custom element via as prop', () => {
    const { container } = render(<Ztext as="section">Test</Ztext>)
    const wrapper = container.querySelector('section.ztext')
    expect(wrapper).not.toBeNull()
  })

  it('should merge user styles with perspective', () => {
    const { container } = render(
      <Ztext style={{ color: 'red' }} perspective="600px">Test</Ztext>
    )
    const wrapper = container.querySelector('.ztext')
    const style = wrapper?.getAttribute('style') ?? ''
    expect(style).toContain('color')
    expect(style).toContain('perspective')
  })

  it('should clean up on unmount', () => {
    const removeSpy = vi.spyOn(window, 'removeEventListener')
    const { unmount } = render(<Ztext>Test</Ztext>)
    unmount()
    const types = removeSpy.mock.calls.map(([type]) => type)
    expect(types).toContain('mousemove')
    expect(types).toContain('touchmove')
    removeSpy.mockRestore()
  })
})
```

- [ ] **Step 3: Run tests to verify they fail**

```bash
npx vitest run src/__tests__/Ztext.test.tsx
```

Expected: FAIL — module `../Ztext` not found.

- [ ] **Step 4: Implement `Ztext` component**

Create `src/Ztext.tsx`:

```tsx
'use client'

import { forwardRef, type CSSProperties } from 'react'
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
    perspective,
    ...style,
  }

  return (
    // @ts-expect-error — Tag is a dynamic intrinsic element
    <Tag
      ref={(node: HTMLElement | null) => {
        // Forward both refs
        if (typeof ref === 'function') ref(node)
        else if (ref) (ref as React.MutableRefObject<HTMLElement | null>).current = node
      }}
      className={className ? `ztext ${className}` : 'ztext'}
      style={wrapperStyle}
    >
      <span
        ref={containerRef as React.RefObject<HTMLSpanElement>}
        className="ztext-inner"
      >
        {layers.map((layer, i) => (
          <span
            key={i}
            className="ztext-layer"
            style={layer.style}
            {...(layer.ariaHidden ? { 'aria-hidden': true } : {})}
          >
            {children}
          </span>
        ))}
      </span>
    </Tag>
  )
})
```

- [ ] **Step 5: Run tests to verify they pass**

```bash
npx vitest run src/__tests__/Ztext.test.tsx
```

Expected: All 9 tests PASS.

- [ ] **Step 6: Commit**

```bash
git add src/ztext.css src/Ztext.tsx src/__tests__/Ztext.test.tsx
git commit -m "feat: add Ztext component with pure CSS and forwardRef

Renders 3D layered content using CSS custom properties for rotation.
Supports as prop, className, style, ref forwarding. Accessible with
aria-hidden on duplicate layers."
```

---

### Task 6: Create public exports and verify build

**Files:**
- Create: `src/index.ts`

- [ ] **Step 1: Write `src/index.ts`**

```typescript
export { Ztext } from './Ztext'
export { useZtext } from './useZtext'
export type {
  ZtextProps,
  UseZtextOptions,
  UseZtextReturn,
  LayerData,
} from './types'
```

- [ ] **Step 2: Run all tests**

```bash
npx vitest run
```

Expected: All tests PASS.

- [ ] **Step 3: Run lint**

```bash
npx eslint src/
```

Expected: No errors.

- [ ] **Step 4: Run build**

```bash
npm run build
```

Expected: `dist/` contains `index.js`, `index.cjs`, `index.d.ts`, `ztext.css`.

- [ ] **Step 5: Verify dist contents**

```bash
ls dist/
```

Expected: `index.js`, `index.cjs`, `index.d.ts`, `ztext.css` (at minimum).

- [ ] **Step 6: Commit**

```bash
git add src/index.ts
git commit -m "feat: add public exports for Ztext, useZtext, and types"
```

---

### Task 7: Add dev demo page

**Files:**
- Create: `index.html`, `demo/main.tsx`, `demo/App.tsx`

- [ ] **Step 1: Create `index.html`**

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>react-ztext demo</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/demo/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 2: Create `demo/main.tsx`**

```tsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './App'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
)
```

- [ ] **Step 3: Create `demo/App.tsx`**

```tsx
import { Ztext } from '../src'
import '../src/ztext.css'

export function App() {
  return (
    <div style={{ padding: '4rem', textAlign: 'center', fontFamily: 'sans-serif' }}>
      <h1>react-ztext v2</h1>

      <div style={{ margin: '2rem 0' }}>
        <Ztext depth="1rem" direction="both" style={{ fontSize: '5rem' }}>
          Hello
        </Ztext>
      </div>

      <div style={{ margin: '2rem 0' }}>
        <Ztext depth="2rem" direction="forwards" fade style={{ fontSize: '4rem' }}>
          Forwards + Fade
        </Ztext>
      </div>

      <div style={{ margin: '2rem 0' }}>
        <Ztext depth="1.5rem" direction="backwards" layers={20} style={{ fontSize: '5rem' }}>
          🔥🍔😂
        </Ztext>
      </div>

      <div style={{ margin: '2rem 0' }}>
        <Ztext event="none" depth="1rem" style={{ fontSize: '3rem' }}>
          No interaction
        </Ztext>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Verify dev server starts**

```bash
npx vite --open
```

Expected: Browser opens with the demo page showing 3D text effects. Verify mouse interaction works. Ctrl+C to stop.

- [ ] **Step 5: Commit**

```bash
git add index.html demo/
git commit -m "feat: add Vite dev demo page for visual testing"
```

---

### Task 8: Final cleanup and verification

- [ ] **Step 1: Run full test suite**

```bash
npx vitest run
```

Expected: All tests PASS.

- [ ] **Step 2: Run lint**

```bash
npx eslint src/
```

Expected: No errors.

- [ ] **Step 3: Run build**

```bash
npm run build
```

Expected: Clean build, `dist/` has all expected files.

- [ ] **Step 4: Verify the CSS file is in dist**

```bash
cat dist/ztext.css
```

Expected: Contains `.ztext`, `.ztext-inner`, `.ztext-layer` rules.

- [ ] **Step 5: Run type check**

```bash
npx tsc --noEmit
```

Expected: No type errors.

- [ ] **Step 6: Final commit**

```bash
git add -A
git commit -m "chore: react-ztext v2.0.0 — complete rewrite

Zero runtime dependencies, zero re-renders during interaction,
RAF-throttled pointer tracking, accessible layers, forwardRef,
Vite 8, TypeScript 5.8, Vitest, ESLint 9 flat config."
```
