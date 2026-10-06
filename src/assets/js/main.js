import { initDesktop } from "./desktop.js";
import { initFilters } from "./filters.js";
import { initClock } from "./clock.js";
import { initPalette } from "./palette.js";
import { initGame } from "./game.js";

// Things that only make sense with JavaScript stay hidden until now.
for (const element of document.querySelectorAll("[data-js-only]")) element.hidden = false;

// Keyboard hint: ⌘ on Apple devices, Ctrl everywhere else.
const platform = navigator.userAgentData?.platform || navigator.platform || "";
if (!/mac|iphone|ipad/i.test(platform)) {
  for (const key of document.querySelectorAll("[data-modkey]")) key.textContent = "Ctrl";
}

const desktop = initDesktop();
initFilters();
initClock();
initPalette(desktop);
initGame();
