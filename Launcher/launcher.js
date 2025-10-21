// Website Launcher - Advanced Version
class LauncherApp {
    constructor() {
        this.websites = [];
        this.filteredWebsites = [];
        this.currentCategory = 'all';
        this.settings = {
            openInNewTab: true,
            showAnimations: true,
            showStats: true,
            gridColumns: 4,
            theme: 'dark'
        };
        this.contextMenuTarget = null;
        
        this.init();
    }
    
    init() {
        this.loadData();
        this.loadSettings();
        this.initDefaultWebsites();
        this.setupEventListeners();
        this.render();
        this.updateStats();
        this.applySettings();
    }
    
    // Load data from localStorage
    loadData() {
        const saved = localStorage.getItem('launcherWebsites');
        if (saved) {
            this.websites = JSON.parse(saved);
        }
    }
    
    // Save data to localStorage
    saveData() {
        localStorage.setItem('launcherWebsites', JSON.stringify(this.websites));
    }
    
    // Load settings from localStorage
    loadSettings() {
        const saved = localStorage.getItem('launcherSettings');
        if (saved) {
            this.settings = { ...this.settings, ...JSON.parse(saved) };
        }
    }
    
    // Save settings to localStorage
    saveSettings() {
        localStorage.setItem('launcherSettings', JSON.stringify(this.settings));
    }
    
    // Initialize default websites
    initDefaultWebsites() {
        if (this.websites.length === 0) {
            this.websites = [
                {
                    id: this.generateId(),
                    name: 'Checkers',
                    url: 'uploaded/Checkers/index.html',
                    category: 'games',
                    icon: '🎯',
                    description: 'Classic checkers game with AI opponent',
                    launches: 0,
                    favorite: false,
                    dateAdded: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: 'Connect 4',
                    url: 'uploaded/Connect 4/C4.html',
                    category: 'games',
                    icon: '🔴',
                    description: 'Connect four in a row to win',
                    launches: 0,
                    favorite: false,
                    dateAdded: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    name: 'Ultimate Tic Tac Toe',
                    url: 'uploaded/Ultimate Tic Tac Toe/index.html',
                    category: 'games',
                    icon: '❌',
                    description: 'Advanced version of classic tic-tac-toe',
                    launches: 0,
                    favorite: false,
                    dateAdded: new Date().toISOString()
                }
            ];
            this.saveData();
        }
    }
    
