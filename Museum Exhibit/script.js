// Digital Museum Exhibit - Interactive JavaScript

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    initializeNavigation();
    initializeArtifacts();
});

// Navigation between main sections
function initializeNavigation() {
    const navButtons = document.querySelectorAll('.nav-btn');
    const sections = document.querySelectorAll('.exhibit-section');
    
    navButtons.forEach(button => {
        button.addEventListener('click', function() {
            const targetSection = this.getAttribute('data-section');
            
            // Remove active class from all buttons and sections
            navButtons.forEach(btn => btn.classList.remove('active'));
            sections.forEach(section => section.classList.remove('active'));
            
            // Add active class to clicked button and target section
            this.classList.add('active');
            document.getElementById(targetSection).classList.add('active');
            
            // Scroll to top of page smoothly
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });
    });
}

// Artifact slideshow navigation
function initializeArtifacts() {
    const artifactButtons = document.querySelectorAll('.artifact-btn');
    const artifacts = document.querySelectorAll('.artifact');
    
    artifactButtons.forEach(button => {
        button.addEventListener('click', function() {
            const targetArtifact = this.getAttribute('data-artifact');
            
            // Remove active class from all artifact buttons and artifacts
            artifactButtons.forEach(btn => btn.classList.remove('active'));
            artifacts.forEach(artifact => artifact.classList.remove('active'));
            
            // Add active class to clicked button and target artifact
            this.classList.add('active');
            document.querySelector(`.artifact[data-artifact-id="${targetArtifact}"]`).classList.add('active');
            
            // Scroll to artifacts section smoothly
            const artifactsSection = document.getElementById('artifacts');
            const offsetTop = artifactsSection.offsetTop - 100;
            window.scrollTo({
                top: offsetTop,
                behavior: 'smooth'
            });
        });
    });
    
    // Add keyboard navigation for artifacts
    document.addEventListener('keydown', function(e) {
        const currentArtifact = document.querySelector('.artifact.active');
        if (!currentArtifact) return;
        
        const currentId = parseInt(currentArtifact.getAttribute('data-artifact-id'));
        let nextId = currentId;
        
        // Arrow key navigation
        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
            nextId = currentId < 5 ? currentId + 1 : 1;
        } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
            nextId = currentId > 1 ? currentId - 1 : 5;
        } else {
            return; // Exit if not arrow key
        }
        
        // Trigger the appropriate artifact button click
        const targetButton = document.querySelector(`.artifact-btn[data-artifact="${nextId}"]`);
        if (targetButton) {
            targetButton.click();
        }
    });
}

// Add smooth scrolling for all anchor links (if any are added later)
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Add print functionality
function printExhibit() {
    window.print();
}

// Vocabulary search/filter (bonus feature)
function addVocabularySearch() {
    const vocabSection = document.getElementById('vocab');
    const vocabGrid = vocabSection.querySelector('.vocab-grid');
    
    // Create search input
    const searchContainer = document.createElement('div');
    searchContainer.style.cssText = 'margin: 2rem 0; text-align: center;';
    searchContainer.innerHTML = `
        <input type="text" 
               id="vocab-search" 
               placeholder="Search vocabulary terms..." 
               style="padding: 0.75rem 1.5rem; 
                      font-size: 1rem; 
                      border: 2px solid #8b6f47; 
                      border-radius: 25px; 
                      width: 100%; 
                      max-width: 500px;
                      font-family: Georgia, serif;">
    `;
    
    vocabGrid.parentElement.insertBefore(searchContainer, vocabGrid);
    
    const searchInput = document.getElementById('vocab-search');
    const vocabCards = document.querySelectorAll('.vocab-card');
    
    searchInput.addEventListener('input', function() {
        const searchTerm = this.value.toLowerCase();
        
        vocabCards.forEach(card => {
            const title = card.querySelector('h3').textContent.toLowerCase();
            const description = card.querySelector('p').textContent.toLowerCase();
            
            if (title.includes(searchTerm) || description.includes(searchTerm)) {
                card.style.display = 'block';
                card.style.animation = 'fadeIn 0.3s ease';
            } else {
                card.style.display = 'none';
            }
        });
    });
}

// Initialize vocabulary search after DOM load
document.addEventListener('DOMContentLoaded', function() {
    addVocabularySearch();
});

// Add connection highlighting feature
function addConnectionHighlighting() {
    const connectionCards = document.querySelectorAll('.connection-card');
    
    connectionCards.forEach(card => {
        const strongTags = card.querySelectorAll('strong');
        
        strongTags.forEach(strong => {
            strong.style.cursor = 'help';
            strong.title = 'Key term - check vocabulary section for definition';
            
            strong.addEventListener('click', function() {
                // Navigate to vocabulary section
                const vocabButton = document.querySelector('.nav-btn[data-section="vocab"]');
                if (vocabButton) {
                    vocabButton.click();
                    
                    // Highlight the relevant vocab card
                    setTimeout(() => {
                        const term = this.textContent.trim();
                        const vocabCards = document.querySelectorAll('.vocab-card h3');
                        
                        vocabCards.forEach(heading => {
                            if (heading.textContent.toLowerCase().includes(term.toLowerCase())) {
                                const card = heading.parentElement;
                                card.style.backgroundColor = '#fffacd';
                                card.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                
                                // Remove highlight after 3 seconds
                                setTimeout(() => {
                                    card.style.backgroundColor = '';
                                }, 3000);
                            }
                        });
                    }, 500);
                }
            });
        });
    });
}

