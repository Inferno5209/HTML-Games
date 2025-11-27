// Product data - Update with actual product names and prices
const products = {
    1: { 
        name: "1.5 oz Milk Chocolate Almond Bar", 
        price: 1.75, 
        category: "chocolate-bars",
        description: "For the milk chocolate lover who is a little nutty, Munson's solid milk chocolate bars with almonds are the only choice. Experience the best milk chocolate you have ever tasted – in the perfect size bar for when you just have to have milk chocolate and almonds.",
        image: "photos/Milk Chocolate Almond Bar.png"
    },
    2: { 
        name: "1.5 oz Milk Chocolate Bar", 
        price: 1.75, 
        category: "chocolate-bars",
        description: "For the chocolate lover who is a true purist, our solid milk chocolate bars are the only choice. Try it and experience the best milk chocolate you have ever tasted! This 1.5-oz. bar is the perfect size for when you just have to have milk chocolate.",
        image: "photos/Milk Chocolate Bar.png"
    },
    3: { 
        name: "1.4 oz Milk Chocolate Crisp Bar", 
        price: 1.75, 
        category: "chocolate-bars",
        description: "For the milk chocolate lover who likes a little crunch, Munson's solid milk chocolate bars with crisp rice are the only choice. Experience the best milk chocolate you have ever tasted – in the perfect size bar for when you just have to have milk chocolate and crisp rice.",
        image: "photos/Milk Chocolate Crisp Bar.png"
    },
    4: { 
        name: "1.5 oz Dark Chocolate Bar", 
        price: 1.75, 
        category: "chocolate-bars",
        description: "For the chocolate lover who is a true purest, Munson's solid dark chocolate bars are the only choice. Experience the best dark chocolate you have ever tasted – in the perfect size bar for when you just have to have dark chocolate.",
        image: "photos/Dark Chocolate Bar.png"
    },
    5: { 
        name: "1.5 oz UConn Milk Chocolate Almond Bar", 
        price: 1.75, 
        category: "uconn-bars",
        description: "For the milk chocolate lover who is a little nutty about the UCONN Huskies, Munson's solid milk chocolate bars with almonds are the only choice. Experience the best milk chocolate you have ever tasted – in the perfect size bar for when you just have to have milk chocolate and almonds. Munson's Chocolates is a proud partner of the UCONN Huskies!",
        image: "photos/Milk Chocolate UCONN Almond Bar.png"
    },
    6: { 
        name: "1.5 oz UConn Milk Chocolate Bar", 
        price: 1.75, 
        category: "uconn-bars",
        description: "For the chocolate lover who is a true purest and huge UCONN fan, Munson's solid milk chocolate bars are the only choice. Experience the best milk chocolate you have ever tasted – in the perfect size bar for when you just have to have milk chocolate. Munson's Chocolates is a proud partner of the UCONN Huskies!",
        image: "photos/Milk Chocolate UCONN Bar.png"
    },
    7: { 
        name: "1.4 oz UConn Milk Chocolate Crisp Bar", 
        price: 1.75, 
        category: "uconn-bars",
        description: "For the milk chocolate lover who likes a little crunch and is a huge UCONN fan, Munson's solid milk chocolate bars with crisp rice are the only choice. Experience the best milk chocolate you have ever tasted – in the perfect size bar for when you just have to have milk chocolate and crisp rice. Munson's Chocolates is a proud partner of the UCONN Huskies!",
        image: "photos/Milk Chocolate UCONN Crisp Bar.png"
    },
    8: { 
        name: "1.5 oz UConn Dark Chocolate Bar", 
        price: 1.75, 
        category: "uconn-bars",
        description: "For the chocolate lover who is a true purest and huge UCONN fan, Munson's solid dark chocolate bars are the only choice. Experience the best dark chocolate you have ever tasted – in the perfect size bar for when you just have to have dark chocolate. Munson's Chocolates is a proud partner of the UCONN Huskies!",
        image: "photos/Dark Chocolate UCONN Bar.png"
    },
    9: { 
        name: "3 oz. Milk Chocolate Mini Munsonettes", 
        price: 8.50, 
        category: "everyday-favorites",
        description: "Bite-size patties of Munson's pure milk chocolate topped with mini M&Ms®. Each piece is individually wrapped. (8 per package.)",
        image: "photos/Mini Munsonettes.png"
    },
    10: { 
        name: "3.5 oz. Peanut Butter Cups", 
        price: 5.50, 
        category: "everyday-favorites",
        description: "The perfect combination of our creamy peanut butter and milk chocolate – this is one of our customers' favorites! Individually wrapped in a colorful tote box.",
        image: "photos/Milk Chocolate Peanut Butter Cup Tote.png"
    },
    11: { 
        name: "12 oz 12 Flavor Gummi Bears", 
        price: 3.98, 
        category: "everyday-favorites",
        description: "These Gummies are so flavorful - Flavors include: Cherry, Pink Grapefruit, Watermelon, Strawberry, Orange, Blue Raspberry, Lime, Grape, Green Apple, Mango, Pineapple & Lemon.",
        image: "photos/12 Flavored Gummi Bears.png"
    },
    12: { 
        name: "4 oz. Milk Chocolate Covered Potato Chips", 
        price: 9.65, 
        category: "everyday-favorites",
        description: "Potato chips covered in Munson's milk chocolate.",
        image: "photos/Chocolate Covered Potato Chip Tote.png"
    },
    13: { 
        name: "4 oz. Milk Chocolate Covered Mini Pretzels", 
        price: 8.98, 
        category: "everyday-favorites",
        description: "Mini pretzels drenched in Munson's pure milk chocolate to create a munchy, crunchy taste sensation.",
        image: "photos/Milk Chocolate Mini Pretzel Tote.png"
    },
    14: { 
        name: "4 oz. Milk Chocolate Covered Mini Oreos", 
        price: 11.50, 
        category: "everyday-favorites",
        description: "Mini Oreos covered in Munson's milk chocolate. You can't eat just one...",
        image: "photos/Milk Chocolate Mini Oreo Tote.png"
    },
    15: { 
        name: "4 oz. Milk Chocolate Coconut Clusters", 
        price: 8.50, 
        category: "everyday-favorites",
        description: "Using freshly shaved coconut and Munson's rich milk chocolate, our chocolatiers meticulously craft this popular confection in small batches to ensure freshness.",
        image: "photos/Milk Chocolate Coconut Cluster Tote.png"
    },
    16: { 
        name: "4.5 oz. Chocolate Peanut Butter Jumble", 
        price: 10.75, 
        category: "everyday-favorites",
        description: "This incredible combination is made up of chocolate, peanut butter, Spanish peanuts, pretzel sticks, cookie pieces, and chocolate chips. Trust us: this is one snack you won't want to put down!",
        image: "photos/Peanut Butter Jumble Tote.png"
    },
    17: { 
        name: "8 oz. Milk Chocolate Covered Animal Crackers", 
        price: 6.35, 
        category: "everyday-favorites",
        description: "These animal crackers are covered in Munson's milk chocolate. Fun to eat – and they taste soooo good!",
        image: "photos/Chocolate Covered Animal Crackers.png"
    },
    18: { 
        name: "10 oz. Dark Chocolate Non Pareils", 
        price: 18.50, 
        category: "everyday-favorites",
        description: "Dark chocolate topped with white crunchy candy - A classic!",
        image: "photos/Dark chocolate Non Pareils.png"
    },
    19: { 
        name: "10 oz. Milk Chocolate Covered Raisins", 
        price: 12.35, 
        category: "everyday-favorites",
        description: "A successful merger if there ever was one! Plump raisins are covered in Munson's pure milk chocolate.",
        image: "photos/Milk Chocolate Covered Raisins.png"
    },
    20: { 
        name: "10 oz. Milk Chocolate Malted Balls", 
        price: 13.75, 
        category: "everyday-favorites",
        description: "These are so addictive, malt balls covered in milk chocolate.",
        image: "photos/Milk Chocolate Malted Balls.png"
    },
    21: { 
        name: "10 oz. Chocolate Covered Gummi Bears", 
        price: 7.75, 
        category: "everyday-favorites",
        description: "Assorted flavor gummi bears covered in milk chocolate.",
        image: "photos/Milk Chocolate Covered Gummi Bears.png"
    },
    22: { 
        name: "8 oz. Milk Almond Toffee Butter Crunch", 
        price: 17.75, 
        category: "everyday-favorites",
        description: "Grandpa Munson's recipe for this specialty is a family secret! Crunchy butter toffee is covered in our pure milk chocolate and smothered with roasted almonds.",
        image: "photos/Almond Toffee Buttercrunch.png"
    },
    23: { 
        name: "7 oz. Milk Pecan Caramel Patties", 
        price: 20.75, 
        category: "everyday-favorites",
        description: "Munson's famous pecan caramel patties are handmade with generous amounts of pecans and chewy vanilla caramel in milk chocolate.",
        image: "photos/Pecan Caramel Patties.png"
    },
    24: { 
        name: "5 oz. Triple Chocolate Layered Truffles", 
        price: 14.50, 
        category: "everyday-favorites",
        description: "Chocoholics rejoice! This delectable creation was made for your indulgence. Three delicious layers of milk and dark chocolate infused with filbert praline.",
        image: "photos/Triple Chocolate Layered Truffles.png"
    },
    25: { 
        name: "7.5 oz. Gourmet Truffles", 
        price: 20.50, 
        category: "everyday-favorites",
        description: "If decadence has a name, it is Munson's Gourmet Truffles. Our truffles are made with chocolate and fresh dairy cream to create a taste that is distinctive and oh-so-indulgent. Flavors include: Chocolate, Tiramisu, Raspberry, Sea Salt Caramel, Champagne.",
        image: "photos/Gourmet Truffles.png"
    },
    26: { 
        name: "12 oz. Dark Chocolate Almond Bark", 
        price: 20.98, 
        category: "everyday-favorites",
        description: "This is a merger made in heaven: our rich dark chocolate mixed with crunchy almonds.",
        image: "photos/Dark Chocolate Almond Bark.png"
    },
    27: { 
        name: "7 oz. Original & Salted Caramels", 
        price: 18.25, 
        category: "everyday-favorites",
        description: "Crafted with fresh cream that we source from a family farm a mere mile from our factory and artfully made in small batches; these are just two of the reasons our chocolate covered caramels are so highly sought after. Milk and dark chocolate.",
        image: "photos/Original & Salted Caramels.png"
    },
    28: { 
        name: "8 oz. Assorted Chocolates", 
        price: 19.98, 
        category: "everyday-favorites",
        description: "Our 8 oz. Munson's Chocolate Assortment is filled with our most popular confections. With 18 pieces in this box, you're sure to find a favorite bite size of sweetness. Every piece is hand-packed to create an assortment that includes a luscious variety of milk and dark chocolate pieces, like our famous triple chocolate layered truffles, almond toffee butter crunch, award-winning vanilla caramels, sea salt caramels, butterscotch caramels, peanut butter centers, almond, coconut clusters, orange cream, raspberry jelly, and more.",
        image: "photos/Assorted Chocolates.png"
    },
    29: { 
        name: "6 oz. Miniature Peppermint Patties", 
        price: 10.98, 
        category: "everyday-favorites",
        description: "These are the BEST Peppermint Patties you'll ever taste! Pop one in your mouth and experience the cool, refreshing taste of peppermint cream, covered in Munson's rich dark chocolate. Packaged in a resealable bag. 6 oz.",
        image: "photos/Mini Dark Chocolate Peppermint Patties.png"
    },
    30: { 
        name: "8 oz. Miniature Sea Salt Caramels", 
        price: 12.25, 
        category: "everyday-favorites",
        description: "There is no way you can eat just one! Our incredibly soft and chewy vanilla caramel is covered in Munson's milk chocolate and topped with sea salt. Packaged in a resealable bag. 6 oz.",
        image: "photos/Mini Milk Chocolate Salted Caramels.png"
    },
    31: { 
        name: "11 oz. Swedish Fish", 
        price: 5.98, 
        category: "everyday-favorites",
        description: "Assorted flavored Swedish fish in resealable package.",
        image: "photos/Swedish Fish Package.png"
    }
};

