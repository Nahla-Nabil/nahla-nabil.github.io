// ==========================================================================
// "Ask Nahla" agent backend, a Cloudflare Worker.
//
// This is the only place the Anthropic API key ever touches: it lives in
// Cloudflare's encrypted secret store (set via `wrangler secret put`), never
// in this file and never in the static site's JavaScript. See README.md in
// this folder for the full deploy steps.
//
// Request:  POST { message: string, history?: [{role, content}, ...] }
// Response: { reply: string }
// ==========================================================================

// Only these origins get a CORS-approved response. Add a local dev server's
// origin here (e.g. http://localhost:8000) while testing, remove it again
// before you consider this "done".
const ALLOWED_ORIGINS = ["https://nahla-nabil.github.io"];

// Keep this cheap and fast for a simple grounded FAQ widget. Swap to
// "claude-sonnet-5" if answers need to get noticeably smarter later.
const MODEL = "claude-haiku-4-5-20251001";

const MAX_MESSAGE_LENGTH = 500;
const MAX_HISTORY_ENTRIES = 12; // 6 user/assistant turns
const MAX_TOKENS = 300;

// ---- The only source of truth the model is allowed to answer from. ----
// Keep this in sync with what the site itself says. If it is not written
// here, the model is instructed to say it does not know, rather than guess.
const SYSTEM_PROMPT = `You are answering questions on a visitor-facing widget on Nahla Nabil's
personal portfolio site, speaking in first person as Nahla. You are clearly disclosed elsewhere
on the page as an AI assistant, not literally Nahla, so do not claim to be a human or deny being
an AI if asked directly.

Answer only using the facts below. If something is asked that is not covered here, say plainly
that this detail is not public yet and suggest emailing nahla.nabil.52@gmail.com or booking a
call, rather than guessing or inventing a plausible-sounding answer. Never invent metrics, dates,
company names, or outcomes beyond what is listed.

Keep answers short, 2 to 4 sentences, conversational: they are read aloud by speech synthesis.

FACTS ABOUT NAHLA:
- Backend AI Engineering intern in the FlyRank AI Fluency program, based in Muharraq, Bahrain.
- Core claim: "I build backend systems that make AI products reliable in production."
- Focus: the backend side of AI products, retrieval, routing, auth, and failure handling, the
  parts that decide whether a system holds up once it leaves a demo.
- Shado: a retrieval-augmented generation (RAG) pipeline she built solo. It retrieves relevant
  evidence, reranks it before anything reaches the model, then grounds its answer directly in
  that reranked evidence. Awarded Gold at the Kanz AI Hackathon, a Guinness World
  Records-associated event with over 13,000 participants.
- DOO / CNCT: during an internship at DOO, a customer messaging platform, she worked on project
  CNCT, building human-handoff detection, smart ticket routing, sentiment analysis, and a
  semantic FAQ engine backed by PostgreSQL with pgvector. The code is confidential.
- FastAPI To-Do API: an open-source CRUD API (github.com/Nahla-Nabil/todo-api). Moved across
  three storage engines (in-memory, SQLite, then containerized Postgres) without changing a
  route, because every line of SQL lives in one repository module. Auth via Supabase, so the
  app itself never hashes a password or signs a token. Every query is parameterized. Data
  persists in a named Docker volume. Stack: FastAPI, PostgreSQL, Redis, Docker, Supabase Auth.
- Two published IEEE papers: "Hybrid Edge-Cloud Federated Learning" and "Random Forest Weight
  Auditing for Gulf Sustainability Indices".
- Skills: Python, FastAPI, PostgreSQL, Redis, Docker, Supabase Auth, retrieval-augmented
  generation, semantic search, pgvector, federated learning, random forests, REST API design.
- How she works: direct, technical, research-minded, no fluff.
- Contact: email nahla.nabil.52@gmail.com, GitHub github.com/Nahla-Nabil. A booking link and
  public CV link are not set up yet, if asked, say so and point to email instead.`;

export default {
  async fetch(request, env) {
    const origin = request.headers.get("Origin") || "";
    const corsHeaders = buildCorsHeaders(origin);

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    if (request.method !== "POST") {
      return jsonResponse({ error: "Use POST." }, 405, corsHeaders);
    }

    if (!ALLOWED_ORIGINS.includes(origin)) {
      return jsonResponse({ error: "Origin not allowed." }, 403, corsHeaders);
    }

    let body;
    try {
      body = await request.json();
    } catch (err) {
      return jsonResponse({ error: "Invalid JSON body." }, 400, corsHeaders);
    }

    const message = typeof body.message === "string" ? body.message.slice(0, MAX_MESSAGE_LENGTH) : "";
    if (!message.trim()) {
      return jsonResponse({ error: "Missing message." }, 400, corsHeaders);
    }

    const history = Array.isArray(body.history) ? body.history.slice(-MAX_HISTORY_ENTRIES) : [];
    const messages = [
      ...history.filter(isValidTurn).map((turn) => ({ role: turn.role, content: turn.content })),
      { role: "user", content: message }
    ];

    if (!env.ANTHROPIC_API_KEY) {
      return jsonResponse(
        { error: "Server is not configured yet (missing ANTHROPIC_API_KEY secret)." },
        500,
        corsHeaders
      );
    }

    let anthropicResponse;
    try {
      anthropicResponse = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-api-key": env.ANTHROPIC_API_KEY,
          "anthropic-version": "2023-06-01"
        },
        body: JSON.stringify({
          model: MODEL,
          max_tokens: MAX_TOKENS,
          system: SYSTEM_PROMPT,
          messages
        })
      });
    } catch (err) {
      return jsonResponse({ error: "Could not reach the model provider." }, 502, corsHeaders);
    }

    if (!anthropicResponse.ok) {
      return jsonResponse({ error: "Model provider error." }, 502, corsHeaders);
    }

    const data = await anthropicResponse.json();
    const reply = data && data.content && data.content[0] && data.content[0].text
      ? data.content[0].text
      : "Sorry, I couldn't put together an answer. Try emailing Nahla directly.";

    return jsonResponse({ reply }, 200, corsHeaders);
  }
};

function isValidTurn(turn) {
  return turn && (turn.role === "user" || turn.role === "assistant") && typeof turn.content === "string";
}

function buildCorsHeaders(origin) {
  const headers = {
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type"
  };
  if (ALLOWED_ORIGINS.includes(origin)) {
    headers["Access-Control-Allow-Origin"] = origin;
  }
  return headers;
}

function jsonResponse(payload, status, extraHeaders) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: Object.assign({ "Content-Type": "application/json" }, extraHeaders || {})
  });
}
