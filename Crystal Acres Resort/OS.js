/* --- cottage-nav.js --- */
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


/* --- assets/cms.js --- */
// 0. Pre-Render Hiding (Prevents Flash of Unstyled Content)
// This runs immediately if script is in <head>
try {
    document.documentElement.style.visibility = 'hidden';
    document.documentElement.style.opacity = '0';
    document.documentElement.style.transition = 'opacity 0.2s ease-in';
} catch (e) {
    console.warn("CMS: Could not hide document", e);
}

// Safety Fallback: Force show after 3s if something breaks
setTimeout(() => {
    document.documentElement.style.visibility = 'visible';
    document.documentElement.style.opacity = '1';
}, 3000);

const CMS_URL = "https://script.google.com/macros/s/AKfycbwmdHoStelDOC9PzQWWQacWtZlEV8sOSHptxTzB8bp6cduMJKSkK3bHzCUuMXq_ogQM/exec";

async function loadSiteContent(pageName) {
    console.log(`CMS: Loading content for ${pageName}...`);
    const cacheKey = `cms_cache_${pageName}`;

    // 1. Try Local Cache First (Instant)
    try {
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
            console.log("CMS: Loaded from cache");
            const cachedData = JSON.parse(cached);

            // New format support
            if (cachedData.content || cachedData.styles) {
                applyContent(cachedData.content);
                applyStyles(cachedData.styles);
            } else {
                // Legacy fallback
                applyContent(cachedData);
            }
        }
    } catch (e) { console.warn("CMS: Cache read error", e); }

    // REVEAL NOW: We have applied cache (or defaults if empty). 
    // Show the page ASAP so it feels "instant".
    requestAnimationFrame(() => {
        document.documentElement.style.visibility = 'visible';
        document.documentElement.style.opacity = '1';
    });

    // 2. Fetch Fresh Data (Network)
    try {
        const response = await fetch(CMS_URL, {
            method: 'POST',
            body: JSON.stringify({
                action: 'getContent',
                page: pageName
            })
        });
        const result = await response.json();

        if (result.status === 'success') {
            const pageData = result.data; // { content: {...}, styles: {...} }
            if (pageData) {
                // 3. Update DOM with fresh data
                if (pageData.content) applyContent(pageData.content);
                if (pageData.styles) applyStyles(pageData.styles);

                // 4. Update Cache
                localStorage.setItem(cacheKey, JSON.stringify(pageData));
            }
        }
    } catch (error) {
        console.error("CMS Error:", error);
    }
}

function applyContent(contentObj) {
    if (!contentObj) return;
    for (const [id, text] of Object.entries(contentObj)) {
        const element = document.getElementById(id);
        if (element) {
            // Check if content is actually different to avoid unnecessary reflows
            if (element.innerHTML !== text) {
                element.innerHTML = text;
            }
        }
    }
}

function applyStyles(styleData) {
    if (!styleData) return;

    // Support the new array format: [{type, target, styles}]
    if (Array.isArray(styleData)) {
        styleData.forEach(rule => {
            if (!rule.target || !rule.styles) return;

            if (rule.type === 'section') {
                const element = document.getElementById(rule.target);
                if (element) {
                    Object.assign(element.style, rule.styles);
                }
            } else if (rule.type === 'text') {
                // Build CSS string
                let cssString = "";
                for (const [k, v] of Object.entries(rule.styles)) {
                    const cssKey = k.replace(/([A-Z])/g, "-$1").toLowerCase();
                    cssString += `${cssKey}: ${v}; `;
                }

                // Find potential target elements
                const elements = document.querySelectorAll('[id]');
                elements.forEach(el => {
                    // Check if element has the text
                    if (el.innerHTML.includes(rule.target)) {
                        let html = el.innerHTML;
                        // Split by HTML tags to safely avoid replacing inside attributes like <span style="...">
                        const parts = html.split(/(<[^>]*>)/);
                        for (let i = 0; i < parts.length; i++) {
                            // Even indices are text nodes outside of tags
                            if (i % 2 === 0) {
                                // Escape target and replace
                                const escapedTarget = rule.target.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                                const regex = new RegExp(`(${escapedTarget})`, 'g');
                                parts[i] = parts[i].replace(regex, `<span style="${cssString}">$1</span>`);
                            }
                        }
                        el.innerHTML = parts.join('');
                    }
                });
            }
        });
    } else {
        // Legacy fallback for Object format
        for (const [id, styleObj] of Object.entries(styleData)) {
            const element = document.getElementById(id);
            if (element && styleObj) {
                if (styleObj.fontFamily) element.style.fontFamily = styleObj.fontFamily;
                if (styleObj.fontSize) element.style.fontSize = styleObj.fontSize;
                if (styleObj.fontWeight) element.style.fontWeight = styleObj.fontWeight;
                if (styleObj.fontStyle) element.style.fontStyle = styleObj.fontStyle;
                if (styleObj.textDecoration) element.style.textDecoration = styleObj.textDecoration;
            }
        }
    }
}

