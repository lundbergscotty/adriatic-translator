import { useCallback, useEffect, useRef, useState } from 'react'
import Orb from './components/Orb.jsx'
import { useSpeech, speak, hasVoiceFor } from './lib/useSpeech.js'
import { useMicLevel } from './lib/useMicLevel.js'
import { translate, setPasscode } from './lib/api.js'

const UI = {
  hr: {
    brand: 'Adriatic Coaching',
    app: 'Prevoditelj',
    tapToTalk: 'Dodirni i govori hrvatski',
    tapToTalkEn: 'Dodirni i govori engleski',
    listening: 'Slušam. Dodirni ponovno kad završiš.',
    translating: 'Prevodim',
    youSaid: 'Rekao si',
    translation: 'Prijevod',
    typeHere: 'Ili tipkaj ovdje',
    emptyOut: 'Prijevod se pojavi ovdje čim završiš govoriti.',
    translateBtn: 'Prevedi',
    clear: 'Obriši',
    copy: 'Kopiraj',
    copied: 'Kopirano',
    listen: 'Poslušaj',
    swap: 'Zamijeni smjer',
    terms: 'Pojmovi',
    alternatives: 'Drugo moguće značenje',
    auto: 'Automatski prijevod',
    noSpeech: 'Ovaj preglednik ne podržava govor. Otvori stranicu u Chromeu, Edgeu ili Safariju.',
    denied: 'Mikrofon je blokiran. Dozvoli mikrofon u postavkama preglednika i pokušaj ponovno.',
    passTitle: 'Lozinka',
    passHint: 'Upiši lozinku koju si dobio od Scotta.',
    passBtn: 'Nastavi',
    passBad: 'Lozinka nije točna.',
    langs: { hr: 'Hrvatski', en: 'English' },
  },
  en: {
    brand: 'Adriatic Coaching',
    app: 'Translator',
    tapToTalk: 'Tap and talk in English',
    tapToTalkEn: 'Tap and talk in Croatian',
    listening: 'Listening. Tap again when you are done.',
    translating: 'Translating',
    youSaid: 'You said',
    translation: 'Translation',
    typeHere: 'Or type here',
    emptyOut: 'The translation appears here as soon as you stop talking.',
    translateBtn: 'Translate',
    clear: 'Clear',
    copy: 'Copy',
    copied: 'Copied',
    listen: 'Listen',
    swap: 'Swap direction',
    terms: 'Terms',
    alternatives: 'Other possible reading',
    auto: 'Auto-translate',
    noSpeech: 'This browser does not support speech. Open the page in Chrome, Edge or Safari.',
    denied: 'Microphone is blocked. Allow the microphone in your browser settings and try again.',
    passTitle: 'Passcode',
    passHint: 'Enter the passcode Scott gave you.',
    passBtn: 'Continue',
    passBad: 'That passcode is not right.',
    langs: { hr: 'Croatian', en: 'English' },
  },
}

const Icon = {
  swap: (p) => (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <path d="M4 7h13M13 3l4 4-4 4" /><path d="M20 17H7M11 13l-4 4 4 4" />
    </svg>
  ),
  copy: (p) => (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <rect x="9" y="9" width="11" height="11" rx="2" /><path d="M5 15V6a2 2 0 0 1 2-2h9" />
    </svg>
  ),
  speaker: (p) => (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <path d="M4 10v4h4l5 4V6L8 10H4z" /><path d="M16 9a4 4 0 0 1 0 6" /><path d="M18.5 6.5a8 8 0 0 1 0 11" />
    </svg>
  ),
  check: (p) => (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <path d="M5 12l4 4L19 7" />
    </svg>
  ),
}

