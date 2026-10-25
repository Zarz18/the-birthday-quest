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

const areaTransitionName = document.getElementById("area-transition-name");

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

const mobileActionDock = document.createElement("div");
mobileActionDock.id = "mobile-action-controls";
mobileActionDock.style.cssText = "position:absolute;right:12px;bottom:14px;display:flex;flex-direction:column;gap:6px;align-items:flex-end;z-index:20;";

const makeTouchAction = (id, label) => {
  let button = document.getElementById(id);
  if (!button) {
    button = document.createElement("button");
    button.id = id;
    button.type = "button";
    button.textContent = label;
    button.style.cssText = "min-width:54px;min-height:44px;padding:6px 9px;border:2px solid #24191b;background:rgba(226,191,136,.92);color:#24191b;font:bold 12px monospace;touch-action:manipulation;box-shadow:3px 3px 0 #24191b;";
    mobileActionDock.appendChild(button);
  }
  return button;
};

const mobileInteractButton = makeTouchAction("mobile-interact", "E / TALK");
const mobileAttackButton = makeTouchAction("mobile-attack", "ATTACK");
const mobileDodgeButton = makeTouchAction("mobile-dodge", "DODGE");
const mobilePauseButton = makeTouchAction("mobile-pause", "PAUSE");
const gameStage = canvas.parentElement;
if (gameStage && !document.getElementById("mobile-action-controls")) gameStage.appendChild(mobileActionDock);

const W = canvas.width;
const H = canvas.height;

const keys = {};

let gameStarted = false;
let paused = false;
let dialogueLines = [];
let dialogueIndex = 0;
let nightLevel = 0;
let hasTalkedToFunf = false;
let animationFrame = null;
let animationClock = 0;

// -------------------------
// IMAGE ASSET LOADER SYSTEM
// -------------------------

const images = {};
const assetList = {
  caveBg: "assets/backgrounds/home_cave.png",
  peaksBg: "assets/backgrounds/mistbound_peaks.png",
  dragonBg: "assets/backgrounds/dragons_lair.png",
  seaBg: "assets/backgrounds/path_to_sea.png",
  shipBg: "assets/backgrounds/pirate_ship.png",
  islandBg: "assets/backgrounds/mysterious_island.png",
  underworldBg: "assets/backgrounds/underworld.png",
  archiveBg: "assets/backgrounds/ashen_archive.png",
  birthdayBg: "assets/backgrounds/birthday_room.png",
  
  streber: "assets/characters/streber.png",
  funf: "assets/characters/funf.png",
  ankylo: "assets/characters/ankylo.png",
  watcher: "assets/characters/mountain_watcher.png",
  dragonSprite: "assets/characters/dragon.png",
  captain: "assets/characters/captain.png",
  asmodeus: "assets/characters/asmodeus.png",
  cerberus: "assets/characters/cerberus.png",
  keeper: "assets/characters/archive_keeper.png"
};

let loadedCount = 0;
let assetsLoaded = false;
const totalAssets = Object.keys(assetList).length;

function loadGameAssets(onReady) {
  for (const [key, src] of Object.entries(assetList)) {
    const img = new Image();
    img.src = src;
    img.onload = () => {
      loadedCount++;
      if (loadedCount === totalAssets) {
        assetsLoaded = true;
        onReady();
      }
    };
    img.onerror = () => {
      // Fallback in case an asset image file is missing yet
      loadedCount++;
      console.warn("Asset missing or failed to load: " + src);
      if (loadedCount === totalAssets) {
        assetsLoaded = true;
        onReady();
      }
    };
    images[key] = img;
  }
}

// Safely draw image or fallback to a blank placeholder if asset isn't uploaded yet
function drawAssetOrDefault(imgKey, x, y, w, h, fallbackColor) {
  const img = images[imgKey];
  if (img && img.complete && img.naturalWidth !== 0) {
    ctx.drawImage(img, x, y, w, h);
  } else {
    ctx.fillStyle = fallbackColor || "#302329";
    ctx.fillRect(x, y, w, h);
  }
}

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

