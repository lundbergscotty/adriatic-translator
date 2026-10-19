import { useCallback, useEffect, useRef, useState } from 'react'
import { useSpeech, speak, hasVoiceFor } from './lib/useSpeech.js'
import { translate, getPasscode, setPasscode } from './lib/api.js'

const UI = {
  hr: {
    title: 'PREVODITELJ',
    subtitle: 'Triatlon · Hrvatski ↔ English',
    speak: 'GOVORI',
    stop: 'STANI',
    listening: 'Slušam…',
    translateBtn: 'PREVEDI',
    clear: 'OBRIŠI',
    copy: 'KOPIRAJ',
    copied: 'KOPIRANO',
    listen: 'POSLUŠAJ',
    swap: 'ZAMIJENI SMJER',
    sourcePh: 'Pritisni GOVORI i pričaj, ili tipkaj ovdje…',
    outputPh: 'Prijevod će se pojaviti ovdje.',
    notes: 'Pojmovi',
    alternatives: 'Alternativa',
    translating: 'Prevodim…',
    noSpeech: 'Govor nije podržan u ovom pregledniku. Koristi Chrome, Edge ili Safari.',
    denied: 'Mikrofon je blokiran. Dozvoli pristup mikrofonu u postavkama preglednika.',
    passTitle: 'Lozinka',
    passHint: 'Upiši lozinku koju si dobio od Scotta.',
    passBtn: 'NASTAVI',
    passBad: 'Pogrešna lozinka.',
    hr: 'HRVATSKI', en: 'ENGLISH',
    autoOn: 'Auto-prijevod: UKLJUČEN', autoOff: 'Auto-prijevod: ISKLJUČEN',
  },
  en: {
    title: 'TRANSLATOR',
    subtitle: 'Triathlon · Croatian ↔ English',
    speak: 'SPEAK',
    stop: 'STOP',
    listening: 'Listening…',
    translateBtn: 'TRANSLATE',
    clear: 'CLEAR',
    copy: 'COPY',
    copied: 'COPIED',
    listen: 'LISTEN',
    swap: 'SWAP DIRECTION',
    sourcePh: 'Press SPEAK and talk, or type here…',
    outputPh: 'Your translation will appear here.',
    notes: 'Terms',
    alternatives: 'Alternative',
    translating: 'Translating…',
    noSpeech: 'Speech is not supported in this browser. Use Chrome, Edge or Safari.',
    denied: 'Microphone blocked. Allow microphone access in your browser settings.',
    passTitle: 'Passcode',
    passHint: 'Enter the passcode Scott gave you.',
    passBtn: 'CONTINUE',
    passBad: 'Wrong passcode.',
    hr: 'CROATIAN', en: 'ENGLISH',
    autoOn: 'Auto-translate: ON', autoOff: 'Auto-translate: OFF',
  },
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
  const [needPass, setNeedPass] = useState(!getPasscode())
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

  const { listening, start, stop, error: speechErr, supported } = useSpeech({
    lang: from, onFinal, onInterim: setInterim,
  })

  function toggleMic() {
    if (listening) { stop(); if (auto) runTranslate() }
    else { setErr(null); start() }
  }

  function swap() {
    if (listening) stop()
    const prevResult = result?.translation || ''
    setFrom(to)
    // Carry the translation back as the new source so the coach can go back and forth.
    setSource(prevResult)
    setResult(null)
    setInterim('')
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

  return (
    <div className="min-h-screen flex flex-col">
      {/* Fixed blue header, 60px, like adriaticcoaching.com */}
      <header className="fixed top-0 left-0 right-0 h-[60px] bg-adriatic z-20">
        <div className="max-w-[1200px] mx-auto h-full px-4 flex items-center justify-between">
          <div className="flex items-baseline gap-3 text-white">
            <span className="font-bold uppercase tracking-wide text-[15px] sm:text-[17px]">Adriatic Coaching</span>
            <span className="font-bold uppercase text-[12px] sm:text-[13px] text-adriatic-yellow">{t.title}</span>
          </div>
          <nav className="flex items-center gap-3 text-white font-bold uppercase text-[13px]">
            <button onClick={() => setUi('hr')} className={`cursor-pointer ${ui === 'hr' ? 'text-adriatic-yellow' : 'hover:text-black'}`}>HR</button>
            <span className="opacity-50">|</span>
            <button onClick={() => setUi('en')} className={`cursor-pointer ${ui === 'en' ? 'text-adriatic-yellow' : 'hover:text-black'}`}>ENG</button>
          </nav>
        </div>
      </header>

      <main className="flex-1 w-full max-w-[1000px] mx-auto px-4 pt-[90px] pb-16">
        <p className="text-[13px] uppercase text-muted font-bold mb-6">{t.subtitle}</p>

        {/* Direction bar */}
        <div className="flex items-center gap-3 mb-5">
          <span className="font-bold uppercase text-[14px]">{t[from]}</span>
          <button onClick={swap} title={t.swap} aria-label={t.swap}
            className="ac-btn h-9 px-3 text-[14px]">⇄</button>
          <span className="font-bold uppercase text-[14px]">{t[to]}</span>
          <button onClick={() => setAuto(a => !a)}
            className="ml-auto text-[12px] uppercase font-bold text-muted hover:text-adriatic-hover cursor-pointer">
            {auto ? t.autoOn : t.autoOff}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Source */}
          <section className="flex flex-col border-t border-rule pt-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-[16px] font-bold uppercase">{t[from]}</h2>
              <button onClick={clearAll} className="text-[12px] uppercase font-bold text-muted hover:text-adriatic-hover cursor-pointer">{t.clear}</button>
            </div>

            <button
              onClick={toggleMic}
              disabled={!supported}
              className={`ac-btn w-full h-[84px] text-[22px] mb-3 ${listening ? 'ac-listening' : ''}`}
            >
              <span className="mr-3 text-[26px]" aria-hidden>{listening ? '■' : '🎤'}</span>
              {listening ? t.stop : t.speak}
            </button>
            {listening && <p className="text-[13px] text-adriatic-hover font-bold mb-2 uppercase">{t.listening}</p>}

            <textarea
              value={interim ? (source ? source + ' ' : '') + interim : source}
              onChange={e => { setSource(e.target.value); setInterim('') }}
              placeholder={t.sourcePh}
              rows={8}
              lang={from}
              className="w-full border border-muted p-3 text-[17px] leading-[1.5] resize-y min-h-[180px]"
            />

            <div className="flex gap-3 mt-3">
              <button onClick={() => runTranslate()} disabled={busy || !source.trim()} className="ac-btn h-[50px] px-6 text-[16px] flex-1">
                {busy ? t.translating : t.translateBtn}
              </button>
            </div>

            {!supported && <p className="text-[13px] text-red-600 mt-3">{t.noSpeech}</p>}
            {speechErr === 'denied' && <p className="text-[13px] text-red-600 mt-3">{t.denied}</p>}
            {speechErr && speechErr !== 'denied' && speechErr !== 'nosupport' && <p className="text-[13px] text-red-600 mt-3">{speechErr}</p>}
          </section>

          {/* Output */}
          <section className="flex flex-col border-t border-rule pt-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-[16px] font-bold uppercase">{t[to]}</h2>
              <div className="flex gap-4">
                <button onClick={copyOut} disabled={!result?.translation} className="text-[12px] uppercase font-bold text-muted hover:text-adriatic-hover cursor-pointer disabled:opacity-40">
                  {copied ? t.copied : t.copy}
                </button>
                <button onClick={() => speak(result?.translation, to)} disabled={!result?.translation || !canSpeakOut}
                  title={!hasVoiceFor(to) ? 'No voice installed for this language' : ''}
                  className="text-[12px] uppercase font-bold text-muted hover:text-adriatic-hover cursor-pointer disabled:opacity-40">
                  🔊 {t.listen}
                </button>
              </div>
            </div>

            <div lang={to} className={`w-full border border-muted p-3 text-[19px] leading-[1.5] min-h-[264px] whitespace-pre-wrap ${busy ? 'opacity-50' : ''}`}>
              {result?.translation || <span className="text-muted text-[16px]">{t.outputPh}</span>}
            </div>

            {err && <p className="text-[13px] text-red-600 mt-3">{err}</p>}

            {result?.notes?.length > 0 && (
              <div className="mt-4">
                <p className="text-[12px] uppercase font-bold text-muted mb-1">{t.notes}</p>
                <ul className="text-[14px] leading-[1.6]">
                  {result.notes.map((n, i) => (
                    <li key={i}><span className="font-bold">{n.term}</span> → {n.meaning}</li>
                  ))}
                </ul>
              </div>
            )}
            {result?.alternatives?.length > 0 && (
              <div className="mt-4">
                <p className="text-[12px] uppercase font-bold text-muted mb-1">{t.alternatives}</p>
                <ul className="text-[14px] leading-[1.6]">
                  {result.alternatives.map((a, i) => <li key={i}>{a}</li>)}
                </ul>
              </div>
            )}
          </section>
        </div>
      </main>

      <footer className="text-center text-[13px] text-[#333] pb-10">
        <hr className="border-rule max-w-[1200px] mx-auto mb-4" />
        AdriaticCoaching.com · {new Date().getFullYear()}
      </footer>

      {/* Passcode gate */}
      {needPass && (
        <div className="fixed inset-0 bg-black/40 z-30 flex items-center justify-center px-4">
          <form onSubmit={savePass} className="bg-white w-full max-w-[380px] p-6 border border-rule">
            <h3 className="font-bold uppercase text-[16px] mb-2">{t.passTitle}</h3>
            <p className="text-[14px] text-muted mb-4">{t.passHint}</p>
            <input autoFocus type="password" value={passInput} onChange={e => setPassInput(e.target.value)}
              className="w-full h-[50px] border border-muted px-3 text-[16px] mb-3" />
            {passBad && <p className="text-[13px] text-red-600 mb-3">{t.passBad}</p>}
            <button type="submit" className="ac-btn w-full h-[50px] text-[16px]">{t.passBtn}</button>
          </form>
        </div>
      )}
    </div>
  )
}
