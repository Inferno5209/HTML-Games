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

// Save order data to localStorage (in a real app, this would be sent to a server)
function saveOrder(orderData) {
    // Get existing orders
    let orders = JSON.parse(localStorage.getItem('munsonOrders') || '[]');
    
    // Add new order
    orders.push(orderData);
    
    // Save back to localStorage
    localStorage.setItem('munsonOrders', JSON.stringify(orders));
    
    // Also log to console for demonstration
    console.log('Order Submitted:', orderData);
    
    // In a real application, you would send this data to a server:
    // fetch('/api/orders', {
    //     method: 'POST',
    //     headers: { 'Content-Type': 'application/json' },
    //     body: JSON.stringify(orderData)
    // });
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
}

// Setup back button
function setupBackButton() {
    document.getElementById('back-btn').addEventListener('click', function() {
        window.location.href = 'index.html';
    });
}