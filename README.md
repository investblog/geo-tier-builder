<p align="center">
  <img src=".github/banner.png" alt="Geo Tier Builder" width="700">
</p>

<h3 align="center">Country Tiers, GEO Lists & TDS Regex Helper</h3>

<p align="center">
  Browser extension for building tiered country lists, GEO allow/block segments, and 301.st TDS path regexes.<br>
  For ad targeting, traffic arbitrage, TDS rules, Cloudflare WAF, and nginx.
</p>

<p align="center">
  <a href="https://github.com/investblog/geo-tier-builder/releases">Releases</a> ·
  <a href="https://301.st">301.st</a>
</p>

---

## Features

### Countries
- 249 countries with flags, regions, and tier classification (T1/T2/T3)
- 8 region filters (EUR, CIS, NA, LATAM, APAC, MENA, AFR, OCE) + meta-groups (EU, EEA, G7, G20, BRICS, Five Eyes)
- Custom tier overrides per country
- Import from any text (auto-detects country codes, ISO3, names, aliases)

### TDS regex helper
- Turn a slug like `playfortuna` into a correctly anchored `^/playfortuna$` for the 301.st TDS `path` / `referrer` condition
- Multi-slug alternation (`^/(vavada|riobet|playfortuna)$`), prefix / contains / ends modes, and a safe catch-all
- Live tester — paste sample pathnames or URLs, see exactly what matches using the same `new RegExp(path).test(url.pathname)` semantics the TDS worker uses

### Export templates (11 total)
- **301.st TDS** — ISO2 CSV (`US,CA,GB`) for direct paste into the rule drawer
- **Generic** — CSV / newline / JSON array, plus `allow=…` / `block=…` lines
- **Cloudflare** — WAF Include/Exclude Set expressions and a Workers snippet (`ip.geoip.country`)
- **Server / JS** — nginx `map` block and a JavaScript `Set`-based condition

### General
- Allow/Block mode with bulk operations (select all, invert, select filtered, clear)
- Preset system: save / load / pin / rename / delete, JSON import-export
- Dark / Light / System theme
- 17 store-listing locales (EN, RU, DE, ES, FR, IT, JA, KO, ZH-CN, ZH-TW, PT-BR, PL, TR, VI, TH, ID, HI)
- Zero tracking, zero network requests — all data bundled, works offline
- Minimal permissions: `sidePanel` + `storage` only

## Use cases

- **301.st TDS geo** — build allowlists/blocklists in 3 clicks and paste straight into `geo` / `geo_exclude` text fields
- **301.st TDS path** — generate a correct anchored regex for the rule `path` condition and test it against sample URLs before saving
- **Cloudflare** — generate ready-to-paste WAF expressions (`ip.geoip.country in {…}`) or a Workers JS snippet
- **Self-hosted stacks** — drop the nginx `map` block or JS `Set` check into your edge logic

## Install

| Store | Link |
|-------|------|
| Chrome Web Store | [Install](https://chromewebstore.google.com/detail/dbckaneobldjifocakfojpebfkpbeghn) |
| Firefox Add-ons | [Install](https://addons.mozilla.org/en-US/firefox/addon/geo-tier-builder/) |
| Edge Add-ons | [Install](https://microsoftedge.microsoft.com/addons/detail/plpmieeidepcechckjmanlgnjemdehga) |

## Build from source

```bash
npm install
npm run build          # Chrome MV3
npm run build:firefox  # Firefox MV2
npm run build:edge     # Edge MV3
npm run zip:all        # All 3 ZIPs
```

## Development

```bash
npm run dev            # Chrome dev
npm run dev:firefox    # Firefox dev
npm run check          # typecheck + lint + tests (114 tests)
```

## License

MIT

## Sponsor

Built for [301.st](https://301.st) Smart Traffic
