// Crystal Acres Website - Main JavaScript
// Admin System

// Admin Credentials
const ADMIN_EMAIL = 'rjsbackpack@gmail.com';
const ADMIN_PASSWORD = 'Fire5209!';
const MASTER_PASSWORD = 'CrystalAcres1234!';

// Admin State
let adminLoggedIn = false;
let failedLoginAttempts = 0;

// Disable right-click, F12, Ctrl+Shift+I, Ctrl+U, and other developer tools shortcuts
document.addEventListener('contextmenu', function(e) {
    e.preventDefault();
    return false;
});

document.addEventListener('keydown', function(e) {
    // Disable F12 (Developer Tools)
    if (e.keyCode === 123) {
        e.preventDefault();
        return false;
    }
    // Disable Ctrl+Shift+I (Inspect Element)
    if (e.ctrlKey && e.shiftKey && e.keyCode === 73) {
        e.preventDefault();
        return false;
    }
    // Disable Ctrl+Shift+J (Console)
    if (e.ctrlKey && e.shiftKey && e.keyCode === 74) {
        e.preventDefault();
        return false;
    }
    // Disable Ctrl+U (View Source)
    if (e.ctrlKey && e.keyCode === 85) {
        e.preventDefault();
        return false;
    }
    // Disable Ctrl+Shift+C (Inspect Element)
    if (e.ctrlKey && e.shiftKey && e.keyCode === 67) {
        e.preventDefault();
        return false;
    }
    // Disable Ctrl+S (Save Page)
    if (e.ctrlKey && e.keyCode === 83) {
        e.preventDefault();
        return false;
    }
});

// Disable text selection and copying
document.addEventListener('selectstart', function(e) {
    if (!e.target.closest('input, textarea')) {
        e.preventDefault();
        return false;
    }
});

document.addEventListener('copy', function(e) {
    if (!e.target.closest('input, textarea')) {
        e.preventDefault();
        return false;
    }
});

// Initialize admin system on page load
document.addEventListener('DOMContentLoaded', function() {
    checkAdminStatus();
    updateAdminButton();
    checkMaintenanceMode();
    loadSavedContent();
    
    // Load failed login attempts
    failedLoginAttempts = parseInt(localStorage.getItem('failedLoginAttempts') || '0');
});

// Load saved content from localStorage
function loadSavedContent() {
    const pageName = window.location.pathname.split('/').pop() || 'index.html';
    const savedContentStr = localStorage.getItem(`pageContent_${pageName}`);
    
    if (!savedContentStr) return;
    
    try {
        const savedContent = JSON.parse(savedContentStr);
        
        // Load headings
        const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
        headings.forEach((heading, index) => {
            if (heading.closest('footer') || heading.textContent.includes('Created by Riley')) {
                return;
            }
            const key = `heading_${index}`;
            if (savedContent[key]) {
                heading.innerHTML = savedContent[key];
            }
        });
        
        // Load text elements
        const textElements = document.querySelectorAll('p, li, .opening-content p, .info-content p, .cottages-intro, .cottage-summary, .cottage-capacity, .address p');
        textElements.forEach((element, index) => {
            if (element.closest('footer') || element.textContent.includes('Created by Riley')) {
                return;
            }
            const key = `text_${index}`;
            if (savedContent[key]) {
                element.innerHTML = savedContent[key];
            }
        });
        
        // Load hero overlay text
        if (savedContent['hero_h1']) {
            const heroH1 = document.querySelector('.hero-overlay h1');
            if (heroH1) heroH1.innerHTML = savedContent['hero_h1'];
        }
        if (savedContent['hero_p']) {
            const heroP = document.querySelector('.hero-overlay p');
            if (heroP) heroP.innerHTML = savedContent['hero_p'];
        }
        
        // Load contact items
        const contactItems = document.querySelectorAll('.contact-info .contact-item');
        contactItems.forEach((item, index) => {
            if (item.closest('footer')) return;
            const key = `contact_${index}`;
            if (savedContent[key]) {
                item.innerHTML = savedContent[key];
            }
        });
        
        // Load links
        const links = document.querySelectorAll('.info-content a, .contact-info a');
        links.forEach((link, index) => {
            if (link.closest('footer')) return;
            const key = `link_${index}`;
            if (savedContent[key]) {
                link.textContent = savedContent[key].text;
                link.href = savedContent[key].href;
            }
        });
        
        console.log('✅ Saved content loaded successfully');
    } catch (error) {
        console.error('❌ Error loading saved content:', error);
    }
}

// Check if admin is logged in (from localStorage)
function checkAdminStatus() {
    const loggedIn = localStorage.getItem('adminLoggedIn');
    adminLoggedIn = loggedIn === 'true';
    updateAdminButton();
    
    if (adminLoggedIn) {
        showEditButtons();
    } else {
        hideEditButtons();
    }
}

// Update admin button appearance based on login status
function updateAdminButton() {
    const adminBtn = document.getElementById('adminToggleBtn');
    const hiddenAdminBtn = document.getElementById('hiddenAdminBtn');
    
    if (adminBtn) {
        if (adminLoggedIn) {
            // Logged in state - show visible button, hide icon button
            adminBtn.style.display = 'block';
            if (hiddenAdminBtn) hiddenAdminBtn.style.display = 'none';
            
            adminBtn.innerHTML = `
                <span style="position: relative; z-index: 1; display: flex; align-items: center; gap: 8px;">
                    <span style="font-size: 18px;">🔓</span>
                    <span>Admin</span>
                </span>
            `;
            adminBtn.style.background = 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)';
            adminBtn.style.boxShadow = '0 4px 20px rgba(56, 239, 125, 0.5)';
        } else {
            // Logged out state - hide visible button, show icon button
            adminBtn.style.display = 'none';
            if (hiddenAdminBtn) hiddenAdminBtn.style.display = 'block';
        }
        
        // Add hover effect
        adminBtn.onmouseover = function() {
            this.style.transform = 'translateY(-2px)';
            if (adminLoggedIn) {
                this.style.boxShadow = '0 6px 25px rgba(56, 239, 125, 0.6)';
            } else {
                this.style.boxShadow = '0 6px 20px rgba(102, 126, 234, 0.5)';
            }
        };
        adminBtn.onmouseout = function() {
            this.style.transform = 'translateY(0)';
            if (adminLoggedIn) {
                this.style.boxShadow = '0 4px 20px rgba(56, 239, 125, 0.5)';
            } else {
                this.style.boxShadow = '0 4px 15px rgba(102, 126, 234, 0.4)';
            }
        };
    }
}

// Toggle admin mode (show login dialog or logout)
function toggleAdminMode() {
    if (adminLoggedIn) {
        // Already logged in, show logout confirmation
        if (confirm('Are you sure you want to logout?')) {
            logout();
        }
    } else {
        // Not logged in, show login dialog
        showLoginDialog();
    }
}

