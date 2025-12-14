
const MENU_ITEMS = [
    { id: 1, name: "Signature Espresso", price: 250, description: "A bold, rich shot with caramel notes.", image: "https://i.pinimg.com/736x/15/4f/19/154f199990798e8493545fb27b1ab0b8.jpg" },

    { id: 2, name: "Classic Cappuccino", price: 320, description: "Velvety foam, steamed milk, and a perfect shot.", image: "https://i.pinimg.com/736x/f0/65/5f/f0655f2737da76be9b4ac435c65e3d9b.jpg" },

    { id: 3, name: "Hazelnut Latte", price: 380, description: "Smooth latte with a hint of roasted hazelnut syrup.", image: "https://i.pinimg.com/736x/23/a1/c8/23a1c8fc12bd3d222e09a7424a5eb12a.jpg" },

    { id: 4, name: "Almond Croissant", price: 180, description: "Flaky pastry filled with sweet almond cream.", image: "https://i.pinimg.com/1200x/cf/9b/af/cf9bafa8f904bb4c2aacf06cebf46331.jpg "},
    { id: 5, name: "Vegan Brownie", price: 220, description: "Rich, fudgy, and surprisingly vegan.", image: "https://i.pinimg.com/1200x/45/13/db/4513db1e261b756984dfa9338bc6cdcc.jpg"},
    { id: 6, name: "Iced Caramel Macchiato", price: 390, description: "Layers of cold milk, espresso, and caramel drizzle.", image: "https://i.pinimg.com/736x/99/11/bb/9911bb6c2dad5bbe2d7a868bcaa565ef.jpg" },

];

const COUPONS = {
    SAVE10: { type: 'percent', value: 0.10, message: '10% OFF applied!' },
    FLAT50: { type: 'flat', value: 50, message: '₹50 OFF applied!' },
};


let cart = JSON.parse(localStorage.getItem('cafeCart')) || [];
let appliedCoupon = JSON.parse(localStorage.getItem('cafeCoupon')) || null;

const GST_RATE = 0.05; 


const elements = {
    menuContainer: document.getElementById('menu-container'),
    cartToggleBtn: document.getElementById('cart-toggle-btn'),
    sideCart: document.getElementById('side-cart'),
    closeCartBtn: document.getElementById('close-cart-btn'),
    cartCount: document.getElementById('cart-count'),
    cartItemsContainer: document.getElementById('cart-items-container'),
    cartSubtotal: document.getElementById('cart-subtotal'),
    checkoutBtn: document.getElementById('checkout-btn'),
    
    checkoutModal: document.getElementById('checkout-modal'),
    modalBackdrop: document.getElementById('modal-backdrop'),
    closeModalBtn: document.getElementById('close-modal-btn'),
    checkoutBillingState: document.getElementById('checkout-billing-state'),
    checkoutSuccessState: document.getElementById('checkout-success-state'),
    billingItemsContainer: document.getElementById('billing-items-container'),
    billingSubtotal: document.getElementById('billing-subtotal'),
    billingDiscount: document.getElementById('billing-discount'),
    billingGST: document.getElementById('billing-gst'),
    billingFinalTotal: document.getElementById('billing-final-total'),
    couponInput: document.getElementById('coupon-input'),
    applyCouponBtn: document.getElementById('apply-coupon-btn'),
    placeOrderBtn: document.getElementById('place-order-btn'),
    printReceiptBtn: document.getElementById('print-receipt-btn'),
    emptyCartMessage: document.querySelector('.empty-cart-message')
};


function saveState() {
    localStorage.setItem('cafeCart', JSON.stringify(cart));
    localStorage.setItem('cafeCoupon', JSON.stringify(appliedCoupon));
}

/**
 * Shows a temporary toast notification.
 * @param {string} message 
 */
function showToast(message) {
    const toastContainer = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.classList.add('toast');
    toast.textContent = message;
    
    toastContainer.appendChild(toast);
    
    
    requestAnimationFrame(() => toast.classList.add('show'));

    
    setTimeout(() => {
        toast.classList.remove('show');
        toast.addEventListener('transitionend', () => toast.remove());
    }, 2500);
}

/**
 * Calculates subtotal, discount, GST, and final total.
 * @returns {object} 
 */
