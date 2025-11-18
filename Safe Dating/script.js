// Interactive functionality for the Safe Dating Poster

// Get modal elements
const modal = document.getElementById('pledge-modal');
const btn = document.getElementById('interactive-btn');
const span = document.getElementsByClassName('close')[0];
const pledgeBtn = document.getElementById('pledge-btn');
const confirmation = document.getElementById('pledge-confirmation');
const shareBtn = document.getElementById('share-btn');

// Quiz functionality
let currentQuestion = 1;
let score = 0;
const totalQuestions = 3;

// Initialize quiz
document.addEventListener('DOMContentLoaded', function() {
    console.log('Safe Dating Poster loaded successfully!');
    handleScrollAnimation();
    initializeQuiz();
});

function initializeQuiz() {
    const quizOptions = document.querySelectorAll('.quiz-option');
    
    quizOptions.forEach(option => {
        option.addEventListener('click', function() {
            if (this.classList.contains('correct') || this.classList.contains('incorrect')) {
                return; // Already answered
            }

            const isCorrect = this.getAttribute('data-correct') === 'true';
            const allOptions = this.parentElement.querySelectorAll('.quiz-option');
            
            // Disable all options
            allOptions.forEach(opt => {
                opt.style.pointerEvents = 'none';
                if (opt.getAttribute('data-correct') === 'true') {
                    opt.classList.add('correct');
                }
            });
            
            if (isCorrect) {
                score++;
                this.classList.add('correct');
            } else {
                this.classList.add('incorrect');
            }
            
            // Move to next question after delay
            setTimeout(() => {
                if (currentQuestion < totalQuestions) {
                    const currentQ = document.querySelector(`.quiz-question[data-question="${currentQuestion}"]`);
                    const nextQ = document.querySelector(`.quiz-question[data-question="${currentQuestion + 1}"]`);
                    
                    currentQ.classList.remove('active');
                    nextQ.classList.add('active');
                    currentQuestion++;
                } else {
                    // Show results
                    const lastQ = document.querySelector(`.quiz-question[data-question="${currentQuestion}"]`);
                    const results = document.querySelector('.quiz-results');
                    
                    lastQ.classList.remove('active');
                    results.classList.add('active');
                    
                    document.getElementById('quiz-score').textContent = score;
                    
                    const message = document.getElementById('quiz-message');
                    if (score === totalQuestions) {
                        message.textContent = '🎉 Perfect! You really know how to stay safe!';
                        message.style.color = '#28a745';
                    } else if (score >= 2) {
                        message.textContent = '👍 Great job! You\'re on the right track!';
                        message.style.color = '#667eea';
                    } else {
                        message.textContent = '📚 Keep learning! Review the poster for tips.';
                        message.style.color = '#f5576c';
                    }
                }
            }, 1500);
        });
    });
    
    // Restart quiz button
    document.getElementById('quiz-restart').addEventListener('click', function() {
        currentQuestion = 1;
        score = 0;
        
        // Reset all questions
        document.querySelectorAll('.quiz-question').forEach(q => {
            q.classList.remove('active');
            const options = q.querySelectorAll('.quiz-option');
            options.forEach(opt => {
                opt.classList.remove('correct', 'incorrect');
                opt.style.pointerEvents = 'auto';
            });
        });
        
        // Show first question
        document.querySelector('.quiz-question[data-question="1"]').classList.add('active');
        document.querySelector('.quiz-results').classList.remove('active');
    });
}

// Open modal when button is clicked
btn.onclick = function() {
    modal.style.display = 'block';
    document.body.style.overflow = 'hidden';
}

// Close modal when X is clicked
span.onclick = function() {
    modal.style.display = 'none';
    document.body.style.overflow = 'auto';
}