// Shopping cart
let cart = {};

// Initialize the page
document.addEventListener('DOMContentLoaded', function() {
    initializeProducts();
    setupNavigation();
    setupQuantityControls();
    setupCheckoutButton();
    setupProductClick();
    setupAdminButton();
    setupClearCartButton();
    loadCart();
});

// Initialize product prices and names in the HTML
function initializeProducts() {
    document.querySelectorAll('.product-card').forEach(card => {
        const itemId = card.dataset.item;
        const product = products[itemId];
        
        if (product) {
            card.querySelector('h3').textContent = product.name;
            card.querySelector('.item-price').textContent = product.price.toFixed(2);
            
            // Add product image if available
            if (product.image) {
                const img = document.createElement('img');
                img.src = product.image;
                img.alt = product.name;
                img.className = 'product-image';
                card.insertBefore(img, card.querySelector('h3'));
            }
        }
    });
}

// Setup navigation between sections
function setupNavigation() {
    const navLinks = document.querySelectorAll('.nav-links a');
    const sections = document.querySelectorAll('.product-section');
    
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Update active nav link
            navLinks.forEach(l => l.classList.remove('active'));
            this.classList.add('active');
            
            // Show corresponding section
            const targetId = this.getAttribute('href').substring(1);
            showSection(targetId, navLinks, sections);
        });
    });
    
    // Handle hash on page load (for back button from product detail)
    if (window.location.hash) {
        const targetId = window.location.hash.substring(1);
        showSection(targetId, navLinks, sections);
    }
}

