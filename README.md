<p align="center">
  <img src=".github/banner.png" alt="Geo Tier Builder" width="700">
</p>

<h3 align="center">Country Tiers, GEO Lists & Ad-Network ASNs</h3>

<p align="center">
  Browser extension for building tiered country lists, GEO allow/block segments, and ad-network ASN filters.<br>
  For ad targeting, traffic arbitrage, TDS rules, Cloudflare WAF, nginx, and traffic management.
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

### Ad-network ASNs
- Curated dataset of 13 verified ASNs across 5 categories — social (Meta, X, LinkedIn, Snap, ByteDance/TikTok), search (Google, Microsoft, Yandex, Baidu, Apple), native (Criteo), and CIS (Mail.ru/VK)
- Useful for arbitrage traffic filtering: detect ad-platform crawlers, whitelist/blocklist sources
- Custom ASN overrides — add new entries, override builtin, or disable any entry you don't need
- Search by name, ASN number, or platform tag (e.g. `tiktok`, `vk-ads`, `youtube`)

### Export templates (18 total)
- **301.st TDS** — ISO2 CSV (`US,CA,GB`) and ASN CSV (`32934,15169`) for direct paste into rule drawer
- **Generic** — CSV / newline / JSON array (countries + ASN), plus `allow=…` / `block=…` lines
- **Cloudflare** — WAF Include/Exclude Set expressions and Workers snippets, for both `ip.geoip.country` and `ip.geoip.asnum`
- **Server / JS** — nginx `map` block, JavaScript `Set`-based conditions for countries and ASN

### General
- Allow/Block mode with bulk operations (select all, invert, select filtered, clear)
- Preset system: save / load / pin / rename / delete, JSON import-export
- Dark / Light / System theme
- 17 store-listing locales (EN, RU, DE, ES, FR, IT, JA, KO, ZH-CN, ZH-TW, PT-BR, PL, TR, VI, TH, ID, HI)
- Zero tracking, zero network requests — all data bundled, works offline
- Minimal permissions: `sidePanel` + `storage` only

## Use cases

- **Traffic arbitrage** — block ad-platform moderation crawlers (FB AS32934, TikTok AS396986) on one funnel variant while showing them a clean page on another
- **301.st TDS** — build allowlists/blocklists in 3 clicks and paste straight into `geo` / `asn` / `geo_exclude` / `asn_exclude` text fields
- **Cloudflare** — generate ready-to-paste WAF expressions (`ip.geoip.country in {…}`, `ip.geoip.asnum in {…}`) or Workers JS snippets
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
