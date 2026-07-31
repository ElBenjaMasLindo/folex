# Folex (folex-fx)

[![CI](https://github.com/ElBenjaMasLindo/folex/actions/workflows/ci.yml/badge.svg)](https://github.com/ElBenjaMasLindo/folex/actions/workflows/ci.yml)
[![npm version](https://img.shields.io/npm/v/folex-fx.svg)](https://www.npmjs.com/package/folex-fx)
[![license](https://img.shields.io/github/license/ElBenjaMasLindo/folex.svg)](LICENSE)

Lightweight, zero-dependency visual effects library for plain HTML. Glass morphism, glow, ripple, and particle effects driven entirely by CSS custom properties — no JavaScript configuration required.

```html
<div data-folex="glass glow" style="--fx-color: #7c3aed; --fx-speed: 1.2">
  ✨ see me
</div>
```

## Install

```sh
npm install folex-fx
# or
pnpm add folex-fx
```

## Quickstart

```html
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <link rel="stylesheet" href="node_modules/folex-fx/dist/folex.css" />
  <style>
    body { background: #0a0a12; min-height: 100vh; display: grid; place-items: center; }
    .box {
      width: 160px; height: 160px; border-radius: 24px;
      background: #1e1b4b; color: white;
      display: grid; place-items: center; font: 600 18px system-ui;
    }
  </style>
</head>
<body>
  <div class="box" data-folex="glass glow ripple" style="--fx-color: #7c3aed; --fx-ripple-layers: 3">
    Folex
  </div>
  <script type="module">
    import { init } from "folex-fx";
    init();
  </script>
</body>
</html>
```

Import the CSS, mark elements with `data-folex`, call `init()`.

## Features

- **Zero dependencies** — no runtime bloat, ~14 KB minified
- **CSS-driven API** — configure everything via `--fx-*` custom properties
- **LLM-friendly** — AI assistants generate styled HTML with zero JS knowledge
- **Glass morphism** — backdrop blur, chromatic refraction, spectrum gradient, animated prism border
- **Glow** — dual-layer pulsing box-shadow with blend modes
- **Ripple** — multi-layer procedural noise (turbulence + cellular/Voronoi) with CSS animation drift
- **Pixie** — canvas particle system with spin/glow/burst motes, adaptive quality, prefers-reduced-motion
- **Defensive by default** — every value validated and clamped; hostile inputs handled gracefully

## Usage

### Applying effects

Add a `data-folex` attribute with one or more space-separated effect names:

```html
<div data-folex="glass">           <!-- single effect -->
<div data-folex="glass glow">      <!-- multiple -->
<div data-folex="glow ripple pixie"> <!-- stack freely -->
```

Then call `init()` once after DOM ready:

```js
import { init } from "folex-fx";
init();
```

### Watching the DOM

Pass `{ watch: true }` to observe mutations (SPA routing, dynamic content):

```js
init({ watch: true });
```

Scope to a subtree:

```js
init({ root: document.getElementById("app"), watch: true });
```

### Extending with custom effects

```js
import { registry } from "folex-fx";
registry.myEffect = (host, vars) => {
  // vars.color, vars.glowIntensity, vars.speed, ...
  host.style.filter = `hue-rotate(${vars.speed * 60}deg)`;
};
```

## CSS Custom Properties

All configuration via `--fx-*` properties on the host element. Every property has safe defaults.

| Property | Effects | Type | Default | Range |
|----------|---------|------|---------|-------|
| `--fx-color` | all | color | derived from `color`/`background-color` of element, or `#ffb37c` | any valid CSS color |
| `--fx-speed` | all | number | `1` | `0.1`–`5` |
| `--fx-glow-intensity` | glow | number | `0.6` | `0`–`1` |
| `--fx-glow-blend` | glow | string | `overlay` | `screen`, `multiply`, `overlay`, `soft-light`, `hard-light`, `darken`, `lighten`, `color-dodge`, `color-burn` |
| `--fx-glow-dur` | glow | time | `3s` | any CSS time |
| `--fx-ripple-intensity` | ripple | number | `0.6` | `0`–`1` |
| `--fx-ripple-scale` | ripple | number | `1` | `0.1`–`5` |
| `--fx-ripple-layers` | ripple | integer | `1` | `1`–`12` |
| `--fx-ripple-field` | ripple | string | `turbulence` | `turbulence`, `cellular` |
| `--fx-ripple-blend` | ripple | string | `overlay` | `screen`, `multiply`, `overlay`, `soft-light`, `hard-light`, `darken`, `lighten`, `color-dodge`, `color-burn` |
| `--fx-ripple-distort` | ripple | number | `0` | `0`–`1` |
| `--fx-ripple-blur` | ripple | number | `12` | `0`–`40` |
| `--fx-ripple-tint` | ripple | number | `0.15` | `0`–`1` |
| `--fx-pixie-density` | pixie | number | `1.25` | `0`–`3` |
| `--fx-pixie-bounds` | pixie | string | `normal` | `loose`, `normal`, `tight`, `strict` |
| `--fx-pixie-scale` | pixie | number | `1` | `0.1`–`5` |
| `--fx-glass-intensity` | glass | number | `0.6` | `0`–`1` |
| `--fx-glass-blur` | glass | number | `12` | `0`–`40` |
| `--fx-glass-saturate` | glass | number | `180` | `100`–`300` |
| `--fx-glass-chroma` | glass | number | `0.3` | `0`–`1` |
| `--fx-glass-spectrum-speed` | glass | number | `1` | `0.1`–`5` |
| `--fx-glass-tint` | glass | number | `0.15` | `0`–`1` |
| `--fx-exp-tilt-max` | exp-tilt | number | `15` | `1`–`45` |
| `--fx-exp-tilt-perspective` | exp-tilt | number | `800` | `200`–`2000` |
| `--fx-exp-tilt-scale` | exp-tilt | number | `1.05` | `1`–`1.15` |
| `--fx-exp-tilt-speed` | exp-tilt | number | `1` | `0.1`–`5` |

## API

```ts
import { init, resolveVars, registry } from "folex-fx";
```

### `init(options?)`

Scans the DOM for `[data-folex]` elements and binds their declared effects.

```ts
interface InitOptions {
  root?: ParentNode;  // default: document
  watch?: boolean;     // observe DOM mutations (SPA-friendly)
}
```

### `resolveVars(host)`

Reads all `--fx-*` custom properties from a host element, validates and clamps them. Returns a `ResolvedVars` object.

```ts
const vars = resolveVars(document.querySelector("[data-folex]"));
console.log(vars.color, vars.intensity, vars.speed);
```

### `registry`

Effect name → setup function map. Add custom effects:

```ts
registry.myEffect = (host, vars) => { /* ... */ };
```

## TypeScript

Types are included. Import them:

```ts
import type { InitOptions, ResolvedVars, Tier, EffectName, EffectSetup, EffectRegistry } from "folex-fx";
```

## Known Limitations

- **Browser-only** — depends on DOM, Canvas API, CSS `@property`. No SSR/Node.js.
- **CSS `@property`** requires Chromium ≥85, Safari ≥15.4, Firefox ≥128. Falls back to non-animated effects where unsupported.
- **Pixie** uses a shared `<canvas>`; z-index ordering between pixie zones is not configurable.
- **Glass effect** requires `backdrop-filter` support and a non-transparent ancestor background for the blur to be visible.

## Versioning

SemVer. 0.x releases may include breaking changes in minor versions. Stability not yet claimed for the public API.

## Contributing

Contributions are welcome! Please follow these guidelines:

1. Clone the repository and install dependencies with `pnpm install`.
2. Run `pnpm test` and `pnpm lint` before submitting a pull request.
3. Keep changes minimal and focused. See [AGENTS.md](AGENTS.md) for internal architecture invariants and design directives.


## License

[Mozilla Public License 2.0](https://mozilla.org/MPL/2.0/) — behaves like MIT when you `npm install` and use it as-is: no copyleft obligation on your code. Only applies if you modify folex's own source files. See [LICENSE](LICENSE) for full terms.