// Helper function to show a specific section
function showSection(targetId, navLinks, sections) {
    // Update active nav link
    navLinks.forEach(l => {
        if (l.getAttribute('href') === `#${targetId}`) {
            l.classList.add('active');
        } else {
            l.classList.remove('active');
        }
    });
    
    // Show corresponding section
    sections.forEach(section => {
        section.classList.remove('active');
        if (section.id === targetId) {
            section.classList.add('active');
        }
    });
}

// Setup quantity control buttons
function setupQuantityControls() {
    document.querySelectorAll('.product-card').forEach(card => {
        const itemId = card.dataset.item;
        const minusBtn = card.querySelector('.minus');
        const plusBtn = card.querySelector('.plus');
        const quantityInput = card.querySelector('.quantity');
        
        plusBtn.addEventListener('click', () => {
            const currentValue = parseInt(quantityInput.value);
            quantityInput.value = currentValue + 1;
            updateCart(itemId, currentValue + 1);
        });
        
        minusBtn.addEventListener('click', () => {
            const currentValue = parseInt(quantityInput.value);
            if (currentValue > 0) {
                quantityInput.value = currentValue - 1;
                updateCart(itemId, currentValue - 1);
            }
        });
        
        quantityInput.addEventListener('change', () => {
            let value = parseInt(quantityInput.value);
            if (isNaN(value) || value < 0) {
                value = 0;
                quantityInput.value = 0;
            }
            updateCart(itemId, value);
        });
    });
}

