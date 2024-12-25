import { initializeApp } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-app.js";
import { 
    getAuth, 
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    GoogleAuthProvider,
    signInWithPopup,
    sendEmailVerification
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
                console.log('Modal displayed, form available:', {
                    signupForm: !!document.getElementById('signupForm'),
                    signupEmail: !!document.getElementById('signupEmail'),
                    signupPassword: !!document.getElementById('signupPassword')
                });
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
            
            // Get form elements
            const emailInput = loginForm.querySelector('#loginEmail');
            const passwordInput = loginForm.querySelector('#loginPassword');
            const errorElement = loginForm.querySelector('.error-message');
            
            // Validate form elements exist
            if (!emailInput || !passwordInput) {
                console.error('Login form elements not found');
                if (errorElement) {
                    errorElement.textContent = 'Form error: Please refresh the page and try again';
                }
                return;
            }

            // Validate input values
            const email = emailInput.value.trim();
            const password = passwordInput.value.trim();

            if (!email || !password) {
                if (errorElement) {
                    errorElement.textContent = 'Please fill in all fields';
                }
                return;
            }
            
            try {
                const userCredential = await signInWithEmailAndPassword(auth, email, password);
                const user = userCredential.user;

                // Check if email is verified
                if (!user.emailVerified) {
                    // Send another verification email
                    await sendEmailVerification(user);
                    if (errorElement) {
                        errorElement.textContent = 'Please verify your email first. A new verification email has been sent.';
                    }
                    return;
                }

                // If email is verified, proceed to dashboard
                window.location.href = './dashboard.html';
            } catch (error) {
                if (errorElement) {
                    errorElement.textContent = getErrorMessage(error.code);
                }
            }
        });
    }

    if (signupForm) {
        console.log('Found signup form:', !!signupForm); // Debug log

        if (!signupForm) {
            console.error('Signup form not found in DOM');
            return;
        }

        signupForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            // Get form elements with more specific selectors
            const emailInput = document.getElementById('signupEmail');
            const passwordInput = document.getElementById('signupPassword');
            const errorElement = signupForm.querySelector('.error-message');
            
            // Validate form elements exist
            if (!emailInput || !passwordInput) {
                console.error('Form elements missing:', {
                    emailInput: !!emailInput,
                    passwordInput: !!passwordInput
                });
                if (errorElement) {
                    errorElement.textContent = 'Form error: Please refresh the page and try again';
                }
                return;
            }

            // Validate input values
            const email = emailInput.value.trim();
            const password = passwordInput.value.trim();

            if (!email || !password) {
                if (errorElement) {
                    errorElement.textContent = 'Please fill in all fields';
                }
                return;
            }

            try {
                // Create the user
                const userCredential = await createUserWithEmailAndPassword(auth, email, password);
                const user = userCredential.user;

                // Send verification email
                try {
                    await sendEmailVerification(user);
                    if (errorElement) {
                        errorElement.style.color = '#059669'; // Green color for success
                        errorElement.textContent = 'Verification email sent! Please check your inbox.';
                    }
                    // Wait for 2 seconds before redirecting to allow user to read the message
                    setTimeout(() => {
                        window.location.href = './dashboard.html';
                    }, 2000);
                } catch (verificationError) {
                    console.error('Error sending verification email:', verificationError);
                    if (errorElement) {
                        errorElement.textContent = 'Account created but could not send verification email. Please try again later.';
                    }
                }
            } catch (error) {
                console.error('Signup error:', error);
                if (errorElement) {
                    errorElement.textContent = getErrorMessage(error.code);
                }
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
