# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Static blog at **csharp-indonesia.com** — personal notes on modern C#/.NET and agentic coding. Built with Astro 4; content is Markdown rendered to a fully static site. The old 2013–2014 tutorials live separately at archive.csharp-indonesia.com (not in this repo).

## Language policy

- **Reader-facing prose is in Bahasa Indonesia** — note body text, `ringkasan`/`title` values, hero copy, UI labels shown on the page. This is what visitors read; keep it Indonesian.
- **Everything that is code is in English** — identifiers, variable/function names, frontmatter *keys* and schema field names, code comments, commit messages, PR titles/descriptions, and the **README**. Do not introduce new Indonesian-named code symbols or comments.

Note the existing tension: some frontmatter keys (`ringkasan`, `tanggal`, `topik`, `sumber`) and `README.md` are currently Indonesian. Treat those as legacy. Write all *new* code, comments, and docs in English; when you touch legacy code substantially, prefer migrating it toward English rather than extending the Indonesian naming. Renaming frontmatter keys is a breaking change — update `src/content/config.ts`, every note's frontmatter, and both page templates together if you do it.

## Commands

```bash
npm install        # once, or after pulling changes
npm run dev        # dev server at http://localhost:4321 (auto-reload)
npm run build      # static build → dist/
npm run preview    # serve dist/ to verify a build
```

There is no test suite or linter. `npm run build` is the correctness gate — it runs Astro's content-collection schema validation and TypeScript checks (tsconfig extends `astro/tsconfigs/strict`), so a green build is the bar before pushing.

## Architecture

Content-collection–driven. The whole site is generated from Markdown files in one collection:

- `src/content.config.ts` — defines the `notes` collection (Astro 6 Content Layer API: `glob` loader over `src/content/notes`) and its Zod schema. The frontmatter contract (all required unless noted): `title`, `ringkasan` (one-line summary), `tanggal` (date), `topik` (short label), `sumber` (optional URL), `draft` (default `false`). Changing a field here changes what every note must provide.
- `src/content/notes/*.md` — the actual notes. This is the only place to add content.
- `src/pages/index.astro` — home page. Queries the collection, filters out `draft: true`, sorts by `tanggal` descending, and renders the hero, stats strip, topic chips, featured card and note rows, then the archive and sister-site blocks. Entries stay reverse-numbered (newest gets the highest number). The featured card is simply the newest note. The chips filter the rendered list client-side (a small inline script) — there is no archive page for the notes, so every note is on this page.
- `src/pages/notes/[slug].astro` — per-note page. `getStaticPaths()` sorts the notes, emits one route per non-draft note keyed by `note.id` (the filename), and passes each note its number. Renders `<Content />` via `render(note)` imported from `astro:content`.
- `src/layouts/Base.astro` — shared `<head>`, Google Fonts (Geist + Geist Mono), header nav, the hero line grid, theme toggle and footer. Takes `title` and optional `description`, plus a named `top` slot for content that sits under the header inside the line grid (the home page's hero).
- `src/styles/global.css` — design tokens (CSS custom properties: `--bg`, `--surface`, `--ink`, `--muted`, `--rule`, `--accent`, `--accent-text`, `--sans`, `--mono`, `--wrap`, etc.) plus shared primitives (`.wrap`, `.eyebrow`, `.btn`, `.chip`). Component styles in `.astro` files reference these vars; change colors/spacing here, not per-component.

Both pages filter `({ data }) => !data.draft` independently — a draft is hidden from the list *and* gets no route. Keep that filter consistent if you touch one.

**Theming.** Light is the default; dark follows the visitor's system setting unless the nav toggle pins a choice in `localStorage`, which `Base.astro` applies to `<html data-theme>` before first paint. Every dark rule therefore has to be written twice — once under `@media (prefers-color-scheme: dark)` guarded by `:root:not([data-theme='light'])`, and once under `:root[data-theme='dark']`. Use the tokens rather than adding new dark-mode rules in component styles.

**Brand.** The look is shared with ahmadilham.dev — same type, grid, components and tokens. Only the accent differs (violet here, blue there) and the hero's background pattern (a line grid here, dots there). Keep changes that touch the shared parts in step across both repos.

Code blocks are highlighted via Shiki with two themes (`github-light` / `github-dark`, line wrap on) configured in `astro.config.mjs`; `global.css` switches them the same way as the rest of the palette. `site` is set there too — needed for correct absolute URLs in the build.

## Deploy

Push to `main` → GitHub Actions (`.github/workflows/deploy.yml`, uses `withastro/action@v3`) builds and deploys to GitHub Pages. The site is build-time static, so source can't be served raw. Custom domain is pinned by `public/CNAME`; don't remove it.
