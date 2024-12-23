import { initializeApp } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-auth.js";

const firebaseConfig = {
    apiKey: "AIzaSyA5RZBIOKc0KBZabx9FWFMBO5MiXilu4Gs",
    authDomain: "soldsaas.firebaseapp.com",
    projectId: "soldsaas",
    storageBucket: "soldsaas.firebasestorage.app",
    messagingSenderId: "679371288249",
    appId: "1:679371288249:web:a4892417f390058293f568",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

export { db, auth }; 