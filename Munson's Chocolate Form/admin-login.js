// Admin credentials
const ADMIN_EMAIL = 'rjsbackpack@gmail.com';
const ADMIN_PASSWORD = 'Fire5209!';

document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('login-form');
    const emailInput = document.getElementById('admin-email');
    const passwordInput = document.getElementById('admin-password');
    const errorMessage = document.getElementById('error-message');

    loginForm.addEventListener('submit', function(e) {
        e.preventDefault();

        const enteredEmail = emailInput.value.trim();
        const enteredPassword = passwordInput.value;

        // Validate credentials
        if (enteredEmail === ADMIN_EMAIL && enteredPassword === ADMIN_PASSWORD) {
            // Store authentication token
            sessionStorage.setItem('adminAuthenticated', 'true');
            sessionStorage.setItem('adminEmail', enteredEmail);
            
            // Redirect to admin page
            window.location.href = 'admin.html';
        } else {
            // Show error message
            errorMessage.textContent = 'Invalid email or password. Please try again.';
            errorMessage.classList.add('show');
            
            // Shake animation and clear after delay
            setTimeout(() => {
                errorMessage.classList.remove('show');
            }, 3000);

            // Clear password field
            passwordInput.value = '';
            passwordInput.focus();
        }
    });

    // Remove error on input
    emailInput.addEventListener('input', () => {
        errorMessage.classList.remove('show');
    });

    passwordInput.addEventListener('input', () => {
        errorMessage.classList.remove('show');
    });
});
