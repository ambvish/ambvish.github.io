// The date and time in the menu bar, in the visitor's own time zone.
export function initClock() {
  const clock = document.querySelector("[data-clock]");
  if (!clock) return;
  const format = new Intl.DateTimeFormat(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
  const tick = () => {
    const now = new Date();
    clock.textContent = format.format(now);
    clock.dateTime = now.toISOString();
  };
  tick();
  clock.hidden = false;
  setInterval(tick, 15_000);
}
