# ambvish.github.io

Personal site of Vishnuteja Ambati, served at <https://ambvish.github.io>: a desktop of
draggable windows (experience, projects, research, skills, education, writing) with a
⌘K / Ctrl+K search.

Built with [Eleventy](https://www.11ty.dev/), plain HTML, CSS and vanilla JavaScript.
No frameworks, no third-party scripts, no web fonts, no tracking.

## Run it locally

Needs Node 24 (see `.nvmrc`).

```sh
npm ci                  # install exact versions from package-lock.json
npm run dev             # live preview at http://localhost:8080 (includes drafts, labelled)
npm run build           # write the finished site to _site/ (never includes drafts)
npm run check:contrast  # check every color pair against WCAG AA
```

## Editing content

All text lives in `src/content/`:

| File | What it holds |
|---|---|
| `src/_data/site.json` | Name, tagline, contact links, the sticky-note intro |
| `src/content/experience.json` | Roles (each gets its own page) and the shorter "Also" list |
| `src/content/research.json` | Research and study projects (each gets its own page) |
| `src/content/projects.json` | Project cards and the tag filter |
| `src/content/skills.json` | Skill folders |
| `src/content/education.json` | Schools and certifications |

### Unconfirmed text (drafts)

Anything not yet confirmed goes in `src/content/drafts.json`. That file is git-ignored,
so it never reaches GitHub. `npm run dev` shows drafts with a yellow **DRAFT** label;
`npm run build` and the live site never include them. To publish an item, move it from
`drafts.json` into the matching content file.

`npm run build` also fails if the finished site contains `[CONFIRM`, `TODO` or `DRAFT`,
so unconfirmed text can't be deployed by accident.

## How it works

| Path | What it is |
|---|---|
| `src/index.njk` | The desktop |
| `src/article.njk` | One page per role and research item (shareable, works without JavaScript) |
| `src/_includes/windows/` | One file per window |
| `src/_includes/macros/window.njk` | The window component (title bar, traffic lights, toolbar) |
| `src/assets/css/tokens.css` | **Design tokens**: every color and size |
| `src/assets/css/site.css` | Layout and components |
| `src/assets/js/desktop.js` | Dragging, stacking, close / minimize / zoom, article windows |
| `src/assets/js/palette.js` | ⌘K search |
| `src/assets/js/filters.js` | Toolbar filters and the grid/list switch |
| `src/_data/desk.js` | Reads `src/content/` (and drafts, on the dev server only) |
| `scripts/check-contrast.js` | WCAG contrast check, also run by the deploy workflow |

Below 900px wide, windows stack into one scrolling column. With JavaScript off, the
page is a readable grid of windows and every role and research item has its own page.

## Security

- A strict Content Security Policy (in `src/_includes/layouts/base.njk`): only files
  from this site can load; no inline scripts or styles.
- External links open in a new tab with `rel="noopener noreferrer"`.
- No forms and no network requests; search runs entirely in the browser.
- Every action in `.github/workflows/deploy.yml` is pinned to a full commit SHA, and the
  workflow has the minimum permissions. Dependabot proposes updates monthly.

## Deploying

Every push to `main` runs `.github/workflows/deploy.yml`, which checks color contrast,
builds the site and publishes `_site/` to GitHub Pages. It can also be run by hand from
the Actions tab. The repo's Pages source must be set to **GitHub Actions**.
