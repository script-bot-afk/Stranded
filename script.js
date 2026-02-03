/* ------------------------------
   Stranded Survival Game v1.0
   Full, unoptimized version
   All features included
------------------------------ */

const state = {
    day: 1,
    health: 100,
    energy: 100,
    hunger: 100,
    thirst: 100,
    fire: false,
    wood: 0,
    metal: 0,
    repair: 0,
    blueprints: {
        revolver: false,
        mattress: false
    },
    hasRevolver: false,
    bullets: 0,
    hasMattress: false
};

const logEl = document.getElementById("log");
const actionsEl = document.getElementById("actions");

function log(msg) {
    logEl.innerHTML = `<div>${msg}</div>` + logEl.innerHTML;
    if (logEl.children.length > 12) logEl.removeChild(logEl.lastChild);
}

function updateUI() {
    for (let key of ["day","health","energy","hunger","thirst","wood","metal","bullets"]) {
        if(document.getElementById(key)) document.getElementById(key).textContent = state[key];
    }
    document.getElementById("fire").textContent = state.fire ? "On" : "Off";
    document.getElementById("repair").textContent = state.repair + "%";
}

function clamp() {
    for (let k of ["health","energy","hunger","thirst"]) {
        state[k] = Math.max(0, Math.min(100, state[k]));
    }
    if(state.health <= 0){
        actionsEl.innerHTML = "";
        log("💀 You did not survive. Game Over.");
    }
}

function endDay() {
    state.day++;
    // Daily drain
    state.hunger -= 8;
    state.thirst -= 12;
    
    // Fire check
    if(!state.fire) {
        state.energy -= 15;
        state.health -= 4;
        log("❄️ Hypothermia sets in! Energy drains fast, health slowly.");
    }
    
    // Hunger/Thirst critical
    if(state.hunger <=0 || state.thirst <=0) {
        state.health -= 8;
        log("⚠️ You are starving or dehydrated! Health dropping.");
    }
    
    // Random chance fire goes out
    if(state.fire && Math.random() < 0.15){
        state.fire = false;
        log("🔥 Your fire has gone out!");
    }
    
    clamp();
}

// Energy scaling helper
function drainEnergy(amount){
    let modifier = 1;
    if(state.hunger < 40) modifier += 0.25;
    if(state.thirst < 40) modifier += 0.4;
    state.energy -= Math.ceil(amount * modifier);
    if(state.energy <0) state.energy =0;
}

// Action helper
function action(name, baseEnergy, fn, cls=""){
    const btn = document.createElement("button");
    btn.textContent = name;
    btn.className = cls;
    btn.onclick = ()=>{
        if(state.energy < baseEnergy){
            log("😫 Too exhausted to do this.");
            return;
        }
        drainEnergy(baseEnergy);
        fn();
        endDay();
        updateUI();
        renderActions();
    };
    actionsEl.appendChild(btn);
}

// Random Events
function randomEvent(){
    const roll = Math.random();
    if(roll < 0.08){
        state.health -= 10;
        log("🐻 Bear attack! You lose 10 health.");
    } else if(roll < 0.15){
        state.energy -= 10;
        log("🌧️ Bad weather slows you down! Energy drops.");
    } else if(roll < 0.20 && !state.blueprints.revolver){
        state.blueprints.revolver = true;
        log("📜 You found a rare Revolver Blueprint!");
    } else if(roll < 0.22 && !state.blueprints.mattress){
        state.blueprints.mattress = true;
        log("📜 You found a rare Soft Mattress Blueprint!");
    }
}

function renderActions(){
    actionsEl.innerHTML = "";
    
    // Gather wood
    action("🪵 Gather Wood (-10)",10,()=>{
        state.wood += Math.floor(Math.random()*3)+1;
        log("You gathered some wood.");
        randomEvent();
    });

    // Scavenge metal
    action("🧱 Scavenge Metal (-12)",12,()=>{
        if(Math.random() <0.6) {
            state.metal +=1;
            log("You found metal!");
        } else {
            log("No metal found.");
        }
        randomEvent();
    });

    // Hunt
    action("🏹 Hunt (-18)",18,()=>{
        let success = Math.random();
        if(state.hasRevolver) success += 0.3;
        if(success >0.4){
            state.hunger += 20;
            state.thirst += 10;
            log("🎯 Successful hunt! Hunger and thirst improved.");
        } else{
            log("❌ Hunt failed.");
        }
        randomEvent();
    });

    // Fish
    action("🎣 Fish (-12)",12,()=>{
        let success = Math.random();
        if(state.hasRevolver) success += 0.2;
        if(success>0.4){
            state.hunger += 15;
            log("🐟 You caught some fish!");
        } else {
            log("No luck fishing.");
        }
        randomEvent();
    });

    // Build fire
    action("🔥 Build Fire (-9)",9,()=>{
        if(state.wood>=2){
            state.wood-=2;
            state.fire = true;
            log("Fire is burning.");
        } else log("Not enough wood to build fire.");
    });

    // Sleep
    action("😴 Sleep",0,()=>{
        let gain = state.fire ? 40 : 25;
        if(state.hasMattress) gain *= 2;
        state.energy = Math.min(100, state.energy + gain);
        log("You slept and recovered energy.");
        randomEvent();
    });

    // Drink
    action("💧 Drink Water (-1)",1,()=>{
        state.thirst = Math.min(100,state.thirst +25);
        log("You drank water.");
    });

    // Eat
    action("🍗 Eat (-1)",1,()=>{
        state.hunger = Math.min(100,state.hunger +20);
        log("You ate food.");
    });

    // Craft Revolver
    if(state.blueprints.revolver && !state.hasRevolver){
        action("🔫 Craft Revolver (-14)",14,()=>{
            if(state.metal >=2 && state.wood>=1){
                state.metal -=2;
                state.wood -=1;
                state.hasRevolver = true;
                state.blueprints.revolver=false;
                log("You crafted a revolver!");
            } else log("Not enough materials to craft revolver.");
        },"yellow");
    }

    // Craft bullets
    if(state.hasRevolver){
        action("🔫 Craft 9 Bullets (-6)",6,()=>{
            if(state.metal>=1){
                state.metal-=1;
                state.bullets +=9;
                log("You crafted 9 bullets.");
            } else log("Not enough metal to craft bullets.");
        },"yellow");
    }

    // Craft Mattress
    if(state.blueprints.mattress && !state.hasMattress){
        action("🛏️ Craft Soft Mattress (-22)",22,()=>{
            if(state.wood>=16){
                state.wood -=16;
                state.hasMattress = true;
                state.blueprints.mattress = false;
                log("You crafted a soft mattress!");
            } else log("Not enough wood to craft mattress.");
        },"yellow");
    }

    // Repair Car
    if(state.wood>=9 && state.metal>=7){
        action("🚗 Repair Car (-3)",3,()=>{
            state.repair=100;
            actionsEl.innerHTML="";
            log("🎉 You repaired the car and escaped! Victory!");
        });
    }

    updateUI();
}

// Initialize
updateUI();
renderActions();
log("Day 1: Your car broke down. Survive and repair it!");