function calculateTotals() {
    const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    let discountAmount = 0;
    
    if (appliedCoupon) {
        const coupon = COUPONS[appliedCoupon.code];
        if (coupon.type === 'percent') {
            discountAmount = subtotal * coupon.value;
        } else if (coupon.type === 'flat') {
            discountAmount = coupon.value;
        }
        discountAmount = Math.min(discountAmount, subtotal); 
    }

    const taxableTotal = subtotal - discountAmount;
    const gstAmount = taxableTotal * GST_RATE;
    const finalTotal = taxableTotal + gstAmount;

    return {
        subtotal: subtotal,
        discount: discountAmount,
        gst: gstAmount,
        finalTotal: finalTotal
    };
}





function renderMenu() {
    elements.menuContainer.innerHTML = MENU_ITEMS.map(item => `
        <div class="menu-item" data-id="${item.id}">
            <img src="${item.image}" alt="${item.name}" class="item-image">
            <div class="item-details">
                <div>
                    <h4>${item.name}</h4>
                    <p>${item.description}</p>
                </div>
                <div class="item-price-section">
                    <span class="item-price">₹${item.price.toFixed(2)}</span>
                    <button class="add-to-cart-btn" data-id="${item.id}">Add to Cart</button>
                </div>
            </div>
        </div>
    `).join('');
}


function renderCart() {
    
    const totalItems = cart.reduce((count, item) => count + item.quantity, 0);
    elements.cartCount.textContent = totalItems;
    
    
    if (cart.length === 0) {
        elements.cartItemsContainer.innerHTML = elements.emptyCartMessage.outerHTML;
        elements.checkoutBtn.disabled = true;
        elements.checkoutBtn.style.opacity = '0.7';
        return;
    }

    elements.checkoutBtn.disabled = false;
    elements.checkoutBtn.style.opacity = '1';

    
    elements.cartItemsContainer.innerHTML = cart.map(item => `
        <div class="cart-item" data-id="${item.id}">
            <div class="cart-item-info">
                <span class="cart-item-name">${item.name}</span>
                <span class="cart-item-price">₹${(item.price * item.quantity).toFixed(2)}</span>
            </div>
            <div class="quantity-controls">
                <button class="qty-btn" data-id="${item.id}" data-action="decrease">&minus;</button>
                <span class="item-qty">${item.quantity}</span>
                <button class="qty-btn" data-id="${item.id}" data-action="increase">&plus;</button>
            </div>
            <button class="remove-item-btn" data-id="${item.id}">Remove</button>
        </div>
    `).join('');

    
    const totals = calculateTotals();
    elements.cartSubtotal.textContent = `₹${totals.subtotal.toFixed(2)}`;
    
    
    const emptyMessage = elements.cartItemsContainer.querySelector('.empty-cart-message');
    if (emptyMessage) emptyMessage.remove();
    
    saveState();
}


function renderBillingSummary() {
    const totals = calculateTotals();

    
    elements.billingItemsContainer.innerHTML = cart.map(item => `
        <div class="billing-item-line">
            <span class="billing-item-name">${item.name} x ${item.quantity}</span>
            <span class="billing-item-price">₹${(item.price * item.quantity).toFixed(2)}</span>
        </div>
    `).join('');

    
    elements.billingSubtotal.textContent = `₹${totals.subtotal.toFixed(2)}`;
    elements.billingDiscount.textContent = `- ₹${totals.discount.toFixed(2)}`;
    elements.billingGST.textContent = `₹${totals.gst.toFixed(2)}`;
    elements.billingFinalTotal.textContent = `₹${totals.finalTotal.toFixed(2)}`;
    
    
    if (appliedCoupon) {
        elements.couponInput.value = appliedCoupon.code;
        showToast(`Coupon ${appliedCoupon.code} is applied.`);
    } else {
        elements.couponInput.value = '';
    }
}




/**
 * Handles adding an item to the cart.
 * @param {number} itemId 
 */
function addItemToCart(itemId) {
    const item = MENU_ITEMS.find(i => i.id === itemId);
    const cartItem = cart.find(i => i.id === itemId);

    if (item) {
        if (cartItem) {
            cartItem.quantity++;
        } else {
            cart.push({ ...item, quantity: 1 });
        }
        showToast(`${item.name} added to cart!`);
    }
    
    renderCart();
    
    
    if (!elements.sideCart.classList.contains('open')) {
        elements.sideCart.classList.add('open');
    }
}

