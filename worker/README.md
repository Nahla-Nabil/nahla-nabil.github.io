# Ask Nahla: agent backend

This folder is not part of the static site GitHub Pages serves (that's just
`index.html`, `work.html`, `about.html`, `contact.html`, `style.css`,
`agent.css`, `script.js`, `agent.js`, and `assets/` at the repo root). It is a
separate, tiny backend: a Cloudflare Worker that the front-end widget
(`agent.js`, one level up) calls over HTTPS. GitHub Pages only serves static
files, it cannot run this, which is why it lives here instead and deploys
somewhere else entirely.

## Why this exists as a separate piece

The widget needs a real AI model to answer open-ended questions about Nahla.
That means an Anthropic API key. An API key must never be pasted into
`agent.js` or any other file in this repo, this repo is public, and anyone
could read the source and use your key on your bill. This Worker is the one
place the key lives, inside Cloudflare's encrypted secret store, never in a
committed file.

## What you need before deploying

1. **A Cloudflare account** (free tier is enough). Sign up at
   [dash.cloudflare.com](https://dash.cloudflare.com) if you don't have one.
2. **An Anthropic API key**, from
   [console.anthropic.com](https://console.anthropic.com), not the same
   thing as a claude.ai chat login. API usage is billed separately
   (pay-as-you-go) and needs its own billing setup there. For a low-traffic
   personal-site widget with short capped replies, cost should be small, but
   it is not free, keep an eye on usage in the console.

## Deploy steps

Run these from inside this `worker/` folder.

1. Install Wrangler (Cloudflare's CLI), if you don't have it:
   ```bash
   npm install -g wrangler
   ```
2. Log in, this opens a browser window for you to approve:
   ```bash
   wrangler login
   ```
3. Store your Anthropic API key as an encrypted secret (you'll be prompted
   to paste it, it is never written to a file):
   ```bash
   wrangler secret put ANTHROPIC_API_KEY
   ```
4. Deploy:
   ```bash
   wrangler deploy
   ```
   This prints a URL that looks like
   `https://nahla-agent.<your-subdomain>.workers.dev`.
5. Copy that URL into `agent.js` (one folder up), at the top:
   ```js
   var AGENT_ENDPOINT = ""; // paste the Worker URL here
   ```
6. Commit and push `agent.js`. The widget is now live.

## Keeping it in sync

- **CORS**: `agent-worker.js` only answers requests from origins listed in
  `ALLOWED_ORIGINS` at the top of the file (currently just
  `https://nahla-nabil.github.io`). Add a local dev server's origin
  temporarily while testing (e.g. `http://localhost:8000`), and remove it
  again afterward.
- **Facts the agent can answer with**: `SYSTEM_PROMPT` in `agent-worker.js`
  is the model's entire source of truth about Nahla. If the site's content
  changes (a new case study, a real booking link, a real CV link), update
  this prompt to match, then re-run `wrangler deploy`. The prompt is written
  to make the model say "I don't have that detail yet, email her" rather
  than guess when asked something outside this list, keep it that way.
- **Cost/abuse guardrails already in place**: messages are capped at 500
  characters, conversation history sent per request is capped at 6 turns,
  and replies are capped at 300 tokens. If this widget ever gets meaningful
  traffic, consider adding Cloudflare's rate limiting on top.
- **Model**: set to a small, fast model (`claude-haiku-4-5-20251001`) since
  this is a grounded FAQ widget, not open-ended reasoning. Change the
  `MODEL` constant in `agent-worker.js` if you want smarter (and pricier)
  answers later.
