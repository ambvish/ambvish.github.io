// Minesweeper: 9×9 with 10 mines. Your first click is always safe.
// Mouse: click reveals, right-click flags. Touch: switch on Flag mode.
// Keyboard: arrow keys move, Enter or Space reveals, F flags.

const SIZE = 9;
const MINES = 10;
const FACES = { playing: "🙂", won: "😎", lost: "😵" };

export function initGame() {
  const root = document.querySelector("[data-mines]");
  if (!root) return;

  const board = root.querySelector("[data-mines-board]");
  const grid = root.querySelector("[data-mines-grid]");
  const face = root.querySelector("[data-mines-face]");
  const minesLeft = root.querySelector("[data-mines-left]");
  const clock = root.querySelector("[data-mines-time]");
  const flagButton = root.querySelector("[data-mines-flag]");
  const status = root.querySelector("[data-mines-status]");
  root.querySelector("[data-mines-fallback]").hidden = true;
  board.hidden = false;

  const cells = [];
  let mine, open, flag, state, seconds, timer, cursor, flagMode;

  // One button per square, in rows for screen readers.
  for (let r = 0; r < SIZE; r += 1) {
    const row = document.createElement("div");
    row.setAttribute("role", "row");
    row.className = "mines__row";
    for (let c = 0; c < SIZE; c += 1) {
      const cell = document.createElement("button");
      cell.type = "button";
      cell.className = "mines__cell";
      cell.dataset.index = String(r * SIZE + c);
      cell.setAttribute("role", "gridcell");
      cells.push(cell);
      row.append(cell);
    }
    grid.append(row);
  }

  const neighbours = (i) => {
    const r = Math.floor(i / SIZE);
    const c = i % SIZE;
    const out = [];
    for (let dr = -1; dr <= 1; dr += 1) {
      for (let dc = -1; dc <= 1; dc += 1) {
        const nr = r + dr;
        const nc = c + dc;
        if ((dr || dc) && nr >= 0 && nr < SIZE && nc >= 0 && nc < SIZE) out.push(nr * SIZE + nc);
      }
    }
    return out;
  };
  const count = (i) => neighbours(i).filter((n) => mine[n]).length;

  function reset() {
    mine = new Array(SIZE * SIZE).fill(false);
    open = new Array(SIZE * SIZE).fill(false);
    flag = new Array(SIZE * SIZE).fill(false);
    state = "ready";
    seconds = 0;
    clearInterval(timer);
    cursor = cursor ?? 0;
    face.textContent = FACES.playing;
    status.textContent = "Clear the field. Right-click or F to flag.";
    cells.forEach((_, i) => draw(i));
    updateCounters();
  }

  // Mines are placed after the first click, never on or next to it.
  function layMines(first) {
    const safe = new Set([first, ...neighbours(first)]);
    let placed = 0;
    while (placed < MINES) {
      const i = Math.floor(Math.random() * SIZE * SIZE);
      if (!mine[i] && !safe.has(i)) {
        mine[i] = true;
        placed += 1;
      }
    }
  }

  function reveal(i) {
    if (state === "won" || state === "lost" || flag[i] || open[i]) return;
    if (state === "ready") {
      layMines(i);
      state = "playing";
      timer = setInterval(() => {
        seconds = Math.min(seconds + 1, 999);
        updateCounters();
      }, 1000);
    }
    if (mine[i]) return lose(i);

    // Open this square, and spread through every connected empty area.
    const queue = [i];
    while (queue.length) {
      const j = queue.pop();
      if (open[j] || flag[j]) continue;
      open[j] = true;
      draw(j);
      if (count(j) === 0) queue.push(...neighbours(j).filter((n) => !open[n]));
    }
    if (open.filter(Boolean).length === SIZE * SIZE - MINES) win();
  }

  function toggleFlag(i) {
    if (state === "won" || state === "lost" || open[i]) return;
    flag[i] = !flag[i];
    draw(i);
    updateCounters();
  }

  function lose(hit) {
    state = "lost";
    clearInterval(timer);
    cells.forEach((_, i) => {
      if (mine[i]) open[i] = true;
      draw(i);
    });
    cells[hit].classList.add("is-hit");
    face.textContent = FACES.lost;
    status.textContent = "Boom. Press the face to try again.";
  }

  function win() {
    state = "won";
    clearInterval(timer);
    cells.forEach((_, i) => {
      if (mine[i]) flag[i] = true;
      draw(i);
    });
    updateCounters();
    face.textContent = FACES.won;
    status.textContent = `Cleared in ${seconds} second${seconds === 1 ? "" : "s"}. Nice.`;
  }

  function draw(i) {
    const cell = cells[i];
    const r = Math.floor(i / SIZE) + 1;
    const c = (i % SIZE) + 1;
    cell.className = "mines__cell";
    cell.tabIndex = i === cursor ? 0 : -1;
    let label;
    if (open[i] && mine[i]) {
      cell.textContent = "💣";
      cell.classList.add("is-open", "is-mine");
      label = "mine";
    } else if (open[i]) {
      const n = count(i);
      cell.textContent = n ? String(n) : "";
      cell.classList.add("is-open");
      if (n) cell.classList.add(`n${n}`);
      label = n ? `${n} mine${n === 1 ? "" : "s"} nearby` : "empty";
    } else if (flag[i]) {
      cell.textContent = "🚩";
      label = "flagged";
    } else {
      cell.textContent = "";
      label = "hidden";
    }
    cell.setAttribute("aria-label", `Row ${r}, column ${c}, ${label}`);
  }

  function updateCounters() {
    const left = MINES - flag.filter(Boolean).length;
    minesLeft.textContent = String(Math.max(left, 0)).padStart(3, "0");
    clock.textContent = String(seconds).padStart(3, "0");
  }

  function moveCursor(i) {
    cells[cursor].tabIndex = -1;
    cursor = i;
    cells[cursor].tabIndex = 0;
    cells[cursor].focus();
  }

  grid.addEventListener("click", (event) => {
    const cell = event.target.closest(".mines__cell");
    if (!cell) return;
    const i = Number(cell.dataset.index);
    moveCursor(i);
    if (flagMode) toggleFlag(i);
    else reveal(i);
  });

  grid.addEventListener("contextmenu", (event) => {
    const cell = event.target.closest(".mines__cell");
    if (!cell) return;
    event.preventDefault();
    toggleFlag(Number(cell.dataset.index));
  });

  grid.addEventListener("keydown", (event) => {
    const r = Math.floor(cursor / SIZE);
    const c = cursor % SIZE;
    const moves = { ArrowUp: [-1, 0], ArrowDown: [1, 0], ArrowLeft: [0, -1], ArrowRight: [0, 1] };
    if (moves[event.key]) {
      event.preventDefault();
      const [dr, dc] = moves[event.key];
      const nr = Math.min(Math.max(r + dr, 0), SIZE - 1);
      const nc = Math.min(Math.max(c + dc, 0), SIZE - 1);
      moveCursor(nr * SIZE + nc);
    } else if (event.key === "f" || event.key === "F") {
      event.preventDefault();
      toggleFlag(cursor);
    }
    // Enter and Space press the focused button, which reveals (or flags, in flag mode).
  });

  face.addEventListener("click", reset);
  flagButton.addEventListener("click", () => {
    flagMode = !flagMode;
    flagButton.setAttribute("aria-pressed", String(flagMode));
  });

  reset();
}
