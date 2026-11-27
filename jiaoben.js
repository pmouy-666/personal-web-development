const COLS = 20;
const ROWS = 20;
const BEST_KEY = "snake-best-score";

const canvas = document.getElementById("board");
const ctx = canvas.getContext("2d");
const scoreEl = document.getElementById("score");
const bestEl = document.getElementById("best");
const overlay = document.getElementById("overlay");
const overlayTitle = document.getElementById("overlay-title");
const overlayText = document.getElementById("overlay-text");
const actionBtn = document.getElementById("action");

const cell = canvas.width / COLS;

const dirs = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
};

let snake;
let direction;
let nextDirection;
let food;
let score;
let best = Number(localStorage.getItem(BEST_KEY)) || 0;
let running = false;
let paused = false;
let timer = null;
let tickMs = 140;

bestEl.textContent = String(best);

function sameCell(a, b) {
  return a.x === b.x && a.y === b.y;
}

function randomFood() {
  const open = [];
  for (let y = 0; y < ROWS; y += 1) {
    for (let x = 0; x < COLS; x += 1) {
      if (!snake.some((part) => part.x === x && part.y === y)) {
        open.push({ x, y });
      }
    }
  }
  if (open.length === 0) return null;
  return open[Math.floor(Math.random() * open.length)];
}

function reset() {
  snake = [
    { x: 8, y: 10 },
    { x: 7, y: 10 },
    { x: 6, y: 10 },
  ];
  direction = dirs.right;
  nextDirection = dirs.right;
  score = 0;
  tickMs = 140;
  scoreEl.textContent = "0";
  food = randomFood();
}

function drawCell(x, y, color, inset) {
  const pad = inset;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.roundRect(
    x * cell + pad,
    y * cell + pad,
    cell - pad * 2,
    cell - pad * 2,
    6
  );
  ctx.fill();
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (food) drawCell(food.x, food.y, "#ff6b4a", 4);

  snake.forEach((part, index) => {
    const color = index === 0 ? "#d5ff78" : "#8fd14f";
    drawCell(part.x, part.y, color, index === 0 ? 2 : 3);
  });
}

function showOverlay(title, text, buttonLabel) {
  overlayTitle.textContent = title;
  overlayText.textContent = text;
  actionBtn.textContent = buttonLabel;
  overlay.hidden = false;
}

function hideOverlay() {
  overlay.hidden = true;
}

function setDirection(next) {
  if (!next) return;
  if (next.x === -direction.x && next.y === -direction.y) return;
  nextDirection = next;
}

function step() {
  direction = nextDirection;
  const head = snake[0];
  const nextHead = { x: head.x + direction.x, y: head.y + direction.y };

  const hitWall =
    nextHead.x < 0 ||
    nextHead.y < 0 ||
    nextHead.x >= COLS ||
    nextHead.y >= ROWS;
  const hitSelf = snake.some((part) => sameCell(part, nextHead));

  if (hitWall || hitSelf) {
    endGame();
    return;
  }

  snake.unshift(nextHead);

  if (sameCell(nextHead, food)) {
    score += 1;
    scoreEl.textContent = String(score);
    if (score > best) {
      best = score;
      bestEl.textContent = String(best);
      localStorage.setItem(BEST_KEY, String(best));
    }
    food = randomFood();
    if (!food) {
      scoreEl.textContent = String(score);
      draw();
      running = false;
      clearInterval(timer);
      showOverlay("全部吃完", `棋盘已经占满，得分 ${score}。`, "再来一局");
      return;
    }
    tickMs = Math.max(70, 140 - score * 4);
    schedule();
  } else {
    snake.pop();
  }

  draw();
}

function schedule() {
  clearInterval(timer);
  timer = setInterval(() => {
    if (running && !paused) step();
  }, tickMs);
}

function startGame() {
  reset();
  running = true;
  paused = false;
  hideOverlay();
  draw();
  schedule();
}

function endGame() {
  running = false;
  clearInterval(timer);
  draw();
  showOverlay("游戏结束", `本局得分 ${score}。再来一局？`, "再来一局");
}

function togglePause() {
  if (!running) return;
  paused = !paused;
  if (paused) {
    showOverlay("已暂停", "按空格或点击继续。", "继续");
  } else {
    hideOverlay();
  }
}

actionBtn.addEventListener("click", () => {
  if (!running) startGame();
  else if (paused) togglePause();
});

document.querySelectorAll("[data-dir]").forEach((button) => {
  button.addEventListener("click", () => {
    setDirection(dirs[button.dataset.dir]);
    if (!running) startGame();
    else if (paused) togglePause();
  });
});

const keyMap = {
  ArrowUp: dirs.up,
  ArrowDown: dirs.down,
  ArrowLeft: dirs.left,
  ArrowRight: dirs.right,
  w: dirs.up,
  W: dirs.up,
  s: dirs.down,
  S: dirs.down,
  a: dirs.left,
  A: dirs.left,
  d: dirs.right,
  D: dirs.right,
};

document.addEventListener("keydown", (event) => {
  if (event.key === " " || event.code === "Space") {
    event.preventDefault();
    if (!running) startGame();
    else togglePause();
    return;
  }

  const next = keyMap[event.key];
  if (!next) return;
  event.preventDefault();
  setDirection(next);
});

reset();
draw();
showOverlay("准备开始", "吃到食物会变长，撞墙或咬到自己就结束。", "开始游戏");
