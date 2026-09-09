# nahla-nabil.github.io

Personal portfolio site for Nahla Nabil, Backend AI Engineering Intern (FlyRank AI Fluency
program, assignment PF-04). Four static HTML pages, no build step, no framework, deploying
straight from this repo via GitHub Pages, plus one small optional backend (see "Ask Nahla"
below) for a voice-enabled AI agent widget.

## Files

- **`index.html`** (Home): hero with the core claim, the Shado retrieval pipeline diagram, and
  a 3-card preview linking into the full case studies and publications.
- **`work.html`**: the four case studies in full: Shado, the DOO/CNCT agent assignment fix, the
  FastAPI To-Do API (with a real Swagger screenshot), and the IEEE publications.
- **`about.html`**: bio, a "how I work" line, the skills list, and the publications list.
- **`contact.html`**: email, booking link, LinkedIn, GitHub, and CV, each as its own card.
- **`style.css`**: all site styling. Plain CSS, no Tailwind or framework, using CSS custom
  properties (the `:root { --ink: ...; }` block at the top) for the identity kit's colors and
  spacing so the same values are reused everywhere instead of repeated.
- **`script.js`**: shared site behavior on every page: the mobile nav toggle, smooth-scroll for
  same-page anchor links, and the fade-in-on-scroll animations (respecting
  `prefers-reduced-motion`).
- **`agent.css`** / **`agent.js`**: the "Ask Nahla" widget (see its own section below). Separate
  from `style.css`/`script.js` so the whole feature can be removed by deleting two files, two
  `<link>`/`<script>` tags per page, and one `<div id="agent-root">`, without touching anything
  else.
- **`assets/todo-api-swagger.png`**: a real screenshot of the To-Do API's Swagger UI, used in
  the Work page's FastAPI case study.
- **`worker/`**: the optional backend for the agent widget. Not served by GitHub Pages, see
  `worker/README.md`.
- **`README.md`**: this file.

There is no build step for the site itself. There is nothing to `npm install` to view the four
pages. Opening `index.html` directly in a browser, or pushing this repo to GitHub, is the entire
deploy process for the static part.

## How GitHub Pages serves this

This repo is named `nahla-nabil.github.io`, which is GitHub's special naming convention for a
*user site*. Anything pushed to the `main` branch is served automatically at
`https://nahla-nabil.github.io`, with `index.html` as the homepage and the other three pages at
`/work.html`, `/about.html`, `/contact.html`. No extra configuration, no `gh-pages` branch, no
settings toggle needed for a repo named this way.

## Editing content later

Everything visible on a page lives directly in its `.html` file as plain text between tags. To
change wording, find the text in the relevant page and edit it directly, for example the claim
on the homepage:

```html
<p class="claim ...">I build backend systems that make AI products reliable in production.</p>
```

To change a color, spacing value, or font, edit the corresponding custom property at the top of
`style.css` (in the `:root { ... }` block) rather than hunting for every place a color is used:

```css
:root {
  --ink: #0B1F33;
  --paper: #F6F7F4;
  --accent: #2F5C82;
  --line: #D8DBD3;
}
```

Since the nav and footer are repeated on all four pages (no templating engine here), a wording
change to either needs to be made in each `.html` file separately.

## Placeholders still to fill in

Every placeholder is marked with an HTML comment reading `<!-- PLACEHOLDER: ... -->` right above
it, so a text search for `PLACEHOLDER` across the `.html` files finds all of them. As of this
build:

1. **Booking link**: appears on the homepage, contact page, and each hero CTA row, all using
   `href="#" data-booking-link="placeholder"`. Once you have a real booking link (a Calendly URL,
   for example), replace every one of those `href="#"` values with it.
2. **LinkedIn link**: the LinkedIn card in `contact.html`,
   `href="#" data-linkedin-link="placeholder"`. Replace with your public LinkedIn profile URL.
3. **CV link**: the CV card in `contact.html`, `href="#" data-cv-link="placeholder"`. Replace
   with wherever your CV is hosted.
4. **Shado demo and repo links**: in `work.html`, `data-case-link="shado-demo"` and
   `"shado-repo"`. Confirm the demo still works before linking to it.
5. **IEEE publication links**: in `about.html`, `data-pub-link="fed-learning"` and
   `"rf-auditing"`. Add the real IEEE Xplore / DOI links once confirmed public.
6. **The hero/about photo**: both pages currently show an `NN` initials circle
   (`<div class="avatar" aria-hidden="true">NN</div>`) instead of a real photo. To swap it for
   one, replace that whole `div` with an `<img>`, remove `aria-hidden="true"`, and add real
   `alt` text describing the photo, for example:
   ```html
   <img class="avatar" src="assets/photo.jpg" alt="Photo of Nahla Nabil">
   ```

## What this site deliberately does not include yet

- Real screenshots or a live link for Shado, only the FastAPI To-Do API has a real screenshot
  right now, because that's the only case with one on hand.
- The FlyRank completion badge: every page has an empty
  `<div id="flyrank-badge"></div>` in the footer, reserved for the badge image once the
  capstone is approved and the badge asset is provided.
- A custom domain: this ships on the free `nahla-nabil.github.io` URL, which is the
  deliverable for this assignment. A custom domain is optional future work, not required here.

## "Ask Nahla": the voice-enabled AI agent widget

Every page has a floating "Ask Nahla" button (bottom right) that opens a small chat panel.
Visitors can type or speak a question, and get a spoken and written answer back.

**Two halves, deployed separately:**

- **Front end** (`agent.css`, `agent.js`), part of this static site, deploys with everything
  else. Handles the button, the panel, voice input via the browser's built-in
  `SpeechRecognition` API, and voice output via `speechSynthesis`. Both are native browser
  features, no library, no API key, work today with zero setup. If a visitor's browser doesn't
  support voice input (Firefox, for example), the mic button hides itself automatically and
  typing still works.
- **Back end** (`worker/agent-worker.js`), a small Cloudflare Worker, NOT part of this repo's
  GitHub Pages deploy. This is what actually reasons about a question and writes a reply, by
  calling the Anthropic API with a system prompt listing only real, verified facts about Nahla.
  This half needs its own deploy, its own Cloudflare account, and your own Anthropic API key.
  Full walkthrough in `worker/README.md`.

Until the Worker is deployed and its URL is pasted into `agent.js`'s `AGENT_ENDPOINT` constant,
the widget still opens and works, typing or speaking a question just gets an honest "the agent
isn't connected yet, email Nahla directly" reply instead of pretending to answer.

The agent is instructed to always answer in first person as Nahla, but the panel discloses
clearly, in its header and in a line under it, that it is an AI assistant and not Nahla herself.
If asked something outside the facts it's been given, it's instructed to say so rather than
invent an answer, and to point to email or a booking call instead.
