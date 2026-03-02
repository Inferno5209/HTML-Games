// ===== STAR FIELD ANIMATION =====
const canvas = document.getElementById('star-canvas');
const ctx = canvas.getContext('2d');
let stars = [];
const STAR_COUNT = 200;

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}

function createStars() {
  stars = [];
  for (let i = 0; i < STAR_COUNT; i++) {
    stars.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      radius: Math.random() * 1.5 + 0.3,
      opacity: Math.random() * 0.8 + 0.2,
      twinkleSpeed: Math.random() * 0.02 + 0.005,
      twinklePhase: Math.random() * Math.PI * 2,
      drift: (Math.random() - 0.5) * 0.15
    });
  }
}

function drawStars(timestamp) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  stars.forEach(star => {
    const twinkle = Math.sin(timestamp * star.twinkleSpeed + star.twinklePhase) * 0.3 + 0.7;
    const alpha = star.opacity * twinkle;
    
    ctx.beginPath();
    ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
    ctx.fill();
    
    // Subtle glow
    if (star.radius > 1) {
      ctx.beginPath();
      ctx.arc(star.x, star.y, star.radius * 2.5, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(200, 220, 255, ${alpha * 0.08})`;
      ctx.fill();
    }
    
    // Slow drift
    star.y += star.drift;
    if (star.y > canvas.height + 5) star.y = -5;
    if (star.y < -5) star.y = canvas.height + 5;
  });
  
  requestAnimationFrame(drawStars);
}

window.addEventListener('resize', () => {
  resizeCanvas();
  createStars();
});

resizeCanvas();
createStars();
requestAnimationFrame(drawStars);


// ===== SCROLL REVEAL ====
const revealElements = document.querySelectorAll('.reveal');

const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
    }
  });
}, {
  threshold: 0.1,
  rootMargin: '0px 0px -50px 0px'
});

revealElements.forEach(el => revealObserver.observe(el));


// ===== NAV DOTS =====
const navDots = document.querySelectorAll('.nav-dot');
const sections = document.querySelectorAll('.section');

const sectionObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const sectionId = entry.target.id;
      navDots.forEach(dot => {
        dot.classList.toggle('active', dot.dataset.target === sectionId);
      });
    }
  });
}, {
  threshold: 0.4
});

sections.forEach(section => sectionObserver.observe(section));

navDots.forEach(dot => {
  dot.addEventListener('click', () => {
    const target = document.getElementById(dot.dataset.target);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth' });
    }
  });
});


// ===== EXHAUST PARTICLES FOR COMBUSTION ANIMATION =====
const combustionAnim = document.getElementById('combustion-anim');
if (combustionAnim) {
  function createExhaustParticle() {
    const particle = document.createElement('div');
    particle.classList.add('exhaust-particle');
    
    const size = Math.random() * 6 + 3;
    const x = combustionAnim.offsetWidth / 2 + (Math.random() - 0.5) * 24;
    const bottom = combustionAnim.offsetHeight * 0.6 - 60;
    
    particle.style.width = size + 'px';
    particle.style.height = size + 'px';
    particle.style.left = x + 'px';
    particle.style.bottom = (combustionAnim.offsetHeight - bottom) + 'px';
    particle.style.animationDuration = (Math.random() * 0.6 + 0.4) + 's';
    
    const hue = Math.random() > 0.5 ? '25' : '40';
    particle.style.background = `hsla(${hue}, 100%, ${50 + Math.random() * 30}%, 0.7)`;
    
    combustionAnim.appendChild(particle);
    
    setTimeout(() => {
      particle.remove();
    }, 1200);
  }
  
  setInterval(createExhaustParticle, 80);
}


// ===== TOP NAV SCROLL EFFECT =====
const topNav = document.getElementById('top-nav');
let lastScroll = 0;

window.addEventListener('scroll', () => {
  const currentScroll = window.scrollY;
  
  if (currentScroll > 100) {
    topNav.style.borderBottom = '1px solid rgba(255, 107, 53, 0.15)';
  } else {
    topNav.style.borderBottom = '1px solid rgba(255, 255, 255, 0.08)';
  }
  
  lastScroll = currentScroll;
});


// ===== ATOM HOVER TOOLTIPS =====
const atoms = document.querySelectorAll('.atom');
atoms.forEach(atom => {
  atom.addEventListener('mouseenter', () => {
    atom.style.boxShadow = '0 0 20px currentColor';
  });
  atom.addEventListener('mouseleave', () => {
    atom.style.boxShadow = '';
  });
});


// ===== SMOOTH LINKS =====
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function (e) {
    const targetId = this.getAttribute('href');
    if (targetId === '#') return;
    e.preventDefault();
    const target = document.querySelector(targetId);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth' });
    }
  });
});
