// Cloudflare Pages Function: POST /api/translate
// Env vars (set in Cloudflare Pages → Settings → Environment variables):
//   ANTHROPIC_API_KEY  (required)
//   APP_PASSCODE       (optional; if set, requests must send x-passcode header)
//   ANTHROPIC_MODEL    (optional; default claude-sonnet-5-5)
import { systemPrompt, userPrompt } from '../../shared/prompt.js'

const MAX_CHARS = 4000

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
  })
}

function extractJson(text) {
  try { return JSON.parse(text) } catch { /* fall through */ }
  const m = text.match(/\{[\s\S]*\}/)
  if (m) { try { return JSON.parse(m[0]) } catch { /* fall through */ } }
  return null
}

export async function onRequestPost({ request, env }) {
  if (env.APP_PASSCODE) {
    const pass = request.headers.get('x-passcode') || ''
    if (pass !== env.APP_PASSCODE) return json({ error: 'unauthorized' }, 401)
  }
  if (!env.ANTHROPIC_API_KEY) return json({ error: 'server missing ANTHROPIC_API_KEY' }, 500)

  let body
  try { body = await request.json() } catch { return json({ error: 'bad json' }, 400) }
  const text = String(body?.text || '').trim()
  const from = body?.from === 'en' ? 'en' : 'hr'
  const to = from === 'hr' ? 'en' : 'hr'
  if (!text) return json({ error: 'empty text' }, 400)
  if (text.length > MAX_CHARS) return json({ error: `text over ${MAX_CHARS} characters` }, 413)

  const payload = {
    model: env.ANTHROPIC_MODEL || 'claude-sonnet-5-5',
    max_tokens: 1200,
    system: [
      { type: 'text', text: systemPrompt(), cache_control: { type: 'ephemeral' } },
    ],
    messages: [
      { role: 'user', content: userPrompt({ text, from, to }) },
    ],
  }

  const call = async (body) => fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify(body),
  })

  let res
  try {
    res = await call(payload)
    // Some accounts reject cache_control (prompt caching not enabled). Retry once with a plain system string.
    if (res.status === 400) {
      const firstDetail = await res.text().catch(() => '')
      res = await call({ ...payload, system: systemPrompt() })
      if (!res.ok) {
        const detail = await res.text().catch(() => '')
        return json({ error: `translation service error ${res.status}`, detail: (detail || firstDetail).slice(0, 400) }, 502)
      }
    }
  } catch (e) {
    return json({ error: `upstream unreachable: ${e.message}` }, 502)
  }

  if (!res.ok) {
    const detail = await res.text().catch(() => '')
    return json({ error: `translation service error ${res.status}`, detail: detail.slice(0, 400) }, 502)
  }

  const data = await res.json()
  const raw = (data.content || []).filter(c => c.type === 'text').map(c => c.text).join('\n')
  const parsed = extractJson(raw)
  if (!parsed || typeof parsed.translation !== 'string') {
    // Model did not return JSON; return the raw text so the coach still gets something.
    return json({ translation: raw.trim(), notes: [], alternatives: [], warning: 'unstructured' })
  }
  return json({
    translation: parsed.translation.trim(),
    notes: Array.isArray(parsed.notes) ? parsed.notes.slice(0, 5) : [],
    alternatives: Array.isArray(parsed.alternatives) ? parsed.alternatives.slice(0, 2) : [],
    usage: data.usage ? { in: data.usage.input_tokens, out: data.usage.output_tokens, cached: data.usage.cache_read_input_tokens || 0 } : undefined,
  })
}

export async function onRequestOptions() {
  return new Response(null, { status: 204 })
}
