# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Changed
- Relicensed project from MPL-2.0 to MIT.

## [0.4.2] - 2026-07-31

 ### Removed

- Removed Biome (`@biomejs/biome`) to consolidate all code formatting and linting under ESLint with strict `sadist` rules.

### Changed

- Updated `pnpm run format` script to use `eslint . --fix` instead of `biome format`.

## [0.4.1] - 2026-07-31

### Changed

- Relicensed from MIT to MPL-2.0
- Refactored entire codebase to strict `sadist` functional coding rules (zero `null`/`undefined` in domain code, branded types for handles, functional particle/physics modules, max 3 params, max 20 lines per function, complexity $\le 6$).

## [0.4.0] - 2026-07-26

### Added

- Project backlog tracking file (`TODO.md`) documenting known `tilt`/`glass`/`pixie` issues and planned features

### Changed

- Renamed `tilt` effect to `exp-tilt` and updated CSS custom properties to `--fx-exp-tilt-*` to denote experimental status.

## [0.3.0] - 2026-07-24

### Changed

- Refactored CSS custom property names (`--fx-*`): effect-specific properties now explicitly require effect prefixes (e.g., `--fx-glow-intensity`, `--fx-ripple-layers`, `--fx-pixie-density`), leaving only global properties (`--fx-color`, `--fx-speed`) without an effect prefix

## [0.2.0] - 2026-07-24

### Added

- `tilt` effect — 3D perspective tilt on hover with sub-damped elastic spring return ($\zeta = 0.20$) and release velocity impulse
- Physics suite (`src/physics/`) — semi-implicit Euler spring solver (`spring.ts`), global pointer listener (`pointer.ts`), and auto-suspending rAF loop (`engine.ts`)
- Configurable custom properties: `--fx-tilt-max`, `--fx-tilt-perspective`, `--fx-tilt-scale`, `--fx-tilt-speed`
- GitHub Actions CI workflow (`.github/workflows/ci.yml`) for linting, typechecking, building, and running tests
- Badges (CI status, npm version, license) and Contributing section in `README.md`
- Developer & AI agent directives (`AGENTS.md`)
- Ignore `.notes/` directory for local plans in `.gitignore`

### Changed

- Updated `AGENTS.md` meta-rules with mandatory feature branching workflow (`feature/<name>`, `fix/<name>`) for major changes before merging to `master`

### Fixed

- CI workflow trigger target branch from `main` to `master`

## [0.1.0] - 2026-07-22

### Added

- `glass` effect — glass morphism with backdrop blur, chromatic refraction, spectrum pan, highlight, and prism border animation
- `glow` effect — dual-layer pulsing box-shadow with blend mode support and configurable intensity/speed
- `ripple` effect — multi-layer procedural noise textures (turbulence and cellular/Voronoi fields) with CSS animation drift
- `pixie` effect — canvas-based particle system with three mote behaviors (spin/glow/burst), adaptive quality tiers (eco/balanced/cinematic), IntersectionObserver visibility tracking, and prefers-reduced-motion support
- `init()` — DOM scanner binding effects to elements with `data-folex` attribute, optional MutationObserver watcher
- `resolveVars()` — CSS custom property resolution with validation, clamping, and safe defaults
- `registry` — extensible effect name→setup function map
- Full TypeScript declarations
- Zero runtime dependencies

[Unreleased]: https://github.com/ElBenjaMasLindo/folex/compare/v0.4.0...HEAD
[0.4.0]: https://github.com/ElBenjaMasLindo/folex/compare/v0.3.0...v0.4.0
[0.3.0]: https://github.com/ElBenjaMasLindo/folex/compare/v0.2.0...v0.3.0
[0.2.0]: https://github.com/ElBenjaMasLindo/folex/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/ElBenjaMasLindo/folex/releases/tag/v0.1.0