// Show login dialog
function showLoginDialog() {
    // Create dialog overlay
    const overlay = document.createElement('div');
    overlay.id = 'adminLoginOverlay';
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.7);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 10000;
    `;

    // Create dialog box
    const dialog = document.createElement('div');
    dialog.style.cssText = `
        background: white;
        padding: 30px;
        border-radius: 10px;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
        max-width: 400px;
        width: 90%;
    `;

    dialog.innerHTML = `
        <h2 style="margin: 0 0 20px 0; color: #333; font-size: 24px;">🔐 Admin Login</h2>
        <div style="margin-bottom: 15px;">
            <label style="display: block; margin-bottom: 5px; color: #666; font-weight: 500;">Email:</label>
            <input type="email" id="adminEmailInput" placeholder="admin@example.com" 
                style="width: 100%; padding: 10px; border: 2px solid #ddd; border-radius: 5px; font-size: 14px; box-sizing: border-box;">
        </div>
        <div style="margin-bottom: 20px;">
            <label style="display: block; margin-bottom: 5px; color: #666; font-weight: 500;">Password:</label>
            <div style="position: relative;">
                <input type="password" id="adminPasswordInput" placeholder="Enter password" 
                    style="width: 100%; padding: 10px 40px 10px 10px; border: 2px solid #ddd; border-radius: 5px; font-size: 14px; box-sizing: border-box;">
                <button type="button" id="toggleLoginPassword" style="position: absolute; right: 8px; top: 50%; transform: translateY(-50%); background: none; border: none; cursor: pointer; font-size: 18px; padding: 5px; color: #666;" title="Show/Hide Password">
                    👁️
                </button>
            </div>
        </div>
        <div id="loginError" style="color: #e74c3c; margin-bottom: 15px; font-size: 14px; display: none;"></div>
        <div style="display: flex; gap: 10px;">
            <button id="loginBtn" style="flex: 1; padding: 12px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border: none; border-radius: 5px; font-size: 16px; font-weight: 600; cursor: pointer;">
                Login
            </button>
            <button id="cancelLoginBtn" style="flex: 1; padding: 12px; background: #95a5a6; color: white; border: none; border-radius: 5px; font-size: 16px; font-weight: 600; cursor: pointer;">
                Cancel
            </button>
        </div>
    `;

    overlay.appendChild(dialog);
    document.body.appendChild(overlay);

    // Focus email input
    setTimeout(() => document.getElementById('adminEmailInput').focus(), 100);

    // Handle login button click
    document.getElementById('loginBtn').addEventListener('click', attemptLogin);

    // Handle cancel button click
    document.getElementById('cancelLoginBtn').addEventListener('click', closeLoginDialog);

    // Handle password visibility toggle
    document.getElementById('toggleLoginPassword').addEventListener('click', function() {
        const passwordInput = document.getElementById('adminPasswordInput');
        if (passwordInput.type === 'password') {
            passwordInput.type = 'text';
            this.textContent = '🙈';
        } else {
            passwordInput.type = 'password';
            this.textContent = '👁️';
        }
    });

    // Handle Enter key in inputs
    document.getElementById('adminEmailInput').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') attemptLogin();
    });
    document.getElementById('adminPasswordInput').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') attemptLogin();
    });

    // Close on overlay click
    overlay.addEventListener('click', function(e) {
        if (e.target === overlay) closeLoginDialog();
    });
}

// Attempt to login with provided credentials
function attemptLogin() {
    const emailInput = document.getElementById('adminEmailInput');
    const passwordInput = document.getElementById('adminPasswordInput');
    const errorDiv = document.getElementById('loginError');

    const email = emailInput.value.trim();
    const password = passwordInput.value;

    // Load admin users
    const admins = JSON.parse(localStorage.getItem('adminUsers') || '[]');
    
    // Check against all admin accounts and master password
    const validAdmin = admins.find(admin => admin.email === email && admin.password === password);
    const isMasterPassword = password === MASTER_PASSWORD;
    
    if (validAdmin || isMasterPassword) {
        // Successful login
        adminLoggedIn = true;
        localStorage.setItem('adminLoggedIn', 'true');
        failedLoginAttempts = 0;
        localStorage.setItem('failedLoginAttempts', '0');
        updateAdminButton();
        showEditButtons();
        checkMaintenanceMode();
        closeLoginDialog();
        
        if (isMasterPassword) {
            alert('✅ Successfully logged in with Master Password!');
        } else {
            alert(`✅ Successfully logged in as ${validAdmin.role}!`);
        }
    } else {
        // Failed login
        failedLoginAttempts++;
        localStorage.setItem('failedLoginAttempts', failedLoginAttempts.toString());
        
        if (failedLoginAttempts >= 3) {
            // Show master password override message
            errorDiv.textContent = '🔒 Too many failed attempts. Use Master Password to override.';
            errorDiv.style.display = 'block';
            passwordInput.value = '';
            emailInput.value = '';
            
            // Show master password hint
            setTimeout(() => {
                const hint = document.createElement('div');
                hint.style.cssText = 'margin-top: 10px; padding: 10px; background: rgba(102, 126, 234, 0.1); border-radius: 5px; font-size: 13px; color: #667eea;';
                hint.innerHTML = '💡 <strong>Hint:</strong> Use Master Password in password field to unlock';
                errorDiv.parentElement.insertBefore(hint, errorDiv.nextSibling);
            }, 500);
        } else {
            const attemptsLeft = 3 - failedLoginAttempts;
            errorDiv.textContent = `❌ Invalid credentials. ${attemptsLeft} attempt${attemptsLeft > 1 ? 's' : ''} remaining.`;
            errorDiv.style.display = 'block';
        }
        
        passwordInput.value = '';
        passwordInput.focus();
    }
}

// Close login dialog
function closeLoginDialog() {
    const overlay = document.getElementById('adminLoginOverlay');
    if (overlay) {
        overlay.remove();
    }
}

// Logout function
function logout() {
    adminLoggedIn = false;
    localStorage.removeItem('adminLoggedIn');
    updateAdminButton();
    hideEditButtons();
    checkMaintenanceMode();
    alert('✅ Successfully logged out!');
}

// Show/hide edit buttons based on admin status
function showEditButtons() {
    const editPageBtn = document.getElementById('editPageBtn');
    const editAmenitiesBtn = document.getElementById('editAmenitiesBtn');
    const adminToolsBtn = document.getElementById('adminToolsBtn');
    
    // Show Edit Page button only on main index page
    if (editPageBtn) {
        editPageBtn.style.display = 'block';
        // Add hover effects
        editPageBtn.onmouseover = function() {
            this.style.transform = 'translateY(-2px)';
            this.style.boxShadow = '0 6px 20px rgba(79, 172, 254, 0.5)';
        };
        editPageBtn.onmouseout = function() {
            this.style.transform = 'translateY(0)';
            this.style.boxShadow = '0 4px 15px rgba(79, 172, 254, 0.4)';
        };
    }
    
    // Show Edit Amenities button only on amenities pages
    if (editAmenitiesBtn) {
        editAmenitiesBtn.style.display = 'block';
        // Add hover effects
        editAmenitiesBtn.onmouseover = function() {
            this.style.transform = 'translateY(-2px)';
            this.style.boxShadow = '0 6px 20px rgba(250, 112, 154, 0.5)';
        };
        editAmenitiesBtn.onmouseout = function() {
            this.style.transform = 'translateY(0)';
            this.style.boxShadow = '0 4px 15px rgba(250, 112, 154, 0.4)';
        };
    }
    
    // Show Admin Tools button
    if (adminToolsBtn) {
        adminToolsBtn.style.display = 'block';
        // Add hover effects
        adminToolsBtn.onmouseover = function() {
            this.style.transform = 'translateY(-2px)';
            this.style.boxShadow = '0 6px 20px rgba(79, 172, 254, 0.5)';
        };
        adminToolsBtn.onmouseout = function() {
            this.style.transform = 'translateY(0)';
            this.style.boxShadow = '0 4px 15px rgba(79, 172, 254, 0.4)';
        };
    }
}

function hideEditButtons() {
    const editPageBtn = document.getElementById('editPageBtn');
    const editAmenitiesBtn = document.getElementById('editAmenitiesBtn');
    const savePageBtn = document.getElementById('savePageBtn');
    const cancelPageBtn = document.getElementById('cancelPageBtn');
    const adminToolsBtn = document.getElementById('adminToolsBtn');
    
    if (editPageBtn) editPageBtn.style.display = 'none';
    if (editAmenitiesBtn) editAmenitiesBtn.style.display = 'none';
    if (savePageBtn) savePageBtn.style.display = 'none';
    if (cancelPageBtn) cancelPageBtn.style.display = 'none';
    if (adminToolsBtn) adminToolsBtn.style.display = 'none';
}

// Store original content for cancel functionality
let originalContent = {};

// Edit Page functionality
function toggleEditMode() {
    if (!adminLoggedIn) {
        alert('⚠️ You must be logged in as admin to edit pages.');
        return;
    }
    
    const editPageBtn = document.getElementById('editPageBtn');
    const savePageBtn = document.getElementById('savePageBtn');
    const cancelPageBtn = document.getElementById('cancelPageBtn');
    
    // Toggle edit mode
    if (editPageBtn) editPageBtn.style.display = 'none';
    if (savePageBtn) {
        savePageBtn.style.display = 'block';
        savePageBtn.onmouseover = function() {
            this.style.transform = 'translateY(-2px)';
            this.style.boxShadow = '0 6px 25px rgba(56, 239, 125, 0.6)';
        };
        savePageBtn.onmouseout = function() {
            this.style.transform = 'translateY(0)';
            this.style.boxShadow = '0 4px 20px rgba(56, 239, 125, 0.5)';
        };
    }
    if (cancelPageBtn) {
        cancelPageBtn.style.display = 'block';
        cancelPageBtn.onmouseover = function() {
            this.style.transform = 'translateY(-2px)';
            this.style.boxShadow = '0 6px 25px rgba(238, 9, 121, 0.6)';
        };
        cancelPageBtn.onmouseout = function() {
            this.style.transform = 'translateY(0)';
            this.style.boxShadow = '0 4px 20px rgba(238, 9, 121, 0.5)';
        };
    }
    
    // Make content editable
    makeContentEditable();
    
    alert('📝 Edit mode activated! Click on any text to edit it. Click Save when done.');
}

// Make all text content editable
function makeContentEditable() {
    // Store original content
    originalContent = {};
    
    // Make ALL headings editable (h1, h2, h3, h4, h5, h6)
    const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
    headings.forEach((heading, index) => {
        // Skip footer headings
        if (heading.closest('footer') || heading.textContent.includes('Created by Riley')) {
            return;
        }
        
        const key = `heading_${index}`;
        originalContent[key] = heading.innerHTML;
        heading.contentEditable = true;
        heading.style.outline = '2px dashed #4facfe';
        heading.style.outlineOffset = '5px';
        heading.style.cursor = 'text';
        heading.style.transition = 'all 0.3s ease';
        
        heading.addEventListener('focus', function() {
            this.style.outline = '2px solid #4facfe';
            this.style.backgroundColor = 'rgba(79, 172, 254, 0.1)';
        });
        heading.addEventListener('blur', function() {
            this.style.outline = '2px dashed #4facfe';
            this.style.backgroundColor = 'transparent';
        });
    });
    
    // Make ALL paragraphs and list items editable
    const textElements = document.querySelectorAll('p, li, .opening-content p, .info-content p, .cottages-intro, .cottage-summary, .cottage-capacity, .address p');
    textElements.forEach((element, index) => {
        // Skip footer elements
        if (element.closest('footer') || element.textContent.includes('Created by Riley')) {
            return;
        }
        
        const key = `text_${index}`;
        originalContent[key] = element.innerHTML;
        element.contentEditable = true;
        element.style.outline = '1px dashed #fa709a';
        element.style.outlineOffset = '3px';
        element.style.cursor = 'text';
        element.style.transition = 'all 0.3s ease';
        
        element.addEventListener('focus', function() {
            this.style.outline = '2px solid #fa709a';
            this.style.backgroundColor = 'rgba(250, 112, 154, 0.1)';
        });
        element.addEventListener('blur', function() {
            this.style.outline = '1px dashed #fa709a';
            this.style.backgroundColor = 'transparent';
        });
    });
    
    // Make hero overlay text editable
    const heroOverlay = document.querySelector('.hero-overlay');
    if (heroOverlay) {
        const heroH1 = heroOverlay.querySelector('h1');
        const heroP = heroOverlay.querySelector('p');
        
        if (heroH1) {
            originalContent['hero_h1'] = heroH1.innerHTML;
            heroH1.contentEditable = true;
            heroH1.style.outline = '2px dashed #4facfe';
            heroH1.style.cursor = 'text';
        }
        
        if (heroP) {
            originalContent['hero_p'] = heroP.innerHTML;
            heroP.contentEditable = true;
            heroP.style.outline = '1px dashed #fa709a';
            heroP.style.cursor = 'text';
        }
    }
    
    // Make contact section editable
    const contactItems = document.querySelectorAll('.contact-info .contact-item');
    contactItems.forEach((item, index) => {
        // Skip footer items
        if (item.closest('footer')) return;
        
        const key = `contact_${index}`;
        originalContent[key] = item.innerHTML;
        item.contentEditable = true;
        item.style.outline = '1px dashed #11998e';
        item.style.cursor = 'text';
    });
    
    // Make links editable
    const links = document.querySelectorAll('.info-content a, .contact-info a');
    links.forEach((link, index) => {
        if (link.closest('footer')) return;
        
        const key = `link_${index}`;
        originalContent[key] = {
            text: link.textContent,
            href: link.href
        };
        
        link.style.outline = '1px dashed #feca57';
        link.style.cursor = 'pointer';
        
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const newText = prompt('Edit link text:', this.textContent);
            const newHref = prompt('Edit link URL:', this.href);
            if (newText !== null && newText.trim() !== '') {
                this.textContent = newText;
            }
            if (newHref !== null && newHref.trim() !== '') {
                this.href = newHref;
            }
        });
    });
}

function savePageContent() {
    if (!adminLoggedIn) {
        alert('⚠️ You must be logged in as admin to save changes.');
        return;
    }
    
    // Collect all edited content
    const savedContent = {};
    
    // Save all headings
    const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
    headings.forEach((heading, index) => {
        if (heading.contentEditable === 'true' || heading.getAttribute('contenteditable') === 'true') {
            savedContent[`heading_${index}`] = heading.innerHTML;
        }
    });
    
    // Save all text elements
    const textElements = document.querySelectorAll('p, li, .opening-content p, .info-content p, .cottages-intro, .cottage-summary, .cottage-capacity, .address p');
    textElements.forEach((element, index) => {
        if (element.contentEditable === 'true' || element.getAttribute('contenteditable') === 'true') {
            savedContent[`text_${index}`] = element.innerHTML;
        }
    });
    
    // Save hero overlay text
    const heroOverlay = document.querySelector('.hero-overlay');
    if (heroOverlay) {
        const heroH1 = heroOverlay.querySelector('h1');
        const heroP = heroOverlay.querySelector('p');
        if (heroH1) savedContent['hero_h1'] = heroH1.innerHTML;
        if (heroP) savedContent['hero_p'] = heroP.innerHTML;
    }
    
    // Save contact items
    const contactItems = document.querySelectorAll('.contact-info .contact-item');
    contactItems.forEach((item, index) => {
        if (!item.closest('footer') && (item.contentEditable === 'true' || item.getAttribute('contenteditable') === 'true')) {
            savedContent[`contact_${index}`] = item.innerHTML;
        }
    });
    
    // Save links
    const links = document.querySelectorAll('.info-content a, .contact-info a');
    links.forEach((link, index) => {
        if (!link.closest('footer')) {
            savedContent[`link_${index}`] = {
                text: link.textContent,
                href: link.href
            };
        }
    });
    
    // Save to localStorage
    const pageName = window.location.pathname.split('/').pop() || 'index.html';
    localStorage.setItem(`pageContent_${pageName}`, JSON.stringify(savedContent));
    
    // Remove contentEditable and styling from all elements
    const editableElements = document.querySelectorAll('[contenteditable="true"]');
    editableElements.forEach(element => {
        element.contentEditable = false;
        element.style.outline = 'none';
        element.style.cursor = 'default';
        element.style.backgroundColor = 'transparent';
    });
    
    // Remove link click handlers
    links.forEach(link => {
        link.style.outline = 'none';
        link.style.cursor = 'pointer';
    });
    
    alert('💾 Changes saved successfully! Your edits have been saved and will persist on page reload.');
    
    // Clear original content store
    originalContent = {};
    
    // Return to normal view
    const editPageBtn = document.getElementById('editPageBtn');
    const savePageBtn = document.getElementById('savePageBtn');
    const cancelPageBtn = document.getElementById('cancelPageBtn');
    
    if (editPageBtn) editPageBtn.style.display = 'block';
    if (savePageBtn) savePageBtn.style.display = 'none';
    if (cancelPageBtn) cancelPageBtn.style.display = 'none';
}

function cancelPageEdit() {
    if (confirm('Are you sure you want to cancel? Any unsaved changes will be lost.')) {
        // Restore all original content
        Object.keys(originalContent).forEach(key => {
            if (key.startsWith('heading_')) {
                const index = parseInt(key.split('_')[1]);
                const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
                if (headings[index]) {
                    headings[index].innerHTML = originalContent[key];
                    headings[index].contentEditable = false;
                    headings[index].style.outline = 'none';
                    headings[index].style.cursor = 'default';
                    headings[index].style.backgroundColor = 'transparent';
                }
            } else if (key.startsWith('text_')) {
                const index = parseInt(key.split('_')[1]);
                const textElements = document.querySelectorAll('p, li, .opening-content p, .info-content p, .cottages-intro, .cottage-summary, .cottage-capacity, .address p');
                if (textElements[index]) {
                    textElements[index].innerHTML = originalContent[key];
                    textElements[index].contentEditable = false;
                    textElements[index].style.outline = 'none';
                    textElements[index].style.cursor = 'default';
                    textElements[index].style.backgroundColor = 'transparent';
                }
            } else if (key === 'hero_h1') {
                const heroH1 = document.querySelector('.hero-overlay h1');
                if (heroH1) {
                    heroH1.innerHTML = originalContent[key];
                    heroH1.contentEditable = false;
                    heroH1.style.outline = 'none';
                    heroH1.style.cursor = 'default';
                }
            } else if (key === 'hero_p') {
                const heroP = document.querySelector('.hero-overlay p');
                if (heroP) {
                    heroP.innerHTML = originalContent[key];
                    heroP.contentEditable = false;
                    heroP.style.outline = 'none';
                    heroP.style.cursor = 'default';
                }
            } else if (key.startsWith('contact_')) {
                const index = parseInt(key.split('_')[1]);
                const contactItems = document.querySelectorAll('.contact-info .contact-item');
                if (contactItems[index]) {
                    contactItems[index].innerHTML = originalContent[key];
                    contactItems[index].contentEditable = false;
                    contactItems[index].style.outline = 'none';
                    contactItems[index].style.cursor = 'default';
                }
            } else if (key.startsWith('link_')) {
                const index = parseInt(key.split('_')[1]);
                const links = document.querySelectorAll('.info-content a, .contact-info a');
                if (links[index] && !links[index].closest('footer')) {
                    links[index].textContent = originalContent[key].text;
                    links[index].href = originalContent[key].href;
                    links[index].style.outline = 'none';
                }
            } else if (key.startsWith('amenity_heading_')) {
                const index = parseInt(key.split('_')[2]);
                const amenityCards = document.querySelectorAll('.amenity-card, .amenity-section');
                if (amenityCards[index]) {
                    const cardHeading = amenityCards[index].querySelector('h3, h4');
                    if (cardHeading) {
                        cardHeading.innerHTML = originalContent[key];
                        cardHeading.contentEditable = false;
                        cardHeading.style.outline = 'none';
                        cardHeading.style.cursor = 'default';
                        cardHeading.style.backgroundColor = 'transparent';
                    }
                }
            } else if (key.startsWith('amenity_text_')) {
                const index = parseInt(key.split('_')[2]);
                const amenityCards = document.querySelectorAll('.amenity-card, .amenity-section');
                if (amenityCards[index]) {
                    const cardText = amenityCards[index].querySelector('p, .amenity-description');
                    if (cardText) {
                        cardText.innerHTML = originalContent[key];
                        cardText.contentEditable = false;
                        cardText.style.outline = 'none';
                        cardText.style.cursor = 'default';
                        cardText.style.backgroundColor = 'transparent';
                    }
                }
            }
        });
        
        // Clear original content store
        originalContent = {};
        
        const editPageBtn = document.getElementById('editPageBtn');
        const editAmenitiesBtn = document.getElementById('editAmenitiesBtn');
        const savePageBtn = document.getElementById('savePageBtn');
        const cancelPageBtn = document.getElementById('cancelPageBtn');
        
        // Show the appropriate edit button based on which page we're on
        if (editPageBtn) editPageBtn.style.display = 'block';
        if (editAmenitiesBtn) editAmenitiesBtn.style.display = 'block';
        if (savePageBtn) savePageBtn.style.display = 'none';
        if (cancelPageBtn) cancelPageBtn.style.display = 'none';
        
        alert('✖ Edit cancelled. All changes have been reverted.');
    }
}

// Edit Amenities functionality
function toggleAmenitiesEditor() {
    if (!adminLoggedIn) {
        alert('⚠️ You must be logged in as admin to edit amenities.');
        return;
    }
    
    const editAmenitiesBtn = document.getElementById('editAmenitiesBtn');
    const savePageBtn = document.getElementById('savePageBtn');
    const cancelPageBtn = document.getElementById('cancelPageBtn');
    
    // Toggle to edit mode
    if (editAmenitiesBtn) editAmenitiesBtn.style.display = 'none';
    if (savePageBtn) {
        savePageBtn.style.display = 'block';
        savePageBtn.onmouseover = function() {
            this.style.transform = 'translateY(-2px)';
            this.style.boxShadow = '0 6px 25px rgba(56, 239, 125, 0.6)';
        };
        savePageBtn.onmouseout = function() {
            this.style.transform = 'translateY(0)';
            this.style.boxShadow = '0 4px 20px rgba(56, 239, 125, 0.5)';
        };
    }
    if (cancelPageBtn) {
        cancelPageBtn.style.display = 'block';
        cancelPageBtn.onmouseover = function() {
            this.style.transform = 'translateY(-2px)';
            this.style.boxShadow = '0 6px 25px rgba(238, 9, 121, 0.6)';
        };
        cancelPageBtn.onmouseout = function() {
            this.style.transform = 'translateY(0)';
            this.style.boxShadow = '0 4px 20px rgba(238, 9, 121, 0.5)';
        };
    }
    
    // Make amenities content editable
    makeAmenitiesEditable();
    
    alert('✨ Amenities edit mode activated! Click on any text to edit it. Click Save when done.');
}

// Make amenities content editable
function makeAmenitiesEditable() {
    // Store original content
    originalContent = {};
    
    // Make ALL headings editable (h1, h2, h3, h4, h5, h6)
    const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
    headings.forEach((heading, index) => {
        // Skip footer, navbar headings, cottage names, main section titles, and "Amenities" heading
        if (heading.closest('footer') || 
            heading.closest('.navbar') || 
            heading.closest('nav') ||
            heading.closest('.cottage-sub-nav') ||
            heading.textContent.includes('Created by Riley') ||
            heading.classList.contains('cottage-title') ||
            heading.textContent.trim() === 'Amenities' ||
            heading.textContent.includes('The Villa') ||
            heading.textContent.includes('The Shanty') ||
            heading.textContent.includes('The Bunkhouse') ||
            heading.textContent.includes('Brown Camp') ||
            heading.closest('.cottage-detail-header') ||
            heading.closest('.cottage-header') ||
            heading.closest('.back-link')) {
            return;
        }
        
        const key = `heading_${index}`;
        originalContent[key] = heading.innerHTML;
        heading.contentEditable = true;
        heading.style.outline = '2px dashed #fa709a';
        heading.style.outlineOffset = '5px';
        heading.style.cursor = 'text';
        heading.style.transition = 'all 0.3s ease';
        
        heading.addEventListener('focus', function() {
            this.style.outline = '2px solid #fa709a';
            this.style.backgroundColor = 'rgba(250, 112, 154, 0.1)';
        });
        heading.addEventListener('blur', function() {
            this.style.outline = '2px dashed #fa709a';
            this.style.backgroundColor = 'transparent';
        });
    });
    
    // Make ALL paragraphs and list items editable
    const textElements = document.querySelectorAll('p, li, .amenity-description, .amenity-item, .amenities-list li');
    textElements.forEach((element, index) => {
        // Skip footer, navbar elements, back link, cottage header sections, and "Amenities" tagline
        if (element.closest('footer') || 
            element.closest('.navbar') || 
            element.closest('nav') ||
            element.closest('.cottage-sub-nav') ||
            element.closest('.back-link') ||
            element.closest('.cottage-detail-header') ||
            element.closest('.cottage-header') ||
            element.classList.contains('cottage-tagline') ||
            element.textContent.trim() === 'Amenities' ||
            element.textContent.includes('Created by Riley')) {
            return;
        }
        
        const key = `text_${index}`;
        originalContent[key] = element.innerHTML;
        element.contentEditable = true;
        element.style.outline = '1px dashed #fee140';
        element.style.outlineOffset = '3px';
        element.style.cursor = 'text';
        element.style.transition = 'all 0.3s ease';
        
        element.addEventListener('focus', function() {
            this.style.outline = '2px solid #fee140';
            this.style.backgroundColor = 'rgba(254, 225, 64, 0.1)';
        });
        element.addEventListener('blur', function() {
            this.style.outline = '1px dashed #fee140';
            this.style.backgroundColor = 'transparent';
        });
    });
    
    // Make amenity cards editable
    const amenityCards = document.querySelectorAll('.amenity-card, .amenity-section');
    amenityCards.forEach((card, index) => {
        const cardHeading = card.querySelector('h3, h4');
        const cardText = card.querySelector('p, .amenity-description');
        
        if (cardHeading) {
            const key = `amenity_heading_${index}`;
            originalContent[key] = cardHeading.innerHTML;
            cardHeading.contentEditable = true;
            cardHeading.style.outline = '2px dashed #fa709a';
            cardHeading.style.cursor = 'text';
            
            cardHeading.addEventListener('focus', function() {
                this.style.outline = '2px solid #fa709a';
                this.style.backgroundColor = 'rgba(250, 112, 154, 0.1)';
            });
            cardHeading.addEventListener('blur', function() {
                this.style.outline = '2px dashed #fa709a';
                this.style.backgroundColor = 'transparent';
            });
        }
        
        if (cardText) {
            const key = `amenity_text_${index}`;
            originalContent[key] = cardText.innerHTML;
            cardText.contentEditable = true;
            cardText.style.outline = '1px dashed #fee140';
            cardText.style.cursor = 'text';
            
            cardText.addEventListener('focus', function() {
                this.style.outline = '2px solid #fee140';
                this.style.backgroundColor = 'rgba(254, 225, 64, 0.1)';
            });
            cardText.addEventListener('blur', function() {
                this.style.outline = '1px dashed #fee140';
                this.style.backgroundColor = 'transparent';
            });
        }
    });
}

// Admin Manager functionality
function openAdminManager() {
    if (!adminLoggedIn) {
        alert('⚠️ You must be logged in as admin to access Admin Manager.');
        return;
    }
    
    // Create overlay
    const overlay = document.createElement('div');
    overlay.id = 'adminManagerOverlay';
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.5);
        z-index: 100001;
        animation: fadeIn 0.3s ease;
    `;

    // Create sidebar panel
    const sidebar = document.createElement('div');
    sidebar.style.cssText = `
        position: fixed;
        top: 0;
        right: 0;
        width: 450px;
        height: 100%;
        background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
        box-shadow: -5px 0 30px rgba(0, 0, 0, 0.3);
        overflow-y: auto;
        animation: slideInRight 0.3s ease;
        z-index: 100002;
    `;

    // Load admins from localStorage
    const admins = JSON.parse(localStorage.getItem('adminUsers') || '[]');
    if (admins.length === 0) {
        // Initialize with default admin
        admins.push({ id: 1, name: 'Riley Santor', email: ADMIN_EMAIL, password: ADMIN_PASSWORD, role: 'Owner' });
        localStorage.setItem('adminUsers', JSON.stringify(admins));
    }

    sidebar.innerHTML = `
        <style>
            @keyframes fadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }
            @keyframes slideInRight {
                from { transform: translateX(100%); }
                to { transform: translateX(0); }
            }
            .admin-card {
                background: white;
                padding: 20px;
                border-radius: 12px;
                margin-bottom: 15px;
                box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
                transition: all 0.3s ease;
            }
            .admin-card:hover {
                transform: translateY(-2px);
                box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
            }
            .admin-list {
                max-height: calc(100vh - 500px);
                overflow-y: auto;
                padding-right: 10px;
            }
            .admin-list::-webkit-scrollbar {
                width: 6px;
            }
            .admin-list::-webkit-scrollbar-track {
                background: rgba(0, 0, 0, 0.05);
                border-radius: 10px;
            }
            .admin-list::-webkit-scrollbar-thumb {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                border-radius: 10px;
            }
        </style>
        
        <div style="padding: 30px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px;">
                <h2 style="margin: 0; color: #333; font-size: 28px; display: flex; align-items: center; gap: 12px;">
                    <span style="font-size: 32px;">👤</span>
                    Admin Manager
                </h2>
                <button onclick="closeAdminManager()" style="background: rgba(0,0,0,0.1); border: none; width: 40px; height: 40px; border-radius: 50%; cursor: pointer; font-size: 24px; color: #666; display: flex; align-items: center; justify-content: center; transition: all 0.2s;">
                    ✕
                </button>
            </div>
            
            <div style="background: white; padding: 25px; border-radius: 12px; margin-bottom: 25px; box-shadow: 0 2px 15px rgba(0, 0, 0, 0.1);">
                <h3 style="color: #f093fb; margin: 0 0 20px 0; font-size: 18px; display: flex; align-items: center; gap: 8px;">
                    <span style="font-size: 24px;">🔐</span>
                    Master Password
                </h3>
                <div style="display: flex; align-items: center; justify-content: space-between; padding: 15px; background: linear-gradient(135deg, rgba(240, 147, 251, 0.1), rgba(245, 87, 108, 0.1)); border-radius: 8px; border: 2px dashed #f093fb;">
                    <div style="flex: 1;">
                        <div style="font-size: 13px; color: #666; margin-bottom: 5px; font-weight: 500;">Current Master Password:</div>
                        <div id="masterPasswordDisplay" style="font-family: monospace; font-size: 16px; color: #333; font-weight: 600; letter-spacing: 1px;">••••••••••••••</div>
                    </div>
                    <button onclick="toggleMasterPasswordVisibility()" id="masterPasswordToggle" style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer; font-size: 13px; font-weight: 600; white-space: nowrap;">
                        Show
                    </button>
                </div>
                <button onclick="changeMasterPassword()" style="background: linear-gradient(135deg, #fa709a 0%, #fee140 100%); color: white; border: none; padding: 10px 20px; border-radius: 8px; cursor: pointer; font-size: 14px; font-weight: 600; width: 100%; margin-top: 12px;">
                    Change Master Password
                </button>
            </div>
            
            <div style="background: white; padding: 25px; border-radius: 12px; margin-bottom: 25px; box-shadow: 0 2px 15px rgba(0, 0, 0, 0.1);">
                <h3 style="color: #667eea; margin: 0 0 20px 0; font-size: 18px; display: flex; align-items: center; gap: 8px;">
                    <span style="font-size: 24px;">➕</span>
                    Add New Admin
                </h3>
                <div style="margin-bottom: 12px;">
                    <label style="display: block; margin-bottom: 5px; color: #666; font-weight: 500; font-size: 13px;">Name:</label>
                    <input type="text" id="newAdminName" placeholder="Full Name"
                        style="width: 100%; padding: 10px; border: 2px solid #e0e0e0; border-radius: 6px; font-size: 14px; box-sizing: border-box; transition: border 0.2s;">
                </div>
                <div style="margin-bottom: 12px;">
                    <label style="display: block; margin-bottom: 5px; color: #666; font-weight: 500; font-size: 13px;">Email:</label>
                    <input type="email" id="newAdminEmail" placeholder="admin@example.com"
                        style="width: 100%; padding: 10px; border: 2px solid #e0e0e0; border-radius: 6px; font-size: 14px; box-sizing: border-box; transition: border 0.2s;">
                </div>
                <div style="margin-bottom: 12px;">
                    <label style="display: block; margin-bottom: 5px; color: #666; font-weight: 500; font-size: 13px;">Password:</label>
                    <input type="password" id="newAdminPassword" placeholder="Enter password"
                        style="width: 100%; padding: 10px; border: 2px solid #e0e0e0; border-radius: 6px; font-size: 14px; box-sizing: border-box; transition: border 0.2s;">
                </div>
                <div style="margin-bottom: 15px;">
                    <label style="display: block; margin-bottom: 5px; color: #666; font-weight: 500; font-size: 13px;">Role:</label>
                    <select id="newAdminRole" style="width: 100%; padding: 10px; border: 2px solid #e0e0e0; border-radius: 6px; font-size: 14px; box-sizing: border-box; cursor: pointer;">
                        <option value="Admin">Admin</option>
                        <option value="Chief Executive Officer (CEO)">Chief Executive Officer (CEO)</option>
                        <option value="Chief Technology Officer (CTO)">Chief Technology Officer (CTO)</option>
                        <option value="Owner">Owner</option>
                    </select>
                </div>
                <button onclick="addNewAdmin()" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border: none; padding: 12px 20px; border-radius: 8px; cursor: pointer; font-size: 15px; font-weight: 600; width: 100%; transition: transform 0.2s;">
                    Add Admin
                </button>
            </div>
            
            <div>
                <h3 style="color: #333; margin: 0 0 15px 0; font-size: 18px; display: flex; align-items: center; gap: 8px;">
                    <span style="font-size: 24px;">👥</span>
                    Current Admins (${admins.length})
                </h3>
                <div class="admin-list" id="adminsList">
                    ${admins.map((admin, index) => `
                        <div class="admin-card" id="admin-card-${admin.id}">
                            <!-- View Mode -->
                            <div id="view-mode-${admin.id}" style="display: block;">
                                <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 10px;">
                                    <div style="flex: 1;">
                                        <div style="font-weight: 700; color: #333; font-size: 18px; margin-bottom: 8px; display: flex; align-items: center; gap: 8px;">
                                            <span>👤</span>
                                            <span>${admin.name || 'No Name'}</span>
                                        </div>
                                        <div style="font-weight: 600; color: #666; font-size: 14px; margin-bottom: 8px; display: flex; align-items: center; gap: 8px;">
                                            <span>📧</span>
                                            <span>${admin.email}</span>
                                        </div>
                                        <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
                                            <span style="font-size: 14px;">🔑</span>
                                            <span style="color: #666; font-size: 14px; font-family: monospace;">${'•'.repeat(admin.password.length)}</span>
                                        </div>
                                        <div style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 6px 14px; border-radius: 12px; font-size: 12px; font-weight: 600;">
                                            ${admin.role}
                                        </div>
                                    </div>
                                </div>
                                <div style="display: flex; gap: 8px; margin-top: 12px;">
                                    <button onclick="toggleAdminEditMode(${admin.id})" style="flex: 1; background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); color: white; border: none; padding: 10px; border-radius: 6px; cursor: pointer; font-size: 13px; font-weight: 600; transition: all 0.2s;">
                                        ✏️ Edit
                                    </button>
                                    <button onclick="deleteAdmin(${admin.id})" style="flex: 1; background: linear-gradient(135deg, #ee0979 0%, #ff6a00 100%); color: white; border: none; padding: 10px; border-radius: 6px; cursor: pointer; font-size: 13px; font-weight: 600; transition: all 0.2s;" ${admin.role === 'Owner' ? 'disabled style="opacity: 0.5; cursor: not-allowed;"' : ''}>
                                        🗑️ Delete
                                    </button>
                                </div>
                            </div>
                            
                            <!-- Edit Mode -->
                            <div id="edit-mode-${admin.id}" style="display: none;">
                                <div style="margin-bottom: 12px;">
                                    <label style="display: block; margin-bottom: 5px; color: #666; font-weight: 500; font-size: 12px;">Name:</label>
                                    <input type="text" id="name-${admin.id}" value="${admin.name || ''}" style="width: 100%; padding: 10px; border: 2px solid #4facfe; border-radius: 6px; font-size: 14px; font-weight: 600; color: #333; box-sizing: border-box;">
                                </div>
                                <div style="margin-bottom: 12px;">
                                    <label style="display: block; margin-bottom: 5px; color: #666; font-weight: 500; font-size: 12px;">Email:</label>
                                    <input type="email" id="email-${admin.id}" value="${admin.email}" style="width: 100%; padding: 10px; border: 2px solid #4facfe; border-radius: 6px; font-size: 14px; font-weight: 600; color: #333; box-sizing: border-box;">
                                </div>
                                <div style="margin-bottom: 12px;">
                                    <label style="display: block; margin-bottom: 5px; color: #666; font-weight: 500; font-size: 12px;">Password:</label>
                                    <input type="text" id="password-${admin.id}" value="${admin.password}" style="width: 100%; padding: 10px; border: 2px solid #4facfe; border-radius: 6px; font-size: 14px; font-weight: 600; color: #333; box-sizing: border-box; font-family: monospace;">
                                </div>
                                <div style="margin-bottom: 12px;">
                                    <label style="display: block; margin-bottom: 5px; color: #666; font-weight: 500; font-size: 12px;">Role:</label>
                                    <select id="role-${admin.id}" style="width: 100%; padding: 10px; border: 2px solid #4facfe; border-radius: 6px; font-size: 14px; box-sizing: border-box; cursor: pointer;">
                                        <option value="Admin" ${admin.role === 'Admin' ? 'selected' : ''}>Admin</option>
                                        <option value="Chief Executive Officer (CEO)" ${admin.role === 'Chief Executive Officer (CEO)' ? 'selected' : ''}>Chief Executive Officer (CEO)</option>
                                        <option value="Chief Technology Officer (CTO)" ${admin.role === 'Chief Technology Officer (CTO)' ? 'selected' : ''}>Chief Technology Officer (CTO)</option>
                                        <option value="Owner" ${admin.role === 'Owner' ? 'selected' : ''}>Owner</option>
                                    </select>
                                </div>
                                <div style="display: flex; gap: 8px;">
                                    <button onclick="saveAdminEdit(${admin.id})" style="flex: 1; background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%); color: white; border: none; padding: 10px; border-radius: 6px; cursor: pointer; font-size: 13px; font-weight: 600; transition: all 0.2s;">
                                        💾 Save
                                    </button>
                                    <button onclick="cancelAdminEdit(${admin.id})" style="flex: 1; background: linear-gradient(135deg, #95a5a6 0%, #7f8c8d 100%); color: white; border: none; padding: 10px; border-radius: 6px; cursor: pointer; font-size: 13px; font-weight: 600; transition: all 0.2s;">
                                        ✖ Cancel
                                    </button>
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(overlay);
    document.body.appendChild(sidebar);

    // Close on overlay click
    overlay.addEventListener('click', function(e) {
        if (e.target === overlay) closeAdminManager();
    });
    
    // Add hover effect to close button
    const closeBtn = sidebar.querySelector('button[onclick="closeAdminManager()"]');
    closeBtn.addEventListener('mouseover', function() {
        this.style.background = 'rgba(238, 9, 121, 0.2)';
        this.style.color = '#ee0979';
        this.style.transform = 'rotate(90deg)';
    });
    closeBtn.addEventListener('mouseout', function() {
        this.style.background = 'rgba(0,0,0,0.1)';
        this.style.color = '#666';
        this.style.transform = 'rotate(0deg)';
    });
}

