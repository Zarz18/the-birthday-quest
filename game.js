
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


// Quest completion notification
const questToast = document.createElement("div");
questToast.id = "quest-toast";
questToast.classList.add("hidden");
document.body.appendChild(questToast);

questToast.style.cssText = `
  position: fixed;
  top: 20%;
  left: 50%;
  transform: translateX(-50%);
  background: #ead9b8;
  color: #302329;
  border: 4px solid #302329;
  padding: 14px 22px;
  font-family: monospace;
  font-weight: bold;
  font-size: 16px;
  text-align: center;
  z-index: 1000;
  box-shadow: 5px 5px 0 #201a20;
  max-width: 85%;
  pointer-events: none;
`;

let toastTimeout = null;

const pauseButton = document.getElementById("pause-button");
const pauseMenu = document.getElementById("pause-menu");
const mapButton = document.getElementById("map-button");
const resumeButton = document.getElementById("resume-button");
const manualButton = document.getElementById("manual-button");
const mapMenuButton = document.getElementById("pause-map-button");
const titleButton = document.getElementById("title-button");

const manualPanel = document.getElementById("manual-panel");
const manualBackButton = document.getElementById("manual-back-button");

const mapPanel = document.getElementById("map-panel");
const mapBackButton = document.getElementById("map-back-button");

const areaTransition = document.createElement("div");
areaTransition.id = "area-transition";
areaTransition.classList.add("hidden");

areaTransition.innerHTML = `
  <div id="area-transition-name"></div>
`;

document.body.appendChild(areaTransition);

const areaTransitionName =
  document.getElementById("area-transition-name");

areaTransition.style.cssText = `
  position: fixed;
  inset: 0;
  background: #201a20;
  color: #ead9b8;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  font-family: monospace;
  text-align: center;
  pointer-events: none;
`;

areaTransitionName.style.cssText = `
  font-size: 28px;
  font-weight: bold;
  letter-spacing: 3px;
`;

const mobileInteract = document.getElementById("mobile-interact");
const mobilePause = document.getElementById("mobile-pause");

const W = canvas.width;
const H = canvas.height;

const keys = {};

let gameStarted = false;
let paused = false;
let dialogueLines = [];
let dialogueIndex = 0;
let hasTalkedToFunf = false;
let animationFrame = null;

// Shared visual clock: lets scenery and idle characters animate even when Streber stands still.
let animationClock = 0;

// -------------------------
// QUEST / STORY PROGRESSION
// -------------------------

let currentQuest = "talkToFunf";

const questNames = {
  talkToFunf: "QUEST: Talk to Funf",
  exploreCave: "QUEST: Explore the cave",
  leaveCave: "QUEST: Leave the cave",
  mistboundPeaks: "QUEST: Investigate the mountain shrine",
  dragonWarning: "QUEST: Speak to the mountain watcher",
  dragonBattle: "QUEST: Defeat the dragon",
  reachSea: "QUEST: Find the path to the sea",
  boardShip: "QUEST: Find a ship to the island",
  talkCaptain: "QUEST: Speak to the captain",
  sailToIsland: "QUEST: Sail to the island",
  exploreIsland: "QUEST: Explore the island",
  islandScavengerHunt: "QUEST: Find all three island discoveries",
  findUnderworld: "QUEST: Follow the map into the Underworld",
  meetUnderworldResidents: "QUEST: Meet the Underworld residents",
  underworldTrial: "QUEST: Solve the Underworld rune trial",
  enterUnderworldSanctum: "QUEST: Pass through the opened gate",
  findEmberOfMemory: "QUEST: Catch the three memory echoes",
  returnFromUnderworld: "QUEST: Find a way back to the surface",
  birthdaySurprise: "QUEST: Accept your birthday ambush"
};

// -------------------------
// AREA SYSTEM
// -------------------------

let currentArea = "cave";

const areaNames = {
  cave: "HOME CAVE",
  peaks: "MISTBOUND PEAKS",
  dragonArena: "THE DRAGON'S LAIR",
  sea: "THE PATH TO THE SEA",
  shipDeck: "THE MIGHTY PIRATE SHIP (PROBABLY)",
  island: "A VERY MYSTERIOUS ISLAND",
  underworld: "THE UNDERWORLD (UNFORTUNATELY)",
  underworldSanctum: "THE ASHEN ARCHIVE",
  birthdayRoom: "THE BIRTHDAY SURPRISE"
};

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

const mountainWatcher = {
  x: 690,
  y: 345,
  bob: 0
};

const dragon = {
  x: 680,
  y: 235,
  bob: 0,
  hp: 100,
  maxHp: 100
};

let dragonIntroSeen = false;

// Dragon combat state
let playerHp = 100;
const playerMaxHp = 100;
let swordCooldown = 0, dodgeCooldown = 0, dodgeFrames = 0;
let invulnerableFrames = 0, swordFrames = 0;
let fireballs = [], dragonAttackTimer = 100, dragonWarning = null;
let dragonDefeated = false, victoryDialogueSeen = false;

// Pirate ship story state
const shipCaptain = { x: 285, y: 260, bob: 0 };
const shipHelm = { x: 785, y: 190 };
const shipCrew = [
  { x: 390, y: 335, bob: 0, name: "Milo" },
  { x: 625, y: 350, bob: 1, name: "Pip" }
];

const redLever = { x: 830, y: 285 };
let redLeverPulled = false;
let redLeverWarned = false;

const islandAnkylo = { x: 555, y: 365, bob: 0 };
let islandExplored = false;

const islandHunt = {
  footprints: false,
  bottle: false,
  chest: false,
  rewardFound: false,
  chantRead: false
};

const islandClues = {
  footprints: { x: 265, y: 415 },
  bottle: { x: 205, y: 305 },
  chest: { x: 780, y: 375 }
};

const asmodeus = { x: 690, y: 300, bob: 0 };
const cerberus = { x: 420, y: 365, bob: 0 };

let underworldResidentsMet = {
  asmodeus: false,
  cerberus: false
};

let sealedGateConversationDone = false;
let underworldTrialStarted = false;
let underworldGateOpen = false;
let underworldRuneProgress = 0;
let pendingUnderworldTransition = false;
let pendingSanctumTransition = false;
let pendingSurfaceReturn = false;
let sanctumKeeperMet = false;
let emberOfMemoryFound = false;
let archiveNoteReceived = false;
let archiveEchoesFound = [false, false, false];

const sanctumKeeper = { x: 340, y: 315, bob: 0 };
const memoryEmber = { x: 660, y: 330, bob: 0 };

const archiveEchoes = [
  { x: 390, y: 205, bob: 0 },
  { x: 565, y: 365, bob: 1 },
  { x: 735, y: 220, bob: 2 }
];

const underworldRunes = [
  { x: 565, y: 440, symbol: "MOON", color: "#8fb8dc" },
  { x: 665, y: 440, symbol: "FLAME", color: "#ed9a54" },
  { x: 765, y: 440, symbol: "SKULL", color: "#d8d0c3" }
];

let captainBriefed = false;
let sailingSequencePending = false;
let shipRock = 0;

const interactables = [
  { x: 190, y: 170, w: 100, h: 60, type: "bedroom" },
  { x: 440, y: 105, w: 120, h: 70, type: "piano" },
  { x: 735, y: 135, w: 90, h: 65, type: "books" },
  { x: 110, y: 380, w: 110, h: 70, type: "garden" }
];

/* -------------------------
   QUEST SYSTEM
------------------------- */

let completedCaveObjects = new Set();

function setQuest(questId) {
  currentQuest = questId;

  if (questNames[questId]) {
    questBox.textContent = questNames[questId];
  } else {
    questBox.textContent = "QUEST: " + questId;
  }
}

function showQuestCompletion(message) {
  questToast.textContent = message;
  questToast.classList.remove("hidden");

  if (toastTimeout !== null) {
    clearTimeout(toastTimeout);
  }

  toastTimeout = setTimeout(() => {
    questToast.classList.add("hidden");
    toastTimeout = null;
  }, 3000);
}

function completeQuest(message, nextQuest) {
  showQuestCompletion("QUEST COMPLETE! " + message);
  setQuest(nextQuest);
}

function transitionToArea(area) {
  currentArea = area;

  areaTransitionName.textContent = areaNames[area] || area;

  areaTransition.classList.remove("hidden");

  clearKeys();

  setTimeout(() => {
    if (area === "peaks") {
      enterMistboundPeaks();
    }

    if (area === "dragonArena") {
      enterDragonArena();
    }
    if (area === "sea") {
      enterSea();
    }
    if (area === "shipDeck") {
      enterShipDeck();
    }
    if (area === "island") {
      enterIsland();
    }
    if (area === "underworld") {
      enterUnderworld();
    }
    if (area === "underworldSanctum") {
      enterUnderworldSanctum();
    }
    if (area === "birthdayRoom") {
      enterBirthdayRoom();
    }
    if (area === "cave" && pendingSurfaceReturn === false) {
      currentArea = "cave";
      player.x = 820;
      player.y = 300;
      player.facing = "left";
      setQuest("returnFromUnderworld");
      clearKeys();
    }

    areaTransition.classList.add("hidden");
  }, 1200);
}

function discoverCaveObject(type) {
  if (completedCaveObjects.has(type)) return;

  completedCaveObjects.add(type);

  if (completedCaveObjects.size === 4) {
    completeQuest(
      "You explored the cave!",
      "leaveCave"
    );
  }
}

/* -------------------------
   GAME START / PAUSE
------------------------- */

function clearKeys() {
  for (const key of Object.keys(keys)) {
    keys[key] = false;
  }
}

function startGame() {
  titleScreen.classList.add("hidden");
  gameScreen.classList.remove("hidden");

  gameStarted = true;
  paused = false;

  currentArea = "cave";

  pauseMenu.classList.add("hidden");
  manualPanel.classList.add("hidden");
  mapPanel.classList.add("hidden");

  completedCaveObjects.clear();
  hasTalkedToFunf = false;

  setQuest("talkToFunf");

  clearKeys();

  if (animationFrame === null) {
    animationFrame = requestAnimationFrame(gameLoop);
  }
}

function returnToTitle() {
  gameStarted = false;
  paused = false;

  clearKeys();

  dialogueBox.classList.add("hidden");
  pauseMenu.classList.add("hidden");
  manualPanel.classList.add("hidden");
  mapPanel.classList.add("hidden");

  gameScreen.classList.add("hidden");
  titleScreen.classList.remove("hidden");

  if (animationFrame !== null) {
    cancelAnimationFrame(animationFrame);
    animationFrame = null;
  }
}

function openPause() {
  if (!gameStarted) return;
  if (!dialogueBox.classList.contains("hidden")) return;

  paused = true;
  clearKeys();

  pauseMenu.classList.remove("hidden");
  manualPanel.classList.add("hidden");
  mapPanel.classList.add("hidden");
}

function closePause() {
  paused = false;

  pauseMenu.classList.add("hidden");
  manualPanel.classList.add("hidden");
  mapPanel.classList.add("hidden");

  clearKeys();
}

playButton.addEventListener("click", startGame);

pauseButton.addEventListener("click", openPause);
mobilePause.addEventListener("click", openPause);
if (mapButton) {
  mapButton.addEventListener("click", () => {
    if (!gameStarted || paused) return;
    showMapMessage();
  });
}

resumeButton.addEventListener("click", closePause);

manualButton.addEventListener("click", () => {
  pauseMenu.classList.add("hidden");
  manualPanel.classList.remove("hidden");
});

manualBackButton.addEventListener("click", () => {
  manualPanel.classList.add("hidden");
  pauseMenu.classList.remove("hidden");
});

mapMenuButton.addEventListener("click", () => {
  pauseMenu.classList.add("hidden");
  mapPanel.classList.remove("hidden");
});

mapBackButton.addEventListener("click", () => {
  mapPanel.classList.add("hidden");
  pauseMenu.classList.remove("hidden");
});

titleButton.addEventListener("click", returnToTitle);

/* -------------------------
   KEYBOARD CONTROLS
------------------------- */

window.addEventListener("keydown", (e) => {
  const key = e.key;
  if (!dialogueBox.classList.contains("hidden")) {
  if (
    key === "Enter" ||
    key === " " ||
    key.toLowerCase() === "e"
  ) {
    e.preventDefault();
    advanceDialogue();
  }

  return;
}

  if (
    ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", " "].includes(key)
  ) {
    e.preventDefault();
  }

  if (key === "Escape" || key.toLowerCase() === "p") {
    if (!manualPanel.classList.contains("hidden") ||
        !mapPanel.classList.contains("hidden")) {
      manualPanel.classList.add("hidden");
      mapPanel.classList.add("hidden");
      pauseMenu.classList.remove("hidden");
    } else if (!pauseMenu.classList.contains("hidden")) {
      closePause();
    } else {
      openPause();
    }

    return;
  }

  if (key.toLowerCase() === "e") {
    if (!paused) interact();
    return;
  }

  if (key.toLowerCase() === "m") {
    if (paused) {
      pauseMenu.classList.add("hidden");
      mapPanel.classList.remove("hidden");
    } else {
      showMapMessage();
    }

    return;
  }

  if (key === " " || key === "Spacebar") {
    if (!paused && currentArea === "dragonArena") attackDragon();
    keys[" "] = true;
    return;
  }
  if (key === "Shift") {
    if (!paused && currentArea === "dragonArena") dodgeRoll();
    keys[key] = true;
    return;
  }
  keys[key] = true;
});

window.addEventListener("keyup", (e) => {
  keys[e.key] = false;
});

window.addEventListener("blur", clearKeys);

/* -------------------------
   MOBILE CONTROLS
------------------------- */

document.querySelectorAll(
  "#touch-controls button[data-key]"
).forEach(btn => {

  const key = btn.dataset.key;

  const press = (e) => {
    e.preventDefault();
    keys[key] = true;
    btn.setPointerCapture(e.pointerId);
  };

  const release = (e) => {
    e.preventDefault();
    keys[key] = false;
  };

  btn.addEventListener("pointerdown", press);
  btn.addEventListener("pointerup", release);
  btn.addEventListener("pointercancel", release);
  btn.addEventListener("lostpointercapture", release);
});

