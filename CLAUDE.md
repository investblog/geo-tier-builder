# Geo/Tier Builder

Browser extension for building GEO allowlists/blocklists, primarily for 301.st TDS.

## Spec

Full technical specification: `geo-tier-builder-spec.md`

## Tech stack

- **WXT** ^0.19 — cross-browser extension framework (Chrome MV3, Firefox MV2)
- **TypeScript** ^5.7, strict mode, no implicit any
- **Vanilla DOM** — no React/Vue, optimized for <100ms render
- **CSS custom properties** — token-based design system
- **Biome** ^2.3 — lint & format
- **Vitest** ^4.0 — unit tests

## Code style (Biome)

- Single quotes, trailing commas, semicolons always
- 120-char line width, 2-space indent
- `useConst: error`, `noUnusedImports: warn`, `noUnusedVariables: warn`

## Reference projects

| Project | Path | What to take |
|---------|------|-------------|
| **redirect-inspector** | `W:\Projects\redirect-inspector` | WXT config, tsconfig, biome config, package.json scripts, build/zip pipeline, i18n pattern, popup/sidepanel architecture |
| **301-ui** | `W:\Projects\301-ui` | Design tokens (`static/css/theme.css`), color palette, typography, control sizing recipe, component patterns (buttons, chips, badges, dropdowns, drawers), icon sprite pattern |

## Design system

Adapted from 301-ui theme tokens:
- **Colors**: blue primary (#3475C0 dark / #0055DC light), gray neutrals, semantic (danger/success/warning/info)
- **Typography**: system-ui stack, base 1rem/1.5, control font-size via `--fs-control`
- **Controls**: unified sizing via `--control-pad-y`, `--control-pad-x`, pill radii for chips (999px), field radii for inputs (0.75rem)
- **Themes**: dark (default) + light + system, via `[data-theme]` attribute
- Side panel specific: compact spacing, extension-width constraints

## Conventions

- `"type": "module"` in package.json
- Path aliases: `@/*` -> `src/*`, `@shared/*` -> `src/shared/*`
- SVG icons via sprite + `<use href>` (no innerHTML)
- i18n: `browser.i18n.getMessage()` wrapper, EN + RU locales
- Storage: `browser.storage.local` for data, optional `storage.sync` for settings
- Zero network requests, zero telemetry
- Permissions: sidePanel, storage only

## Scripts

```
dev           wxt
dev:firefox   wxt -b firefox
build         wxt build
build:firefox wxt build -b firefox
build:edge    wxt build -b edge
zip:all       wxt zip && wxt zip -b firefox && wxt zip -b edge
typecheck     tsc --noEmit
lint          biome check src/ wxt.config.ts
lint:fix      biome check --write src/ wxt.config.ts
test          vitest run
test:watch    vitest
check         tsc --noEmit && biome check src/ wxt.config.ts && vitest run
```

## Country data & classification

**Regions** (mutually exclusive, one per country):
EUR, CIS, NA, LATAM, APAC, MENA, AFR, OCE

**Meta-groups** (non-exclusive tags, used as filter chips):
EU (27), EEA (30), G7, G20, BRICS, FIVE_EYES

**Tiers** (builtin default, user can override via `customTiers`):
- T1 (~25): US, CA, GB, DE, FR, IT, ES, PT, NL, BE, AT, CH, SE, NO, DK, FI, IE, LU, IS, AU, NZ, JP, SG, IL
- T2 (~45): Eastern Europe, CIS (UA/BY/KZ/GE/AM/AZ/MD), LATAM majors, KR/TW/HK/MY/TH, Gulf states, ZA, TR
- T3 (rest): IN, PK, CN, RU, most of Africa/LATAM/APAC

**Flags**: single SVG sprite (`src/assets/flags-sprite.svg`), all ~250 flags as `<symbol>` elements. Usage: `<svg class="flag"><use href="#flag-us"></svg>`. 4x3 aspect, 20x15px. SVGO-optimized. Same pattern as redirect-inspector icons. No emoji.

## Project structure

```
src/
  assets/
    flags-sprite.svg       # Single SVG sprite with all country flags
  background/              # Service worker (minimal, registers side panel)
  sidepanel/
    index.html             # Side panel entry
    sidepanel.ts           # Main UI logic
    ui/components/         # DOM components
    ui/styles/tokens.css   # Design tokens
    ui/styles/sidepanel.css
  data/
    countries.v1.json      # Bundled country dataset
  engine/
    store.ts               # State management
    selection.ts           # Include/exclude logic, bulk ops
    parser.ts              # Import/normalize pipeline
    regions.ts             # Region & meta-group definitions
    tiers.ts               # Tier resolution (custom > builtin)
  templates/
    index.ts               # Template registry
    t301st.ts              # 301.st ISO2 CSV format
    generic.ts             # CSV, newline, JSON array, key=value
    cloudflare.ts          # WAF expressions, Workers snippet
    serverjs.ts            # nginx map, JS condition
  shared/
    types.ts               # Shared type definitions
    storage.ts             # browser.storage wrapper
test/
  parser.test.ts
  templates.test.ts
  selection.test.ts
  tiers.test.ts
```

## Key data flow

```
User interaction (checkboxes, region chips, import)
  -> SelectionState { include: ISO2[], exclude: ISO2[] }
  -> Template.render(RenderContext)
  -> Output textarea (copy-paste ready)
```

## 301.st TDS context

The primary export target. TDS rule drawer accepts comma-separated ISO2 in `geo` / `geo_exclude` text fields.
Template `301st.iso2.csv` produces exactly that format: `US,CA,GB`.
TDS preset S2 ("Geo Filter") takes `geo[]` param — our CSV pastes directly into it.