// Update cart
function updateCart(itemId, quantity) {
    if (quantity > 0) {
        cart[itemId] = {
            name: products[itemId].name,
            price: products[itemId].price,
            quantity: quantity
        };
    } else {
        delete cart[itemId];
    }
    
    saveCart();
    updateCartDisplay();
}

// Update cart display
function updateCartDisplay() {
    let totalItems = 0;
    let totalPrice = 0;
    
    for (let itemId in cart) {
        totalItems += cart[itemId].quantity;
        totalPrice += cart[itemId].price * cart[itemId].quantity;
    }
    
    document.getElementById('cart-count').textContent = totalItems;
    document.getElementById('cart-total').textContent = totalPrice.toFixed(2);
}

// Save cart to localStorage
function saveCart() {
    localStorage.setItem('munsonCart', JSON.stringify(cart));
}

// Load cart from localStorage
function loadCart() {
    const savedCart = localStorage.getItem('munsonCart');
    if (savedCart) {
        cart = JSON.parse(savedCart);
        
        // Update quantity inputs
        for (let itemId in cart) {
            const card = document.querySelector(`[data-item="${itemId}"]`);
            if (card) {
                card.querySelector('.quantity').value = cart[itemId].quantity;
            }
        }
        
        updateCartDisplay();
    }
}

// Setup product card clicks
function setupProductClick() {
    document.querySelectorAll('.product-card').forEach(card => {
        // Make the card clickable (but not the quantity controls)
        card.style.cursor = 'pointer';
        
        card.addEventListener('click', function(e) {
            // Don't navigate if clicking on quantity controls
            if (e.target.classList.contains('qty-btn') || 
                e.target.classList.contains('quantity') ||
                e.target.closest('.quantity-controls')) {
                return;
            }
            
            const itemId = this.dataset.item;
            window.location.href = `product-detail.html?id=${itemId}`;
        });
    });
}

// Setup admin button
function setupAdminButton() {
    const adminBtn = document.getElementById('admin-btn');
    if (adminBtn) {
        adminBtn.addEventListener('click', () => {
            window.location.href = 'admin-login.html';
        });
    }
}

// Setup clear cart button
function setupClearCartButton() {
    const clearCartBtn = document.getElementById('clear-cart-btn');
    if (clearCartBtn) {
        clearCartBtn.addEventListener('click', () => {
            if (confirm('Are you sure you want to clear your entire shopping cart?')) {
                cart = {};
                saveCart();
                
                // Reset all quantity inputs to 0
                document.querySelectorAll('.product-card .quantity').forEach(input => {
                    input.value = 0;
                });
                
                updateCartDisplay();
                alert('Shopping cart cleared!');
            }
        });
    }
}

// Setup checkout button
function setupCheckoutButton() {
    document.getElementById('checkout-btn').addEventListener('click', () => {
        if (Object.keys(cart).length === 0) {
            alert('Your cart is empty. Please add items before checking out.');
            return;
        }
        window.location.href = 'checkout.html';
    });
}