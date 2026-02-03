// ==============================
// STRANDED - FULL SCRIPT.JS
// ==============================

// ---------- GAME STATE ----------
const state = {
  day: 1,

  health: 100,
  hunger: 100,
  thirst: 100,
  energy: 100,

  wood: 0,
  metal: 0,
  fish: 0,
  bullets: 0,

  plantFiber: 0,
  bandage: 0,

  fire: false,
  fireFuel: 0, // days remaining

  mattress: false,
  revolver: false,

  carRepair: 0 // percent
};

// ---------- HELPERS ----------
function rand(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function log(msg) {
  const box = document.getElementById("log");
  box.innerHTML += `<div>${msg}</div>`;
  box.scrollTop = box.scrollHeight;
}

// ---------- DAILY DRAIN ----------
function dailyDrain() {
  let hungerLoss = 8;
  let thirstLoss = 12;
  let energyLoss = 5;

  // Fire helps survival
  if (state.fire) {
    hungerLoss -= 3;
    thirstLoss -= 4;
    energyLoss -= 2;
  }

  // Mattress improves rest
  if (state.mattress) {
    energyLoss -= 3;
  }

  hungerLoss = Math.max(2, hungerLoss);
  thirstLoss = Math.max(3, thirstLoss);
  energyLoss = Math.max(1, energyLoss);

  state.hunger -= hungerLoss;
  state.thirst -= thirstLoss;
  state.energy -= energyLoss;

  // Hypothermia
  if (!state.fire && !state.mattress) {
    state.health -= 4;
    log("❄️ You are freezing. Health -4.");
  }

  // Starvation / dehydration
  if (state.hunger <= 0 || state.thirst <= 0) {
    state.health -= 6;
    log("⚠️ Starvation or dehydration is hurting you.");
  }

  // Slow health recovery
  if (
    state.hunger > 60 &&
    state.thirst > 60 &&
    state.energy > 40 &&
    (state.fire || state.mattress)
  ) {
    state.health = Math.min(100, state.health + 2);
    log("🩹 You recover a little health.");
  }

  // Fire fuel burn
  if (state.fire) {
    state.fireFuel--;
    if (state.fireFuel <= 0) {
      state.fire = false;
      log("🔥 The fire burned out.");
    }
  }

  // Clamp stats
  state.hunger = Math.max(0, state.hunger);
  state.thirst = Math.max(0, state.thirst);
  state.energy = Math.max(0, state.energy);
  state.health = Math.max(0, state.health);
}

// ---------- ACTION HANDLER ----------
function doAction(cost, fn) {
  if (state.energy < cost) {
    log("😴 You’re too tired to do that.");
    return;
  }

  state.energy -= cost;
  fn();

  dailyDrain();
  state.day++;

  render();
}

// ---------- BUTTON ----------
function action(text, cost, fn, yellow = false) {
  const btn = document.createElement("button");
  btn.textContent = `${text} (-${cost}⚡)`;
  if (yellow) btn.classList.add("yellow");
  btn.onclick = () => doAction(cost, fn);
  document.getElementById("actions").appendChild(btn);
}

// ---------- RENDER ----------
function render() {
  document.getElementById("stats").innerHTML = `
📅 Day ${state.day}<br><br>
❤️ Health: ${state.health}<br>
🍖 Hunger: ${state.hunger}<br>
💧 Thirst: ${state.thirst}<br>
⚡ Energy: ${state.energy}<br><br>

🪵 Wood: ${state.wood}<br>
🔩 Metal: ${state.metal}<br>
🌿 Fibers: ${state.plantFiber}<br>
🩹 Bandages: ${state.bandage}<br>
🐟 Fish: ${state.fish}<br>
🔫 Bullets: ${state.bullets}<br><br>

🔥 Fire: ${state.fire ? `Burning (${state.fireFuel} days)` : "Out"}<br>
🛏️ Mattress: ${state.mattress ? "Yes" : "No"}<br>
🚗 Car Repair: ${state.carRepair}%
`;

  const actions = document.getElementById("actions");
  actions.innerHTML = "";

  // ---------- GATHERING ----------
  action("🌲 Scavenge Wood", 6, () => {
    const g = rand(2, 5);
    state.wood += g;
    log(`🪵 You gathered ${g} wood.`);
  });

  action("🔧 Scavenge Metal", 7, () => {
    const g = rand(1, 3);
    state.metal += g;
    log(`🔩 You found ${g} metal.`);
  });

  action("🐟 Fish", 8, () => {
    const food = rand(1, 3);
    const fibers = rand(2, 10);
    state.fish += food;
    state.plantFiber += fibers;
    log(`🐟 You caught fish and collected ${fibers} plant fibers.`);
  });

  // ---------- FIRE ----------
  if (!state.fire && state.wood >= 1) {
    action("🔥 Build Fire", 4, () => {
      state.wood -= 1;
      state.fire = true;
      state.fireFuel = 3;
      log("🔥 You started a campfire using 1 wood.");
    });
  }

  if (state.fire && state.wood >= 1) {
    action("🔥 Add Wood to Fire", 2, () => {
      state.wood--;
      state.fireFuel += 2;
      log("🔥 You added wood to the fire.");
    });
  }

  // ---------- FOOD ----------
  if (state.fish > 0) {
    action("🍖 Eat Fish", 2, () => {
      state.fish--;
      state.hunger = Math.min(100, state.hunger + 20);
      log("🍖 You eat fish.");
    });
  }

  // ---------- WATER ----------
  action("💧 Drink Water", 1, () => {
    state.thirst = Math.min(100, state.thirst + 25);
    log("💧 You drink water.");
  });

  // ---------- BANDAGES ----------
  if (state.plantFiber >= 2) {
    action("🩹 Craft Bandage", 2, () => {
      state.plantFiber -= 2;
      state.bandage++;
      log("🩹 You crafted a bandage.");
    }, true);
  }

  if (state.bandage > 0) {
    action("🩹 Use Bandage", 1, () => {
      state.bandage--;
      state.health = Math.min(100, Math.floor(state.health * 1.5));
      log("🩹 You used a bandage.");
    });
  }

  // ---------- MATTRESS ----------
  if (!state.mattress && state.wood >= 16 && state.plantFiber >= 7) {
    action("🛏️ Craft Mattress", 10, () => {
      state.wood -= 16;
      state.plantFiber -= 7;
      state.mattress = true;
      log("🛏️ You crafted a soft mattress.");
    }, true);
  }

  // ---------- REVOLVER ----------
  if (!state.revolver && state.metal >= 2 && state.wood >= 1) {
    action("🔫 Craft Revolver", 8, () => {
      state.metal -= 2;
      state.wood -= 1;
      state.revolver = true;
      log("🔫 You crafted a revolver.");
    }, true);
  }

  if (state.revolver && state.metal >= 1) {
    action("🔫 Craft Bullets (9)", 4, () => {
      state.metal--;
      state.bullets += 9;
      log("🔫 You crafted bullets.");
    });
  }

  // ---------- CAR REPAIR ----------
  if (state.wood >= 9 && state.metal >= 7 && state.carRepair < 100) {
    action("🚗 Repair Car", 6, () => {
      state.carRepair += 10;
      log(`🚗 Repair progress: ${state.carRepair}%`);
      if (state.carRepair >= 100) {
        log("🎉 You fixed the car and escaped!");
      }
    }, true);
  }
}

// ---------- START ----------
log("🚗 Your car broke down. You are stranded.");
render();