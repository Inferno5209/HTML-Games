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
