// Runs before the page is drawn: switches the CSS to the desktop layout, so nothing jumps.
// If JavaScript is off, this never runs and the page stays a simple, readable grid.
document.documentElement.classList.add("has-js");