// Auto-detect page based on body data-attribute
document.addEventListener("DOMContentLoaded", () => {
    const page = document.body.getAttribute('data-cms-page');
    if (page) {
        loadSiteContent(page);
    } else {
        // Not a CMS page - reveal immediately!
        document.documentElement.style.visibility = 'visible';
        document.documentElement.style.opacity = '1';
    }
});


/* --- assets/inline-editor.js --- */
// assets/inline-editor.js
/**
 * Inline WYSIWYG Editor Script
 * This script runs inside the actual website pages (index.html, villa/index.html, etc.)
 * It remains dormant unless activated by a postMessage from the parent admin iframe.
 */

let isEditMode = false;
let editedFields = {}; // Stores { 'element-id': true } to mark it dirty
let editedStyles = []; // Stores { type: 'text'/'section', target: '...', styles: {...} }

// Listen for messages from the parent admin panel
window.addEventListener('message', (event) => {
    // Basic security: In a real app, verify event.origin
    const data = event.data;

    if (data.action === 'enableEditMode') {
        enableEditMode();
    } else if (data.action === 'disableEditMode') {
        disableEditMode();
    } else if (data.action === 'requestChanges') {
        // Parent admin panel is asking for all changes to save them
        let plainTextFields = {};
        for (let id in editedFields) {
            let el = document.getElementById(id);
            if (el) plainTextFields[id] = el.innerText; // strictly plain text
        }
        window.parent.postMessage({
            action: 'changesReport',
            updates: plainTextFields,
            styleUpdates: editedStyles
        }, '*');
    } else if (data.action === 'formatText') {
        // Parent admin panel sent a text formatting command (e.g., change font or size)
        applyInlineFormatting(data.command, data.value);
    }
});

function applyInlineFormatting(command, value) {
    const selection = getSelection();
    if (!selection.rangeCount || !selection.focusNode) return;

    let targetNode = selection.focusNode;
    let targetElement = targetNode.nodeType === 3 ? targetNode.parentElement : targetNode;

    const editableContainer = targetElement.closest('.cms-editable');

    if (!editableContainer || !editableContainer.id) {
        console.warn("Inline Editor: Could not find parent cms-editable container with an ID to apply styles to.");
        return;
    }

    const id = editableContainer.id;

    // Apply Style Inline using execCommand and then sanitizing
    if (command === 'fontName') {
        document.execCommand('styleWithCSS', false, true);
        document.execCommand('fontName', false, value);
    } else if (command === 'fontSize') {
        document.execCommand('styleWithCSS', false, true);
        // fontSize execCommand doesn't support px directly. Use proxy size 7
        document.execCommand('fontSize', false, 7);
        const fonts = editableContainer.querySelectorAll('font[size="7"], span[style*="font-size: -webkit-xxx-large"], span[style*="font-size: 7"]');
        fonts.forEach(f => {
            if (f.tagName.toLowerCase() === 'font') {
                const span = document.createElement('span');
                if (f.style.cssText) span.style.cssText = f.style.cssText;
                if (f.face) span.style.fontFamily = f.face;
                if (f.color) span.style.color = f.color;
                span.style.fontSize = value;
                span.innerHTML = f.innerHTML;
                f.replaceWith(span);
            } else {
                f.style.fontSize = value;
            }
        });
    } else if (['bold', 'italic', 'underline'].includes(command)) {
        document.execCommand('styleWithCSS', false, true);
        document.execCommand(command, false, null);
    }

    // Clean up any generated <font face="..."> into <span> tags
    const faceFonts = editableContainer.querySelectorAll('font[face]');
    faceFonts.forEach(f => {
        const span = document.createElement('span');
        if (f.style.cssText) span.style.cssText = f.style.cssText;
        span.style.fontFamily = f.face;
        span.innerHTML = f.innerHTML;
        f.replaceWith(span);
    });

    // Track the explicit style rule for the backend!
    const selectedText = selection.toString().trim();
    const containerText = editableContainer.innerText.trim();

    let type = 'section';
    let target = id;

    // If they only highlighted a specific word/phrase inside the block
    if (selectedText.length > 0 && selectedText !== containerText) {
        type = 'text';
        target = selectedText;
    }

    // Compile explicitly targeted style parameters
    let styleProp = '';
    let styleValue = '';

    if (command === 'fontName') { styleProp = 'fontFamily'; styleValue = value; }
    else if (command === 'fontSize') { styleProp = 'fontSize'; styleValue = value; }
    else if (command === 'bold') { styleProp = 'fontWeight'; styleValue = document.queryCommandState('bold') ? 'bold' : 'normal'; }
    else if (command === 'italic') { styleProp = 'fontStyle'; styleValue = document.queryCommandState('italic') ? 'italic' : 'normal'; }
    else if (command === 'underline') { styleProp = 'textDecoration'; styleValue = document.queryCommandState('underline') ? 'underline' : 'none'; }

    // Find if we already have an update pending for this target
    let existingRuleIndex = editedStyles.findIndex(s => s.type === type && s.target === target);
    if (existingRuleIndex !== -1) {
        editedStyles[existingRuleIndex].styles[styleProp] = styleValue;
    } else {
        let rule = { type: type, target: target, styles: {} };
        rule.styles[styleProp] = styleValue;
        editedStyles.push(rule);
    }

    // Mark field as dirty to ensure plain text gets extracted on save
    editedFields[id] = true;

    reportSelectionFormatting();

    // Notify parent to enable save button
    window.parent.postMessage({
        action: 'fieldChanged',
        id: id
    }, '*');
}