// Close Admin Manager
function closeAdminManager() {
    const overlay = document.getElementById('adminManagerOverlay');
    const sidebar = document.querySelector('[style*="slideInRight"]');
    
    if (sidebar) {
        sidebar.style.animation = 'slideOutRight 0.3s ease';
        sidebar.style.transform = 'translateX(100%)';
    }
    if (overlay) {
        overlay.style.animation = 'fadeOut 0.3s ease';
        overlay.style.opacity = '0';
    }
    
    setTimeout(() => {
        if (overlay) overlay.remove();
        if (sidebar) sidebar.remove();
    }, 300);
}

// Toggle master password visibility
let masterPasswordVisible = false;
function toggleMasterPasswordVisibility() {
    const display = document.getElementById('masterPasswordDisplay');
    const button = document.getElementById('masterPasswordToggle');
    
    if (masterPasswordVisible) {
        display.textContent = '••••••••••••••';
        button.textContent = 'Show';
        masterPasswordVisible = false;
    } else {
        display.textContent = MASTER_PASSWORD;
        button.textContent = 'Hide';
        masterPasswordVisible = true;
    }
}

// Change master password
function changeMasterPassword() {
    showMasterPasswordDialog('Change Master Password', 'Enter current Master Password:', (currentMaster) => {
        if (currentMaster !== MASTER_PASSWORD) {
            showMasterPasswordError('Invalid Master Password. Access denied.');
            return;
        }
        
        alert('⚠️ Note: In this demo, the master password is hardcoded in the JavaScript file. In production, this would be stored securely in a backend database.\n\nTo change it permanently, update the MASTER_PASSWORD constant in main.js');
    });
}

