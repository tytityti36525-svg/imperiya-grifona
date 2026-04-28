const gold = document.getElementById("gold");
const power = document.getElementById("power");
const level = document.getElementById("level");
const content = document.getElementById("content");
const expFill = document.getElementById("expFill");

let gameData;
let playerId;
let playerRef;
let currentEnemy = null;

function defaultGame() {
    return {
        hero: {
            level: 1,
            exp: 0,
            expMax: 100,
            strength: 0,
            endurance: 0,
            vitality: 0,
            attack: 10
        },
        gold: 500,
        inventory: [],
        castleLevel: 1,
        buildings: {
            barracks: 1,
            forge: 1,
            academy: 1
        },
        army: {
            swordsmen: 0,
            archers: 0,
            knights: 0
        },
        equipped: {
            helmet: null,
            armor: null,
            pants: null,
            boots: null,
            weapon: null
        }
    };
}

async function startGame(uid) {
    playerId = uid;
    playerRef = db.collection("players").doc(uid);

    const snap = await playerRef.get();
    const data = snap.data() || {};

    gameData = data.game || defaultGame();

    fixOldSaves();
    recalc();
    await save();
    updateUI();
    show("hero");
}

function fixOldSaves() {
    const def = defaultGame();

    if (!gameData.hero) gameData.hero = def.hero;
    if (gameData.hero.level === undefined) gameData.hero.level = 1;
    if (gameData.hero.exp === undefined) gameData.hero.exp = 0;
    if (gameData.hero.expMax === undefined) gameData.hero.expMax = 100;
    if (gameData.hero.strength === undefined) gameData.hero.strength = 0;
    if (gameData.hero.endurance === undefined) gameData.hero.endurance = 0;
    if (gameData.hero.vitality === undefined) gameData.hero.vitality = 0;
    if (gameData.hero.attack === undefined) gameData.hero.attack = 10;

    if (gameData.gold === undefined) gameData.gold = 500;
    if (gameData.castleLevel === undefined) gameData.castleLevel = 1;

    if (!Array.isArray(gameData.inventory)) gameData.inventory = [];

    if (!gameData.buildings) gameData.buildings = def.buildings;
    if (gameData.buildings.barracks === undefined) gameData.buildings.barracks = 1;
    if (gameData.buildings.forge === undefined) gameData.buildings.forge = 1;
    if (gameData.buildings.academy === undefined) gameData.buildings.academy = 1;

    if (!gameData.army || typeof gameData.army === "number") {
        gameData.army = def.army;
    }

    if (gameData.army.swordsmen === undefined) gameData.army.swordsmen = 0;
    if (gameData.army.archers === undefined) gameData.army.archers = 0;
    if (gameData.army.knights === undefined) gameData.army.knights = 0;

    if (!gameData.equipped) gameData.equipped = def.equipped;
    if (gameData.equipped.helmet === undefined) gameData.equipped.helmet = null;
    if (gameData.equipped.armor === undefined) gameData.equipped.armor = null;
    if (gameData.equipped.pants === undefined) gameData.equipped.pants = null;
    if (gameData.equipped.boots === undefined) gameData.equipped.boots = null;
    if (gameData.equipped.weapon === undefined) gameData.equipped.weapon = null;
}

async function save() {
    if (!playerRef) return;

    await playerRef.set({
        game: gameData,
        level: gameData.hero.level,
        power: gameData.hero.attack,
        gold: gameData.gold,
        updatedAt: Date.now()
    }, { merge: true });
}

function recalc() {
    let atk = 10;

    atk += gameData.hero.strength * 2;
    atk += gameData.hero.endurance;
    atk += gameData.hero.vitality;

    atk += gameData.army.swordsmen * 1;
    atk += gameData.army.archers * 2;
    atk += gameData.army.knights * 5;

    atk += (gameData.buildings.forge - 1) * 2;

    for (let key in gameData.equipped) {
        if (gameData.equipped[key]) {
            atk += gameData.equipped[key].power;
        }
    }

    gameData.hero.attack = atk;
}

function updateUI() {
    gold.innerText = gameData.gold;
    power.innerText = gameData.hero.attack;
    level.innerText = gameData.hero.level;

    let percent = Math.floor((gameData.hero.exp / gameData.hero.expMax) * 100);
    expFill.style.width = percent + "%";
    expFill.innerText = percent + "%";
}

function castlePrice() {
    return 100 * Math.pow(2, gameData.castleLevel - 1);
}

function buildingPrice(type) {
    const base = {
        barracks: 80,
        forge: 120,
        academy: 150
    };

    return base[type] * Math.pow(2, gameData.buildings[type] - 1);
}

function trainPrice(type) {
    return Math.floor(20 * Math.pow(1.1, gameData.hero[type]));
}

