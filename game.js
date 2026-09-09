const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const titleScreen = document.getElementById("title-screen");
const gameScreen = document.getElementById("game-screen");
const playButton = document.getElementById("play-button");
const dialogueBox = document.getElementById("dialogue");
const speakerEl = document.getElementById("speaker");
const dialogueTextEl = document.getElementById("dialogue-text");
const dialogueNext = document.getElementById("dialogue-next");
const questBox = document.getElementById("quest-box");
const nightAlert = document.getElementById("night-alert");
const nightAlertText = document.getElementById("night-alert-text");
const restButton = document.getElementById("rest-button");

const W = canvas.width;
const H = canvas.height;

const keys = {};
let gameStarted = false;
let dialogueLines = [];
let dialogueIndex = 0;
let nightLevel = 0;
let hasTalkedToFunf = false;

const player = {
  x: 450,
  y: 320,
  speed: 3.1,
  facing: "down",
  bob: 0
};

const funf = {
  x: 690,
  y: 285
};

const dino = {
  x: 555,
  y: 365,
  bob: 0
};

const interactables = [
  { x: 190, y: 170, w: 100, h: 60, type: "bedroom" },
  { x: 440, y: 105, w: 120, h: 70, type: "piano" },
  { x: 735, y: 135, w: 90, h: 65, type: "books" },
  { x: 110, y: 380, w: 110, h: 70, type: "garden" }
];

function startGame() {
  titleScreen.classList.add("hidden");
  gameScreen.classList.remove("hidden");
  gameStarted = true;
  questBox.textContent = "QUEST: Explore the cave";
  requestAnimationFrame(gameLoop);
}

playButton.addEventListener("click", startGame);

window.addEventListener("keydown", (e) => {
  keys[e.key] = true;
  if (["ArrowUp","ArrowDown","ArrowLeft","ArrowRight"," "].includes(e.key)) {
    e.preventDefault();
  }
  if (e.key.toLowerCase() === "e") interact();
  if (e.key.toLowerCase() === "m") showMapMessage();
});

window.addEventListener("keyup", (e) => {
  keys[e.key] = false;
});

document.querySelectorAll("#touch-controls button").forEach(btn => {
  const key = btn.dataset.key;

  const press = (e) => {
    e.preventDefault();
    keys[key] = true;
  };

  const release = (e) => {
    e.preventDefault();
    keys[key] = false;
  };

  btn.addEventListener("pointerdown", press);
  btn.addEventListener("pointerup", release);
  btn.addEventListener("pointercancel", release);
  btn.addEventListener("pointerleave", release);
});

dialogueNext.addEventListener("click", advanceDialogue);

restButton.addEventListener("click", () => {
  nightAlert.classList.add("hidden");
  nightLevel = 0;
  player.x = 450;
  player.y = 320;
  questBox.textContent = "QUEST: Explore the cave";
  openDialogue([
    ["Funf", "Guten nacht, nerd. You finally listened."],
    ["Funf", "..."],
    ["Funf", "Hoomans being coot."]
  ]);
});

function openDialogue(lines) {
  dialogueLines = lines;
  dialogueIndex = 0;
  dialogueBox.classList.remove("hidden");
  renderDialogueLine();
}

function renderDialogueLine() {
  const [speaker, text] = dialogueLines[dialogueIndex];
  speakerEl.textContent = speaker;
  dialogueTextEl.textContent = text;
}

function advanceDialogue() {
  dialogueIndex++;
  if (dialogueIndex >= dialogueLines.length) {
    dialogueBox.classList.add("hidden");
    dialogueLines = [];
  } else {
    renderDialogueLine();
  }
}

function near(a, b, distance = 70) {
  return Math.hypot(a.x - b.x, a.y - b.y) < distance;
}

function interact() {
  if (!gameStarted || !dialogueBox.classList.contains("hidden")) return;

  if (near(player, funf, 80)) {
    hasTalkedToFunf = true;
    questBox.textContent = "QUEST UPDATED: Find something interesting in the cave";
    openDialogue([
      ["Funf", "Happy birthday, nerd."],
      ["Funf", "Your first quest is extremely important."],
      ["Funf", "Explore the cave. There may be secrets."],
      ["Funf", "...and absolutely no butt jokes."],
      ["Funf", "Probably."]
    ]);
    return;
  }

  if (near(player, dino, 65)) {
    openDialogue([
      ["Ankylosaurus", "...mlep."],
      ["You", "You are very small."],
      ["Ankylosaurus", "*happy dinosaur noises*"]
    ]);
    return;
  }

  for (const item of interactables) {
    if (
      player.x > item.x - 50 &&
      player.x < item.x + item.w + 50 &&
      player.y > item.y - 50 &&
      player.y < item.y + item.h + 50
    ) {
      interactWithObject(item.type);
      return;
    }
  }

  openDialogue([
    ["You", "Nothing happens."],
    ["You", "A riveting development."]
  ]);
}

