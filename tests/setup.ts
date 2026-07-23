import { beforeAll } from "vitest";

// happy-dom ships CSS.supports as a `return true` stub, which makes the
// safeColor validator's rejection path untestable. Install a realistic
// implementation for the `color` property that mirrors real-browser
// semantics: valid CSS colors are accepted, everything else is rejected.
// This is test infra only; the production validator uses the real
// CSS.supports, which is correct in actual browsers.

const NAMED = (
  "aliceblue antiquewhite aqua aquamarine azure beige bisque black " +
  "blanchedalmond blue blueviolet brown burlywood cadetblue chartreuse " +
  "chocolate coral cornflowerblue cornsilk crimson cyan darkblue darkcyan " +
  "darkgoldenrod darkgray darkgreen darkgrey darkkhaki darkmagenta " +
  "darkolivegreen darkorange darkorchid darkred darksalmon darkseagreen " +
  "darkslateblue darkslategray darkslategrey darkturquoise darkviolet " +
  "deeppink deepskyblue dimgray dimgrey dodgerblue firebrick floralwhite " +
  "forestgreen fuchsia gainsboro ghostwhite gold goldenrod gray green " +
  "greenyellow grey honeydew hotpink indianred indigo ivory khaki " +
  "lavender lavenderblush lawngreen lemonchiffon lightblue lightcoral " +
  "lightcyan lightgoldenrodyellow lightgray lightgreen lightgrey lightpink " +
  "lightsalmon lightseagreen lightskyblue lightslategray lightslategrey " +
  "lightsteelblue lightyellow lime limegreen linen magenta maroon " +
  "mediumaquamarine mediumblue mediumorchid mediumpurple mediumseagreen " +
  "mediumslateblue mediumspringgreen mediumturquoise mediumvioletred " +
  "midnightblue mintcream mistyrose moccasin navajowhite navy oldlace olive " +
  "olivedrab orange orangered orchid palegoldenrod palegreen paleturquoise " +
  "palevioletred papayawhip peachpuff peru pink plum powderblue purple " +
  "rebeccapurple red rosybrown royalblue saddlebrown salmon sandybrown " +
  "seagreen seashell sienna silver skyblue slateblue slategray slategrey " +
  "snow springgreen steelblue tan teal thistle tomato turquoise violet " +
  "wheat white whitesmoke yellow yellowgreen transparent currentcolor " +
  "inherit initial unset"
).split(/\s+/);

function looksLikeColor(value: string): boolean {
  const s = value.trim().toLowerCase();
  if (s.length === 0) return false;
  if (NAMED.includes(s)) return true;
  if (/^#([0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(s)) return true;
  const m = s.match(/^(rgba?|hsla?|lab|lch|oklab|oklch)\(([^)]*)\)$/);
  if (m) {
    const parts = m[2].split(/[ ,/]+/).filter(Boolean);
    return parts.length > 0 && parts.every((p) => /^-?\d*\.?\d+(%|deg|rad|turn)?$/.test(p));
  }
  return false;
}

function installPatch() {
  const css = globalThis.CSS;
  if (!css || typeof css.supports !== "function") return false;
  try {
    const wrapper = Object.create(css) as typeof css;
    Object.defineProperty(wrapper, "supports", {
      value: (property: string, value?: string) => {
        if (typeof value === "string" && property === "color") return looksLikeColor(value);
        return css.supports(property as never, value as never);
      },
      writable: true,
      configurable: true,
      enumerable: false,
    });
    Object.defineProperty(globalThis, "CSS", {
      get: () => wrapper,
      configurable: true,
    });
    return true;
  } catch {
    return false;
  }
}

beforeAll(() => {
  installPatch();
});