function armyPower() {
    return gameData.army.swordsmen * 1 +
           gameData.army.archers * 2 +
           gameData.army.knights * 5;
}

function getRarity() {
    let lvl = gameData.hero.level;

    if (lvl >= 30) return { name: "Міфічний", color: "red", min: 15, max: 20 };
    if (lvl >= 25) return { name: "Легендарний", color: "gold", min: 12, max: 15 };
    if (lvl >= 20) return { name: "Епічний", color: "orange", min: 9, max: 12 };
    if (lvl >= 15) return { name: "Особливий", color: "violet", min: 7, max: 9 };
    if (lvl >= 10) return { name: "Рідкісний", color: "deepskyblue", min: 5, max: 7 };
    if (lvl >= 5) return { name: "Незвичний", color: "lime", min: 3, max: 5 };

    return { name: "Звичайний", color: "white", min: 2, max: 3 };
}

function getItem() {
    const rarity = getRarity();

    const items = [
        { name: "Шолом", type: "helmet", icon: "🪖" },
        { name: "Броня", type: "armor", icon: "🛡️" },
        { name: "Штани", type: "pants", icon: "👖" },
        { name: "Чоботи", type: "boots", icon: "👢" },
        { name: "Меч", type: "weapon", icon: "⚔️" }
    ];

    const base = items[Math.floor(Math.random() * items.length)];
    const itemPower = Math.floor(Math.random() * (rarity.max - rarity.min + 1)) + rarity.min;

    return {
        name: rarity.name + " " + base.name,
        type: base.type,
        icon: base.icon,
        power: itemPower,
        color: rarity.color
    };
}

function generateEnemy() {
    const enemies = [
        { name: "Злий солдат", icon: "🧟‍♂️", mult: 1 },
        { name: "Темний лицар", icon: "🧛‍♂️", mult: 1.25 },
        { name: "Ворожий командир", icon: "👹", mult: 1.5 },
        { name: "Королівський кат", icon: "☠️", mult: 1.8 }
    ];

    const enemy = enemies[Math.floor(Math.random() * enemies.length)];
    const basePower = 10 * Math.pow(1.15, gameData.hero.level - 1);
    const random = 0.85 + Math.random() * 0.35;

    return {
        name: enemy.name,
        icon: enemy.icon,
        power: Math.floor(basePower * enemy.mult * random),
        reward: Math.floor(50 * enemy.mult),
        exp: Math.floor(25 * enemy.mult)
    };
}

function generateRaidEnemy() {
    const raids = [
        { name: "Бандити", icon: "🗡️", minPower: 30, maxPower: 50, minArmy: 3, reward: 120 },
        { name: "Розбійники", icon: "🏹", minPower: 50, maxPower: 80, minArmy: 5, reward: 200 },
        { name: "Лицарі", icon: "🛡️", minPower: 80, maxPower: 120, minArmy: 8, reward: 350 },
        { name: "Елітна гвардія", icon: "👑", minPower: 120, maxPower: 180, minArmy: 12, reward: 600 }
    ];

    const raid = raids[Math.floor(Math.random() * raids.length)];

    return {
        name: raid.name,
        icon: raid.icon,
        power: Math.floor(Math.random() * (raid.maxPower - raid.minPower + 1)) + raid.minPower,
        army: raid.minArmy,
        reward: raid.reward
    };
}

