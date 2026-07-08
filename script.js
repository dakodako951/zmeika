const canvas = document.querySelector("#game");
const ctx = canvas.getContext("2d");
const scoreEl = document.querySelector("#score");
const bestEl = document.querySelector("#best");
const levelNameEl = document.querySelector("#levelName");
const overlay = document.querySelector("#overlay");
const mainMenu = document.querySelector("#mainMenu");
const settingsOverlay = document.querySelector("#settingsOverlay");
const settingsMount = document.querySelector("#settingsMount");
const settingsBackButton = document.querySelector("#settingsBackButton");
const menuPlayButton = document.querySelector("#menuPlayButton");
const menuSettingsButton = document.querySelector("#menuSettingsButton");
const startButton = document.querySelector("#startButton");
const pauseButton = document.querySelector("#pauseButton");
const gameSettingsButton = document.querySelector("#gameSettingsButton");
const restartButton = document.querySelector("#restartButton");
const shuffleButton = document.querySelector("#shuffleButton");
const levelButtons = document.querySelectorAll(".level-button");
const speedButtons = document.querySelectorAll("[data-speed]");
const mapButtons = document.querySelectorAll("[data-map]");
const colorButtons = document.querySelectorAll("[data-snake-color]");
const foodSkinButtons = document.querySelectorAll("[data-food-skin]");
const appleMinusButton = document.querySelector("#appleMinus");
const applePlusButton = document.querySelector("#applePlus");
const appleCountEl = document.querySelector("#appleCount");
const touchButtons = document.querySelectorAll(".touch-controls button");
const playLayout = document.querySelector(".play-layout");
const controlsPanel = document.querySelector(".controls-panel");
const gameCenter = document.querySelector(".game-center");
const infoPanel = document.querySelector(".info-panel");

let tileCount = 20;
let tileSize = canvas.width / tileCount;
const bestKey = "snake-levels-best";

const speedModes = {
  slow: 1.28,
  normal: 1,
  fast: 0.72,
};

const mapModes = {
  small: 16,
  medium: 20,
  large: 24,
};

const snakePalettes = {
  red: {
    shadow: "rgba(129, 24, 24, 0.24)",
    outline: "#9f1f1f",
    bodyTop: "#ff6b5e",
    bodyBottom: "#d93025",
    headTop: "#ff8a80",
    headBottom: "#c62828",
    highlight: "rgba(255, 255, 255, 0.24)",
  },
  green: {
    shadow: "rgba(29, 93, 38, 0.22)",
    outline: "#1f8f3e",
    bodyTop: "#67dc5d",
    bodyBottom: "#31a848",
    headTop: "#79e56c",
    headBottom: "#269d45",
    highlight: "rgba(255, 255, 255, 0.2)",
  },
  black: {
    shadow: "rgba(0, 0, 0, 0.28)",
    outline: "#050708",
    bodyTop: "#4b555a",
    bodyBottom: "#11181c",
    headTop: "#606c72",
    headBottom: "#151c20",
    highlight: "rgba(255, 255, 255, 0.18)",
  },
  white: {
    shadow: "rgba(38, 49, 54, 0.24)",
    outline: "#9ba8ad",
    bodyTop: "#ffffff",
    bodyBottom: "#dce5e8",
    headTop: "#ffffff",
    headBottom: "#cfdadd",
    highlight: "rgba(255, 255, 255, 0.55)",
  },
};

const levels = {
  easy: {
    name: "Лёгкий",
    speed: 160,
    walls: [],
  },
  classic: {
    name: "Классика",
    speed: 125,
    walls: [
      [5, 5], [6, 5], [13, 5], [14, 5],
      [5, 14], [6, 14], [13, 14], [14, 14],
    ],
  },
  maze: {
    name: "Лабиринт",
    speed: 135,
    walls: [
      [3, 3], [4, 3], [5, 3], [14, 3], [15, 3], [16, 3],
      [3, 16], [4, 16], [5, 16], [14, 16], [15, 16], [16, 16],
      [9, 6], [9, 7], [9, 8], [10, 11], [10, 12], [10, 13],
      [6, 9], [7, 9], [12, 10], [13, 10],
    ],
  },
  turbo: {
    name: "Турбо",
    speed: 82,
    walls: [
      [2, 2], [17, 2], [2, 17], [17, 17],
      [7, 7], [8, 7], [11, 12], [12, 12],
    ],
  },
};