const player = { x: 450, y: 320, speed: 3.1, facing: "down", bob: 0 };
const funf = { x: 690, y: 285 };
const dino = { x: 555, y: 365, bob: 0 };
const mountainWatcher = { x: 690, y: 345, bob: 0 };
const dragon = { x: 680, y: 235, bob: 0, hp: 100, maxHp: 100 };

let dragonIntroSeen = false;
let playerHp = 100;
const playerMaxHp = 100;
let swordCooldown = 0, dodgeCooldown = 0, dodgeFrames = 0;
let invulnerableFrames = 0, swordFrames = 0;
let fireballs = [], dragonAttackTimer = 100, dragonWarning = null;
let dragonDefeated = false, victoryDialogueSeen = false;

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
const islandHunt = { footprints: false, bottle: false, chest: false, rewardFound: false, chantRead: false };
const islandClues = {
  footprints: { x: 265, y: 415 },
  bottle: { x: 205, y: 305 },
  chest: { x: 780, y: 375 }
};
const asmodeus = { x: 690, y: 300, bob: 0 };
const cerberus = { x: 420, y: 365, bob: 0 };
let underworldResidentsMet = { asmodeus: false, cerberus: false };
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
const archiveEchoes = [{x: 390, y: 205, bob: 0}, {x: 565, y: 365, bob: 1}, {x: 735, y: 220, bob: 2}];
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
    if (area === "peaks") enterMistboundPeaks();
    if (area === "dragonArena") enterDragonArena();
    if (area === "sea") enterSea();
    if (area === "shipDeck") enterShipDeck();
    if (area === "island") enterIsland();
    if (area === "underworld") enterUnderworld();
    if (area === "underworldSanctum") enterUnderworldSanctum();
    if (area === "birthdayRoom") enterBirthdayRoom();
    if (area === "cave" && pendingSurfaceReturn === false) {
      currentArea = "cave";
      player.x = 820; player.y = 300; player.facing = "left";
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
    completeQuest("You explored the cave!", "leaveCave");
  }
}

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
  nightAlert.classList.add("hidden");
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
  if (!nightAlert.classList.contains("hidden")) return;

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
mobilePauseButton.addEventListener("click", openPause);
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