function show(section) {
    if (section === "hero") {
        content.innerHTML = `
            <h2>Герой</h2>
            <div style="font-size:120px;">🧙‍♂️</div>
            Сила: ${gameData.hero.attack}<br>
            Рівень: ${gameData.hero.level}<br>
            Досвід: ${gameData.hero.exp}/${gameData.hero.expMax}<br><br>

            🪖 ${fmt(gameData.equipped.helmet)}<br>
            🛡️ ${fmt(gameData.equipped.armor)}<br>
            👖 ${fmt(gameData.equipped.pants)}<br>
            👢 ${fmt(gameData.equipped.boots)}<br>
            ⚔️ ${fmt(gameData.equipped.weapon)}
        `;
    }

    if (section === "castle") {
        content.innerHTML = `
            <h2>Замок</h2>
            <div style="font-size:100px;">🏰</div>
            Рівень замку: ${gameData.castleLevel}<br>
            Ціна покращення: ${castlePrice()} золота<br>
            <button onclick="upgradeCastle()">Покращити замок</button>

            <h3>Будівлі</h3>

            🏹 Казарма: ${gameData.buildings.barracks}<br>
            Відкриває сильніші війська<br>
            Ціна: ${buildingPrice("barracks")} золота<br>
            <button onclick="upgradeBuilding('barracks')">Покращити казарму</button><br><br>

            ⚒️ Кузня: ${gameData.buildings.forge}<br>
            Дає +2 сили за рівень<br>
            Ціна: ${buildingPrice("forge")} золота<br>
            <button onclick="upgradeBuilding('forge')">Покращити кузню</button><br><br>

            📚 Академія: ${gameData.buildings.academy}<br>
            Розвиток героя<br>
            Ціна: ${buildingPrice("academy")} золота<br>
            <button onclick="upgradeBuilding('academy')">Покращити академію</button>
        `;
    }

    if (section === "war") {
        currentEnemy = generateEnemy();

        content.innerHTML = `
            <h2>Бій</h2>
            <div style="font-size:100px;">${currentEnemy.icon}</div>
            Ворог: ${currentEnemy.name}<br>
            Сила ворога: ${currentEnemy.power}<br>
            Нагорода: ${currentEnemy.reward} золота<br>
            Досвід: ${currentEnemy.exp}<br><br>
            <button onclick="fight()">Битися</button>
        `;
    }

    if (section === "train") {
        content.innerHTML = `
            <h2>Тренування</h2>

            💪 Сила: ${gameData.hero.strength}<br>
            Ціна: ${trainPrice("strength")} золота<br>
            <button onclick="train('strength')">+2 атаки</button><br><br>

            🛡️ Витривалість: ${gameData.hero.endurance}<br>
            Ціна: ${trainPrice("endurance")} золота<br>
            <button onclick="train('endurance')">+1 атака</button><br><br>

            ❤️ Живучість: ${gameData.hero.vitality}<br>
            Ціна: ${trainPrice("vitality")} золота<br>
            <button onclick="train('vitality')">+1 атака</button>
        `;
    }

    if (section === "inventory") {
        content.innerHTML = `
            <h2>Сумка</h2>
            ${
                gameData.inventory.length === 0
                ? "Порожньо"
                : gameData.inventory.map((item, index) => `
                    <div style="color:${item.color}">
                        ${item.icon} ${item.name} (+${item.power})
                        <button onclick="equip(${index})">Одягнути</button>
                    </div>
                `).join("")
            }
        `;
    }

    if (section === "army") {
        content.innerHTML = `
            <h2>Армія</h2>
            <div style="font-size:90px;">🛡️⚔️🧍‍♂️🏹🐎</div>

            ⚔️ Мечники: ${gameData.army.swordsmen}<br>
            +1 сила, ціна 30<br>
            <button onclick="hireArmy('swordsmen')">Найняти мечника</button><br><br>

            🏹 Лучники: ${gameData.army.archers}<br>
            +2 сила, ціна 80<br>
            ${gameData.buildings.barracks >= 2
                ? `<button onclick="hireArmy('archers')">Найняти лучника</button>`
                : "Потрібна казарма 2 рівня"}<br><br>

            🐎 Лицарі: ${gameData.army.knights}<br>
            +5 сила, ціна 200<br>
            ${gameData.buildings.barracks >= 3
                ? `<button onclick="hireArmy('knights')">Найняти лицаря</button>`
                : "Потрібна казарма 3 рівня"}<br><br>

            Загальна сила армії: ${armyPower()}
        `;
    }

    if (section === "raid") {
        const raid = generateRaidEnemy();

        content.innerHTML = `
            <h2>Рейд</h2>
            <div style="font-size:100px;">${raid.icon}</div>
            Ворог: ${raid.name}<br>
            Сила ворога: ${raid.power}<br>
            Потрібно солдатів: ${raid.army}<br>
            Нагорода: ${raid.reward} золота + шанс предмета<br><br>

            Твоя сила: ${gameData.hero.attack}<br>
            Твої солдати: ${totalArmy()}<br><br>

            <button onclick="startRaid(${raid.power}, ${raid.army}, ${raid.reward})">Почати рейд</button>
        `;
    }

    if (section === "pvp") loadPvP();
    if (section === "chat") loadChat();
    if (section === "rating") loadRating();
}

async function upgradeCastle() {
    const price = castlePrice();

    if (gameData.gold < price) {
        alert("Недостатньо золота");
        return;
    }

    gameData.gold -= price;
    gameData.castleLevel++;

    recalc();
    await save();
    updateUI();
    show("castle");
}

async function upgradeBuilding(type) {
    const price = buildingPrice(type);

    if (gameData.gold < price) {
        alert("Недостатньо золота");
        return;
    }

    gameData.gold -= price;
    gameData.buildings[type]++;

    recalc();
    await save();
    updateUI();
    show("castle");
}

async function train(type) {
    const price = trainPrice(type);

    if (gameData.gold < price) {
        alert("Недостатньо золота");
        return;
    }

    gameData.gold -= price;
    gameData.hero[type]++;

    recalc();
    await save();
    updateUI();
    show("train");
}

