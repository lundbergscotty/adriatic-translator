import { useEffect, useRef, useState } from 'react'

/**
 * Mic loudness 0..1 while `active` is true, for driving the orb.
 * Opens its own audio stream (SpeechRecognition does not expose one). Fails silently.
 */
export function useMicLevel(active) {
  const [level, setLevel] = useState(0)
  const cleanupRef = useRef(null)

  useEffect(() => {
    if (!active) { cleanupRef.current?.(); cleanupRef.current = null; setLevel(0); return }
    let stopped = false
    let raf = 0
    let ctx, stream
    ;(async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true })
        if (stopped) { stream.getTracks().forEach(t => t.stop()); return }
        const AC = window.AudioContext || window.webkitAudioContext
        ctx = new AC()
        const src = ctx.createMediaStreamSource(stream)
        const analyser = ctx.createAnalyser()
        analyser.fftSize = 512
        src.connect(analyser)
        const buf = new Uint8Array(analyser.fftSize)
        const tick = () => {
          analyser.getByteTimeDomainData(buf)
          let sum = 0
          for (let i = 0; i < buf.length; i++) { const v = (buf[i] - 128) / 128; sum += v * v }
          const rms = Math.sqrt(sum / buf.length)
          setLevel(Math.min(1, rms * 4))
          raf = requestAnimationFrame(tick)
        }
        tick()
      } catch { /* no mic access for metering; orb just idles */ }
    })()
    cleanupRef.current = () => {
      stopped = true
      cancelAnimationFrame(raf)
      try { stream?.getTracks().forEach(t => t.stop()) } catch { /* noop */ }
      try { ctx?.close() } catch { /* noop */ }
    }
    return () => { cleanupRef.current?.(); cleanupRef.current = null }
  }, [active])

  return level
}