export default function App() {
  const [ui, setUi] = useState(() => localStorage.getItem('ac_ui') || 'hr')
  const [from, setFrom] = useState('hr')
  const to = from === 'hr' ? 'en' : 'hr'
  const t = UI[ui]

  const [source, setSource] = useState('')
  const [interim, setInterim] = useState('')
  const [result, setResult] = useState(null)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState(null)
  const [auto, setAuto] = useState(true)
  const [copied, setCopied] = useState(false)
  // Only ask for a passcode if the server rejects a request (APP_PASSCODE set in Cloudflare).
  const [needPass, setNeedPass] = useState(false)
  const [passInput, setPassInput] = useState('')
  const [passBad, setPassBad] = useState(false)

  const abortRef = useRef(null)
  const debounceRef = useRef(null)
  const sourceRef = useRef('')
  sourceRef.current = source

  useEffect(() => { localStorage.setItem('ac_ui', ui) }, [ui])

  const runTranslate = useCallback(async (text) => {
    const clean = (text ?? sourceRef.current).trim()
    if (!clean) return
    abortRef.current?.abort()
    const ctrl = new AbortController()
    abortRef.current = ctrl
    setBusy(true); setErr(null)
    try {
      const r = await translate({ text: clean, from, to, signal: ctrl.signal })
      setResult(r)
    } catch (e) {
      if (e.name === 'AbortError') return
      if (e.status === 401) { setNeedPass(true); setPassBad(true) }
      else setErr(e.message)
    } finally {
      if (abortRef.current === ctrl) setBusy(false)
    }
  }, [from, to])

  const scheduleAuto = useCallback((text) => {
    if (!auto) return
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => runTranslate(text), 900)
  }, [auto, runTranslate])

  const onFinal = useCallback((chunk) => {
    if (!chunk) return
    setSource(prev => {
      const next = (prev ? prev.replace(/\s+$/, '') + ' ' : '') + chunk
      scheduleAuto(next)
      return next
    })
  }, [scheduleAuto])

  const { listening, start, stop, error: speechErr, supported } = useSpeech({ lang: from, onFinal, onInterim: setInterim })
  const level = useMicLevel(listening)

  function toggleMic() {
    if (listening) { stop(); if (auto) runTranslate() }
    else { setErr(null); start() }
  }

  function swap() {
    if (listening) stop()
    const prev = result?.translation || ''
    setFrom(to); setSource(prev); setResult(null); setInterim('')
  }

  function clearAll() {
    if (listening) stop()
    clearTimeout(debounceRef.current)
    abortRef.current?.abort()
    setSource(''); setInterim(''); setResult(null); setErr(null); setBusy(false)
  }

  async function copyOut() {
    if (!result?.translation) return
    try { await navigator.clipboard.writeText(result.translation); setCopied(true); setTimeout(() => setCopied(false), 1500) } catch { /* ignore */ }
  }

  function savePass(e) {
    e.preventDefault()
    setPasscode(passInput.trim())
    setNeedPass(false); setPassBad(false)
    if (sourceRef.current.trim()) runTranslate()
  }

  const canSpeakOut = typeof window !== 'undefined' && !!window.speechSynthesis
  const liveText = interim ? (source ? source + ' ' : '') + interim : source
  const statusLine = listening ? t.listening : (from === 'hr' ? (ui === 'hr' ? t.tapToTalk : t.tapToTalkEn) : (ui === 'hr' ? t.tapToTalkEn : t.tapToTalk))

  return (
    <div className="min-h-screen flex flex-col">
      <header className="w-full">
        <div className="max-w-[760px] mx-auto px-5 h-16 flex items-center justify-between">
          <div className="flex items-baseline gap-2">
            <span className="text-blue font-extrabold tracking-tight text-[17px]">{t.brand}</span>
            <span className="font-semibold text-[15px]">{t.app}</span>
          </div>
          <div className="seg" role="group" aria-label="Interface language">
            <button onClick={() => setUi('hr')} aria-pressed={ui === 'hr'}>HR</button>
            <button onClick={() => setUi('en')} aria-pressed={ui === 'en'}>EN</button>
          </div>
        </div>
      </header>

      <main className="flex-1 w-full max-w-[760px] mx-auto px-5 pb-20">
        {/* Hero: the orb is the control */}
        <section className="flex flex-col items-center pt-6 sm:pt-10">
          <button
            onClick={toggleMic}
            disabled={!supported}
            aria-pressed={listening}
            aria-label={statusLine}
            className={`orb-wrap cursor-pointer disabled:cursor-not-allowed ${listening ? 'listening' : ''}`}
          >
            <Orb listening={listening} level={level} size={172} />
          </button>
          <p className={`mt-7 text-[16px] font-medium ${listening ? 'text-blue-deep' : 'text-muted'}`} aria-live="polite">
            {busy && !listening ? `${t.translating}…` : statusLine}
          </p>

          {/* Direction */}
          <div className="mt-5 flex items-center gap-2">
            <span className="text-[15px] font-semibold">{t.langs[from]}</span>
            <button onClick={swap} className="btn btn-ghost h-9 w-9" title={t.swap} aria-label={t.swap}>
              <Icon.swap />
            </button>
            <span className="text-[15px] font-semibold">{t.langs[to]}</span>
          </div>

          {!supported && <p className="mt-4 text-[14px] text-red-600 text-center max-w-[420px]">{t.noSpeech}</p>}
          {speechErr === 'denied' && <p className="mt-4 text-[14px] text-red-600 text-center max-w-[420px]">{t.denied}</p>}
          {speechErr && speechErr !== 'denied' && speechErr !== 'nosupport' && <p className="mt-4 text-[14px] text-red-600 text-center">{speechErr}</p>}
        </section>

        {/* Conversation panel */}
        <section className="panel mt-9 overflow-hidden">
          {/* Source */}
          <div className="px-6 pt-5 pb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[13px] font-semibold text-muted">{t.youSaid}</span>
              {(source || result) && (
                <button onClick={clearAll} className="btn btn-text text-[13px] font-semibold">{t.clear}</button>
              )}
            </div>
            <textarea
              value={liveText}
              onChange={e => { setSource(e.target.value); setInterim('') }}
              placeholder={t.typeHere}
              rows={3}
              lang={from}
              className={`w-full resize-none bg-transparent text-[18px] leading-[1.55] placeholder:text-[#9AA5B1] ${interim ? 'text-blue-deep' : 'text-ink'}`}
            />
            <div className="flex items-center justify-between mt-1">
              <label className="flex items-center gap-2 text-[13px] text-muted cursor-pointer select-none">
                <input type="checkbox" checked={auto} onChange={e => setAuto(e.target.checked)} className="accent-[#00AFF0] w-4 h-4" />
                {t.auto}
              </label>
              <button onClick={() => runTranslate()} disabled={busy || !source.trim()} className="btn btn-primary h-10 px-5 text-[14px]">
                {busy ? `${t.translating}…` : t.translateBtn}
              </button>
            </div>
          </div>

          <div className="h-px bg-line mx-6" />

          {/* Translation */}
          <div className="px-6 pt-5 pb-6 bg-mist/40">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[13px] font-semibold text-muted">{t.translation}</span>
              <div className="flex items-center gap-4">
                <button onClick={copyOut} disabled={!result?.translation} className="btn btn-text text-[13px] font-semibold">
                  {copied ? <Icon.check /> : <Icon.copy />} {copied ? t.copied : t.copy}
                </button>
                <button onClick={() => speak(result?.translation, to)} disabled={!result?.translation || !canSpeakOut}
                  title={!hasVoiceFor(to) ? 'No voice installed for this language' : ''}
                  className="btn btn-text text-[13px] font-semibold">
                  <Icon.speaker /> {t.listen}
                </button>
              </div>
            </div>
            <div lang={to} className={`min-h-[96px] text-[24px] sm:text-[26px] leading-[1.4] font-semibold tracking-tight whitespace-pre-wrap transition-opacity ${busy ? 'opacity-40' : ''}`}>
              {result?.translation || <span className="text-[16px] font-medium text-[#9AA5B1]">{t.emptyOut}</span>}
            </div>

            {err && <p className="mt-3 text-[14px] text-red-600">{err}</p>}

            {result?.notes?.length > 0 && (
              <div className="mt-5">
                <p className="text-[13px] font-semibold text-muted mb-2">{t.terms}</p>
                <div className="flex flex-wrap gap-2">
                  {result.notes.map((n, i) => (
                    <span key={i} className="inline-flex items-center gap-1.5 rounded-full bg-white border border-line px-3 py-1 text-[13px]">
                      <span className="font-semibold">{n.term}</span>
                      <span className="text-muted">→</span>
                      <span>{n.meaning}</span>
                    </span>
                  ))}
                </div>
              </div>
            )}
            {result?.alternatives?.length > 0 && (
              <div className="mt-5">
                <p className="text-[13px] font-semibold text-muted mb-1">{t.alternatives}</p>
                <ul className="text-[15px] leading-[1.6]">
                  {result.alternatives.map((a, i) => <li key={i}>{a}</li>)}
                </ul>
              </div>
            )}
          </div>
        </section>
      </main>

      <footer className="text-center text-[13px] text-muted pb-8">
        adriaticcoaching.com
      </footer>

      {needPass && (
        <div className="fixed inset-0 bg-blue-ink/50 backdrop-blur-sm z-30 flex items-center justify-center px-5">
          <form onSubmit={savePass} className="panel w-full max-w-[380px] p-7">
            <h3 className="font-bold text-[18px] mb-1">{t.passTitle}</h3>
            <p className="text-[14px] text-muted mb-5">{t.passHint}</p>
            <input autoFocus type="password" value={passInput} onChange={e => setPassInput(e.target.value)}
              className="w-full h-12 rounded-full border border-line bg-mist px-4 text-[16px] mb-3" />
            {passBad && <p className="text-[13px] text-red-600 mb-3">{t.passBad}</p>}
            <button type="submit" className="btn btn-primary w-full h-12 text-[15px]">{t.passBtn}</button>
          </form>
        </div>
      )}
    </div>
  )
}
