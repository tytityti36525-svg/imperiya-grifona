const firebaseConfig = {
  apiKey: "AIzaSyAfVxivb10ZTTNDYF-_UpaXEfXOCDGDWAQ",
  authDomain: "imperiya-grifona.firebaseapp.com",
  databaseURL: "https://imperiya-grifona-default-rtdb.firebaseio.com",
  projectId: "imperiya-grifona",
  storageBucket: "imperiya-grifona.firebasestorage.app",
  messagingSenderId: "952468135190",
  appId: "1:952468135190:web:cf402029c50911a0f08437",
  measurementId: "G-3QGPW7QK3F"
};

// Ініціалізація Firebase для версії 8
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

// Створюємо змінні для auth.js та game.js
const authFirebase = firebase.auth();
const db = firebase.firestore();

console.log("Firebase успішно підключено!");