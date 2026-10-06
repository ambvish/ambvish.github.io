// Search palette (⌘K / Ctrl+K, or the magnifier in the menu bar).
// It searches what's already on the page: every window plus anything marked with data-search.
// Results are built with textContent, never as HTML.

const LIMIT = 12;

// When two results match equally well, prefer the one that opens the most useful view.
const KIND_WEIGHT = { Window: 0.6, PDF: 0.55, Link: 0.55, Experience: 0.5, Research: 0.5, Recommendation: 0.45, Project: 0.45, Education: 0.3, Certification: 0.2, Skill: 0.1 };

export function initPalette(desktop) {
  const dialog = document.querySelector("[data-palette]");
  if (!dialog || typeof dialog.showModal !== "function") return;

  const input = dialog.querySelector("[data-palette-input]");
  const list = dialog.querySelector("[data-palette-results]");
  const empty = dialog.querySelector("[data-palette-empty]");
  let results = [];
  let selected = 0;
  let returnFocus = null;

  for (const button of document.querySelectorAll("[data-open-palette]")) {
    button.hidden = false;
    button.addEventListener("click", open);
  }

  document.addEventListener("keydown", (event) => {
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
      event.preventDefault();
      if (dialog.open) dialog.close();
      else open();
    }
  });

  input.addEventListener("input", render);
  input.addEventListener("keydown", (event) => {
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      move(event.key === "ArrowDown" ? 1 : -1);
    } else if (event.key === "Enter") {
      event.preventDefault();
      choose(results[selected]);
    }
  });
  list.addEventListener("click", (event) => {
    const option = event.target.closest('[role="option"]');
    if (option) choose(results[Number(option.dataset.index)]);
  });
  // Clicking the dimmed backdrop closes the palette.
  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) dialog.close();
  });
  dialog.addEventListener("close", () => {
    returnFocus?.focus?.({ preventScroll: true });
    returnFocus = null;
  });

  function open() {
    returnFocus = document.activeElement;
    input.value = "";
    render();
    dialog.showModal();
    input.focus();
  }

  function entries() {
    const items = [];
    for (const win of document.querySelectorAll("[data-window]:not([data-ephemeral])")) {
      items.push({ title: win.dataset.title, kind: "Window", detail: "", run: () => desktop?.open(win) });
    }
    for (const element of document.querySelectorAll("[data-search]")) {
      items.push({
        title: element.dataset.search,
        kind: element.dataset.kind || "",
        detail: element.dataset.detail || "",
        run: () => reveal(element),
      });
    }
    return items;
  }

  function render() {
    const query = input.value.trim().toLowerCase();
    const all = entries();
    const matches = query
      ? all.filter((entry) => `${entry.title} ${entry.kind} ${entry.detail}`.toLowerCase().includes(query))
      : all.filter((entry) => entry.kind === "Window");
    results = matches.sort((a, b) => rank(b, query) - rank(a, query)).slice(0, LIMIT);
    selected = 0;

    list.replaceChildren(
      ...results.map((entry, index) => {
        const option = document.createElement("li");
        option.id = `palette-option-${index}`;
        option.className = "palette__item";
        option.setAttribute("role", "option");
        option.dataset.index = String(index);
        option.setAttribute("aria-label", entry.kind ? `${entry.title}, ${entry.kind}` : entry.title);
        const title = document.createElement("span");
        title.className = "palette__title";
        title.textContent = entry.title;
        const kind = document.createElement("span");
        kind.className = "palette__kind";
        kind.textContent = entry.kind;
        option.append(title, kind);
        return option;
      }),
    );
    empty.hidden = results.length > 0;
    highlight();
  }

  function rank(entry, query) {
    if (!query) return 0;
    const title = entry.title.toLowerCase();
    const weight = KIND_WEIGHT[entry.kind] || 0;
    if (title.startsWith(query)) return 3 + weight;
    if (title.includes(query)) return 2 + weight;
    return 1 + weight;
  }

  function move(step) {
    if (!results.length) return;
    selected = (selected + step + results.length) % results.length;
    highlight();
  }

  function highlight() {
    const options = list.querySelectorAll('[role="option"]');
    options.forEach((option, index) => option.setAttribute("aria-selected", String(index === selected)));
    const active = options[selected];
    if (active) {
      input.setAttribute("aria-activedescendant", active.id);
      active.scrollIntoView({ block: "nearest" });
    } else {
      input.removeAttribute("aria-activedescendant");
    }
  }

  function choose(entry) {
    if (!entry) return;
    returnFocus = null;
    dialog.close();
    entry.run();
  }

  // Go to a search result: open its article, follow its link, or bring up its window and point at it.
  function reveal(element) {
    if (element.dataset.openArticle) {
      if (desktop?.isWide()) desktop.openArticle(element.dataset.openArticle);
      else location.href = element.href;
      return;
    }
    if (element.matches("[data-copy-email]")) {
      element.click();
      return;
    }
    if (element.matches("a[href]")) {
      if (element.target === "_blank") window.open(element.href, "_blank", "noopener,noreferrer");
      else location.href = element.href;
      return;
    }
    const win = element.closest("[data-window]");
    if (win) desktop?.open(win);
    const folder = element.closest("details");
    if (folder) folder.open = true;
    element.hidden = false;
    element.scrollIntoView({ block: "center" });
    element.classList.remove("is-found");
    void element.offsetWidth;
    element.classList.add("is-found");
  }
}
