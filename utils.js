export const numberUtils = {
    // Convert number to string for storage
    toStorageString: (value) => {
        if (value === '' || value === null || value === undefined) return '';
        return value.toString();
    },

    // Convert string back to number for display
    fromStorage: (value) => {
        if (value === '' || value === null || value === undefined) return 0;
        return Number(value);
    },

    // Format currency
    formatCurrency: (value) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(value);
    },

    // Format percentage
    formatPercentage: (value) => {
        return `${value}%`;
    }
};

// Update any navigation functions to include .html
function navigateToMarketplace() {
    window.location.href = './marketplace.html';
} 