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
    }
});
