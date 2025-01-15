// Static featured listings data

const featuredListings = [
    {
        businessName: "SoldSaas",
        businessType: "Marketplace",
        monthlyRecurringRevenue: 200,
        monthlyUsers: 20000,
        askingPrice: 5000,
        description: "SoldSaaS is a reliable marketplace for buying and selling SaaS businesses. We simplify the process, connecting buyers and sellers securely. Whether you're investing or selling, our platform offers the tools and support needed for smooth, professional transactions.",
        twitterHandle: "@AdongoJakes",
        features: ["User authentication",
            "SaaS listings marketplace",
            "Dashboard for managing listings",
            "Real-time updates"],
        techStack: ["HTML, CSS", "JavaScript", "Firebase"],
        monthlyTraffic: 20000
    },
    {
        businessName: "CloudForm Pro",
        businessType: "Form Builder",
        monthlyRecurringRevenue: 18000,
        monthlyUsers: 2800,
        askingPrice: 540000,
        description: "Professional form builder with 50+ templates, custom validation, and API integration capabilities.",
        twitterHandle: "@CloudFormPro",
        features: ["Form Builder", "Custom Validation", "API Integration", "Template Library"],
        techStack: ["React", "Node.js", "MongoDB"],
        monthlyTraffic: 18000
    },
    {
        businessName: "InvoiceMaster",
        businessType: "Invoicing Software",
        monthlyRecurringRevenue: 32000,
        monthlyUsers: 2100,
        askingPrice: 960000,
        description: "Automated invoicing platform with payment processing, expense tracking, and financial reporting.",
        twitterHandle: "@InvoiceMaster",
        features: ["Automated Invoicing", "Payment Processing", "Expense Tracking", "Financial Reporting"],
        techStack: ["React", "Node.js", "MongoDB"],
        monthlyTraffic: 32000
    }
];


function displayFeaturedListings() {
    const listingsGrid = document.querySelector('.listings-grid');
    listingsGrid.innerHTML = ''; // Clear existing content

    featuredListings.forEach(listing => {
        const card = createListingCard(listing);
        listingsGrid.appendChild(card);
    });
}

function createListingCard(listing) {
    const card = document.createElement('div');
    card.className = 'listing-card';
    
    card.innerHTML = `
        <div class="listing-header">
            <span class="sponsored-tag">Sponsored</span>
            <h3>${listing.businessName}</h3>
            <p class="listing-type">${listing.businessType}</p>
        </div>
        <div class="listing-body">
            <div class="listing-metrics">
                <div class="metric">
                    <span class="metric-label">MRR</span>
                    <span class="metric-value">$${formatNumber(listing.monthlyRecurringRevenue)}</span>
                </div>
                <div class="metric">
                    <span class="metric-label">Users</span>
                    <span class="metric-value">${formatNumber(listing.monthlyUsers)}</span>
                </div>
                <div class="metric">
                    <span class="metric-label">Price</span>
                    <span class="metric-value">$${formatNumber(listing.askingPrice)}</span>
                </div>
            </div>
            <p class="listing-description">${truncateText(listing.description, 100)}</p>
            <div class="listing-footer">
                <button class="btn-primary view-details-btn">
                    View Details
                </button>
            </div>
        </div>
    `;

    // Add click event listener to the button
    const viewDetailsBtn = card.querySelector('.view-details-btn');
    viewDetailsBtn.addEventListener('click', () => showListingDetails(listing));

    return card;
}

