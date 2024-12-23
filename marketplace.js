import { db } from './firebase.js';
import { collection, query, where, getDocs, doc, getDoc, deleteDoc, setDoc, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-firestore.js";
import { numberUtils } from './utils.js';
import { auth } from './firebase.js';

document.addEventListener('DOMContentLoaded', () => {
    const industryFilter = document.getElementById('industryFilter');
    const priceFilter = document.getElementById('priceFilter');
    const mrrFilter = document.getElementById('mrrFilter');
    const clearFiltersBtn = document.getElementById('clearFilters');
    
    // Load initial listings
    loadListings();

    // Add event listeners for filters
    clearFiltersBtn.addEventListener('click', clearFilters);
    industryFilter.addEventListener('change', loadListings);
    priceFilter.addEventListener('change', loadListings);
    mrrFilter.addEventListener('change', loadListings);

    async function loadListings() {
        const listingsGrid = document.getElementById('listingsGrid');
        
        try {
            // Create base query for all published listings
            const listingsRef = collection(db, 'listings');
            const q = query(listingsRef);

            const querySnapshot = await getDocs(q);
            console.log('Found listings:', querySnapshot.size); // Debug log

            let listings = querySnapshot.docs.map(doc => {
                const data = doc.data();
                console.log('Listing data:', data); // Debug log
                return {
                    id: doc.id,
                    ...data
                };
            });

            // Apply filters
            listings = filterListings(listings);

            if (listings.length === 0) {
                listingsGrid.innerHTML = `
                    <div class="empty-state">
                        <i class="fas fa-store"></i>
                        <p>No listings available at the moment.</p>
                    </div>
                `;
                return;
            }

            const listingsHTML = listings.map(listing => `
                <div class="listing-card">
                    <div class="listing-header">
                        <span class="business-type">${listing.businessType}</span>
                    </div>
                    <div class="listing-body">
                        <p class="listing-description">${listing.description}</p>
                        <div class="listing-metrics">
                            <div class="metric">
                                <div class="label">MRR</div>
                                <div class="value">${numberUtils.formatCurrency(listing.mrr)}</div>
                            </div>
                            <div class="metric">
                                <div class="label">Net Profit</div>
                                <div class="value">${numberUtils.formatCurrency(listing.netProfit)}</div>
                            </div>
                            <div class="metric">
                                <div class="label">Active Users</div>
                                <div class="value">${listing.activeUsers || 0}</div>
                            </div>
                            <div class="metric highlight">
                                <div class="label">Asking Price</div>
                                <div class="value">${numberUtils.formatCurrency(listing.askingPrice)}</div>
                            </div>
                        </div>
                    </div>
                    <div class="listing-footer">
                        <button class="btn-save ${listing.saved ? 'saved' : ''}" onclick="window.toggleSaveListing('${listing.id}')">
                            <i class="fas fa-${listing.saved ? 'bookmark' : 'bookmark-o'}"></i>
                            ${listing.saved ? 'Saved' : 'Save'}
                        </button>
                        <button class="btn-view-details" onclick="window.viewListingDetails('${listing.id}')">
                            <i class="fas fa-info-circle"></i>
                            View Details
                        </button>
                    </div>
                </div>
            `).join('');

            listingsGrid.innerHTML = listingsHTML;

        } catch (error) {
            console.error('Error loading listings:', error);
            listingsGrid.innerHTML = `
                <div class="error-state">
                    <i class="fas fa-exclamation-circle"></i>
                    <p>Unable to load listings. Please try again.</p>
                    <button onclick="loadListings()" class="retry-button">
                        <i class="fas fa-sync"></i> Try Again
                    </button>
                </div>
            `;
        }
    }

    function filterListings(listings) {
        const industry = industryFilter.value;
        const [minPrice, maxPrice] = getPriceRange(priceFilter.value);
        const [minMRR, maxMRR] = getPriceRange(mrrFilter.value);

        return listings.filter(listing => {
            // Industry filter
            const matchesIndustry = !industry || listing.industry === industry;

            // Price filter
            const matchesPrice = (!minPrice || listing.askingPrice >= minPrice) &&
                               (!maxPrice || listing.askingPrice <= maxPrice);

            // MRR filter
            const matchesMRR = (!minMRR || listing.mrr >= minMRR) &&
                             (!maxMRR || listing.mrr <= maxMRR);

            return matchesIndustry && matchesPrice && matchesMRR;
        });
    }

    function getPriceRange(value) {
        if (!value) return [null, null];
        const [min, max] = value.split('-');
        return [
            min === '0' ? 0 : Number(min) || null,
            max === '+' ? Infinity : Number(max) || null
        ];
    }

    function clearFilters() {
        industryFilter.value = '';
        priceFilter.value = '';
        mrrFilter.value = '';
        loadListings();
    }

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
            modal.className = 'modal listing-details-modal';
            modal.style.display = 'block';
            modal.innerHTML = `
                <div class="modal-content">
                    <span class="close-modal">&times;</span>
                    <div class="listing-details-header">
                        <div class="header-badges">
                            <span class="business-type">${listing.businessType}</span>
                            <span class="industry-badge">${listing.industry}</span>
                        </div>
                        <h2>${listing.businessName}</h2>
                        <p class="listing-tagline">${listing.description}</p>
                        ${listing.websiteUrl ? `
                            <a href="${listing.websiteUrl}" target="_blank" class="website-link">
                                <i class="fas fa-external-link-alt"></i> Visit Website
                            </a>
                        ` : ''}
                    </div>
                    <div class="listing-details-grid">
                        <div class="detail-section highlight">
                            <h3>Key Metrics</h3>
                            <div class="metrics-grid">
                                <div class="metric">
                                    <div class="label">Monthly Revenue</div>
                                    <div class="value">${numberUtils.formatCurrency(listing.mrr)}</div>
                                </div>
                                <div class="metric">
                                    <div class="label">Annual Revenue</div>
                                    <div class="value">${numberUtils.formatCurrency(listing.arr)}</div>
                                </div>
                                <div class="metric">
                                    <div class="label">Net Profit</div>
                                    <div class="value">${numberUtils.formatCurrency(listing.netProfit)}</div>
                                </div>
                                <div class="metric highlight">
                                    <div class="label">Asking Price</div>
                                    <div class="value">${numberUtils.formatCurrency(listing.askingPrice)}</div>
                                </div>
                            </div>
                        </div>
                        
                        <div class="detail-section">
                            <h3>Business Overview</h3>
                            <p><strong>Model:</strong> ${listing.businessModel}</p>
                            <p><strong>Year Established:</strong> ${listing.established}</p>
                            <p><strong>Growth Rate:</strong> ${numberUtils.formatPercentage(listing.growthRate)}</p>
                            <p><strong>Gross Margin:</strong> ${numberUtils.formatPercentage(listing.grossMargin)}</p>
                        </div>

                        <div class="detail-section">
                            <h3>Users & Traffic</h3>
                            <div class="metrics-grid">
                                <div class="metric">
                                    <div class="label">Monthly Traffic</div>
                                    <div class="value">${listing.monthlyTraffic || 0}</div>
                                </div>
                                <div class="metric">
                                    <div class="label">Traffic Growth</div>
                                    <div class="value">${numberUtils.formatPercentage(listing.trafficGrowth)}</div>
                                </div>
                                <div class="metric">
                                    <div class="label">Active Users</div>
                                    <div class="value">${listing.activeUsers || 0}</div>
                                </div>
                                <div class="metric">
                                    <div class="label">Paying Customers</div>
                                    <div class="value">${listing.payingCustomers || 0}</div>
                                </div>
                            </div>
                        </div>

                        <div class="detail-section">
                            <h3>Tech Stack & Platforms</h3>
                            <div class="tech-tags">
                                ${listing.techStack ? listing.techStack.map(tech => `
                                    <span class="tech-tag">${tech}</span>
                                `).join('') : 'No tech stack specified'}
                            </div>
                            <div class="platforms-list">
                                ${listing.platforms ? listing.platforms.map(platform => `
                                    <span class="platform-tag">${platform}</span>
                                `).join('') : 'No platforms specified'}
                            </div>
                        </div>

                        <div class="detail-section">
                            <h3>Features</h3>
                            <p>${listing.features || 'No features specified'}</p>
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
                                ${listing.assetsIncluded ? listing.assetsIncluded.map(asset => `
                                    <span class="asset-tag">${asset}</span>
                                `).join('') : 'No assets specified'}
                            </div>
                        </div>

                        <div class="detail-section">
                            <h3>Additional Information</h3>
                            <p><strong>Reason for Sale:</strong> ${listing.reasonForSale}</p>
                        </div>
                    </div>
                    <div class="modal-actions">
                        <button class="btn-save ${listing.saved ? 'saved' : ''}" onclick="window.toggleSaveListing('${listing.id}')">
                            <i class="fas fa-${listing.saved ? 'bookmark' : 'bookmark-o'}"></i>
                            ${listing.saved ? 'Saved' : 'Save Listing'}
                        </button>
                        <button class="btn-contact" onclick="window.contactSeller('${listing.twitterUrl}')">
                            <i class="fab fa-twitter"></i>
                            Contact on Twitter
                        </button>
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

    window.toggleSaveListing = async (listingId) => {
        try {
            const userId = auth.currentUser?.uid;
            if (!userId) {
                showNotification('Please log in to save listings', 'error');
                return;
            }

            // Get listing details first
            const listingRef = doc(db, 'listings', listingId);
            const listingDoc = await getDoc(listingRef);
            const listingData = listingDoc.data();

            const savedListingRef = doc(db, 'users', userId, 'savedListings', listingId);
            const savedDoc = await getDoc(savedListingRef);

            if (savedDoc.exists()) {
                await deleteDoc(savedListingRef);
                showNotification('Listing removed from saved items', 'success');
            } else {
                // Save with full listing data
                await setDoc(savedListingRef, {
                    savedAt: serverTimestamp(),
                    listingId: listingId,
                    businessName: listingData.businessName,
                    businessType: listingData.businessType,
                    description: listingData.description,
                    mrr: listingData.mrr,
                    askingPrice: listingData.askingPrice,
                    industry: listingData.industry
                });
                showNotification('Listing saved successfully', 'success');
            }

            // Update button state
            const saveBtn = document.querySelector(`button[onclick="window.toggleSaveListing('${listingId}')"]`);
            if (saveBtn) {
                const isSaved = !savedDoc.exists();
                saveBtn.className = `btn-save ${isSaved ? 'saved' : ''}`;
                saveBtn.innerHTML = `
                    <i class="fas fa-${isSaved ? 'bookmark' : 'bookmark-o'}"></i>
                    ${isSaved ? 'Saved' : 'Save'}
                `;
            }
        } catch (error) {
            console.error('Error toggling save status:', error);
            showNotification('Error saving listing', 'error');
        }
    };

    window.contactSeller = (twitterUrl) => {
        if (!twitterUrl) {
            showNotification('Twitter contact information not available', 'error');
            return;
        }

        try {
            // Clean the URL by removing any duplicate https://x.com/ or @
            let cleanUrl = twitterUrl
                .replace(/^@/, '')                    // Remove @ if it exists at start
                .replace(/^https?:\/\/(www\.)?(x|twitter)\.com\//, '')  // Remove any twitter/x.com URLs
                .replace(/^https?:\/\/(www\.)?(x|twitter)\.com\//, '')  // Do it twice to catch duplicates
                .replace(/\/$/, '');                  // Remove trailing slash if exists

            // If no username was extracted, show error
            if (!cleanUrl) {
                showNotification('Invalid Twitter handle', 'error');
                return;
            }

            // Create proper Twitter URL
            const finalUrl = `https://x.com/${cleanUrl}`;
            window.open(finalUrl, '_blank');
        } catch (error) {
            console.error('Error processing Twitter URL:', error);
            showNotification('Error opening Twitter profile', 'error');
        }
    };

    function showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = message;
        document.body.appendChild(notification);
        setTimeout(() => notification.remove(), 3000);
    }
}); 