// Setup selection reporting to update the parent toolbar
function reportSelectionFormatting() {
    if (!isEditMode) return;
    const selection = getSelection();
    if (!selection.rangeCount || !selection.focusNode) return;

    let targetElement = selection.focusNode;
    if (targetElement.nodeType === 3) targetElement = targetElement.parentElement;

    const editableContainer = targetElement.closest('.cms-editable');
    if (!editableContainer) return;

    // Get the exact computed style of the selected text's immediate parent element
    const computed = getComputedStyle(targetElement);

    window.parent.postMessage({
        action: 'selectionFormatUpdated',
        format: {
            fontName: computed.fontFamily,
            fontSize: computed.fontSize,
            isBold: document.queryCommandState('bold'),
            isItalic: document.queryCommandState('italic'),
            isUnderline: document.queryCommandState('underline')
        }
    }, '*');
}

let reportTimeout;
function handleSelectionChange() {
    if (isEditMode) {
        clearTimeout(reportTimeout);
        reportTimeout = setTimeout(reportSelectionFormatting, 100);
    }
}

function enableEditMode() {
    if (isEditMode) return;
    isEditMode = true;
    console.log("Inline Editor: Edit Mode Enabled");

    // Add global styles for edit mode
    const styleAttr = document.createElement('style');
    styleAttr.id = 'inline-editor-styles';
    styleAttr.innerHTML = `
        .cms-editable {
            transition: outline 0.2s, background-color 0.2s;
            position: relative;
        }
        .cms-editable:hover {
            outline: 2px dashed #3182ce !important;
            background-color: rgba(49, 130, 206, 0.05) !important;
            cursor: text;
        }
        .cms-editable:focus {
            outline: 2px solid #3182ce !important;
            background-color: transparent !important;
        }
    `;
    document.head.appendChild(styleAttr);

    // Find all elements that have IDs (meaning they are potentially in the CMS)
    // To be safe and not break layout, we'll only target elements that look like text containers
    const textElements = document.querySelectorAll('h1, h2, h3, h4, h5, h6, p, span, div.nav-logo a, a.btn');

    textElements.forEach(el => {
        if (el.id && el.id.trim() !== '' && el.id !== 'currentUserProfile' && el.id !== 'sidebarName' && el.id !== 'sidebarRole' && el.id !== 'hamburgerMenu') { // Ignore admin ui elements if any snuck in
            makeEditable(el);
        }
        // Also check if it has a data-cms-id (for future explicit tagging)
        if (el.dataset.cmsId) {
            makeEditable(el);
        }
    });

    // Let parent know we are ready
    window.parent.postMessage({ action: 'editModeEnabled' }, '*');

    // Listen for cursor selections to update the toolbar
    document.addEventListener('selectionchange', handleSelectionChange);
}

function disableEditMode() {
    if (!isEditMode) return;
    isEditMode = false;
    console.log("Inline Editor: Edit Mode Disabled");

    // Remove styles
    const styleAttr = document.getElementById('inline-editor-styles');
    if (styleAttr) styleAttr.remove();

    // Remove editable properties
    document.querySelectorAll('.cms-editable').forEach(el => {
        el.contentEditable = "false";
        el.classList.remove('cms-editable');
    });

    document.removeEventListener('selectionchange', handleSelectionChange);
}