function formatNumber(num) {
    if (num >= 1000000) {
        return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
        return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
}

function truncateText(text, maxLength) {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substr(0, maxLength) + '...';
}

function showListingDetails(listing) {
    const modal = document.createElement('div');
    modal.className = 'listing-modal';
    
    modal.innerHTML = `
        <div class="modal-content">
            <span class="close-modal">&times;</span>
            <div class="modal-header">
                <span class="sponsored-tag">Sponsored</span>
                <h2>${listing.businessName}</h2>
                <p class="business-type">${listing.businessType}</p>
            </div>
            
            <div class="modal-body">
                <div class="metrics-grid">
                    <div class="metric-card">
                        <h4>Monthly Revenue</h4>
                        <p>$${formatNumber(listing.monthlyRecurringRevenue)}</p>
                    </div>
                    <div class="metric-card">
                        <h4>Monthly Users</h4>
                        <p>${formatNumber(listing.monthlyUsers)}</p>
                    </div>
                    <div class="metric-card">
                        <h4>Monthly Traffic</h4>
                        <p>${formatNumber(listing.monthlyTraffic)}</p>
                    </div>
                    <div class="metric-card highlight">
                        <h4>Asking Price</h4>
                        <p>$${formatNumber(listing.askingPrice)}</p>
                    </div>
                </div>

                <div class="details-section">
                    <h3>Description</h3>
                    <p>${listing.description}</p>
                    
                    <h3>Key Features</h3>
                    <ul class="features-list">
                        ${listing.features.map(feature => `<li>${feature}</li>`).join('')}
                    </ul>
                    
                    <h3>Tech Stack</h3>
                    <div class="tech-stack">
                        ${listing.techStack.map(tech => `<span class="tech-tag">${tech}</span>`).join('')}
                    </div>
                </div>

                <div class="modal-footer">
                    <a href="https://twitter.com/${listing.twitterHandle.substring(1)}" 
                       target="_blank" 
                       rel="noopener noreferrer" 
                       class="twitter-connect-btn">
                        <i class="fab fa-twitter"></i>
                        Connect on Twitter
                    </a>
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
}

// Add CSS for the listing cards
const style = document.createElement('style');
style.textContent = `
    .listings-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
        gap: 2rem;
        padding: 2rem 5%;
        max-width: 1400px;
        margin: 0 auto;
    }

    .listing-card {
        background: white;
        border-radius: 1rem;
        overflow: hidden;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        transition: transform 0.2s ease;
    }

    .listing-card:hover {
        transform: translateY(-5px);
    }

    .listing-header {
        padding: 1.5rem;
        background: linear-gradient(135deg, var(--primary-color), #1e40af);
        color: white;
    }

    .listing-header h3 {
        margin: 0;
        font-size: 1.25rem;
    }

    .listing-type {
        font-size: 0.875rem;
        opacity: 0.9;
        margin-top: 0.25rem;
    }

    .listing-body {
        padding: 1.5rem;
    }

    .listing-metrics {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 1rem;
        margin-bottom: 1.5rem;
        text-align: center;
    }

    .listing-metrics .metric {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
    }

    .metric-label {
        font-size: 0.75rem;
        color: #6b7280;
        text-transform: uppercase;
    }

    .metric-value {
        font-size: 1.125rem;
        font-weight: 600;
        color: #111827;
    }

    .listing-description {
        color: #4b5563;
        font-size: 0.95rem;
        line-height: 1.5;
        margin-bottom: 1.5rem;
    }

    .listing-footer {
        text-align: center;
    }

    .sponsored-tag {
        background: #fef3c7;
        color: #92400e;
        padding: 0.25rem 0.75rem;
        border-radius: 1rem;
        font-size: 0.75rem;
        font-weight: 500;
        position: absolute;
        top: 1rem;
        right: 1rem;
    }

    .listing-modal {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
        backdrop-filter: blur(5px);
    }

    .modal-content {
        background: white;
        border-radius: 1rem;
        width: 95%;
        max-width: 800px;
        max-height: 90vh;
        overflow-y: auto;
        position: relative;
        box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
    }

    .modal-header {
        padding: 3rem;
        background: linear-gradient(135deg, var(--primary-color), #1e40af);
        color: white;
        position: relative;
    }

    .modal-body {
        padding: 3rem;
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 2rem;
    }

    .close-modal {
        position: absolute;
        top: 1rem;
        right: 1rem;
        font-size: 1.5rem;
        color: white;
        cursor: pointer;
        z-index: 1;
    }

    .metrics-grid {
        grid-column: span 2;
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 1.5rem;
        margin-bottom: 2rem;
    }

    .metric-card {
        padding: 1rem;
        background: #f9fafb;
        border-radius: 0.5rem;
        text-align: center;
    }

    .metric-card.highlight {
        background: #eff6ff;
        border: 2px solid var(--primary-color);
    }

    .metric-card h4 {
        color: #6b7280;
        font-size: 0.875rem;
        margin-bottom: 0.5rem;
    }

    .metric-card p {
        color: #111827;
        font-size: 1.25rem;
        font-weight: 600;
    }

    .details-section {
        margin-top: 2rem;
        grid-column: span 2;
    }

    .details-section h3 {
        color: #111827;
        margin-bottom: 1rem;
    }

    .features-list {
        list-style-type: none;
        padding: 0;
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 0.5rem;
    }

    .features-list li {
        padding: 0.5rem;
        background: #f3f4f6;
        border-radius: 0.25rem;
    }

    .tech-stack {
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem;
    }

    .tech-tag {
        background: #e0e7ff;
        color: #4f46e5;
        padding: 0.25rem 0.75rem;
        border-radius: 1rem;
        font-size: 0.875rem;
    }

    .twitter-connect-btn {
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
        background: #1da1f2;
        color: white;
        padding: 0.75rem 1.5rem;
        border-radius: 0.5rem;
        text-decoration: none;
        font-weight: 500;
        margin-top: auto;
        grid-column: span 2;
        justify-content: center;
        width: fit-content;
        margin: 2rem auto 0;
    }

    .twitter-connect-btn:hover {
        background: #1a8cd8;
    }

    @media (max-width: 768px) {
        .modal-content {
            width: 95%;
            margin: 1rem;
        }

        .modal-body {
            grid-template-columns: 1fr;
            padding: 1.5rem;
        }

        .metrics-grid {
            grid-template-columns: repeat(2, 1fr);
        }

        .modal-header {
            padding: 2rem;
        }
    }
`;

document.head.appendChild(style);

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', displayFeaturedListings); 

// Make showListingDetails available globally
window.showListingDetails = showListingDetails; 