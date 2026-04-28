const gold=document.getElementById("gold");
const power=document.getElementById("power");
const level=document.getElementById("level");
const content=document.getElementById("content");
const expFill=document.getElementById("expFill");

let gameData,user,saveKey;

function startGame(){
user=JSON.parse(localStorage.getItem("currentUser"));
saveKey="save_"+user.login;

let save=JSON.parse(localStorage.getItem(saveKey));

if(!save){
gameData={
hero:{level:1,exp:0,expMax:100,strength:0,endurance:0,vitality:0},
gold:500,
inventory:[],
army:0,
castleLevel:1,
equipped:{helmet:null,armor:null,pants:null,boots:null,weapon:null}
};
}else gameData=save;

if(gameData.army===undefined) gameData.army=0;
if(gameData.castleLevel===undefined) gameData.castleLevel=1;
if(!gameData.equipped) gameData.equipped={helmet:null,armor:null,pants:null,boots:null,weapon:null};

recalc();
updateUI();
show("hero");
}

function save(){localStorage.setItem(saveKey,JSON.stringify(gameData));}

function recalc(){
let atk=10;
atk+=gameData.hero.strength*2;
atk+=gameData.hero.endurance;
atk+=gameData.hero.vitality;
atk+=gameData.army*1;

for(let k in gameData.equipped){
if(gameData.equipped[k]) atk+=gameData.equipped[k].power;
}
gameData.hero.attack=atk;
}

function updateUI(){
gold.innerText=gameData.gold;
power.innerText=gameData.hero.attack;
level.innerText=gameData.hero.level;
let p=Math.floor(gameData.hero.exp/gameData.hero.expMax*100);
expFill.style.width=p+"%";
expFill.innerText=p+"%";
}

function getItem(){
let lvl=gameData.hero.level;
let r={name:"Звичайний",color:"white",min:2,max:3};

if(lvl>=30) r={name:"Міфічний",color:"red",min:15,max:20};
else if(lvl>=25) r={name:"Легендарний",color:"gold",min:12,max:15};
else if(lvl>=20) r={name:"Епічний",color:"orange",min:9,max:12};
else if(lvl>=15) r={name:"Особливий",color:"violet",min:7,max:9};
else if(lvl>=10) r={name:"Рідкісний",color:"deepskyblue",min:5,max:7};
else if(lvl>=5) r={name:"Незвичний",color:"lime",min:3,max:5};

let items=[
{name:"Шолом",type:"helmet",icon:"🪖"},
{name:"Броня",type:"armor",icon:"🛡️"},
{name:"Штани",type:"pants",icon:"👖"},
{name:"Чоботи",type:"boots",icon:"👢"},
{name:"Меч",type:"weapon",icon:"⚔️"}
];

let b=items[Math.floor(Math.random()*items.length)];
let itemPower=Math.floor(Math.random()*(r.max-r.min+1))+r.min;

return {...b,name:r.name+" "+b.name,power:itemPower,color:r.color};
}

function show(s){

if(s==="hero"){
content.innerHTML=`
<h2>Герой</h2>
<div style="font-size:120px;">🧙‍♂️</div>
Сила: ${gameData.hero.attack}<br>
Рівень: ${gameData.hero.level}<br><br>
🪖 ${fmt(gameData.equipped.helmet)}<br>
🛡️ ${fmt(gameData.equipped.armor)}<br>
👖 ${fmt(gameData.equipped.pants)}<br>
👢 ${fmt(gameData.equipped.boots)}<br>
⚔️ ${fmt(gameData.equipped.weapon)}
`;
}

if(s==="castle"){
content.innerHTML=`
<h2>Замок</h2>
<div style="font-size:100px;">🏰</div>
Рівень: ${gameData.castleLevel}<br>
<button onclick="upgradeCastle()">Покращити (100)</button>
`;
}

if(s==="war"){
let e=10+gameData.hero.level*3;
content.innerHTML=`
<h2>Бій</h2>
<div style="font-size:90px;">😈</div>
Сила ворога: ${e}<br>
<button onclick="fight(${e})">Бій</button>
`;
}

if(s==="train"){
content.innerHTML=`
<h2>Тренування</h2>
💪 Сила: ${gameData.hero.strength}
<button onclick="train('strength')">+2 атаки (20)</button><br>
🛡️ Витривалість: ${gameData.hero.endurance}
<button onclick="train('endurance')">+1 атака (20)</button><br>
❤️ Живучість: ${gameData.hero.vitality}
<button onclick="train('vitality')">+1 атака (20)</button>
`;
}

if(s==="inventory"){
content.innerHTML=gameData.inventory.map((i,x)=>`
<div style="color:${i.color}">
${i.icon} ${i.name} (+${i.power})
<button onclick="equip(${x})">Одягнути</button>
</div>`).join("")||"Порожньо";
}

if(s==="army"){
content.innerHTML=`
<h2>Армія</h2>
<div style="font-size:90px;">🛡️🧍‍♂️🧍‍♂️🧍‍♂️</div>
Солдати: ${gameData.army}<br>
Кожен солдат дає +1 до сили.<br>
<button onclick="hireArmy()">Найняти солдата (30)</button>
`;
}

if(s==="raid"){

let r = generateRaidEnemy();

content.innerHTML=`
<h2>⚔️ Рейд</h2>

<div style="font-size:90px;">${r.icon}</div>

Ворог: ${r.name}<br>
Сила ворога: ${r.power}<br>
Потрібно солдатів: ${r.army}<br>
Нагорода: ${r.reward} золота<br><br>

Твоя сила: ${gameData.hero.attack}<br>
Твоя армія: ${gameData.army}<br><br>

<button onclick="startRaid(${r.power}, ${r.army}, ${r.reward})">Напасти</button>
`;
}

if(s==="chat"){
loadChat();
}

}

