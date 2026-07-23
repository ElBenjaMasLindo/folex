import { registry } from "../effects/registry";
import { type ResolvedVars, resolveVars } from "./derive";

export interface InitOptions {
  root?: ParentNode;
  watch?: boolean;
}

const ATTR = "data-folex";
const BOUND = "data-folex-bound";

function ensurePosition(host: HTMLElement): void {
  const cs = getComputedStyle(host);
  if (cs.position === "static" || host.style.position === "") host.style.position = "relative";
  if (cs.zIndex === "auto") host.style.zIndex = "0";
}

function bindHost(host: HTMLElement): void {
  if (host.hasAttribute(BOUND)) return;
  const raw = host.getAttribute(ATTR);
  if (!raw) return;
  const names = raw.trim().split(/\s+/).filter(Boolean);
  if (names.length === 0) return;

  const vars: ResolvedVars = resolveVars(host);
  ensurePosition(host);
  for (const name of names) {
    const setup = registry[name];
    if (!setup) continue;
    try {
      setup(host, vars);
    } catch {
      // A thrown error in a single effect never breaks the rest of the page.
    }
  }
  host.setAttribute(BOUND, "");
}

function scan(root: ParentNode): void {
  const hosts = root.querySelectorAll<HTMLElement>(`[${ATTR}]`);
  for (const host of hosts) bindHost(host);
}

export function init(opts?: InitOptions): void {
  const root = opts?.root ?? document;
  scan(root);
  if (opts?.watch && typeof MutationObserver !== "undefined") {
    const mo = new MutationObserver((mutations) => {
      for (const m of mutations) {
        m.addedNodes.forEach((node) => {
          if (node.nodeType !== 1) return;
          const el = node as HTMLElement;
          if (el.hasAttribute?.(ATTR)) bindHost(el);
          scan(el);
        });
      }
    });
    mo.observe(root as Node, { childList: true, subtree: true });
  }
}
