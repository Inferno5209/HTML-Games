function toggleHamburgerMenu(forceClose) {
    const hamburger = document.querySelector('.hamburger-btn');
    const navMenu = document.querySelector('.hamburger-menu');

    if (forceClose === false) {
        hamburger.classList.remove('active');
        navMenu.classList.remove('active');
    } else {
        hamburger.classList.toggle('active');
        navMenu.classList.toggle('active');
    }
}

// Close menu when clicking outside
document.addEventListener('click', function (event) {
    const hamburger = document.querySelector('.hamburger-btn');
    const navMenu = document.querySelector('.hamburger-menu');

    if (hamburger && navMenu && hamburger.classList.contains('active')) {
        if (!hamburger.contains(event.target) && !navMenu.contains(event.target)) {
            toggleHamburgerMenu(false);
        }
    }
});
