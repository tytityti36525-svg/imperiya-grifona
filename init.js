const firebaseConfig = {
    apiKey: "AIzaSy...", // Твій ключ
    authDomain: "imperiya-grifona.firebaseapp.com",
    projectId: "imperiya-grifona",
    storageBucket: "imperiya-grifona.appspot.com",
    messagingSenderId: "...",
    appId: "..."
};

// Ініціалізація Firebase
firebase.initializeApp(firebaseConfig);

// Створюємо змінні, які використовують інші файли (auth.js)
const authFirebase = firebase.auth();
const db = firebase.firestore();

console.log("Firebase успішно підключено!");