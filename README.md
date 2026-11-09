# Car Compass

Static worldwide **car locator** — deep links to real marketplaces, auctions and classifieds. No hosted listings or invented prices.

Designed for **GitHub Pages project sites**: `https://haplessjack.github.io/car-compass/` (suggested repo: `car-compass`).

## Placeholder config

**Current placeholder name:** `Car Compass`
**Current placeholder base URL:** `https://haplessjack.github.io/car-compass/`

### One-command rewrite

```bash
scripts/set-site.sh "Car Compass" "https://YOURUSER.github.io/car-compass/"
```

The script:
- Reads the **previous** `siteName` and `baseUrl` from `js/config.js`
- Updates `js/config.js`
- Replaces the previous display name in HTML titles/copy and the previous base URL in `sitemap.xml` / `robots.txt` / pages
- Does **not** rewrite JS API identifiers (`SiteApp`, `SiteVPIC`, `SITE_CONFIG`, `SITE_SOURCES`)

### Files that contain the name / base URL

1. `js/config.js` — `siteName`, `baseUrl` (primary runtime config; OG/canonical/JSON-LD read this)
2. `sitemap.xml` — every `<loc>` uses the base URL
3. `robots.txt` — `Sitemap:` line
4. HTML titles and prose that mention the display name
5. `README.md` — placeholder lines above

Runtime JS globals are intentional and stable: `SITE_CONFIG`, `SiteApp`, `SiteVPIC`, `SITE_SOURCES`.

## Local preview (subpath)

```bash
cd /workspace
python3 -m http.server 8082
# open http://127.0.0.1:8082/car-finder-site/
```

## Features

- Search by make, model, year range, country/region → marketplace deep links
- NHTSA vPIC client-side make/model autocomplete + VIN decoder (`vin.html`)
- Sources directory by region (`sources.html`)
- Per-make pages (`cars/*/`) and per-country pages (`country/*/`)
- SEO: meta/OG, JSON-LD WebSite+SearchAction, sitemap, robots, custom `404.html`, `.nojekyll`

## GitHub Pages note

Server functions are **not** used. Extras live in `/workspace/car-finder-extras/` (not part of this static site).

GitHub’s Pages terms historically restrict sites whose **primary purpose is commercial**. Affiliate links/ads may require a different host later.

## Other name ideas (archived)

- GlobalCarFinder · WorldCarSearch · CarAtlas · AnyCarAnywhere · LocateWheels · CrossBorderCars
