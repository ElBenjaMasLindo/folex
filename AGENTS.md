Compliance with these rules is non-negotiable in folex (`folex-fx`) development.

## 1. Design Philosophy

> *"There are two ways of constructing a software design: One way is to make it so simple that there are obviously no deficiencies, and the other way is to make it so complicated that there are no obvious deficiencies. Finds solutions so simple that they obviously can't fail."*
> *"If the solution is clearly superior as a mathematical algorithm, use it."*
> *"Simplicity is prerequisite for reliability."*
> *"Perfection is achieved, not when there is nothing more to add, but when there is nothing left to take away."*
> *"To ask the right question is already half the solution of a problem."*
> *"Take as much time as you need; time isn't a problem, but the result is."*

## 2. Mandatory Changelog Policy & Audit

- **Keep CHANGELOG.md Updated**: Any modification, addition, or bug fix MUST be recorded in `CHANGELOG.md`.
- **Audit Before Re-inventing**: Inspect `CHANGELOG.md` and existing codebase before implementing new features or helpers. Never duplicate existing utilities (`resolveVars`, `safeColor`, `particleEngine`) or re-create implemented effects.
- **Format**: Follow [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) standards (`Added`, `Changed`, `Deprecated`, `Removed`, `Fixed`, `Security`) and adhere to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).


## 3. Non-Negotiable Architecture Invariants

1. **Zero Runtime Dependencies**: No runtime external packages in `package.json`. Everything must be native TypeScript/CSS.
2. **GPU Compositor Animations Only**: Keyframe CSS animations MUST touch ONLY `transform` and `opacity`. No per-frame keyframe animations on `background-position`, `width`, `height`, `box-shadow`, or `filter`.
3. **Centralized Input Validation**: All custom properties (`--fx-*`) pass through `src/core/validate.ts` (`numberInRange`, `enumMatch`, `safeColor`). Never write inline validation in effect setup files. Unknown, out-of-bounds, or invalid inputs MUST NOT throw exceptions; they fall back to defaults gracefully.
4. **Single Global rAF & Shared Canvas**: Exactly one `requestAnimationFrame` loop and one `<canvas>` element managed in `src/particles/engine.ts`. Individual effect files MUST NOT spawn `rAF`, `setInterval`, or `setTimeout`.
5. **Zero Per-Frame Layout Thrashing**: `getComputedStyle` is called at most once per host element at setup time in `src/core/derive.ts`. Never call `getComputedStyle` per frame or inside loops.
6. **Bounded Particle Memory**: `MotePool` must remain fixed-capacity. Particle removal must use $O(1)$ swap-with-last (no `splice`). No per-frame garbage collector allocations.
7. **Lifecycle & Accessibility**:
   - Check `host.isConnected` for automatic cleanup.
   - Respect `prefers-reduced-motion: reduce` (disable motes, freeze CSS keyframes).
   - Pause processing on `document.hidden` or when elements leave viewport (`IntersectionObserver`).
8. **File Size Constraint**: Max ~150 lines per source file. If a file grows beyond 150 lines, refine the architecture rather than appending complexity.

## 4. AI Meta-Rules for Code Modification

- **Smallest Possible Diff**: Apply requested changes with the absolute smallest possible diff. Do not touch, reformat, rename, or refactor unrelated code.
- **No Speculative Abstractions**: Do not introduce base classes, unused interfaces, plugin hooks, or state managers "just in case". Implement only what is explicitly needed.
- **Global Singletons Only**: Any new observer or browser listener must be registered as a single global instance in `engine.ts` or `orchestrator.ts`, never per host element.
- **Testing Enforcement**: Any modification to `src/core/` or `src/particles/` MUST be verified by running and updating tests in `tests/` (`vitest`). Never declare completion with failing tests.
- **Feature Branching Workflow**: Major modifications, new effects (e.g. `feature/tilt-effect`), or non-trivial architectural changes MUST be isolated on dedicated feature/fix branches (`feature/<name>`, `fix/<name>`). Fully verify tests and build quality before merging back into `master`.
- **Code Comments**: Do not narrate what code does. Only comment to explain *why* a non-obvious decision was made. Keep inline comments minimal, technical, and single-line.
- **Conventional Commits**: Commit messages must follow the Conventional Commits format (lowercase type, concise imperative description, e.g. `feat: add glass effect`).
- **Package Safety & Lockfile**: Pin exact versions. Never modify or regenerate `pnpm-lock.yaml` without explicit consent.