function fight(e){
if(gameData.hero.attack>e){
gameData.gold+=50;
gameData.hero.exp+=20;
gameData.inventory.push(getItem());
alert("Перемога! +50 золота і предмет у сумку.");
}else{
alert("Поразка. Прокачай героя або армію.");
}

checkLevelUp();
recalc();
save();
updateUI();
}

function checkLevelUp(){
while(gameData.hero.exp>=gameData.hero.expMax){
gameData.hero.exp-=gameData.hero.expMax;
gameData.hero.level++;
gameData.hero.expMax+=50;
gameData.gold+=100;
gameData.inventory.push(getItem());
alert("Новий рівень! +100 золота і бонусний предмет.");
}
}

function train(t){
if(gameData.gold<20){
alert("Недостатньо золота");
return;
}

gameData.gold-=20;
gameData.hero[t]++;

recalc();
save();
updateUI();
show("train");
}

function equip(i){
let item=gameData.inventory[i];
gameData.equipped[item.type]=item;
gameData.inventory.splice(i,1);

recalc();
save();
updateUI();
show("inventory");
}

function hireArmy(){
if(gameData.gold<30){
alert("Недостатньо золота");
return;
}

gameData.gold-=30;
gameData.army++;

recalc();
save();
updateUI();
show("army");
}

function raid(){
if(gameData.hero.attack<50 || gameData.army<5){
alert("Замало сили або солдатів для рейду.");
return;
}

gameData.gold+=200;
gameData.hero.exp+=50;
gameData.inventory.push(getItem());

alert("Рейд успішний! +200 золота, +50 досвіду і предмет.");

checkLevelUp();
recalc();
save();
updateUI();
show("raid");
}

function startRaid(enemyPower, enemyArmy, reward){

if(gameData.hero.attack < enemyPower || gameData.army < enemyArmy){
alert("❌ Недостатньо сили або армії");
return;
}

gameData.gold += reward;
gameData.hero.exp += 60;

// шанс луту
if(Math.random() > 0.3){
gameData.inventory.push(getItem());
}

alert("🏆 Перемога в рейді! +" + reward + " золота");

checkLevelUp();
recalc();
save();
updateUI();
show("raid");
}

function upgradeCastle(){
if(gameData.gold<100){
alert("Недостатньо золота");
return;
}

gameData.gold-=100;
gameData.castleLevel++;

save();
updateUI();
show("castle");
}

function fmt(i){
return i?`<span style="color:${i.color}">${i.name} (+${i.power})</span>`:"—";
}

function loadChat(){
let messages=JSON.parse(localStorage.getItem("chat"))||[];

content.innerHTML=`
<h2>Чат</h2>
<div style="height:220px;overflow:auto;background:#111;padding:10px;border-radius:10px;">
${messages.map(m=>`<div><b>${m.user}</b>: ${m.text}</div>`).join("")}
</div>
<br>
<input id="msg" placeholder="Напиши повідомлення">
<button onclick="sendMessage()">Відправити</button>
`;
}

function sendMessage(){
let input=document.getElementById("msg");
let text=input.value.trim();

if(text==="") return;

let messages=JSON.parse(localStorage.getItem("chat"))||[];

messages.push({
user:user.nick || user.login,
text:text
});

localStorage.setItem("chat",JSON.stringify(messages));

loadChat();
}

function generateRaidEnemy(){

let types = [
{
name:"Бандити",
icon:"🗡️",
minPower:30,
maxPower:50,
minArmy:3,
reward:120
},
{
name:"Розбійники",
icon:"🏹",
minPower:50,
maxPower:80,
minArmy:5,
reward:200
},
{
name:"Лицарі",
icon:"🛡️",
minPower:80,
maxPower:120,
minArmy:8,
reward:350
},
{
name:"Елітна гвардія",
icon:"👑",
minPower:120,
maxPower:180,
minArmy:12,
reward:600
}
];

let t = types[Math.floor(Math.random()*types.length)];

return {
name:t.name,
icon:t.icon,
power: Math.floor(Math.random()*(t.maxPower - t.minPower)+t.minPower),
army:t.minArmy,
reward:t.reward
};
}