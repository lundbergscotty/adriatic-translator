const PASS_KEY = 'ac_passcode'

export function getPasscode() {
  try { return localStorage.getItem(PASS_KEY) || '' } catch { return '' }
}
export function setPasscode(v) {
  try { localStorage.setItem(PASS_KEY, v) } catch { /* private mode */ }
}

/**
 * POST /api/translate
 * body: { text, from: 'hr'|'en', to: 'hr'|'en' }
 * returns: { translation, notes: [{term, meaning}], alternatives: [string] }
 * throws Error with .status on failure (401 = bad passcode)
 */
export async function translate({ text, from, to, signal }) {
  const res = await fetch('/api/translate', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-passcode': getPasscode() },
    body: JSON.stringify({ text, from, to }),
    signal,
  })
  if (!res.ok) {
    let msg = `HTTP ${res.status}`
    let detail = ''
    try {
      const j = await res.json()
      if (j?.error) msg = j.error
      if (j?.detail) {
        // Upstream detail is usually JSON like {"error":{"message":"..."}}; pull the message out.
        try { const d = JSON.parse(j.detail); detail = d?.error?.message || j.detail } catch { detail = j.detail }
      }
    } catch { /* not json */ }
    const err = new Error(detail ? `${msg}: ${detail}` : msg); err.status = res.status; throw err
  }
  return res.json()
}