let selectedLevel = "easy";
let selectedSpeed = "normal";
let selectedMap = "medium";
let selectedAppleCount = 1;
let selectedSnakeColor = "green";
let selectedFoodSkin = "mushroom";
let snake;
let foods;
let bonus;
let direction;
let nextDirection;
let score;
let timerId;
let animationFrameId;
let running;
let paused;
let gameOver;
let tickDelay;
let currentWalls;
let previousSnake;
let stepStartedAt;

bestEl.textContent = localStorage.getItem(bestKey) || "0";
resetGame();
draw();

function resetGame() {
  tileCount = mapModes[selectedMap];
  tileSize = canvas.width / tileCount;
  currentWalls = createWalls(selectedLevel);
  const start = Math.floor(tileCount / 2);
  snake = [
    { x: start, y: start },
    { x: start - 1, y: start },
    { x: start - 2, y: start },
  ];
  previousSnake = cloneSnake(snake);
  direction = { x: 1, y: 0 };
  nextDirection = { x: 1, y: 0 };
  score = 0;
  bonus = null;
  running = false;
  paused = false;
  gameOver = false;
  tickDelay = getStartDelay();
  stepStartedAt = performance.now() - tickDelay;
  scoreEl.textContent = score;
  levelNameEl.textContent = levels[selectedLevel].name;
  appleCountEl.textContent = selectedAppleCount;
  foods = createFoods();
  updateOverlay("Выбери уровень и нажми «Играть»", "Управление: стрелки или WASD");
}

function startGame() {
  hideMainMenu();
  if (gameOver) {
    resetGame();
    draw();
  }
  if (running && !paused) return;
  running = true;
  paused = false;
  overlay.classList.add("is-hidden");
  startAnimation();
  scheduleTick();
}

function hideMainMenu() {
  mainMenu.classList.add("is-hidden");
}

function openSettings() {
  settingsMount.append(controlsPanel, infoPanel);
  settingsOverlay.classList.remove("is-hidden");
}

function closeSettings() {
  playLayout.insertBefore(controlsPanel, gameCenter);
  playLayout.append(infoPanel);
  settingsOverlay.classList.add("is-hidden");
}

function pauseGame() {
  if (!running) return;
  paused = !paused;
  if (paused) {
    clearTimeout(timerId);
    cancelAnimationFrame(animationFrameId);
    updateOverlay("Пауза", "Нажми «Пауза» или пробел, чтобы продолжить");
  } else {
    overlay.classList.add("is-hidden");
    stepStartedAt = performance.now() - tickDelay;
    startAnimation();
    scheduleTick();
  }
}

function restartGame() {
  clearTimeout(timerId);
  cancelAnimationFrame(animationFrameId);
  resetGame();
  draw();
}

function scheduleTick() {
  clearTimeout(timerId);
  timerId = setTimeout(() => {
    previousSnake = cloneSnake(snake);
    update();
    stepStartedAt = performance.now();
    if (running && !paused) scheduleTick();
  }, tickDelay);
}

function startAnimation() {
  cancelAnimationFrame(animationFrameId);
  animationFrameId = requestAnimationFrame(animate);
}

function animate(timestamp) {
  const progress = Math.min(1, Math.max(0, (timestamp - stepStartedAt) / tickDelay));
  draw(getInterpolatedSnake(progress));
  if (running && !paused) {
    animationFrameId = requestAnimationFrame(animate);
  }
}

