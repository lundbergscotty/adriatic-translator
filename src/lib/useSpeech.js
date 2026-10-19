import { useCallback, useEffect, useRef, useState } from 'react'

export const LANG_TAGS = { hr: 'hr-HR', en: 'en-US' }

function getRecognition() {
  if (typeof window === 'undefined') return null
  return window.SpeechRecognition || window.webkitSpeechRecognition || null
}

export const speechSupported = !!getRecognition()

/**
 * Press-to-talk speech recognition built on the Web Speech API.
 * - lang: 'hr' | 'en'
 * - onFinal(text): called with each finalized chunk (appended by caller)
 * - onInterim(text): live partial text for display
 * Chrome stops after a pause; we restart while `listening` is true so the coach can keep talking.
 */
export function useSpeech({ lang, onFinal, onInterim }) {
  const [listening, setListening] = useState(false)
  const [error, setError] = useState(null)
  const recRef = useRef(null)
  const wantRef = useRef(false)
  const cbRef = useRef({ onFinal, onInterim })
  cbRef.current = { onFinal, onInterim }

  const stop = useCallback(() => {
    wantRef.current = false
    setListening(false)
    try { recRef.current?.stop() } catch { /* already stopped */ }
  }, [])

  const start = useCallback(() => {
    const SR = getRecognition()
    if (!SR) { setError('nosupport'); return }
    setError(null)
    wantRef.current = true
    setListening(true)

    const rec = new SR()
    rec.lang = LANG_TAGS[lang] || 'hr-HR'
    rec.continuous = true
    rec.interimResults = true
    rec.maxAlternatives = 1

    rec.onresult = (e) => {
      let interim = ''
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i]
        const t = r[0].transcript
        if (r.isFinal) cbRef.current.onFinal?.(t.trim())
        else interim += t
      }
      cbRef.current.onInterim?.(interim.trim())
    }
    rec.onerror = (e) => {
      // 'no-speech' and 'aborted' are routine; anything else we surface.
      if (e.error === 'not-allowed' || e.error === 'service-not-allowed') {
        setError('denied'); wantRef.current = false; setListening(false)
      } else if (e.error !== 'no-speech' && e.error !== 'aborted') {
        setError(e.error)
      }
    }
    rec.onend = () => {
      cbRef.current.onInterim?.('')
      if (wantRef.current) {
        // Chrome ends sessions on silence; keep going until the coach taps stop.
        try { rec.start() } catch { setListening(false); wantRef.current = false }
      } else {
        setListening(false)
      }
    }

    recRef.current = rec
    try { rec.start() } catch (err) { setError(String(err)); setListening(false); wantRef.current = false }
  }, [lang])

  // If the language flips mid-session, restart with the new lang.
  useEffect(() => {
    if (wantRef.current) { stop(); setTimeout(start, 150) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang])

  useEffect(() => () => { wantRef.current = false; try { recRef.current?.stop() } catch { /* noop */ } }, [])

  return { listening, start, stop, error, supported: speechSupported }
}

/** Text to speech via the browser. Picks a voice matching the language when one exists. */
export function speak(text, lang) {
  if (!text || typeof window === 'undefined' || !window.speechSynthesis) return false
  const synth = window.speechSynthesis
  synth.cancel()
  const u = new SpeechSynthesisUtterance(text)
  const tag = LANG_TAGS[lang] || 'en-US'
  u.lang = tag
  const voices = synth.getVoices()
  const v = voices.find(v => v.lang === tag) || voices.find(v => v.lang?.startsWith(tag.slice(0, 2)))
  if (v) u.voice = v
  u.rate = 0.95
  synth.speak(u)
  return true
}

export function hasVoiceFor(lang) {
  if (typeof window === 'undefined' || !window.speechSynthesis) return false
  const tag = LANG_TAGS[lang]
  return window.speechSynthesis.getVoices().some(v => v.lang?.startsWith(tag.slice(0, 2)))
}
