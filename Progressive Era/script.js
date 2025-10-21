// Add smooth scrolling
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth'
            });
        }
    });
});

// Add fade-in animation for cards on home page
window.addEventListener('load', () => {
    const cards = document.querySelectorAll('.card');
    cards.forEach((card, index) => {
        setTimeout(() => {
            card.style.opacity = '0';
            card.style.transform = 'translateY(20px)';
            card.style.transition = 'opacity 0.5s, transform 0.5s';
            
            setTimeout(() => {
                card.style.opacity = '1';
                card.style.transform = 'translateY(0)';
            }, 100);
        }, index * 200);
    });
});

// Add animation for comic panels
const comicPanels = document.querySelectorAll('.comic-panel');
if (comicPanels.length > 0) {
    comicPanels.forEach((panel, index) => {
        panel.style.opacity = '0';
        panel.style.transform = 'scale(0.9)';
        
        setTimeout(() => {
            panel.style.transition = 'opacity 0.5s, transform 0.5s';
            panel.style.opacity = '1';
            panel.style.transform = 'scale(1)';
        }, index * 150);
    });
}

// Add hover effect for magazine cover
const magazineCover = document.querySelector('.magazine-cover');
if (magazineCover) {
    magazineCover.addEventListener('mouseenter', function() {
        this.style.transform = 'scale(1.02)';
        this.style.transition = 'transform 0.3s';
    });
    
    magazineCover.addEventListener('mouseleave', function() {
        this.style.transform = 'scale(1)';
    });
}

// Add zoom effect for cartoon image
const cartoonImage = document.getElementById('cartoonImage');
if (cartoonImage) {
    cartoonImage.style.cursor = 'pointer';
    cartoonImage.addEventListener('click', function() {
        if (this.style.transform === 'scale(1.5)') {
            this.style.transform = 'scale(1)';
        } else {
            this.style.transform = 'scale(1.5)';
            this.style.transition = 'transform 0.3s';
        }
    });
}