function makeEditable(el) {
    el.classList.add('cms-editable');
    el.contentEditable = "true";

    // Prevent default link behavior while editing so we can click to edit links
    if (el.tagName.toLowerCase() === 'a') {
        el.addEventListener('click', (e) => {
            if (isEditMode) {
                e.preventDefault();
            }
        });
    }

    // Listen for changes
    el.addEventListener('input', () => {
        const id = el.dataset.cmsId || el.id;
        if (id) {
            // Store the innerHTML
            editedFields[id] = el.innerHTML;

            // Optionally, tell parent immediately that a change occurred
            window.parent.postMessage({
                action: 'fieldChanged',
                id: id
            }, '*');
        }
    });
}

// Intercept link clicks globally if in edit mode to prevent accidental navigation away
document.addEventListener('click', (e) => {
    if (isEditMode) {
        let target = e.target;
        while (target && target.tagName !== 'A') {
            target = target.parentNode;
        }
        if (target && target.tagName === 'A') {
            // Prevent navigation
            e.preventDefault();
            console.log("Inline Editor: Link navigation prevented in edit mode.");
        }
    }
});


/* --- assets/init-db.js --- */
/**
 * Handles the Database Initialization (Reset to Defaults) logic for the Admin Panel.
 */
async function initializeDB() {
    if (!confirm("WARNING: This will RESET the 'SiteContent' and 'SiteStyles' content to defaults. Any custom edits will be lost. Are you sure?")) return;

    showStatus("Resetting Editor Content...", "info");
    const res = await sendRequest('setup'); // Calls the setup function in editor.gs via main.gs

    if (res.status === 'success') {
        showStatus("Database Reset Complete!", "success");
        // Clear all CMS local caches to ensure fresh data is loaded immediately
        const pages = ['home', 'villa', 'browncamp', 'shanty', 'bunkhouse'];
        pages.forEach(p => localStorage.removeItem('cms_cache_' + p));
        loadContent(); // Reload current view to show the defaults
    } else {
        showStatus("Reset Failed.", "error");
    }
}



/* --- INLINE SCRIPTS FUSED --- */