function interactWithObject(type) {
  if (type === "piano") {
    openDialogue([
      ["Piano", "*plink*"],
      ["You", "You play a very serious chord."],
      ["Piano", "*plink plonk*"]
    ]);
  }

  if (type === "bedroom") {
    openDialogue([
      ["You", "This is Misbah's room."],
      ["You", "Stars. Books. Computers. Physics."],
      ["You", "There is also a suspicious amount of sword-related equipment."]
    ]);
  }

  if (type === "books") {
    openDialogue([
      ["Bookshelf", "A collection of books."],
      ["Bookshelf", "Some are about physics."],
      ["Bookshelf", "Some are about fantasy."],
      ["Bookshelf", "One is suspiciously about entropy."]
    ]);
  }

  if (type === "garden") {
    openDialogue([
      ["Garden", "Lilies sway gently in the breeze."],
      ["Garden", "You found a flower."],
      ["Inventory", "Lily added!"]
    ]);
  }
}

function showMapMessage() {
  openDialogue([
    ["MAP", "HOME CAVE → MISTBOUND PEAKS → SEA → ISLAND → UNDERWORLD → BIRTHDAY PARTY"],
    ["MAP", "The rest of the world is currently being constructed by one questionable coder."]
  ]);
}

function update() {
  if (!gameStarted || !dialogueBox.classList.contains("hidden") || !nightAlert.classList.contains("hidden")) return;

  let dx = 0;
  let dy = 0;

  if (keys["ArrowUp"] || keys["w"] || keys["W"]) dy -= 1;
  if (keys["ArrowDown"] || keys["s"] || keys["S"]) dy += 1;
  if (keys["ArrowLeft"] || keys["a"] || keys["A"]) dx -= 1;
  if (keys["ArrowRight"] || keys["d"] || keys["D"]) dx += 1;

  if (dx || dy) {
    const length = Math.hypot(dx, dy);
    dx /= length;
    dy /= length;

    player.x += dx * player.speed;
    player.y += dy * player.speed;
    player.bob += 0.25;

    if (Math.abs(dx) > Math.abs(dy)) {
      player.facing = dx > 0 ? "right" : "left";
    } else {
      player.facing = dy > 0 ? "down" : "up";
    }
  }

  player.x = Math.max(40, Math.min(W - 40, player.x));
  player.y = Math.max(60, Math.min(H - 40, player.y));

  dino.bob += 0.08;

  // For the first prototype, night comes after enough movement.
  // Later this will be replaced by proper mission/time progression.
  if (Math.hypot(player.x - 450, player.y - 320) > 260) {
    nightLevel = Math.min(3, nightLevel + 0.002);
  }

  if (nightLevel >= 3) {
    nightLevel = 0;
    nightAlert.classList.remove("hidden");
    nightAlertText.textContent = "IT IS GETTING LATE.";
  }
}

function drawPixelRect(x, y, w, h, color) {
  ctx.fillStyle = color;
  ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
}

function drawCave() {
  // Background
  ctx.fillStyle = "#243329";
  ctx.fillRect(0, 0, W, H);

  // Cave floor
  drawPixelRect(35, 50, W - 70, H - 85, "#59634b");
  drawPixelRect(55, 70, W - 110, H - 125, "#687256");

  // Pixel floor patches
  for (let i = 0; i < 80; i++) {
    const x = 55 + ((i * 137) % 820);
    const y = 75 + ((i * 83) % 385);
    drawPixelRect(x, y, 5, 5, i % 3 === 0 ? "#7c8060" : "#525f49");
  }

  // Cave walls / rocks
  for (let i = 0; i < 24; i++) {
    const x = 25 + ((i * 91) % 910);
    const y = i % 2 === 0 ? 40 : 465;
    drawPixelRect(x, y, 55, 22, "#302c30");
    drawPixelRect(x + 8, y - 8, 38, 8, "#40383a");
  }

  // Fireplace
  drawPixelRect(390, 65, 75, 65, "#3a2826");
  drawPixelRect(405, 83, 45, 35, "#1b191a");
  drawPixelRect(414, 88, 9, 20, "#e0a34f");
  drawPixelRect(430, 82, 10, 26, "#f2c65f");
  drawPixelRect(442, 90, 8, 18, "#d87d3f");

  // Piano
  drawPixelRect(435, 120, 130, 52, "#302329");
  drawPixelRect(450, 172, 8, 38, "#302329");
  drawPixelRect(542, 172, 8, 38, "#302329");
  for (let i = 0; i < 10; i++) drawPixelRect(449 + i * 10, 125, 8, 34, "#ead9b8");

  // Bedroom doorway
  drawPixelRect(150, 105, 145, 115, "#3c3030");
  drawPixelRect(165, 120, 115, 100, "#201a20");
  drawPixelRect(205, 140, 35, 35, "#d7b77c"); // starry glow

  // Bookshelf
  drawPixelRect(735, 120, 90, 110, "#4a3027");
  for (let i = 0; i < 5; i++) {
    drawPixelRect(745, 130 + i * 18, 70, 10, i % 2 ? "#8a5b49" : "#6f7451");
  }

  // Garden
  drawPixelRect(80, 350, 160, 100, "#4b6244");
  for (let i = 0; i < 8; i++) {
    const x = 95 + (i * 19) % 135;
    const y = 370 + ((i * 31) % 60);
    drawPixelRect(x, y, 5, 14, "#41603f");
    drawPixelRect(x - 3, y - 3, 11, 6, "#e8d7c2");
  }

  // Tiny decorations
  drawPixelRect(610, 90, 18, 18, "#b7835b"); // trinket
  drawPixelRect(645, 100, 10, 22, "#c6a05f"); // candle
  drawPixelRect(875, 390, 24, 12, "#8c5c45"); // chest
}