function update() {
  direction = nextDirection;
  const head = snake[0];
  const newHead = wrapCell({ x: head.x + direction.x, y: head.y + direction.y });

  if (hitSnake(newHead) || hitWall(newHead)) {
    endGame();
    return;
  }

  snake.unshift(newHead);

  const eatenFoodIndex = foods.findIndex((item) => sameCell(newHead, item));
  if (eatenFoodIndex !== -1) {
    score += 1;
    if (score % 10 === 0) {
      score += 5;
      bonus = null;
    } else if (score % 5 === 0) {
      bonus = createFood(foods);
    }
    foods.splice(eatenFoodIndex, 1);
    refillFoods();
    updateScore();
  } else if (bonus && sameCell(newHead, bonus)) {
    score += 3;
    bonus = null;
    updateScore();
  } else {
    snake.pop();
  }
}

function endGame() {
  running = false;
  paused = false;
  gameOver = true;
  clearTimeout(timerId);
  cancelAnimationFrame(animationFrameId);
  draw();
  updateBest();
  updateOverlay("Игра окончена", `Счёт: ${score}. Нажми «Играть», чтобы начать заново`);
}

function updateScore() {
  scoreEl.textContent = score;
  updateBest();
}

function updateBest() {
  const best = Number(localStorage.getItem(bestKey) || 0);
  if (score > best) {
    localStorage.setItem(bestKey, String(score));
    bestEl.textContent = score;
  }
}

function getStartDelay() {
  return Math.round(levels[selectedLevel].speed * speedModes[selectedSpeed]);
}

function cloneSnake(source) {
  return source.map((part) => ({ x: part.x, y: part.y }));
}

function getInterpolatedSnake(progress) {
  const easedProgress = easeInOut(progress);
  return snake.map((part, index) => {
    const previousPart = previousSnake[index] || previousSnake[previousSnake.length - 1] || part;
    const targetPart = getWrappedRenderTarget(previousPart, part);
    return {
      x: previousPart.x + (targetPart.x - previousPart.x) * easedProgress,
      y: previousPart.y + (targetPart.y - previousPart.y) * easedProgress,
    };
  });
}

function getWrappedRenderTarget(previousPart, currentPart) {
  let x = currentPart.x;
  let y = currentPart.y;
  const dx = currentPart.x - previousPart.x;
  const dy = currentPart.y - previousPart.y;

  if (dx > tileCount / 2) x -= tileCount;
  if (dx < -tileCount / 2) x += tileCount;
  if (dy > tileCount / 2) y -= tileCount;
  if (dy < -tileCount / 2) y += tileCount;

  return { x, y };
}

function easeInOut(value) {
  return value * value * (3 - 2 * value);
}

function createWalls(levelKey) {
  if (levelKey === "easy") return [];

  const classicPattern = [
    [0.25, 0.25], [0.3, 0.25], [0.7, 0.25], [0.75, 0.25],
    [0.25, 0.75], [0.3, 0.75], [0.7, 0.75], [0.75, 0.75],
  ];
  const mazePattern = [
    [0.16, 0.16], [0.22, 0.16], [0.28, 0.16], [0.72, 0.16], [0.78, 0.16], [0.84, 0.16],
    [0.16, 0.84], [0.22, 0.84], [0.28, 0.84], [0.72, 0.84], [0.78, 0.84], [0.84, 0.84],
    [0.48, 0.32], [0.48, 0.38], [0.48, 0.44], [0.52, 0.56], [0.52, 0.62], [0.52, 0.68],
    [0.32, 0.48], [0.38, 0.48], [0.62, 0.52], [0.68, 0.52],
  ];
  const turboPattern = [
    [0.1, 0.1], [0.9, 0.1], [0.1, 0.9], [0.9, 0.9],
    [0.36, 0.36], [0.42, 0.36], [0.58, 0.64], [0.64, 0.64],
  ];

  const patternByLevel = {
    classic: classicPattern,
    maze: mazePattern,
    turbo: turboPattern,
  };

  const walls = patternByLevel[levelKey].map(([x, y]) => [
    Math.min(tileCount - 2, Math.max(1, Math.round(x * (tileCount - 1)))),
    Math.min(tileCount - 2, Math.max(1, Math.round(y * (tileCount - 1)))),
  ]);

  return walls.filter(([x, y], index) => {
    const isDuplicate = walls.findIndex(([wallX, wallY]) => wallX === x && wallY === y) !== index;
    const isStartArea = Math.abs(x - Math.floor(tileCount / 2)) <= 2 && Math.abs(y - Math.floor(tileCount / 2)) <= 1;
    return !isDuplicate && !isStartArea;
  });
}

