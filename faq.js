document.addEventListener('DOMContentLoaded', function() {
    // FAQ Navigation
    const navButtons = document.querySelectorAll('.faq-nav-btn');
    const faqItems = document.querySelectorAll('.faq-item');

    // Show all items initially
    showCategory('general');

    navButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Update active button
            navButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');

            // Show items for selected category
            const category = button.getAttribute('data-category');
            showCategory(category);
        });
    });

    // FAQ Item Toggle
    faqItems.forEach(item => {
        item.addEventListener('click', () => {
            const isActive = item.classList.contains('active');
            
            // If clicking a different item, close others and open this one
            if (!isActive) {
                faqItems.forEach(i => i.classList.remove('active'));
                item.classList.add('active');
            }
            // If clicking the same item, just toggle it
            else {
                item.classList.remove('active');
            }
        });
    });

    // Function to show items for a specific category
    function showCategory(category) {
        faqItems.forEach(item => {
            if (item.getAttribute('data-category') === category) {
                item.style.display = 'block';
                // Add a fade-in animation
                item.style.opacity = '0';
                setTimeout(() => {
                    item.style.opacity = '1';
                }, 50);
            } else {
                item.style.display = 'none';
            }
        });
    }
}); 