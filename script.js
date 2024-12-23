import { initializeApp } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-app.js";
import { 
    getAuth, 
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    GoogleAuthProvider,
    signInWithPopup 
} from "https://www.gstatic.com/firebasejs/11.1.0/firebase-auth.js";

// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyA5RZBIOKc0KBZabx9FWFMBO5MiXilu4Gs",
    authDomain: "soldsaas.firebaseapp.com",
    projectId: "soldsaas",
    storageBucket: "soldsaas.firebasestorage.app",
    messagingSenderId: "679371288249",
    appId: "1:679371288249:web:a4892417f390058293f568"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

document.addEventListener('DOMContentLoaded', () => {
    const authModal = document.getElementById('authModal');
    const joinButton = document.getElementById('joinButton');
    const listButton = document.getElementById('listButton');
    const heroJoinButton = document.getElementById('heroJoinButton');
    const closeModal = document.querySelector('.close-modal');

    // Hide modal by default
    if (authModal) {
        authModal.style.display = 'none';
    }

    // Show modal only when specific buttons are clicked
    [joinButton, listButton, heroJoinButton].forEach(button => {
        if (button) {
            button.addEventListener('click', () => {
                authModal.style.display = 'block';
            });
        }
    });

    // Close modal when clicking X
    if (closeModal) {
        closeModal.addEventListener('click', () => {
            authModal.style.display = 'none';
        });
    }

    // Close modal when clicking outside
    window.addEventListener('click', (e) => {
        if (e.target === authModal) {
            authModal.style.display = 'none';
        }
    });

    // Handle form submissions and Google auth
    const loginForm = document.getElementById('loginForm');
    const signupForm = document.getElementById('signupForm');
    const loginGoogleBtn = document.getElementById('loginGoogleBtn');
    const signupGoogleBtn = document.getElementById('signupGoogleBtn');

    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = loginForm.querySelector('#loginEmail').value;
            const password = loginForm.querySelector('#loginPassword').value;
            
            try {
                await signInWithEmailAndPassword(auth, email, password);
                window.location.href = './dashboard.html';
            } catch (error) {
                const errorElement = loginForm.querySelector('.error-message');
                errorElement.textContent = getErrorMessage(error.code);
            }
        });
    }

    if (signupForm) {
        signupForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = signupForm.querySelector('#signupEmail').value;
            const password = signupForm.querySelector('#signupPassword').value;
            const confirmPassword = signupForm.querySelector('#confirmPassword').value;

            if (password !== confirmPassword) {
                const errorElement = signupForm.querySelector('.error-message');
                errorElement.textContent = 'Passwords do not match';
                return;
            }

            try {
                await createUserWithEmailAndPassword(auth, email, password);
                window.location.href = './dashboard.html';
            } catch (error) {
                const errorElement = signupForm.querySelector('.error-message');
                errorElement.textContent = getErrorMessage(error.code);
            }
        });
    }

    // Google Authentication
    [loginGoogleBtn, signupGoogleBtn].forEach(btn => {
        if (btn) {
            btn.addEventListener('click', async () => {
                try {
                    await signInWithPopup(auth, googleProvider);
                    window.location.href = './dashboard.html';
                } catch (error) {
                    console.error('Google auth error:', error);
                }
            });
        }
    });

    // Handle tab switching
    const authTabs = document.querySelectorAll('.auth-tab');
    const authForms = document.querySelectorAll('.auth-form');

    authTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const targetForm = tab.getAttribute('data-tab');
            
            // Update active tab
            authTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            
            // Show corresponding form
            authForms.forEach(form => {
                form.classList.remove('active');
                if (form.id === `${targetForm}Form`) {
                    form.classList.add('active');
                }
            });
        });
    });
});

// Error message helper
function getErrorMessage(errorCode) {
    switch (errorCode) {
        case 'auth/invalid-email':
            return 'Invalid email address';
        case 'auth/user-disabled':
            return 'This account has been disabled';
        case 'auth/user-not-found':
            return 'No account found with this email';
        case 'auth/wrong-password':
            return 'Incorrect password';
        case 'auth/email-already-in-use':
            return 'An account already exists with this email';
        case 'auth/weak-password':
            return 'Password should be at least 6 characters';
        default:
            return 'An error occurred. Please try again';
    }
}
