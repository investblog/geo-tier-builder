# Geo/Tier Builder (for 301.st) — Technical Specification (MVP)

**Type:** Browser extension
**Primary UI:** Side Panel (Chrome/Edge MV3, Firefox MV2; best-effort on Firefox Android)
**Offline-first:** 0 network requests, 0 telemetry

---

## 1) Goals

1. Build GEO allowlists/blocklists by **countries**, **regions**, and **tiers**.
2. Export via **copy-paste templates** (no API):
   - **301.st TDS** (primary) — ISO2 CSV for direct paste into TDS rule drawer `geo` / `geo_exclude` fields.
   - Generic TDS formats (CSV/JSON/newline/key=value)
   - Cloudflare helper (WAF/Rulesets expressions + Workers snippet)
3. Presets: save/load/rename/delete/pin; import/export JSON.
4. Import/Normalize: paste "messy" lists -> recognize ISO2/ISO3/names; dedupe; show unknown tokens.

### 1.1 Product positioning

- MVP for attracting webmasters to the 301.st ecosystem.
- Solves a real pain: 301.st TDS drawer has a bare text field for geo codes. Building "EU T1" by hand = typing 20+ codes. This tool does it in 3 clicks.
- Subtle 301.st branding in the output area (sponsor line / badge), not intrusive.

---

## 2) Non-goals (MVP)

- No API integrations (no Cloudflare/301.st API calls).
- No remote dataset updates.
- No ASN/UA/ISP logic (backlog).
- No TDS preset decoding — presets (S1-S5, L1-L3) are server-side templates; geo-tier-builder builds the ISO2 lists that go *into* preset params.
- No deep-link into 301.st UI (no URL scheme exists for TDS drawer fields).

---

## 3) Tech stack & constraints

| Tool         | Version / Note                      |
|--------------|--------------------------------------|
| **WXT**      | ^0.19 (cross-browser)              |
| **TypeScript** | ^5.7, strict mode                 |
| **DOM**      | Vanilla DOM + CSS custom properties (no React/Vue) |
| **Biome**    | ^2.3 — lint & format (single quotes, trailing commas, 120-char lines) |
| **Vitest**   | ^4.0 — unit tests                  |
| **Storage**  | `browser.storage.local` (optional `storage.sync` for settings) |

- Render target: **<100 ms** (use list virtualization if needed).
- Permissions: minimal (**sidePanel**, **storage**). No host permissions.
- `"type": "module"` in package.json.

---

## 4) UX / IA

### 4.1 Side Panel layout

**Top bar**
- Search input (Ctrl/Cmd+K focus)
- Mode toggle: `Allowlist` / `Blocklist`
- Filter chips: Region, Tier, Favorites + meta-group chips (EU, EEA, G7)
- Bulk actions: Clear, Invert selection, Select filtered

**Main**
- Virtualized country list grouped by Region (collapsible headers)
- Item layout: checkbox + SVG flag + ISO2 + name + badges (Region, Tier) + star-favorite

**Output area**
- Dropdown: **Target Category**: `301.st` / `Generic TDS` / `Cloudflare` / `Server/JS`
- Dropdown: **Template** (depends on category)
- Result box (readonly textarea)
- Actions: Copy, Download `.txt`
- Sponsor line: subtle "Built for 301.st" text or badge near category selector

**Secondary sections/tabs**
- **Import**: textarea -> Parse -> stats -> unknown tokens list (with suggestions)
- **Presets**: list + save/load/rename/delete/pin

### 4.2 Keyboard shortcuts

- Ctrl/Cmd+K: focus search
- Esc: clear search / close dropdown
- Optional: `A` = select all filtered (only when focus is not in textarea)

---

## 5) Core data model

### 5.1 Bundled dataset

File: `src/data/countries.v1.json`

```ts
// Geographic region (mutually exclusive, one per country)
type Region = 'EUR' | 'CIS' | 'NA' | 'LATAM' | 'APAC' | 'MENA' | 'AFR' | 'OCE';

// Meta-groups (non-exclusive tags, a country can belong to multiple)
type MetaGroup = 'EU' | 'EEA' | 'G7' | 'G20' | 'BRICS' | 'FIVE_EYES';

type Tier = 'T1' | 'T2' | 'T3';

type Country = {
  iso2: string;         // "US"
  iso3: string;         // "USA"
  name_en: string;
  name_ru?: string;
  region: Region;       // primary geographic region (mutually exclusive)
  tier: Tier;           // builtin default tier
  tags?: MetaGroup[];   // non-exclusive groups: EU, EEA, G7, etc.
  aliases?: string[];   // "United States", "USA", "America"
};
```

