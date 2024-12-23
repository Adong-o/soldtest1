import { auth } from './firebase.js';
import { 
    signOut, 
    deleteUser, 
    updateProfile, 
    updatePassword,
    onAuthStateChanged 
} from "https://www.gstatic.com/firebasejs/11.1.0/firebase-auth.js";
import { collection, getDocs, query, where, deleteDoc, doc, getDoc, updateDoc, serverTimestamp, addDoc, orderBy, limit, setDoc } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-firestore.js";
import { db } from './firebase.js';
import { numberUtils } from './utils.js';
import { ListingsView } from './listings-view.js';
import { ActivityTracker } from './activity-tracker.js';

window.toggleMarketplace = async (listingId, publish) => {
    try {
        const listingRef = doc(db, 'listings', listingId);
        const button = document.querySelector(`button[onclick="window.toggleMarketplace('${listingId}', ${publish})"]`);
        
        if (button) {
            // Show loading state
            button.innerHTML = `
                <i class="fas fa-spinner fa-spin"></i>
                ${publish ? 'Publishing...' : 'Removing...'}
            `;
            button.disabled = true;

            // Update the listing status
            await updateDoc(listingRef, {
                status: publish ? 'published' : 'draft',
                publishedAt: publish ? serverTimestamp() : null,
                updatedAt: serverTimestamp(),
                sold: false  // Ensure sold status is set
            });

            if (publish) {
                const notification = document.createElement('div');
                notification.className = 'notification success';
                notification.innerHTML = `
                    <div class="success-message">
                        <i class="fas fa-check-circle"></i>
                        <div class="message-content">
                            <strong>Successfully published to marketplace!</strong>
                            <span>Your listing is now visible to potential buyers</span>
                        </div>
                    </div>
                `;
                document.body.appendChild(notification);
                setTimeout(() => notification.remove(), 5000);
            }

            // Update button state
            button.innerHTML = `
                <i class="fas fa-${publish ? 'check-circle' : 'store'}"></i>
                ${publish ? 'Listed' : 'Push to Market'}
            `;
            button.disabled = false;
            button.className = `btn-marketplace ${publish ? 'active' : ''}`;

            // Refresh listings
            await displayMyListings(auth.currentUser?.uid);
        }
    } catch (error) {
        console.error('Error updating listing status:', error);
        const notification = document.createElement('div');
        notification.className = 'notification error';
        notification.innerHTML = `
            <div class="error-message">
                <i class="fas fa-exclamation-circle"></i>
                <span>Error updating listing status</span>
            </div>
        `;
        document.body.appendChild(notification);
        setTimeout(() => notification.remove(), 5000);

        // Reset button state
        if (button) {
            button.innerHTML = `
                <i class="fas fa-store"></i>
                Push to Market
            `;
            button.disabled = false;
            button.className = 'btn-marketplace';
        }
    }
};