// Initialize connection highlighting
document.addEventListener('DOMContentLoaded', function() {
    addConnectionHighlighting();
});

// Add accessibility features
function enhanceAccessibility() {
    // Add ARIA labels to navigation buttons
    const navButtons = document.querySelectorAll('.nav-btn');
    navButtons.forEach(button => {
        const section = button.getAttribute('data-section');
        button.setAttribute('aria-label', `Navigate to ${section} section`);
    });
    
    // Add ARIA labels to artifact buttons
    const artifactButtons = document.querySelectorAll('.artifact-btn');
    artifactButtons.forEach(button => {
        const artifact = button.getAttribute('data-artifact');
        button.setAttribute('aria-label', `View artifact ${artifact}`);
    });
    
    // Add role attributes
    document.querySelector('.exhibit-nav').setAttribute('role', 'navigation');
    document.querySelector('.artifact-nav').setAttribute('role', 'navigation');
}

// Initialize accessibility features
document.addEventListener('DOMContentLoaded', function() {
    enhanceAccessibility();
});

// Progress indicator (shows which section user is viewing)
function addProgressIndicator() {
    const sections = ['intro', 'artifacts', 'connections', 'vocab', 'sources'];
    let currentIndex = 0;
    
    const progressBar = document.createElement('div');
    progressBar.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 0%;
        height: 4px;
        background: linear-gradient(90deg, #8b6f47, #d4c4a1);
        transition: width 0.3s ease;
        z-index: 1000;
    `;
    document.body.appendChild(progressBar);
    
    const navButtons = document.querySelectorAll('.nav-btn');
    navButtons.forEach((button, index) => {
        button.addEventListener('click', function() {
            currentIndex = index;
            const progress = ((currentIndex + 1) / sections.length) * 100;
            progressBar.style.width = progress + '%';
        });
    });
}

// Initialize progress indicator
document.addEventListener('DOMContentLoaded', function() {
    addProgressIndicator();
});

// Add educational tips feature
function addEducationalTips() {
    const tips = [
        "💡 Tip: Notice how vocabulary terms are highlighted throughout the curator's notes!",
        "💡 Tip: Use arrow keys to navigate between artifacts!",
        "💡 Tip: Click on bolded terms in the Connections Wall to jump to their definitions!",
        "💡 Tip: The Gilded Age got its name from Mark Twain's novel 'The Gilded Age: A Tale of Today'",
        "💡 Tip: Try searching for specific terms in the vocabulary section!"
    ];
    
    let currentTip = 0;
    
    const tipContainer = document.createElement('div');
    tipContainer.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: #2c1810;
        color: #f4e4c1;
        padding: 1rem 1.5rem;
        border-radius: 10px;
        box-shadow: 0 4px 8px rgba(0,0,0,0.3);
        max-width: 350px;
        font-size: 0.9rem;
        z-index: 1000;
        display: none;
        animation: slideIn 0.5s ease;
    `;
    
    const tipText = document.createElement('p');
    tipText.style.margin = '0';
    tipContainer.appendChild(tipText);
    
    const closeBtn = document.createElement('button');
    closeBtn.textContent = '×';
    closeBtn.style.cssText = `
        position: absolute;
        top: 5px;
        right: 10px;
        background: none;
        border: none;
        color: #f4e4c1;
        font-size: 1.5rem;
        cursor: pointer;
    `;
    closeBtn.onclick = () => tipContainer.style.display = 'none';
    tipContainer.appendChild(closeBtn);
    
    document.body.appendChild(tipContainer);
    
    // Show tip after 5 seconds
    setTimeout(() => {
        tipText.textContent = tips[currentTip];
        tipContainer.style.display = 'block';
        currentTip = (currentTip + 1) % tips.length;
        
        // Auto-hide after 10 seconds
        setTimeout(() => {
            tipContainer.style.display = 'none';
        }, 10000);
    }, 5000);
    
    // Show new tip every 30 seconds
    setInterval(() => {
        if (tipContainer.style.display === 'none') {
            tipText.textContent = tips[currentTip];
            tipContainer.style.display = 'block';
            currentTip = (currentTip + 1) % tips.length;
            
            setTimeout(() => {
                tipContainer.style.display = 'none';
            }, 10000);
        }
    }, 30000);
}

// Add slide-in animation
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(400px);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
`;
document.head.appendChild(style);

// Initialize educational tips
document.addEventListener('DOMContentLoaded', function() {
    addEducationalTips();
});

console.log('🏛️ Welcome to Voices of the Gilded Age! Use arrow keys to navigate artifacts.');