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