window.addEventListener("keydown", (e) => {
  const key = e.key;
  if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", " "].includes(key)) {
    e.preventDefault();
  }

  if (key === "Escape" || key.toLowerCase() === "p") {
    if (!manualPanel.classList.contains("hidden") || !mapPanel.classList.contains("hidden")) {
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

document.querySelectorAll("#touch-controls button[data-key]").forEach(btn => {
  const key = btn.dataset.key;
  const press = (e) => { e.preventDefault(); keys[key] = true; };
  const release = (e) => { e.preventDefault(); keys[key] = false; };
  btn.addEventListener("pointerdown", press);
  btn.addEventListener("pointerup", release);
  btn.addEventListener("pointercancel", release);
  btn.addEventListener("pointerleave", release);
});

mobileInteractButton.addEventListener("click", interact);
mobileAttackButton.addEventListener("click", attackDragon);
mobileDodgeButton.addEventListener("click", dodgeRoll);

dialogueNext.addEventListener("click", advanceDialogue);

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

restButton.addEventListener("click", () => {
  nightAlert.classList.add("hidden");
  nightLevel = 0;
  player.x = 450;
  player.y = 320;
  setQuest("QUEST: Explore the cave");
  
  openDialogue([
    ["Funf", "Guten nacht, nerd. You finally listened."],
    ["Funf", "Go on, Get your rest."],
    ["Streber", "Guten nacht you menace, I'll get my rest i swear."] 
  ]);
});

function near(a, b, distance = 70) {
  return Math.hypot(a.x - b.x, a.y - b.y) < distance;
}

function islandHuntComplete() {
  return islandHunt.footprints && islandHunt.bottle && islandHunt.chest;
}

function checkIslandHuntProgress() {
  if (islandHuntComplete() && currentQuest !== "findUnderworld" && currentQuest !== "meetUnderworldResidents") {
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
          ["Memory Echo", "The Mistbound Peaks shimmer into view. The Mountain Watcher stands beside Streber in the snow, pretending not to worry."],
          ["Memory Echo", "The pirate ship rocks beneath a bright blue sky. Someone remembers the extremely suspicious red lever."],
          ["Memory Echo", "A tiny ankylosaurus waddles out from behind a rock. The whole world feels gentle for a moment."]
        ];
        memories[i] = ["Memory Echo", memories[i][1]];
        memories.push(["Streber", `Memory echo ${i + 1} of 3 secured. I am, apparently, a librarian now.`]);
        if (archiveEchoesFound.every(Boolean)) memories.push(["Narrator", "The three echoes drift together, forming a little golden envelope."]);
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
        ["Funf (in the note)", "Dear nerd: being friends with Asmodeus has perks. He let me use his archive for my little quest. Head on home. —Funf"],
        ["Archive Keeper", "The stairway will take you where you need to go."],
        ["Streber", "That note has made me significantly more suspicious."]
      ]);
      return;
    }
    if (archiveNoteReceived && player.x > W - 95 && player.y > 320) {
      pendingSurfaceReturn = true;
      openDialogue([
        ["Narrator", "The stairway glows, and the note from Funf warms in your pocket."],
        ["Streber", "Right. Homeward."]
      ]);
      return;
    }
  }

  if (currentArea === "birthdayRoom" && near(player, funf, 100)) {
    openDialogue([
      ["Funf", "SURPRISE, NERD!! HAPPY BIRTHDAY!!"],
      ["Streber", "You got ALL of them here?"],
      ["Funf", "Obviously. I have connections. Some of them are legally questionable."],
      ["Asmodeus", "I PROVIDED A VENUE. I WILL NOT BE EXPECTED TO SOCIALIZE."],
      ["Cerberus", "*all three heads are wearing tiny party hats*"],
      ["Streber", "...You made me an entire quest."],
      ["Funf", "Yeah. Because you're my favourite nerd. Happy birthday. <3"]
    ]);
    return;
  }

  if (currentArea === "underworld") {
    if (!underworldResidentsMet.asmodeus && near(player, asmodeus, 85)) {
      underworldResidentsMet.asmodeus = true;
      openDialogue([
        ["Asmodeus", "WHO DARES ENTER MY—"],
        ["Streber", "Sorry, is this the queue for the Underworld?"],
        ["Asmodeus", "...What?"],
        ["Streber", "There was a map. It was mostly useless."]
      ]);
      if (underworldResidentsMet.cerberus) completeQuest("You have met the Underworld's very welcoming residents.", "meetUnderworldResidents");
      return;
    }
    if (!underworldResidentsMet.cerberus && near(player, cerberus, 85)) {
      underworldResidentsMet.cerberus = true;
      openDialogue([
        ["Cerberus", "*three heads bark at once*"],
        ["Streber", "Hello to all three of you."],
        ["Narrator", "The middle head has decided you are acceptable."]
      ]);
      if (underworldResidentsMet.asmodeus) completeQuest("You have met the Underworld's very welcoming residents.", "meetUnderworldResidents");
      return;
    }
    if (underworldResidentsMet.asmodeus && underworldResidentsMet.cerberus && near(player, {x: 825, y: 390}, 75) && !underworldGateOpen) {
      if (!sealedGateConversationDone) {
        sealedGateConversationDone = true;
        openDialogue([
          ["Streber", "A huge sealed gate. Of course."],
          ["Asmodeus", "Beyond that gate lies a trial no mortal has ever—"],
          ["Streber", "Can I open it? No? Then why are you telling me?"],
          ["Asmodeus", "I AM BUILDING ATMOSPHERE."]
        ]);
        return;
      }
      if (!underworldTrialStarted) {
        underworldTrialStarted = true;
        setQuest("underworldTrial");
        openDialogue([
          ["Asmodeus", "Very well. Three riddles, three runes. Solve them, and the gate may open."],
          ["Asmodeus", "First: I rule borrowed light. Second: I burn wood to ash. Third: Every living thing resembles me. What am I?"],
          ["Streber", "I am going to regret understanding this."]
        ]);
        return;
      }
    }
    if (underworldTrialStarted && !underworldGateOpen) {
      for (let i = 0; i < underworldRunes.length; i++) {
        const rune = underworldRunes[i];
        if (near(player, rune, 48)) {
          if (i === underworldRuneProgress) {
            underworldRuneProgress++;
            if (underworldRuneProgress >= underworldRunes.length) {
              underworldGateOpen = true;
              completeQuest("The runes glow. The sealed gate finally opens!", "enterUnderworldSanctum");
              openDialogue([
                ["Narrator", "The runes flash and hum with power."],
                ["Asmodeus", "Impossible. A TRIUMPH OF INTELLECT."]
              ]);
            } else {
              openDialogue([["Narrator", `The ${rune.symbol.toLowerCase()} rune lights up.`]]);
            }
          } else {
            underworldRuneProgress = 0;
            openDialogue([
              ["Narrator", "The rune flashes red, and the sequence resets."],
              ["Streber", "Defeated by decorative rocks."]
            ]);
          }
          return;
        }
      }
    }
    return;
  }

  if (currentArea === "sea" && currentQuest === "reachSea" && player.x > 700 && player.y > 290) {
    completeQuest("You found a ship. It looks only slightly cursed.", "boardShip");
    transitionToArea("shipDeck");
    return;
  }

  if (currentArea === "shipDeck" && near(player, redLever, 75)) {
    if (!redLeverWarned) {
      redLeverWarned = true;
      openDialogue([
        ["Streber", "What's this very clearly labelled suspicious lever?"],
        ["Captain", "Don't touch the red lever."],
        ["Streber", "Why is there a red lever? For emergencies?"],
        ["Captain", "You'll know."]
      ]);
      return;
    }
    if (!redLeverPulled) {
      redLeverPulled = true;
      shipRock += 2.5;
      openDialogue([
        ["Streber", "I wonder what this does."],
        ["Narrator", "CLUNK. A tiny flag unfurls saying: HONK."],
        ["Pip", "You pulled the ceremonial honk lever!"]
      ]);
      return;
    }
  }

  if (currentArea === "shipDeck") {
    for (const crewmate of shipCrew) {
      if (near(player, crewmate, 75)) {
        openDialogue([[crewmate.name, "Ahoy! Welcome aboard the ship."]]);
        return;
      }
    }
  }

  if (currentArea === "shipDeck" && near(player, shipCaptain, 85)) {
    if (!captainBriefed) {
      captainBriefed = true;
      completeQuest("The captain has agreed to take you across the sea.", "sailToIsland");
      openDialogue([
        ["Captain", "Ahoy! Looking for a ride? Take the helm when you're ready."],
        ["Streber", "You are letting a stranger steer your ship?"],
        ["Captain", "You look trustworthy."]
      ]);
    } else {
      openDialogue([["Captain", "Helm's yours. Try not to steer into a rock."]]);
    }
    return;
  }

  if (currentArea === "shipDeck" && near(player, shipHelm, 90)) {
    if (!captainBriefed) {
      openDialogue([["Streber", "I should probably ask the captain what I'm doing first."]]);
    } else {
      completeQuest("All aboard.", "sailToIsland");
      sailingSequencePending = true;
      openDialogue([
        ["Narrator", "The sails catch the wind. The shore begins to shrink."],
        ["Streber", "Okay. This is actually kind of nice."]
      ]);
    }
    return;
  }

  if (currentArea === "island" && !islandHunt.footprints && near(player, islandClues.footprints, 48)) {
    islandHunt.footprints = true;
    openDialogue([["Streber", "Tiny footprints. Very tiny. Suspiciously dinosaur-shaped."]]);
    return;
  }

  if (currentArea === "island" && islandHunt.footprints && !islandExplored && near(player, { x: 470, y: 335 }, 115)) {
    islandExplored = true;
    completeQuest("You have reached the island!", "exploreIsland");
    openDialogue([
      ["Streber", "That bush just moved... ANKYLO?! What are you doing here?"],
      ["Narrator", "Ankylo blinks at you."]
    ]);
    return;
  }

  if (currentArea === "island" && islandExplored) {
    if (!islandHunt.bottle && near(player, islandClues.bottle, 48)) {
      islandHunt.bottle = true;
      openDialogue([["Streber", "A bottle just washed up with a message: 'If you found this, you looked very hard for this.'"]]);
      return;
    }
    if (islandHunt.chest && !islandHunt.chantRead && near(player, islandClues.chest, 55)) {
      islandHunt.chantRead = true;
      openDialogue([
        ["Streber", "Reading the chant on the back of the map..."],
        ["Narrator", "The map's markings glow, revealing a dark passage beneath the eastern cliffs."]
      ]);
      return;
    }
    if (!islandHunt.chest && islandHunt.bottle && near(player, islandClues.chest, 55)) {
      islandHunt.chest = true;
      islandHunt.rewardFound = true;
      openDialogue([["Streber", "A treasure chest! Inside: a tiny hat and a map."]]);
      return;
    }
  }

  if (currentArea === "peaks" && currentQuest === "dragonBattle" && player.x > W - 100 && player.y > 330) {
    transitionToArea("dragonArena");
    return;
  }

  if (currentArea === "peaks" && currentQuest !== "mistboundPeaks" && near(player, mountainWatcher, 80)) {
    if (currentQuest === "dragonWarning") {
      completeQuest("The mountain guardian awaits!", "dragonBattle");
      openDialogue([
        ["mountain watcher", "They call me the mountain watcher. A dragon guards the only passage through these peaks."],
        ["Streber", "And I assume it can be reasoned with?"],
        ["mountain watcher", "..."],
        ["Streber", "Right. Draw your sword."]
      ]);
    } else {
      openDialogue([["mountain watcher", "Find the shrine first. Then we may speak."]]);
    }
    return;
  }

  if (currentArea === "peaks" && currentQuest === "mistboundPeaks" && player.x > 630 && player.x < 770 && player.y > 220 && player.y < 350) {
    completeQuest("You discovered an ancient warning!", "dragonWarning");
    openDialogue([
      ["Shrine", "BEWARE THE GUARDIAN OF THE PEAKS. BEWARE ITS FIRE."],
      ["Streber", "Okay. Slightly more concerning."]
    ]);
    return;
  }

  if (currentQuest === "leaveCave" && player.x > W - 100 && player.y > 180 && player.y < 360) {
    completeQuest("You have left the cave", "mistboundPeaks");
    openDialogue([
      ["Streber", "The outside world is so bright and misty."],
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
      ["Funf", "Happy birthday, nerd. <3 Your first quest is extremely important: explore our cave!"],
      ["Streber", "Holy shit funf!"],
      ["Funf", ":p hehehe."]
    ]);
    return;
  }

  if (currentArea === "cave" && near(player, dino, 65)) {
    openDialogue([
      ["Ankylo", "...mlep."],
      ["Streber", "You are very small."]
    ]);
    return;
  }

  if (currentArea === "cave") {
    for (const item of interactables) {
      if (player.x > item.x - 50 && player.x < item.x + item.w + 50 && player.y > item.y - 50 && player.y < item.y + item.h + 50) {
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
    openDialogue([["Piano", "*plink plonk*"], ["Streber", "You play a very serious chord."]]);
  }
  if (type === "bedroom") {
    openDialogue([["Streber", "Stars, books, computers, and a suspicious amount of sword-related equipment."]]);
  }
  if (type === "books") {
    openDialogue([["Bookshelf", "Physics, fantasy, and entropy."]]);
  }
  if (type === "garden") {
    openDialogue([["Garden", "You found a lily."], ["Inventory", "Lily added!"]]);
  }
}

function showMapMessage() {
  if (paused) return;
  openDialogue([
    ["MAP", "HOME CAVE → MISTBOUND PEAKS → SEA → ISLAND → UNDERWORLD → THE FINALE"],
    ["MAP", "The rest of the world is constructed by one confused coder."]
  ]);
}

function update() {
  if (!gameStarted || paused) return;
  if (!dialogueBox.classList.contains("hidden")) return;
  if (!nightAlert.classList.contains("hidden")) return;

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
  if (currentArea === "peaks") mountainWatcher.bob += 0.05;
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

// -------------------------
// DRAWING ROUTINES (USING ASSET IMAGES)
// -------------------------

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
      ["Streber", "Okay. Big mountain. Big cave."],
      ["???", "WHO DARES ENTER MY DOMAIN?"],
      ["Dragon", "YOU HAVE DISTURBED MY SLUMBER, MORTAL."],
      ["Streber", "I would really prefer a bridge."],
      ["Dragon", "PREPARE YOURSELF."]
    ]);
  }
}