### 5.2 Flags

Single SVG sprite with all country flags as `<symbol>` elements.

```
src/assets/flags-sprite.svg    # All ~250 flags in one file
```

- One file load, one parse, cached in memory — fast scroll with virtualized list.
- `<symbol id="flag-us">`, `<symbol id="flag-gb">`, etc.
- Usage: `<svg class="flag"><use href="flags-sprite.svg#flag-us"></svg>`
- 4x3 aspect ratio, rendered at 20x15 px.
- Source SVGs optimized with SVGO before building sprite.
- Same pattern as redirect-inspector icon sprite.
- No emoji flags — inconsistent rendering across platforms.

### 5.3 Regions

Geographic regions are mutually exclusive (one per country). Meta-groups like EU/EEA are tags that overlay on top.

| Region | Name | Countries (count) |
|--------|------|-------------------|
| **EUR** | Europe | UK, DE, FR, IT, ES, PL, RO, NL, SE, NO, CH, ... (~45) |
| **CIS** | CIS | RU, UA, BY, KZ, UZ, GE, AM, AZ, MD, KG, TJ, TM (~12) |
| **NA** | North America | US, CA (~2) |
| **LATAM** | Latin America | BR, MX, AR, CL, CO, PE, EC, ... (~33) |
| **APAC** | Asia-Pacific | JP, KR, CN, IN, TH, PH, ID, VN, SG, ... (~40+) |
| **MENA** | Middle East & N. Africa | AE, SA, TR, IL, EG, MA, IQ, ... (~20) |
| **AFR** | Sub-Saharan Africa | NG, KE, ZA, GH, TZ, ET, ... (~48) |
| **OCE** | Oceania | AU, NZ, FJ, PG, ... (~14) |

**Meta-groups (tags):**

| Tag | Description | Countries |
|-----|-------------|-----------|
| **EU** | EU member states (27) | AT, BE, BG, HR, CY, CZ, DK, EE, FI, FR, DE, GR, HU, IE, IT, LV, LT, LU, MT, NL, PL, PT, RO, SK, SI, ES, SE |
| **EEA** | EU + IS, NO, LI (30) | EU + IS, NO, LI |
| **G7** | Group of Seven | US, CA, GB, FR, DE, IT, JP |
| **G20** | Group of Twenty | US, CA, GB, FR, DE, IT, JP, KR, AU, BR, MX, AR, SA, TR, IN, CN, ID, ZA, RU + EU |
| **BRICS** | BRICS+ | BR, RU, IN, CN, ZA, IR, EG, ET, AE, SA |
| **FIVE_EYES** | Five Eyes intelligence | US, GB, CA, AU, NZ |

### 5.4 Tier classification (builtin default)

Affiliate marketing consensus. User can override individual countries via `customTiers`.

#### Tier 1 — High-value traffic (~25 countries)

High GDP/capita, expensive ads, strong digital economy.

| Region | Countries |
|--------|-----------|
| NA | US, CA |
| EUR | GB, DE, FR, IT, ES, PT, NL, BE, AT, CH, SE, NO, DK, FI, IE, LU, IS |
| OCE | AU, NZ |
| APAC | JP, SG |
| MENA | IL |

#### Tier 2 — Mid-value traffic (~45 countries)

Growing economies, moderate ad costs, good conversion quality.

| Region | Countries |
|--------|-----------|
| EUR | PL, CZ, HU, RO, BG, HR, SK, SI, EE, LT, LV, GR, CY, MT, RS, BA, ME, MK, AL |
| CIS | UA, BY, KZ, GE, AM, AZ, MD |
| LATAM | BR, MX, AR, CL, CO |
| APAC | KR, TW, HK, MY, TH |
| MENA | AE, SA, QA, KW, BH, TR |
| AFR | ZA |