/**
 * Handles changing the quantity of an item in the cart.
 * @param {number} itemId 
 * @param {string} action 
 */
function changeQuantity(itemId, action) {
    const cartItem = cart.find(i => i.id === itemId);
    if (!cartItem) return;

    if (action === 'increase') {
        cartItem.quantity++;
    } else if (action === 'decrease') {
        cartItem.quantity--;
        if (cartItem.quantity < 1) {
            cart = cart.filter(i => i.id !== itemId); 
            showToast(`${cartItem.name} removed from cart.`);
            appliedCoupon = null; 
        }
    }
    
    renderCart();
    
    if (elements.checkoutModal.classList.contains('active')) {
        renderBillingSummary();
    }
}


function applyCoupon() {
    const code = elements.couponInput.value.toUpperCase().trim();
    if (!code) {
        appliedCoupon = null;
        showToast('Coupon cleared.');
        renderBillingSummary();
        saveState();
        return;
    }

    if (COUPONS[code]) {
        appliedCoupon = { code: code };
        showToast(COUPONS[code].message);
    } else {
        appliedCoupon = null;
        showToast('Invalid coupon code.', 'error');
        elements.couponInput.value = '';
    }
    
    renderBillingSummary();
    saveState();
}


function placeOrder() {
    
    elements.checkoutBillingState.style.display = 'none';
    elements.checkoutSuccessState.style.display = 'block';
    
    
    setTimeout(() => {
        cart = [];
        appliedCoupon = null;
        saveState();
        renderCart();
        
        
        elements.placeOrderBtn.disabled = true;

    }, 500);
}





function toggleSideCart() {
    elements.sideCart.classList.toggle('open');
}


function openCheckoutModal() {
    if (cart.length === 0) {
        showToast('Cart is empty. Please add items before checking out.');
        return;
    }
    
    
    elements.checkoutBillingState.style.display = 'block';
    elements.checkoutSuccessState.style.display = 'none';
    elements.placeOrderBtn.disabled = false;
    
    renderBillingSummary();
    elements.checkoutModal.classList.add('active');
    elements.modalBackdrop.classList.add('active');
    elements.sideCart.classList.remove('open'); 
}


function closeCheckoutModal() {
    elements.checkoutModal.classList.remove('active');
    elements.modalBackdrop.classList.remove('active');
}



function init() {
    renderMenu();
    renderCart();
    

    
    
    elements.menuContainer.addEventListener('click', (e) => {
        const btn = e.target.closest('.add-to-cart-btn');
        if (btn) {
            addItemToCart(parseInt(btn.dataset.id));
        }
    });

    
    elements.cartToggleBtn.addEventListener('click', toggleSideCart);
    elements.closeCartBtn.addEventListener('click', toggleSideCart);
    
    elements.cartItemsContainer.addEventListener('click', (e) => {
        const btn = e.target.closest('.qty-btn') || e.target.closest('.remove-item-btn');
        if (!btn) return;
        
        const itemId = parseInt(btn.dataset.id);
        
        if (btn.classList.contains('qty-btn')) {
            changeQuantity(itemId, btn.dataset.action);
        } else if (btn.classList.contains('remove-item-btn')) {
            cart = cart.filter(i => i.id !== itemId);
            showToast(`${MENU_ITEMS.find(i => i.id === itemId)?.name || 'Item'} removed.`);
            renderCart();
            appliedCoupon = null; 
            if (elements.checkoutModal.classList.contains('active')) renderBillingSummary();
        }
    });

    
    elements.checkoutBtn.addEventListener('click', openCheckoutModal);
    elements.closeModalBtn.addEventListener('click', closeCheckoutModal);
    elements.modalBackdrop.addEventListener('click', closeCheckoutModal);
    
    elements.applyCouponBtn.addEventListener('click', applyCoupon);
    
    elements.placeOrderBtn.addEventListener('click', placeOrder);
    
    elements.printReceiptBtn.addEventListener('click', () => {
        window.print();
    });
}

// Start the application
init();