function attackDragon() {
  if (!gameStarted || paused || currentArea !== "dragonArena" || !dialogueBox.classList.contains("hidden") || dragonDefeated || swordCooldown > 0) return;
  swordCooldown = 24;
  swordFrames = 10;
  const distance = Math.hypot(player.x - dragon.x, player.y - (dragon.y + 25));
  if (distance < 190) {
    dragon.hp = Math.max(0, dragon.hp - 12);
    if (dragon.hp <= 0) defeatDragon();
  }
}

function dodgeRoll() {
  if (!gameStarted || paused || currentArea !== "dragonArena" || !dialogueBox.classList.contains("hidden") || dragonDefeated || dodgeCooldown > 0) return;
  let dx = 0, dy = 0;
  if (keys["ArrowLeft"] || keys["a"] || keys["A"]) dx--;
  if (keys["ArrowRight"] || keys["d"] || keys["D"]) dx++;
  if (keys["ArrowUp"] || keys["w"] || keys["W"]) dy--;
  if (keys["ArrowDown"] || keys["s"] || keys["S"]) dy++;
  if (dx === 0 && dy === 0) dx = player.facing === "left" ? -1 : 1;
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
        ["Streber", "That was terrifying."],
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
        openDialogue([["Streber", "Let's try that again."]]);
      }
      continue;
    }
    if (f.life <= 0) fireballs.splice(i, 1);
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
    ctx.fillStyle="#201a20"; ctx.fillRect(x-3,y-3,w+6,h+18);
    ctx.fillStyle="#5b3538"; ctx.fillRect(x,y,w,h);
    ctx.fillStyle=fill; ctx.fillRect(x,y,Math.max(0,w*ratio),h);
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
  }
  for (const f of fireballs) {
    ctx.fillStyle = "#a83e35";
    ctx.fillRect(f.x-10, f.y-10, 20, 20);
  }
}

