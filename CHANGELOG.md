# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- `tilt` effect — 3D perspective tilt on hover with sub-damped elastic spring return ($\zeta = 0.20$) and release velocity impulse
- Physics suite (`src/physics/`) — semi-implicit Euler spring solver (`spring.ts`), global pointer listener (`pointer.ts`), and auto-suspending rAF loop (`engine.ts`)
- Configurable custom properties: `--fx-tilt-max`, `--fx-tilt-perspective`, `--fx-tilt-scale`, `--fx-tilt-speed`
- GitHub Actions CI workflow (`.github/workflows/ci.yml`) for linting, typechecking, building, and running tests
- Badges (CI status, npm version, license) and Contributing section in `README.md`
- Developer & AI agent directives (`AGENTS.md`)
- Ignore `.notes/` directory for local plans in `.gitignore`

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

[0.1.0]: https://github.com/ElBenjaMasLindo/folex/releases/tag/v0.1.0
