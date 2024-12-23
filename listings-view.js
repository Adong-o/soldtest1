import { auth, db } from './firebase.js';
import { collection, getDocs, query, where } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-firestore.js";
import { numberUtils } from './utils.js';

export class ListingsView {
    constructor() {
        this.createListingsView();
        this.bindEvents();
    }

    createListingsView() {
        const view = document.createElement('div');
        view.className = 'listings-view';
        view.innerHTML = `
            <div class="listings-container">
                <div class="listings-header">
                    <h2>Your Listings</h2>
                    <button class="close-listings">&times;</button>
                </div>
                <div class="listings-content">
                    <div class="loading">Loading your listings...</div>
                </div>
            </div>
        `;
        document.body.appendChild(view);
        this.view = view;
    }

    bindEvents() {
        const closeBtn = this.view.querySelector('.close-listings');
        closeBtn.addEventListener('click', () => this.hide());
        
        // Close on outside click
        this.view.addEventListener('click', (e) => {
            if (e.target === this.view) this.hide();
        });
    }

    async show() {
        this.view.classList.add('active');
        await this.loadListings();
    }

    hide() {
        this.view.classList.remove('active');
    }

    async loadListings() {
        const container = this.view.querySelector('.listings-content');
        
        try {
            const listingsRef = collection(db, 'listings');
            const userListingsQuery = query(
                listingsRef, 
                where("userId", "==", auth.currentUser.uid)
            );
            const querySnapshot = await getDocs(userListingsQuery);

            if (querySnapshot.empty) {
                container.innerHTML = this.getEmptyState();
                return;
            }

            const listings = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            container.innerHTML = `
                <div class="listings-grid">
                    ${listings.map(listing => this.getListingCard(listing)).join('')}
                </div>
            `;

        } catch (error) {
            console.error('Error loading listings:', error);
            container.innerHTML = this.getErrorState();
        }
    }

    getListingCard(listing) {
        return `
            <div class="listing-card">
                <div class="listing-header">
                    <h3>${listing.businessName}</h3>
                    <span class="listing-status status-${listing.status}">
                        ${listing.status.charAt(0).toUpperCase() + listing.status.slice(1)}
                    </span>
                </div>
                <div class="listing-metrics">
                    <div class="metric">
                        <span class="label">MRR</span>
                        <span class="value">${numberUtils.formatCurrency(listing.mrr)}</span>
                    </div>
                    <div class="metric">
                        <span class="label">Asking Price</span>
                        <span class="value">${numberUtils.formatCurrency(listing.askingPrice)}</span>
                    </div>
                </div>
                <div class="listing-actions">
                    <button onclick="listingsView.viewDetails('${listing.id}')" 
                        class="btn-action tooltip-trigger" 
                        data-tooltip="View Details">
                        <i class="fas fa-eye"></i>
                    </button>
                    ${this.getActionButton(listing)}
                    <button onclick="listingsView.deleteListing('${listing.id}')" 
                        class="btn-delete tooltip-trigger" 
                        data-tooltip="Delete Listing">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
    }

    getActionButton(listing) {
        if (listing.status === 'pending') {
            return `
                <button onclick="listingsView.publishListing('${listing.id}')" 
                    class="btn-publish tooltip-trigger" 
                    data-tooltip="Publish to Marketplace">
                    <i class="fas fa-globe"></i>
                </button>
            `;
        }
        if (listing.status === 'published') {
            return `
                <button onclick="listingsView.markAsSold('${listing.id}')" 
                    class="btn-sold tooltip-trigger" 
                    data-tooltip="Mark as Sold">
                    <i class="fas fa-check"></i>
                </button>
            `;
        }
        return '';
    }

    getEmptyState() {
        return `
            <div class="empty-state">
                <i class="fas fa-clipboard-list"></i>
                <p>No listings yet</p>
                <button onclick="window.location.href='/create-listing'" class="btn-primary">
                    Create Your First Listing
                </button>
            </div>
        `;
    }

    getErrorState() {
        return `
            <div class="error-state">
                <i class="fas fa-exclamation-circle"></i>
                <p>Error loading listings. Please try again.</p>
                <button onclick="listingsView.loadListings()" class="btn-primary">
                    Retry
                </button>
            </div>
        `;
    }
} 