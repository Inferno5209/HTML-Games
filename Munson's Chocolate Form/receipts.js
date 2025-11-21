// Load receipts on page load
document.addEventListener('DOMContentLoaded', function() {
    loadReceipts();
    setupSearch();
    setupFilters();
    setupAdminButton();
    setupModalHandlers();
});

// Setup admin button
function setupAdminButton() {
    const adminBtn = document.getElementById('admin-btn');
    if (adminBtn) {
        adminBtn.addEventListener('click', () => {
            window.location.href = 'admin-login.html';
        });
    }
}

// Load and display all receipts
function loadReceipts(filterType = 'all', searchTerm = '') {
    const receiptsList = document.getElementById('receipts-list');
    const noReceipts = document.getElementById('no-receipts');
    
    // Get orders from localStorage
    let orders = JSON.parse(localStorage.getItem('munsonOrders') || '[]');
    
    // Filter orders by date
    orders = filterOrdersByDate(orders, filterType);
    
    // Filter orders by search term
    if (searchTerm) {
        orders = filterOrdersBySearch(orders, searchTerm);
    }
    
    // Sort by date (newest first)
    orders.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    // Display receipts
    if (orders.length === 0) {
        receiptsList.style.display = 'none';
        noReceipts.style.display = 'block';
    } else {
        receiptsList.style.display = 'block';
        noReceipts.style.display = 'none';
        receiptsList.innerHTML = '';
        
        orders.forEach(order => {
            const receiptCard = createReceiptCard(order);
            receiptsList.appendChild(receiptCard);
        });
    }
}

// Create receipt card element
function createReceiptCard(order) {
    const card = document.createElement('div');
    card.className = 'receipt-card';
    
    const itemCount = Object.keys(order.items).length;
    const itemText = itemCount === 1 ? 'item' : 'items';
    
    card.innerHTML = `
        <div class="receipt-card-header">
            <div>
                <h3>Order #${order.orderNumber}</h3>
                <p class="receipt-date">${order.date}</p>
            </div>
            <div class="receipt-total">$${parseFloat(order.total).toFixed(2)}</div>
        </div>
        <div class="receipt-card-body">
            <p><strong>Customer:</strong> ${order.customer.name}</p>
            <p><strong>Email:</strong> ${order.customer.email}</p>
            <p><strong>Phone:</strong> ${order.customer.phone}</p>
            <p class="receipt-items-count">${itemCount} ${itemText}</p>
        </div>
        <div class="receipt-card-footer">
            <button class="btn-primary view-receipt-btn" data-order='${JSON.stringify(order).replace(/'/g, "&apos;")}'>View Full Receipt</button>
        </div>
    `;
    
    // Add click handler to view button
    const viewBtn = card.querySelector('.view-receipt-btn');
    viewBtn.addEventListener('click', function() {
        const orderData = JSON.parse(this.getAttribute('data-order'));
        showReceiptDetail(orderData);
    });
    
    return card;
}

// Show detailed receipt in modal
function showReceiptDetail(order) {
    const modal = document.getElementById('receipt-modal');
    const detailDiv = document.getElementById('receipt-detail');
    
    let itemsHtml = '';
    for (let itemId in order.items) {
        const item = order.items[itemId];
        const itemTotal = item.price * item.quantity;
        itemsHtml += `
            <tr>
                <td>${item.name}</td>
                <td class="text-center">${item.quantity}</td>
                <td class="text-right">$${item.price.toFixed(2)}</td>
                <td class="text-right">$${itemTotal.toFixed(2)}</td>
            </tr>
        `;
    }
    
    detailDiv.innerHTML = `
        <div class="receipt-header">
            <h2>Munson's Chocolate</h2>
            <h3>Order Receipt</h3>
        </div>
        <div class="receipt-info">
            <div class="receipt-info-row">
                <strong>Order Number:</strong> ${order.orderNumber}
            </div>
            <div class="receipt-info-row">
                <strong>Date:</strong> ${order.date}
            </div>
        </div>
        <div class="receipt-customer">
            <h4>Customer Information</h4>
            <p><strong>Name:</strong> ${order.customer.name}</p>
            <p><strong>Email:</strong> ${order.customer.email}</p>
            <p><strong>Phone:</strong> ${order.customer.phone}</p>
        </div>
        <div class="receipt-items">
            <h4>Order Items</h4>
            <table class="receipt-table">
                <thead>
                    <tr>
                        <th>Item</th>
                        <th class="text-center">Quantity</th>
                        <th class="text-right">Price</th>
                        <th class="text-right">Total</th>
                    </tr>
                </thead>
                <tbody>
                    ${itemsHtml}
                </tbody>
                <tfoot>
                    <tr>
                        <td colspan="3" class="text-right"><strong>Total:</strong></td>
                        <td class="text-right"><strong>$${parseFloat(order.total).toFixed(2)}</strong></td>
                    </tr>
                </tfoot>
            </table>
        </div>
    `;
    
    modal.classList.add('show');
}

// Filter orders by date
function filterOrdersByDate(orders, filterType) {
    if (filterType === 'all') return orders;
    
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    return orders.filter(order => {
        const orderDate = new Date(order.date);
        
        switch(filterType) {
            case 'today':
                return orderDate >= today;
            case 'week':
                const weekAgo = new Date(today);
                weekAgo.setDate(weekAgo.getDate() - 7);
                return orderDate >= weekAgo;
            case 'month':
                const monthAgo = new Date(today);
                monthAgo.setMonth(monthAgo.getMonth() - 1);
                return orderDate >= monthAgo;
            default:
                return true;
        }
    });
}

// Filter orders by search term
function filterOrdersBySearch(orders, searchTerm) {
    const term = searchTerm.toLowerCase();
    return orders.filter(order => {
        return order.orderNumber.toLowerCase().includes(term) ||
               order.customer.name.toLowerCase().includes(term) ||
               order.customer.email.toLowerCase().includes(term) ||
               order.customer.phone.includes(term);
    });
}

// Setup search functionality
function setupSearch() {
    const searchInput = document.getElementById('search-input');
    const searchBtn = document.getElementById('search-btn');
    
    searchBtn.addEventListener('click', performSearch);
    searchInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            performSearch();
        }
    });
}

function performSearch() {
    const searchTerm = document.getElementById('search-input').value;
    const filterType = document.querySelector('input[name="date-filter"]:checked').value;
    loadReceipts(filterType, searchTerm);
}

// Setup date filters
function setupFilters() {
    const filterRadios = document.querySelectorAll('input[name="date-filter"]');
    filterRadios.forEach(radio => {
        radio.addEventListener('change', function() {
            const searchTerm = document.getElementById('search-input').value;
            loadReceipts(this.value, searchTerm);
        });
    });
}

// Setup modal handlers
function setupModalHandlers() {
    const modal = document.getElementById('receipt-modal');
    const closeBtn = document.querySelector('.close-modal-btn');
    const closeModalBtn = document.getElementById('close-receipt-modal');
    const printBtn = document.getElementById('print-receipt');
    
    closeBtn.addEventListener('click', () => {
        modal.classList.remove('show');
    });
    
    closeModalBtn.addEventListener('click', () => {
        modal.classList.remove('show');
    });
    
    printBtn.addEventListener('click', () => {
        window.print();
    });
    
    // Close modal when clicking outside
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            modal.classList.remove('show');
        }
    });
}