// Toggle edit mode for admin card
function toggleAdminEditMode(adminId) {
    // Show master password dialog
    showMasterPasswordDialog('Edit Admin', 'Enter Master Password to edit this admin:', (password) => {
        if (password === MASTER_PASSWORD) {
            const viewMode = document.getElementById(`view-mode-${adminId}`);
            const editMode = document.getElementById(`edit-mode-${adminId}`);
            
            if (viewMode && editMode) {
                viewMode.style.display = 'none';
                editMode.style.display = 'block';
            }
        } else {
            showMasterPasswordError('Incorrect master password!');
        }
    });
}

// Cancel admin edit
function cancelAdminEdit(adminId) {
    const viewMode = document.getElementById(`view-mode-${adminId}`);
    const editMode = document.getElementById(`edit-mode-${adminId}`);
    
    if (viewMode && editMode) {
        // Reset fields to original values by refreshing
        closeAdminManager();
        setTimeout(() => openAdminManager(), 400);
    }
}

// Save admin edits
function saveAdminEdit(adminId) {
    const name = document.getElementById(`name-${adminId}`).value.trim();
    const email = document.getElementById(`email-${adminId}`).value.trim();
    const password = document.getElementById(`password-${adminId}`).value;
    const role = document.getElementById(`role-${adminId}`).value;
    
    if (!name || !email || !password) {
        alert('⚠️ Name, email and password cannot be empty.');
        return;
    }
    
    if (password.length < 6) {
        alert('⚠️ Password must be at least 6 characters long.');
        return;
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        alert('⚠️ Please enter a valid email address.');
        return;
    }
    
    // Load admins
    const admins = JSON.parse(localStorage.getItem('adminUsers') || '[]');
    
    // Check if email already exists (for different admin)
    if (admins.some(admin => admin.email === email && admin.id !== adminId)) {
        alert('⚠️ An admin with this email already exists.');
        return;
    }
    
    // Update admin
    const adminIndex = admins.findIndex(admin => admin.id === adminId);
    if (adminIndex !== -1) {
        admins[adminIndex] = {
            id: adminId,
            name: name,
            email: email,
            password: password,
            role: role
        };
        
        localStorage.setItem('adminUsers', JSON.stringify(admins));
        alert('✅ Admin updated successfully!');
        
        // Refresh the admin manager
        closeAdminManager();
        setTimeout(() => openAdminManager(), 400);
    } else {
        alert('⚠️ Admin not found.');
    }
}