async function fight() {
    if (!currentEnemy) currentEnemy = generateEnemy();

    if (gameData.hero.attack >= currentEnemy.power) {
        gameData.gold += currentEnemy.reward;
        gameData.hero.exp += currentEnemy.exp;

        if (Math.random() < 0.7) {
            gameData.inventory.push(getItem());
        }

        alert("Перемога!");
    } else {
        alert("Поразка. Прокачай героя або армію.");
    }

    checkLevelUp();
    recalc();
    await save();
    updateUI();
    show("war");
}

function checkLevelUp() {
    while (gameData.hero.exp >= gameData.hero.expMax) {
        gameData.hero.exp -= gameData.hero.expMax;
        gameData.hero.level++;
        gameData.hero.expMax = Math.floor(gameData.hero.expMax * 1.35);
        gameData.gold += 100;
        gameData.inventory.push(getItem());
        alert("Новий рівень! +100 золота і предмет.");
    }
}

async function equip(index) {
    const item = gameData.inventory[index];

    gameData.equipped[item.type] = item;
    gameData.inventory.splice(index, 1);

    recalc();
    await save();
    updateUI();
    show("inventory");
}

async function hireArmy(type) {
    const costs = {
        swordsmen: 30,
        archers: 80,
        knights: 200
    };

    if (type === "archers" && gameData.buildings.barracks < 2) {
        alert("Потрібна казарма 2 рівня");
        return;
    }

    if (type === "knights" && gameData.buildings.barracks < 3) {
        alert("Потрібна казарма 3 рівня");
        return;
    }

    if (gameData.gold < costs[type]) {
        alert("Недостатньо золота");
        return;
    }

    gameData.gold -= costs[type];
    gameData.army[type]++;

    recalc();
    await save();
    updateUI();
    show("army");
}

function totalArmy() {
    return gameData.army.swordsmen + gameData.army.archers + gameData.army.knights;
}

async function startRaid(enemyPower, enemyArmy, reward) {
    if (gameData.hero.attack < enemyPower || totalArmy() < enemyArmy) {
        alert("Недостатньо сили або армії");
        return;
    }

    gameData.gold += reward;
    gameData.hero.exp += 60;

    if (Math.random() < 0.7) {
        gameData.inventory.push(getItem());
    }

    alert("Перемога в рейді!");

    checkLevelUp();
    recalc();
    await save();
    updateUI();
    show("raid");
}

async function loadRating() {
    const snap = await db.collection("players")
        .orderBy("level", "desc")
        .limit(20)
        .get();

    let html = `<h2>🏆 Рейтинг</h2>`;

    snap.forEach(doc => {
        const p = doc.data();
        html += `<div>${p.nick || p.login} — рівень ${p.level || 1}, сила ${p.power || 10}</div>`;
    });

    content.innerHTML = html;
}

async function loadPvP() {
    const snap = await db.collection("players")
        .orderBy("power", "desc")
        .limit(20)
        .get();

    let html = `<h2>👥 PvP</h2>`;

    snap.forEach(doc => {
        if (doc.id === playerId) return;

        const p = doc.data();

        html += `
            <div>
                ${p.nick || p.login} — сила ${p.power || 10}, рівень ${p.level || 1}
                <button onclick="attackPlayer('${doc.id}', ${p.power || 10})">Атакувати</button>
            </div>
        `;
    });

    content.innerHTML = html;
}

async function attackPlayer(targetId, targetPower) {
    if (gameData.hero.attack >= targetPower) {
        gameData.gold += 100;
        gameData.hero.exp += 40;

        if (Math.random() < 0.5) {
            gameData.inventory.push(getItem());
        }

        alert("Перемога в PvP!");
    } else {
        alert("Поразка в PvP");
    }

    checkLevelUp();
    recalc();
    await save();
    updateUI();
    show("pvp");
}

function loadChat() {
    db.collection("chat")
        .orderBy("time")
        .limit(50)
        .onSnapshot(snapshot => {
            let html = `
                <h2>💬 Чат</h2>
                <div style="height:220px;overflow:auto;background:#111;padding:10px;border-radius:10px;">
            `;

            snapshot.forEach(doc => {
                const msg = doc.data();
                html += `<div><b>${msg.user}</b>: ${msg.text}</div>`;
            });

            html += `
                </div><br>
                <input id="msg" placeholder="Напиши повідомлення">
                <button onclick="sendMessage()">Відправити</button>
            `;

            content.innerHTML = html;
        });
}

async function sendMessage() {
    const input = document.getElementById("msg");
    const text = input.value.trim();

    if (!text) return;

    const snap = await playerRef.get();
    const player = snap.data();

    await db.collection("chat").add({
        user: player.nick || player.login,
        text: text,
        time: Date.now()
    });

    input.value = "";
}

function fmt(item) {
    return item
        ? `<span style="color:${item.color}">${item.name} (+${item.power})</span>`
        : "—";
}