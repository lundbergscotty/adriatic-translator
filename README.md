# Adriatic Coaching Translator

Croatian ↔ English translator for triathlon coaching. Speak or type; the translation keeps every set, zone, pace and watt intact. Styled after adriaticcoaching.com.

## Stack
- React + Vite + Tailwind (frontend, `src/`)
- Cloudflare Pages Function (`functions/api/translate.js`) calling the Claude API
- Shared glossary + prompt (`shared/`) used by the function
- Web Speech API for speech-to-text and text-to-speech (Chrome, Edge, Safari)

## Local dev
1. `npm install`
2. `cp .dev.vars.example .dev.vars` and fill in `ANTHROPIC_API_KEY` and `APP_PASSCODE`
3. Terminal A: `npm run build && npx wrangler pages dev dist` (serves the function on :8788)
4. Terminal B: `npm run dev` (Vite on :5173, proxies `/api` to :8788)

## Deploy (Cloudflare Pages)
1. Push this repo to GitHub
2. Cloudflare dashboard → Workers & Pages → Create → Pages → Connect to Git → pick the repo
3. Build command: `npm run build`  ·  Build output directory: `dist`
4. Settings → Environment variables (Production): `ANTHROPIC_API_KEY`, `APP_PASSCODE`
5. Deploy. Functions in `functions/` are picked up automatically.

## Glossary
`shared/glossary.json` holds `terms` (hr, en, cat, note) and `phrases` (hr, en). Edit and redeploy; the system prompt is rebuilt from it on each cold start and cached by the API across requests.