// Add new admin
function addNewAdmin() {
    const name = document.getElementById('newAdminName').value.trim();
    const email = document.getElementById('newAdminEmail').value.trim();
    const password = document.getElementById('newAdminPassword').value;
    const role = document.getElementById('newAdminRole').value;
    
    if (!name || !email || !password) {
        alert('⚠️ Please fill in all fields.');
        return;
    }
    
    if (password.length < 6) {
        alert('⚠️ Password must be at least 6 characters long.');
        return;
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        alert('⚠️ Please enter a valid email address.');
        return;
    }
    
    // Load existing admins
    const admins = JSON.parse(localStorage.getItem('adminUsers') || '[]');
    
    // Check if email already exists
    if (admins.some(admin => admin.email === email)) {
        alert('⚠️ An admin with this email already exists.');
        return;
    }
    
    // Request master password before adding
    showMasterPasswordDialog('Add New Admin', 'Enter Master Password to add this admin:', (masterPwd) => {
        if (masterPwd !== MASTER_PASSWORD) {
            showMasterPasswordError('Invalid Master Password. Access denied.');
            return;
        }
        
        // Generate new ID
        const newId = admins.length > 0 ? Math.max(...admins.map(a => a.id)) + 1 : 1;
        
        // Add new admin
        admins.push({
            id: newId,
            name: name,
            email: email,
            password: password,
            role: role
        });
        
        // Save to localStorage
        localStorage.setItem('adminUsers', JSON.stringify(admins));
        
        alert('✅ New admin added successfully!');
        
        // Refresh the admin manager
        closeAdminManager();
        setTimeout(() => openAdminManager(), 400);
    });
}

// Delete admin
function deleteAdmin(adminId) {
    if (!confirm('⚠️ Are you sure you want to delete this admin?')) {
        return;
    }
    
    // Request master password
    showMasterPasswordDialog('Delete Admin', 'Enter Master Password to delete this admin:', (masterPwd) => {
        if (masterPwd !== MASTER_PASSWORD) {
            showMasterPasswordError('Invalid Master Password. Access denied.');
            return;
        }
        
        deleteAdminConfirmed(adminId);
    });
}

// Confirmed delete admin
function deleteAdminConfirmed(adminId) {
    
    // Load existing admins
    const admins = JSON.parse(localStorage.getItem('adminUsers') || '[]');
    
    // Find and remove the admin
    const updatedAdmins = admins.filter(admin => admin.id !== adminId);
    
    if (updatedAdmins.length === admins.length) {
        alert('⚠️ Admin not found.');
        return;
    }
    
    // Save updated list
    localStorage.setItem('adminUsers', JSON.stringify(updatedAdmins));
    
    alert('✅ Admin deleted successfully!');
    
    // Refresh the admin manager
    closeAdminManager();
    setTimeout(() => openAdminManager(), 400);
}

// Clear all saved edits
// Maintenance Mode functionality
function toggleMaintenanceMode() {
    if (!adminLoggedIn) {
        alert('⚠️ You must be logged in as admin to toggle maintenance mode.');
        return;
    }
    
    const overlay = document.getElementById('maintenanceOverlay');
    const statusSpan = document.getElementById('maintenanceStatus');
    
    if (overlay && statusSpan) {
        const isActive = overlay.style.display === 'block';
        
        if (isActive) {
            overlay.style.display = 'none';
            statusSpan.textContent = 'OFF';
            localStorage.setItem('maintenanceMode', 'false');
            alert('✅ Maintenance mode disabled.');
        } else {
            if (confirm('Are you sure you want to enable maintenance mode? This will hide the site from visitors.')) {
                overlay.style.display = 'block';
                statusSpan.textContent = 'ON';
                localStorage.setItem('maintenanceMode', 'true');
                alert('🚧 Maintenance mode enabled.');
            }
        }
    }
}

// Check maintenance mode on load
function checkMaintenanceMode() {
    const maintenanceMode = localStorage.getItem('maintenanceMode') === 'true';
    const overlay = document.getElementById('maintenanceOverlay');
    const statusSpan = document.getElementById('maintenanceStatus');
    
    // Show overlay only if maintenance is on AND admin is not logged in
    if (overlay) {
        if (maintenanceMode && !adminLoggedIn) {
            overlay.style.display = 'block';
        } else {
            overlay.style.display = 'none';
        }
    }
    
    if (statusSpan) {
        statusSpan.textContent = maintenanceMode ? 'ON' : 'OFF';
    }
}

// Clear saved edits functionality
function clearSavedEdits() {
    if (!adminLoggedIn) {
        alert('⚠️ You must be logged in as admin to clear saved edits.');
        return;
    }
    
    if (confirm('Are you sure you want to clear all saved edits for this page? This will restore the original content and cannot be undone.')) {
        const pageName = window.location.pathname.split('/').pop() || 'index.html';
        localStorage.removeItem(`pageContent_${pageName}`);
        alert('🗑️ Saved edits cleared! Refreshing page to restore original content...');
        location.reload();
    }
}