function createFoods() {
  const nextFoods = [];
  while (nextFoods.length < selectedAppleCount) {
    nextFoods.push(createFood(nextFoods));
  }
  return nextFoods;
}

function refillFoods() {
  while (foods.length < selectedAppleCount) {
    foods.push(createFood(foods));
  }
}

function createFood(extraBlocked = []) {
  let cell;
  do {
    cell = {
      x: Math.floor(Math.random() * tileCount),
      y: Math.floor(Math.random() * tileCount),
    };
  } while (hitSnake(cell) || hitWall(cell) || (bonus && sameCell(cell, bonus)) || extraBlocked.some((item) => sameCell(item, cell)));
  return cell;
}

function draw(renderSnake = snake) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawBoard();
  drawWalls();
  foods.forEach((item) => drawFood(item));
  if (bonus) drawBonus(bonus);
  drawSnake(renderSnake);
}

function drawBoard() {
  ctx.fillStyle = "#b9df62";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  for (let y = 0; y < tileCount; y += 1) {
    for (let x = 0; x < tileCount; x += 1) {
      ctx.fillStyle = (x + y) % 2 === 0 ? "#b9df62" : "#add557";
      ctx.fillRect(x * tileSize, y * tileSize, tileSize, tileSize);
    }
  }
}

function drawWalls() {
  currentWalls.forEach(([x, y]) => {
    drawCell({ x, y }, "#6f7d53", 0.88);
    drawCell({ x, y }, "#93a36c", 0.54);
  });
}

function drawCell(cell, color, insetRatio) {
  const inset = tileSize * (1 - insetRatio) / 2;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.roundRect(
    cell.x * tileSize + inset,
    cell.y * tileSize + inset,
    tileSize * insetRatio,
    tileSize * insetRatio,
    6
  );
  ctx.fill();
}

function drawSnake(snakeToDraw) {
  const palette = snakePalettes[selectedSnakeColor];
  const points = getContinuousSnakePoints(snakeToDraw.map((part) => ({
    x: part.x * tileSize + tileSize / 2,
    y: part.y * tileSize + tileSize / 2,
  })));
  const renderOffsets = getSnakeRenderOffsets();

  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.shadowColor = palette.shadow;
  ctx.shadowBlur = 9;
  ctx.shadowOffsetY = 4;

  ctx.strokeStyle = palette.outline;
  ctx.lineWidth = tileSize * 0.82;
  renderOffsets.forEach((offset) => drawSnakePath(points, offset));

  const bodyGradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
  bodyGradient.addColorStop(0, palette.bodyTop);
  bodyGradient.addColorStop(1, palette.bodyBottom);
  ctx.strokeStyle = bodyGradient;
  ctx.lineWidth = tileSize * 0.68;
  renderOffsets.forEach((offset) => drawSnakePath(points, offset));

  ctx.shadowColor = "transparent";
  ctx.strokeStyle = palette.highlight;
  ctx.lineWidth = tileSize * 0.16;
  renderOffsets.forEach((offset) => drawSnakeHighlight(points, offset));

  renderOffsets.forEach((offset) => {
    drawSnakeHead({ x: points[0].x + offset.x, y: points[0].y + offset.y }, palette);
  });
  ctx.lineCap = "butt";
  ctx.lineJoin = "miter";
}

