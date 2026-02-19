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

const CMS_URL = "https://script.google.com/macros/s/AKfycbyVrdeSdng-G-07-qvFwZ-la1P8S5p5P2iOZYdtyiELgmreMqNGf-aq3xWAezjRanU/exec";

async function loadSiteContent(pageName) {
    console.log(`CMS: Loading content for ${pageName}...`);
    const cacheKey = `cms_cache_${pageName}`;

    // 1. Try Local Cache First (Instant)
    try {
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
            console.log("CMS: Loaded from cache");
            applyContent(JSON.parse(cached));
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
            const pageContent = result.data;
            if (pageContent) {
                // 3. Update DOM with fresh data
                applyContent(pageContent);
                // 4. Update Cache
                localStorage.setItem(cacheKey, JSON.stringify(pageContent));
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
            if (element.innerText !== text) {
                element.innerText = text;
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