window.viewListingDetails = async (listingId) => {
    try {
        const listingRef = doc(db, 'listings', listingId);
        const listingDoc = await getDoc(listingRef);
        
        if (!listingDoc.exists()) {
            showNotification('Listing not found', 'error');
            return;
        }

        const listing = listingDoc.data();
        
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.style.display = 'block';
        modal.innerHTML = `
            <div class="modal-content">
                <span class="close-modal">&times;</span>
                <div class="listing-details-header">
                    <span class="business-type">${listing.businessType}</span>
                    <h2>${listing.businessName}</h2>
                </div>
                <div class="listing-details-grid">
                    <div class="detail-section">
                        <h3>Business Overview</h3>
                        <p><strong>Type:</strong> ${listing.businessType}</p>
                        <p><strong>Industry:</strong> ${listing.industry}</p>
                        <p><strong>Model:</strong> ${listing.businessModel}</p>
                        <p><strong>Description:</strong> ${listing.description}</p>
                        <p><strong>Year Established:</strong> ${listing.established}</p>
                    </div>
                    
                    <div class="detail-section">
                        <h3>Financial Details</h3>
                        <p><strong>MRR:</strong> ${numberUtils.formatCurrency(listing.mrr)}</p>
                        <p><strong>ARR:</strong> ${numberUtils.formatCurrency(listing.arr)}</p>
                        <p><strong>Growth Rate:</strong> ${numberUtils.formatPercentage(listing.growthRate)}</p>
                        <p><strong>Net Profit:</strong> ${numberUtils.formatCurrency(listing.netProfit)}</p>
                        <p><strong>Gross Margin:</strong> ${numberUtils.formatPercentage(listing.grossMargin)}</p>
                        <p><strong>Asking Price:</strong> ${numberUtils.formatCurrency(listing.askingPrice)}</p>
                    </div>

                    <div class="detail-section">
                        <h3>Traffic & Users</h3>
                        <p><strong>Monthly Traffic:</strong> ${listing.monthlyTraffic || 0} visitors</p>
                        <p><strong>Traffic Growth:</strong> ${numberUtils.formatPercentage(listing.trafficGrowth)}</p>
                        <p><strong>Active Users:</strong> ${listing.activeUsers || 0}</p>
                        <p><strong>Paying Customers:</strong> ${listing.payingCustomers || 0}</p>
                    </div>
                    
                    <div class="detail-section">
                        <h3>Tech Stack</h3>
                        <div class="tech-tags">
                            ${listing.techStack ? listing.techStack.map(tech => `
                                <span class="tech-tag">${tech}</span>
                            `).join('') : 'No tech stack specified'}
                        </div>
                    </div>

                    <div class="detail-section">
                        <h3>Marketing Channels</h3>
                        <div class="channel-tags">
                            ${listing.channels ? listing.channels.map(channel => `
                                <span class="channel-tag">${channel}</span>
                            `).join('') : 'No channels specified'}
                        </div>
                    </div>

                    <div class="detail-section">
                        <h3>Assets Included</h3>
                        <div class="asset-tags">
                            ${listing.assets ? listing.assets.map(asset => `
                                <span class="asset-tag">${asset}</span>
                            `).join('') : 'No assets specified'}
                        </div>
                    </div>

                    <div class="detail-section">
                        <h3>Additional Information</h3>
                        <p><strong>Reason for Sale:</strong> ${listing.reasonForSale}</p>
                        <p><strong>Twitter Profile:</strong> <a href="${listing.twitterUrl}" target="_blank">${listing.twitterUrl}</a></p>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Close modal functionality
        const closeBtn = modal.querySelector('.close-modal');
        closeBtn.onclick = () => modal.remove();
        modal.onclick = (e) => {
            if (e.target === modal) modal.remove();
        };

    } catch (error) {
        console.error('Error showing listing details:', error);
        showNotification('Error loading listing details', 'error');
    }
};

document.addEventListener('DOMContentLoaded', () => {
    // Only initialize modals when needed
    const modals = {
        settings: document.getElementById('settingsModal'),
        feedback: document.getElementById('feedbackModal')
    };

    // Hide all modals by default
    Object.values(modals).forEach(modal => {
        if (modal) modal.style.display = 'none';
    });

    // Profile Dropdown and Modal Handling
    const profileDropdown = {
        icon: document.querySelector('.profile-icon'),
        menu: document.querySelector('.dropdown-menu'),
        settingsLink: document.getElementById('settingsLink'),
        logoutButton: document.getElementById('logoutButton'),
        deleteButton: document.getElementById('deleteAccountButton')
    };

    // Only show dropdown when clicking profile icon
    if (profileDropdown.icon && profileDropdown.menu) {
        profileDropdown.menu.style.display = 'none'; // Hide by default
        
        profileDropdown.icon.addEventListener('click', (e) => {
            e.stopPropagation();
            profileDropdown.menu.style.display = 
                profileDropdown.menu.style.display === 'block' ? 'none' : 'block';
        });

        // Close dropdown when clicking outside
        document.addEventListener('click', () => {
            profileDropdown.menu.style.display = 'none';
        });

        profileDropdown.menu.addEventListener('click', (e) => {
            e.stopPropagation();
        });
    }

    // Handle account actions only when clicked
    if (profileDropdown.logoutButton) {
        profileDropdown.logoutButton.addEventListener('click', async (e) => {
            e.preventDefault();
            try {
                await signOut(auth);
                window.location.href = '/';
            } catch (error) {
                console.error('Logout error:', error);
                showNotification('Error logging out. Please try again.', 'error');
            }
        });
    }

    if (profileDropdown.deleteButton) {
        profileDropdown.deleteButton.addEventListener('click', (e) => {
            e.preventDefault();
            showFeedbackModal('delete');
        });
    }

    // Close modals with X button or clicking outside
    document.querySelectorAll('.close-modal').forEach(closeBtn => {
        closeBtn.addEventListener('click', () => {
            Object.values(modals).forEach(modal => {
                if (modal) modal.style.display = 'none';
            });
        });
    });

    window.addEventListener('click', (e) => {
        Object.values(modals).forEach(modal => {
            if (e.target === modal) modal.style.display = 'none';
        });
    });

    // Authentication State Observer
    onAuthStateChanged(auth, (user) => {
        if (user) {
            // Show verification warning only if email is not verified
            const verificationWarning = document.getElementById('verificationWarning');
            if (verificationWarning && !user.emailVerified) {
                verificationWarning.style.display = 'flex';
            }
            
            // Update profile information
            updateUserProfile(user);
            
            // Load saved listings
            loadSavedListings(user.uid);
            updateDashboardStats(user.uid);
            displayMyListings(user.uid);
        } else {
            // Redirect to login if not authenticated
            window.location.href = '/';
        }
    });

    // Update User Profile
    function updateUserProfile(user) {
        const fullName = user.displayName || 'Entrepreneur';
        const userEmail = user.email;
        const userPhoto = user.photoURL || 'default-avatar.png';

        // Update profile displays
        const elements = [
            { id: 'welcomeUserName', text: fullName },
            { id: 'dropdownUserName', text: fullName },
            { id: 'dropdownUserEmail', text: userEmail }
        ];

        elements.forEach(el => {
            const element = document.getElementById(el.id);
            if (element) element.textContent = el.text;
        });
        
        // Update profile picture
        const profileIcon = document.querySelector('.profile-icon');
        if (profileIcon) {
            if (user.photoURL) {
                profileIcon.innerHTML = `<img src="${userPhoto}" alt="${fullName}" class="profile-image">`;
            } else {
                profileIcon.innerHTML = `<i class="fas fa-user-circle"></i>`;
            }
        }
    }

    // Feedback Modal Elements
    const feedbackModal = document.getElementById('feedbackModal');
    const feedbackForm = document.getElementById('feedbackForm');
    const cancelFeedback = document.getElementById('cancelFeedback');
    const otherReasonInput = document.getElementById('reason5');
    const otherReasonText = document.querySelector('.other-reason');
    let currentAction = ''; // 'logout' or 'delete'

    // Show feedback modal
    function showFeedbackModal(action) {
        const feedbackModal = document.getElementById('feedbackModal');
        feedbackModal.style.display = 'block';
        document.getElementById('feedbackTitle').textContent = 'Before Deleting Your Account';

        // Handle feedback submission
        const feedbackForm = document.getElementById('feedbackForm');
        feedbackForm.onsubmit = async (e) => {
            e.preventDefault();
            
            const selectedReason = document.querySelector('input[name="feedback"]:checked');
            if (!selectedReason) {
                alert('Please select a reason');
                return;
            }

            let feedback = selectedReason.value;
            if (feedback === 'other') {
                feedback = document.getElementById('otherReason').value;
                if (!feedback.trim()) {
                    alert('Please specify your reason');
                    return;
                }
            }

            try {
                // Save feedback to Firestore
                const feedbackRef = collection(db, 'account_deletions');
                await addDoc(feedbackRef, {
                    userId: auth.currentUser.uid,
                    userEmail: auth.currentUser.email,
                    reason: feedback,
                    timestamp: serverTimestamp()
                });

                // Delete user account
                await deleteUser(auth.currentUser);
                window.location.href = '/';
            } catch (error) {
                console.error('Error:', error);
                showNotification('Error deleting account. Please try again.', 'error');
            }
        };
    }

    // Handle Other Reason toggle
    otherReasonInput.addEventListener('change', (e) => {
        otherReasonText.style.display = e.target.checked ? 'block' : 'none';
    });

    // Cancel feedback
    cancelFeedback.addEventListener('click', () => {
        feedbackModal.style.display = 'none';
        feedbackForm.reset();
        otherReasonText.style.display = 'none';
    });

    // Handle feedback submission
    feedbackForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Get selected reason
        const selectedReason = document.querySelector('input[name="feedback"]:checked');
        if (!selectedReason) {
            alert('Please select a reason');
            return;
        }

        let feedback = selectedReason.value;
        if (feedback === 'other') {
            feedback = document.getElementById('otherReason').value;
            if (!feedback.trim()) {
                alert('Please specify your reason');
                return;
            }
        }

        try {
            // Here you can send the feedback to your backend
            // await sendFeedback(feedback);

            if (currentAction === 'logout') {
                await signOut(auth);
            } else if (currentAction === 'delete') {
                await deleteUser(auth.currentUser);
            }

            // Redirect to index.html
            window.location.href = '/';
        } catch (error) {
            console.error('Error:', error);
            alert('An error occurred. Please try again.');
        }
    });

    // Update Logout Button
    const logoutButton = document.getElementById('logoutButton');
    if (logoutButton) {
        logoutButton.addEventListener('click', async (e) => {
            e.preventDefault();
            try {
                await signOut(auth);
                window.location.href = '/';
            } catch (error) {
                console.error('Logout error:', error);
                showNotification('Error logging out. Please try again.', 'error');
            }
        });
    }

    // Update Delete Account Button
    const deleteAccountButton = document.getElementById('deleteAccountButton');
    if (deleteAccountButton) {
        deleteAccountButton.addEventListener('click', (e) => {
            e.preventDefault();
            showFeedbackModal('delete');
        });
    }

    // Close modal when clicking outside
    window.addEventListener('click', (event) => {
        if (event.target === feedbackModal) {
            feedbackModal.style.display = 'none';
            feedbackForm.reset();
            otherReasonText.style.display = 'none';
        }
    });

    // Settings Modal
    const settingsLink = document.getElementById('settingsLink');
    const settingsModal = document.getElementById('settingsModal');
    const closeModal = settingsModal?.querySelector('.close-modal');

    if (settingsLink) {
        settingsLink.addEventListener('click', () => {
            if (settingsModal) settingsModal.style.display = 'block';
        });
    }

    if (closeModal) {
        closeModal.addEventListener('click', () => {
            if (settingsModal) settingsModal.style.display = 'none';
        });
    }

    // Settings Form
    const settingsForm = document.getElementById('settingsForm');
    if (settingsForm) {
        settingsForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const newPassword = document.getElementById('newPassword').value;

            try {
                const user = auth.currentUser;
                await updatePassword(user, newPassword);
                alert('Password updated successfully');
                if (settingsModal) settingsModal.style.display = 'none';
            } catch (error) {
                console.error('Password update error:', error);
                alert('Failed to update password');
            }
        });
    }

    // Add function to load saved listings
    async function loadSavedListings(userId) {
        const savedListingsCount = document.getElementById('savedListingsCount');
        
        try {
            const savedListingsRef = collection(db, 'users', userId, 'savedListings');
            const querySnapshot = await getDocs(savedListingsRef);
            
            // Update count in stats card
            if (savedListingsCount) {
                savedListingsCount.textContent = querySnapshot.size;
            }
        } catch (error) {
            console.error('Error loading saved listings:', error);
            if (savedListingsCount) {
                savedListingsCount.textContent = '0';
            }
        }
    }

    // Update the createListingBtn click handler
    const createListingBtn = document.getElementById('createListingBtn');
    if (createListingBtn) {
        createListingBtn.addEventListener('click', () => {
            const user = auth.currentUser;
            if (user?.emailVerified) {
                window.location.href = '/create-listing';
            } else {
                const warning = document.createElement('div');
                warning.className = 'notification error';
                warning.innerHTML = `
                    <div class="notification-content">
                        <i class="fas fa-exclamation-circle"></i>
                        <span>Please verify your email before creating a listing</span>
                    </div>
                `;
                document.body.appendChild(warning);
                
                setTimeout(() => {
                    warning.remove();
                }, 5000);
            }
        });
    }

    // Function to convert string fields to numbers
    function processListing(listing) {
        const numericFields = [
            'mrr', 'arr', 'grossMargin', 'netProfit', 'growthRate',
            'monthlyTraffic', 'trafficGrowth', 'activeUsers', 
            'payingCustomers', 'askingPrice', 'yearEstablished'
        ];

        const processed = { ...listing };
        
        numericFields.forEach(field => {
            if (processed[field]) {
                processed[field] = Number(processed[field]);
            }
        });

        return processed;
    }

    // Update the dashboard stats function
    async function updateDashboardStats(userId) {
        try {
            const listingsRef = collection(db, 'listings');
            const userListingsQuery = query(listingsRef, where("userId", "==", userId));
            const querySnapshot = await getDocs(userListingsQuery);
            
            // Update total listings count
            const totalListingsElement = document.getElementById('totalListings');
            if (totalListingsElement) {
                totalListingsElement.textContent = querySnapshot.size;
            }

            // Calculate total potential revenue
            let totalRevenue = 0;
            querySnapshot.forEach((doc) => {
                const listing = doc.data();
                if (listing.askingPrice) {
                    // Convert string to number for calculation
                    totalRevenue += Number(listing.askingPrice);
                }
            });

            // Update revenue display
            const revenueElement = document.getElementById('potentialRevenue');
            if (revenueElement) {
                revenueElement.textContent = `$${totalRevenue.toLocaleString()}`;
            }

        } catch (error) {
            console.error('Error updating dashboard stats:', error);
        }
    }

    // Example of displaying a listing
    function displayListing(listing) {
        const processedListing = processListing(listing);
        return `
            <div class="listing-card">
                <h3>${processedListing.businessName}</h3>
                <div class="listing-metrics">
                    <div class="metric">
                        <span class="label">MRR</span>
                        <span class="value">$${processedListing.mrr.toLocaleString()}</span>
                    </div>
                    <div class="metric">
                        <span class="label">Asking Price</span>
                        <span class="value">$${processedListing.askingPrice.toLocaleString()}</span>
                    </div>
                </div>
            </div>
        `;
    }

    // Update the displayUserListings function
    async function displayUserListings(userId) {
        const listingsContainer = document.getElementById('userListings');
        if (!listingsContainer) return;

        try {
            const listingsRef = collection(db, 'listings');
            const userListingsQuery = query(listingsRef, where("userId", "==", userId));
            const querySnapshot = await getDocs(userListingsQuery);

            if (querySnapshot.empty) {
                listingsContainer.innerHTML = `
                    <div class="empty-state">
                        <i class="fas fa-clipboard-list"></i>
                        <p>No listings yet</p>
                        <a href="/create-listing" class="btn-primary">Create Your First Listing</a>
                    </div>
                `;
                return;
            }

            const listingsHTML = querySnapshot.docs.map(doc => {
                const listing = doc.data();
                return `
                    <div class="listing-row">
                        <div class="listing-info">
                            <h3>${listing.businessName}</h3>
                            <div class="listing-details">
                                <div class="status-toggle">
                                    <label class="switch">
                                        <input type="checkbox" 
                                            ${listing.status === 'published' ? 'checked' : ''} 
                                            onchange="window.toggleListingStatus('${doc.id}', this.checked)">
                                        <span class="slider round"></span>
                                    </label>
                                    <span class="status-label">${listing.status === 'published' ? 'Listed' : 'Unlisted'}</span>
                                </div>
                                <span class="metric">MRR: ${numberUtils.formatCurrency(listing.mrr)}</span>
                                <span class="metric">Asking: ${numberUtils.formatCurrency(listing.askingPrice)}</span>
                                <button class="btn-details" onclick="viewListingDetails('${doc.id}')">
                                    <i class="fas fa-info-circle"></i>
                                    Details
                                </button>
                            </div>
                        </div>
                    </div>
                `;
            }).join('');

            listingsContainer.innerHTML = listingsHTML;

            // Add this at the end of displayMyListings function, after setting innerHTML
            document.querySelectorAll('.btn-marketplace').forEach(button => {
                button.addEventListener('click', () => {
                    const listingId = button.dataset.listingId;
                    const publish = button.dataset.publish === 'true';
                    window.toggleMarketplace(listingId, publish);
                });
            });

        } catch (error) {
            console.error('Error loading listings:', error);
            listingsContainer.innerHTML = `
                <div class="error-state">
                    <i class="fas fa-exclamation-circle"></i>
                    <p>Error loading listings. Please try again.</p>
                </div>
            `;
        }
    }

    // Add these functions for the new features
    async function toggleListingStatus(listingId, isPublished) {
        try {
            const listingRef = doc(db, 'listings', listingId);
            await updateDoc(listingRef, {
                status: isPublished ? 'published' : 'pending',
                updatedAt: serverTimestamp()
            });
            
            // Refresh the listings display
            initializeListings(auth.currentUser?.uid);
            
            showNotification(`Listing ${isPublished ? 'published to' : 'removed from'} marketplace`, 'success');
        } catch (error) {
            console.error('Error updating listing status:', error);
            showNotification('Error updating listing status', 'error');
        }
    }

    async function showListingDetails(listingId) {
        try {
            const listingRef = doc(db, 'listings', listingId);
            const listingDoc = await getDoc(listingRef);
            
            if (!listingDoc.exists()) {
                showNotification('Listing not found', 'error');
                return;
            }

            const listing = listingDoc.data();
            
            const modal = document.createElement('div');
            modal.className = 'modal listing-details-modal';
            modal.innerHTML = `
                <div class="modal-content">
                    <span class="close-modal">&times;</span>
                    <h2>${listing.businessName}</h2>
                    
                    <div class="listing-details-grid">
                        <div class="detail-section">
                            <h3>Business Overview</h3>
                            <p><strong>Type:</strong> ${listing.businessType}</p>
                            <p><strong>Industry:</strong> ${listing.industry}</p>
                            <p><strong>Model:</strong> ${listing.businessModel}</p>
                            <p><strong>Description:</strong> ${listing.description}</p>
                        </div>
                        
                        <div class="detail-section">
                            <h3>Financial Details</h3>
                            <p><strong>MRR:</strong> ${numberUtils.formatCurrency(listing.mrr)}</p>
                            <p><strong>ARR:</strong> ${numberUtils.formatCurrency(listing.arr)}</p>
                            <p><strong>Growth Rate:</strong> ${numberUtils.formatPercentage(listing.growthRate)}</p>
                            <p><strong>Net Profit:</strong> ${numberUtils.formatCurrency(listing.netProfit)}</p>
                        </div>
                        
                        <div class="detail-section">
                            <h3>Tech Stack</h3>
                            <div class="tech-tags">
                                ${listing.techStack.map(tech => `
                                    <span class="tech-tag">${tech}</span>
                                `).join('')}
                            </div>
                        </div>
                    </div>
                </div>
            `;
            
            document.body.appendChild(modal);
            
            // Close modal functionality
            const closeBtn = modal.querySelector('.close-modal');
            closeBtn.onclick = () => modal.remove();
            modal.onclick = (e) => {
                if (e.target === modal) modal.remove();
            };

        } catch (error) {
            console.error('Error showing listing details:', error);
            showNotification('Error loading listing details', 'error');
        }
    }

    // Add these functions to your existing dashboard.js
    async function initializeListings(userId) {
        if (!userId) return;

        const listingsContainer = document.getElementById('userListings');
        const statusFilter = document.getElementById('listingStatusFilter');
        const sortBy = document.getElementById('listingSortBy');

        try {
            const listingsRef = collection(db, 'listings');
            let q = query(listingsRef, where("userId", "==", userId));
            
            // Apply status filter
            if (statusFilter && statusFilter.value !== 'all') {
                q = query(q, where("status", "==", statusFilter.value));
            }

            const querySnapshot = await getDocs(q);
            let listings = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            // Apply sorting
            if (sortBy) {
                listings = sortListings(listings, sortBy.value);
            }

            if (listings.length === 0) {
                listingsContainer.innerHTML = `
                    <div class="empty-state">
                        <i class="fas fa-clipboard-list"></i>
                        <p>No listings found</p>
                        <button onclick="window.location.href='/create-listing'" class="btn-primary">
                            Create Your First Listing
                        </button>
                    </div>
                `;
                return;
            }

            listingsContainer.innerHTML = listings.map(listing => `
                <div class="listing-row">
                    <div class="listing-info">
                        <h3>${listing.businessName}</h3>
                        <div class="listing-details">
                            <span class="status-badge ${listing.status}">${listing.status}</span>
                            <span class="metric">MRR: ${numberUtils.formatCurrency(listing.mrr)}</span>
                            <span class="metric">Asking: ${numberUtils.formatCurrency(listing.askingPrice)}</span>
                        </div>
                    </div>
                    <div class="listing-actions">
                        ${getActionButtons(listing)}
                    </div>
                </div>
            `).join('');

            // Update total listings count
            const totalListings = document.getElementById('totalListings');
            if (totalListings) {
                totalListings.textContent = listings.length;
            }

        } catch (error) {
            console.error('Error loading listings:', error);
            listingsContainer.innerHTML = `
                <div class="error-state">
                    <i class="fas fa-exclamation-circle"></i>
                    <p>Error loading listings. Please try again.</p>
                </div>
            `;
        }
    }

    function getActionButtons(listing) {
        const buttons = [];
        
        if (listing.status === 'pending') {
            buttons.push(`
                <button onclick="publishListing('${listing.id}')" class="btn-action publish">
                    <i class="fas fa-globe"></i>
                    Publish
                </button>
            `);
        }
        
        if (listing.status === 'published') {
            buttons.push(`
                <button onclick="markAsSold('${listing.id}')" class="btn-action sold">
                    <i class="fas fa-check-circle"></i>
                    Mark as Sold
                </button>
            `);
        }
        
        buttons.push(`
            <button onclick="deleteListing('${listing.id}')" class="btn-action delete">
                <i class="fas fa-trash"></i>
                Delete
            </button>
        `);
        
        return buttons.join('');
    }

    function sortListings(listings, sortType) {
        switch (sortType) {
            case 'newest':
                return listings.sort((a, b) => b.createdAt?.toMillis() - a.createdAt?.toMillis());
            case 'oldest':
                return listings.sort((a, b) => a.createdAt?.toMillis() - b.createdAt?.toMillis());
            case 'priceHigh':
                return listings.sort((a, b) => b.askingPrice - a.askingPrice);
            case 'priceLow':
                return listings.sort((a, b) => a.askingPrice - b.askingPrice);
            default:
                return listings;
        }
    }

    // Add event listeners for filters
    document.getElementById('statusFilter')?.addEventListener('change', () => {
        initializeListings(auth.currentUser.uid);
    });

    document.getElementById('sortBy')?.addEventListener('change', () => {
        initializeListings(auth.currentUser.uid);
    });

    // Edit and Delete functions
    async function editListing(listingId) {
        // Redirect to edit page with listing ID
        window.location.href = `/edit-listing.html?id=${listingId}`;
    }

    async function deleteListing(listingId) {
        if (!confirm('Are you sure you want to delete this listing?')) return;
        
        try {
            await deleteDoc(doc(db, 'listings', listingId));
            showSuccess('Listing deleted successfully');
            initializeListings(auth.currentUser.uid);
        } catch (error) {
            console.error("Error deleting listing:", error);
            showError('Failed to delete listing');
        }
    }

    // Add these new functions
    async function publishListing(listingId) {
        await activityTracker.logActivity('publish_listing', 'Published listing to marketplace');
        try {
            const listingRef = doc(db, 'listings', listingId);
            await updateDoc(listingRef, {
                status: 'published',
                updatedAt: serverTimestamp()
            });
            
            showSuccess('Listing published to marketplace');
            initializeListings(auth.currentUser.uid);
        } catch (error) {
            console.error('Error publishing listing:', error);
            showError('Failed to publish listing');
        }
    }

    async function markAsSold(listingId) {
        // Create sale confirmation modal
        const modal = document.createElement('div');
        modal.className = 'modal sale-confirmation-modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h2>Confirm Sale Details</h2>
                    <span class="close-modal">&times;</span>
                </div>
                <div class="modal-body">
                    <p class="sale-notice">
                        🎉 Congratulations on your sale! Please provide the following details to confirm.
                        <br><small>Note: SoldSaaS charges a 5% success fee on the final sale amount.</small>
                    </p>
                    <form id="saleConfirmationForm">
                        <div class="form-group">
                            <label>Buyer's Email *</label>
                            <input type="email" id="buyerEmail" required 
                                placeholder="Enter buyer's email address">
                        </div>
                        <div class="form-group">
                            <label>Final Sale Amount *</label>
                            <div class="input-with-prefix">
                                <span class="prefix">$</span>
                                <input type="number" id="saleAmount" required 
                                    placeholder="Enter final sale amount">
                            </div>
                        </div>
                        <div class="fee-calculation">
                            <div class="fee-row">
                                <span>Sale Amount:</span>
                                <span id="displayAmount">$0</span>
                            </div>
                            <div class="fee-row">
                                <span>SoldSaaS Fee (5%):</span>
                                <span id="feeAmount">$0</span>
                            </div>
                            <div class="fee-row total">
                                <span>You'll Receive:</span>
                                <span id="finalAmount">$0</span>
                            </div>
                        </div>
                        <div class="form-group">
                            <label class="checkbox-label">
                                <input type="checkbox" required>
                                I confirm these details are accurate and understand that a 5% fee will be invoiced
                            </label>
                        </div>
                        <div class="modal-actions">
                            <button type="button" class="btn-secondary" onclick="this.closest('.modal').remove()">
                                Cancel
                            </button>
                            <button type="submit" class="btn-primary">
                                Confirm Sale
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        `;
        document.body.appendChild(modal);

        // Setup form handling
        const form = modal.querySelector('#saleConfirmationForm');
        const saleAmountInput = modal.querySelector('#saleAmount');
        
        // Update fee calculations in real-time
        saleAmountInput.addEventListener('input', () => {
            const amount = Number(saleAmountInput.value) || 0;
            const fee = amount * 0.05;
            const final = amount - fee;
            
            modal.querySelector('#displayAmount').textContent = numberUtils.formatCurrency(amount);
            modal.querySelector('#feeAmount').textContent = numberUtils.formatCurrency(fee);
            modal.querySelector('#finalAmount').textContent = numberUtils.formatCurrency(final);
        });

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            try {
                const buyerEmail = form.querySelector('#buyerEmail').value;
                const saleAmount = Number(form.querySelector('#saleAmount').value);
                
                const listingRef = doc(db, 'listings', listingId);
                await updateDoc(listingRef, {
                    status: 'sold',
                    soldAt: serverTimestamp(),
                    updatedAt: serverTimestamp(),
                    saleDetails: {
                        buyerEmail,
                        saleAmount,
                        feeAmount: saleAmount * 0.05,
                        feePercentage: 5
                    }
                });
                
                modal.remove();
                showSuccess('Listing marked as sold');
                initializeListings(auth.currentUser.uid);
                
            } catch (error) {
                console.error('Error marking listing as sold:', error);
                showError('Failed to mark listing as sold');
            }
        });

        // Close modal functionality
        const closeBtn = modal.querySelector('.close-modal');
        closeBtn.onclick = () => modal.remove();
        modal.onclick = (e) => {
            if (e.target === modal) modal.remove();
        };
    }

    // Update the total listings card click handler to scroll to listings section
    const totalListingsCard = document.querySelector('.stat-card.clickable');
    if (totalListingsCard) {
        totalListingsCard.addEventListener('click', () => {
            const listingsSection = document.querySelector('.listings-section');
            if (listingsSection) {
                listingsSection.scrollIntoView({ behavior: 'smooth' });
            }
        });
    }

    // Keep the activity tracking initialization
    const activityTracker = new ActivityTracker();
    activityTracker.refreshActivities();
    window.activityTracker = activityTracker;

    // Initialize listings on page load
    initializeListings(auth.currentUser?.uid);

    // Add this function to display user listings
    async function displayMyListings(userId) {
        const listingsContainer = document.getElementById('myListingsGrid');
        if (!listingsContainer) return;

        try {
            const listingsRef = collection(db, 'listings');
            const q = query(listingsRef, where("userId", "==", userId));
            const querySnapshot = await getDocs(q);

            if (querySnapshot.empty) {
                listingsContainer.innerHTML = `
                    <div class="empty-state">
                        <i class="fas fa-clipboard-list"></i>
                        <p>No listings yet</p>
                        <a href="/create-listing" class="btn-primary">Create Your First Listing</a>
                    </div>
                `;
                return;
            }

            const listingsHTML = querySnapshot.docs.map(doc => {
                const listing = doc.data();
                return `
                    <div class="my-listing-card">
                        <div class="my-listing-header">
                            <span class="business-type">${listing.businessType}</span>
                        </div>
                        <div class="my-listing-body">
                            <p class="my-listing-description">${listing.description}</p>
                            <div class="my-listing-metrics">
                                <div class="my-listing-metric">
                                    <div class="label">MRR</div>
                                    <div class="value">${numberUtils.formatCurrency(listing.mrr)}</div>
                                </div>
                                <div class="my-listing-metric">
                                    <div class="label">Users</div>
                                    <div class="value">${listing.activeUsers || 0}</div>
                                </div>
                                <div class="my-listing-metric">
                                    <div class="label">Asking Price</div>
                                    <div class="value">${numberUtils.formatCurrency(listing.askingPrice)}</div>
                                </div>
                            </div>
                        </div>
                        <div class="my-listing-footer">
                            <button class="btn-details" onclick="viewListingDetails('${doc.id}')">
                                <i class="fas fa-info-circle"></i>
                                View Details
                            </button>
                            <div class="listing-actions">
                                <button class="btn-marketplace ${listing.status === 'published' ? 'active' : ''}" 
                                    data-listing-id="${doc.id}" 
                                    data-publish="${listing.status !== 'published'}">
                                    <i class="fas fa-${listing.status === 'published' ? 'check-circle' : 'store'}"></i>
                                    ${listing.status === 'published' ? 'Listed' : 'Push to Market'}
                                </button>
                                <button class="btn-sold ${listing.sold ? 'active' : ''}" 
                                    onclick="window.toggleSoldStatus('${doc.id}', ${!listing.sold})">
                                    <i class="fas fa-${listing.sold ? 'undo' : 'check'}"></i>
                                    ${listing.sold ? 'Mark Unsold' : 'Mark Sold'}
                                </button>
                            </div>
                        </div>
                    </div>
                `;
            }).join('');

            listingsContainer.innerHTML = listingsHTML;

            // Add this at the end of displayMyListings function, after setting innerHTML
            document.querySelectorAll('.btn-marketplace').forEach(button => {
                button.addEventListener('click', () => {
                    const listingId = button.dataset.listingId;
                    const publish = button.dataset.publish === 'true';
                    window.toggleMarketplace(listingId, publish);
                });
            });

        } catch (error) {
            console.error('Error loading listings:', error);
            listingsContainer.innerHTML = `
                <div class="error-state">
                    <i class="fas fa-exclamation-circle"></i>
                    <p>Error loading listings. Please try again.</p>
                </div>
            `;
        }
    }

    // Add these helper functions
    window.toggleSoldStatus = async (listingId, sold) => {
        try {
            const listingRef = doc(db, 'listings', listingId);
            
            // Update listing status
            await updateDoc(listingRef, {
                sold,
                status: sold ? 'sold' : 'draft', // Change to draft when unmarking as sold
                updatedAt: serverTimestamp()
            });

            // Show success message
            const notification = document.createElement('div');
            notification.className = 'notification success';
            notification.innerHTML = `
                <div class="success-message">
                    <i class="fas fa-check-circle"></i>
                    <span>Listing marked as ${sold ? 'sold' : 'unsold'}</span>
                </div>
            `;
            document.body.appendChild(notification);
            setTimeout(() => notification.remove(), 5000);

            // Refresh listings
            await displayMyListings(auth.currentUser?.uid);
        } catch (error) {
            console.error('Error updating sold status:', error);
            const notification = document.createElement('div');
            notification.className = 'notification error';
            notification.innerHTML = `
                <div class="error-message">
                    <i class="fas fa-exclamation-circle"></i>
                    <span>Error updating listing status</span>
                </div>
            `;
            document.body.appendChild(notification);
            setTimeout(() => notification.remove(), 5000);
        }
    };

    async function loadRecentUsers() {
        const usersList = document.getElementById('recentUsersList');
        if (!usersList) return;

        try {
            const usersRef = collection(db, 'users');
            const q = query(usersRef, orderBy('createdAt', 'desc'), limit(5));
            const querySnapshot = await getDocs(q);

            if (querySnapshot.empty) {
                usersList.innerHTML = '<p class="empty-message">No users yet</p>';
                return;
            }

            const usersHTML = querySnapshot.docs.map(doc => {
                const userData = doc.data();
                const initial = userData.email ? userData.email[0].toUpperCase() : '?';
                const joinDate = userData.createdAt ? new Date(userData.createdAt.toDate()).toLocaleDateString() : 'Unknown';
                
                return `
                    <div class="user-item">
                        <div class="user-avatar">${initial}</div>
                        <div class="user-info">
                            <h4>${userData.email || 'Anonymous User'}</h4>
                            <p>Member</p>
                        </div>
                        <div class="user-joined">
                            Joined ${joinDate}
                        </div>
                    </div>
                `;
            }).join('');

            usersList.innerHTML = usersHTML;

        } catch (error) {
            console.error('Error loading users:', error);
            usersList.innerHTML = '<p class="error-message">Error loading users</p>';
        }
    }

    // Call this function when the dashboard loads
    loadRecentUsers();
}); 