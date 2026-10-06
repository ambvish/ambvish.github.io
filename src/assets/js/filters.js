// Window toolbars: tag dropdowns, search boxes and the projects grid/list switch.
//   <select data-filter="list-id" data-filter-mode="tag">    shows items whose data-tags include the value
//   <input  data-filter="list-id" data-filter-mode="text">   shows items whose text contains the value
//   <select data-view-control="list-id">                     sets data-view on the list
// Several controls can filter the same list; an item shows only if it matches all of them.
// Items are [data-filter-item]; groups ([data-filter-group]) hide when none of their items match.
export function initFilters() {
  const controlsByList = new Map();
  for (const control of document.querySelectorAll("[data-filter]")) {
    const id = control.dataset.filter;
    if (!controlsByList.has(id)) controlsByList.set(id, []);
    controlsByList.get(id).push(control);
  }

  for (const [id, controls] of controlsByList) {
    const list = document.getElementById(id);
    if (!list) continue;
    const empty = list.parentElement.querySelector("[data-filter-empty]");

    const apply = () => {
      const active = controls
        .map((control) => ({ byTag: control.dataset.filterMode === "tag", query: control.value.trim().toLowerCase() }))
        .filter((filter) => filter.query);
      let shown = 0;
      for (const item of list.querySelectorAll("[data-filter-item]")) {
        const match = active.every(({ byTag, query }) =>
          byTag
            ? (item.dataset.tags || "").toLowerCase().split("|").includes(query)
            : item.textContent.toLowerCase().includes(query),
        );
        item.hidden = !match;
        if (match) shown += 1;
      }
      for (const group of list.querySelectorAll("[data-filter-group]")) {
        const visible = group.querySelector("[data-filter-item]:not([hidden])");
        group.hidden = !visible;
        if (active.length && visible && "open" in group) group.open = true;
      }
      if (empty) empty.hidden = shown > 0;
    };

    for (const control of controls) {
      control.addEventListener(control.tagName === "SELECT" ? "change" : "input", apply);
    }
  }

  for (const control of document.querySelectorAll("[data-view-control]")) {
    const list = document.getElementById(control.dataset.viewControl);
    if (!list) continue;
    control.addEventListener("change", () => {
      list.dataset.view = control.value;
    });
  }
}
