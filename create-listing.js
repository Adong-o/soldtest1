import { auth, db } from './firebase.js';
import { doc, setDoc } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-firestore.js";
import { 
    collection, 
    addDoc, 
    serverTimestamp 
} from "https://www.gstatic.com/firebasejs/11.1.0/firebase-firestore.js";
import { numberUtils } from './utils.js';

function cleanTwitterUrl(url) {
    if (!url) return '';
    return url
        .replace(/^@/, '')                    // Remove @ if it exists at start
        .replace(/^https?:\/\/(www\.)?(x|twitter)\.com\//, '')  // Remove any twitter/x.com URLs
        .replace(/^https?:\/\/(www\.)?(x|twitter)\.com\//, '')  // Do it twice to catch duplicates
        .replace(/\/$/, '');                  // Remove trailing slash if exists
}

document.addEventListener('DOMContentLoaded', () => {
    // Check auth state
    auth.onAuthStateChanged((user) => {
        if (!user || !user.emailVerified) {
            // Show verification warning and redirect
            const warning = document.createElement('div');
            warning.className = 'verification-warning';
            warning.innerHTML = `
                <div class="warning-content">
                    <i class="fas fa-exclamation-circle"></i>
                    <p>Please verify your email before creating a listing.</p>
                </div>
            `;
            document.body.appendChild(warning);
            
            // Redirect after 3 seconds
            setTimeout(() => {
                window.location.href = './dashboard.html';
            }, 3000);
            
            return;
        }
    });

    const form = document.getElementById('createListingForm');
    const nextBtn = document.querySelector('.next-step');
    const prevBtn = document.querySelector('.prev-step');
    const submitBtn = document.querySelector('.submit-listing');
    const progressSteps = document.querySelectorAll('.progress-step');
    const formSections = document.querySelectorAll('.form-section');
    
    let currentStep = 1;
    const totalSteps = progressSteps.length;

    // Handle next button click
    nextBtn.addEventListener('click', () => {
        console.log('Next button clicked, current step:', currentStep); // Debug log
        if (currentStep < totalSteps) {
            if (validateSection(currentStep)) {
                currentStep++;
                updateFormDisplay();
            } else {
                showValidationError();
            }
        }
    });

    // Handle previous button click
    prevBtn.addEventListener('click', () => {
        if (currentStep > 1) {
            currentStep--;
            updateFormDisplay();
        }
    });

    // Update form display based on current step
    function updateFormDisplay() {
        console.log('Updating display to step:', currentStep); // Debug log
        
        // Update progress steps
        progressSteps.forEach((step, index) => {
            step.classList.toggle('active', index + 1 <= currentStep);
        });

        // Update form sections
        formSections.forEach((section, index) => {
            section.classList.toggle('active', index + 1 === currentStep);
        });

        // Update buttons
        prevBtn.style.display = currentStep === 1 ? 'none' : 'block';
        if (currentStep === totalSteps) {
            nextBtn.style.display = 'none';
            submitBtn.style.display = 'block';
        } else {
            nextBtn.style.display = 'block';
            submitBtn.style.display = 'none';
        }
    }

    // Validate current section
    function validateSection(step) {
        const currentSection = document.querySelector(`.form-section[data-section="${step}"]`);
        if (!currentSection) {
            console.error('Section not found:', step); // Debug log
            return false;
        }

        const requiredFields = currentSection.querySelectorAll('[required]');
        let isValid = true;

        requiredFields.forEach(field => {
            // Remove any existing error styling
            field.classList.remove('error');
            
            // Check if field is empty
            if (!field.value.trim()) {
                isValid = false;
                field.classList.add('error');
            }
            
            // Special validation for checkboxes that are required
            if (field.type === 'checkbox' && field.required) {
                const checkboxGroup = field.closest('.checkbox-group');
                const checkedBoxes = checkboxGroup.querySelectorAll('input[type="checkbox"]:checked');
                if (checkedBoxes.length === 0) {
                    isValid = false;
                    checkboxGroup.classList.add('error');
                } else {
                    checkboxGroup.classList.remove('error');
                }
            }
        });

        return isValid;
    }

    // Show validation error message
    function showValidationError() {
        const errorMessage = document.createElement('div');
        errorMessage.className = 'validation-error';
        errorMessage.textContent = 'Please fill in all required fields';
        
        // Remove any existing error messages
        const existingError = document.querySelector('.validation-error');
        if (existingError) {
            existingError.remove();
        }
        
        // Add the error message to the current section
        const currentSection = document.querySelector(`.form-section[data-section="${currentStep}"]`);
        currentSection.insertBefore(errorMessage, currentSection.firstChild);
        
        // Remove the message after 3 seconds
        setTimeout(() => {
            errorMessage.remove();
        }, 3000);
    }

    // Add these styles for error states
    const style = document.createElement('style');
    style.textContent = `
        .error {
            border-color: #dc2626 !important;
        }
        .validation-error {
            color: #dc2626;
            padding: 0.5rem;
            margin-bottom: 1rem;
            font-size: 0.875rem;
        }
        .checkbox-group.error {
            border: 1px solid #dc2626;
            border-radius: 0.5rem;
            padding: 0.5rem;
        }
    `;
    document.head.appendChild(style);

    // Initialize form display
    updateFormDisplay();

    // Tech stack data
    const techStackOptions = {
        frontend: [
            'HTML/CSS', 'JavaScript', 'TypeScript', 'React', 'Vue.js', 'Angular',
            'Next.js', 'Svelte', 'jQuery', 'Bootstrap', 'Tailwind CSS'
        ],
        backend: [
            'Node.js', 'Python', 'Java', 'PHP', 'Ruby', 'Go', 'C#', '.NET',
            'Django', 'Flask', 'Laravel', 'Express.js', 'Spring Boot'
        ],
        database: [
            'MySQL', 'PostgreSQL', 'MongoDB', 'Redis', 'SQLite', 'Firebase',
            'Oracle', 'Microsoft SQL Server', 'Amazon DynamoDB'
        ],
        cloud: [
            'AWS', 'Google Cloud', 'Azure', 'Heroku', 'DigitalOcean',
            'Vercel', 'Netlify', 'Cloudflare'
        ],
        tools: [
            'Docker', 'Kubernetes', 'Git', 'Jenkins', 'Webpack', 'Babel',
            'npm', 'Yarn', 'GraphQL', 'REST API'
        ]
    };

    // Initialize tech stack selection
    const selectedTechs = new Set();

    // Populate dropdown with tech options
    function populateTechDropdown() {
        const techStackDropdown = document.querySelector('.tech-stack-dropdown');
        if (!techStackDropdown) return;

        techStackDropdown.innerHTML = '';
        Object.entries(techStackOptions).forEach(([category, techs]) => {
            const categoryDiv = document.createElement('div');
            categoryDiv.className = 'tech-category';
            categoryDiv.innerHTML = `<div class="category-title">${category.toUpperCase()}</div>`;
            
            techs.forEach(tech => {
                if (!selectedTechs.has(tech)) {
                    const option = document.createElement('div');
                    option.className = 'tech-option';
                    option.textContent = tech;
                    option.onclick = () => addTech(tech);
                    categoryDiv.appendChild(option);
                }
            });
            
            techStackDropdown.appendChild(categoryDiv);
        });
    }

    // Add tech tag
    function addTech(tech) {
        if (!selectedTechs.has(tech)) {
            selectedTechs.add(tech);
            const tag = document.createElement('div');
            tag.className = 'tech-tag';
            tag.innerHTML = `
                ${tech}
                <button type="button" onclick="removeTech('${tech}')">&times;</button>
            `;
            const techStackInput = document.querySelector('.tech-stack-input');
            if (techStackInput) {
                techStackInput.appendChild(tag);
                updateTechStackValue();
            }
        }
        const techStackDropdown = document.querySelector('.tech-stack-dropdown');
        if (techStackDropdown) {
            techStackDropdown.style.display = 'none';
        }
    }

    // Remove tech tag
    window.removeTech = function(tech) {
        selectedTechs.delete(tech);
        const techStackInput = document.querySelector('.tech-stack-input');
        if (techStackInput) {
            const tags = techStackInput.querySelectorAll('.tech-tag');
            tags.forEach(tag => {
                if (tag.textContent.trim().replace('×', '') === tech) {
                    tag.remove();
                }
            });
        }
        updateTechStackValue();
    };

    // Update hidden input value
    function updateTechStackValue() {
        const techStackHidden = document.getElementById('techStack');
        if (techStackHidden) {
            techStackHidden.value = Array.from(selectedTechs).join(',');
            console.log('Updated tech stack:', techStackHidden.value); // Debug log
        }
    }

    // Initialize tech stack click handler
    const techInput = document.querySelector('.tech-stack-input');
    if (techInput) {
        techInput.addEventListener('click', () => {
            populateTechDropdown();
            const dropdown = document.querySelector('.tech-stack-dropdown');
            if (dropdown) {
                dropdown.style.display = 
                    dropdown.style.display === 'none' ? 'block' : 'none';
            }
        });
    }

    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
        const techStackSelect = document.querySelector('.tech-stack-select');
        const dropdown = document.querySelector('.tech-stack-dropdown');
        if (techStackSelect && dropdown && !techStackSelect.contains(e.target)) {
            dropdown.style.display = 'none';
        }
    });

    // Google Analytics Integration
    const SCOPES = 'https://www.googleapis.com/auth/analytics.readonly';
    const CLIENT_ID = 'YOUR_GOOGLE_CLIENT_ID'; // You'll need to replace this with your actual client ID

    // Initialize the Google Analytics API
    function initGoogleAnalytics() {
        gapi.load('client:auth2', () => {
            gapi.client.init({
                clientId: CLIENT_ID,
                scope: SCOPES,
                plugin_name: 'SoldSaaS'
            }).then(() => {
                // Check if user is signed in
                if (!gapi.auth2.getAuthInstance().isSignedIn.get()) {
                    document.querySelector('.analytics-status').innerHTML = 
                        '<p class="warning"><i class="fas fa-exclamation-circle"></i> Not connected to Google Analytics</p>';
                }
            });
        });
    }

    // Handle Google Analytics connection
    async function connectGoogleAnalytics() {
        try {
            // Try to sign in
            await gapi.auth2.getAuthInstance().signIn();
            
            // Get the accounts
            const response = await gapi.client.analytics.management.accounts.list();
            const accounts = response.result.items;
            
            if (accounts && accounts.length) {
                // Show accounts selection
                const accountsContainer = document.getElementById('analyticsAccounts');
                accountsContainer.innerHTML = `
                    <div class="analytics-selection">
                        <h4>Select Analytics Account</h4>
                        <select id="gaAccountSelect" class="analytics-select">
                            ${accounts.map(account => 
                                `<option value="${account.id}">${account.name}</option>`
                            ).join('')}
                        </select>
                        <button onclick="fetchAnalyticsData()" class="btn-fetch-analytics">
                            <i class="fas fa-sync"></i>
                            Fetch Data
                        </button>
            </div>
        `;
                
                // Show success message
                document.querySelector('.analytics-status').innerHTML = 
                    '<p class="success"><i class="fas fa-check-circle"></i> Connected to Google Analytics</p>';
            }
        } catch (error) {
            console.error('Error connecting to Google Analytics:', error);
            document.querySelector('.analytics-status').innerHTML = 
                `<p class="error"><i class="fas fa-times-circle"></i> Error: ${error.message}</p>`;
        }
    }

    // Fetch Analytics Data
    async function fetchAnalyticsData() {
        try {
            const accountId = document.getElementById('gaAccountSelect').value;
            
            // Get the last 30 days of data
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            
            const response = await gapi.client.analytics.data.ga.get({
                'ids': 'ga:' + accountId,
                'start-date': thirtyDaysAgo.toISOString().split('T')[0],
                'end-date': 'today',
                'metrics': 'ga:users,ga:sessions,ga:pageviews'
            });

            const data = response.result;
            if (data.rows && data.rows[0]) {
                // Auto-fill the form fields
                document.getElementById('monthlyTraffic').value = data.rows[0][0]; // Users
                
                // Calculate monthly growth (if available)
                if (data.rows.length > 1) {
                    const currentTraffic = parseInt(data.rows[0][0]);
                    const previousTraffic = parseInt(data.rows[1][0]);
                    const growth = ((currentTraffic - previousTraffic) / previousTraffic) * 100;
                    document.getElementById('trafficGrowth').value = growth.toFixed(2);
                }
                
                // Show success message
                document.querySelector('.analytics-status').innerHTML = 
                    '<p class="success"><i class="fas fa-check-circle"></i> Data fetched successfully</p>';
            }
        } catch (error) {
            console.error('Error fetching analytics data:', error);
            document.querySelector('.analytics-status').innerHTML = 
                `<p class="error"><i class="fas fa-times-circle"></i> Error fetching data: ${error.message}</p>`;
        }
    }

    // Add this to your existing code
    document.addEventListener('DOMContentLoaded', function() {
        // Load the Google Analytics API
        const script = document.createElement('script');
        script.src = 'https://apis.google.com/js/api.js';
        script.onload = function() {
            initGoogleAnalytics();
        };
        document.body.appendChild(script);
        
        // ... rest of your existing code ...
    });

    // Add this CSS for loading state
    const loadingStyle = document.createElement('style');
    loadingStyle.textContent = `
        .loading-overlay {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.7);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 1000;
        }

        .loading-content {
            background: white;
            padding: 2rem;
            border-radius: 0.5rem;
            text-align: center;
        }

        .loading-spinner {
            border: 4px solid #f3f3f3;
            border-top: 4px solid var(--primary-color);
            border-radius: 50%;
            width: 40px;
            height: 40px;
            animation: spin 1s linear infinite;
            margin: 0 auto 1rem;
        }

        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }

        .status-message {
            background: white;
            padding: 1rem;
            border-radius: 0.5rem;
            margin-top: 1rem;
            display: flex;
            align-items: center;
            gap: 0.5rem;
        }

        .status-message.success {
            background: #ecfdf5;
            color: #059669;
        }

        .status-message.error {
            background: #fef2f2;
            color: #dc2626;
        }
    `;
    document.head.appendChild(loadingStyle);

    // Add loading overlay function
    function showLoading(message = 'Submitting your listing...') {
        const overlay = document.createElement('div');
        overlay.className = 'loading-overlay';
        overlay.innerHTML = `
            <div class="loading-content">
                <div class="loading-spinner"></div>
                <div>${message}</div>
            </div>
        `;
        document.body.appendChild(overlay);
        return overlay;
    }

    // Add status message function
    function showStatus(type, message) {
        const statusDiv = document.createElement('div');
        statusDiv.className = `status-message ${type}`;
        statusDiv.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i>
            ${message}
        `;
        const currentSection = document.querySelector('.form-section.active');
        currentSection.insertBefore(statusDiv, currentSection.firstChild);
        
        // Remove after 5 seconds
        setTimeout(() => statusDiv.remove(), 5000);
    }

    // Update the form submission handler
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        console.log('Form submitted'); // Debug log
        
        const loadingOverlay = showLoading('Creating your listing...');
        
        try {
            const user = auth.currentUser;
            if (!user) {
                throw new Error('You must be logged in to create a listing');
            }

            // Log the form data being gathered
            console.log('Gathering form data...'); // Debug log

            const listingData = {
                // Business Details
                businessName: document.getElementById('businessName').value,
                businessType: document.getElementById('businessType').value,
                industry: document.getElementById('industry').value,
                description: document.getElementById('description').value,
                established: document.getElementById('established').value,
                websiteUrl: document.getElementById('websiteUrl').value,
                
                // Financial Details
                mrr: Number(document.getElementById('mrr').value),
                arr: Number(document.getElementById('arr').value),
                netProfit: Number(document.getElementById('netProfit').value),
                grossMargin: Number(document.getElementById('grossMargin').value),
                askingPrice: Number(document.getElementById('askingPrice').value),
                growthRate: Number(document.getElementById('growthRate').value),
                
                // Traffic & Users
                monthlyTraffic: Number(document.getElementById('monthlyTraffic').value),
                trafficGrowth: Number(document.getElementById('trafficGrowth').value),
                activeUsers: Number(document.getElementById('activeUsers').value),
                payingCustomers: Number(document.getElementById('payingCustomers').value),
                
                // Tech Stack & Features
                //techStack: Array.from(document.querySelectorAll('input[name="tech"]:checked'))
                //.map(cb => cb.value),
                techStack: document.getElementById('techStack').value.split(',').filter(Boolean),
                features: document.getElementById('features').value,
                platforms: Array.from(document.querySelectorAll('input[name="platforms"]:checked'))
                    .map(cb => cb.value),
                businessModel: document.getElementById('businessModel').value,
                channels: Array.from(document.querySelectorAll('input[name="channels"]:checked'))
                    .map(cb => cb.value),
                reasonForSale: document.getElementById('reasonForSale').value,
                assetsIncluded: Array.from(document.querySelectorAll('input[name="assets"]:checked'))
                //.map(cb => cb.value), done this to see if it save
                    .map(checkbox => checkbox.value),
                
                // Contact info
                twitterUrl: cleanTwitterUrl(document.getElementById('twitterUrl')?.value?.trim() || ''),
                
                // Metadata
                userId: user.uid,
                userEmail: user.email,
                status: 'pending',
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
                
                // Analytics data
                views: 0,
                interestedBuyers: [],
                lastUpdated: serverTimestamp()
            };

            console.log('Listing data:', listingData); // Debug log

            // Save to Firestore
            const listingsRef = collection(db, 'listings');
            const docRef = await addDoc(listingsRef, listingData);
            
            console.log('Document written with ID: ', docRef.id); // Debug log

            // Show success message
            loadingOverlay.remove();
            showSubmissionStatus('success', 'Listing created successfully!');
            
            // Redirect after delay
            setTimeout(() => {
                window.location.href = './dashboard.html';
            }, 2000);

        } catch (error) {
            console.error('Error creating listing:', error);
            loadingOverlay.remove();
            showSubmissionStatus('error', error.message);
        }
    });

    // Add this for better loading state
    function showSubmissionStatus(type, message) {
        const statusOverlay = document.createElement('div');
        statusOverlay.className = 'submission-status';
        statusOverlay.innerHTML = `
            <div class="status-content ${type}">
                <div class="status-icon">
                    ${type === 'success' 
                        ? '<i class="fas fa-check-circle"></i>' 
                        : '<i class="fas fa-exclamation-circle"></i>'}
                </div>
                <div class="status-message">${message}</div>
                <div class="status-progress"></div>
            </div>
        `;
        document.body.appendChild(statusOverlay);

        // Remove after animation
        setTimeout(() => {
            statusOverlay.classList.add('fade-out');
            setTimeout(() => statusOverlay.remove(), 500);
        }, 2000);
    }

    // Add these styles if not already present
    const techStackStyles = document.createElement('style');
    techStackStyles.textContent = `
        .tech-stack-select {
            position: relative;
            width: 100%;
        }

        .tech-stack-input {
            min-height: 42px;
            border: 1px solid #e5e7eb;
            border-radius: 0.375rem;
            padding: 0.5rem;
            display: flex;
            flex-wrap: wrap;
            gap: 0.5rem;
            cursor: pointer;
        }

        .tech-tag {
            background: #e5e7eb;
            padding: 0.25rem 0.5rem;
            border-radius: 0.25rem;
            display: flex;
            align-items: center;
            gap: 0.5rem;
        }

        .tech-tag button {
            background: none;
            border: none;
            padding: 0;
            cursor: pointer;
            font-size: 1.25rem;
            line-height: 1;
        }

        .tech-stack-dropdown {
            position: absolute;
            top: 100%;
            left: 0;
            right: 0;
            background: white;
            border: 1px solid #e5e7eb;
            border-radius: 0.375rem;
            margin-top: 0.25rem;
            max-height: 300px;
            overflow-y: auto;
            display: none;
            z-index: 10;
        }

        .tech-category {
            padding: 0.5rem;
        }

        .category-title {
            font-weight: 500;
            color: #6b7280;
            padding: 0.25rem 0.5rem;
        }

        .tech-option {
            padding: 0.5rem;
            cursor: pointer;
            border-radius: 0.25rem;
        }

        .tech-option:hover {
            background: #f3f4f6;
        }
    `;
    document.head.appendChild(techStackStyles);

    // Add event listeners for the checkbox labels
    const checkboxLabels = document.querySelectorAll('.checkbox-label');
    checkboxLabels.forEach(label => {
        label.addEventListener('click', () => {
            label.classList.toggle('active'); // Toggle active class
        });
    });

    // Add this debug log in your form submission - whole this for debugging
    console.log('Tech Stack:', document.getElementById('techStack').value);
    console.log('Assets:', Array.from(document.querySelectorAll('input[name="assets"]:checked'))
        .map(checkbox => checkbox.value));

    // Add this function for the coming soon notification
    function showComingSoonNotification() {
        const notification = document.createElement('div');
        notification.className = 'coming-soon-notification';
        notification.innerHTML = `
            <div class="notification-content">
                <i class="fas fa-tools"></i>
                <p>We're working on integrating Google Analytics! This feature will be available soon.</p>
            </div>
        `;
        document.body.appendChild(notification);

        // Remove notification after 3 seconds
        setTimeout(() => {
            notification.classList.add('fade-out');
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    // Add styles for the notification
    const notificationStyles = document.createElement('style');
    notificationStyles.textContent = `
        .coming-soon-notification {
            position: fixed;
            top: 20px;
            right: 20px;
            background: #4b5563;
            color: white;
            padding: 1rem 1.5rem;
            border-radius: 0.5rem;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            z-index: 1000;
            animation: slideIn 0.3s ease-out;
        }

        .notification-content {
            display: flex;
            align-items: center;
            gap: 0.75rem;
        }

        .notification-content i {
            font-size: 1.25rem;
        }

        .notification-content p {
            margin: 0;
            font-size: 0.875rem;
        }

        .coming-soon-notification.fade-out {
            animation: slideOut 0.3s ease-out forwards;
        }

        @keyframes slideIn {
            from {
                transform: translateX(100%);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }

        @keyframes slideOut {
            from {
                transform: translateX(0);
                opacity: 1;
            }
            to {
                transform: translateX(100%);
                opacity: 0;
            }
        }
    `;
    document.head.appendChild(notificationStyles);

    // Make the function globally available
    window.showComingSoonNotification = showComingSoonNotification;
}); 