// Load and display order summary
document.addEventListener('DOMContentLoaded', function() {
    loadOrderSummary();
    setupCheckoutForm();
    setupBackButton();
    setupAdminButton();
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

// Load and display order summary
function loadOrderSummary() {
    const savedCart = localStorage.getItem('munsonCart');
    
    if (!savedCart || savedCart === '{}') {
        alert('Your cart is empty.');
        window.location.href = 'index.html';
        return;
    }
    
    const cart = JSON.parse(savedCart);
    const orderItemsDiv = document.getElementById('order-items');
    let totalPrice = 0;
    
    // Display each item
    for (let itemId in cart) {
        const item = cart[itemId];
        const itemTotal = item.price * item.quantity;
        totalPrice += itemTotal;
        
        const orderItem = document.createElement('div');
        orderItem.className = 'order-item';
        orderItem.innerHTML = `
            <div>
                <div class="item-name">${item.name}</div>
                <div class="item-quantity">Quantity: ${item.quantity}</div>
            </div>
            <div class="item-price">$${itemTotal.toFixed(2)}</div>
        `;
        orderItemsDiv.appendChild(orderItem);
    }
    
    // Update total
    document.getElementById('final-total').textContent = totalPrice.toFixed(2);
}

// Setup checkout form submission
function setupCheckoutForm() {
    const form = document.getElementById('checkout-form');
    
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // Get form data
        const formData = new FormData(form);
        const customerInfo = {
            name: formData.get('customerName'),
            email: formData.get('customerEmail'),
            phone: formData.get('customerPhone')
        };
        
        // Get cart data
        const cart = JSON.parse(localStorage.getItem('munsonCart'));
        
        // Generate order number
        const orderNumber = 'MUN' + Date.now().toString().slice(-8);
        
        // Prepare order data
        const orderData = {
            orderNumber: orderNumber,
            date: new Date().toLocaleString(),
            customer: customerInfo,
            items: cart,
            total: document.getElementById('final-total').textContent
        };
        
        // Save order data
        saveOrder(orderData);
        
        // Show confirmation
        showConfirmation(orderNumber);
    });
}

// Save order data to localStorage and Google Sheets
function saveOrder(orderData) {
    // Add admin identifier to order
    orderData.adminAccount = 'rjsbackpack@gmail.com';
    
    // Ensure total is just the number without $
    if (typeof orderData.total === 'string') {
        orderData.total = orderData.total.replace('$', '');
    }
    
    // Get existing orders (keep local backup)
    let orders = JSON.parse(localStorage.getItem('munsonOrders') || '[]');
    orders.push(orderData);
    localStorage.setItem('munsonOrders', JSON.stringify(orders));
    
    // Send to Google Sheets
    const COLLECTION_URL = 'https://script.google.com/macros/s/AKfycbw5I57_AtHgvv84sin8EnX8ogN5EWC0NZO_8xYQ7UEql26f9lwbMoq-AX1Oxm_EKeDKlA/exec';
    
    console.log('Sending order to Google Sheets:', orderData);
    
    fetch(COLLECTION_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData)
    }).then(() => {
        console.log('Order sent to Google Sheets successfully');
    }).catch(error => {
        console.error('Error sending to Google Sheets:', error);
        console.log('Order saved locally as backup');
    });
    
    console.log('Order Submitted:', orderData);
}

// Show confirmation modal
function showConfirmation(orderNumber) {
    const modal = document.getElementById('confirmation-modal');
    document.getElementById('order-number').textContent = orderNumber;
    modal.classList.add('show');
    
    // Clear cart
    localStorage.removeItem('munsonCart');
    
    // Setup close button
    document.getElementById('close-modal').addEventListener('click', function() {
        window.location.href = 'index.html';
    });
    
    // Setup view receipt button
    document.getElementById('view-receipt-btn').addEventListener('click', function() {
        window.location.href = 'receipts.html';
    });
}

// Setup back button
function setupBackButton() {
    document.getElementById('back-btn').addEventListener('click', function() {
        window.location.href = 'index.html';
    });
}