# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
