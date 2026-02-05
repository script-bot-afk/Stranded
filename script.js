// ==============================
// STRANDED - SCRIPT.JS (FIXED)
// ==============================

const MAX = 100;

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
  fireFuel: 0,

  mattress: false,
  revolver: false,

  carRepair: 0
};

// ---------- HELPERS ----------
function rand(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function clamp() {
  state.health = Math.max(0, Math.min(MAX, state.health));
  state.hunger = Math.max(0, Math.min(MAX, state.hunger));
  state.thirst = Math.max(0, Math.min(MAX, state.thirst));
  state.energy = Math.max(0, Math.min(MAX, state.energy));
}

function log(msg) {
  const box = document.getElementById("log");
  box.innerHTML += `<div>${msg}</div>`;
  box.scrollTop = box.scrollHeight;
}

// ---------- DAILY EFFECTS ----------
function dailyDrain() {
  let hungerLoss = 8;
  let thirstLoss = 12;
  let energyLoss = 5;

  if (state.fire) {
    hungerLoss -= 3;
    thirstLoss -= 4;
    energyLoss -= 2;
  }

  if (state.mattress) {
    energyLoss -= 3;
  }

  hungerLoss = Math.max(2, hungerLoss);
  thirstLoss = Math.max(3, thirstLoss);
  energyLoss = Math.max(1, energyLoss);

  state.hunger -= hungerLoss;
  state.thirst -= thirstLoss;
  state.energy -= energyLoss;

  // Cold damage
  if (!state.fire && !state.mattress) {
    state.health -= 4;
    log("❄️ You are freezing. Health -4.");
  }

  // Starvation / dehydration
  if (state.hunger <= 0 || state.thirst <= 0) {
    state.health -= 6;
    log("⚠️ Starvation or dehydration is hurting you.");
  }

  // Recovery
  if (
    state.hunger > 60 &&
    state.thirst > 60 &&
    state.energy > 40 &&
    (state.fire || state.mattress)
  ) {
    state.health += 2;
    log("🩹 You recover some health.");
  }

  // Fire fuel
  if (state.fire) {
    state.fireFuel--;
    if (state.fireFuel <= 0) {
      state.fire = false;
      log("🔥 The fire went out.");
    }
  }

  clamp();

  if (state.health <= 0) {
    alert("You didn’t survive.");
    location.reload();
  }
}

// ---------- ACTION HANDLER ----------
function doAction(cost, fn) {
  if (state.energy < cost) {
    log("😴 Too tired to do that.");
    return;
  }

  state.energy -= cost;
  fn();

  dailyDrain();
  state.day++;

  render();
}

// ---------- BUTTON ----------
function action(label, cost, fn, important = false) {
  const btn = document.createElement("button");
  btn.textContent = `${label} (-${cost}⚡)`;
  if (important) btn.classList.add("yellow");
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

  // ---------- GATHER ----------
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
    state.fish += rand(1, 3);
    state.plantFiber += rand(2, 10);
    log("🐟 You went fishing.");
  });

  // ---------- FIRE ----------
  if (!state.fire && state.wood >= 1) {
    action("🔥 Build Fire", 4, () => {
      state.wood--;
      state.fire = true;
      state.fireFuel = 3;
      log("🔥 You started a fire.");
    });
  }

  if (state.fire && state.wood >= 1) {
    action("🔥 Add Wood to Fire", 2, () => {
      state.wood--;
      state.fireFuel += 2;
      log("🔥 You added fuel.");
    });
  }

  // ---------- FOOD ----------
  if (state.fish > 0) {
    action("🍖 Eat Fish", 2, () => {
      state.fish--;
      state.hunger += 20;
      state.energy += 18;
      log("🍖 You eat fish and feel energized.");
    });
  }

  action("💧 Drink Water", 1, () => {
    state.thirst += 25;
    state.energy += 5;
    log("💧 You drink water.");
  });

  // ---------- BANDAGES ----------
  if (state.plantFiber >= 2) {
    action("🩹 Craft Bandage", 2, () => {
      state.plantFiber -= 2;
      state.bandage++;
      log("🩹 Bandage crafted.");
    }, true);
  }

  if (state.bandage > 0) {
    action("🩹 Use Bandage", 1, () => {
      state.bandage--;
      state.health = Math.min(MAX, Math.floor(state.health * 1.5));
      log("🩹 You used a bandage.");
    });
  }

  // ---------- MATTRESS ----------
  if (!state.mattress && state.wood >= 16 && state.plantFiber >= 7) {
    action("🛏️ Craft Mattress", 10, () => {
      state.wood -= 16;
      state.plantFiber -= 7;
      state.mattress = true;
      log("🛏️ You crafted a mattress.");
    }, true);
  }

  // ---------- SLEEP ----------
  if (state.mattress) {
    action("😴 Sleep", 0, () => {
      let restore = 35;
      if (state.fire) restore += 10;

      state.energy += restore;
      state.hunger -= 5;
      state.thirst -= 5;

      log("😴 You sleep and regain energy.");
    }, true);
  }

  // ---------- REVOLVER ----------
  if (!state.revolver && state.metal >= 2 && state.wood >= 1) {
    action("🔫 Craft Revolver", 8, () => {
      state.metal -= 2;
      state.wood -= 1;
      state.revolver = true;
      log("🔫 Revolver crafted.");
    }, true);
  }

  if (state.revolver && state.metal >= 1) {
    action("🔫 Craft Bullets (9)", 4, () => {
      state.metal--;
      state.bullets += 9;
      log("🔫 Bullets crafted.");
    });
  }

  // ---------- CAR ----------
  if (state.wood >= 9 && state.metal >= 7 && state.carRepair < 100) {
    action("🚗 Repair Car", 6, () => {
      state.carRepair += 10;
      log(`🚗 Repair progress: ${state.carRepair}%`);
      if (state.carRepair >= 100) {
        log("🎉 You repaired the car and escaped!");
      }
    }, true);
  }

  clamp();
}

// ---------- START ----------
log("🚗 Your car broke down. You are stranded.");
render();