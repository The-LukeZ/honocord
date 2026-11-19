// Checks src/styles/tokens.css: every color token exists in both themes and
// text/background pairs reach WCAG AA (4.5:1). Exits 1 and lists offenders.
import { readFile } from "node:fs/promises";

const COLOR_TOKENS = [
  "bg",
  "surface",
  "embed",
  "recessed",
  "hairline",
  "text",
  "muted",
  "active",
  "link",
  "button",
  "button-text",
  "button-secondary",
  "button-secondary-text",
  "flame-from",
  "flame-to",
  "code-bg",
  "aside-note",
  "aside-tip",
  "aside-caution",
  "aside-danger",
  "aside-note-text",
  "aside-tip-text",
  "aside-caution-text",
  "aside-danger-text",
];
const PAIRS = [
  ["text", "bg"],
  ["text", "surface"],
  ["muted", "bg"],
  ["muted", "surface"],
  ["link", "bg"],
  ["link", "surface"],
  ["text", "embed"],
  ["muted", "embed"],
  ["link", "embed"],
  ["button-text", "button"],
  ["button-secondary-text", "button-secondary"],
  ["aside-note-text", "embed"],
  ["aside-tip-text", "embed"],
  ["aside-caution-text", "embed"],
  ["aside-danger-text", "embed"],
];

let css;
try {
  css = await readFile(new URL("../src/styles/tokens.css", import.meta.url), "utf8");
} catch {
  console.error("FAIL: src/styles/tokens.css not found");
  process.exit(1);
}

// Returns the --hc-* hex values of the rule whose whole selector is `selector`.
function block(selector) {
  const tokens = {};
  let at = -1;
  for (let i = css.indexOf(selector); i !== -1; i = css.indexOf(selector, i + 1)) {
    if (/^\s*\{/.test(css.slice(i + selector.length))) {
      at = i;
      break;
    }
  }
  if (at === -1) return tokens;
  const body = css.slice(css.indexOf("{", at) + 1, css.indexOf("}", at));
  for (const [, name, hex] of body.matchAll(/--hc-([\w-]+)\s*:\s*(#[0-9a-fA-F]{6})\b/g)) {
    tokens[name] = hex;
  }
  return tokens;
}

function luminance(hex) {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function ratio(a, b) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

const themes = { dark: block(":root"), light: block(':root[data-theme="light"]') };
const problems = [];
for (const token of COLOR_TOKENS) {
  for (const [theme, tokens] of Object.entries(themes)) {
    if (!tokens[token]) problems.push(`${theme}: missing --hc-${token}`);
  }
}
for (const [theme, tokens] of Object.entries(themes)) {
  for (const [fg, bg] of PAIRS) {
    if (!tokens[fg] || !tokens[bg]) continue;
    const r = ratio(tokens[fg], tokens[bg]);
    const line = `${theme}: ${fg}/${bg} ${tokens[fg]} on ${tokens[bg]} = ${r.toFixed(2)}:1`;
    if (r < 4.5) problems.push(line);
    else console.log(`ok   ${line}`);
  }
}
if (problems.length) {
  for (const p of problems) console.error(`FAIL ${p}`);
  process.exit(1);
}
console.log("PASS");
