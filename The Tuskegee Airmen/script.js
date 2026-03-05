/**
 * script.js - Interactive elements for the Tuskegee Airmen Presentation
 */

document.addEventListener('DOMContentLoaded', () => {

    // 1. Navigation Background on Scroll
    const navbar = document.getElementById('navbar');
    
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });

    // 2. Intersection Observer for Scroll Animations
    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.15 // Trigger when 15% of the element is visible
    };

    const scrollObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-visible');
                
                // If the element has a stat-number, trigger counter animation
                if (entry.target.classList.contains('stats-container')) {
                    const statNumbers = entry.target.querySelectorAll('.stat-number');
                    statNumbers.forEach(stat => animateValue(stat));
                }
                
                // Optional: Stop observing once animated
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    const animatedElements = document.querySelectorAll('.animate-on-scroll');
    animatedElements.forEach(el => scrollObserver.observe(el));

    // 3. Number Counter Animation for Statistics
    function animateValue(obj) {
        if (obj.classList.contains('counted')) return;
        obj.classList.add('counted');

        const target = parseInt(obj.getAttribute('data-target'));
        const duration = 2000; // ms
        const start = 0;
        let startTimestamp = null;

        const step = (timestamp) => {
            if (!startTimestamp) startTimestamp = timestamp;
            const progress = Math.min((timestamp - startTimestamp) / duration, 1);
            
            // Easing function for smooth deceleration
            const easeOutQuart = 1 - Math.pow(1 - progress, 4);
            
            let currentVal = Math.floor(easeOutQuart * (target - start) + start);
            
            // Add a plus sign to specific stats
            if (target === 950 && currentVal === 950) {
                obj.innerHTML = currentVal + "+";
            } else {
                obj.innerHTML = currentVal.toLocaleString();
            }
            
            if (progress < 1) {
                window.requestAnimationFrame(step);
            }
        };
        
        window.requestAnimationFrame(step);
    }
});