function enterMistboundPeaks() { player.x = 180; player.y = 390; player.facing = "right"; setQuest("mistboundPeaks"); clearKeys(); }
function enterSea() { currentArea = "sea"; player.x = 120; player.y = 360; player.facing = "right"; clearKeys(); setQuest("reachSea"); openDialogue([["Streber", "Salt air. Actual salt air."]]); }
function enterShipDeck() { currentArea = "shipDeck"; player.x = 150; player.y = 360; player.facing = "right"; captainBriefed = false; redLeverPulled = false; redLeverWarned = false; clearKeys(); setQuest("talkCaptain"); }
function enterIsland() { currentArea = "island"; player.x = 150; player.y = 365; player.facing = "right"; islandExplored = false; islandHunt.footprints = false; islandHunt.bottle = false; islandHunt.chest = false; clearKeys(); setQuest("exploreIsland"); }
function enterUnderworld() { currentArea = "underworld"; player.x = 150; player.y = 385; player.facing = "right"; underworldResidentsMet = { asmodeus: false, cerberus: false }; clearKeys(); setQuest("meetUnderworldResidents"); }
function enterUnderworldSanctum() { currentArea = "underworldSanctum"; player.x = 130; player.y = 385; player.facing = "right"; sanctumKeeperMet = false; clearKeys(); setQuest("enterUnderworldSanctum"); }
function enterBirthdayRoom() { currentArea = "birthdayRoom"; player.x = 480; player.y = 445; player.facing = "up"; clearKeys(); setQuest("birthdaySurprise"); }

