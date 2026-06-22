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
- `src/pages/index.astro` — home page. Queries the collection, filters out `draft: true`, sorts by `tanggal` descending, and renders the list with reverse-numbered entries (newest gets the highest number).
- `src/pages/notes/[slug].astro` — per-note page. `getStaticPaths()` emits one route per non-draft note keyed by `note.id` (the filename). Renders `<Content />` via `render(note)` imported from `astro:content`.
- `src/layouts/Base.astro` — shared `<head>`, fonts, footer; takes `title` and optional `description`.
- `src/styles/global.css` — design tokens (CSS custom properties like `--violet`, `--ink`, `--mono`, `--measure`). Component styles in `.astro` files reference these vars; change colors/spacing here, not per-component.

Both pages filter `({ data }) => !data.draft` independently — a draft is hidden from the list *and* gets no route. Keep that filter consistent if you touch one.

Code blocks are highlighted via Shiki (`github-dark` theme, line wrap on) configured in `astro.config.mjs`. `site` is set there too — needed for correct absolute URLs in the build.

## Deploy

Push to `main` → GitHub Actions (`.github/workflows/deploy.yml`, uses `withastro/action@v3`) builds and deploys to GitHub Pages. The site is build-time static, so source can't be served raw. Custom domain is pinned by `public/CNAME`; don't remove it.

## Sibling site — keep infrastructure in sync

`ahmadilham-dev` (ahmadilham.dev) is a twin built from the same Astro template. **Any change outside of content must be applied to both sites** — layout/`Base.astro`, SEO and meta tags, `astro.config.mjs`, integrations (sitemap, RSS, OG images), build/deploy workflow, and design-token/styling infrastructure. Content is site-specific and does *not* cross over: the notes themselves, their frontmatter, hero copy, and per-note text stay in their own repo.

When porting a change, adapt for the differences: site name/domain, brand mark (`C#` / violet vs `AI` / amber), language (`lang="id"` vs `lang="en"`), and frontmatter keys (`ringkasan`/`tanggal`/`topik`/`sumber` here vs `standfirst`/`date`/`topic`/`source` there).
