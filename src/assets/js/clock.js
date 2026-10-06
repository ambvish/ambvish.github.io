// The date and time in the menu bar, in the visitor's own time zone.
// Dates are numeric month/day/year everywhere on the site, e.g. "Tue 10/6/2026 10:01 AM".
export function initClock() {
  const clock = document.querySelector("[data-clock]");
  if (!clock) return;
  const day = new Intl.DateTimeFormat("en-US", { weekday: "short" });
  const date = new Intl.DateTimeFormat("en-US", { month: "numeric", day: "numeric", year: "numeric" });
  const time = new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit" });
  const format = { format: (now) => `${day.format(now)} ${date.format(now)} ${time.format(now)}` };
  const tick = () => {
    const now = new Date();
    clock.textContent = format.format(now);
    clock.dateTime = now.toISOString();
  };
  tick();
  clock.hidden = false;
  setInterval(tick, 15_000);
}