#### Tier 3 — Low-cost high-volume (everything else, ~130+ countries)

Cheap traffic, high volumes, lower purchasing power.

| Region | Examples |
|--------|----------|
| CIS | RU, UZ, KG, TJ, TM |
| LATAM | PE, EC, BO, PY, VE, HN, GT, NI, SV, DO, CU, CR, PA, UY, ... |
| APAC | IN, PK, BD, CN, ID, PH, VN, KH, LA, MM, NP, LK, MN, ... |
| MENA | EG, IQ, JO, MA, TN, DZ, LB, OM, LY, SY, YE, PS, ... |
| AFR | NG, KE, GH, TZ, UG, ET, CM, SN, CD, AO, MG, MW, ... |
| OCE | FJ, PG, WS, TO, VU, ... |
| EUR | LI, AD, MC, SM, VA, XK |

### 5.5 User state

```ts
type SelectionState = {
  include: string[];   // ISO2
  exclude: string[];   // ISO2
  favorites: string[]; // ISO2
};

type Preset = {
  id: string;
  name: string;
  include: string[];
  exclude: string[];
  tags?: string[];
  notes?: string;
  createdAt: number;
  updatedAt: number;
};

type Settings = {
  theme: 'dark' | 'light' | 'system';
  language: 'en' | 'ru';
  defaultMode: 'allow' | 'block';
  defaultTarget: '301st' | 'generic' | 'cloudflare' | 'serverjs';
  defaultTemplateId: string;
  tierScheme: 'builtin' | 'custom';
};

type CustomTiers = Record<string /* ISO2 */, Tier>;
```

**Storage keys**
- `settings`
- `selectionState`
- `presets`
- `customTiers` — only stores overrides (sparse); missing keys fall back to builtin

---

## 6) Engine logic

### 6.1 Selection rules

- **Allowlist mode:** checkbox toggles membership in `include`.
- **Blocklist mode:** checkbox toggles membership in `exclude`.

**Bulk operations**
- Select all filtered
- Clear filtered
- Invert selection (within filtered set)
- Region actions:
  - Add region -> include all countries in region
  - Remove region -> remove all countries in region
- Meta-group actions:
  - Click "EU" chip -> select/deselect all EU members within current mode

### 6.2 Tier resolution

```ts
function getTier(iso2: string, customTiers: CustomTiers, builtinTier: Tier): Tier {
  return customTiers[iso2] ?? builtinTier;
}
```

Tier filter chips use resolved tier (custom override > builtin).

### 6.3 Import/Normalize

**Input accepts**
- ISO2, ISO3, names (EN/RU), mixed separators, arbitrary whitespace/case.

**Pipeline**
1. Tokenize by `/[\s,;|]+/`
2. Trim
3. Match order:
   - ISO2 exact
   - ISO3 exact -> map to ISO2
   - name/alias case-insensitive
4. Deduplicate
5. Produce unknown list with optional suggestions (best-effort)

```ts
type ParseResult = {
  matchedIso2: string[];
  unknown: { token: string; suggestions?: string[] }[];
};
```

---

## 7) Templates system

### 7.1 Template definition

```ts
type TemplateCategory = '301st' | 'generic' | 'cloudflare' | 'serverjs';

type RenderContext = {
  include: string[]; // ISO2
  exclude: string[]; // ISO2
  mode: 'allow' | 'block';
  options: {
    sep: ',' | '\n' | ' ';
    quote?: 'none' | 'single' | 'double';
    minify?: boolean;
  };
};

type Template = {
  id: string;
  category: TemplateCategory;
  name: string;
  description?: string;
  render: (ctx: RenderContext) => string;
};
```

### 7.2 Required templates (MVP)

#### Category: 301.st

Primary use-case: copy output -> paste into TDS drawer `geo` field.

- `301st.iso2.csv` -> `US,CA,GB`
  In allow mode renders `include[]`, in block mode renders `exclude[]`.
  This is the format accepted by the 301-ui TDS drawer's `geo` / `geo_exclude` text fields (comma-separated ISO2 parsed by `parseList()`).

#### Category: Generic TDS

- `generic.iso2.csv`
- `generic.iso2.newline`
- `generic.json.array`
- `generic.keyvalue`:
  - `allow=US,CA\nblock=RU,BY`

