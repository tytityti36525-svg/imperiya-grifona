const mainMenu = document.getElementById("mainMenu");
const auth = document.getElementById("auth");
const game = document.getElementById("game");

// ВИПРАВЛЕНО: Використовуємо стандартний домен, щоб Firebase не видавав помилку формату
function makeEmail(login) {
    return login.trim().toLowerCase() + "@gmail.com"; 
}

function showLogin() {
    auth.innerHTML = `
        <h2>Вхід</h2>
        <label>Логін</label><br>
        <input id="login" placeholder="Твій логін"><br>
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
        <label>Нік у грі</label><br>
        <input id="nick" placeholder="Напр: Лицар"><br>
        <label>Логін (для входу)</label><br>
        <input id="login" placeholder="Напр: grifon001"><br>
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

    try {
        const cred = await authFirebase.createUserWithEmailAndPassword(email, pass);

       await db.collection("players").doc(cred.user.uid).set({
            uid: cred.user.uid,
            nick: nick,
            login: loginValue, // тут зберігаємо чистий логін
            level: 1,
            gold: 500,
            power: 10,
            castleLevel: 1,
            buildings: {
                barracks: 0,
                forge: 0,
                academy: 0,
                mine: 0
            },
            createdAt: Date.now()
        });

        alert("Акаунт створено! Тепер можеш увійти.");
    } catch (error) {
        console.error("Помилка реєстрації:", error);
        alert("Помилка реєстрації: " + error.message);
    }
}

async function login() {
    const loginValue = document.getElementById("login").value.trim();
    const pass = document.getElementById("password").value;

    if (!loginValue || !pass) {
        alert("Введи логін та пароль!");
        return;
    }

    const email = makeEmail(loginValue);

    try {
        await authFirebase.signInWithEmailAndPassword(email, pass);
    } catch (error) {
        console.error(error);
        alert("Невірний логін або пароль!");
    }
}

function logout() {
    authFirebase.signOut();
}

authFirebase.onAuthStateChanged(user => {
    if (user) {
        mainMenu.style.display = "none";
        auth.style.display = "none";
        game.style.display = "block";
        if (typeof startGame === "function") {
            startGame(user.uid);
        }
    } else {
        game.style.display = "none";
        auth.style.display = "none";
        mainMenu.style.display = "block";
    }
});