    // Generate unique ID
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }
    
    // Setup event listeners
    setupEventListeners() {
        // Search
        const searchInput = document.getElementById('searchInput');
        const clearSearch = document.getElementById('clearSearch');
        
        searchInput.addEventListener('input', (e) => {
            this.handleSearch(e.target.value);
            clearSearch.classList.toggle('visible', e.target.value.length > 0);
        });
        
        clearSearch.addEventListener('click', () => {
            searchInput.value = '';
            this.handleSearch('');
            clearSearch.classList.remove('visible');
        });
        
        // Category filter
        document.querySelectorAll('.category-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.category-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.currentCategory = e.target.dataset.category;
                this.render();
            });
        });
        
        // Theme toggle
        document.getElementById('themeToggle').addEventListener('click', () => {
            this.toggleTheme();
        });
        
        // Add website
        document.getElementById('addWebsiteBtn').addEventListener('click', () => {
            this.openAddModal();
        });
        
        document.getElementById('closeAddModal').addEventListener('click', () => {
            this.closeAddModal();
        });
        
        document.getElementById('cancelAddBtn').addEventListener('click', () => {
            this.closeAddModal();
        });
        
        document.getElementById('addWebsiteForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.addWebsite();
        });
        
        // Settings
        document.getElementById('settingsBtn').addEventListener('click', () => {
            this.openSettingsModal();
        });
        
        document.getElementById('closeSettingsModal').addEventListener('click', () => {
            this.closeSettingsModal();
        });
        
        document.getElementById('openInNewTab').addEventListener('change', (e) => {
            this.settings.openInNewTab = e.target.checked;
            this.saveSettings();
        });
        
        document.getElementById('showAnimations').addEventListener('change', (e) => {
            this.settings.showAnimations = e.target.checked;
            this.saveSettings();
            this.applySettings();
        });
        
        document.getElementById('showStats').addEventListener('change', (e) => {
            this.settings.showStats = e.target.checked;
            this.saveSettings();
            this.applySettings();
        });
        
        document.getElementById('gridColumns').addEventListener('input', (e) => {
            this.settings.gridColumns = parseInt(e.target.value);
            document.getElementById('gridColumnsValue').textContent = e.target.value;
            document.documentElement.style.setProperty('--grid-columns', e.target.value);
            this.saveSettings();
        });
        
        document.getElementById('clearDataBtn').addEventListener('click', () => {
            if (confirm('Are you sure you want to clear all data? This cannot be undone.')) {
                this.clearAllData();
            }
        });
        
        document.getElementById('exportDataBtn').addEventListener('click', () => {
            this.exportData();
        });
        
        document.getElementById('importDataBtn').addEventListener('click', () => {
            document.getElementById('importFileInput').click();
        });
        
        document.getElementById('importFileInput').addEventListener('change', (e) => {
            this.importData(e.target.files[0]);
        });
        
        // Context menu
        document.getElementById('contextEdit').addEventListener('click', () => {
            this.editWebsite(this.contextMenuTarget);
            this.hideContextMenu();
        });
        
        document.getElementById('contextFavorite').addEventListener('click', () => {
            this.toggleFavorite(this.contextMenuTarget);
            this.hideContextMenu();
        });
        
        document.getElementById('contextDelete').addEventListener('click', () => {
            this.deleteWebsite(this.contextMenuTarget);
            this.hideContextMenu();
        });
        
        // Close context menu on outside click
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.context-menu') && !e.target.closest('.launcher-item')) {
                this.hideContextMenu();
            }
        });
        
        // Close modals on outside click
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.classList.remove('active');
                }
            });
        });
    }
    
    // Handle search
    handleSearch(query) {
        if (!query) {
            this.render();
            return;
        }
        
        query = query.toLowerCase();
        this.filteredWebsites = this.websites.filter(site => 
            site.name.toLowerCase().includes(query) ||
            site.description.toLowerCase().includes(query) ||
            site.category.toLowerCase().includes(query)
        );
        
        this.renderFiltered();
    }
    
    // Render websites
    render() {
        const grid = document.getElementById('launcherGrid');
        let sites = this.websites;
        
        // Filter by category
        if (this.currentCategory === 'favorites') {
            sites = sites.filter(site => site.favorite);
        } else if (this.currentCategory !== 'all') {
            sites = sites.filter(site => site.category === this.currentCategory);
        }
        
        // Sort by launches
        sites = [...sites].sort((a, b) => b.launches - a.launches);
        
        if (sites.length === 0) {
            grid.innerHTML = this.getEmptyState();
            return;
        }
        
        grid.innerHTML = sites.map(site => this.createWebsiteCard(site)).join('');
        this.attachCardListeners();
    }
    
    // Render filtered results
    renderFiltered() {
        const grid = document.getElementById('launcherGrid');
        
        if (this.filteredWebsites.length === 0) {
            grid.innerHTML = this.getEmptyState('No websites found matching your search.');
            return;
        }
        
        grid.innerHTML = this.filteredWebsites.map(site => this.createWebsiteCard(site)).join('');
        this.attachCardListeners();
    }
    
    // Create website card HTML
    createWebsiteCard(site) {
        const iconHtml = site.icon.startsWith('http') 
            ? `<img src="${site.icon}" alt="${site.name}">`
            : site.icon;
        
        return `
            <div class="launcher-item" data-id="${site.id}">
                <div class="item-header">
                    <div class="item-icon">${iconHtml}</div>
                    <button class="favorite-btn ${site.favorite ? 'active' : ''}" data-id="${site.id}">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="${site.favorite ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2">
                            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                        </svg>
                    </button>
                </div>
                <div class="item-title">${site.name}</div>
                <div class="item-description">${site.description}</div>
                <div class="item-footer">
                    <span class="item-category">${site.category}</span>
                    <span class="item-launches">🚀 ${site.launches}</span>
                </div>
            </div>
        `;
    }
    
    // Get empty state HTML
    getEmptyState(message = 'No websites found. Add some to get started!') {
        return `
            <div class="empty-state">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="11" cy="11" r="8"></circle>
                    <path d="m21 21-4.35-4.35"></path>
                </svg>
                <h3>Nothing Here</h3>
                <p>${message}</p>
            </div>
        `;
    }
    
    // Attach listeners to cards
    attachCardListeners() {
        // Launch website
        document.querySelectorAll('.launcher-item').forEach(item => {
            item.addEventListener('click', (e) => {
                if (!e.target.closest('.favorite-btn')) {
                    this.launchWebsite(item.dataset.id);
                }
            });
            
            // Context menu
            item.addEventListener('contextmenu', (e) => {
                e.preventDefault();
                this.showContextMenu(e, item.dataset.id);
            });
        });
        
        // Favorite button
        document.querySelectorAll('.favorite-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggleFavorite(btn.dataset.id);
            });
        });
    }
    
    // Launch website
    launchWebsite(id) {
        const site = this.websites.find(s => s.id === id);
        if (!site) return;
        
        // Increment launch count
        site.launches++;
        this.saveData();
        this.updateStats();
        
        // Open URL
        if (this.settings.openInNewTab) {
            window.open(site.url, '_blank');
        } else {
            window.location.href = site.url;
        }
        
        this.showToast(`Launching ${site.name}...`);
    }
    
    // Toggle favorite
    toggleFavorite(id) {
        const site = this.websites.find(s => s.id === id);
        if (!site) return;
        
        site.favorite = !site.favorite;
        this.saveData();
        this.render();
        this.updateStats();
        
        this.showToast(site.favorite ? 'Added to favorites' : 'Removed from favorites');
    }
    
    // Add website
    addWebsite() {
        const name = document.getElementById('websiteName').value;
        const url = document.getElementById('websiteUrl').value;
        const category = document.getElementById('websiteCategory').value;
        const icon = document.getElementById('websiteIcon').value || '🌐';
        const description = document.getElementById('websiteDescription').value || 'No description provided';
        
        const newSite = {
            id: this.generateId(),
            name,
            url,
            category,
            icon,
            description,
            launches: 0,
            favorite: false,
            dateAdded: new Date().toISOString()
        };
        
        this.websites.push(newSite);
        this.saveData();
        this.render();
        this.updateStats();
        this.closeAddModal();
        
        this.showToast(`${name} added successfully!`);
        
        // Reset form
        document.getElementById('addWebsiteForm').reset();
    }
    
    // Edit website
    editWebsite(id) {
        const site = this.websites.find(s => s.id === id);
        if (!site) return;
        
        document.getElementById('websiteName').value = site.name;
        document.getElementById('websiteUrl').value = site.url;
        document.getElementById('websiteCategory').value = site.category;
        document.getElementById('websiteIcon').value = site.icon;
        document.getElementById('websiteDescription').value = site.description;
        
        this.openAddModal();
        
        // Change form submit to update
        const form = document.getElementById('addWebsiteForm');
        form.onsubmit = (e) => {
            e.preventDefault();
            
            site.name = document.getElementById('websiteName').value;
            site.url = document.getElementById('websiteUrl').value;
            site.category = document.getElementById('websiteCategory').value;
            site.icon = document.getElementById('websiteIcon').value || '🌐';
            site.description = document.getElementById('websiteDescription').value || 'No description provided';
            
            this.saveData();
            this.render();
            this.closeAddModal();
            
            this.showToast(`${site.name} updated successfully!`);
            
            // Reset form submit
            form.onsubmit = (e) => {
                e.preventDefault();
                this.addWebsite();
            };
            
            form.reset();
        };
    }
    
    // Delete website
    deleteWebsite(id) {
        const site = this.websites.find(s => s.id === id);
        if (!site) return;
        
        if (confirm(`Are you sure you want to delete ${site.name}?`)) {
            this.websites = this.websites.filter(s => s.id !== id);
            this.saveData();
            this.render();
            this.updateStats();
            
            this.showToast(`${site.name} deleted`);
        }
    }
    
    // Update statistics
    updateStats() {
        document.getElementById('totalSites').textContent = this.websites.length;
        document.getElementById('totalFavorites').textContent = this.websites.filter(s => s.favorite).length;
        
        const mostLaunched = [...this.websites].sort((a, b) => b.launches - a.launches)[0];
        document.getElementById('mostLaunched').textContent = mostLaunched ? mostLaunched.name : '-';
    }
    
    // Show context menu
    showContextMenu(e, id) {
        const menu = document.getElementById('contextMenu');
        this.contextMenuTarget = id;
        
        menu.style.left = e.pageX + 'px';
        menu.style.top = e.pageY + 'px';
        menu.classList.add('active');
    }
    
    // Hide context menu
    hideContextMenu() {
        document.getElementById('contextMenu').classList.remove('active');
    }
    
    // Open add modal
    openAddModal() {
        document.getElementById('addModal').classList.add('active');
    }
    
    // Close add modal
    closeAddModal() {
        document.getElementById('addModal').classList.remove('active');
        document.getElementById('addWebsiteForm').reset();
    }
    
    // Open settings modal
    openSettingsModal() {
        document.getElementById('settingsModal').classList.add('active');
        document.getElementById('openInNewTab').checked = this.settings.openInNewTab;
        document.getElementById('showAnimations').checked = this.settings.showAnimations;
        document.getElementById('showStats').checked = this.settings.showStats;
        document.getElementById('gridColumns').value = this.settings.gridColumns;
        document.getElementById('gridColumnsValue').textContent = this.settings.gridColumns;
    }
    
    // Close settings modal
    closeSettingsModal() {
        document.getElementById('settingsModal').classList.remove('active');
    }
    
    // Toggle theme
    toggleTheme() {
        this.settings.theme = this.settings.theme === 'dark' ? 'light' : 'dark';
        document.body.classList.toggle('light-theme', this.settings.theme === 'light');
        this.saveSettings();
        
        this.showToast(`${this.settings.theme === 'dark' ? 'Dark' : 'Light'} theme activated`);
    }
    
    // Apply settings
    applySettings() {
        document.body.classList.toggle('light-theme', this.settings.theme === 'light');
        document.body.classList.toggle('no-animations', !this.settings.showAnimations);
        document.querySelector('.stats-bar').style.display = this.settings.showStats ? 'flex' : 'none';
        document.documentElement.style.setProperty('--grid-columns', this.settings.gridColumns);
    }
    
    // Clear all data
    clearAllData() {
        localStorage.removeItem('launcherWebsites');
        this.websites = [];
        this.initDefaultWebsites();
        this.render();
        this.updateStats();
        this.closeSettingsModal();
        
        this.showToast('All data cleared and reset to defaults');
    }
    
    // Export data
    exportData() {
        const data = {
            websites: this.websites,
            settings: this.settings,
            exportDate: new Date().toISOString()
        };
        
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `launcher-data-${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
        
        this.showToast('Data exported successfully');
    }
    
    // Import data
    importData(file) {
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);
                
                if (data.websites && Array.isArray(data.websites)) {
                    this.websites = data.websites;
                    this.saveData();
                }
                
                if (data.settings) {
                    this.settings = { ...this.settings, ...data.settings };
                    this.saveSettings();
                    this.applySettings();
                }
                
                this.render();
                this.updateStats();
                this.closeSettingsModal();
                
                this.showToast('Data imported successfully');
            } catch (error) {
                this.showToast('Error importing data: Invalid file format');
                console.error('Import error:', error);
            }
        };
        reader.readAsText(file);
    }
    
    // Show toast notification
    showToast(message) {
        const toast = document.getElementById('toast');
        toast.textContent = message;
        toast.classList.add('show');
        
        setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new LauncherApp();
});