#### Category: Cloudflare

- `cf.waf.include_set`:
  - `ip.geoip.country in {"US" "CA"}`
- `cf.waf.exclude_set`:
  - `not (ip.geoip.country in {"RU" "BY"})`
- `cf.workers.snippet` (simple):
  - `const ALLOW = new Set([...]); if (!ALLOW.has(country)) return ...;`

#### Category: Server/JS

- `server.nginx.map` (simple map)
- `js.condition` (if country in set)

---

## 8) UI requirements

- Virtualized list for 250+ rows (no UI lag).
- Sticky, collapsible region headers with country count badge.
- SVG flags via sprite (`<use href>`), 20x15 px, single file load.
- Search is debounced (100-150 ms).
- Copy actions show toast.
- "No results" empty state.
- Unknown tokens panel:
  - show tokens
  - copy unknown
  - suggestions (optional)

---

## 9) Theming & design

Design system adapted from **301-ui** (W:\Projects\301-ui):
- CSS custom properties (token-based), dark default + light + system.
- No external fonts; use system stack (`system-ui, -apple-system, ...`).
- Color palette: blue primary (`--blue-500: #3475C0`), gray neutrals, semantic colors (danger/success/warning/info).
- Unified control recipe: `--fs-control`, `--control-pad-y`, `--control-pad-x` for consistent sizing.
- Radii: pill for chips/buttons (`999px`), field for inputs (`0.75rem`).
- Shadows: soft/subtle variants, theme-aware.
- Extension-specific: compact spacing for side panel width constraints.

---

## 10) Testing (Vitest)

### Unit tests (required)
- Parser: ISO2/ISO3/names, separators, dedupe, unknown
- Region/tier filters correctness
- Meta-group membership (EU/EEA tags)
- Tier resolution: custom override > builtin
- Template outputs deterministic for given `RenderContext`
- Selection ops: add/remove/invert/bulk

### Manual smoke checklist
- Side panel opens and state persists
- Copy works in all supported browsers
- Import works for messy lists
- Presets save/load/delete works
- SVG flags render correctly on Chrome, Firefox, Edge
- No network requests

---

## 11) Repo structure (recommended)

```
src/
  assets/
    flags-sprite.svg          # Single SVG sprite with all country flags
  background/
  sidepanel/
    index.html
    sidepanel.ts
    ui/
      components/
      styles/
        tokens.css
        sidepanel.css
  data/
    countries.v1.json         # Full country dataset
  engine/
    store.ts
    selection.ts
    parser.ts
    regions.ts                # Region & meta-group definitions
    tiers.ts                  # Tier resolution logic
  templates/
    index.ts
    t301st.ts
    generic.ts
    cloudflare.ts
    serverjs.ts
  shared/
    types.ts
    storage.ts
test/
  parser.test.ts
  templates.test.ts
  selection.test.ts
  tiers.test.ts
```

---

## 12) Acceptance criteria (MVP)

1. User can build **EU T1 allowlist** in <10 seconds and copy as **301.st ISO2 CSV**.
2. Import accepts messy input (e.g., `us, United States; DEU; россия`) -> normalized ISO2 set + unknown tokens.
3. Cloudflare templates output correct WAF expression for allow/block.
4. Presets persist and correctly restore include/exclude.
5. Custom tier overrides persist and apply correctly.
6. SVG flags render for all countries, no broken images.
7. No network requests and minimal permissions only.

---

## 13) TDS integration context

For reference, 301.st TDS rules use this geo condition format:

```ts
// From 301-ui: src/api/types.ts
conditions: {
  geo: string[];           // ISO2 allow-list, e.g. ["US", "CA"]
  geo_exclude: string[];   // ISO2 block-list, e.g. ["RU", "BY"]
  // + device, os, browser, bot, utm_source, utm_campaign, path, referrer
}
```

TDS drawer parses `geo` field as comma-separated text (`parseList()`).
Geo-tier-builder's `301st.iso2.csv` template produces exactly this format.

TDS presets (S1-S5 shield, L1-L3 smartlink) are server-defined templates.
Preset S2 ("Geo Filter") accepts `geo[]` as a parameter — the CSV from geo-tier-builder pastes directly into it.
