# Folex (folx)

Lightweight, zero-dependency visual effects library for plain HTML. Glass morphism, glow, ripple, and particle effects driven entirely by CSS custom properties — no JavaScript configuration required.

```html
<div data-folex="glass glow" style="--fx-color: #7c3aed; --fx-speed: 1.2">
  ✨ hover me
</div>
```

## Install

```sh
pnpm add folx
# or
npm install folx
```

## Quickstart

```html
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <link rel="stylesheet" href="node_modules/folx/dist/folex.css" />
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
  <div class="box" data-folex="glass glow ripple" style="--fx-color: #7c3aed; --fx-layers: 3">
    Folex
  </div>
  <script type="module">
    import { init } from "folx";
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
import { init } from "folx";
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
import { registry } from "folx";
registry.myEffect = (host, vars) => {
  // vars.color, vars.intensity, vars.speed, ...
  host.style.filter = `hue-rotate(${vars.speed * 60}deg)`;
};
```

## CSS Custom Properties

All configuration via `--fx-*` properties on the host element. Every property has safe defaults.

| Property | Effects | Type | Default | Range |
|----------|---------|------|---------|-------|
| `--fx-color` | all | color | derived from `color`/`background-color` of element, or `#ffb37c` | any valid CSS color |
| `--fx-intensity` | glow, ripple | number | `0.6` | `0`–`1` |
| `--fx-speed` | all | number | `1` | `0.1`–`5` |
| `--fx-scale` | ripple | number | `1` | `0.1`–`5` |
| `--fx-density` | pixie | number | `1.25` | `0`–`3` |
| `--fx-layers` | ripple | integer | `1` | `1`–`12` |
| `--fx-field` | ripple | string | `turbulence` | `turbulence`, `cellular` |
| `--fx-blend` | glow | string | `overlay` | `screen`, `multiply`, `overlay`, `soft-light`, `hard-light`, `darken`, `lighten`, `color-dodge`, `color-burn` |
| `--fx-distort` | ripple | number | `0` | `0`–`1` |
| `--fx-blur` | ripple | number | `12` | `0`–`40` |
| `--fx-tint` | ripple | number | `0.15` | `0`–`1` |
| `--fx-glass-blur` | glass | number | `12` | `0`–`40` |
| `--fx-glass-saturate` | glass | number | `180` | `100`–`300` |
| `--fx-glass-chroma` | glass | number | `0.3` | `0`–`1` |
| `--fx-glass-spectrum-speed` | glass | number | `1` | `0.1`–`5` |
| `--fx-pixie-bounds` | pixie | string | `normal` | `loose`, `normal`, `tight`, `strict` |
| `--fx-dur` | glow | time | `3s` | any CSS time |

## API

```ts
import { init, resolveVars, registry } from "folx";
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
import type { InitOptions, ResolvedVars, Tier, EffectName, EffectSetup, EffectRegistry } from "folx";
```

## Known Limitations

- **Browser-only** — depends on DOM, Canvas API, CSS `@property`. No SSR/Node.js.
- **CSS `@property`** requires Chromium ≥85, Safari ≥15.4, Firefox ≥128. Falls back to non-animated effects where unsupported.
- **Pixie** uses a shared `<canvas>`; z-index ordering between pixie zones is not configurable.
- **Glass effect** requires `backdrop-filter` support and a non-transparent ancestor background for the blur to be visible.

## Versioning

SemVer. 0.x releases may include breaking changes in minor versions. Stability not yet claimed for the public API.

## License

MIT
