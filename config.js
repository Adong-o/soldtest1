let config = null;

async function getConfig() {
    if (config) return config;
    
    try {
        const response = await fetch('/config');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        config = await response.json();
        return config;
    } catch (error) {
        console.error('Failed to load configuration:', error);
        // Fallback config for development
        return {
            firebase: {
                apiKey: "AIzaSyA5RZBIOKc0KBZabx9FWFMBO5MiXilu4Gs",
                authDomain: "soldsaas.firebaseapp.com",
                projectId: "soldsaas",
                storageBucket: "soldsaas.firebasestorage.app",
                messagingSenderId: "679371288249",
                appId: "1:679371288249:web:a4892417f390058293f568"
            }
        };
    }
}

// Firebase configuration
const firebaseConfig = {
    // Your existing config
};

// Initialize Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-auth.js";

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

export { db, auth };

export default getConfig; 