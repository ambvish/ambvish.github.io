// The desktop: windows come to the front when clicked, drag by their title bar (the sticky note
// drags from anywhere), and the traffic lights close, minimize (roll up) and zoom them.
// Closed windows wait in the dock at the bottom; click one to bring it back.
// Experience, research and project items open as their own windows.
// Under 900px wide none of this runs: windows simply stack and links go to real pages.

const WIDE = window.matchMedia("(min-width: 900px)");
const INTERACTIVE = "a, button, input, select, textarea, summary, label";

let zTop = 20;
let articlesOpened = 0;

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

export function initDesktop() {
  const desk = document.querySelector("[data-desk]");
  if (!desk) return null;
  const dock = document.querySelector("[data-dock]");

  for (const win of desk.querySelectorAll("[data-window]")) setUp(win);
  applyMode();
  WIDE.addEventListener("change", applyMode);
  let resizeTimer;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      makeRoomForNote();
      renderDock();
    }, 150);
  });
  document.addEventListener("click", onClick);
  document.addEventListener("keydown", onKeydown);

  // A link such as /#projects opens that window.
  if (location.hash) {
    const target = document.getElementById(decodeURIComponent(location.hash.slice(1)));
    if (target?.matches("[data-window]")) openWindow(target);
  }

  return { open: openWindow, openArticle, isWide: () => WIDE.matches };

  // Switch between the desktop (wide screens) and the stacked phone layout.
  function applyMode() {
    for (const win of desk.querySelectorAll("[data-window]")) prepare(win);
    makeRoomForNote();
    renderDock();
  }

  // One button per closed window, in page order.
  function renderDock() {
    if (!dock) return;
    const closed = WIDE.matches
      ? [...desk.querySelectorAll("[data-window]:not([data-ephemeral])")].filter(
          (win) => win.hidden && win.querySelector('[data-action="close"]'),
        )
      : [];
    dock.replaceChildren(
      ...closed.map((win) => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "dock__item";
        button.dataset.openWindow = win.id;
        button.textContent = win.dataset.title;
        return button;
      }),
    );
    dock.hidden = closed.length === 0;
  }

  // The sticky note grows with its text. Keep the window below it (Skills) clear of the note:
  // move it down if there's room; on short screens, put it in the dock instead.
  // Once a visitor moves, closes or opens it themselves, it's left alone.
  function makeRoomForNote() {
    const note = document.getElementById("note");
    const below = document.getElementById("skills");
    if (!WIDE.matches || !note || !below || "moved" in below.dataset || "opened" in below.dataset) return;
    if ("autoClosed" in below.dataset) {
      below.hidden = false;
      delete below.dataset.autoClosed;
    }
    if (below.hidden) return;
    for (const property of ["top", "height"]) below.style.removeProperty(property);
    const clearance = note.offsetTop + note.offsetHeight + 16;
    if (below.offsetTop >= clearance) return;
    const room = desk.clientHeight - clearance - 16;
    if (room >= 180) {
      below.style.top = `${clearance}px`;
      below.style.height = `${room}px`;
    } else {
      below.hidden = true;
      below.dataset.autoClosed = "";
    }
  }

  function prepare(win) {
    const wide = WIDE.matches;
    for (const button of win.querySelectorAll("[data-action]")) button.disabled = !wide;
    const body = win.querySelector(".window__body");
    const title = win.querySelector(".window__title");
    if (body && title) {
      if (wide) {
        // Lets keyboard users scroll a window's contents.
        body.tabIndex = 0;
        body.setAttribute("role", "region");
        body.setAttribute("aria-labelledby", title.id);
      } else {
        body.removeAttribute("tabindex");
        body.removeAttribute("role");
        body.removeAttribute("aria-labelledby");
      }
    }
    if (wide) {
      if ("startClosed" in win.dataset && !("opened" in win.dataset)) win.hidden = true;
    } else {
      win.hidden = false;
      win.classList.remove("is-zoomed", "is-shaded");
      for (const property of ["top", "left", "right", "width", "height", "z-index"]) win.style.removeProperty(property);
    }
  }

  function setUp(win) {
    win.addEventListener("pointerdown", () => focusWindow(win));
    win.addEventListener("focusin", () => focusWindow(win));

    for (const button of win.querySelectorAll("[data-action]")) {
      button.addEventListener("click", () => {
        const action = button.dataset.action;
        if (action === "close") closeWindow(win);
        if (action === "minimize") toggle(win, "is-shaded", button);
        if (action === "zoom") toggle(win, "is-zoomed", button);
      });
    }

    const handle = win.matches("[data-drag-handle]") ? win : win.querySelector("[data-drag-handle]");
    if (handle) enableDrag(win, handle);
  }

  function toggle(win, className, button) {
    const on = win.classList.toggle(className);
    button.setAttribute("aria-pressed", String(on));
  }

  function enableDrag(win, handle) {
    handle.addEventListener("pointerdown", (event) => {
      if (!WIDE.matches || event.button !== 0 || win.classList.contains("is-zoomed")) return;
      if (event.target.closest(INTERACTIVE)) return;

      const startX = event.clientX;
      const startY = event.clientY;
      const startLeft = win.offsetLeft;
      const startTop = win.offsetTop;
      let dragged = false;
      handle.setPointerCapture(event.pointerId);
      event.preventDefault();

      const move = (moveEvent) => {
        const dx = moveEvent.clientX - startX;
        const dy = moveEvent.clientY - startY;
        if (!dragged && Math.hypot(dx, dy) < 3) return;
        if (!dragged) {
          dragged = true;
          win.dataset.moved = "";
          win.classList.add("is-dragging");
        }
        // Keep at least part of the window, including its title bar, on the desk.
        const left = clamp(startLeft + dx, 80 - win.offsetWidth, desk.clientWidth - 80);
        const top = clamp(startTop + dy, 0, desk.clientHeight - 48);
        place(win, left, top);
      };
      const stop = () => {
        handle.removeEventListener("pointermove", move);
        handle.removeEventListener("pointerup", stop);
        handle.removeEventListener("pointercancel", stop);
        win.classList.remove("is-dragging");
        // A plain click on a window that's mostly below the edge brings it up.
        if (!dragged && win.offsetTop > desk.clientHeight - win.offsetHeight / 2) bringIntoView(win);
      };
      handle.addEventListener("pointermove", move);
      handle.addEventListener("pointerup", stop);
      handle.addEventListener("pointercancel", stop);
    });
  }

  function place(win, left, top) {
    win.style.left = `${left}px`;
    win.style.top = `${top}px`;
    win.style.right = "auto";
  }

  // A window tucked mostly below the bottom edge slides up so all of it can be seen.
  function bringIntoView(win) {
    const maxTop = desk.clientHeight - win.offsetHeight - 16;
    if (win.offsetTop > maxTop) place(win, win.offsetLeft, Math.max(16, maxTop));
  }

  function focusWindow(win) {
    if (!WIDE.matches) return;
    const current = desk.querySelector("[data-window].is-active");
    if (current === win) return;
    current?.classList.remove("is-active");
    win.classList.add("is-active");
    zTop += 1;
    win.style.zIndex = String(zTop);
  }

  function openWindow(target) {
    const win = typeof target === "string" ? document.getElementById(target) : target;
    if (!win) return false;
    win.dataset.opened = "";
    win.hidden = false;
    win.classList.remove("is-shaded");
    win.querySelector('[data-action="minimize"]')?.setAttribute("aria-pressed", "false");
    if (WIDE.matches) {
      bringIntoView(win);
      focusWindow(win);
      win.focus({ preventScroll: true });
    } else {
      win.scrollIntoView({ block: "start" });
      win.focus({ preventScroll: true });
    }
    renderDock();
    return true;
  }

  function closeWindow(win) {
    win.classList.remove("is-active");
    if ("ephemeral" in win.dataset) win.remove();
    else win.hidden = true;
    renderDock();

    // Hand focus to whichever window is now on top.
    const next = [...desk.querySelectorAll("[data-window]:not([hidden])")].sort(
      (a, b) => (Number(getComputedStyle(b).zIndex) || 0) - (Number(getComputedStyle(a).zIndex) || 0),
    )[0];
    if (next) {
      focusWindow(next);
      next.focus({ preventScroll: true });
    }
  }

  // Opens an experience or research article (from a <template> on the page) in its own window.
  function openArticle(key) {
    const id = `window-${key}`;
    const existing = document.getElementById(id);
    if (existing) return openWindow(existing);

    const source = document.getElementById(`article-${key}`);
    const frame = document.getElementById("window-frame");
    if (!source || !frame) return false;

    const win = frame.content.firstElementChild.cloneNode(true);
    const title = source.dataset.title;
    const heading = win.querySelector(".window__title");
    win.id = id;
    win.dataset.title = title;
    heading.id = `${id}-title`;
    heading.textContent = title;
    win.setAttribute("aria-labelledby", heading.id);
    for (const button of win.querySelectorAll("[data-action]")) {
      button.setAttribute("aria-label", `${button.dataset.label} ${title}`);
    }
    win.querySelector("[data-page-link]").href = source.dataset.href;
    win.querySelector(".window__body").append(source.content.cloneNode(true));

    desk.append(win);
    setUp(win);
    prepare(win);

    // Open near the middle, each new one a little further down and to the right.
    // Projects get a wider window for their cover-and-story layout.
    const step = articlesOpened++ % 6;
    const wide = "wide" in source.dataset;
    const width = Math.min(wide ? 960 : 760, desk.clientWidth * (wide ? 0.74 : 0.58));
    const height = Math.min(wide ? 700 : 680, desk.clientHeight * (wide ? 0.86 : 0.8));
    win.style.width = `${width}px`;
    win.style.height = `${height}px`;
    place(win, Math.max(16, (desk.clientWidth - width) / 2 + step * 28), 36 + step * 28);
    return openWindow(win);
  }

  function onClick(event) {
    if (!WIDE.matches || event.defaultPrevented) return;

    const opener = event.target.closest("[data-open-window]");
    if (opener && document.getElementById(opener.dataset.openWindow)) {
      event.preventDefault();
      openWindow(opener.dataset.openWindow);
      return;
    }

    // A plain click on an article row opens it as a window; modified clicks follow the link.
    const row = event.target.closest("[data-open-article]");
    const canOpen = row && document.getElementById(`article-${row.dataset.openArticle}`);
    if (canOpen && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey) {
      event.preventDefault();
      openArticle(row.dataset.openArticle);
    }
  }

  // Esc closes the window you're in (a search box with text in it clears first).
  function onKeydown(event) {
    if (event.key !== "Escape" || !WIDE.matches || event.defaultPrevented) return;
    if (document.querySelector("dialog[open]")) return;
    const win = document.activeElement?.closest?.("[data-window]");
    if (!win || !win.querySelector('[data-action="close"]')) return;
    if (event.target.matches?.("input") && event.target.value) return;
    event.preventDefault();
    closeWindow(win);
  }
}