/* -------------------------
   DIALOGUE
------------------------- */

dialogueNext.addEventListener("click", advanceDialogue);
canvas.addEventListener("pointerdown", (e) => {
  if (dialogueBox.classList.contains("hidden")) return;

  const rect = canvas.getBoundingClientRect();

  const scaleY = H / rect.height;
  const clickY = (e.clientY - rect.top) * scaleY;

  // Only advance when the player taps the dialogue panel.
  if (clickY >= H - 155) {
    e.preventDefault();
    advanceDialogue();
  }
});

function openDialogue(lines) {
  dialogueLines = lines;
  dialogueIndex = 0;

  dialogueBox.classList.remove("hidden");

  clearKeys();
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

    if (currentQuest === "mistboundPeaks" && currentArea === "cave") {
      transitionToArea("peaks");
    }
    if (sailingSequencePending && currentArea === "shipDeck") {
      sailingSequencePending = false;
      transitionToArea("island");
    }
    if (pendingUnderworldTransition && currentArea === "island") {
      pendingUnderworldTransition = false;
      transitionToArea("underworld");
      return;
    }
    if (pendingSanctumTransition && currentArea === "underworld") {
      pendingSanctumTransition = false;
      transitionToArea("underworldSanctum");
      return;
    }
    if (pendingSurfaceReturn && currentArea === "underworldSanctum") {
      pendingSurfaceReturn = false;
      transitionToArea("birthdayRoom");
      return;
    }
    if (currentArea === "island" && islandExplored && islandHuntComplete() &&
        currentQuest !== "findUnderworld" && currentQuest !== "meetUnderworldResidents") {
      checkIslandHuntProgress();
    }
  } else {
    renderDialogueLine();
  }
}

/* -------------------------
   INTERACTIONS
------------------------- */

function near(a, b, distance = 70) {
  return Math.hypot(a.x - b.x, a.y - b.y) < distance;
}

function islandHuntComplete() {
  return islandHunt.footprints && islandHunt.bottle && islandHunt.chest;
}

function checkIslandHuntProgress() {
  if (islandHuntComplete() && currentQuest !== "findUnderworld" &&
      currentQuest !== "meetUnderworldResidents") {
    completeQuest("You found every island discovery!", "findUnderworld");
    openDialogue([
      ["Narrator", "The scavenger hunt is complete!"],
      ["Streber", "Footprints, a deeply unhelpful bottle, and a map of absolutely nowhere."],
      ["Streber", "Hang on. The map has writing on the back. I should read it properly."],
    ]);
  }
}

function getInteractionHint() {
  if (!gameStarted || paused || !dialogueBox.classList.contains("hidden")) return null;
  if (currentArea === "cave") {
    if (near(player, funf, 80)) return "[E] Talk to Funf";
    if (near(player, dino, 65)) return "[E] Pet Ankylo";
    for (const item of interactables) {
      if (player.x > item.x - 50 && player.x < item.x + item.w + 50 && player.y > item.y - 50 && player.y < item.y + item.h + 50) {
        if (item.type === "piano") return "[E] Play piano";
        if (item.type === "bedroom") return "[E] Enter bedroom";
        if (item.type === "books") return "[E] Read bookshelf";
        if (item.type === "garden") return "[E] Explore garden";
      }
    }
  }
  if (currentQuest === "leaveCave" && player.x > W - 100 && player.y > 180 && player.y < 360) return "[E] Leave the cave";
  if (currentArea === "peaks" && currentQuest === "mistboundPeaks" && player.x > 630 && player.x < 770 && player.y > 220 && player.y < 350) return "[E] Inspect ancient shrine";
  if (currentArea === "peaks" && near(player, mountainWatcher, 80)) return "[E] Talk to mysterious stranger";
  if (currentArea === "peaks" && currentQuest === "dragonBattle" && player.x > W - 100 && player.y > 330) return "[E] Enter the dragon's lair";
  if (currentArea === "sea" && currentQuest === "reachSea" && player.x > 700 && player.y > 290) return "[E] Board the pirate ship";
  if (currentArea === "shipDeck" && near(player, shipCaptain, 85)) return "[E] Talk to the captain";
  if (currentArea === "shipDeck") {
    for (const crewmate of shipCrew) if (near(player, crewmate, 75)) return `[E] Talk to ${crewmate.name}`;
    if (near(player, redLever, 75)) {
      if (!redLeverWarned) return "[E] Inspect the VERY suspicious red lever";
      if (!redLeverPulled) return "[E] Pull the VERY suspicious red lever";
    }
    if (near(player, shipHelm, 90)) return captainBriefed ? "[E] Take the helm" : "[E] The captain should explain first";
  }
  if (currentArea === "island" && !islandHunt.footprints && near(player, islandClues.footprints, 48)) return "[E] Inspect the tiny footprints";
  if (currentArea === "island" && islandHunt.footprints && !islandExplored && near(player, { x: 470, y: 335 }, 115)) return "[E] Follow the suspicious rustling";
  if (currentArea === "island" && islandExplored) {
    if (!islandHunt.footprints && near(player, islandClues.footprints, 48)) return "[E] Inspect tiny footprints";
    if (islandHunt.footprints && !islandHunt.bottle && near(player, islandClues.bottle, 48)) return "[E] Read the message in the bottle";
    if (islandHunt.bottle && !islandHunt.chest && near(player, islandClues.chest, 55)) return "[E] Investigate the treasure chest";
    if (islandHunt.chest && !islandHunt.chantRead && near(player, islandClues.chest, 55)) return "[E] Read the chant on the back of the map";
    if (near(player, islandAnkylo, 75)) return "[E] Check on Ankylo";
    if (islandHunt.chantRead && player.x > W - 95 && player.y > 320) return "[E] Speak the chant and enter the Underworld";
  }
  if (currentArea === "underworld") {
    if (!underworldResidentsMet.asmodeus && near(player, asmodeus, 85)) return "[E] Speak to Asmodeus";
    if (!underworldResidentsMet.cerberus && near(player, cerberus, 85)) return "[E] Meet Cerberus";
    if (underworldResidentsMet.asmodeus && underworldResidentsMet.cerberus && !underworldGateOpen) {
      if (underworldTrialStarted) for (const rune of underworldRunes) if (near(player, rune, 48)) return `[E] Activate the ${rune.symbol.toLowerCase()} rune`;
      if (near(player, {x: 825, y: 390}, 75)) return underworldTrialStarted ? "The gate awaits the three runes" : (sealedGateConversationDone ? "[E] Try to budge the doors (despite the warning)" : "[E] Inspect the sealed gate");
    }
    if (underworldGateOpen && near(player, {x: 835, y: 390}, 85)) return "[E] Pass through the opened gate";
  }
  if (currentArea === "underworldSanctum") {
    if (!sanctumKeeperMet && near(player, sanctumKeeper, 85)) return "[E] Speak to the Archive Keeper";
    for (let i = 0; i < archiveEchoes.length; i++) if (!archiveEchoesFound[i] && near(player, archiveEchoes[i], 55)) return `[E] Catch memory echo ${i + 1}/3`;
    if (sanctumKeeperMet && archiveEchoesFound.every(Boolean) && !archiveNoteReceived && near(player, sanctumKeeper, 100)) return "[E] Ask the Keeper about the way home";
    if (archiveNoteReceived && player.x > W - 95 && player.y > 320) return "[E] Follow the stairway home";
  }
  if (currentArea === "birthdayRoom" && near(player, funf, 100)) return "[E] Talk to Funf";
  return null;
}