// Toggle admin dropdown menu
function toggleAdminDropdown() {
    if (!adminLoggedIn) {
        alert('⚠️ You must be logged in as admin to access tools.');
        return;
    }
    
    const dropdown = document.getElementById('adminDropdown');
    if (dropdown) {
        const isVisible = dropdown.style.display === 'block';
        dropdown.style.display = isVisible ? 'none' : 'block';
    }
}

// Close admin dropdown
function closeAdminDropdown() {
    const dropdown = document.getElementById('adminDropdown');
    if (dropdown) {
        dropdown.style.display = 'none';
    }
}

// Close dropdown when clicking outside
document.addEventListener('click', function(event) {
    const dropdown = document.getElementById('adminDropdown');
    const toolsBtn = document.getElementById('adminToolsBtn');
    
    if (dropdown && toolsBtn) {
        // Check if click is outside both the dropdown and the button
        if (!dropdown.contains(event.target) && !toolsBtn.contains(event.target)) {
            dropdown.style.display = 'none';
        }
    }
});

// Show styled master password dialog (similar to admin login)
function showMasterPasswordDialog(title, message, callback) {
    // Create dialog overlay
    const overlay = document.createElement('div');
    overlay.id = 'masterPasswordOverlay';
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.7);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 100003;
        animation: fadeIn 0.3s ease;
    `;

    // Create dialog box
    const dialog = document.createElement('div');
    dialog.style.cssText = `
        background: white;
        padding: 30px;
        border-radius: 12px;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
        max-width: 420px;
        width: 90%;
        animation: slideInDown 0.3s ease;
    `;

    dialog.innerHTML = `
        <style>
            @keyframes slideInDown {
                from {
                    opacity: 0;
                    transform: translateY(-50px);
                }
                to {
                    opacity: 1;
                    transform: translateY(0);
                }
            }
        </style>
        <h2 style="margin: 0 0 10px 0; color: #333; font-size: 24px; display: flex; align-items: center; gap: 10px;">
            <span style="font-size: 28px;">🔐</span>
            ${title}
        </h2>
        <p style="margin: 0 0 25px 0; color: #666; font-size: 14px;">${message}</p>
        <div style="margin-bottom: 20px;">
            <label style="display: block; margin-bottom: 8px; color: #666; font-weight: 600; font-size: 13px;">Master Password:</label>
            <input type="password" id="masterPasswordInput" placeholder="Enter master password" 
                style="width: 100%; padding: 12px; border: 2px solid #ddd; border-radius: 8px; font-size: 14px; box-sizing: border-box; transition: border 0.2s;"
                onfocus="this.style.borderColor='#f093fb';"
                onblur="this.style.borderColor='#ddd';">
        </div>
        <div id="masterPasswordError" style="color: #e74c3c; margin-bottom: 15px; font-size: 13px; display: none; padding: 10px; background: rgba(231, 76, 60, 0.1); border-radius: 6px; font-weight: 500;"></div>
        <div style="display: flex; gap: 10px;">
            <button id="masterPasswordSubmit" style="flex: 1; padding: 12px; background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; border: none; border-radius: 8px; font-size: 15px; font-weight: 600; cursor: pointer; transition: all 0.2s; box-shadow: 0 4px 12px rgba(240, 147, 251, 0.3);">
                Verify
            </button>
            <button id="masterPasswordCancel" style="flex: 1; padding: 12px; background: #95a5a6; color: white; border: none; border-radius: 8px; font-size: 15px; font-weight: 600; cursor: pointer; transition: all 0.2s;">
                Cancel
            </button>
        </div>
    `;

    overlay.appendChild(dialog);
    document.body.appendChild(overlay);

    const input = document.getElementById('masterPasswordInput');
    const submitBtn = document.getElementById('masterPasswordSubmit');
    const cancelBtn = document.getElementById('masterPasswordCancel');

    // Focus input
    setTimeout(() => input.focus(), 100);

    // Handle submit
    const handleSubmit = () => {
        const password = input.value;
        if (password) {
            overlay.remove();
            callback(password);
        } else {
            const errorDiv = document.getElementById('masterPasswordError');
            errorDiv.textContent = '⚠️ Please enter the master password';
            errorDiv.style.display = 'block';
            input.focus();
        }
    };

    submitBtn.addEventListener('click', handleSubmit);
    cancelBtn.addEventListener('click', () => overlay.remove());
    input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleSubmit();
    });

    // Close on overlay click
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) overlay.remove();
    });

    // Button hover effects
    submitBtn.addEventListener('mouseover', () => {
        submitBtn.style.transform = 'translateY(-2px)';
        submitBtn.style.boxShadow = '0 6px 20px rgba(240, 147, 251, 0.4)';
    });
    submitBtn.addEventListener('mouseout', () => {
        submitBtn.style.transform = 'translateY(0)';
        submitBtn.style.boxShadow = '0 4px 12px rgba(240, 147, 251, 0.3)';
    });
    
    cancelBtn.addEventListener('mouseover', () => {
        cancelBtn.style.background = '#7f8c8d';
        cancelBtn.style.transform = 'translateY(-2px)';
    });
    cancelBtn.addEventListener('mouseout', () => {
        cancelBtn.style.background = '#95a5a6';
        cancelBtn.style.transform = 'translateY(0)';
    });
}

// Show error in master password dialog
function showMasterPasswordError(message) {
    // Create error overlay
    const overlay = document.createElement('div');
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.7);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 100004;
        animation: fadeIn 0.3s ease;
    `;

    const dialog = document.createElement('div');
    dialog.style.cssText = `
        background: white;
        padding: 30px;
        border-radius: 12px;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
        max-width: 380px;
        width: 90%;
        text-align: center;
    `;

    dialog.innerHTML = `
        <div style="font-size: 48px; margin-bottom: 15px;">❌</div>
        <h3 style="margin: 0 0 15px 0; color: #e74c3c; font-size: 20px;">Access Denied</h3>
        <p style="margin: 0 0 25px 0; color: #666; font-size: 14px;">${message}</p>
        <button id="errorOkBtn" style="padding: 12px 30px; background: linear-gradient(135deg, #ee0979 0%, #ff6a00 100%); color: white; border: none; border-radius: 8px; font-size: 15px; font-weight: 600; cursor: pointer; transition: all 0.2s;">
            OK
        </button>
    `;

    overlay.appendChild(dialog);
    document.body.appendChild(overlay);

    const okBtn = document.getElementById('errorOkBtn');
    okBtn.addEventListener('click', () => overlay.remove());
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) overlay.remove();
    });

    okBtn.addEventListener('mouseover', () => {
        okBtn.style.transform = 'translateY(-2px)';
        okBtn.style.boxShadow = '0 6px 20px rgba(238, 9, 121, 0.4)';
    });
    okBtn.addEventListener('mouseout', () => {
        okBtn.style.transform = 'translateY(0)';
        okBtn.style.boxShadow = 'none';
    });

    setTimeout(() => okBtn.focus(), 100);
}

// Toggle review form visibility
function toggleReviewForm() {
    const form = document.getElementById('reviewForm');
    const success = document.getElementById('reviewSuccess');
    
    if (form) {
        if (form.style.display === 'none') {
            form.style.display = 'block';
            success.style.display = 'none';
            // Scroll to form
            form.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        } else {
            form.style.display = 'none';
        }
    }
}

