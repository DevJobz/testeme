// FAQ Manager - Handles FAQ page functionality
class FAQManager {
    constructor() {
        this.init();
    }

    init() {
        this.setupEventListeners();
    }

    setupEventListeners() {
        // FAQ accordion functionality
        document.addEventListener('click', (e) => {
            if (e.target.closest('.faq-question')) {
                const faqItem = e.target.closest('.faq-item');
                this.toggleFAQItem(faqItem);
            }
        });

        // Search functionality (if needed in the future)
        this.setupSearch();
    }

    toggleFAQItem(faqItem) {
        const isActive = faqItem.classList.contains('active');
        
        // Close all other FAQ items
        const allFaqItems = document.querySelectorAll('.faq-item');
        allFaqItems.forEach(item => {
            if (item !== faqItem) {
                item.classList.remove('active');
            }
        });

        // Toggle current item
        if (isActive) {
            faqItem.classList.remove('active');
        } else {
            faqItem.classList.add('active');
        }
    }

    setupSearch() {
        // Future implementation for FAQ search
        // This could be added later if needed
    }

    openAllFAQs() {
        const allFaqItems = document.querySelectorAll('.faq-item');
        allFaqItems.forEach(item => {
            item.classList.add('active');
        });
    }

    closeAllFAQs() {
        const allFaqItems = document.querySelectorAll('.faq-item');
        allFaqItems.forEach(item => {
            item.classList.remove('active');
        });
    }

    filterFAQs(searchTerm) {
        const faqItems = document.querySelectorAll('.faq-item');
        const searchLower = searchTerm.toLowerCase();

        faqItems.forEach(item => {
            const question = item.querySelector('.faq-question h3').textContent.toLowerCase();
            const answer = item.querySelector('.faq-answer').textContent.toLowerCase();
            
            if (question.includes(searchLower) || answer.includes(searchLower)) {
                item.style.display = 'block';
            } else {
                item.style.display = 'none';
            }
        });
    }
}

// Initialize FAQ Manager
window.faqManager = new FAQManager();