function interact() {
  if (!gameStarted || paused) return;
  if (!dialogueBox.classList.contains("hidden")) return;

    // BOARD THE PIRATE SHIP
  if (
    currentArea === "sea" &&
    currentQuest === "reachSea" &&
    player.x > 700 &&
    player.y > 290
  ) {
    transitionToArea("shipDeck");
    return;
  }

  if (currentArea === "island" && islandHunt.chantRead && player.x > W - 95 && player.y > 320) {
    pendingUnderworldTransition = true;
    openDialogue([
      ["Streber", "When night guides the lost and warmth marks the way, let the last witness guard the threshold; speak, and stone shall part for those who seek the path below."],
      ["Narrator", "The chant echoes through the cliffs. Stone grinds against stone, and the cave opens into a passage descending into the Underworld."],
      ["Streber", "Well. That was ominously effective."]
    ]);
    return;
  }

  if (currentArea === "underworld" && underworldGateOpen && near(player, {x: 835, y: 390}, 85)) {
    pendingSanctumTransition = true;
    openDialogue([
      ["Streber", "Well, the ominous gate is open. That usually means the worst part is next."],
      ["Asmodeus", "Beyond lies the Ashen Archive, where the Underworld keeps the memories it has collected."],
      ["Streber", "That is somehow worse than a dungeon."],
      ["Asmodeus", "Do not touch anything that glows."],
      ["Streber", "You know I am going to touch something that glows."]
    ]);
    return;
  }

  if (currentArea === "underworldSanctum") {
    if (!sanctumKeeperMet && near(player, sanctumKeeper, 85)) {
      sanctumKeeperMet = true;
      setQuest("findEmberOfMemory");
      openDialogue([
        ["Archive Keeper", "Another living visitor. We have had three this century."],
        ["Streber", "Was one of them a dog with three heads?"],
        ["Archive Keeper", "Cerberus is staff."],
        ["Streber", "Of course he is."],
        ["Archive Keeper", "The way out is a small archival exercise. Three memory echoes have escaped their jars. Catch them, and I shall see you properly on your way."],
        ["Streber", "So this is a library scavenger hunt."],
        ["Archive Keeper", "Please do not call it that in front of the jars."]
      ]);
      return;
    }

    for (let i = 0; i < archiveEchoes.length; i++) {
      if (!archiveEchoesFound[i] && near(player, archiveEchoes[i], 55)) {
        archiveEchoesFound[i] = true;
        const memories = [
          ["Memory Echo", "The Mistbound Peaks shimmer into view. The Mountain Watcher stands beside Streber in the snow, pretending not to worry. The wind is cold, but the memory feels strangely safe."],
          ["Memory Echo", "The pirate ship rocks beneath a bright blue sky. Ropes creak, the captain shouts, and someone remembers the extremely suspicious red lever. Streber laughs before he can stop himself."],
          ["Memory Echo", "A tiny ankylosaurus waddles out from behind a rock, its little tail thumping like a drum. Streber kneels to let it sniff his hand. The whole world feels gentle for a moment."]
        ];
        memories[i] = ["Memory Echo", memories[i][1]];
        memories.push(["Streber", `Memory echo ${i + 1} of 3 secured. I am, apparently, a librarian now.`]);
        if (archiveEchoesFound.every(Boolean)) memories.push(["Narrator", "The three echoes drift together, forming a little golden envelope. The Archive Keeper beckons you over."]);
        openDialogue(memories);
        return;
      }
    }
    if (sanctumKeeperMet && archiveEchoesFound.every(Boolean) && !archiveNoteReceived && near(player, sanctumKeeper, 100)) {
      archiveNoteReceived = true;
      emberOfMemoryFound = true;
      completeQuest("The Archive Keeper has a message for you.", "returnFromUnderworld");
      openDialogue([
        ["Archive Keeper", "You have returned every memory to its proper shelf. A rare achievement."],
        ["Streber", "I caught three floating lights. Please do not inflate my résumé."],
        ["Archive Keeper", "This note was left for you by Funf."],
        ["Funf (in the note)", "Dear nerd: being friends with Asmodeus has perks. He let me use his archive for my little quest, so you can stop exploring the creepy basement and head on home. I may or may not have planned something. —Funf"],
        ["Archive Keeper", "The stairway will take you where you need to go."],
        ["Streber", "That note has made me significantly more suspicious. And also slightly emotional. Annoying."]
      ]);
      return;
    }
    if (archiveNoteReceived && player.x > W - 95 && player.y > 320) {
      pendingSurfaceReturn = true;
      openDialogue([
        ["Narrator", "The stairway glows, and the note from Funf warms in your pocket."],
        ["Streber", "Right. Homeward. I have a feeling this is not going to be a normal homecoming."]
      ]);
      return;
    }
  }

  if (currentArea === "birthdayRoom" && near(player, funf, 100)) {
    openDialogue([
      ["Funf", "SURPRISE, NERD!! HAPPY BIRTHDAY!!"],
      ["Streber", "You got ALL of them here?"],
      ["Funf", "Obviously. I have connections. Some of them are questionable."],
      ["Streber", "I don't even know what to say."],
      ["Funf", "You could start with 'thank you, Funf, you are incredibly talented and-'"],
      ["Streber", "I was going to say 'what the hell', but that works too."],
      ["Funf", "There's cake. And presents. And Ankylo who has apparently appointed himself head of security. I gotta take care of that."],
      ["Streber", "This is actually really nice :(( thank you."],
      ["Funf", "Oh you don't have to, Happy birthday, nerdd."]
    ]);
    return;
  }

  if (currentArea === "birthdayRoom") {
    openDialogue([
      ["Streber", "Everyone actually came."],
      ["Streber", "I should probably go say hello."]
    ]);
    return;
  }

  if (currentArea === "underworld") {
    if (!underworldResidentsMet.asmodeus && near(player, asmodeus, 85)) {
      underworldResidentsMet.asmodeus = true;
      completeQuest("You met the Lord of the Underworld.", "meetUnderworldResidents");
      openDialogue([
        ["Asmodeus", "I am Asmodeus, lord of this realm, terror of—"],
        ["Streber", "Great. Do you validate parking?"],
        ["Asmodeus", "I have never been more disrespected."],
        ["Streber", "You should meet my friend."]
      ]);
      return;
    }

    if (!underworldResidentsMet.cerberus && near(player, cerberus, 85)) {
      underworldResidentsMet.cerberus = true;
      openDialogue([
        ["Cerberus", "*three heads bark at once*"],
        ["Streber", "Hello to all three of you."],
        ["Cerberus", "*one head growls, one head whines, one head tries to eat your boot*"],
        ["Streber", "I respect the range of personalities."],
        ["Narrator", "The middle head has decided you are acceptable. The other two remain under review."]
      ]);
      return;
    }

    if (underworldResidentsMet.asmodeus && underworldResidentsMet.cerberus && !underworldGateOpen) {
      if (!sealedGateConversationDone && near(player, {x: 825, y: 390}, 75)) {
        sealedGateConversationDone = true;
        openDialogue([
          ["Streber", "A huge sealed gate. Of course."],
          ["Asmodeus", "Beyond that gate lies a trial no mortal has ever—"],
          ["Streber", "Can I open it?"],
          ["Asmodeus", "No."],
          ["Streber", "Then why are you telling me about it?"],
          ["Asmodeus", "I AM BUILDING ATMOSPHERE."]
        ]);
        return;
      }

      if (sealedGateConversationDone && !underworldTrialStarted && near(player, {x: 825, y: 390}, 75)) {
        underworldTrialStarted = true;
        openDialogue([
          ["Asmodeus", "Very well. Three riddles, three runes. Solve them, and the gate may open."],
          ["Asmodeus", "First: I rule the borrowed light, I pull the quiet tides, and I watch the world while the sun is gone. What am I?"],
          ["Streber", "That sounds like a trick question."],
          ["Asmodeus", "Second: I hunger without a mouth, I dance without feet, and I turn wood to ash. What am I?"],
          ["Streber", "Hmm, interesting. I think I know this one."],
          ["Asmodeus", "Last: I grin without joy, I wear no flesh, and every living thing will one day resemble me. What am I?"],
          ["Streber", "That is a deeply unpleasant thing to think about."],
          ["Asmodeus", "Remember what you have learned. The gate will not accept guesswork."],
          ["Streber", "Very well, let's give it a try."]
        ]);
        return;
      }

      if (underworldTrialStarted) {
        for (const rune of underworldRunes) {
          if (near(player, rune, 48)) {
            const expected = ["MOON", "FLAME", "SKULL"][underworldRuneProgress];
            if (rune.symbol === expected) {
              underworldRuneProgress++;
              openDialogue([
                ["Narrator", `The ${rune.symbol.toLowerCase()} rune glows brightly.`],
                ["Asmodeus", underworldRuneProgress === 3 ? "The trial is complete." : "One step closer. Continue."]
              ]);
              if (underworldRuneProgress === 3) {
                underworldGateOpen = true;
                completeQuest("The ancient gate has opened!", "enterUnderworldSanctum");
              }
            } else {
              underworldRuneProgress = 0;
              openDialogue([
                ["Narrator", "The rune flashes, then fades. The sequence resets."],
                ["Streber", "Well. That was probably not right."]
              ]);
            }
            return;
          }
        }
      }
    }
  }

  if (currentArea === "shipDeck" && near(player, redLever, 75)) {
    if (!redLeverWarned) {
      redLeverWarned = true;
      openDialogue([
        ["Streber", "A red lever. On a pirate ship."],
        ["Streber", "That seems like an incredibly bad idea."],
        ["Narrator", "A small label reads: DO NOT PULL."],
        ["Streber", "Well, now I have to."]
      ]);
    } else if (!redLeverPulled) {
      redLeverPulled = true;
      openDialogue([
        ["Narrator", "A loud HONK echoes across the ship."],
        ["Captain", "WHO PULLED THE HONK LEVER?"],
        ["Streber", "The what?"],
        ["Pip", "THE HONK LEVER!"],
        ["Streber", "I regret nothing."]
      ]);
    } else {
      openDialogue([
        ["Streber", "I have already pulled the honk lever."],
        ["Streber", "I refuse to make this ship any louder."]
      ]);
    }
    return;
  }

  if (currentArea === "shipDeck") {
    for (const crewmate of shipCrew) {
      if (near(player, crewmate, 75)) {
        if (crewmate.name === "Milo") {
          openDialogue([
             ["Milo", "Ahoy! I'm in charge of the barrels. And occasionally the seagulls."],
            ["Streber", "That sounds like a demanding position."],
            ["Milo", "One stole my lunch yesterday. I challenged it to a duel."],
            ["Streber", "Who won?"],
            ["Milo", "The seagull has my hat now."],
            ["Streber", "Funf would absolutely challenge a seagull to a duel."]
          ]);
        } else {
          openDialogue([
            ["Pip", "Welcome aboard the Mighty Pirate Ship! We have three rules."],
            ["Streber", "Only three?"],
            ["Pip", "Don't fall overboard, don't touch the captain's hat, and never volunteer for cannon duty."],
            ["Streber", "What happens if you volunteer for cannon duty?"],
            ["Pip", "You become the cannon's problem."],
            ["Streber", "That is somehow less reassuring than I expected."]
          ]);
        }
        return;
      }
    }
  }

  if (currentArea === "shipDeck" && near(player, shipCaptain, 85)) {
    if (!captainBriefed) {
      captainBriefed = true;
      completeQuest("The captain has agreed to take you across the sea.", "sailToIsland");
      openDialogue([
        ["Captain", "Ahoy, tiny sword person. Looking for a ride?"],
        ["Streber", "I was hoping for a boat, yes."],
        ["Captain", "This is a ship."],
        ["Streber", "I can see that."],
        ["Captain", "Good. I worry about people who can't."],
        ["Captain", "The island is a little way east. Take the helm when you're ready."],
        ["Streber", "You are letting a stranger steer your ship?"],
        ["Captain", "You look trustworthy."],
        ["Streber", "That's because you haven't spoken to me for long enough."]
      ]);
    } else {
      openDialogue([
        ["Captain", "Helm's yours. Try not to steer us into a very large rock."],
        ["Streber", "That feels like an important instruction to give BEFORE I take the helm."]
      ]);
    }
    return;
  }

  if (currentArea === "shipDeck" && near(player, shipHelm, 90)) {
    if (!captainBriefed) {
      openDialogue([["Streber", "I should probably ask the captain what I'm doing first."]]);
    } else {
      completeQuest("All aboard. Probably should have checked the life jackets.", "sailToIsland");
      sailingSequencePending = true;
      openDialogue([
        ["Streber", "Right. How hard can steering a ship be?"],
        ["Narrator", "The sails catch the wind. The shore begins to shrink behind you."],
        ["Streber", "Okay. This is actually kind of nice."],
      ]);
    }
    return;
  }

  if (currentArea === "island" && !islandHunt.footprints && near(player, islandClues.footprints, 48)) {
    islandHunt.footprints = true;
    openDialogue([
      ["Streber", "Tiny footprints. Very tiny. Suspiciously dinosaur-shaped."],
      ["Narrator", "The tracks lead toward the trees, then immediately get distracted and wander in a circle."]
    ]);
    return;
  }

  if (currentArea === "island" && islandHunt.footprints && !islandExplored && near(player, { x: 470, y: 335 }, 115)) {
    islandExplored = true;
    completeQuest("You have reached the island! Something rustles in the trees...", "exploreIsland");
    openDialogue([
      ["Streber", "Island acquired."],
      ["Streber", "That bush just moved."],
      ["Narrator", "A tiny armored shape waddles out of the greenery. It looks... familiar."],
      ["Streber", "No. No way."],
      ["Streber", "ANKYLO?! What are you doing all the way out here?"],
      ["Narrator", "Ankylo blinks at you, as if this is a perfectly normal place to be."],
      ["Streber", "...I'm going to tell Funf about this."]
    ]);
    return;
  }

  if (currentArea === "island" && islandExplored) {
    if (!islandHunt.bottle && near(player, islandClues.bottle, 48)) {
      islandHunt.bottle = true;
      openDialogue([
        ["Streber", "Ooh. Where'd that come from? A bottle just washed up here?"],
        ["Narrator", "There's a message inside. It reads: 'If you found this, you looked very hard for this.'"],
        ["Streber", "...That is not useful information, but I feel weirdly accomplished."]
      ]);
      return;
    }

    if (islandHunt.chest && !islandHunt.chantRead && near(player, islandClues.chest, 55)) {
      islandHunt.chantRead = true;
      openDialogue([
        ["Streber", "Right, what does the back say?"],
        ["Narrator", "In faded ink: 'When night guides the lost and warmth marks the way, let the last witness guard the threshold; speak, and stone shall part for those who seek the path below.'"],
        ["Streber", "That sounds like directions written by someone who charges by the syllable."],
        ["Narrator", "The map's markings glow. A dark opening appears beneath the cliffs to the east."],
        ["Streber", "Well. I did say I wanted to know where this went."]
      ]);
      return;
    }

    if (!islandHunt.chest && islandHunt.bottle && near(player, islandClues.chest, 55)) {
      islandHunt.chest = true;
      islandHunt.rewardFound = true;
      const chestDialogue = [
        ["Streber", "A treasure chest! Finally, a normal pirate-island thing."],
        ["Narrator", "Inside: a few shiny coins, a suspiciously tiny hat, and a hand-drawn map of absolutely nowhere. There is writing on the back."],
        ["Streber", "Worth it. The hat is mine."]
      ];
      if (islandHunt.footprints && islandHunt.bottle) {
        chestDialogue.push(["Narrator", "Scavenger hunt complete! You investigated every suspicious thing you could find."]);
        chestDialogue.push(["Narrator", "There is a tiny note on the back of the map. Maybe inspect it after this."]);
      }
      openDialogue(chestDialogue);
      return;
    }
  }

  if (
    currentArea === "peaks" &&
    currentQuest === "dragonBattle" &&
    player.x > W - 100 &&
    player.y > 330
  ) {
    transitionToArea("dragonArena");
    return;
  }

  if (
    currentArea === "peaks" &&
    currentQuest !== "mistboundPeaks" &&
    near(player, mountainWatcher, 80)
  ) {
    if (currentQuest === "dragonWarning") {
      completeQuest("The mountain guardian awaits!", "dragonBattle");
      openDialogue([
        ["???", "So. You've read the warning?"],
        ["Streber", "Who are you?????"],
        ["???", "They call me the mountain watcher, now answer my question."],
        ["Streber", "Yes, i read it. Apparently there's a dragon."],
        ["???", "There is."],
        ["Streber", "Wonderful. Of course there is."],
        ["???", "It guards the only passage through these mountains."],
        ["Streber", "And I assume it can be reasoned with?"],
        ["???", "..."],
        ["Streber", "Right. Stupid question."],
        ["???", "Draw your sword, traveller."],
        ["???", "And try not to die."]
      ]);
    } else {
      openDialogue([
        ["???", "The mountains remember."],
        ["Streber", "Remember what?"],
        ["???", "Find the shrine. Then we may speak."]
      ]);
    }
    return;
  }

  if (
    currentArea === "peaks" &&
    currentQuest === "mistboundPeaks" &&
    player.x > 630 &&
    player.x < 770 &&
    player.y > 220 &&
    player.y < 350
  ) {
    completeQuest("You discovered an ancient warning!", "dragonWarning");
    openDialogue([
      ["Shrine", "An ancient inscription is carved into the stone."],
      ["Shrine", "BEWARE THE GUARDIAN OF THE PEAKS."],
      ["Streber", "That sounds unnecessarily dramatic."],
      ["Shrine", "BEWARE ITS FIRE."],
      ["Streber", "..."],
      ["Streber", "Okay. Slightly more concerning."]
    ]);
    return;
  }

  if (!dialogueBox.classList.contains("hidden")) return;

  if (
    currentQuest === "leaveCave" &&
    player.x > W - 100 &&
    player.y > 180 &&
    player.y < 360
  ) {
    completeQuest("You have left the cave", "mistboundPeaks");
    openDialogue([
      ["Streber", "woahh, the outside world is so bright."],
      ["Streber", "And that's a lot of mist. I can barely see anything."],
      ["???", "Welcome to the Mistbound Peaks."]
    ]);
    return;
  }

  if (currentArea === "cave" && near(player, funf, 80)) {
    if (!hasTalkedToFunf) {
      hasTalkedToFunf = true;
      completeQuest("You found Funf!", "exploreCave");
    }

    openDialogue([
      ["Funf", "Happy birthday, nerd. <3"],
      ["Funf", "Before you ask, yes. I made this."],
      ["Streber", "..."],
      ["Funf", "Your first quest is extremely important."],
      ["Funf", "Explore our cave!"],
      ["Funf", "Look around. There might be some things you recognize. And then you can head out for your adventure!"],
      ["Streber", "Holy shit funf!"],
      ["Funf", ":p hehehe. Oh and absolutely no 'potential' jokes."],
      ["Streber", "Probably :>."]
    ]);
    return;
  }

  if (currentArea === "cave" && near(player, dino, 65)) {
    openDialogue([
      ["Ankylo", "...mlep."],
      ["Streber", "You are very small."],
      ["Ankylo", "*happy dinosaur noises*"]
    ]);
    return;
  }

  if (currentArea === "cave") {
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
  }

  openDialogue([
    ["Streber", "Nothing happens."],
    ["Streber", "A riveting development."]
  ]);
}