function drawCharacterSprite(imgKey, x, y, w, h) {
  drawAssetOrDefault(imgKey, x - w/2, y - h/2, w, h, "#b9a27a");
}

function draw() {
  ctx.clearRect(0, 0, W, H);

  // Render area backgrounds using uploaded image assets (with fallback colors)
  if (currentArea === "cave") {
    drawAssetOrDefault("caveBg", 0, 0, W, H, "#201a20");
    drawCharacterSprite("ankylo", dino.x, dino.y, 40, 30);
    drawCharacterSprite("funf", funf.x, funf.y, 45, 60);
  } else if (currentArea === "peaks") {
    drawAssetOrDefault("peaksBg", 0, 0, W, H, "#526b7b");
    drawCharacterSprite("watcher", mountainWatcher.x, mountainWatcher.y, 45, 60);
  } else if (currentArea === "dragonArena") {
    drawAssetOrDefault("dragonBg", 0, 0, W, H, "#25232c");
    if (!dragonDefeated) {
      drawCharacterSprite("dragonSprite", dragon.x, dragon.y, 140, 110);
    }
    drawCombatEffects();
    drawCombatHUD();
  } else if (currentArea === "sea") {
    drawAssetOrDefault("seaBg", 0, 0, W, H, "#477d89");
  } else if (currentArea === "shipDeck") {
    drawAssetOrDefault("shipBg", 0, 0, W, H, "#54372f");
    drawCharacterSprite("captain", shipCaptain.x, shipCaptain.y, 45, 60);
    for (const c of shipCrew) drawCharacterSprite("captain", c.x, c.y, 40, 55);
  } else if (currentArea === "island") {
    drawAssetOrDefault("islandBg", 0, 0, W, H, "#526b45");
    if (islandExplored) drawCharacterSprite("ankylo", islandAnkylo.x, islandAnkylo.y, 40, 30);
  } else if (currentArea === "underworld") {
    drawAssetOrDefault("underworldBg", 0, 0, W, H, "#382b3b");
    drawCharacterSprite("asmodeus", asmodeus.x, asmodeus.y, 50, 65);
    drawCharacterSprite("cerberus", cerberus.x, cerberus.y, 60, 45);
  } else if (currentArea === "underworldSanctum") {
    drawAssetOrDefault("archiveBg", 0, 0, W, H, "#252d49");
    drawCharacterSprite("keeper", sanctumKeeper.x, sanctumKeeper.y, 45, 60);
  } else if (currentArea === "birthdayRoom") {
    drawAssetOrDefault("birthdayBg", 0, 0, W, H, "#5c3a54");
    drawCharacterSprite("funf", funf.x, funf.y, 45, 60);
  }

  // Draw Player Streber
  drawCharacterSprite("streber", player.x, player.y, 45, 60);

  // Interaction Hint Prompt
  const hint = getInteractionHint();
  if (hint) {
    ctx.font = "bold 13px monospace";
    ctx.textAlign = "center";
    ctx.fillStyle = "#ead9b8";
    ctx.fillText(hint, player.x, player.y - 45);
    ctx.textAlign = "left";
  }
}

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

// Preload images and draw initial frame
loadGameAssets(() => {
  draw();
});