function getContinuousSnakePoints(points) {
  return points.reduce((continuousPoints, point, index) => {
    if (index === 0) return [point];

    const previousPoint = continuousPoints[index - 1];
    let x = point.x;
    let y = point.y;
    const dx = x - previousPoint.x;
    const dy = y - previousPoint.y;

    if (dx > canvas.width / 2) x -= canvas.width;
    if (dx < -canvas.width / 2) x += canvas.width;
    if (dy > canvas.height / 2) y -= canvas.height;
    if (dy < -canvas.height / 2) y += canvas.height;

    continuousPoints.push({ x, y });
    return continuousPoints;
  }, []);
}

function getSnakeRenderOffsets() {
  return [-1, 0, 1].flatMap((x) => (
    [-1, 0, 1].map((y) => ({
      x: x * canvas.width,
      y: y * canvas.height,
    }))
  ));
}

function drawSnakePath(points, renderOffset = { x: 0, y: 0 }) {
  ctx.beginPath();
  ctx.moveTo(points[0].x + renderOffset.x, points[0].y + renderOffset.y);
  for (let i = 1; i < points.length; i += 1) {
    ctx.lineTo(points[i].x + renderOffset.x, points[i].y + renderOffset.y);
  }
  ctx.stroke();
}

function drawSnakeHighlight(points, renderOffset = { x: 0, y: 0 }) {
  if (points.length < 2) return;
  ctx.beginPath();
  const offset = tileSize * 0.12;
  ctx.moveTo(points[0].x + renderOffset.x - offset, points[0].y + renderOffset.y - offset);
  for (let i = 1; i < points.length; i += 1) {
    ctx.lineTo(points[i].x + renderOffset.x - offset, points[i].y + renderOffset.y - offset);
  }
  ctx.stroke();
}

function drawSnakeHead(point, palette) {
  const radius = tileSize * 0.5;
  const x = point.x;
  const y = point.y;

  const gradient = ctx.createRadialGradient(
    x - radius * 0.25,
    y - radius * 0.35,
    radius * 0.15,
    x,
    y,
    radius
  );
  gradient.addColorStop(0, palette.headTop);
  gradient.addColorStop(1, palette.headBottom);

  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = palette.highlight;
  ctx.beginPath();
  ctx.ellipse(x - radius * 0.2, y - radius * 0.3, radius * 0.36, radius * 0.14, -0.35, 0, Math.PI * 2);
  ctx.fill();

  if (isAppleAhead()) {
    drawTongue(x, y, radius);
  }
  drawEyes(x - radius, y - radius, radius * 2);
}

function isAppleAhead() {
  const head = snake[0];
  return foods.some((apple) => {
    const dx = apple.x - head.x;
    const dy = apple.y - head.y;
    const straightAhead = direction.x !== 0 ? dy === 0 && Math.sign(dx) === direction.x : dx === 0 && Math.sign(dy) === direction.y;
    const distance = Math.abs(dx) + Math.abs(dy);
    return straightAhead && distance > 0 && distance <= 2;
  });
}

function drawTongue(x, y, radius) {
  const dirX = direction.x;
  const dirY = direction.y;
  const sideX = -dirY;
  const sideY = dirX;
  const startX = x + dirX * radius * 0.62;
  const startY = y + dirY * radius * 0.62;
  const tipX = x + dirX * (radius + tileSize * 0.26);
  const tipY = y + dirY * (radius + tileSize * 0.26);
  const fork = tileSize * 0.12;

  ctx.strokeStyle = "#e91e63";
  ctx.lineWidth = Math.max(2, tileSize * 0.08);
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.beginPath();
  ctx.moveTo(startX, startY);
  ctx.lineTo(tipX, tipY);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(tipX, tipY);
  ctx.lineTo(tipX + sideX * fork + dirX * fork * 0.7, tipY + sideY * fork + dirY * fork * 0.7);
  ctx.moveTo(tipX, tipY);
  ctx.lineTo(tipX - sideX * fork + dirX * fork * 0.7, tipY - sideY * fork + dirY * fork * 0.7);
  ctx.stroke();
}

