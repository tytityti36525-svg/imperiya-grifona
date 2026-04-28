const mainMenu=document.getElementById("mainMenu");
const auth=document.getElementById("auth");
const game=document.getElementById("game");

function showLogin(){
auth.innerHTML=`
<h2>Вхід</h2>
<label>Логін</label><br>
<input id="login"><br>
<label>Пароль</label><br>
<input id="password" type="password"><br>
<button onclick="login()">Увійти</button><br>
<button onclick="back()">Назад</button>
`;
mainMenu.style.display="none";
auth.style.display="block";
}

function showRegister(){
auth.innerHTML=`
<h2>Реєстрація</h2>
<label>Нік</label><br>
<input id="nick"><br>
<label>Логін</label><br>
<input id="login"><br>
<label>Пароль</label><br>
<input id="password" type="password"><br>
<button onclick="register()">Створити</button><br>
<button onclick="back()">Назад</button>
`;
mainMenu.style.display="none";
auth.style.display="block";
}

function back(){
auth.style.display="none";
mainMenu.style.display="block";
}

function register(){
let users=JSON.parse(localStorage.getItem("users"))||[];
users.push({
nick:nick.value,
login:login.value,
pass:password.value
});
localStorage.setItem("users",JSON.stringify(users));
alert("OK");
back();
}

function login(){
let users=JSON.parse(localStorage.getItem("users"))||[];
let u=users.find(x=>x.login===login.value&&x.pass===password.value);
if(u){
localStorage.setItem("currentUser",JSON.stringify(u));
auth.style.display="none";
game.style.display="block";
startGame();
}
}

function logout(){
localStorage.removeItem("currentUser");
location.reload();
}