/* --- Inline script extracted from admin.html --- */
// CONFIGURATION
        const WEB_APP_URL = "https://script.google.com/macros/s/AKfycbwmdHoStelDOC9PzQWWQacWtZlEV8sOSHptxTzB8bp6cduMJKSkK3bHzCUuMXq_ogQM/exec";

        // STATE
        let siteContent = {};
        let currentUser = null;
        let heartbeatInterval = null;

        // INITIALIZATION
        window.onload = () => {
            // Check if already logged in (Transient Session)
            const saved = sessionStorage.getItem('crystalAdminUser');
            if (saved) {
                currentUser = JSON.parse(saved);
                document.getElementById('loginOverlay').style.display = 'none';
                updateSidebarProfile();
                refreshAdmins();
                loadContent();
                startHeartbeat();
            }
        };

        function startHeartbeat() {
            if (heartbeatInterval) clearInterval(heartbeatInterval);
            // Refresh every 60s to update "Last Seen" and see others
            heartbeatInterval = setInterval(refreshAdmins, 60000);
        }

        function updateSidebarProfile() {
            if (!currentUser) return;
            document.getElementById('currentUserProfile').style.display = 'block';
            document.getElementById('sidebarName').textContent = currentUser.name;

            const roleEl = document.getElementById('sidebarRole');
            roleEl.textContent = currentUser.role.toUpperCase();
            if (currentUser.role === 'Owner') {
                roleEl.style.backgroundColor = '#ecc94b';
                roleEl.style.color = '#744210';
            } else {
                roleEl.style.backgroundColor = '#e2e8f0';
                roleEl.style.color = '#4a5568';
            }
        }

        // --- AUTH & LOGIN ---

        async function handleLogin(e) {
            e.preventDefault();
            const email = document.getElementById('loginEmail').value;
            const password = document.getElementById('loginPassword').value;
            const errorEl = document.getElementById('loginError');

            errorEl.style.display = 'none';
            const btn = e.target.querySelector('button');
            const originalText = btn.textContent;
            btn.textContent = "Verifying...";
            btn.disabled = true;

            const res = await sendRequest('login', { email, password });

            if (res.status === 'success') {
                currentUser = res.data; // { name, email, role }
                sessionStorage.setItem('crystalAdminUser', JSON.stringify(currentUser));
                document.getElementById('loginOverlay').style.display = 'none';
                updateSidebarProfile();
                refreshAdmins();
                loadContent();
                startHeartbeat();
            } else {
                errorEl.textContent = res.message || "Wrong email or password.";
                errorEl.style.display = 'block';
                btn.textContent = originalText;
                btn.disabled = false;
            }
        }

        async function logout() {
            try {
                if (currentUser && currentUser.email) {
                    // Update UI immediately while async logout happens
                    const btn = document.querySelector('[onclick="logout()"]');
                    if (btn) btn.textContent = "Signing out...";

                    // Attempt network logout (best effort, don't wait forever)
                    const logoutPromise = sendRequest('logout', { email: currentUser.email });
                    // Race: only wait 2s max
                    await Promise.race([
                        logoutPromise,
                        new Promise(resolve => setTimeout(resolve, 2000))
                    ]);
                }
            } catch (e) {
                console.error("Logout error", e);
            } finally {
                // ALWAYS run cleanup and redirect
                sessionStorage.removeItem('crystalAdminUser');
                window.location.href = "index.html";
            }
        }

        // NAVIGATION
        function switchView(viewName) {
            // Update Sidebar
            document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
            // Find the button that was clicked. If called programmatically, we might need a better way, but for now this works for clicks.
            if (event && event.currentTarget) {
                event.currentTarget.classList.add('active');
            } else {
                // Fallback for default state
                const index = viewName === 'dashboard' ? 0 : 1;
                document.querySelectorAll('.nav-item')[index].classList.add('active');
            }

            // Update Main Content
            document.querySelectorAll('.view-section').forEach(el => el.classList.remove('active'));
            document.getElementById(viewName + 'View').classList.add('active');
        }

        // --- CORE FUNCTIONS ---

        function showStatus(text, type = 'success') {
            const el = document.getElementById('statusMessage');
            el.textContent = text;
            el.className = ''; // Reset
            el.classList.add('status-' + type);
            el.style.display = 'block';
            setTimeout(() => { el.style.display = 'none'; }, 3000);
        }

        async function sendRequest(action, data = {}) {
            try {
                const response = await fetch(WEB_APP_URL, {
                    method: 'POST',
                    body: JSON.stringify({ action: action, ...data })
                });
                return await response.json();
            } catch (error) {
                console.error(error);
                showStatus("Connection failed.", 'error');
                return { status: 'error', message: 'Connection failed' };
            }
        }

        // --- ADMIN MANAGEMENT ---

        // --- ADMIN MANAGEMENT ---

        // --- ADMIN MANAGEMENT ---

        async function refreshAdmins() {
            if (!currentUser) return; // Guard

            // Send requester info to get masked/unmasked data
            const result = await sendRequest('getAdmins', { requesterEmail: currentUser.email });

            if (result.status === 'success') {
                renderAdminList(result.data);
            }
        }

        function renderAdminList(admins) {
            const container = document.getElementById('adminList');
            if (admins.length === 0) {
                container.innerHTML = '<div style="color: #718096; padding: 10px;">No admins found.</div>';
                return;
            }

            container.innerHTML = ''; // Clear

            admins.forEach(admin => {
                const isOwner = admin.role === 'Owner';
                const isMe = admin.email === currentUser.email;
                const canRemove = currentUser.role === 'Owner' || (isMe && !isOwner);

                // Presence Logic (Using Backend Status)
                const isOnline = (admin.status === "Online");
                const statusDot = isOnline
                    ? '<span title="Online" style="color: #48bb78; font-size: 0.8rem; margin-right: 5px;">🟢</span>'
                    : '<span title="Offline" style="color: #cbd5e0; font-size: 0.8rem; margin-right: 5px;">⚪</span>';


                // Badge
                const badge = isOwner
                    ? '<span style="background: #ecc94b; color: #744210; padding: 2px 6px; border-radius: 4px; font-size: 0.7rem; font-weight: bold; margin-left: 5px;">OWNER</span>'
                    : '<span style="background: #e2e8f0; color: #4a5568; padding: 2px 6px; border-radius: 4px; font-size: 0.7rem; font-weight: bold; margin-left: 5px;">ADMIN</span>';

                const div = document.createElement('div');
                div.className = 'admin-list-item';

                let buttons = `<button class="btn-primary" style="padding: 5px 10px; font-size: 0.8rem; margin-right: 5px;" onclick='showCredentials(${JSON.stringify(admin)})'>Show / Actions</button>`;

                div.innerHTML = `
                    <div>
                        <div style="font-weight: 600; color: #2d3748;">
                            ${statusDot} ${admin.name} ${badge}
                        </div>
                        <div style="font-size: 0.85rem; color: #718096; padding-left: 20px;">${admin.email}</div>
                    </div>
                    <div>${buttons}</div>
                `;
                container.appendChild(div);
            });
        }

        function showCredentials(admin) {
            document.getElementById('modalName').textContent = admin.name;
            document.getElementById('modalEmail').textContent = admin.email;
            document.getElementById('modalPassword').textContent = admin.password;

            const isOwner = admin.role === 'Owner';
            const isMe = admin.email === currentUser.email;
            const canRemove = currentUser.role === 'Owner' || (isMe && !isOwner);

            let actionButtons = '';

            if (currentUser.role === 'Owner' && !isOwner) {
                actionButtons += `<button class="btn-primary" style="background-color: #805ad5; padding: 5px 10px; font-size: 0.8rem; margin-right: 5px;" onclick="closeModal(); transferOwnership('${admin.email}')">Transfer Ownership</button>`;
            }
            if (!isOwner && canRemove) {
                actionButtons += `<button class="btn-danger" style="padding: 5px 10px; font-size: 0.8rem; margin-right: 5px;" onclick="closeModal(); deleteAdmin('${admin.email}')">Remove</button>`;
            }

            document.getElementById('modalActionButtons').innerHTML = actionButtons;
            document.getElementById('credModal').style.display = 'flex';
        }

        function closeModal() {
            document.getElementById('credModal').style.display = 'none';
        }

        async function transferOwnership(newOwnerEmail) {
            const confirmMsg = `WARNING: Are you sure you want to transfer ownership to ${newOwnerEmail}?\n\nYou will lose Owner privileges and become a regular Admin. This cannot be undone by you.`;
            if (!confirm(confirmMsg)) return;

            showStatus("Transferring ownership...", "info");
            const res = await sendRequest('transferOwnership', {
                currentOwnerEmail: currentUser.email,
                newOwnerEmail: newOwnerEmail
            });

            if (res.status === 'success') {
                showStatus("Ownership transferred. Reloading...");
                setTimeout(() => {
                    // Update session to reflect new role (Admin)
                    currentUser.role = "Admin";
                    sessionStorage.setItem('crystalAdminUser', JSON.stringify(currentUser));
                    updateSidebarProfile(); // Update badge immediately
                    refreshAdmins();
                }, 1500);
            } else {
                showStatus(res.message, "error");
            }
        }

        async function deleteAdmin(email) {
            if (!confirm('Revoke access for ' + email + '?')) return;
            const res = await sendRequest('removeAdmin', { email });
            if (res.status === 'success') {
                showStatus('Admin removed.');
                refreshAdmins();
            } else {
                showStatus('Failed to remove admin.', 'error');
            }
        }

        document.getElementById('addAdminForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const name = document.getElementById('addName').value;
            const email = document.getElementById('addEmail').value;
            const password = document.getElementById('addPassword').value;

            showStatus('Adding admin...', 'info');
            const res = await sendRequest('addAdmin', { name, email, password });

            if (res.status === 'success') {
                showStatus('Admin added!');
                document.getElementById('addAdminForm').reset();
                refreshAdmins();
            } else {
                showStatus(res.message, 'error');
            }
        });

        // --- WYSIWYG CONTENT EDITOR ---

        let wysiwygUpdates = {}; // Holds text changes reported by the iframe
        let wysiwygStyleUpdates = {}; // Holds style changes

        // Listen for messages from the iframe
        window.addEventListener('message', (event) => {
            const data = event.data;
            if (data.action === 'editModeEnabled') {
                document.getElementById('editStatusBadge').textContent = 'EDITING';
                document.getElementById('editStatusBadge').style.backgroundColor = '#fed7d7'; // Red-ish
                document.getElementById('editStatusBadge').style.color = '#c53030';

                const btn = document.getElementById('toggleEditBtn');
                btn.textContent = 'Disable Editing';
                btn.classList.remove('btn-primary');
                btn.style.backgroundColor = '#718096';

                document.getElementById('saveWysiwygBtn').style.display = 'inline-block';
                document.getElementById('textFormattingToolbar').style.display = 'flex';
                showStatus("Edit mode enabled. Click text to edit.", "info");
            }
            else if (data.action === 'fieldChanged') {
                // We know a field changed, so ensure the save button highlights
                document.getElementById('saveWysiwygBtn').style.transform = 'scale(1.05)';
                setTimeout(() => document.getElementById('saveWysiwygBtn').style.transform = 'scale(1)', 200);
            }
            else if (data.action === 'changesReport') {
                // The iframe sent us the final changes to save
                wysiwygUpdates = data.updates;
                wysiwygStyleUpdates = data.styleUpdates || {};
                executeBatchSave();
            }
            else if (data.action === 'selectionFormatUpdated') {
                updateFormattingToolbar(data.format);
            }
        });

        function execFormatting(command, value) {
            if (!value) return;
            const frameWindow = document.getElementById('wysiwygFrame').contentWindow;
            frameWindow.postMessage({ action: 'formatText', command: command, value: value }, '*');
        }

        function updateFormattingToolbar(format) {
            // Update Bold/Italic/Underline button states
            document.getElementById('btnFormatBold').style.backgroundColor = format.isBold ? '#e2e8f0' : 'white';
            document.getElementById('btnFormatItalic').style.backgroundColor = format.isItalic ? '#e2e8f0' : 'white';
            document.getElementById('btnFormatUnderline').style.backgroundColor = format.isUnderline ? '#e2e8f0' : 'white';

            if (format.fontName) {
                const fontSelect = document.getElementById('fontFamilySelect');
                let matched = false;
                for (let i = 0; i < fontSelect.options.length; i++) {
                    let optVal = fontSelect.options[i].value.toLowerCase();
                    let computedVal = format.fontName.replace(/['"]/g, '').toLowerCase();
                    if (optVal && computedVal.includes(optVal.split(',')[0].trim())) {
                        fontSelect.selectedIndex = i;
                        matched = true;
                        break;
                    }
                }
                if (!matched) fontSelect.selectedIndex = 0;
            }
            if (format.fontSize) {
                const sizeInput = document.getElementById('fontSizeInput');
                const sizeVal = parseInt(format.fontSize, 10);
                if (!isNaN(sizeVal)) {
                    sizeInput.value = sizeVal;
                } else {
                    sizeInput.value = '';
                }
            }
        }

        async function loadContent() {
            const pageSelect = document.getElementById('pageSelector');
            const page = pageSelect.value;

            // Show loading
            document.getElementById('editorLoading').style.display = 'block';
            document.getElementById('editorDefaultMsg').style.display = 'none';
            document.getElementById('editorControls').style.display = 'none';
            document.getElementById('editorFrameContainer').style.display = 'none';

            // We no longer fetch content from GS first. The page loads it itself via cache/frontend logic!
            // We just need to load the iframe.

            let iframeSrc = '';
            if (page === 'home') iframeSrc = 'index.html';
            else iframeSrc = `${page}/index.html`;

            const frame = document.getElementById('wysiwygFrame');

            // Wait for iframe to load
            frame.onload = () => {
                document.getElementById('editorLoading').style.display = 'none';
                document.getElementById('editorControls').style.display = 'flex';
                document.getElementById('editorFrameContainer').style.display = 'block';

                // Reset edit button state
                const btn = document.getElementById('toggleEditBtn');
                btn.textContent = 'Enable Editing';
                btn.classList.add('btn-primary');
                btn.style.backgroundColor = '#3182ce';

                document.getElementById('editStatusBadge').textContent = 'VIEW MODE';
                document.getElementById('editStatusBadge').style.backgroundColor = '#e2e8f0';
                document.getElementById('editStatusBadge').style.color = '#4a5568';
                document.getElementById('saveWysiwygBtn').style.display = 'none';
            };

            // Add a cache buster query param just in case the browser caches the iframe too aggressively during edits
            frame.src = iframeSrc + '?admin=' + new Date().getTime();
        }

        function toggleEditMode() {
            const frameWindow = document.getElementById('wysiwygFrame').contentWindow;
            const btn = document.getElementById('toggleEditBtn');

            if (btn.textContent === 'Enable Editing') {
                frameWindow.postMessage({ action: 'enableEditMode' }, '*');
                // The badge update happens in the message listener
            } else {
                frameWindow.postMessage({ action: 'disableEditMode' }, '*');

                btn.textContent = 'Enable Editing';
                btn.classList.add('btn-primary');
                btn.style.backgroundColor = '#3182ce';

                document.getElementById('editStatusBadge').textContent = 'VIEW MODE';
                document.getElementById('editStatusBadge').style.backgroundColor = '#e2e8f0';
                document.getElementById('editStatusBadge').style.color = '#4a5568';
                document.getElementById('textFormattingToolbar').style.display = 'none';
                // Note: Disabling edit mode does NOT auto-save. They must click Save.
            }
        }

        // Phase 1: Ask iframe for changes
        function requestWysiwygSave() {
            const frameWindow = document.getElementById('wysiwygFrame').contentWindow;
            const btn = document.getElementById('saveWysiwygBtn');
            btn.textContent = "Collecting...";
            btn.disabled = true;

            frameWindow.postMessage({ action: 'requestChanges' }, '*');
        }

        // Phase 2: Actually send to backend (Called by message listener)
        async function executeBatchSave() {
            const page = document.getElementById('pageSelector').value;
            const updates = wysiwygUpdates;
            const styleUpdates = wysiwygStyleUpdates;
            const btn = document.getElementById('saveWysiwygBtn');

            const count = Object.keys(updates).length;
            const styleCount = Object.keys(styleUpdates).length;

            if (count === 0 && styleCount === 0) {
                showStatus("No changes detected.", "info");
                btn.textContent = "💾 Save All Changes";
                btn.disabled = false;
                return;
            }

            showStatus(`Saving changes (${count} text, ${styleCount} style)...`, "info");
            btn.textContent = "Saving...";

            let resContent = { status: 'success' };
            if (count > 0) {
                resContent = await sendRequest('updateContentBatch', { page: page, updates: updates });
            }

            let resStyles = { status: 'success' };
            if (styleCount > 0) {
                resStyles = await sendRequest('updateStylesBatch', { page: page, styleUpdates: styleUpdates });
            }

            if (resContent.status === 'success' && resStyles.status === 'success') {
                showStatus('Success! Saved successfully.', 'success');

                // Update Persistent Client Cache (Instant Loading for Frontend)
                try {
                    const cacheKey = `cms_cache_${page}`;
                    const currentCacheRaw = localStorage.getItem(cacheKey);
                    let currentCache = { content: {}, styles: {} };

                    if (currentCacheRaw) {
                        const parsed = JSON.parse(currentCacheRaw);
                        if (parsed.content || parsed.styles) {
                            currentCache = parsed;
                            if (!currentCache.content) currentCache.content = {};
                            if (!currentCache.styles) currentCache.styles = {};
                        } else {
                            currentCache.content = parsed || {}; // Legacy fallback
                        }
                    }

                    const newCache = {
                        content: { ...currentCache.content, ...updates },
                        styles: { ...currentCache.styles, ...styleUpdates }
                    };
                    localStorage.setItem(cacheKey, JSON.stringify(newCache));
                } catch (e) {
                    console.warn("Admin: Failed to update local cache", e);
                }

                // Turn off edit mode to reflect saved state safely
                toggleEditMode();

            } else {
                showStatus('Save Failed: ' + (res.message || 'Unknown Error'), 'error');
            }

            btn.textContent = "💾 Save All Changes";
            btn.disabled = false;
        }

/* --- Inline script extracted from simulator.html --- */
let currentDevice = 'desktop';
        let isLandscape = false;

        function resize(device) {
            currentDevice = device;
            isLandscape = false; // Reset landscape when changing device
            updateFrame();

            // Update active button state
            document.querySelectorAll('.device-btn').forEach(btn => btn.classList.remove('active'));
            // Find the button that called this function - approximating by text content for simplicity in this generated code context, 
            // or we'd pass 'this' in HTML. Let's use event.target if available.
            if (event && event.target) {
                event.target.classList.add('active');
            }
        }

        function toggleRotate() {
            if (currentDevice === 'desktop') {
                alert("Rotation is only for mobile/tablet devices.");
                return;
            }
            isLandscape = !isLandscape;
            updateFrame();
        }

        function updateFrame() {
            const frame = document.getElementById('frame');

            // Base Class
            if (currentDevice === 'desktop') {
                frame.className = 'desktop-wrapper';
                isLandscape = false; // Reset landscape if switching to desktop
            } else {
                frame.className = currentDevice;
                if (isLandscape) {
                    frame.classList.add('landscape');
                }
            }
        }

/* --- Inline script extracted from villa\index.html --- */
// Simple function to toggle hamburger menu
        function toggleHamburgerMenu(forceState = null) {
            const menu = document.getElementById('hamburgerMenu');
        }

/* --- Inline script extracted from villa\index.html --- */
// Load rates on page load
        window.addEventListener('DOMContentLoaded', function () {
            loadRates();
        });




        function loadRates() {
            const rates = JSON.parse(localStorage.getItem('villa-rates')) || {
                weekly: 1495,
                nightly: 214,
                tax: 9,
                cleaningFee: 75,
                deposit: 250
            };

            if (document.getElementById('weekly-rate-display')) {
                document.getElementById('weekly-rate-display').textContent = '$' + rates.weekly;
                document.getElementById('nightly-rate-display').textContent = '$' + rates.nightly;
                document.getElementById('tax-display').textContent = rates.tax;
                document.getElementById('cleaning-fee-display').textContent = rates.cleaningFee;
                document.getElementById('deposit-display').textContent = rates.deposit;

                document.getElementById('weekly-rate-input').value = rates.weekly;
                document.getElementById('nightly-rate-input').value = rates.nightly;
                document.getElementById('tax-input').value = rates.tax;
                document.getElementById('cleaning-fee-input').value = rates.cleaningFee;
                document.getElementById('deposit-input').value = rates.deposit;
            }
        }
