// Animation Configuration
const animationConfig = {
    duration: 0.5,
    ease: 'power2.out',
    stagger: 0.1
};

// Initialize Animations
document.addEventListener('DOMContentLoaded', () => {
    initializeAnimations();
    setupScrollAnimations();
    setupParallaxEffect();
});

// Initialize All Animations
function initializeAnimations() {
    // Animate hero section
    gsap.from('.hero h1', {
        y: 50,
        opacity: 0,
        duration: animationConfig.duration,
        ease: animationConfig.ease
    });

    gsap.from('.hero p', {
        y: 30,
        opacity: 0,
        duration: animationConfig.duration,
        delay: 0.2,
        ease: animationConfig.ease
    });

    // Animate pillars
    gsap.from('.pillar', {
        y: 100,
        opacity: 0,
        duration: animationConfig.duration,
        stagger: animationConfig.stagger,
        ease: animationConfig.ease,
        delay: 0.5
    });
}

// Setup Scroll Animations
function setupScrollAnimations() {
    // Create ScrollTrigger for each section
    gsap.utils.toArray('section').forEach(section => {
        gsap.from(section, {
            scrollTrigger: {
                trigger: section,
                start: 'top 80%',
                toggleActions: 'play none none reverse'
            },
            y: 50,
            opacity: 0,
            duration: animationConfig.duration,
            ease: animationConfig.ease
        });
    });

    // Animate elements when they come into view
    const animatedElements = document.querySelectorAll('.animate-on-scroll');
    animatedElements.forEach(element => {
        gsap.from(element, {
            scrollTrigger: {
                trigger: element,
                start: 'top 80%',
                toggleActions: 'play none none reverse'
            },
            y: 30,
            opacity: 0,
            duration: animationConfig.duration,
            ease: animationConfig.ease
        });
    });
}

// Setup Parallax Effect
function setupParallaxEffect() {
    // Parallax effect for hero section
    gsap.to('.hero', {
        scrollTrigger: {
            trigger: '.hero',
            start: 'top top',
            end: 'bottom top',
            scrub: true
        },
        y: 100,
        ease: 'none'
    });

    // Parallax effect for pillars
    document.querySelectorAll('.pillar').forEach((pillar, index) => {
        gsap.to(pillar, {
            scrollTrigger: {
                trigger: pillar,
                start: 'top bottom',
                end: 'bottom top',
                scrub: true
            },
            y: 50 * (index % 2 === 0 ? 1 : -1),
            rotationY: 10 * (index % 2 === 0 ? 1 : -1),
            ease: 'none'
        });
    });
}

// Pillar Hover Animations
function setupPillarHoverAnimations() {
    document.querySelectorAll('.pillar').forEach(pillar => {
        pillar.addEventListener('mouseenter', () => {
            gsap.to(pillar, {
                scale: 1.05,
                rotationY: 10,
                duration: 0.3,
                ease: 'power2.out'
            });
        });

        pillar.addEventListener('mouseleave', () => {
            gsap.to(pillar, {
                scale: 1,
                rotationY: 0,
                duration: 0.3,
                ease: 'power2.out'
            });
        });
    });
}

// Modal Animations
function setupModalAnimations() {
    const modal = document.getElementById('pillar-modal');
    const modalContent = modal.querySelector('.modal-content');

    // Show modal animation
    function showModal() {
        gsap.set(modal, { display: 'block', opacity: 0 });
        gsap.to(modal, {
            opacity: 1,
            duration: 0.3,
            ease: 'power2.out'
        });

        gsap.from(modalContent, {
            y: -50,
            opacity: 0,
            duration: 0.5,
            ease: 'power2.out'
        });
    }

    // Hide modal animation
    function hideModal() {
        gsap.to(modalContent, {
            y: -50,
            opacity: 0,
            duration: 0.3,
            ease: 'power2.in'
        });

        gsap.to(modal, {
            opacity: 0,
            duration: 0.3,
            ease: 'power2.in',
            onComplete: () => {
                modal.style.display = 'none';
            }
        });
    }

    return { showModal, hideModal };
}

// Page Transition Animations
function setupPageTransitions() {
    // Create page transition overlay
    const overlay = document.createElement('div');
    overlay.className = 'page-transition-overlay';
    document.body.appendChild(overlay);

    // Handle page transitions
    document.querySelectorAll('a[href^="/"]').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const target = link.getAttribute('href');

            // Show overlay
            gsap.to(overlay, {
                opacity: 1,
                duration: 0.3,
                ease: 'power2.in',
                onComplete: () => {
                    window.location.href = target;
                }
            });
        });
    });
}

// Loading Animation
function setupLoadingAnimation() {
    const loading = document.createElement('div');
    loading.className = 'loading';
    loading.innerHTML = '<div class="loading-spinner"></div>';
    document.body.appendChild(loading);

    window.addEventListener('load', () => {
        gsap.to(loading, {
            opacity: 0,
            duration: 0.5,
            onComplete: () => {
                loading.remove();
            }
        });
    });
}

// Initialize all animation setups
document.addEventListener('DOMContentLoaded', () => {
    setupPillarHoverAnimations();
    setupPageTransitions();
    setupLoadingAnimation();
});

// Handle Window Resize
let resizeTimer;
window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
        // Update animations for new window size
        gsap.set('.pillar', { clearProps: 'all' });
        setupParallaxEffect();
    }, 250);
});

// Export animation functions for use in other files
window.animations = {
    showModal: setupModalAnimations().showModal,
    hideModal: setupModalAnimations().hideModal
}; 