// Load and display all orders
let allOrders = [];

document.addEventListener('DOMContentLoaded', function() {
    // Check authentication
    const isAuthenticated = sessionStorage.getItem('adminAuthenticated');
    if (!isAuthenticated) {
        window.location.href = 'admin-login.html';
        return;
    }
    
    displayAdminInfo();
    loadOrders();
    setupControls();
    setupSearch();
});

// Display admin info
function displayAdminInfo() {
    const email = sessionStorage.getItem('adminEmail');
    
    if (email) {
        const header = document.querySelector('header .container');
        const infoDiv = document.createElement('div');
        infoDiv.className = 'admin-credentials';
        infoDiv.innerHTML = `
            <p><strong>Logged in as:</strong> ${email}</p>
            <button id="logout-btn" class="btn-secondary" style="margin-top: 10px; padding: 8px 20px;">Logout</button>
        `;
        header.appendChild(infoDiv);
        
        // Setup logout
        document.getElementById('logout-btn').addEventListener('click', () => {
            sessionStorage.removeItem('adminAuthenticated');
            sessionStorage.removeItem('adminEmail');
            window.location.href = 'admin-login.html';
        });
    }
}

// Load orders from localStorage
function loadOrders() {
    const ordersData = localStorage.getItem('munsonOrders');
    allOrders = ordersData ? JSON.parse(ordersData) : [];
    displayOrders(allOrders);
    updateStats();
}

// Display orders in the list
function displayOrders(orders) {
    const ordersList = document.getElementById('orders-list');
    
    if (orders.length === 0) {
        ordersList.innerHTML = '<p class="no-orders">No orders found.</p>';
        return;
    }
    
    ordersList.innerHTML = '';
    
    // Sort orders by date (newest first)
    orders.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    orders.forEach(order => {
        const orderCard = document.createElement('div');
        orderCard.className = 'order-card';
        
        // Calculate total items
        let totalItems = 0;
        for (let itemId in order.items) {
            totalItems += order.items[itemId].quantity;
        }
        
        // Build items list
        let itemsHTML = '';
        for (let itemId in order.items) {
            const item = order.items[itemId];
            itemsHTML += `
                <div class="order-item-detail">
                    <span class="item-name">${item.name}</span>
                    <span class="item-qty">x${item.quantity}</span>
                    <span class="item-price">$${(item.price * item.quantity).toFixed(2)}</span>
                </div>
            `;
        }
        
        orderCard.innerHTML = `
            <div class="order-header">
                <div class="order-info">
                    <h3>Order #${order.orderNumber}</h3>
                    <p class="order-date">${order.date}</p>
                </div>
                <div class="order-total">
                    <span class="total-label">Total:</span>
                    <span class="total-amount">$${order.total}</span>
                </div>
            </div>
            
            <div class="order-customer">
                <h4>Customer Information</h4>
                <p><strong>Name:</strong> ${order.customer.name}</p>
                <p><strong>Email:</strong> <a href="mailto:${order.customer.email}">${order.customer.email}</a></p>
                <p><strong>Phone:</strong> <a href="tel:${order.customer.phone}">${order.customer.phone}</a></p>
            </div>
            
            <div class="order-items">
                <h4>Items (${totalItems} total)</h4>
                ${itemsHTML}
            </div>
        `;
        
        ordersList.appendChild(orderCard);
    });
}

// Update statistics
function updateStats() {
    const totalOrders = allOrders.length;
    let totalRevenue = 0;
    let totalItems = 0;
    
    allOrders.forEach(order => {
        totalRevenue += parseFloat(order.total);
        for (let itemId in order.items) {
            totalItems += order.items[itemId].quantity;
        }
    });
    
    document.getElementById('total-orders').textContent = totalOrders;
    document.getElementById('total-revenue').textContent = `$${totalRevenue.toFixed(2)}`;
    document.getElementById('total-items').textContent = totalItems;
}

// Setup control buttons
function setupControls() {
    // Back to shop
    document.getElementById('back-to-shop').addEventListener('click', () => {
        window.location.href = 'index.html';
    });
    
    // Refresh orders
    document.getElementById('refresh-orders').addEventListener('click', () => {
        loadOrders();
        showNotification('Orders refreshed!');
    });
    
    // Export to CSV
    document.getElementById('export-orders').addEventListener('click', () => {
        exportToCSV();
    });
    
    // Clear all orders
    document.getElementById('clear-orders').addEventListener('click', () => {
        if (confirm('Are you sure you want to delete ALL orders? This cannot be undone!')) {
            localStorage.removeItem('munsonOrders');
            allOrders = [];
            displayOrders(allOrders);
            updateStats();
            showNotification('All orders cleared!');
        }
    });
}

// Setup search functionality
function setupSearch() {
    const searchInput = document.getElementById('search-orders');
    
    searchInput.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        
        if (searchTerm === '') {
            displayOrders(allOrders);
            return;
        }
        
        const filteredOrders = allOrders.filter(order => {
            return order.orderNumber.toLowerCase().includes(searchTerm) ||
                   order.customer.name.toLowerCase().includes(searchTerm) ||
                   order.customer.email.toLowerCase().includes(searchTerm) ||
                   order.customer.phone.includes(searchTerm);
        });
        
        displayOrders(filteredOrders);
    });
}

// Export orders to CSV
function exportToCSV() {
    if (allOrders.length === 0) {
        alert('No orders to export!');
        return;
    }
    
    let csv = 'Order Number,Date,Customer Name,Email,Phone,Total,Items\n';
    
    allOrders.forEach(order => {
        // Build items list
        let itemsList = '';
        for (let itemId in order.items) {
            const item = order.items[itemId];
            itemsList += `${item.name} (x${item.quantity}); `;
        }
        
        // Escape commas and quotes in fields
        const escapeCSV = (str) => {
            if (str.includes(',') || str.includes('"') || str.includes('\n')) {
                return `"${str.replace(/"/g, '""')}"`;
            }
            return str;
        };
        
        csv += `${order.orderNumber},`;
        csv += `${order.date},`;
        csv += `${escapeCSV(order.customer.name)},`;
        csv += `${order.customer.email},`;
        csv += `${order.customer.phone},`;
        csv += `$${order.total},`;
        csv += `${escapeCSV(itemsList)}\n`;
    });
    
    // Create download link
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `munson-orders-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    
    showNotification('Orders exported successfully!');
}

// Show notification
function showNotification(message) {
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.classList.add('show');
    }, 10);
    
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 2000);
}