function drawEyes(x, y, size) {
  const horizontal = direction.x !== 0;
  const forwardX = direction.x * size * 0.18;
  const forwardY = direction.y * size * 0.18;
  const eyeA = horizontal
    ? { x: x + size * 0.52 + forwardX, y: y + size * 0.3 }
    : { x: x + size * 0.3, y: y + size * 0.52 + forwardY };
  const eyeB = horizontal
    ? { x: x + size * 0.52 + forwardX, y: y + size * 0.7 }
    : { x: x + size * 0.7, y: y + size * 0.52 + forwardY };

  [eyeA, eyeB].forEach((eye) => {
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(eye.x, eye.y, size * 0.13, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#243238";
    ctx.beginPath();
    ctx.arc(eye.x + direction.x * 2, eye.y + direction.y * 2, size * 0.06, 0, Math.PI * 2);
    ctx.fill();
  });
}

function drawFood(cell) {
  if (selectedFoodSkin === "apple") {
    drawApple(cell);
    return;
  }
  if (selectedFoodSkin === "strawberry") {
    drawStrawberry(cell);
    return;
  }
  if (selectedFoodSkin === "watermelon") {
    drawWatermelon(cell);
    return;
  }
  drawMushroom(cell);
}

function drawApple(cell) {
  const centerX = cell.x * tileSize + tileSize / 2;
  const centerY = cell.y * tileSize + tileSize / 2;
  const radius = tileSize * 0.34;

  ctx.fillStyle = "#ea4335";
  ctx.beginPath();
  ctx.arc(centerX, centerY + 1, radius, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "rgba(255, 255, 255, 0.38)";
  ctx.beginPath();
  ctx.arc(centerX - radius * 0.35, centerY - radius * 0.32, radius * 0.22, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#2f7d32";
  ctx.beginPath();
  ctx.ellipse(centerX + radius * 0.24, centerY - radius * 0.86, radius * 0.24, radius * 0.12, -0.6, 0, Math.PI * 2);
  ctx.fill();
}

function drawMushroom(cell) {
  const centerX = cell.x * tileSize + tileSize / 2;
  const centerY = cell.y * tileSize + tileSize / 2;
  const radius = tileSize * 0.36;

  ctx.fillStyle = "#ea4335";
  ctx.beginPath();
  ctx.arc(centerX, centerY - radius * 0.12, radius, Math.PI, 0);
  ctx.quadraticCurveTo(centerX + radius * 0.92, centerY + radius * 0.25, centerX, centerY + radius * 0.22);
  ctx.quadraticCurveTo(centerX - radius * 0.92, centerY + radius * 0.25, centerX - radius, centerY - radius * 0.12);
  ctx.fill();

  ctx.fillStyle = "#fff3df";
  ctx.beginPath();
  ctx.roundRect(centerX - radius * 0.36, centerY + radius * 0.12, radius * 0.72, radius * 0.78, radius * 0.22);
  ctx.fill();

  ctx.fillStyle = "#ffffff";
  [
    [centerX - radius * 0.45, centerY - radius * 0.22, radius * 0.16],
    [centerX + radius * 0.1, centerY - radius * 0.38, radius * 0.14],
    [centerX + radius * 0.46, centerY - radius * 0.08, radius * 0.13],
  ].forEach(([x, y, dotRadius]) => {
    ctx.beginPath();
    ctx.arc(x, y, dotRadius, 0, Math.PI * 2);
    ctx.fill();
  });
}

function drawStrawberry(cell) {
  const centerX = cell.x * tileSize + tileSize / 2;
  const centerY = cell.y * tileSize + tileSize / 2;
  const radius = tileSize * 0.36;

  ctx.fillStyle = "#e53935";
  ctx.beginPath();
  ctx.moveTo(centerX, centerY + radius * 0.92);
  ctx.bezierCurveTo(centerX - radius * 1.05, centerY + radius * 0.15, centerX - radius * 0.72, centerY - radius * 0.72, centerX, centerY - radius * 0.45);
  ctx.bezierCurveTo(centerX + radius * 0.72, centerY - radius * 0.72, centerX + radius * 1.05, centerY + radius * 0.15, centerX, centerY + radius * 0.92);
  ctx.fill();

  ctx.fillStyle = "#2f7d32";
  ctx.beginPath();
  ctx.moveTo(centerX, centerY - radius * 0.42);
  ctx.lineTo(centerX - radius * 0.34, centerY - radius * 0.82);
  ctx.lineTo(centerX - radius * 0.08, centerY - radius * 0.62);
  ctx.lineTo(centerX + radius * 0.18, centerY - radius * 0.86);
  ctx.lineTo(centerX + radius * 0.16, centerY - radius * 0.48);
  ctx.fill();

  ctx.fillStyle = "#ffd66b";
  [
    [-0.36, -0.14], [0.02, -0.18], [0.36, -0.04],
    [-0.2, 0.18], [0.22, 0.22], [0, 0.52],
  ].forEach(([x, y]) => {
    ctx.beginPath();
    ctx.ellipse(centerX + x * radius, centerY + y * radius, radius * 0.055, radius * 0.1, 0.4, 0, Math.PI * 2);
    ctx.fill();
  });
}

function drawWatermelon(cell) {
  const centerX = cell.x * tileSize + tileSize / 2;
  const centerY = cell.y * tileSize + tileSize / 2;
  const radius = tileSize * 0.38;

  ctx.fillStyle = "#2e9d45";
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#d9f19b";
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius * 0.8, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#f4435c";
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius * 0.65, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#263238";
  [
    [-0.22, -0.05], [0.22, -0.08], [0, 0.24],
  ].forEach(([x, y]) => {
    ctx.beginPath();
    ctx.ellipse(centerX + x * radius, centerY + y * radius, radius * 0.07, radius * 0.13, 0, 0, Math.PI * 2);
    ctx.fill();
  });
}

function drawBonus(cell) {
  const centerX = cell.x * tileSize + tileSize / 2;
  const centerY = cell.y * tileSize + tileSize / 2;
  const points = 5;
  const outer = tileSize * 0.34;
  const inner = tileSize * 0.16;

  ctx.fillStyle = "#fbbc04";
  ctx.beginPath();
  for (let i = 0; i < points * 2; i += 1) {
    const radius = i % 2 === 0 ? outer : inner;
    const angle = -Math.PI / 2 + (i * Math.PI) / points;
    const x = centerX + Math.cos(angle) * radius;
    const y = centerY + Math.sin(angle) * radius;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fill();
}

function hitBoundary(cell) {
  return cell.x < 0 || cell.x >= tileCount || cell.y < 0 || cell.y >= tileCount;
}

function wrapCell(cell) {
  return {
    x: (cell.x + tileCount) % tileCount,
    y: (cell.y + tileCount) % tileCount,
  };
}

function hitSnake(cell) {
  return snake.some((part) => sameCell(part, cell));
}

function hitWall(cell) {
  return currentWalls.some(([x, y]) => x === cell.x && y === cell.y);
}

function sameCell(a, b) {
  return a.x === b.x && a.y === b.y;
}

function setDirection(dir) {
  const vectors = {
    up: { x: 0, y: -1 },
    down: { x: 0, y: 1 },
    left: { x: -1, y: 0 },
    right: { x: 1, y: 0 },
  };
  const next = vectors[dir];
  if (!next) return;
  if (next.x + direction.x === 0 && next.y + direction.y === 0) return;
  nextDirection = next;
}

function updateOverlay(title, subtitle) {
  overlay.classList.remove("is-hidden");
  overlay.innerHTML = `<strong>${title}</strong><span>${subtitle}</span>`;
}

levelButtons.forEach((button) => {
  button.addEventListener("click", () => {
    selectedLevel = button.dataset.level;
    levelButtons.forEach((item) => {
      item.classList.toggle("is-active", item === button);
      item.setAttribute("aria-checked", item === button ? "true" : "false");
    });
    restartGame();
  });
});

speedButtons.forEach((button) => {
  button.addEventListener("click", () => {
    selectedSpeed = button.dataset.speed;
    updateOptionButtons(speedButtons, button);
    restartGame();
  });
});

mapButtons.forEach((button) => {
  button.addEventListener("click", () => {
    selectedMap = button.dataset.map;
    updateOptionButtons(mapButtons, button);
    restartGame();
  });
});

colorButtons.forEach((button) => {
  button.addEventListener("click", () => {
    selectedSnakeColor = button.dataset.snakeColor;
    updateOptionButtons(colorButtons, button);
    draw();
  });
});

foodSkinButtons.forEach((button) => {
  button.addEventListener("click", () => {
    selectedFoodSkin = button.dataset.foodSkin;
    updateOptionButtons(foodSkinButtons, button);
    draw();
  });
});

appleMinusButton.addEventListener("click", () => changeAppleCount(-1));
applePlusButton.addEventListener("click", () => changeAppleCount(1));

function changeAppleCount(delta) {
  const nextCount = Math.min(20, Math.max(1, selectedAppleCount + delta));
  if (nextCount === selectedAppleCount) return;
  selectedAppleCount = nextCount;
  appleCountEl.textContent = selectedAppleCount;
  restartGame();
}

function shuffleSettings() {
  activateRandomButton(levelButtons);
  activateRandomButton(speedButtons);
  activateRandomButton(mapButtons);
  activateRandomButton(foodSkinButtons);
  activateRandomButton(colorButtons);
  selectedAppleCount = Math.floor(Math.random() * 20) + 1;
  appleCountEl.textContent = selectedAppleCount;
  restartGame();
}

function resetSettings() {
  activateButton(levelButtons, "[data-level='easy']");
  activateButton(speedButtons, "[data-speed='normal']");
  activateButton(mapButtons, "[data-map='medium']");
  activateButton(foodSkinButtons, "[data-food-skin='mushroom']");
  activateButton(colorButtons, "[data-snake-color='green']");
  selectedAppleCount = 1;
  appleCountEl.textContent = selectedAppleCount;
  restartGame();
}

function activateRandomButton(buttons) {
  const button = buttons[Math.floor(Math.random() * buttons.length)];
  button.click();
}

function activateButton(buttons, selector) {
  const button = Array.from(buttons).find((item) => item.matches(selector));
  if (button) button.click();
}

function updateOptionButtons(buttons, activeButton) {
  buttons.forEach((item) => {
    item.classList.toggle("is-active", item === activeButton);
    item.setAttribute("aria-checked", item === activeButton ? "true" : "false");
  });
}

touchButtons.forEach((button) => {
  button.addEventListener("click", () => {
    setDirection(button.dataset.dir);
    if (!running) startGame();
  });
});

document.addEventListener("keydown", (event) => {
  const keys = {
    ArrowUp: "up",
    KeyW: "up",
    ArrowDown: "down",
    KeyS: "down",
    ArrowLeft: "left",
    KeyA: "left",
    ArrowRight: "right",
    KeyD: "right",
  };

  if (event.code === "Space") {
    event.preventDefault();
    pauseGame();
    return;
  }

  if (keys[event.code]) {
    event.preventDefault();
    setDirection(keys[event.code]);
    if (!running) startGame();
  }
});

startButton.addEventListener("click", startGame);
pauseButton.addEventListener("click", pauseGame);
shuffleButton.addEventListener("click", shuffleSettings);
restartButton.addEventListener("click", resetSettings);
menuPlayButton.addEventListener("click", startGame);
menuSettingsButton.addEventListener("click", openSettings);
settingsBackButton.addEventListener("click", closeSettings);
gameSettingsButton.addEventListener("click", openSettings);
