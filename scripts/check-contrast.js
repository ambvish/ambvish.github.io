// Checks every text/background color pair in tokens.css against WCAG AA.
// Run with `npm run check:contrast` (the deploy workflow runs it too).
import { readFileSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";

const TOKENS = fileURLToPath(new URL("../src/assets/css/tokens.css", import.meta.url));

// [foreground, background, minimum ratio, what it is]
// 4.5:1 is AA for normal text; 3:1 is AA for large text, icons, borders and focus rings.
const PAIRS = [
  ["menubar-text", "menubar", 4.5, "menu bar text"],
  ["text", "window", 4.5, "window text"],
  ["text", "window-bar", 4.5, "active window titles"],
  ["text-muted", "window", 4.5, "dates, excerpts and labels"],
  ["text-muted", "window-bar", 4.5, "inactive window titles"],
  ["text", "control", 4.5, "dropdown and search text"],
  ["text-muted", "control", 4.5, "search placeholder"],
  ["link", "window", 4.5, "links in windows"],
  ["focus", "window", 3, "focus ring on windows"],
  ["focus", "window-bar", 3, "focus ring on title bars"],
  ["focus", "menubar", 3, "focus ring on the menu bar"],
  ["highlight-text", "highlight", 4.5, "selected search result"],
  ["note-text", "note", 4.5, "sticky note text"],
  ["note-link", "note", 4.5, "sticky note links"],
  ...["ai", "vision", "web", "backend", "hardware", "research", "health", "neutral"].map((tone) => [
    "cover-text", `cover-${tone}`, 4.5, `text on ${tone} project covers`,
  ]),
  ["draft-text", "draft", 4.5, "draft labels (dev server only)"],
];

export function readTokens(file = TOKENS) {
  const css = readFileSync(file, "utf8");
  const colors = {};
  for (const [, name, hex] of css.matchAll(/--([\w-]+):\s*(#[0-9a-f]{3,6})\s*;/gi)) colors[name] = hex;
  return colors;
}

function luminance(hex) {
  let h = hex.slice(1);
  if (h.length === 3) h = [...h].map((c) => c + c).join("");
  const [r, g, b] = [0, 2, 4].map((i) => {
    const c = parseInt(h.slice(i, i + 2), 16) / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function ratio(fg, bg) {
  const [hi, lo] = [luminance(fg), luminance(bg)].sort((a, b) => b - a);
  return (hi + 0.05) / (lo + 0.05);
}

export function contrastReport(file = TOKENS) {
  const colors = readTokens(file);
  return PAIRS.map(([fg, bg, min, label]) => {
    if (!colors[fg] || !colors[bg]) throw new Error(`Missing color token --${colors[fg] ? bg : fg}`);
    const r = ratio(colors[fg], colors[bg]);
    return { fg, bg, min, label, ratio: Math.round(r * 100) / 100, pass: r >= min };
  });
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const rows = contrastReport();
  for (const r of rows) {
    const mark = r.pass ? "pass" : "FAIL";
    console.log(`  ${mark}  ${r.ratio.toFixed(2).padStart(5)}:1  (needs ${r.min}:1)  ${r.fg} on ${r.bg}: ${r.label}`);
  }
  const failures = rows.filter((r) => !r.pass);
  console.log(failures.length ? `\n${failures.length} pair(s) fail WCAG AA.` : "\nAll pairs pass WCAG AA.");
  process.exitCode = failures.length ? 1 : 0;
}
