const gold = document.getElementById("gold");
const diamonds = document.getElementById("diamonds");
const power = document.getElementById("power");
const level = document.getElementById("level");
const content = document.getElementById("content");
const expFill = document.getElementById("expFill");

let gameData;
let playerId;
let playerRef;
let currentEnemy = null;
let chatUnsubscribe = null;

function defaultGame() {
    return {
        hero: {
            level: 1,
            exp: 0,
            expMax: 100,
            strength: 0,
            endurance: 0,
            vitality: 0,
            attack: 10,
            heroClass: "mage",
        },
        gold: 500,
        diamonds: 5,
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
        
        armyHired: {
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
}, // ← ОЦЕ ДОДАЙ

equipmentPower: {
    helmet: 0,
    armor: 0,
    pants: 0,
    boots: 0,
    weapon: 0
},
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

    const emailLogin = authFirebase.currentUser?.email?.split("@")[0] || "player";

    await playerRef.set({
        uid: uid,
        nick: data.nick || data.login || emailLogin,
        login: data.login || emailLogin,
        level: gameData.hero.level,
        power: gameData.hero.attack,
        gold: gameData.gold,
        diamonds: gameData.diamonds,
        game: gameData,
        updatedAt: Date.now()
    }, { merge: true });

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
    if (gameData.diamonds === undefined) gameData.diamonds = 5;
    if (gameData.castleLevel === undefined) gameData.castleLevel = 1;

    if (!Array.isArray(gameData.inventory)) gameData.inventory = [];

    if (!gameData.buildings) gameData.buildings = def.buildings;
    if (gameData.buildings.barracks === undefined) gameData.buildings.barracks = 1;
    if (gameData.buildings.forge === undefined) gameData.buildings.forge = 1;
    if (gameData.buildings.academy === undefined) gameData.buildings.academy = 1;

    if (!gameData.army || typeof gameData.army === "number") gameData.army = def.army;
    if (gameData.army.swordsmen === undefined) gameData.army.swordsmen = 0;
    if (gameData.army.archers === undefined) gameData.army.archers = 0;
    if (gameData.army.knights === undefined) gameData.army.knights = 0;

    if (!gameData.equipped) gameData.equipped = def.equipped;
    if (gameData.equipped.helmet === undefined) gameData.equipped.helmet = null;
    if (gameData.equipped.armor === undefined) gameData.equipped.armor = null;
    if (gameData.equipped.pants === undefined) gameData.equipped.pants = null;
    if (gameData.equipped.boots === undefined) gameData.equipped.boots = null;
    if (gameData.equipped.weapon === undefined) gameData.equipped.weapon = null;
    if (gameData.hero.heroClass === undefined) gameData.hero.heroClass = "mage";

    if (!gameData.equipmentPower) {
    gameData.equipmentPower = {
        helmet: 0,
        armor: 0,
        pants: 0,
        boots: 0,
        weapon: 0
    };
}

if (!gameData.armyHired) {
    gameData.armyHired = {
        swordsmen: gameData.army?.swordsmen || 0,
        archers: gameData.army?.archers || 0,
        knights: gameData.army?.knights || 0
    };
}
}
function armyHirePrice(type) {
    const base = {
        swordsmen: 30,
        archers: 80,
        knights: 200
    };

    return Math.floor(base[type] * Math.pow(1.2, gameData.armyHired[type] || 0));
}


async function save() {
    if (!playerRef) return;

    const snap = await playerRef.get();
    const old = snap.data() || {};
    const emailLogin = authFirebase.currentUser?.email?.split("@")[0] || "player";

    await playerRef.set({
        uid: playerId,
        nick: old.nick || old.login || emailLogin,
        login: old.login || emailLogin,
        game: gameData,
        level: gameData.hero.level,
        power: gameData.hero.attack,
        gold: gameData.gold,
        diamonds: gameData.diamonds,
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

    if (gameData.equipmentPower) {
        atk += gameData.equipmentPower.helmet || 0;
        atk += gameData.equipmentPower.armor || 0;
        atk += gameData.equipmentPower.pants || 0;
        atk += gameData.equipmentPower.boots || 0;
        atk += gameData.equipmentPower.weapon || 0;
    }

    gameData.hero.attack = atk;
}

function updateUI() {
    gold.innerText = gameData.gold;
    if (diamonds) diamonds.innerText = gameData.diamonds;
    power.innerText = gameData.hero.attack;
    level.innerText = gameData.hero.level;

    let percent = Math.floor((gameData.hero.exp / gameData.hero.expMax) * 100);
    expFill.style.width = percent + "%";
    expFill.innerText = percent + "%";
}

function castlePrice() {
    return 100 * Math.pow(2, gameData.castleLevel - 1);
}

function canUpgradeCastle() {
    return gameData.buildings.barracks >= gameData.castleLevel &&
           gameData.buildings.forge >= gameData.castleLevel &&
           gameData.buildings.academy >= gameData.castleLevel;
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

function totalArmy() {
    return gameData.army.swordsmen + gameData.army.archers + gameData.army.knights;
}

function armyPower() {
    return gameData.army.swordsmen * 1 +
           gameData.army.archers * 2 +
           gameData.army.knights * 5;
}

function getDropRarity() {
    const lvl = gameData.hero.level;

    if (lvl >= 30) return { name: "Міфічний", color: "red", min: 15, max: 20 };
    if (lvl >= 25) return { name: "Легендарний", color: "gold", min: 12, max: 15 };
    if (lvl >= 20) return { name: "Епічний", color: "orange", min: 9, max: 12 };
    if (lvl >= 15) return { name: "Особливий", color: "violet", min: 7, max: 9 };
    if (lvl >= 10) return { name: "Рідкісний", color: "deepskyblue", min: 5, max: 7 };
    if (lvl >= 5) return { name: "Незвичний", color: "lime", min: 3, max: 5 };

    return { name: "Звичайний", color: "white", min: 2, max: 3 };
}

function getShopRarity() {
    const lvl = gameData.hero.level;

    if (lvl >= 15) return { name: "Легендарний", color: "gold", min: 12, max: 15 };
    if (lvl >= 10) return { name: "Епічний", color: "orange", min: 9, max: 12 };
    if (lvl >= 5) return { name: "Особливий", color: "violet", min: 7, max: 9 };

    return { name: "Рідкісний", color: "deepskyblue", min: 5, max: 7 };
}

function shopPrice() {
    const lvl = gameData.hero.level;

    if (lvl >= 15) return 10;
    if (lvl >= 10) return 7;
    if (lvl >= 5) return 5;

    return 3;
}

function makeItem(rarity, forcedType = null) {
    const items = [
        { name: "Шолом", type: "helmet", icon: "🪖" },
        { name: "Броня", type: "armor", icon: "🛡️" },
        { name: "Штани", type: "pants", icon: "👖" },
        { name: "Чоботи", type: "boots", icon: "👢" },
        { name: "Меч", type: "weapon", icon: "⚔️" }
    ];

    const base = forcedType
        ? items.find(i => i.type === forcedType)
        : items[Math.floor(Math.random() * items.length)];

    const itemPower = Math.floor(Math.random() * (rarity.max - rarity.min + 1)) + rarity.min;

    return {
        name: rarity.name + " " + base.name,
        type: base.type,
        icon: base.icon,
        power: itemPower,
        color: rarity.color
    };
}

function getItem() {
    return makeItem(getDropRarity());
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
function heroImage() {
    const heroes = {
        mage: "images/mage.png",
        knight: "images/knight.png",
        barbarian: "images/barbarian.png",
        elf: "images/elf.png",
        druid: "images/druid.png",
        vampire: "images/vampire.png"
    };

    return heroes[gameData.hero.heroClass] || "images/elf.png";
}

function heroName() {
    const names = {
        mage: "Маг",
        knight: "Рицар",
        barbarian: "Варвар",
        elf: "Ельф",
        druid: "Друїд",
        vampire: "Вампір"
    };

    return names[gameData.hero.heroClass] || "Маг";
}

function show(section) {
    if (section !== "chat" && chatUnsubscribe) {
        chatUnsubscribe();
        chatUnsubscribe = null;
    }

    if (section === "hero") {
        content.innerHTML = `
            <h2>Герой</h2>
            <img src="${heroImage()}" class="hero-img">
            Клас: ${heroName()}<br>
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
            <div style="font-size:110px;">🏰</div>
            Рівень замку: ${gameData.castleLevel}<br>
            Ціна покращення: ${castlePrice()} золота<br>
            ${
                canUpgradeCastle()
                ? `<button onclick="upgradeCastle()">Покращити замок</button>`
                : `<p style="color:#ff7777;">Щоб покращити замок, прокачай усі будівлі до ${gameData.castleLevel} рівня.</p>`
            }

            <h3>Будівлі</h3>

            <div style="font-size:70px;">🏹</div>
            <b>Казарма:</b> ${gameData.buildings.barracks}<br>
            Відкриває лучників і лицарів<br>
            Ціна: ${buildingPrice("barracks")} золота<br>
            <button onclick="upgradeBuilding('barracks')">Покращити казарму</button><br><br>

            <div style="font-size:70px;">⚒️</div>
            <b>Кузня:</b> ${gameData.buildings.forge}<br>
            Дає +2 сили за рівень<br>
            Ціна: ${buildingPrice("forge")} золота<br>
            <button onclick="upgradeBuilding('forge')">Покращити кузню</button><br><br>

            <div style="font-size:70px;">📚</div>
            <b>Академія:</b> ${gameData.buildings.academy}<br>
            Будівля розвитку героя<br>
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
        <button onclick="equipAll()">Одягнути все</button><br><br>
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
            +1 сила, ціна ${armyHirePrice("swordsmen")}<br>
            <button onclick="hireArmy('swordsmen')">Найняти мечника</button><br><br>

            🏹 Лучники: ${gameData.army.archers}<br>
            +2 сила, ціна ${armyHirePrice("archers")}<br>
            ${gameData.buildings.barracks >= 2
                ? `<button onclick="hireArmy('archers')">Найняти лучника</button>`
                : "Потрібна казарма 2 рівня"}<br><br>

            🐎 Лицарі: ${gameData.army.knights}<br>
            +5 сила, ціна ${armyHirePrice("knights")}<br>
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
    if (section === "settings") {
    content.innerHTML = `
        <h2>⚙️ Налаштування</h2>
        <h3>Зміна героя</h3>

        <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:12px;">
            <button onclick="changeHero('mage')">
                <div style="font-size:55px;">🧙‍♂️</div>
                Маг
            </button>

            <button onclick="changeHero('knight')">
                <div style="font-size:55px;">🤺</div>
                Рицар
            </button>

            <button onclick="changeHero('barbarian')">
                <div style="font-size:55px;">🪓</div>
                Варвар
            </button>

            <button onclick="changeHero('elf')">
                <div style="font-size:55px;">🧝‍♂️</div>
                Ельф
            </button>

            <button onclick="changeHero('druid')">
                <div style="font-size:55px;">🌿🧙</div>
                Друїд
            </button>

            <button onclick="changeHero('vampire')">
                <div style="font-size:55px;">🧛‍♂️</div>
                Вампір
            </button>
        </div>
    `;
}

if (section === "shop") {
    const r = getShopRarity();
    const price = shopPrice();

    content.innerHTML = `
        <h2>💎 Магазин</h2>
        Алмази: ${gameData.diamonds}<br>
        Предмети магазину: <span style="color:${r.color}">${r.name}</span><br>
        Ціна за предмет: ${price} 💎<br><br>

        <div style="font-size:55px;">🪖</div>
        <button onclick="buyShopItem('helmet')">Купити шолом</button><br><br>

        <div style="font-size:55px;">🛡️</div>
        <button onclick="buyShopItem('armor')">Купити броню</button><br><br>

        <div style="font-size:55px;">👖</div>
        <button onclick="buyShopItem('pants')">Купити штани</button><br><br>

        <div style="font-size:55px;">👢</div>
        <button onclick="buyShopItem('boots')">Купити чоботи</button><br><br>

        <div style="font-size:55px;">⚔️</div>
        <button onclick="buyShopItem('weapon')">Купити меч</button>
    `;
}

    if (section === "pvp") loadPvP();
    if (section === "chat") loadChat();
    if (section === "rating") loadRating();
    if (section === "friends") loadFriends();


async function upgradeCastle() {
    if (!canUpgradeCastle()) {
        alert("Спочатку прокачай усі будівлі до рівня замку.");
        return;
    }

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

        if (Math.random() < 0.7) gameData.inventory.push(getItem());

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

        const diamondsReward = gameData.hero.level * 2;

        gameData.hero.expMax = Math.floor(gameData.hero.expMax * 1.35);
        gameData.gold += 100;
        gameData.diamonds += diamondsReward;
        gameData.inventory.push(getItem());

        alert(`Новий рівень! +100 золота, +${diamondsReward} алмазів і предмет.`);
    }
}

function armyHirePrice(type) {
    if (!gameData.armyHired) {
        gameData.armyHired = {
            swordsmen: 0,
            archers: 0,
            knights: 0
        };
    }

    const base = {
        swordsmen: 30,
        archers: 80,
        knights: 200
    };

    return Math.floor(base[type] * Math.pow(1.2, gameData.armyHired[type]));
}

async function buyShopItem(type) {
    const price = shopPrice();

    if (gameData.diamonds < price) {
        alert("Недостатньо алмазів");
        return;
    }

    gameData.diamonds -= price;
    gameData.inventory.push(makeItem(getShopRarity(), type));

    await save();
    updateUI();
    show("shop");

    alert("Предмет куплено і додано в сумку.");
}

async function equip(index) {
    const item = gameData.inventory[index];

    if (!gameData.equipmentPower) {
    gameData.equipmentPower = {
        helmet: 0,
        armor: 0,
        pants: 0,
        boots: 0,
        weapon: 0
    };
}


    gameData.equipmentPower[item.type] += item.power;

    gameData.equipped[item.type] = {
        name: item.name,
        type: item.type,
        icon: item.icon,
        power: gameData.equipmentPower[item.type],
        color: item.color
    };

    gameData.inventory.splice(index, 1);

    recalc();
    await save();
    updateUI();
    show("hero");
}

async function hireArmy(type) {
    if (type === "archers" && gameData.buildings.barracks < 2) {
        alert("Потрібна казарма 2 рівня");
        return;
    }

    if (type === "knights" && gameData.buildings.barracks < 3) {
        alert("Потрібна казарма 3 рівня");
        return;
    }

    const price = armyHirePrice(type);

    if (gameData.gold < price) {
        alert("Недостатньо золота");
        return;
    }

    gameData.gold -= price;
    gameData.army[type]++;
    gameData.armyHired[type]++;

    recalc();
    await save();
    updateUI();
    show("army");
}

async function startRaid(enemyPower, enemyArmy, reward) {
    if (gameData.hero.attack < enemyPower || totalArmy() < enemyArmy) {
        alert("Недостатньо сили або армії");
        return;
    }

    gameData.gold += reward;
    gameData.hero.exp += 60;

    if (Math.random() < 0.7) gameData.inventory.push(getItem());

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
        .limit(50)
        .get();

    let html = `<h2>🏆 Рейтинг гравців</h2>`;

    snap.forEach(doc => {
        const p = doc.data();
        if (!p.nick && !p.login) return;

        html += `
            <div style="margin:10px;padding:10px;background:#2b1a10;border-radius:10px;">
                <b>${p.nick || p.login}</b><br>
                Рівень: ${p.level || 1}<br>
                Сила: ${p.power || 10}<br>
                ${doc.id !== playerId ? `
                    <button onclick="addFriend('${doc.id}', '${p.nick || p.login}')">🤝 Додати в друзі</button>
                ` : `<span>Це ти</span>`}
            </div>
        `;
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
        if (!p.nick && !p.login) return;

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

        if (Math.random() < 0.5) gameData.inventory.push(getItem());

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
    content.innerHTML = `
        <h2>💬 Чат</h2>
        <div id="chatBox" style="height:220px;overflow:auto;background:#111;padding:10px;border-radius:10px;"></div>
        <br>
        <input id="msg" placeholder="Напиши повідомлення">
        <button onclick="sendMessage()">Відправити</button>
    `;

    const chatBox = document.getElementById("chatBox");

    chatUnsubscribe = db.collection("chat")
        .orderBy("time")
        .limit(50)
        .onSnapshot(snapshot => {
            let html = "";

            snapshot.forEach(doc => {
                const msg = doc.data();
                html += `<div><b>${msg.user || "Гравець"}</b>: ${msg.text}</div>`;
            });

            chatBox.innerHTML = html;
            chatBox.scrollTop = chatBox.scrollHeight;
        });
}

async function sendMessage() {
    const input = document.getElementById("msg");
    const text = input.value.trim();

    if (!text) return;

    const snap = await playerRef.get();
    const player = snap.data() || {};

    await db.collection("chat").add({
        user: player.nick || player.login || "Гравець",
        text: text,
        time: Date.now()
    });

    input.value = "";
}

async function addFriend(friendId, friendName) {
    if (friendId === playerId) {
        alert("Не можна додати себе");
        return;
    }

    await db.collection("players")
        .doc(playerId)
        .collection("friends")
        .doc(friendId)
        .set({
            id: friendId,
            name: friendName,
            addedAt: Date.now()
        });

    alert(friendName + " доданий у друзі!");
}

async function loadFriends() {
    const snap = await db.collection("players")
        .doc(playerId)
        .collection("friends")
        .orderBy("addedAt", "desc")
        .get();

    let html = `<h2>🤝 Мої друзі</h2>`;

    if (snap.empty) {
        html += `<p>У тебе ще немає друзів.</p>`;
    }

    snap.forEach(doc => {
        const f = doc.data();

        html += `
            <div style="margin:10px;padding:10px;background:#2b1a10;border-radius:10px;">
                🤝 ${f.name}
            </div>
        `;
    });

    content.innerHTML = html;
}

async function changeHero(type) {
    gameData.hero.heroClass = type;

    await save();
    updateUI();
    show("hero");

    alert("Героя змінено!");
}

async function equipAll() {
    if (!gameData.inventory || gameData.inventory.length === 0) {
        alert("Сумка порожня");
        return;
    }

    if (!gameData.equipmentPower) {
        gameData.equipmentPower = {
            helmet: 0,
            armor: 0,
            pants: 0,
            boots: 0,
            weapon: 0
        };
    }

    gameData.inventory.forEach(item => {
        gameData.equipmentPower[item.type] += item.power;

        gameData.equipped[item.type] = {
            name: item.name,
            type: item.type,
            icon: item.icon,
            power: gameData.equipmentPower[item.type],
            color: item.color
        };
    });

    gameData.inventory = [];

    recalc();
    await save();
    updateUI();
    show("hero");

    alert("Усе одягнуто!");
}
 async function equipAll() {
    if (!gameData.inventory || gameData.inventory.length === 0) {
        alert("Сумка порожня");
        return;
    }

    if (!gameData.equipmentPower) {
        gameData.equipmentPower = {
            helmet: 0,
            armor: 0,
            pants: 0,
            boots: 0,
            weapon: 0
        };
    }

    gameData.inventory.forEach(item => {
        gameData.equipmentPower[item.type] += item.power;

        gameData.equipped[item.type] = {
            name: item.name,
            type: item.type,
            icon: item.icon,
            power: gameData.equipmentPower[item.type],
            color: item.color
        };
    });

    gameData.inventory = [];

    recalc();
    await save();
    updateUI();
    show("hero");

    alert("Усе одягнуто!");
}
    }
function fmt(item) {
    return item
        ? `<span style="color:${item.color}">${item.name} (+${item.power} сили)</span>`
        : "—";
}