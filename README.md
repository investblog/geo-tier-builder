<p align="center">
  <img src=".github/banner.png" alt="Geo Tier Builder" width="700">
</p>

<h3 align="center">Country Tiers & GEO Lists</h3>

<p align="center">
  Browser extension for building tiered country lists and GEO allow/block segments.<br>
  For ad targeting, TDS rules, Cloudflare WAF, nginx, and traffic management.
</p>

<p align="center">
  <a href="https://github.com/AnarAgaev/geo-tier-builder/releases">Releases</a> ·
  <a href="https://301.st">301.st</a>
</p>

---

## Features

- 249 countries with flags, regions, and tier classification (T1/T2/T3)
- 8 region filters (EUR, CIS, NA, LATAM, APAC, MENA, AFR, OCE) + meta-groups (EU, EEA, G7, G20, BRICS, Five Eyes)
- 10 export templates: 301.st TDS, CSV, JSON, JS array, Cloudflare WAF, nginx map, and more
- Allow/Block mode with bulk operations (select all, invert, clear)
- Import from any text (auto-detects country codes and names)
- Preset system with favorites
- Dark/Light/System theme
- Zero tracking, zero network requests
- Works offline — all data bundled

## Install

| Store | Link |
|-------|------|
| Chrome Web Store | [Install](https://chromewebstore.google.com/detail/dbckaneobldjifocakfojpebfkpbeghn) |
| Firefox Add-ons | _Coming soon_ |
| Edge Add-ons | _Coming soon_ |

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
npm run check          # typecheck + lint + tests
```

## License

MIT

## Sponsor

Built for [301.st](https://301.st) Smart Traffic
