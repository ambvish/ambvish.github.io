# ambvish.github.io

Personal portfolio and blog of Vishnuteja Ambati, served at <https://ambvish.github.io>.

Built with [Eleventy](https://www.11ty.dev/), plain HTML, CSS and vanilla JavaScript.
No frameworks, no third-party scripts, no tracking.

## Run it locally

Needs Node 24 (see `.nvmrc`).

```sh
npm ci          # install exact versions from package-lock.json
npm run dev     # live preview at http://localhost:8080
npm run build   # write the finished site to _site/
```

## Where things live

| Path | What it is |
|---|---|
| `src/_data/site.json` | Name, tagline, contact links |
| `src/_includes/` | Page layouts and shared pieces |
| `src/assets/` | CSS, JavaScript, fonts, images (copied as-is) |
| `src/index.njk` | The home page |
| `.github/workflows/deploy.yml` | Builds and publishes the site |

## Deploying

Every push to `main` runs `.github/workflows/deploy.yml`, which builds the site and
publishes `_site/` to GitHub Pages. It can also be run by hand from the Actions tab.
The repo's Pages source must be set to **GitHub Actions**.

Every action in the workflow is pinned to a full commit SHA. To update one, look up the
new release on the action's GitHub page and replace both the SHA and the version comment.