// Submit review
function submitReview(event, cottageName) {
    event.preventDefault();
    
    const form = event.target;
    const name = form.name.value.trim();
    const email = form.email.value.trim();
    const rating = form.rating.value;
    const reviewText = form.review.value.trim();
    
    if (!name || !email || !rating) {
        alert('⚠️ Please fill in all required fields.');
        return;
    }
    
    // Create review object
    const review = {
        id: Date.now(),
        cottage: cottageName,
        name: name,
        email: email,
        rating: parseInt(rating),
        review: reviewText,
        date: new Date().toISOString(),
        approved: true // Auto-approve reviews
    };
    
    // Get existing reviews
    const reviews = JSON.parse(localStorage.getItem('cottageReviews') || '[]');
    reviews.push(review);
    localStorage.setItem('cottageReviews', JSON.stringify(reviews));
    
    // Show success message
    const success = document.getElementById('reviewSuccess');
    if (success) {
        success.style.display = 'block';
        success.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
    
    // Hide and reset form
    form.reset();
    setTimeout(() => {
        form.parentElement.style.display = 'none';
        if (success) success.style.display = 'none';
        // Reload reviews to show the new one
        loadReviews(cottageName);
    }, 3000);
    
    alert('✅ Thank you for your review! It has been posted.');
}

// Load and display reviews for a cottage
function loadReviews(cottageName) {
    const reviews = JSON.parse(localStorage.getItem('cottageReviews') || '[]');
    const cottageReviews = reviews.filter(r => r.cottage === cottageName && r.approved);
    
    const reviewsList = document.getElementById('reviewsList');
    const noReviews = document.getElementById('noReviews');
    const avgRating = document.getElementById('averageRating');
    
    if (!reviewsList) return;
    
    if (cottageReviews.length === 0) {
        if (noReviews) noReviews.style.display = 'block';
        if (avgRating) avgRating.style.display = 'none';
        reviewsList.innerHTML = '';
        return;
    }
    
    // Hide no reviews message
    if (noReviews) noReviews.style.display = 'none';
    
    // Calculate average rating and statistics
    const totalRating = cottageReviews.reduce((sum, r) => sum + r.rating, 0);
    const average = totalRating / cottageReviews.length;
    const roundedAverage = Math.round(average * 10) / 10; // Round to nearest 0.1
    
    // Calculate rating distribution
    const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    cottageReviews.forEach(r => distribution[r.rating]++);
    
    // Display average rating with advanced statistics
    if (avgRating) {
        avgRating.style.display = 'block';
        avgRating.style.cssText = `
            display: block;
            background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
            padding: 30px;
            border-radius: 16px;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
            margin-bottom: 30px;
        `;
        
        const starsDiv = avgRating.querySelector('.avg-rating-stars');
        const textDiv = avgRating.querySelector('.avg-rating-text');
        
        if (starsDiv) {
            // Determine color based on average rating
            let starColor = '#ffc107';
            let ratingLabel = 'Average';
            let labelColor = '#ffc107';
            
            if (average >= 4.5) {
                starColor = '#4caf50';
                ratingLabel = 'Excellent';
                labelColor = '#4caf50';
            } else if (average >= 3.5) {
                starColor = '#8bc34a';
                ratingLabel = 'Very Good';
                labelColor = '#8bc34a';
            } else if (average >= 2.5) {
                starColor = '#ffc107';
                ratingLabel = 'Good';
                labelColor = '#ffc107';
            } else if (average >= 1.5) {
                starColor = '#ff9800';
                ratingLabel = 'Fair';
                labelColor = '#ff9800';
            } else {
                starColor = '#f44336';
                ratingLabel = 'Needs Improvement';
                labelColor = '#f44336';
            }
            
            // Generate precise fractional stars
            let starsHTML = '<div style="display: flex; align-items: center; justify-content: center; gap: 15px; flex-wrap: wrap; margin-bottom: 20px;">';
            starsHTML += '<div style="display: flex; gap: 4px; font-size: 3rem; filter: drop-shadow(0 4px 8px rgba(0,0,0,0.15));">';
            
            for (let i = 1; i <= 5; i++) {
                const fillPercent = Math.max(0, Math.min(100, (average - (i - 1)) * 100));
                
                if (fillPercent === 100) {
                    // Full star
                    starsHTML += `<span style="color: ${starColor}; text-shadow: 0 0 15px ${starColor}cc, 0 0 30px ${starColor}66; animation: starShine 2s ease-in-out infinite; animation-delay: ${i * 0.1}s;">★</span>`;
                } else if (fillPercent > 0) {
                    // Partial star
                    starsHTML += `<span style="position: relative; display: inline-block;">
                        <span style="color: #ddd; text-shadow: 0 2px 6px rgba(0,0,0,0.1);">★</span>
                        <span style="position: absolute; left: 0; top: 0; width: ${fillPercent}%; overflow: hidden; color: ${starColor}; text-shadow: 0 0 15px ${starColor}cc, 0 0 30px ${starColor}66;">★</span>
                    </span>`;
                } else {
                    // Empty star
                    starsHTML += `<span style="color: #ddd; text-shadow: 0 2px 6px rgba(0,0,0,0.1);">★</span>`;
                }
            }
            
            starsHTML += '</div>';
            starsHTML += `<div style="display: flex; flex-direction: column; align-items: center;">
                <div style="font-size: 3.5rem; font-weight: 800; color: ${labelColor}; line-height: 1; text-shadow: 0 2px 8px ${labelColor}44;">${roundedAverage.toFixed(1)}</div>
                <div style="font-size: 0.9rem; color: #666; font-weight: 600; margin-top: 4px;">out of 5</div>
            </div></div>`;
            
            // Add rating distribution bars
            starsHTML += `<div style="margin-top: 25px; padding-top: 25px; border-top: 2px solid rgba(0,0,0,0.05);">
                <div style="font-size: 1.1rem; font-weight: 700; color: #333; margin-bottom: 15px; text-align: center;">Rating Distribution</div>`;
            
            for (let rating = 5; rating >= 1; rating--) {
                const count = distribution[rating];
                const percent = cottageReviews.length > 0 ? (count / cottageReviews.length * 100).toFixed(0) : 0;
                let barColor = rating === 5 ? '#4caf50' : rating === 4 ? '#8bc34a' : rating === 3 ? '#ffc107' : rating === 2 ? '#ff9800' : '#f44336';
                
                starsHTML += `<div style="display: flex; align-items: center; gap: 12px; margin-bottom: 10px;">
                    <div style="min-width: 60px; font-size: 1rem; color: #666; font-weight: 600;">${rating} ${'★'.repeat(rating)}</div>
                    <div style="flex: 1; height: 24px; background: #e0e0e0; border-radius: 12px; overflow: hidden; position: relative; box-shadow: inset 0 2px 4px rgba(0,0,0,0.1);">
                        <div style="height: 100%; background: linear-gradient(90deg, ${barColor} 0%, ${barColor}dd 100%); width: ${percent}%; transition: width 1s ease-out; box-shadow: 0 0 10px ${barColor}66;"></div>
                    </div>
                    <div style="min-width: 70px; font-size: 0.9rem; color: #666; font-weight: 600; text-align: right;">${count} (${percent}%)</div>
                </div>`;
            }
            
            starsHTML += '</div>';
            
            // Add rating label badge
            starsHTML += `<div style="text-align: center; margin-top: 20px;">
                <span style="display: inline-block; padding: 10px 24px; background: linear-gradient(135deg, ${labelColor} 0%, ${labelColor}dd 100%); color: white; border-radius: 24px; font-weight: 700; font-size: 1.1rem; text-transform: uppercase; letter-spacing: 1px; box-shadow: 0 4px 15px ${labelColor}44;">
                    ${ratingLabel}
                </span>
            </div>`;
            
            starsDiv.innerHTML = starsHTML;
        }
        
        if (textDiv) {
            textDiv.style.cssText = 'text-align: center; font-size: 1rem; color: #666; margin-top: 15px; font-weight: 500;';
            textDiv.textContent = `Based on ${cottageReviews.length} guest review${cottageReviews.length > 1 ? 's' : ''}`;
        }
    }
    
    // Add CSS animation for stars
    if (!document.getElementById('starAnimationStyle')) {
        const style = document.createElement('style');
        style.id = 'starAnimationStyle';
        style.textContent = `
            @keyframes starShine {
                0%, 100% { filter: brightness(1); transform: scale(1); }
                50% { filter: brightness(1.3); transform: scale(1.05); }
            }
        `;
        document.head.appendChild(style);
    }
    
    // Display reviews
    reviewsList.innerHTML = cottageReviews.map((review, index) => {
        const date = new Date(review.date).toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        });
        
        // Generate colored stars based on rating
        let starColor = '#ffc107';
        let ratingBadge = '';
        let badgeColor = '';
        
        if (review.rating === 5) {
            starColor = '#4caf50';
            ratingBadge = 'Excellent';
            badgeColor = '#4caf50';
        } else if (review.rating === 4) {
            starColor = '#8bc34a';
            ratingBadge = 'Very Good';
            badgeColor = '#8bc34a';
        } else if (review.rating === 3) {
            starColor = '#ffc107';
            ratingBadge = 'Good';
            badgeColor = '#ffc107';
        } else if (review.rating === 2) {
            starColor = '#ff9800';
            ratingBadge = 'Fair';
            badgeColor = '#ff9800';
        } else if (review.rating === 1) {
            starColor = '#f44336';
            ratingBadge = 'Poor';
            badgeColor = '#f44336';
        }
        
        let starsHTML = '<div style="display: flex; gap: 3px; font-size: 1.5rem; align-items: center;">';
        for (let i = 0; i < review.rating; i++) {
            starsHTML += `<span style="color: ${starColor}; text-shadow: 0 0 10px ${starColor}aa, 0 2px 6px rgba(0,0,0,0.2); animation: starPop 0.3s ease-out ${i * 0.05}s backwards;">★</span>`;
        }
        for (let i = review.rating; i < 5; i++) {
            starsHTML += `<span style="color: #ddd; text-shadow: 0 2px 4px rgba(0,0,0,0.08);">☆</span>`;
        }
        starsHTML += `<span style="margin-left: 8px; padding: 4px 12px; background: linear-gradient(135deg, ${badgeColor} 0%, ${badgeColor}dd 100%); color: white; border-radius: 12px; font-size: 0.75rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; box-shadow: 0 2px 8px ${badgeColor}44;">${ratingBadge}</span>`;
        starsHTML += '</div>';
        
        const hasReply = review.reply && review.reply.trim();
        const isAdmin = adminLoggedIn;
        
        // Generate user avatar with initials
        const initials = escapeHtml(review.name).split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
        const avatarColors = ['#667eea', '#f093fb', '#4facfe', '#43e97b', '#fa709a', '#30cfd0'];
        const avatarColor = avatarColors[review.id % avatarColors.length];
        
        return `
            <div class="review-card" id="review-${review.id}" style="background: white; padding: 25px; border-radius: 16px; margin-bottom: 20px; box-shadow: 0 4px 20px rgba(0,0,0,0.08); border-left: 4px solid ${starColor}; transition: all 0.3s ease; animation: reviewSlideIn 0.5s ease-out ${index * 0.1}s backwards;" onmouseover="this.style.transform='translateY(-4px)'; this.style.boxShadow='0 8px 30px rgba(0,0,0,0.12)';" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 20px rgba(0,0,0,0.08)';">
                <div style="display: flex; align-items: start; gap: 15px; margin-bottom: 15px;">
                    <div style="width: 50px; height: 50px; background: linear-gradient(135deg, ${avatarColor} 0%, ${avatarColor}dd 100%); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 700; color: white; font-size: 1.2rem; box-shadow: 0 4px 12px ${avatarColor}44; flex-shrink: 0;">
                        ${initials}
                    </div>
                    <div style="flex: 1; min-width: 0;">
                        <div style="display: flex; justify-content: space-between; align-items: start; flex-wrap: wrap; gap: 10px; margin-bottom: 8px;">
                            <div>
                                <div style="font-size: 1.2rem; font-weight: 700; color: #333; margin-bottom: 4px;">${escapeHtml(review.name)}</div>
                                <div style="font-size: 0.9rem; color: #666; display: flex; align-items: center; gap: 6px;">
                                    <span style="opacity: 0.7;">📅</span>
                                    <span>${date}</span>
                                </div>
                            </div>
                            ${starsHTML}
                        </div>
                    </div>
                </div>
                ${review.review ? `<div style="padding: 20px; background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%); border-radius: 12px; font-size: 1rem; line-height: 1.7; color: #333; border-left: 3px solid ${starColor}; box-shadow: inset 0 2px 6px rgba(0,0,0,0.05);">"${escapeHtml(review.review)}"</div>` : ''}
                
                ${hasReply ? `
                    <div style="margin-top: 20px; padding: 20px; background: linear-gradient(135deg, rgba(79, 172, 254, 0.08) 0%, rgba(0, 242, 254, 0.08) 100%); border-radius: 12px; border-left: 4px solid #4facfe; position: relative;">
                        <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 12px;">
                            <div style="width: 40px; height: 40px; background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 700; color: white; font-size: 1rem; box-shadow: 0 4px 12px rgba(79, 172, 254, 0.4);">
                                CA
                            </div>
                            <div>
                                <div style="font-weight: 700; color: #4facfe; font-size: 1rem;">Crystal Acres NH</div>
                                <div style="font-size: 0.85rem; color: #666;">Property Response</div>
                            </div>
                            ${isAdmin ? `<button onclick="deleteReply(${review.id}, '${cottageName}')" style="margin-left: auto; background: linear-gradient(135deg, #ee0979 0%, #ff6a00 100%); color: white; border: none; padding: 6px 14px; border-radius: 8px; cursor: pointer; font-size: 0.85rem; font-weight: 600; box-shadow: 0 2px 8px rgba(238, 9, 121, 0.3); transition: all 0.2s ease;" onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 4px 12px rgba(238, 9, 121, 0.4)';" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 2px 8px rgba(238, 9, 121, 0.3)';">🗑️ Delete Reply</button>` : ''}
                        </div>
                        <div style="font-size: 0.95rem; line-height: 1.6; color: #333; padding-left: 50px;">${escapeHtml(review.reply)}</div>
                    </div>
                ` : ''}
                
                ${isAdmin ? `
                    <div style="margin-top: 16px; display: flex; gap: 10px; flex-wrap: wrap;">
                        ${!hasReply ? `<button onclick="showReplyForm(${review.id}, '${cottageName}')" style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); color: white; border: none; padding: 10px 20px; border-radius: 8px; cursor: pointer; font-size: 0.95rem; font-weight: 600; box-shadow: 0 2px 10px rgba(79, 172, 254, 0.3); transition: all 0.2s ease; display: flex; align-items: center; gap: 6px;" onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 4px 15px rgba(79, 172, 254, 0.4)';" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 2px 10px rgba(79, 172, 254, 0.3)';"><span style="font-size: 1.1rem;">💬</span> Reply to Guest</button>` : ''}
                        <button onclick="deleteReview(${review.id}, '${cottageName}')" style="background: linear-gradient(135deg, #ee0979 0%, #ff6a00 100%); color: white; border: none; padding: 10px 20px; border-radius: 8px; cursor: pointer; font-size: 0.95rem; font-weight: 600; box-shadow: 0 2px 10px rgba(238, 9, 121, 0.3); transition: all 0.2s ease; display: flex; align-items: center; gap: 6px;" onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 4px 15px rgba(238, 9, 121, 0.4)';" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 2px 10px rgba(238, 9, 121, 0.3)';"><span style="font-size: 1.1rem;">🗑️</span> Delete Review</button>
                    </div>
                ` : ''}
                
                <div id="reply-form-${review.id}" style="display: none; margin-top: 20px; padding: 25px; background: linear-gradient(135deg, rgba(79, 172, 254, 0.12) 0%, rgba(0, 242, 254, 0.12) 100%); border-radius: 12px; border: 2px solid rgba(79, 172, 254, 0.3); box-shadow: 0 4px 15px rgba(79, 172, 254, 0.15);">
                    <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 15px;">
                        <div style="width: 45px; height: 45px; background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 700; color: white; font-size: 1.1rem; box-shadow: 0 4px 12px rgba(79, 172, 254, 0.4);">
                            CA
                        </div>
                        <div>
                            <h4 style="margin: 0; color: #333; font-size: 1.1rem;">Replying to ${escapeHtml(review.name)}</h4>
                            <div style="font-size: 0.85rem; color: #666; margin-top: 2px;">Your response will be visible to all guests</div>
                        </div>
                    </div>
                    <textarea id="reply-text-${review.id}" placeholder="Write a thoughtful response to this guest's review..." style="width: 100%; padding: 15px; border: 2px solid #4facfe; border-radius: 10px; font-size: 0.95rem; font-family: inherit; resize: vertical; min-height: 100px; box-sizing: border-box; background: white; transition: all 0.2s ease; box-shadow: 0 2px 8px rgba(79, 172, 254, 0.1);" onfocus="this.style.borderColor='#00f2fe'; this.style.boxShadow='0 4px 12px rgba(79, 172, 254, 0.2)';" onblur="this.style.borderColor='#4facfe'; this.style.boxShadow='0 2px 8px rgba(79, 172, 254, 0.1)';"></textarea>
                    <div style="margin-top: 15px; display: flex; gap: 10px; flex-wrap: wrap;">
                        <button onclick="submitReply(${review.id}, '${cottageName}')" style="background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%); color: white; border: none; padding: 12px 24px; border-radius: 8px; cursor: pointer; font-size: 0.95rem; font-weight: 600; box-shadow: 0 2px 10px rgba(17, 153, 142, 0.3); transition: all 0.2s ease; display: flex; align-items: center; gap: 8px;" onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 4px 15px rgba(17, 153, 142, 0.4)';" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 2px 10px rgba(17, 153, 142, 0.3)';"><span style="font-size: 1.2rem;">✓</span> Post Reply</button>
                        <button onclick="hideReplyForm(${review.id})" style="background: linear-gradient(135deg, #95a5a6 0%, #7f8c8d 100%); color: white; border: none; padding: 12px 24px; border-radius: 8px; cursor: pointer; font-size: 0.95rem; font-weight: 600; box-shadow: 0 2px 10px rgba(149, 165, 166, 0.3); transition: all 0.2s ease; display: flex; align-items: center; gap: 8px;" onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 4px 15px rgba(149, 165, 166, 0.4)';" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 2px 10px rgba(149, 165, 166, 0.3)';"><span style="font-size: 1.2rem;">✕</span> Cancel</button>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// Helper function to escape HTML
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Show reply form
function showReplyForm(reviewId) {
    const form = document.getElementById(`reply-form-${reviewId}`);
    if (form) {
        form.style.display = 'block';
        const textarea = document.getElementById(`reply-text-${reviewId}`);
        if (textarea) textarea.focus();
    }
}

// Hide reply form
function hideReplyForm(reviewId) {
    const form = document.getElementById(`reply-form-${reviewId}`);
    if (form) {
        form.style.display = 'none';
        const textarea = document.getElementById(`reply-text-${reviewId}`);
        if (textarea) textarea.value = '';
    }
}

// Submit reply to review
function submitReply(reviewId, cottageName) {
    const textarea = document.getElementById(`reply-text-${reviewId}`);
    const replyText = textarea ? textarea.value.trim() : '';
    
window.cancelAdminEdit = cancelAdminEdit;
window.toggleReviewForm = toggleReviewForm;
window.submitReview = submitReview;
window.loadReviews = loadReviews;
window.showReplyForm = showReplyForm;
window.hideReplyForm = hideReplyForm;
window.submitReply = submitReply;
window.deleteReply = deleteReply;
window.deleteReview = deleteReview;
    
    // Get reviews
    const reviews = JSON.parse(localStorage.getItem('cottageReviews') || '[]');
    const reviewIndex = reviews.findIndex(r => r.id === reviewId);
    
    if (reviewIndex !== -1) {
        reviews[reviewIndex].reply = replyText;
        localStorage.setItem('cottageReviews', JSON.stringify(reviews));
        
        // Reload reviews
        loadReviews(cottageName);
        alert('✅ Reply posted successfully!');
    }
}

// Delete reply from review
function deleteReply(reviewId, cottageName) {
    if (!confirm('Are you sure you want to delete this reply?')) {
        return;
    }
    
    // Get reviews
    const reviews = JSON.parse(localStorage.getItem('cottageReviews') || '[]');
    const reviewIndex = reviews.findIndex(r => r.id === reviewId);
    
    if (reviewIndex !== -1) {
        delete reviews[reviewIndex].reply;
        localStorage.setItem('cottageReviews', JSON.stringify(reviews));
        
        // Reload reviews
        loadReviews(cottageName);
        alert('✅ Reply deleted successfully!');
    }
}

// Delete review
function deleteReview(reviewId, cottageName) {
    if (!confirm('Are you sure you want to delete this review? This action cannot be undone.')) {
        return;
    }
    
    // Get reviews
    const reviews = JSON.parse(localStorage.getItem('cottageReviews') || '[]');
    const updatedReviews = reviews.filter(r => r.id !== reviewId);
    
    localStorage.setItem('cottageReviews', JSON.stringify(updatedReviews));
    
    // Reload reviews
    loadReviews(cottageName);
    alert('✅ Review deleted successfully!');
}

// Initialize advanced star rating system
function initStarRating() {
    const starRating = document.querySelector('.star-rating');
    if (!starRating) return;
    
    // Create rating description element
    const ratingDesc = document.createElement('div');
    ratingDesc.id = 'ratingDescription';
    ratingDesc.style.cssText = `
        margin-top: 10px;
        font-size: 16px;
        font-weight: 600;
        text-align: center;
        min-height: 24px;
        transition: all 0.3s ease;
        opacity: 0;
    `;
    
    // Insert after star rating
    starRating.parentNode.insertBefore(ratingDesc, starRating.nextSibling);
    
    const ratings = {
        5: { text: '⭐ Excellent!', color: '#4caf50' },
        4: { text: '😊 Very Good', color: '#8bc34a' },
        3: { text: '👍 Average', color: '#ffc107' },
        2: { text: '😐 Below Average', color: '#ff9800' },
        1: { text: '😞 Poor', color: '#f44336' }
    };
    
    // Add hover listeners to star labels
    const labels = starRating.querySelectorAll('label');
    labels.forEach((label, index) => {
        const rating = 5 - index; // Reverse order because of flex-direction: row-reverse
        
        label.addEventListener('mouseenter', () => {
            ratingDesc.textContent = ratings[rating].text;
            ratingDesc.style.color = ratings[rating].color;
            ratingDesc.style.opacity = '1';
            ratingDesc.style.transform = 'translateY(-5px)';
        });
        
        label.addEventListener('mouseleave', () => {
            const checkedInput = starRating.querySelector('input[type="radio"]:checked');
            if (!checkedInput) {
                ratingDesc.style.opacity = '0';
                ratingDesc.style.transform = 'translateY(0)';
            }
        });
    });
    
    // Add change listeners to radio inputs
    const inputs = starRating.querySelectorAll('input[type="radio"]');
    inputs.forEach(input => {
        input.addEventListener('change', (e) => {
            const rating = parseInt(e.target.value);
            ratingDesc.textContent = ratings[rating].text;
            ratingDesc.style.color = ratings[rating].color;
            ratingDesc.style.opacity = '1';
            ratingDesc.style.transform = 'translateY(-5px)';
            
            // Add celebration effect for 5 stars
            if (rating === 5) {
                createStarBurst(starRating);
            }
        });
    });
}

// Create star burst animation for 5-star rating
function createStarBurst(container) {
    const colors = ['#ffc107', '#4caf50', '#ff9800', '#ffeb3b'];
    const rect = container.getBoundingClientRect();
    
    for (let i = 0; i < 12; i++) {
        const particle = document.createElement('div');
        particle.style.cssText = `
            position: fixed;
            left: ${rect.left + rect.width / 2}px;
            top: ${rect.top + rect.height / 2}px;
            width: 10px;
            height: 10px;
            background: ${colors[i % colors.length]};
            border-radius: 50%;
            pointer-events: none;
            z-index: 10000;
        `;
        document.body.appendChild(particle);
        
        const angle = (i / 12) * Math.PI * 2;
        const velocity = 100 + Math.random() * 50;
        const vx = Math.cos(angle) * velocity;
        const vy = Math.sin(angle) * velocity;
        
        let time = 0;
        const animate = () => {
            time += 0.016;
            if (time > 1) {
                particle.remove();
                return;
            }
            
            const x = vx * time;
            const y = vy * time + (500 * time * time); // Gravity
            const opacity = 1 - time;
            
            particle.style.transform = `translate(${x}px, ${y}px) scale(${1 - time})`;
            particle.style.opacity = opacity;
            
            requestAnimationFrame(animate);
        };
        animate();
    }
}

// Load reviews on page load for testimonials pages
document.addEventListener('DOMContentLoaded', function() {
    const pageTitle = document.querySelector('.cottage-detail-header h1');
    if (pageTitle && window.location.pathname.includes('testimonials.html')) {
        loadReviews(pageTitle.textContent);
        initStarRating();
    }
});

// Export functions to window object for HTML onclick handlers
window.toggleAdminMode = toggleAdminMode;
window.toggleAdminDropdown = toggleAdminDropdown;
window.closeAdminDropdown = closeAdminDropdown;
window.toggleEditMode = toggleEditMode;
window.toggleAdminEditMode = toggleAdminEditMode;
window.savePageContent = savePageContent;
window.cancelPageEdit = cancelPageEdit;
window.toggleAmenitiesEditor = toggleAmenitiesEditor;
window.openAdminManager = openAdminManager;
window.closeAdminManager = closeAdminManager;
window.toggleMasterPasswordVisibility = toggleMasterPasswordVisibility;
window.changeMasterPassword = changeMasterPassword;
window.saveAdminEdit = saveAdminEdit;
window.addNewAdmin = addNewAdmin;
window.deleteAdmin = deleteAdmin;
window.toggleMaintenanceMode = toggleMaintenanceMode;
window.cancelAdminEdit = cancelAdminEdit;
window.toggleReviewForm = toggleReviewForm;
window.submitReview = submitReview;
window.loadReviews = loadReviews;