function interactWithObject(type) {
  if (hasTalkedToFunf) {
    discoverCaveObject(type);
  }

  if (type === "piano") {
    openDialogue([
      ["Piano", "*plink*"],
      ["Streber", "You play a very serious chord."],
      ["Piano", "*plink plonk*"]
    ]);
  }

  if (type === "bedroom") {
    openDialogue([
      ["Streber", "This is my room."],
      ["Streber", "Stars. Books. Computers. Physics. DnD."],
      ["Streber", "There is also a suspicious amount of sword-related equipment."]
    ]);
  }

  if (type === "books") {
    openDialogue([
      ["Bookshelf", "A humble collection of books."],
      ["Bookshelf", "Some are about physics."],
      ["Bookshelf", "Others are about fantasy."],
      ["Streber", "OOH! The Witcher, I have to read that later."],
      ["Bookshelf", "One is, not surprisingly, about entropy."]
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
/* -------------------------
   MAP
------------------------- */

function showMapMessage() {
  if (paused) return;

  openDialogue([
    ["MAP", "HOME CAVE → MISTBOUND PEAKS → SEA → ISLAND → UNDERWORLD → THE FINALE"],
    ["MAP", "The rest of the world is currently being constructed by one confused coder."]
  ]);
}

/* -------------------------
   GAME UPDATE
------------------------- */

function update() {
  if (!gameStarted || paused) return;

  if (!dialogueBox.classList.contains("hidden")) return;

  let dx = 0;
  let dy = 0;
  const oldX = player.x, oldY = player.y;

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

  // Sea-scene collision: a broad, continuous route from shore, across the
  // gangplank, and onto the ship. Keep the player out of the water without
  // making the narrow bridge frustrating to cross.
  if (currentArea === "sea") {
    const onLanding = player.x <= 205 && player.y >= 190 && player.y <= H - 25;
    const onGangplank = player.x >= 150 && player.x <= 755 && player.y >= 300 && player.y <= 435;
    const onShip = player.x >= 650 && player.x <= 930 && player.y >= 285 && player.y <= 445;
    if (!(onLanding || onGangplank || onShip)) {
      player.x = oldX;
      player.y = oldY;
    }
  }
  if (currentArea === "birthdayRoom") {
    player.x = Math.max(55, Math.min(W - 55, player.x));
    player.y = Math.max(230, Math.min(H - 45, player.y));
  }

  dino.bob += 0.08;

  if (currentArea === "peaks") {
    mountainWatcher.bob += 0.05;
  }
  if (currentArea === "dragonArena") {
    dragon.bob += 0.04;
    updateDragonCombat();
  }
  if (currentArea === "shipDeck") {
    shipRock += 0.035;
    shipCaptain.bob += 0.04;
  }
  if (currentArea === "underworld") {
    asmodeus.bob += 0.04;
    cerberus.bob += 0.06;
  }
  if (currentArea === "underworldSanctum") {
    sanctumKeeper.bob += 0.025;
    memoryEmber.bob += 0.055;
    archiveEchoes.forEach(echo => echo.bob += 0.045);
  }
}

/* -------------------------
   DRAWING
------------------------- */

function drawPixelRect(x, y, w, h, color) {
  ctx.fillStyle = color;
  ctx.fillRect(
    Math.round(x),
    Math.round(y),
    Math.round(w),
    Math.round(h)
  );
}

function drawPixelAtmosphere(kind) {
  // Layered, deliberately pixelated scenery: distant silhouettes, textured foreground,
  // glints and atmospheric motes. Drawn in code so it scales cleanly with the canvas.
  const palettes = {
    cave: {sky:'#191f25', far:'#303b35', mid:'#465445', ground:'#6d654b', glow:'#f3b75b'},
    peaks:{sky:'#718b9c',far:'#526b7b',mid:'#8399a2',ground:'#b6c8c8',glow:'#f7e9c8'},
    sea:{sky:'#6eacc7',far:'#397c9b',mid:'#4d9eae',ground:'#d7bd85',glow:'#fff0c2'},
    ship:{sky:'#417b91',far:'#25536c',mid:'#946744',ground:'#bd8b58',glow:'#ffe2a0'},
    island:{sky:'#79b9d3',far:'#2e6b55',mid:'#55945d',ground:'#d7bd83',glow:'#fff0c2'},
    under:{sky:'#211b2c',far:'#38253b',mid:'#67313d',ground:'#45313d',glow:'#ff9a4d'},
    archive:{sky:'#171c31',far:'#252d49',mid:'#394766',ground:'#42364c',glow:'#78dfff'},
    party:{sky:'#35273f',far:'#5c3a54',mid:'#9b5d69',ground:'#9e7668',glow:'#ffd47d'}
  };
  const q = palettes[kind] || palettes.cave;
  ctx.fillStyle=q.sky; ctx.fillRect(0,0,W,H);
  // Distant stepped silhouettes.
  for(let i=0;i<12;i++){
    const x=i*82-12, h=55+((i*37)%95);
    drawPixelRect(x, 235-h, 90, h+85, q.far);
    drawPixelRect(x+12, 225-h, 62, 13, q.mid);
    drawPixelRect(x+24, 210-h, 34, 15, q.far);
  }
  // Ground planes and blocky texture tiles.
  drawPixelRect(0,275,W,265,q.mid);
  drawPixelRect(0,315,W,225,q.ground);
  for(let i=0;i<105;i++){
    const x=(i*97+13)%W, y=285+((i*61)%240), size=3+(i%3)*2;
    drawPixelRect(x,y,size,size,(i%4===0)?q.glow:(i%2?q.far:q.mid));
  }
  // Glowing dust, stars or fireflies.
  for(let i=0;i<22;i++){
    const x=(i*137+Math.floor(animationClock*(i%3===0?.15:0)))%W;
    const y=55+((i*71)%390);
    if(i%3===0 || Math.sin(animationClock*.04+i)>0.7) drawPixelRect(x,y,3+(i%2),3,q.glow);
  }
}

function drawCave() {
  drawPixelAtmosphere("cave");
  // Timber framing and warm stonework give the cave a lived-in home silhouette.
  drawPixelRect(28, 45, 18, 430, "#3b2928"); drawPixelRect(914, 45, 18, 430, "#3b2928");
  drawPixelRect(28, 45, 904, 18, "#654333");
  for(let x=55;x<910;x+=72){drawPixelRect(x,48,8,20,"#a06c43");drawPixelRect(x+3,68,3,18,"#4b332d");}
  // Broad rug and stepping stones.
  drawPixelRect(315, 330, 335, 118, "#70434a"); drawPixelRect(327,342,311,94,"#bd805d");
  for(let x=342;x<625;x+=28){drawPixelRect(x,352,5,72,"#e0b477");}
  drawPixelRect(35, 50, W - 70, H - 85, "#59634b");
  drawPixelRect(55, 70, W - 110, H - 125, "#687256");

  drawPixelRect(35, 50, W - 70, H - 85, "#59634b");
  drawPixelRect(55, 70, W - 110, H - 125, "#687256");

  for (let i = 0; i < 80; i++) {
    const x = 55 + ((i * 137) % 820);
    const y = 75 + ((i * 83) % 385);

    drawPixelRect(
      x,
      y,
      5,
      5,
      i % 3 === 0 ? "#7c8060" : "#525f49"
    );
  }

  for (let i = 0; i < 24; i++) {
    const x = 25 + ((i * 91) % 910);
    const y = i % 2 === 0 ? 40 : 465;

    drawPixelRect(x, y, 55, 22, "#302c30");
    drawPixelRect(x + 8, y - 8, 38, 8, "#40383a");
  }

  // Fireplace: chunky pixel flames flicker at slightly different rhythms.
  const firePulse = Math.sin(animationClock * 0.22);
  drawPixelRect(390, 65, 75, 65, "#3a2826");
  drawPixelRect(405, 83, 45, 35, "#1b191a");
  drawPixelRect(414, 91 - Math.round(Math.sin(animationClock * 0.31) * 3), 9, 17 + Math.round(firePulse * 3), "#e0a34f");
  drawPixelRect(430, 82 - Math.round(Math.sin(animationClock * 0.27) * 3), 10, 26 + Math.round(firePulse * 4), "#f2c65f");
  drawPixelRect(442, 91 - Math.round(Math.sin(animationClock * 0.36) * 2), 8, 17 + Math.round(firePulse * 2), "#d87d3f");
  if (Math.sin(animationClock * 0.12) > 0.35) drawPixelRect(423, 73, 3, 4, "#f2c65f");

  // Piano
  drawPixelRect(435, 120, 130, 52, "#302329");
  drawPixelRect(450, 172, 8, 38, "#302329");
  drawPixelRect(542, 172, 8, 38, "#302329");

  for (let i = 0; i < 10; i++) {
    drawPixelRect(449 + i * 10, 125, 8, 34, "#ead9b8");
  }

  // Bedroom doorway
  drawPixelRect(150, 105, 145, 115, "#3c3030");
  drawPixelRect(165, 120, 115, 100, "#201a20");
  drawPixelRect(205, 140, 35, 35, "#d7b77c");

  // Bookshelf
  drawPixelRect(735, 120, 90, 110, "#4a3027");

  for (let i = 0; i < 5; i++) {
    drawPixelRect(
      745,
      130 + i * 18,
      70,
      10,
      i % 2 ? "#8a5b49" : "#6f7451"
    );
  }

  // Garden
  drawPixelRect(80, 350, 160, 100, "#4b6244");

  for (let i = 0; i < 8; i++) {
    const x = 95 + (i * 19) % 135;
    const y = 370 + ((i * 31) % 60);

    drawPixelRect(x, y, 5, 14, "#41603f");
    drawPixelRect(x - 3, y - 3, 11, 6, "#e8d7c2");
  }

  // Decorations
  drawPixelRect(610, 90, 18, 18, "#b7835b");
  drawPixelRect(645, 100, 10, 22, "#c6a05f");
  drawPixelRect(875, 390, 24, 12, "#8c5c45");
  // Hanging lanterns and little domestic details.
  for(const lx of [115,315,610,845]){
    drawPixelRect(lx,78,4,24,"#302329"); drawPixelRect(lx-7,98,18,20,"#70452f");
    drawPixelRect(lx-3,102,10,12,"#f2b95c"); drawPixelRect(lx,104,4,8,"#fff0b0");
  }
  drawPixelRect(335,285,65,25,"#a17a55"); drawPixelRect(343,270,49,18,"#c9a678");
  drawPixelRect(360,278,13,7,"#6e8c6e"); drawPixelRect(375,276,9,9,"#e6c477");
}
function drawMistboundPeaks() {
  // Sky
  drawPixelAtmosphere("peaks");

  // Distant mountains
  drawPixelRect(0, 170, W, 300, "#3d4b50");

  drawPixelRect(40, 145, 180, 180, "#46575b");
  drawPixelRect(140, 105, 210, 220, "#526368");
  drawPixelRect(300, 150, 190, 175, "#435256");
  drawPixelRect(470, 110, 230, 215, "#536468");
  drawPixelRect(670, 145, 230, 180, "#3f5054");

  // Snow / mist on mountain peaks
  drawPixelRect(105, 145, 45, 15, "#c9c9bd");
  drawPixelRect(125, 130, 35, 15, "#d8d6c9");

  drawPixelRect(520, 110, 50, 15, "#d2d1c5");
  drawPixelRect(540, 95, 35, 15, "#dedccf");

  // Ground
  drawPixelRect(35, 310, W - 70, 160, "#485a47");
  drawPixelRect(55, 330, W - 110, 120, "#53664d");

  // Mountain path
  drawPixelRect(400, 330, 170, 120, "#7c705c");
  drawPixelRect(350, 350, 120, 25, "#8a7b63");
  drawPixelRect(520, 390, 150, 25, "#8a7b63");

  // Mist
  for (let i = 0; i < 10; i++) {
    const x = 70 + ((i * 103) % 800);
    const y = 280 + ((i * 47) % 130);

    drawPixelRect(
      x,
      y,
      50,
      10,
      "rgba(210,215,205,.16)"
    );
  }

  // Pine trees
  drawPineTree(110, 310);
  drawPineTree(175, 355);
  drawPineTree(760, 325);
  drawPineTree(850, 365);

  // Old shrine
  drawPixelRect(665, 250, 75, 60, "#3b3635");
  drawPixelRect(680, 230, 45, 25, "#4b4542");
  drawPixelRect(695, 265, 15, 25, "#202020");

  // Small campfire
  drawPixelRect(250, 395, 30, 8, "#49372d");
  drawPixelRect(258, 378, 8, 20, "#d17a3d");
  drawPixelRect(268, 384, 8, 14, "#efb34d");

  // Stars / glimmers
  drawPixelRect(150, 90, 4, 4, "#e8c978");
  drawPixelRect(340, 75, 3, 3, "#e8c978");
  drawPixelRect(760, 100, 4, 4, "#e8c978");
}

function drawDragonArena() {
  // Dark volcanic ground
  drawPixelRect(0, 0, W, H, "#25232c");
  drawPixelRect(35, 70, W - 70, H - 105, "#48404a");
  drawPixelRect(55, 90, W - 110, H - 145, "#5a4b4b");

  // Distant cliffs
  drawPixelRect(0, 80, 180, 250, "#302d38");
  drawPixelRect(W - 180, 80, 180, 250, "#302d38");

  // Lava cracks
  drawPixelRect(140, 390, 150, 12, "#d36a38");
  drawPixelRect(260, 390, 12, 60, "#d36a38");
  drawPixelRect(480, 420, 190, 10, "#e38a43");
  drawPixelRect(640, 375, 12, 55, "#e38a43");

  // Scattered rocks
  for (let i = 0; i < 12; i++) {
    const x = 70 + (i * 73) % (W - 140);
    const y = 320 + (i * 37) % 120;

    drawPixelRect(x, y, 25, 15, "#38343b");
  }

  // Atmospheric embers
  for (let i = 0; i < 18; i++) {
    const x = 60 + (i * 97) % (W - 120);
    const y = 80 + (i * 61) % 300;

    drawPixelRect(x, y, 4, 4, "#d78b52");
  }
}

function drawDragon() {
  const x = dragon.x;
  const y = dragon.y + Math.sin(dragon.bob) * 4;

  // Wings flap in chunky steps, like a proper pixel-art boss animation.
  const wingLift = Math.round(Math.sin(animationClock * 0.11) * 12);
  drawPixelRect(x - 115, y - 55 - wingLift, 85, 75 + wingLift, "#762f39");
  drawPixelRect(x + 30, y - 55 - wingLift, 85, 75 + wingLift, "#762f39");

  drawPixelRect(x - 100, y - 75 - wingLift, 50, 40, "#a34245");
  drawPixelRect(x + 50, y - 75 - wingLift, 50, 40, "#a34245");

  // Tail
  drawPixelRect(x + 50, y + 35, 85, 18, "#8c3638");
  drawPixelRect(x + 115, y + 25, 25, 25, "#c47a47");

  // Body
  drawPixelRect(x - 48, y - 30, 96, 105, "#943b3c");
  drawPixelRect(x - 25, y - 10, 50, 75, "#c17c50");

  // Neck and head
  drawPixelRect(x - 32, y - 85, 64, 65, "#943b3c");
  drawPixelRect(x - 45, y - 105, 90, 45, "#a64642");

  // Snout
  drawPixelRect(x - 35, y - 65, 70, 20, "#c16a4a");

  // Horns
  drawPixelRect(x - 38, y - 125, 16, 30, "#ded0ad");
  drawPixelRect(x + 22, y - 125, 16, 30, "#ded0ad");

  // Eyes
  drawPixelRect(x - 25, y - 88, 12, 8, "#eac65c");
  drawPixelRect(x + 13, y - 88, 12, 8, "#eac65c");

  drawPixelRect(x - 20, y - 88, 4, 8, "#241b20");
  drawPixelRect(x + 18, y - 88, 4, 8, "#241b20");

  // Claws
  drawPixelRect(x - 48, y + 65, 30, 20, "#672b34");
  drawPixelRect(x + 18, y + 65, 30, 20, "#672b34");
}

function drawPineTree(x, y) {
  drawPixelRect(x - 6, y + 35, 12, 35, "#40342f");

  drawPixelRect(x - 25, y + 5, 50, 35, "#30463a");
  drawPixelRect(x - 18, y - 15, 36, 30, "#385140");
  drawPixelRect(x - 10, y - 32, 20, 25, "#426047");
}

function drawAnkylosaurus() {
  const ankylo = arguments.length ? arguments[0] : dino;
  const x = ankylo.x;
  const gait = Math.sin((ankylo.bob || 0) * 2.2);
  const y = ankylo.y + Math.sin(ankylo.bob || 0) * 2;

  // Tail
  drawPixelRect(x - 22, y + 8 + Math.round(gait * 2), 25, 8, "#506342");
  drawPixelRect(x - 29, y + 2 + Math.round(gait * 2), 12, 8, "#64754b");

  // Body
  drawPixelRect(x, y, 34, 18, "#65794d");
  drawPixelRect(x + 5, y - 7, 25, 12, "#708858");

  // Head
  drawPixelRect(x + 25, y - 4, 14, 13, "#6e8051");

  // Legs
  drawPixelRect(x + 5, y + 15 + Math.round(gait * 2), 7, 9, "#3f523c");
  drawPixelRect(x + 25, y + 15 - Math.round(gait * 2), 7, 9, "#3f523c");

  // Eye
  drawPixelRect(x + 34, y - 1, 3, 3, "#20191b");

  // Armor
  drawPixelRect(x + 9, y - 5, 6, 5, "#82935d");
  drawPixelRect(x + 20, y - 5, 6, 5, "#82935d");
}

function drawMountainWatcher() {
  const y = mountainWatcher.y + Math.sin(mountainWatcher.bob) * 2;

  drawPixelRect(
    mountainWatcher.x - 12,
    y - 25,
    24,
    28,
    "#25252b"
  );

  drawPixelRect(
    mountainWatcher.x - 17,
    y - 32,
    34,
    12,
    "#19191d"
  );

  drawPixelRect(
    mountainWatcher.x - 5,
    y - 15,
    3,
    3,
    "#d7b77c"
  );

  drawPixelRect(
    mountainWatcher.x + 3,
    y - 15,
    3,
    3,
    "#d7b77c"
  );
}

function enterDragonArena() {
  currentArea = "dragonArena";

  player.x = 220;
  player.y = 350;
  player.facing = "right";

  dragon.hp = dragon.maxHp;
  playerHp = playerMaxHp;
  fireballs = [];
  dragonWarning = null;
  dragonAttackTimer = 100;
  dragonDefeated = false;
  victoryDialogueSeen = false;
  swordCooldown = 0;
  dodgeCooldown = 0;
  dodgeFrames = 0;
  invulnerableFrames = 0;
  swordFrames = 0;

  clearKeys();

  if (!dragonIntroSeen) {
    dragonIntroSeen = true;

    openDialogue([
      ["Streber", "Okay. Big mountain. Big cave. Nothing suspicious here."],
      ["???", "WHO DARES ENTER MY DOMAIN?"],
      ["Streber", "what the hell...?"],
      ["Streber", "Oh, you've GOT to be kidding me."],
      ["Dragon", "YOU HAVE DISTURBED MY SLUMBER, MORTAL."],
      ["Streber", "Technically, I was just passing through."],
      ["Dragon", "THEN YOU SHALL PASS THROUGH FIRE."],
      ["Streber", "I would really prefer a bridge."],
      ["Dragon", "PREPARE YOURSELF."],
      ["Streber", "Well. Happy birthday to me."]
    ]);
  }
}

function attackDragon() {
  if (!gameStarted || paused || currentArea !== "dragonArena" ||
      !dialogueBox.classList.contains("hidden") ||
      dragonDefeated || swordCooldown > 0) return;
  swordCooldown = 24;
  swordFrames = 10;
  const distance = Math.hypot(player.x - dragon.x, player.y - (dragon.y + 25));
  const facingDragon =
    (player.facing === "right" && dragon.x >= player.x) ||
    (player.facing === "left" && dragon.x <= player.x) ||
    (player.facing === "up" && dragon.y < player.y) ||
    (player.facing === "down" && dragon.y > player.y);
  if (distance < 190 && facingDragon) {
    dragon.hp = Math.max(0, dragon.hp - 12);
    if (dragon.hp <= 0) defeatDragon();
  }
}

function dodgeRoll() {
  if (!gameStarted || paused || currentArea !== "dragonArena" ||
      !dialogueBox.classList.contains("hidden") ||
      dragonDefeated || dodgeCooldown > 0) return;
  let dx = 0, dy = 0;
  if (keys["ArrowLeft"] || keys["a"] || keys["A"]) dx--;
  if (keys["ArrowRight"] || keys["d"] || keys["D"]) dx++;
  if (keys["ArrowUp"] || keys["w"] || keys["W"]) dy--;
  if (keys["ArrowDown"] || keys["s"] || keys["S"]) dy++;
  if (dx === 0 && dy === 0) {
    if (player.facing === "left") dx = -1;
    else if (player.facing === "right") dx = 1;
    else if (player.facing === "up") dy = -1;
    else dy = 1;
  }
  const length = Math.hypot(dx, dy) || 1;
  player.dodgeX = dx / length;
  player.dodgeY = dy / length;
  dodgeFrames = 10;
  dodgeCooldown = 48;
  invulnerableFrames = 16;
}

function updateDragonCombat() {
  if (swordCooldown > 0) swordCooldown--;
  if (dodgeCooldown > 0) dodgeCooldown--;
  if (dodgeFrames > 0) {
    player.x += (player.dodgeX || 0) * 9;
    player.y += (player.dodgeY || 0) * 9;
    dodgeFrames--;
  }
  if (invulnerableFrames > 0) invulnerableFrames--;
  player.x = Math.max(45, Math.min(W - 45, player.x));
  player.y = Math.max(80, Math.min(H - 45, player.y));

  if (dragonDefeated) {
    if (!victoryDialogueSeen && dialogueBox.classList.contains("hidden")) {
      victoryDialogueSeen = true;
      openDialogue([
        ["Dragon", "...I have been defeated."],
        ["Streber", "That was terrifying. I would like everyone to know that."],
        ["Dragon", "The passage beyond me is yours."],
        ["Streber", "Great. I shall be leaving immediately."],
        ["QUEST", "The way to the sea is open. Find the exit to the east."]
      ]);
    }
    if (player.x > W - 65 && player.y > 320) transitionToArea("sea");
    return;
  }

  if (dragonWarning) {
    dragonWarning.frames--;
    if (dragonWarning.frames <= 0) {
      const tx = dragonWarning.x, ty = dragonWarning.y;
      const sx = dragon.x - 35, sy = dragon.y + 10;
      const len = Math.hypot(tx - sx, ty - sy) || 1;
      fireballs.push({x:sx, y:sy, vx:(tx-sx)/len*5, vy:(ty-sy)/len*5, life:100});
      dragonWarning = null;
      dragonAttackTimer = 95;
    }
  } else {
    dragonAttackTimer--;
    if (dragonAttackTimer <= 0) dragonWarning = {x:player.x, y:player.y, frames:48};
  }

  for (let i = fireballs.length - 1; i >= 0; i--) {
    const f = fireballs[i];
    f.x += f.vx; f.y += f.vy; f.life--;
    if (invulnerableFrames <= 0 && Math.hypot(f.x-player.x, f.y-(player.y+10)) < 28) {
      playerHp = Math.max(0, playerHp - 20);
      fireballs.splice(i, 1);
      if (playerHp <= 0) {
        playerHp = playerMaxHp; player.x = 220; player.y = 350;
        fireballs = []; dragonWarning = null;
        openDialogue([
          ["Streber", "Ow. Okay. That did not go well."],
          ["Streber", "A second chance. Let's try that again."]
        ]);
      }
      continue;
    }
    if (f.life <= 0 || f.x < -30 || f.x > W+30 || f.y < -30 || f.y > H+30) fireballs.splice(i,1);
  }
}

function defeatDragon() {
  dragonDefeated = true;
  dragonWarning = null;
  fireballs = [];
  completeQuest("The dragon has been defeated!", "reachSea");
}

function drawCombatHUD() {
  const bar = (x,y,w,h,ratio,fill,label) => {
    drawPixelRect(x-3,y-3,w+6,h+18,"#201a20");
    drawPixelRect(x,y,w,h,"#5b3538");
    drawPixelRect(x,y,Math.max(0,w*ratio),h,fill);
    ctx.fillStyle="#f3e5c8"; ctx.font="bold 13px monospace";
    ctx.fillText(label,x,y-7);
  };
  bar(24,28,190,14,playerHp/playerMaxHp,"#79a66a","STREBER");
  if (!dragonDefeated) bar(W-244,28,210,14,dragon.hp/dragon.maxHp,"#d85b4c","MOUNTAIN DRAGON");
  else {
    ctx.fillStyle="#f3e5c8"; ctx.font="bold 14px monospace";
    ctx.fillText("EXIT EAST →",W-155,H-25);
  }
}

function drawCombatEffects() {
  if (dragonWarning) {
    ctx.strokeStyle = dragonWarning.frames % 12 < 6 ? "#ffd56a" : "#e56b45";
    ctx.lineWidth=4; ctx.beginPath();
    ctx.arc(dragonWarning.x,dragonWarning.y+10,25,0,Math.PI*2); ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(dragonWarning.x-12,dragonWarning.y-2);
    ctx.lineTo(dragonWarning.x+12,dragonWarning.y+22);
    ctx.moveTo(dragonWarning.x+12,dragonWarning.y-2);
    ctx.lineTo(dragonWarning.x-12,dragonWarning.y+22); ctx.stroke();
  }
  for (const f of fireballs) {
    drawPixelRect(f.x-10,f.y-10,20,20,"#a83e35");
    drawPixelRect(f.x-6,f.y-6,12,12,"#f3a34e");
    drawPixelRect(f.x-2,f.y-2,5,5,"#ffe8a0");
  }
  if (swordFrames > 0) {
    swordFrames--;
    ctx.strokeStyle="#e8e7d5"; ctx.lineWidth=6; ctx.beginPath();
    const angles={right:0,down:Math.PI/2,left:Math.PI,up:-Math.PI/2};
    ctx.arc(player.x,player.y+8,42,(angles[player.facing]||0)-0.65,(angles[player.facing]||0)+0.65);
    ctx.stroke();
  }
  if (dodgeFrames > 0) {
    drawPixelRect(player.x-23,player.y+4,10,20,"rgba(220,220,220,.45)");
    drawPixelRect(player.x-35,player.y+9,8,15,"rgba(220,220,220,.25)");
  }
}
function enterSea() {
  currentArea = "sea";
  player.x = 120;
  player.y = 360;
  player.facing = "right";
  clearKeys();
  setQuest("reachSea");
  openDialogue([
    ["Streber", "Salt air. Actual salt air."],
    ["Streber", "Right. Sea first. Existential crisis later."],
    ["Streber", "There! A ship. Hopefully the captain is normal." ]
  ]);
}

function drawSea() {
  drawPixelAtmosphere("sea");
  // Horizon islands, sun glitter and layered wave bands.
  drawPixelRect(285,165,155,55,"#4c7774"); drawPixelRect(310,145,88,30,"#5f8c7d");
  drawPixelRect(655,175,210,48,"#3b6b68"); drawPixelRect(700,150,120,28,"#5c8c7c");
  for(let i=0;i<26;i++){const x=(i*41+Math.floor(animationClock*(i%2?.18:-.12)))%W; const y=235+(i*19)%290; drawPixelRect(x,y,18+(i%4)*5,2,i%3===0?"#c5e2d3":"#5dabb7");}
  drawPixelRect(0, 230, W, 310, "#477d89");
  for (let i = 0; i < 16; i++) {
    const x = ((i * 79 + 25 + Math.floor(animationClock * (i % 2 ? 0.7 : -0.45))) % (W + 55) + (W + 55)) % (W + 55) - 25;
    const y = 260 + (i * 31) % 230;
    drawPixelRect(x, y, 48, 4, "#78a8a3");
    drawPixelRect(x + 13, y + 10, 24, 3, "#a4c6b8");
  }
  // Sandy landing and pier
  drawPixelRect(0, 205, 205, 335, "#b4a184");
  drawPixelRect(0, 188, 150, 32, "#d3bc91");
  drawPixelRect(125, 310, 190, 24, "#795941");
  for (let i = 0; i < 5; i++) drawPixelRect(145 + i * 38, 300, 12, 44, "#5a4032");
  // Little anchored pirate ship
  drawPixelRect(650, 335, 245, 62, "#53372e");
  drawPixelRect(680, 397, 185, 14, "#35272a");
  drawPixelRect(690, 323, 165, 16, "#9a6844");
  drawPixelRect(750, 195, 12, 140, "#69472f");
  drawPixelRect(790, 215, 7, 100, "#69472f");
  drawPixelRect(765, 205, 83, 94, "#ead9b8");
  drawPixelRect(704, 239, 50, 63, "#d5c19b");
  drawPixelRect(755, 193, 18, 14, "#b34d42");
  drawPixelRect(845, 219, 14, 80, "#b34d42");
  drawPixelRect(790, 320, 70, 15, "#6b4936");
  ctx.fillStyle = "#f2d69a"; ctx.font = "bold 18px monospace"; ctx.fillText("THE SEA", 30, 45);
  // A broad, clearly visible wooden gangplank connects the shore directly to the ship.
  drawPixelRect(165, 340, 555, 48, "#68472f");
  drawPixelRect(175, 345, 535, 8, "#b88753");
  drawPixelRect(175, 375, 535, 7, "#b88753");
  for (let x = 185; x < 715; x += 35) drawPixelRect(x, 340, 4, 48, "#4c352b");
  ctx.fillStyle = "#ead9b8"; ctx.font = "13px monospace"; ctx.fillText("THE MIGHTY PIRATE SHIP (PROBABLY)", 520, 475);
}

function enterShipDeck() {
  currentArea = "shipDeck";
  player.x = 150; player.y = 360; player.facing = "right";
  shipCaptain.x = 285; shipCaptain.y = 260;
  captainBriefed = false;
  redLeverPulled = false;
  redLeverWarned = false;
  sailingSequencePending = false;
  shipCrew[0].x = 390; shipCrew[0].y = 335;
  shipCrew[1].x = 625; shipCrew[1].y = 350;
  clearKeys();
  setQuest("talkCaptain");
}

function drawShipDeck() {
  const bob = Math.sin(shipRock) * 3;
  drawPixelAtmosphere("ship");
  // Ocean visible around the ship
  for (let i = 0; i < 18; i++) {
    const x = ((i * 71 + 18 + Math.floor(animationClock * (i % 2 ? 0.5 : -0.35))) % (W + 40) + (W + 40)) % (W + 40) - 20;
    const y = (i * 43 + Math.floor(shipRock * 12)) % H;
    drawPixelRect(x, y, 35, 4, "#5f9297");
  }
  // Ship hull/deck
  drawPixelRect(55, 115 + bob, 850, 345, "#54372f");
  drawPixelRect(70, 125 + bob, 820, 315, "#9a6844");
  drawPixelRect(82, 140 + bob, 795, 286, "#bd8b58");
  // Deck planks
  for (let y = 165; y < 425; y += 32) {
    drawPixelRect(90, y + bob, 775, 3, "#8d5d3c");
    for (let x = 110 + ((y / 32) % 2) * 55; x < 850; x += 110) drawPixelRect(x, y - 13 + bob, 3, 15, "#a9794c");
  }
  // Rails and posts
  drawPixelRect(70, 125 + bob, 820, 13, "#e0bd82");
  drawPixelRect(70, 125 + bob, 14, 305, "#e0bd82");
  drawPixelRect(876, 125 + bob, 14, 305, "#e0bd82");
  for (let x = 100; x < 875; x += 70) drawPixelRect(x, 115 + bob, 8, 30, "#6a4934");
  // Mast and sails
  drawPixelRect(465, 85 + bob, 18, 285, "#68452e");
  drawPixelRect(355, 105 + bob, 230, 12, "#68452e");
  drawPixelRect(375, 120 + bob, 185, 120, "#ead9b8");
  drawPixelRect(395, 135 + bob, 145, 90, "#f2e5c8");
  drawPixelRect(400, 145 + bob, 7, 70, "#d0b98f");
  drawPixelRect(445, 145 + bob, 7, 70, "#d0b98f");
  drawPixelRect(490, 145 + bob, 7, 70, "#d0b98f");
  drawPixelRect(535, 145 + bob, 7, 70, "#d0b98f");
  drawPixelRect(465, 80 + bob, 18, 14, "#b34d42");
  // Crates and barrel
  drawPixelRect(115, 270 + bob, 70, 65, "#765039");
  drawPixelRect(123, 278 + bob, 54, 8, "#b88753");
  drawPixelRect(205, 320 + bob, 44, 55, "#9b6b42");
  drawPixelRect(210, 326 + bob, 34, 5, "#d0b98f");
  // Ship's wheel at the helm
  drawPixelRect(765, 170 + bob, 42, 8, "#593a2c");
  drawPixelRect(782, 153 + bob, 8, 42, "#593a2c");
  drawPixelRect(770, 158 + bob, 32, 32, "#8e5a37");
  drawPixelRect(779, 167 + bob, 14, 14, "#d0b98f");
  ctx.fillStyle = "#ead9b8"; ctx.font = "bold 17px monospace"; ctx.fillText("THE MIGHTY PIRATE SHIP (PROBABLY)", 210, 48);
  ctx.font = "12px monospace"; ctx.fillText("CAPTAIN'S ORDERS: DO NOT TOUCH THE RED LEVER", 235, 505);
  // Red lever, clearly labelled as suspicious
  drawPixelRect(830, 265 + bob, 9, 38, "#7d342f");
  drawPixelRect(820, 260 + bob, 28, 9, "#b34d42");
}

function enterIsland() {
  currentArea = "island";
  player.x = 150; player.y = 365; player.facing = "right";
  islandExplored = false;
  islandHunt.footprints = false; islandHunt.bottle = false; islandHunt.chest = false; islandHunt.rewardFound = false; islandHunt.chantRead = false;
  islandAnkylo.x = 555; islandAnkylo.y = 365; islandAnkylo.bob = 0;
  clearKeys();
  setQuest("exploreIsland");
  openDialogue([
    ["Streber", "Land! Glorious, non-moving land."],
    ["Streber", "Captain said the island was east. So... east it is." ]
  ]);
}

function drawIsland() {
  drawPixelAtmosphere("island");
  // Sunlit cloud clusters and far turquoise lagoon.
  for(const [x,y] of [[75,88],[220,120],[520,75],[780,105]]){drawPixelRect(x,y,48,8,"#e8f0db");drawPixelRect(x+10,y-7,24,8,"#f7f1d8");drawPixelRect(x+25,y+7,30,5,"#d5e8d6");}
  drawPixelRect(0, 280, W, 260, "#cdb27c");
  drawPixelRect(0, 330, W, 210, "#d9c28b");
  drawPixelRect(0, 270, W, 22, "#ead9b8");
  // Tropical green interior
  drawPixelRect(530, 110, 430, 210, "#526b45");
  drawPixelRect(570, 145, 350, 150, "#6f8450");
  for (let i = 0; i < 7; i++) {
    const x = 570 + i * 55;
    drawPixelRect(x, 145 + (i % 3) * 20, 18, 70, "#68472f");
    drawPixelRect(x - 22, 125 + (i % 3) * 20, 60, 25, "#35583c");
    drawPixelRect(x - 13, 105 + (i % 3) * 20, 42, 22, "#477447");
  }
  // A winding path leading into the island
  drawPixelRect(300, 350, 270, 26, "#b99b66");
  drawPixelRect(430, 325, 28, 45, "#b99b66");
  drawPixelRect(455, 300, 100, 30, "#b99b66");
  // The footprints are the first discovery; each clue reveals the next.
  if (!islandHunt.footprints) {
    drawPixelRect(245, 410, 10, 5, "#6e5940"); drawPixelRect(263, 419, 10, 5, "#6e5940");
    drawPixelRect(280, 407, 10, 5, "#6e5940");
  }
  if (islandExplored) {
    if (islandHunt.footprints && !islandHunt.bottle) {
      drawPixelRect(198, 292, 13, 23, "#5b9da0"); drawPixelRect(201, 286, 7, 7, "#d8d7a0");
      drawPixelRect(201, 299, 7, 8, "#d7e6c7");
    }
    if (islandHunt.bottle && !islandHunt.chest) {
      drawPixelRect(758, 360, 44, 26, "#75472f"); drawPixelRect(758, 357, 44, 8, "#b8864f");
      drawPixelRect(777, 363, 7, 12, "#e6c45c");
    }
  }
  if (islandHunt.chantRead) {
    // A dark cave mouth opens in the cliffs once Streber reads the chant.
    drawPixelRect(875, 335, 45, 90, "#68472f");
    drawPixelRect(883, 344, 30, 81, "#211f2d");
    drawPixelRect(890, 352, 16, 10, "#b94d42");
  }
  ctx.fillStyle = "#f2d69a"; ctx.font = "bold 18px monospace"; ctx.fillText("THE ISLAND", 30, 45);
  if (islandHunt.footprints && !islandExplored) {
    ctx.fillStyle = "#d8d7a0"; ctx.font = "12px monospace"; ctx.fillText("something rustles nearby...", 360, 415);
  }
}
function enterUnderworld() {
  currentArea = "underworld";
  player.x = 150; player.y = 385; player.facing = "right";
  asmodeus.x = 690; asmodeus.y = 300; asmodeus.bob = 0;
  cerberus.x = 420; cerberus.y = 365; cerberus.bob = 0;
  underworldResidentsMet = { asmodeus: false, cerberus: false };
  sealedGateConversationDone = false;
  underworldTrialStarted = false;
  underworldGateOpen = false;
  underworldRuneProgress = 0;
  clearKeys();
  setQuest("meetUnderworldResidents");
  openDialogue([
    ["Streber", "Well. This is definitely not the island anymore."],
    ["Narrator", "The air smells faintly of brimstone, old books, and someone's burnt dinner."],
    ["Streber", "I should probably find whoever is in charge."]
  ]);
}

function drawUnderworld() {
  drawPixelAtmosphere("under");
  // Basalt columns and molten seams.
  for(let i=0;i<9;i++){const x=i*112+8;drawPixelRect(x,85,26,210,"#302638");drawPixelRect(x+6,92,5,185,"#4b3042");drawPixelRect(x+22,210,4,60,"#9d493f");}
  drawPixelRect(0, 300, W, 240, "#382b3b");
  drawPixelRect(35, 330, W - 70, 160, "#4b3544");
  // Glowing lava channels
  drawPixelRect(70, 425, 180, 13, "#b94d42");
  drawPixelRect(95, 438, 120, 6, "#ed9a54");
  drawPixelRect(530, 455, 220, 12, "#b94d42");
  drawPixelRect(600, 467, 110, 5, "#ed9a54");
  // Jagged cavern walls
  for (let i = 0; i < 10; i++) {
    const x = i * 98;
    drawPixelRect(x, 65 + (i % 3) * 18, 45, 120, "#302638");
    drawPixelRect(x + 12, 40 + (i % 3) * 18, 22, 65, "#443044");
  }
  // Distant sinister gate
  drawPixelRect(790, 275, 95, 150, "#211a27");
  drawPixelRect(802, 288, 71, 126, "#7a4a50");
  drawPixelRect(812, 298, 51, 116, "#302331");
  drawPixelRect(820, 320, 35, 10, "#d18a56");
  // The sealed gate becomes a trial with three ancient runes.
  if (underworldTrialStarted && !underworldGateOpen) {
    for (let i = 0; i < underworldRunes.length; i++) {
      const rune = underworldRunes[i];
      const lit = i < underworldRuneProgress;
      drawPixelRect(rune.x - 22, rune.y - 15, 44, 34, "#211a27");
      drawPixelRect(rune.x - 18, rune.y - 11, 36, 26, lit ? rune.color : "#62505f");
      drawPixelRect(rune.x - 12, rune.y - 5, 24, 14, lit ? "#fff0c2" : "#302331");
      ctx.fillStyle = lit ? "#211a27" : rune.color;
      ctx.font = "bold 9px monospace";
      ctx.textAlign = "center";
      ctx.fillText(rune.symbol, rune.x, rune.y + 31);
    }
  }
  if (underworldGateOpen) {
    drawPixelRect(802, 288, 71, 126, "#f0c879");
    drawPixelRect(814, 300, 47, 114, "#fff0c2");
    drawPixelRect(824, 315, 27, 99, "#d18a56");
  }
  // Sulfur lanterns
  for (const x of [130, 350, 590, 750]) {
    drawPixelRect(x, 245, 10, 40, "#68472f");
    drawPixelRect(x - 4, 232, 18, 17, "#e0a34f");
    drawPixelRect(x, 236, 10, 9, "#ffe0a0");
  }
  ctx.textAlign = "left";
  ctx.fillStyle = "#f2d69a"; ctx.font = "bold 18px monospace"; ctx.fillText("THE UNDERWORLD", 30, 45);
  ctx.font = "12px monospace"; ctx.fillText("PLEASE TAKE A NUMBER. THERE IS NO NUMBER SYSTEM.", 255, 505);
}

function enterUnderworldSanctum() {
  currentArea = "underworldSanctum";
  player.x = 130; player.y = 385; player.facing = "right";
  sanctumKeeper.x = 340; sanctumKeeper.y = 315; sanctumKeeper.bob = 0;
  memoryEmber.x = 660; memoryEmber.y = 330; memoryEmber.bob = 0;
  sanctumKeeperMet = false; emberOfMemoryFound = false; archiveNoteReceived = false; archiveEchoesFound = [false, false, false];
  archiveEchoes.forEach((echo, i) => { echo.x = [390, 565, 735][i]; echo.y = [205, 365, 220][i]; echo.bob = i; });
  clearKeys(); setQuest("enterUnderworldSanctum");
  openDialogue([
    ["Narrator", "Beyond the gate lies a vast, quiet archive carved into black stone. Little memories drift through glass jars like fireflies."],
    ["Streber", "I expected chains. Maybe screaming. This is... a library?"],
    ["Narrator", "Somewhere in the distance, a jar makes a tiny sound like a birthday candle being blown out."],
    ["Streber", "I suddenly have a bad feeling about the filing system."]
  ]);
}

function drawUnderworldSanctum() {
  drawPixelAtmosphere("archive");
  // Tall archive stacks, brass rails and blue memory lamps.
  for(let x=28;x<930;x+=105){drawPixelRect(x,70,68,300,"#29263c");drawPixelRect(x+7,82,54,8,"#8b6b57");for(let y=105;y<340;y+=33){drawPixelRect(x+8,y,50,4,"#6f5a60");drawPixelRect(x+12,y-13,8,13,["#6f91a7","#bd8c5d","#8d9c7d"][Math.floor(y/33)%3]);drawPixelRect(x+27,y-17,11,17,"#55445b");}}
  for(const [x,y] of [[120,185],[310,245],[610,170],[810,240]]){drawPixelRect(x,y,6,28,"#5ab4df");drawPixelRect(x-5,y-7,16,12,"#8be6ff");drawPixelRect(x-2,y-4,9,6,"#e3fbff");}
  drawPixelRect(0, 305, W, 235, "#382b3b");
  drawPixelRect(30, 325, W - 60, 165, "#443342");
  for (let row = 0; row < 3; row++) {
    const y = 115 + row * 92;
    drawPixelRect(70, y, 210, 12, "#79513f"); drawPixelRect(510, y, 245, 12, "#79513f");
    for (let i = 0; i < 8; i++) {
      const x1 = 82 + i * 23, x2 = 522 + i * 26;
      drawPixelRect(x1, y - 20, 12, 20, ["#8fb8dc", "#d18a56", "#b6a2cf", "#8fbca4"][i % 4]);
      drawPixelRect(x1 + 3, y - 25, 6, 5, "#f2d69a");
      drawPixelRect(x2, y - 18, 13, 18, ["#b6a2cf", "#8fbca4", "#d18a56", "#8fb8dc"][i % 4]);
      drawPixelRect(x2 + 3, y - 23, 7, 5, "#f2d69a");
    }
  }
  for (let i = 0; i < archiveEchoes.length; i++) {
    if (archiveEchoesFound[i]) continue;
    const echo = archiveEchoes[i], pulse = Math.sin(echo.bob + i) * 4;
    drawPixelRect(echo.x - 17, echo.y - 17 + pulse, 34, 34, "rgba(209,138,86,.35)");
    drawPixelRect(echo.x - 10, echo.y - 12 + pulse, 20, 24, ["#8fb8dc", "#ed9a54", "#8fbca4"][i]);
    drawPixelRect(echo.x - 5, echo.y - 7 + pulse, 10, 14, "#fff0c2");
    drawPixelRect(echo.x - 2, echo.y - 4 + pulse, 4, 5, "#ffffff");
  }
  drawPixelRect(850, 330, 70, 105, archiveNoteReceived ? "#b8864f" : "#211a27");
  drawPixelRect(860, 342, 50, 93, archiveNoteReceived ? "#fff0c2" : "#302331");
  ctx.fillStyle = "#f2d69a"; ctx.font = "bold 18px monospace"; ctx.fillText("THE ASHEN ARCHIVE", 30, 45);
  ctx.font = "12px monospace"; ctx.fillStyle = "#d8d7a0";
  ctx.fillText(archiveNoteReceived ? "A NOTE FROM FUNF. THE STAIRWAY IS AWAKE." : `MEMORY ECHOES: ${archiveEchoesFound.filter(Boolean).length}/3`, 210, 515);
}
function enterBirthdayRoom() {
  currentArea = "birthdayRoom";
  player.x = 480; player.y = 445; player.facing = "up";
  funf.x = 480; funf.y = 330;
  dino.x = 190; dino.y = 390;
  islandAnkylo.x = 190; islandAnkylo.y = 390;
  shipCaptain.x = 260; shipCaptain.y = 350;
  shipCrew[0].x = 320; shipCrew[0].y = 385;
  shipCrew[1].x = 380; shipCrew[1].y = 390;
  mountainWatcher.x = 690; mountainWatcher.y = 350;
  asmodeus.x = 790; asmodeus.y = 350;
  cerberus.x = 650; cerberus.y = 400;
  sanctumKeeper.x = 850; sanctumKeeper.y = 390;
  clearKeys();
  setQuest("birthdaySurprise");
  openDialogue([
    ["Narrator", "The stairway opens into a room full of warm lights, ribbons, and an absolutely enormous cake."],
    ["Streber", "...Why is there a banner?"],
    ["Funf", "No reason. Read it out loud."],
    ["Narrator", "HAPPY BIRTHDAY STREBER!"],
    ["Streber", "FUNF."],
    ["Funf", "HEHEHEHE. SURPRISE."],
    ["Funf", "Okay, okay. Before you accuse me of spending the entire budget on cake and suspiciously legal demonic party permits, I have a speech."],
    ["Funf", "I know I make fun of you. A lot. It is, unfortunately, one of my most consistent hobbies. But you are also my favourite person to be ridiculous with, and the world is brighter, weirder, and much more interesting because you're in it."],
    ["Funf", "I hope this next year gives you a thousand things to get excited about, new things to learn, and people who make you feel as loved as you make the people around you feel. And if things get difficult, I hope you remember you never have to figure everything out alone. I'll be right here: cheering for you, annoying you, and probably bringing a tiny dinosaur when appropriate."],
    ["Funf", "Thank you for being you, Streber. I'm so lucky I get to know you, grow with you, and make all these stupid little memories with you. You deserve so much gentleness and joy, today and always."],
    ["Funf", "happy birthday my love, i'll love you forever"]
  ]);
}

function drawBirthdayRoom() {
  drawPixelAtmosphere("party");
  // Warm party hall: brickwork, strings of lights and a checkered floor.
  for(let y=80;y<420;y+=28){for(let x=(y%56?0:28);x<W;x+=56){drawPixelRect(x,y,49,19,y%56?"#714858":"#80515b");drawPixelRect(x+4,y+4,3,3,"#b97673");}}
  for(let x=35;x<W;x+=65){const drop=90+(x%4)*11;drawPixelRect(x,60,3,drop,"#e0b77c");drawPixelRect(x-5,drop,13,11,["#f2d69a","#e99b73","#8fb8dc","#d98aa2"][Math.floor(x/65)%4]);drawPixelRect(x-2,drop+3,6,5,"#fff0c2");}
  drawPixelRect(0, 70, W, 390, "#65465a");
  drawPixelRect(0, 420, W, 120, "#b58a76");
  // Cozy windows and starry night outside.
  for (const x of [95, 790]) {
    drawPixelRect(x, 105, 105, 125, "#2d3e58");
    drawPixelRect(x + 10, 115, 85, 105, "#536a82");
    for (let i = 0; i < 7; i++) drawPixelRect(x + 15 + (i * 13) % 75, 120 + (i * 17) % 90, 4, 4, "#f4d58a");
    drawPixelRect(x + 49, 105, 7, 125, "#6e4a47");
    drawPixelRect(x, 160, 105, 6, "#6e4a47");
  }
  // Banner and bunting.
  drawPixelRect(180, 75, 600, 52, "#f0d7a2");
  drawPixelRect(188, 83, 584, 36, "#b94d65");
  ctx.fillStyle = "#fff0c2"; ctx.font = "bold 22px monospace"; ctx.textAlign = "center";
  ctx.fillText("HAPPY BIRTHDAY STREBER!", 480, 107);
  ctx.textAlign = "left";
  for (let i = 0; i < 13; i++) {
    const x = 105 + i * 58;
    drawPixelRect(x, 145, 16, 18, ["#ed9a54", "#8fb8dc", "#d98aa2", "#8fbca4"][i % 4]);
    drawPixelRect(x + 4, 163, 8, 7, "#ead9b8");
  }
  // Huge party table and cake.
  drawPixelRect(260, 285, 440, 105, "#68472f");
  drawPixelRect(275, 295, 410, 22, "#b88753");
  drawPixelRect(290, 390, 24, 72, "#68472f");
  drawPixelRect(646, 390, 24, 72, "#68472f");
  drawPixelRect(395, 220, 170, 65, "#fff0c2");
  drawPixelRect(405, 200, 150, 25, "#e8a4b2");
  drawPixelRect(420, 175, 120, 30, "#f6d4db");
  drawPixelRect(450, 150, 8, 27, "#f2d69a"); drawPixelRect(472, 145, 8, 32, "#f2d69a"); drawPixelRect(494, 150, 8, 27, "#f2d69a");
  const candleFlicker = Math.round(Math.sin(animationClock * 0.35) * 2);
  drawPixelRect(451, 140 - candleFlicker, 6, 8 + candleFlicker, "#ed9a54");
  drawPixelRect(473, 135 + candleFlicker, 6, 8 - candleFlicker, "#ed9a54");
  drawPixelRect(495, 140 - candleFlicker, 6, 8 + candleFlicker, "#ed9a54");
  // Soft pixel-glow blocks pulse around the birthday cake.
  if (Math.sin(animationClock * 0.12) > 0.1) {
    drawPixelRect(382, 165, 7, 7, "rgba(242,214,154,.55)");
    drawPixelRect(557, 183, 7, 7, "rgba(242,214,154,.55)");
  }
  // Gifts, streamers, and confetti.
  drawPixelRect(310, 255, 48, 35, "#8fb8dc"); drawPixelRect(329, 255, 8, 35, "#f2d69a"); drawPixelRect(310, 267, 48, 7, "#f2d69a");
  drawPixelRect(600, 258, 44, 30, "#8fbca4"); drawPixelRect(618, 258, 7, 30, "#f2d69a");
  for (let i = 0; i < 24; i++) drawPixelRect(55 + (i * 83) % 830, 185 + (i * 47) % 275, 5, 5, ["#f2d69a", "#d98aa2", "#8fb8dc", "#8fbca4"][i % 4]);
  // All the quest friends have come to the party (dragon explicitly absent).
  drawFunf();
  drawAnkylosaurus(islandAnkylo);
  drawCharacter(shipCaptain, false);
  drawCharacter(shipCrew[0], false); drawCharacter(shipCrew[1], false);
  drawCharacter(mountainWatcher, false);
  drawCharacter(asmodeus, false);
  drawCharacter(sanctumKeeper, false);
  // Cerberus: one chunky body, three heads, and tiny party hats.
  const cx = cerberus.x, cy = cerberus.y;
  drawPixelRect(cx - 28, cy, 58, 24, "#55404b");
  for (let i = 0; i < 3; i++) {
    const hx = cx - 20 + i * 20;
    drawPixelRect(hx - 7, cy - 21, 18, 17, "#6e555a");
    drawPixelRect(hx - 5, cy - 28, 13, 7, "#d98aa2");
    drawPixelRect(hx - 1, cy - 35, 5, 8, "#f2d69a");
    drawPixelRect(hx - 3, cy - 15, 3, 3, "#f2b34f"); drawPixelRect(hx + 4, cy - 15, 3, 3, "#f2b34f");
  }
  ctx.fillStyle = "#fff0c2"; ctx.font = "12px monospace"; ctx.textAlign = "center";
  ctx.fillText("CAKE. FRIENDS. QUESTIONABLE DEMONIC PERMITS.", 480, 500);
  ctx.textAlign = "left";
}
function enterMistboundPeaks() {
  player.x = 180;
  player.y = 390;
  player.facing = "right";

  setQuest("mistboundPeaks");

  clearKeys();
}

function drawCharacter(c, isPlayer = false) {
  const moving = isPlayer && (
    keys["ArrowDown"] || keys["ArrowUp"] || keys["ArrowLeft"] || keys["ArrowRight"] ||
    keys["w"] || keys["a"] || keys["s"] || keys["d"] ||
    keys["W"] || keys["A"] || keys["S"] || keys["D"]
  );
  const phase = moving ? Math.sin(player.bob * 1.35) : Math.sin(animationClock * 0.07 + c.x * 0.03);
  const idleBob = moving ? 0 : Math.round(Math.sin(animationClock * 0.055 + c.x * 0.02) * 0.6);
  const x = c.x;
  const y = c.y + (isPlayer && moving ? Math.sin(player.bob) * 0.8 : idleBob);
  const legSwing = moving ? Math.round(phase * 1.6) : 0;
  const armSwing = moving ? Math.round(phase * 1.2) : Math.round(Math.sin(animationClock * 0.06 + c.y * 0.02) * 0.5);

  // Shadow subtly tightens as the character bobs upward.
  drawPixelRect(x - 18, c.y + 28, 36, 7, "rgba(31,25,26,.35)");

  // Give each returning friend a distinct silhouette and signature palette.
  const isFunf = c === funf;
  const isWatcher = c === mountainWatcher;
  const isDemon = c === asmodeus;
  const isKeeper = c === sanctumKeeper;
  const isCaptain = c === shipCaptain;
  const isCrew = shipCrew.includes(c);
  const coat = isPlayer ? "#4b4b55" : isFunf ? "#b85e78" : isWatcher ? "#557b8c" : isDemon ? "#49334f" : isKeeper ? "#b5a16c" : isCaptain ? "#8b4a3c" : isCrew ? (c.name === "Milo" ? "#527c72" : "#c18b4e") : "#684b47";
  const sleeve = isPlayer ? "#343741" : isFunf ? "#873f60" : isWatcher ? "#354f64" : isDemon ? "#302333" : isKeeper ? "#827044" : isCaptain ? "#5f302f" : isCrew ? "#3d5a53" : "#513d3b";
  // Layered cloak silhouette and tailored outfit instead of a flat block torso.
  drawPixelRect(x - 20, y + 1, 40, 27, sleeve);
  drawPixelRect(x - 17, y + 4, 34, 26, coat);
  drawPixelRect(x - 20, y + 17, 40, 13, coat);
  drawPixelRect(x - 16, y + 25, 32, 7, sleeve);
  drawPixelRect(x - 22, y + 9 + armSwing, 9, 20, sleeve);
  drawPixelRect(x + 13, y + 9 - armSwing, 9, 20, sleeve);
  drawPixelRect(x - 5, y + 5, 3, 23, isFunf ? "#f0bd82" : isDemon ? "#d18a56" : "#b9a27a");
  drawPixelRect(x + 3, y + 6, 3, 20, isFunf ? "#f0bd82" : "#b9a27a");
  drawPixelRect(x - 17, y + 30, 34, 4, "#211a20");

  // Alternating legs give the player a readable little walk cycle.
  drawPixelRect(x - 11, y + 28 + legSwing, 8, 15, "#332b2d");
  drawPixelRect(x + 4, y + 28 - legSwing, 8, 15, "#332b2d");
  drawPixelRect(x - 13, y + 40 + legSwing, 11, 5, "#201a1c");
  drawPixelRect(x + 3, y + 40 - legSwing, 11, 5, "#201a1c");

  // Head, hair, and face
  drawPixelRect(x - 14, y - 25, 28, 28, isDemon ? "#a85e61" : isKeeper ? "#d5b58b" : "#c88f6e");
  const hair = isPlayer ? "#382a27" : isFunf ? "#342638" : isWatcher ? "#c4cbd0" : isDemon ? "#251d31" : isKeeper ? "#ded6c0" : isCaptain ? "#34252b" : isCrew ? (c.name === "Milo" ? "#3a2924" : "#d5b77b") : "#51382e";
  drawPixelRect(x - 18, y - 31, 36, 12, hair);
  drawPixelRect(x - 14, y - 36, 9, 9, hair);
  drawPixelRect(x - 3, y - 39, 11, 12, hair);
  drawPixelRect(x + 8, y - 33, 10, 10, hair);
  // Uneven pixel locks, side fringe and face highlights create a less uniform silhouette.
  drawPixelRect(x-19,y-24,7,15,hair); drawPixelRect(x+12,y-25,7,13,hair);
  drawPixelRect(x-10,y-38,5,5,isFunf?"#b85e78":isPlayer?"#755044":"#92796a");
  drawPixelRect(x+1,y-34,4,4,isFunf?"#b85e78":isPlayer?"#755044":"#92796a");
  if (isWatcher) { drawPixelRect(x - 20, y - 21, 40, 5, "#d2d7d8"); drawPixelRect(x - 17, y - 16, 34, 4, "#d2d7d8"); }
  if (isDemon) { drawPixelRect(x - 15, y - 36, 7, 14, "#6e4c79"); drawPixelRect(x + 8, y - 36, 7, 14, "#6e4c79"); drawPixelRect(x - 13, y - 13, 5, 3, "#f2b34f"); drawPixelRect(x + 6, y - 13, 5, 3, "#f2b34f"); }
  if (isKeeper) { drawPixelRect(x - 19, y - 42, 38, 9, "#d8c99c"); drawPixelRect(x - 14, y - 48, 28, 8, "#d8c99c"); }
  if (isCaptain) { drawPixelRect(x - 21, y - 38, 42, 8, "#30232b"); drawPixelRect(x - 12, y - 45, 25, 8, "#30232b"); drawPixelRect(x + 13, y - 25, 8, 14, "#d8d0c3"); }
  if (isCrew && c.name === "Pip") { drawPixelRect(x - 17, y - 41, 34, 8, "#ead9b8"); drawPixelRect(x - 9, y - 46, 18, 6, "#ead9b8"); }
  if (isFunf) { drawPixelRect(x - 18, y - 29, 36, 5, "#d98aa2"); drawPixelRect(x + 10, y - 29, 8, 8, "#d98aa2"); }
  drawPixelRect(x - 7, y - 16, 3, 3, "#20191b");
  drawPixelRect(x + 5, y - 16, 3, 3, "#20191b");
  drawPixelRect(x - 3, y - 7, 8, 3, "#7b463f");

  // Sword tilts a pixel during the walk, instead of being perfectly rigid.
  drawPixelRect(x + 17, y + 1 + (moving ? Math.round(phase * 2) : 0), 5, 34, "#b9c2c2");
  drawPixelRect(x + 12, y + armSwing, 15, 4, "#9b6a42");
  drawPixelRect(x + 18, y + 35, 6, 9, "#5a3b2e");
}

function drawInteractionPrompt() {
  const hint = getInteractionHint();

  if (!hint) return;

  const x = player.x;
  const y = player.y - 58;

  ctx.font = "bold 13px monospace";
  ctx.textAlign = "center";

  const padding = 10;
  const textWidth = ctx.measureText(hint).width;

  drawPixelRect(
    x - textWidth / 2 - padding + 3,
    y - 10,
    textWidth + padding * 2,
    22,
    "rgba(20,16,18,.45)"
  );

  drawPixelRect(
    x - textWidth / 2 - padding,
    y - 13,
    textWidth + padding * 2,
    22,
    "#ead9b8"
  );

  ctx.fillStyle = "#302329";
  ctx.fillText(hint, x, y + 2);
  ctx.textAlign = "left";
}

function drawCanvasDialogue() {
  if (dialogueBox.classList.contains("hidden")) return;
  if (!dialogueLines.length) return;

  const panelX = 35;
  const panelY = H - 145;
  const panelW = W - 70;
  const panelH = 115;

  // Shadow
  drawPixelRect(
    panelX + 5,
    panelY + 5,
    panelW,
    panelH,
    "rgba(0,0,0,.5)"
  );

  // Main panel
  drawPixelRect(
    panelX,
    panelY,
    panelW,
    panelH,
    "#302329"
  );

  // Inner parchment border
  drawPixelRect(
    panelX + 5,
    panelY + 5,
    panelW - 10,
    panelH - 10,
    "#ead9b8"
  );

  // Dark text area
  drawPixelRect(
    panelX + 9,
    panelY + 9,
    panelW - 18,
    panelH - 18,
    "#302329"
  );

  // Speaker name
  ctx.fillStyle = "#e8a4b2";
  ctx.font = "bold 17px monospace";
  ctx.textAlign = "left";

  ctx.fillText(
    speakerEl.textContent,
    panelX + 24,
    panelY + 34
  );

  // Dialogue text
  ctx.fillStyle = "#fff0c2";
  ctx.font = "15px monospace";

  const words = dialogueTextEl.textContent.split(" ");
  const maxWidth = panelW - 55;

  let line = "";
  let lineY = panelY + 62;

  for (const word of words) {
    const testLine = line + word + " ";

    if (ctx.measureText(testLine).width > maxWidth) {
      ctx.fillText(line, panelX + 24, lineY);
      line = word + " ";
      lineY += 20;
    } else {
      line = testLine;
    }
  }

  if (line) {
    ctx.fillText(line, panelX + 24, lineY);
  }

  // Next prompt
  ctx.fillStyle = "#e8a4b2";
  ctx.font = "bold 12px monospace";
  ctx.textAlign = "right";

  ctx.fillText(
    "TAP TO CONTINUE  ▼",
    panelX + panelW - 20,
    panelY + panelH - 16
  );

  ctx.textAlign = "left";
}

function draw() {
  ctx.clearRect(0, 0, W, H);

  // HOME CAVE
  if (currentArea === "cave") {
    drawCave();
    drawAnkylosaurus();
    drawFunf();

    // Little pixel stars around the cave
    drawPixelRect(320, 90, 4, 4, "#e8c978");
    drawPixelRect(680, 250, 3, 3, "#e8c978");
    drawPixelRect(860, 110, 4, 4, "#e8c978");
  }

  // MISTBOUND PEAKS
  if (currentArea === "peaks") {
    drawMistboundPeaks();
    drawMountainWatcher();
  }

  // DRAGON'S LAIR
  if (currentArea === "dragonArena") {
    drawDragonArena();
    if (!dragonDefeated) drawDragon();
    drawCombatEffects();
    drawCombatHUD();
  }
  if (currentArea === "sea") drawSea();
  if (currentArea === "shipDeck") {
    drawShipDeck();
    // Draw the captain and crew on top of the deck, with tiny pirate hats.
    drawCharacter(shipCaptain, false);
    drawPixelRect(shipCaptain.x - 18, shipCaptain.y - 35 + Math.sin(shipCaptain.bob) * 2, 36, 7, "#302329");
    drawPixelRect(shipCaptain.x - 10, shipCaptain.y - 43 + Math.sin(shipCaptain.bob) * 2, 20, 10, "#b34d42");
    for (const crewmate of shipCrew) {
      drawCharacter(crewmate, false);
      const cy = crewmate.y + Math.sin(crewmate.bob) * 2;
      drawPixelRect(crewmate.x - 15, cy - 35, 30, 6, "#302329");
      drawPixelRect(crewmate.x - 8, cy - 42, 16, 9, "#d0b98f");
    }
    // The infamous lever is easier to spot when it hasn't been pulled yet.
    if (!redLeverPulled) {
      ctx.fillStyle = "#f2d69a"; ctx.font = "10px monospace"; ctx.fillText("DO NOT PULL", redLever.x - 38, redLever.y + 30);
    }
  }
  if (currentArea === "island") {
    drawIsland();
    if (islandExplored) drawAnkylosaurus(islandAnkylo);
  }
  if (currentArea === "birthdayRoom") {
    drawBirthdayRoom();
  }
  if (currentArea === "underworldSanctum") {
    drawUnderworldSanctum();
    drawCharacter(sanctumKeeper, false);
    drawPixelRect(sanctumKeeper.x - 21, sanctumKeeper.y + 5, 42, 30, "#302638");
    drawPixelRect(sanctumKeeper.x - 14, sanctumKeeper.y - 18, 28, 8, "#d8d0c3");
    drawPixelRect(sanctumKeeper.x - 11, sanctumKeeper.y - 15, 7, 5, "#211a27");
    drawPixelRect(sanctumKeeper.x + 4, sanctumKeeper.y - 15, 7, 5, "#211a27");
  }
  if (currentArea === "underworld") {
    drawUnderworld();
    drawCharacter(asmodeus, false);
    // Cerberus is a three-headed hellhound, not a human-shaped character.
    const cx = cerberus.x, cy = cerberus.y + Math.sin(cerberus.bob) * 1.5;
    // Shadow and chunky four-legged body
    drawPixelRect(cx - 34, cy + 13, 70, 8, "#1a1721");
    drawPixelRect(cx - 29, cy - 5, 58, 25, "#55404b");
    drawPixelRect(cx - 24, cy + 16, 10, 17, "#55404b");
    drawPixelRect(cx - 3, cy + 16, 10, 17, "#55404b");
    drawPixelRect(cx + 17, cy + 16, 10, 17, "#55404b");
    // Three necks and broad canine heads, each with glowing eyes and muzzle
    for (let i = 0; i < 3; i++) {
      const hx = cx - 22 + i * 22;
      drawPixelRect(hx - 5, cy - 23, 13, 23, "#55404b");
      drawPixelRect(hx - 10, cy - 37, 21, 17, "#6e555a");
      drawPixelRect(hx - 9, cy - 42, 6, 8, "#6e555a");
      drawPixelRect(hx + 3, cy - 42, 6, 8, "#6e555a");
      drawPixelRect(hx - 6, cy - 31, 4, 4, "#f2b34f");
      drawPixelRect(hx + 2, cy - 31, 4, 4, "#f2b34f");
      drawPixelRect(hx - 4, cy - 23, 11, 6, "#b98b83");
      drawPixelRect(hx + 1, cy - 21, 3, 3, "#211a27");
    }
    // Spiky tail
    drawPixelRect(cx + 27, cy + 1, 15, 5, "#55404b");
    drawPixelRect(cx + 39, cy - 5, 7, 8, "#b94d42");
    // Asmodeus gets an unnecessarily dramatic crown.
    drawPixelRect(asmodeus.x - 17, asmodeus.y - 43 + Math.sin(asmodeus.bob) * 2, 34, 7, "#d18a56");
    drawPixelRect(asmodeus.x - 12, asmodeus.y - 52 + Math.sin(asmodeus.bob) * 2, 7, 10, "#d18a56");
    drawPixelRect(asmodeus.x + 5, asmodeus.y - 52 + Math.sin(asmodeus.bob) * 2, 7, 10, "#d18a56");
  }

  // Streber appears in every area
  drawCharacter(player, true);

  // Show appropriate interaction prompt
  drawInteractionPrompt();
  drawCanvasDialogue();
}

function drawFunf() {
  const x = funf.x;
  const bob = Math.round(
    Math.sin(animationClock * 0.055 + x * 0.02) * 1.3
  );
  const y = funf.y + bob;

  const sway = Math.round(
    Math.sin(animationClock * 0.07) * 1.5
  );

  // Shadow
  drawPixelRect(
    x - 19, funf.y + 28, 38, 7,
    "rgba(31,25,26,.35)"
  );

  // Hair behind the body
  drawPixelRect(x - 17, y - 31, 34, 37, "#51332f");
  drawPixelRect(x - 20, y - 23, 8, 28, "#51332f");
  drawPixelRect(x + 12, y - 22, 9, 30, "#51332f");

  // Dress / tunic
  drawPixelRect(x - 15, y + 1, 30, 19, "#d98aa2");
  drawPixelRect(x - 19, y + 5, 38, 13, "#e8a4b2");

  // Skirt shape
  drawPixelRect(x - 19, y + 16, 38, 14, "#b95f83");
  drawPixelRect(x - 23, y + 20, 46, 5, "#d98aa2");

  // Sleeves
  drawPixelRect(x - 23, y + 5, 9, 18, "#d98aa2");
  drawPixelRect(x + 14, y + 5, 9, 18, "#d98aa2");

  // Little hands
  drawPixelRect(x - 22, y + 21, 7, 6, "#c88f6e");
  drawPixelRect(x + 15, y + 21, 7, 6, "#c88f6e");

  // Legs
  drawPixelRect(x - 11, y + 29, 8, 14, "#c88f6e");
  drawPixelRect(x + 4, y + 29, 8, 14, "#c88f6e");

  // Shoes
  drawPixelRect(x - 14, y + 40, 12, 5, "#51332f");
  drawPixelRect(x + 3, y + 40, 12, 5, "#51332f");

  // Face
  drawPixelRect(x - 14, y - 25, 28, 28, "#c88f6e");

  // Long hair framing the face
  drawPixelRect(x - 18, y - 31, 36, 11, "#51332f");
  drawPixelRect(x - 18, y - 25, 8, 23, "#51332f");
  drawPixelRect(x + 10, y - 25, 8, 23, "#51332f");

  // Fringe
  drawPixelRect(x - 12, y - 23, 10, 7, "#51332f");
  drawPixelRect(x + 1, y - 25, 11, 8, "#51332f");

  // Hair bow
  drawPixelRect(x + 13, y - 33, 8, 7, "#d98aa2");
  drawPixelRect(x + 20, y - 31, 6, 6, "#e8a4b2");
  drawPixelRect(x + 17, y - 29, 4, 4, "#f2d69a");

  // Eyes
  drawPixelRect(x - 7, y - 15, 3, 3, "#20191b");
  drawPixelRect(x + 5, y - 15, 3, 3, "#20191b");

  // Small smile
  drawPixelRect(x - 3, y - 7, 7, 2, "#7b463f");

  // A little dress detail
  drawPixelRect(x - 3, y + 9, 6, 6, "#f2d69a");

  // Tiny hair highlight
  drawPixelRect(x - 11 + sway, y - 29, 5, 3, "#795047");
}

/* -------------------------
   MAIN LOOP
------------------------- */

function gameLoop() {
  animationClock += 1;
  if (!gameStarted) {
    animationFrame = null;
    return;
  }

  update();
  draw();

  animationFrame = requestAnimationFrame(gameLoop);
}

draw();
