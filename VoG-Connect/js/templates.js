// DOM Elements
const ageGroupFilter = document.getElementById('age-group');
const pillarFilter = document.getElementById('pillar');
const formatFilter = document.getElementById('format');
const templatesGrid = document.querySelector('.templates-grid');
const templateCards = document.querySelectorAll('.template-card');

// Filter State
let currentFilters = {
    age: 'all',
    pillar: 'all',
    format: 'all'
};

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    setupFilters();
    setupAnimations();
    setupLoadingState();
});

// Setup Filters
function setupFilters() {
    // Add event listeners to filters
    ageGroupFilter.addEventListener('change', handleFilterChange);
    pillarFilter.addEventListener('change', handleFilterChange);
    formatFilter.addEventListener('change', handleFilterChange);

    // Initialize filter state
    currentFilters = {
        age: ageGroupFilter.value,
        pillar: pillarFilter.value,
        format: formatFilter.value
    };
}

// Handle Filter Changes
function handleFilterChange(e) {
    const filterType = e.target.id.split('-')[0];
    const filterValue = e.target.value;

    // Update filter state
    currentFilters[filterType] = filterValue;

    // Apply filters with animation
    applyFilters();
}

// Apply Filters
function applyFilters() {
    // Show loading state
    showLoadingState();

    // Filter templates with animation
    templateCards.forEach(card => {
        const ageMatch = currentFilters.age === 'all' || card.dataset.age === currentFilters.age;
        const pillarMatch = currentFilters.pillar === 'all' || card.dataset.pillar === currentFilters.pillar;
        const formatMatch = currentFilters.format === 'all' || card.dataset.format === currentFilters.format;

        if (ageMatch && pillarMatch && formatMatch) {
            showTemplate(card);
        } else {
            hideTemplate(card);
        }
    });

    // Check if any templates are visible
    setTimeout(() => {
        const visibleTemplates = document.querySelectorAll('.template-card:not(.filtered)');
        if (visibleTemplates.length === 0) {
            showNoResults();
        } else {
            hideNoResults();
        }
        hideLoadingState();
    }, 300);
}

// Show Template
function showTemplate(card) {
    card.classList.remove('filtered');
    gsap.to(card, {
        opacity: 1,
        scale: 1,
        duration: 0.3,
        ease: 'power2.out'
    });
}

// Hide Template
function hideTemplate(card) {
    card.classList.add('filtered');
    gsap.to(card, {
        opacity: 0,
        scale: 0.95,
        duration: 0.3,
        ease: 'power2.in'
    });
}

// Show No Results
function showNoResults() {
    let noResults = document.querySelector('.no-results');
    if (!noResults) {
        noResults = document.createElement('div');
        noResults.className = 'no-results';
        noResults.innerHTML = `
            <i class="fas fa-search"></i>
            <h3>No Templates Found</h3>
            <p>Try adjusting your filters to find what you're looking for.</p>
        `;
        templatesGrid.appendChild(noResults);
    }
    gsap.from(noResults, {
        opacity: 0,
        y: 20,
        duration: 0.3,
        ease: 'power2.out'
    });
}

// Hide No Results
function hideNoResults() {
    const noResults = document.querySelector('.no-results');
    if (noResults) {
        gsap.to(noResults, {
            opacity: 0,
            y: -20,
            duration: 0.3,
            ease: 'power2.in',
            onComplete: () => noResults.remove()
        });
    }
}

// Setup Animations
function setupAnimations() {
    // Animate template cards on load
    gsap.from(templateCards, {
        y: 50,
        opacity: 0,
        duration: 0.5,
        stagger: 0.1,
        ease: 'power2.out',
        delay: 0.5
    });

    // Animate filters
    gsap.from('.filter-group', {
        y: 20,
        opacity: 0,
        duration: 0.5,
        stagger: 0.1,
        ease: 'power2.out',
        delay: 0.3
    });
}

// Loading State
function showLoadingState() {
    templateCards.forEach(card => {
        card.classList.add('loading');
    });
}

function hideLoadingState() {
    templateCards.forEach(card => {
        card.classList.remove('loading');
    });
}

// Download Handling
document.querySelectorAll('.download-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        e.preventDefault();
        const href = btn.getAttribute('href');
        
        // Show loading state
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Downloading...';
        btn.classList.add('loading');

        // Simulate download (replace with actual download logic)
        setTimeout(() => {
            window.location.href = href;
            btn.innerHTML = '<i class="fas fa-download"></i> Download';
            btn.classList.remove('loading');
        }, 1000);
    });
});

// Responsive Handling
let resizeTimer;
window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
        // Update grid layout
        const width = window.innerWidth;
        if (width < 768) {
            templatesGrid.style.gridTemplateColumns = 'repeat(auto-fit, minmax(250px, 1fr))';
        } else {
            templatesGrid.style.gridTemplateColumns = 'repeat(auto-fit, minmax(300px, 1fr))';
        }
    }, 250);
});

// Print Handling
window.addEventListener('beforeprint', () => {
    // Hide filters and download buttons
    document.querySelector('.filters').style.display = 'none';
    document.querySelectorAll('.download-btn').forEach(btn => {
        btn.style.display = 'none';
    });
});

window.addEventListener('afterprint', () => {
    // Show filters and download buttons
    document.querySelector('.filters').style.display = 'flex';
    document.querySelectorAll('.download-btn').forEach(btn => {
        btn.style.display = 'inline-flex';
    });
});

// Accessibility
function setupAccessibility() {
    // Add ARIA labels
    templateCards.forEach(card => {
        const title = card.querySelector('h3').textContent;
        card.setAttribute('aria-label', `Template: ${title}`);
    });

    // Add keyboard navigation
    templateCards.forEach(card => {
        card.setAttribute('tabindex', '0');
        card.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                card.click();
            }
        });
    });
}

// Initialize accessibility
setupAccessibility();

// Export functions for use in other files
window.templates = {
    applyFilters,
    showTemplate,
    hideTemplate,
    showNoResults,
    hideNoResults
}; 