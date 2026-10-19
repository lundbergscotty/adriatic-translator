import { useEffect, useRef } from 'react'

// Brand blues + one yellow + a white core. Additive blending on a deep-sea base.
// r = radius as a fraction of the orb, k = squash (1 = round, lower = streak), w = spin speed of the streak
const BLOBS = [
  { color: [0, 175, 240],   r: 1.05, k: 0.42, rx: 0.34, ry: 0.26, s: 0.50, p: 0.0, w: 0.30, a: 0.85 },
  { color: [92, 225, 255],  r: 0.95, k: 0.34, rx: 0.40, ry: 0.34, s: 0.68, p: 2.1, w: -0.42, a: 0.80 },
  { color: [0, 119, 200],   r: 1.15, k: 0.50, rx: 0.26, ry: 0.40, s: 0.39, p: 4.0, w: 0.22, a: 0.70 },
  { color: [255, 242, 0],   r: 0.62, k: 0.30, rx: 0.46, ry: 0.30, s: 0.84, p: 1.3, w: 0.55, a: 0.70 },
  { color: [255, 255, 255], r: 0.40, k: 0.55, rx: 0.20, ry: 0.18, s: 1.20, p: 3.2, w: -0.35, a: 0.90 },
  { color: [0, 175, 240],   r: 0.85, k: 0.28, rx: 0.48, ry: 0.44, s: 0.60, p: 5.1, w: -0.26, a: 0.70 },
  { color: [140, 236, 255], r: 0.75, k: 0.26, rx: 0.36, ry: 0.48, s: 0.74, p: 0.9, w: 0.48, a: 0.70 },
  { color: [255, 242, 0],   r: 0.48, k: 0.32, rx: 0.30, ry: 0.42, s: 1.02, p: 4.6, w: -0.60, a: 0.55 },
  { color: [0, 90, 170],    r: 1.20, k: 0.55, rx: 0.30, ry: 0.22, s: 0.33, p: 2.8, w: 0.18, a: 0.65 },
]

/**
 * Animated orb. `listening` speeds it up, `level` (0..1, mic loudness) swells it.
 * Pure canvas, no filters, so it renders the same in Safari and Chrome.
 */
export default function Orb({ listening = false, level = 0, size = 176 }) {
  const ref = useRef(null)
  const stateRef = useRef({ listening, level })
  stateRef.current = { listening, level }

  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    canvas.width = size * dpr
    canvas.height = size * dpr
    const ctx = canvas.getContext('2d')
    ctx.scale(dpr, dpr)
    const c = size / 2
    const R = size / 2
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

    let raf = 0
    let smooth = 0
    let tAccum = 0
    let last = performance.now()

    const draw = (now) => {
      const { listening: on, level: lv } = stateRef.current
      const dt = Math.min((now - last) / 1000, 0.05)
      last = now
      const speed = reduce ? 0 : on ? 1.9 : 0.45
      tAccum += dt * speed
      smooth += ((on ? lv : 0) - smooth) * 0.18
      const swell = 1 + smooth * 0.22

      ctx.clearRect(0, 0, size, size)
      ctx.save()
      ctx.beginPath()
      ctx.arc(c, c, R, 0, Math.PI * 2)
      ctx.clip()

      // Base: deep sea.
      const base = ctx.createRadialGradient(c, c * 0.9, 0, c, c, R)
      base.addColorStop(0, '#0E4E72')
      base.addColorStop(1, '#061E2C')
      ctx.fillStyle = base
      ctx.fillRect(0, 0, size, size)

      ctx.globalCompositeOperation = 'lighter'
      for (const b of BLOBS) {
        const x = c + Math.cos(tAccum * b.s + b.p) * R * b.rx
        const y = c + Math.sin(tAccum * b.s * 1.27 + b.p * 0.8) * R * b.ry
        const rad = R * b.r * swell
        const [r, g, bl] = b.color
        // Squashed, slowly spinning ellipse: reads as a flowing streak rather than a dot.
        ctx.save()
        ctx.translate(x, y)
        ctx.rotate(tAccum * b.w + b.p)
        ctx.scale(1, b.k)
        const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, rad)
        grad.addColorStop(0, `rgba(${r},${g},${bl},${b.a})`)
        grad.addColorStop(0.35, `rgba(${r},${g},${bl},${b.a * 0.45})`)
        grad.addColorStop(1, `rgba(${r},${g},${bl},0)`)
        ctx.fillStyle = grad
        ctx.beginPath()
        ctx.arc(0, 0, rad, 0, Math.PI * 2)
        ctx.fill()
        ctx.restore()
      }
      ctx.globalCompositeOperation = 'source-over'

      // Glassy rim highlight.
      const rim = ctx.createRadialGradient(c, c, R * 0.82, c, c, R)
      rim.addColorStop(0, 'rgba(255,255,255,0)')
      rim.addColorStop(1, 'rgba(255,255,255,0.18)')
      ctx.fillStyle = rim
      ctx.fillRect(0, 0, size, size)
      ctx.restore()

      if (!reduce) raf = requestAnimationFrame(draw)
    }
    raf = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(raf)
  }, [size])

  return (
    <canvas
      ref={ref}
      style={{ width: size, height: size, borderRadius: '50%', display: 'block' }}
      aria-hidden="true"
    />
  )
}
