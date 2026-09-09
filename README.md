# nahla-nabil.github.io

Personal portfolio site for Nahla Nabil, Backend AI Engineering Intern (FlyRank AI Fluency
program, assignment PF-04). Plain static HTML/CSS/JS, no build step, no framework. Deploys
straight from this repo via GitHub Pages.

## Files

- **`index.html`**: the entire page. One HTML file, four content sections (Work, About,
  Contact) plus a hero and footer, all on one page with anchor navigation (`#work`, `#about`,
  `#contact`). No templating, no server code: what you see in this file is what ships.
- **`style.css`**: all styling. Plain CSS, no Tailwind or framework, using CSS custom
  properties (the `:root { --ink: ...; }` block at the top) for the identity kit's colors and
  spacing so the same values are reused everywhere instead of repeated.
- **`script.js`**: the only JavaScript on the site, smooth-scrolling when you click a nav link
  (Work / About / Contact / the `NN` mark). If you deleted this file and its `<script>` tag in
  `index.html`, the nav links would still work, just with an instant jump instead of a smooth
  scroll.
- **`README.md`**: this file.

There is no build step. There is nothing to `npm install`. Opening `index.html` directly in a
browser, or pushing this repo to GitHub, is the entire deploy process.

## How GitHub Pages serves this

This repo is named `nahla-nabil.github.io`, which is GitHub's special naming convention for a
*user site*. Anything pushed to the `main` branch is served automatically at
`https://nahla-nabil.github.io`, with `index.html` as the homepage. No extra configuration,
no `gh-pages` branch, no settings toggle needed for a repo named this way.

## Editing content later

Everything visible on the page lives directly in `index.html` as plain text between HTML tags.
To change wording, find the text in the relevant `<section>` and edit it directly, for example
the claim under the hero:

```html
<p class="claim">I build backend systems that make AI products reliable in production.</p>
```

To change a color, spacing value, or font, edit the corresponding custom property at the top
of `style.css` (in the `:root { ... }` block) rather than hunting for every place a color is
used:

```css
:root {
  --ink: #0B1F33;
  --paper: #F6F7F4;
  --accent: #2F5C82;
  --line: #D8DBD3;
}
```

## Placeholders still to fill in

Three links are intentionally left as placeholders (`href="#"`) because the real URLs did not
exist yet when this site was built. Each one is marked with an HTML comment reading
`<!-- PLACEHOLDER: ... -->` immediately above it in `index.html`, so a text search for
`PLACEHOLDER` in that file finds all of them. As of this build, they are:

1. **Booking link**: appears twice, the "Book a call" button in the hero, and the "Book a
   call" row in Contact. Both use `href="#" data-booking-link="placeholder"`. Once you have a
   real booking link (for example a Calendly URL), replace both `href="#"` values with it and
   you can drop the `data-booking-link="placeholder"` attributes, they exist only to make the
   two placeholders easy to find and search for.
2. **LinkedIn link**: the LinkedIn row in Contact, `href="#" data-linkedin-link="placeholder"`.
   Replace `href="#"` with your public LinkedIn profile URL.
3. **CV link**: the CV row in Contact, `href="#" data-cv-link="placeholder"`. Replace
   `href="#"` with wherever your CV is hosted (a PDF, a Google Drive share link, etc.).

Two "Read more" links (the Shado case study, and any future case studies) are also placeholders
for now, since the full case study write-ups are a separate, later step in the portfolio build
described in the FlyRank track. They are marked the same way.

## What this site deliberately does not include yet

- Full case studies (Shado, the DOO/CNCT work, the FastAPI To-Do API, the two IEEE papers):
  this page only teases Shado; the rest of the portfolio build adds full write-ups later.
- The FlyRank completion badge: `index.html` has an empty
  `<div id="flyrank-badge"></div>` in the footer, reserved for the badge image once the
  capstone is approved and the badge asset is provided.
- A custom domain: this ships on the free `nahla-nabil.github.io` URL, which is the
  deliverable for this assignment. A custom domain is optional future work, not required here.