// Close modal when clicking outside of it
window.onclick = function(event) {
    if (event.target == modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
}

// Handle pledge button click
pledgeBtn.onclick = function() {
    pledgeBtn.style.display = 'none';
    confirmation.style.display = 'block';
    createConfetti();
    
    setTimeout(function() {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
        
        setTimeout(function() {
            pledgeBtn.style.display = 'block';
            confirmation.style.display = 'none';
        }, 500);
    }, 3000);
}

// Share button functionality
shareBtn.onclick = function() {
    if (navigator.share) {
        navigator.share({
            title: 'Safe Dating Guide',
            text: 'Check out this important information about safe dating for teens!',
            url: window.location.href
        }).catch(err => console.log('Error sharing:', err));
    } else {
        // Fallback - copy to clipboard
        const url = window.location.href;
        navigator.clipboard.writeText(url).then(() => {
            const originalText = shareBtn.textContent;
            shareBtn.textContent = '✓ Link Copied!';
            setTimeout(() => {
                shareBtn.textContent = originalText;
            }, 2000);
        });
    }
}

// Confetti effect
function createConfetti() {
    const colors = ['#f093fb', '#f5576c', '#FFD93D', '#4ecdc4', '#ff6b9d'];
    const confettiCount = 50;
    
    for (let i = 0; i < confettiCount; i++) {
        setTimeout(function() {
            const confetti = document.createElement('div');
            confetti.style.position = 'fixed';
            confetti.style.width = '10px';
            confetti.style.height = '10px';
            confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
            confetti.style.left = Math.random() * window.innerWidth + 'px';
            confetti.style.top = '-10px';
            confetti.style.borderRadius = '50%';
            confetti.style.zIndex = '10000';
            confetti.style.pointerEvents = 'none';
            
            document.body.appendChild(confetti);
            
            let pos = -10;
            let leftPos = parseInt(confetti.style.left);
            const fallSpeed = 2 + Math.random() * 3;
            const drift = (Math.random() - 0.5) * 2;
            
            const fall = setInterval(function() {
                if (pos >= window.innerHeight) {
                    clearInterval(fall);
                    confetti.remove();
                } else {
                    pos += fallSpeed;
                    leftPos += drift;
                    confetti.style.top = pos + 'px';
                    confetti.style.left = leftPos + 'px';
                    confetti.style.opacity = 1 - (pos / window.innerHeight);
                }
            }, 20);
        }, i * 30);
    }
}

// Add hover effects to info cards
const infoCards = document.querySelectorAll('.info-card');
infoCards.forEach(card => {
    card.addEventListener('mouseenter', function() {
        this.style.transform = 'translateY(-5px) scale(1.02)';
    });
    
    card.addEventListener('mouseleave', function() {
        this.style.transform = 'translateY(0) scale(1)';
    });
});

// Animate elements on scroll
function isElementInViewport(el) {
    const rect = el.getBoundingClientRect();
    return (
        rect.top >= 0 &&
        rect.left >= 0 &&
        rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
        rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    );
}

function handleScrollAnimation() {
    const elements = document.querySelectorAll('.info-card, .warning-section, .stat-card, .plan-card, .comparison-card, .consent-point');
    elements.forEach(el => {
        if (isElementInViewport(el)) {
            el.style.opacity = '1';
            el.style.transform = 'translateY(0)';
        }
    });
}

// Initialize scroll animations
window.addEventListener('scroll', handleScrollAnimation);
window.addEventListener('load', handleScrollAnimation);

// Add keyboard accessibility
document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape' && modal.style.display === 'block') {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
});

// Animate statistics numbers on scroll
function animateStats() {
    const statNumbers = document.querySelectorAll('.stat-number');
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.animation = 'pulse 1s ease-in-out';
            }
        });
    }, { threshold: 0.5 });
    
    statNumbers.forEach(stat => observer.observe(stat));
}

animateStats();

// Add smooth scroll behavior
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    });
});

// Print functionality
function printPoster() {
    window.print();
}

console.log('All interactive features loaded!');