function drawAnkylosaurus() {
  const x = dino.x;
  const y = dino.y + Math.sin(dino.bob) * 2;

  // tail
  drawPixelRect(x - 22, y + 8, 25, 8, "#506342");
  drawPixelRect(x - 29, y + 2, 12, 8, "#64754b");

  // body
  drawPixelRect(x, y, 34, 18, "#65794d");
  drawPixelRect(x + 5, y - 7, 25, 12, "#708858");

  // head
  drawPixelRect(x + 25, y - 4, 14, 13, "#6e8051");

  // legs
  drawPixelRect(x + 5, y + 15, 7, 9, "#3f523c");
  drawPixelRect(x + 25, y + 15, 7, 9, "#3f523c");

  // eye
  drawPixelRect(x + 34, y - 1, 3, 3, "#20191b");

  // armor
  drawPixelRect(x + 9, y - 5, 6, 5, "#82935d");
  drawPixelRect(x + 20, y - 5, 6, 5, "#82935d");
}

function drawCharacter(c, isPlayer = false) {
  const x = c.x;
  const y = c.y + (isPlayer && (keys["ArrowDown"] || keys["ArrowUp"] || keys["ArrowLeft"] || keys["ArrowRight"] || keys["w"] || keys["a"] || keys["s"] || keys["d"]) ? Math.sin(player.bob) * 2 : 0);

  // shadow
  drawPixelRect(x - 18, y + 28, 36, 7, "rgba(31,25,26,.35)");

  // cloak/body
  drawPixelRect(x - 16, y + 2, 32, 28, isPlayer ? "#4b4b55" : "#684b47");
  drawPixelRect(x - 22, y + 9, 9, 20, isPlayer ? "#343741" : "#513d3b");

  // legs
  drawPixelRect(x - 11, y + 28, 8, 15, "#332b2d");
  drawPixelRect(x + 4, y + 28, 8, 15, "#332b2d");

  // boots
  drawPixelRect(x - 13, y + 40, 11, 5, "#201a1c");
  drawPixelRect(x + 3, y + 40, 11, 5, "#201a1c");

  // head
  drawPixelRect(x - 14, y - 25, 28, 28, "#c88f6e");

  // fluffy hair
  drawPixelRect(x - 18, y - 31, 36, 12, isPlayer ? "#382a27" : "#51382e");
  drawPixelRect(x - 14, y - 36, 9, 9, isPlayer ? "#382a27" : "#51382e");
  drawPixelRect(x - 3, y - 39, 11, 12, isPlayer ? "#382a27" : "#51382e");
  drawPixelRect(x + 8, y - 33, 10, 10, isPlayer ? "#382a27" : "#51382e");

  // face / smile
  drawPixelRect(x - 7, y - 16, 3, 3, "#20191b");
  drawPixelRect(x + 5, y - 16, 3, 3, "#20191b");
  drawPixelRect(x - 3, y - 7, 8, 3, "#7b463f");

  // sword
  drawPixelRect(x + 17, y + 1, 5, 34, "#b9c2c2");
  drawPixelRect(x + 12, y + 0, 15, 4, "#9b6a42");
  drawPixelRect(x + 18, y + 35, 6, 9, "#5a3b2e");
}

function draw() {
  ctx.clearRect(0, 0, W, H);
  drawCave();
  drawAnkylosaurus();
  drawCharacter(funf, false);
  drawCharacter(player, true);

  // subtle pixel stars around the cave
  drawPixelRect(320, 90, 4, 4, "#e8c978");
  drawPixelRect(680, 250, 3, 3, "#e8c978");
  drawPixelRect(860, 110, 4, 4, "#e8c978");
}

function gameLoop() {
  update();
  draw();
  requestAnimationFrame(gameLoop);
}

