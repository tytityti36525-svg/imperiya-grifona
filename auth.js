const mainMenu = document.getElementById("mainMenu");
const auth = document.getElementById("auth");
const game = document.getElementById("game");

function makeEmail(login) {
    return login.trim().toLowerCase() + "@imperiya.local";
}

function showLogin() {
    auth.innerHTML = `
        <h2>Вхід</h2>
        <label>Логін</label><br>
        <input id="login"><br>
        <label>Пароль</label><br>
        <input id="password" type="password"><br>
        <button onclick="login()">Увійти</button><br>
        <button onclick="back()">Назад</button>
    `;
    mainMenu.style.display = "none";
    auth.style.display = "block";
}

function showRegister() {
    auth.innerHTML = `
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
    mainMenu.style.display = "none";
    auth.style.display = "block";
}

function back() {
    auth.style.display = "none";
    mainMenu.style.display = "block";
}

async function register() {
    const nick = document.getElementById("nick").value.trim();
    const loginValue = document.getElementById("login").value.trim();
    const pass = document.getElementById("password").value;

    if (!nick || !loginValue || !pass) {
        alert("Заповни всі поля");
        return;
    }

    const email = makeEmail(loginValue);

    const cred = await authFirebase.createUserWithEmailAndPassword(email, pass);

    await db.collection("players").doc(cred.user.uid).set({
        uid: cred.user.uid,
        nick: nick,
        login: loginValue,
        level: 1,
        gold: 500,
        power: 10,
        createdAt: Date.now()
    });

    alert("Акаунт створено!");
}

async function login() {
    const loginValue = document.getElementById("login").value.trim();
    const pass = document.getElementById("password").value;

    const email = makeEmail(loginValue);

    await authFirebase.signInWithEmailAndPassword(email, pass);
}

function logout() {
    authFirebase.signOut();
}

authFirebase.onAuthStateChanged(user => {
    if (user) {
        mainMenu.style.display = "none";
        auth.style.display = "none";
        game.style.display = "block";
        startGame(user.uid);
    } else {
        game.style.display = "none";
        auth.style.display = "none";
        mainMenu.style.display = "block";
    }
});