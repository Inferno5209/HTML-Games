// Load and display all orders
let allOrders = [];
const DISPLAY_URL = 'https://script.google.com/macros/s/AKfycbx40tp9Hy52cUPXMLrAxWyAMWCpbmQm0TEhQSQhQ_Wz0pfdR1RNR5-9Xc8YtYL7vmb7vg/exec';

document.addEventListener('DOMContentLoaded', function() {
    // Check authentication
    const isAuthenticated = sessionStorage.getItem('adminAuthenticated');
    if (!isAuthenticated) {
        window.location.href = 'admin-login.html';
        return;
    }
    
    displayAdminInfo();
    loadOrdersFromSheets();
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

// Load orders from Google Sheets
async function loadOrdersFromSheets() {
    const adminEmail = sessionStorage.getItem('adminEmail');
    
    try {
        showNotification('Loading orders from Google Sheets...');
        
        const response = await fetch(`${DISPLAY_URL}?adminEmail=${encodeURIComponent(adminEmail)}`);
        const data = await response.json();
        
        console.log('Response from Google Sheets:', data);
        
        // Get list of deleted order numbers to filter them out
        const deletedOrders = JSON.parse(localStorage.getItem('munsonDeletedOrders') || '[]');
        console.log('Deleted order codes to filter:', deletedOrders);
        
        if (data.status === 'success' && data.orders && data.orders.length > 0) {
            // Convert sheet format to website format and filter out deleted orders
            allOrders = data.orders
                .filter(order => {
                    const orderNum = order['Order Number'];
                    const isDeleted = deletedOrders.includes(orderNum);
                    if (isDeleted) {
                        console.log('Filtering out deleted order:', orderNum);
                    }
                    return !isDeleted;
                })
                .map(order => {
                    // Parse items string back to object format
                    const itemsObj = parseItemsString(order['Items'] || '');
                    
                    return {
                        orderNumber: order['Order Number'],
                        date: order['Date'],
                        customer: {
                            name: order['Customer Name'],
                            email: order['Customer Email'],
                            phone: order['Customer Phone']
                        },
                        items: itemsObj,
                        total: order['Total Amount'].toString().replace('$', ''),
                        adminAccount: order['Admin Account']
                    };
                });
            
            displayOrders(allOrders);
            updateStats();
            showNotification('Orders loaded successfully from Google Sheets!');
        } else {
            console.log('No orders found in Google Sheets, checking localStorage...');
            // No orders in Google Sheets, load from localStorage
            loadOrdersFromLocalStorage();
        }
    } catch (error) {
        console.error('Error loading orders from Google Sheets:', error);
        showNotification('Loading from local storage...');
        // Fall back to localStorage
        loadOrdersFromLocalStorage();
    }
}

// Helper function to parse items string from Google Sheets
function parseItemsString(itemsStr) {
    const items = {};
    
    if (!itemsStr) return items;
    
    // Parse format like: "Milk Chocolate Bar (x2 @ $1.75); Peanut Butter Cups (x1 @ $7.49); "
    const itemParts = itemsStr.split(';').filter(part => part.trim());
    
    itemParts.forEach((part, index) => {
        const match = part.match(/(.+?)\s*\(x(\d+)\s*@\s*\$([\d.]+)\)/);
        if (match) {
            const [, name, quantity, price] = match;
            items[index + 1] = {
                name: name.trim(),
                quantity: parseInt(quantity),
                price: parseFloat(price)
            };
        }
    });
    
    return items;
}

// Load orders from localStorage (backup method)
function loadOrdersFromLocalStorage() {
    const adminEmail = sessionStorage.getItem('adminEmail');
    const ordersData = localStorage.getItem('munsonOrders');
    const allOrdersStored = ordersData ? JSON.parse(ordersData) : [];
    
    // Get list of deleted order numbers to filter them out
    const deletedOrders = JSON.parse(localStorage.getItem('munsonDeletedOrders') || '[]');
    
    // Filter orders for this admin account only and exclude deleted orders
    allOrders = allOrdersStored.filter(order => 
        order.adminAccount === adminEmail && 
        !deletedOrders.includes(order.orderNumber)
    );
    
    console.log('Loaded from localStorage, filtered out deleted orders');
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
        loadOrdersFromSheets();
    });
    
    // Export to CSV
    document.getElementById('export-orders').addEventListener('click', () => {
        exportToCSV();
    });
    
    // Clear all orders
    document.getElementById('clear-orders').addEventListener('click', async () => {
        if (confirm('Are you sure you want to delete ALL orders? This cannot be undone!')) {
            const adminEmail = sessionStorage.getItem('adminEmail');
            const COLLECTION_URL = 'https://script.google.com/macros/s/AKfycbw5I57_AtHgvv84sin8EnX8ogN5EWC0NZO_8xYQ7UEql26f9lwbMoq-AX1Oxm_EKeDKlA/exec';
            
            try {
                showNotification('Deleting orders...');
                
                // Track deleted order numbers so they don't reappear
                const deletedOrders = JSON.parse(localStorage.getItem('munsonDeletedOrders') || '[]');
                allOrders.forEach(order => {
                    if (!deletedOrders.includes(order.orderNumber)) {
                        deletedOrders.push(order.orderNumber);
                    }
                });
                localStorage.setItem('munsonDeletedOrders', JSON.stringify(deletedOrders));
                console.log('Marked orders as deleted:', allOrders.map(o => o.orderNumber));
                
                // Clear from localStorage
                const ordersData = localStorage.getItem('munsonOrders');
                const allOrdersStored = ordersData ? JSON.parse(ordersData) : [];
                const remainingOrders = allOrdersStored.filter(order => order.adminAccount !== adminEmail);
                localStorage.setItem('munsonOrders', JSON.stringify(remainingOrders));
                
                // Delete from Google Sheets
                await fetch(COLLECTION_URL, {
                    method: 'POST',
                    mode: 'no-cors',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        action: 'deleteAllOrders',
                        adminEmail: adminEmail
                    })
                });
                
                // Clear display immediately
                allOrders = [];
                displayOrders(allOrders);
                updateStats();
                showNotification('All orders cleared successfully!');
                
            } catch (error) {
                console.error('Error clearing orders:', error);
                // Still clear the display and localStorage even if Google Sheets fails
                allOrders = [];
                displayOrders(allOrders);
                updateStats();
                showNotification('Orders cleared locally. Google Sheets may need manual cleanup.');
            }
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