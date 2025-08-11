class SubscriptionProductPage {
    constructor() {
      this.productData = this.getProductData();
      this.currentState = {
        subscriptionType: 'single',
        selectedFlavors: ['chocolate'],
        quantity: 1,
        currentImageIndex: 0
      };
      
      this.initializeEventListeners();
      this.updateUI();
    }
  
    // ---------- Data helpers ----------
    getProductData() {
      try {
        const el = document.getElementById('product-data');
        if (!el) return {};
        return JSON.parse(el.textContent);
      } catch (e) {
        console.error('Error parsing product data JSON', e);
        return {};
      }
    }
  
    getMeta(val) {
      if (val == null) return '';
      if (typeof val === 'object' && 'value' in val) return val.value;
      return val;
    }
  
    parseMetafieldList(value) {
      let v = this.getMeta(value);
      if (!v) return [];
      if (Array.isArray(v)) return v.map(x => String(x).trim()).filter(Boolean);
      if (typeof v !== 'string') v = String(v);
  
      const s = v.trim();
      if (!s) return [];
  
      // Try JSON array in string
      try {
        const parsed = JSON.parse(s);
        if (Array.isArray(parsed)) {
          return parsed.map(x => String(x).trim()).filter(Boolean);
        }
      } catch (_) {}
  
      // Split by newline or comma
      if (s.includes('\n')) return s.split('\n').map(x => x.trim()).filter(Boolean);
      if (s.includes(',')) return s.split(',').map(x => x.trim()).filter(Boolean);
  
      return [s];
    }
  
    // ---------- Event wiring ----------
    initializeEventListeners() {
      // Use delegation so it works with both old and new markup
      document.addEventListener('click', (e) => {
        // Subscription card click (old: .subscription-option, new: .sub-card)
        const subCard = e.target.closest('.sub-card, .subscription-option');
        if (subCard) {
          const type = subCard.dataset.type || subCard.querySelector('input[name="subscription-type"]')?.value;
          if (type) this.switchSubscriptionType(type);
        }
  
        // Flavor click (old: .flavor-option, new: .flavor-card)
        const flavorBtn = e.target.closest('.flavor-card, .flavor-option');
        if (flavorBtn) {
          const row = flavorBtn.closest('.flavor-row, .flavor-selector');
          const rowId = row?.id || '';
          const flavor = flavorBtn.dataset.flavor;
          if (flavor && rowId) {
            this.updateFlavorSelection(rowId, flavor);
          this.updatePricing();
          this.updateMainImage();
          this.validateSelections();
          }
        }
  
        // Carousel buttons
        if (e.target.id === 'prev-image') this.navigateImage(-1);
        if (e.target.id === 'next-image') this.navigateImage(1);
      });
  
      // Radio change (always reliable)
      document.querySelectorAll('input[name="subscription-type"]').forEach(r => {
        r.addEventListener('change', (e) => {
          this.switchSubscriptionType(e.target.value);
        });
      });
  
      // Dots
      document.querySelectorAll('.carousel-dots .dot').forEach((dot, i) => {
        dot.addEventListener('click', () => {
          this.currentState.currentImageIndex = i;
          this.updateMainImage();
          this.updateThumbnailSelection();
        });
      });
  
      // Thumbnails
      document.querySelectorAll('.thumbnail-item').forEach((thumb, i) => {
        thumb.addEventListener('click', () => {
          this.currentState.currentImageIndex = i;
          this.updateMainImage();
          this.updateThumbnailSelection();
        });
      });
  
      // Keyboard
      document.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowLeft') this.navigateImage(-1);
        if (e.key === 'ArrowRight') this.navigateImage(1);
      });
  
      // Quantity
      const qty = document.getElementById('quantity');
      if (qty) {
        qty.addEventListener('change', (e) => {
          this.currentState.quantity = parseInt(e.target.value, 10) || 1;
          this.updatePricing();
        });
      }
  
      // Add to cart
      const addBtn = document.getElementById('add-to-cart-btn');
      if (addBtn) {
        addBtn.addEventListener('click', () => this.addToCart());
      }
    }
  
    // ---------- UI toggles ----------
    switchSubscriptionType(type) {
      this.currentState.subscriptionType = type;
  
      // Radios
      document.querySelectorAll('input[name="subscription-type"]').forEach(r => {
        r.checked = r.value === type;
      });
  
      // New UI (sub-card)
      const hasNew = !!document.querySelector('.sub-card');
      if (hasNew) {
        document.querySelectorAll('.sub-card').forEach(card => {
          const isActive = (card.dataset.type === type);
          card.classList.toggle('active', isActive);
          card.classList.toggle('is-open', isActive);
          card.setAttribute('aria-expanded', String(isActive));
          const details = card.querySelector('.option-details');
          if (details) details.style.display = isActive ? 'block' : 'none';
        });
      }
  
      // Old UI (show/hide flavor-2 selector)
      const flavor2Old = document.getElementById('flavor-2');
      if (flavor2Old) flavor2Old.style.display = (type === 'double') ? 'block' : 'none';
  
      // Ensure flavors array shape
      if (type === 'double') {
        if (this.currentState.selectedFlavors.length < 2) {
          this.currentState.selectedFlavors.push(this.currentState.selectedFlavors[0] || 'chocolate');
        }
      } else {
        this.currentState.selectedFlavors = [this.currentState.selectedFlavors[0] || 'chocolate'];
      }
      
      this.updateFlavorUI();
      this.updatePricing();
      this.updateIncludedContent();
      this.validateSelections();
    }
  
    updateFlavorSelection(selectorId, flavor) {
      const idx = (selectorId === 'flavor-1' || selectorId === 'flavor-1-double') ? 0 : 1;
      if (this.currentState.subscriptionType === 'single') {
        this.currentState.selectedFlavors[0] = flavor;
      } else {
        this.currentState.selectedFlavors[idx] = flavor;
      }
      this.updateFlavorUI();
    }
  
    updateFlavorUI() {
      // Single row (supports old/new IDs)
      document.querySelectorAll('#flavor-1 .flavor-option, #flavor-1 .flavor-card').forEach(el => {
        el.classList.toggle('selected', el.dataset.flavor === this.currentState.selectedFlavors[0]);
      });
  
      // Double rows (new)
      document.querySelectorAll('#flavor-1-double .flavor-option, #flavor-1-double .flavor-card').forEach(el => {
        el.classList.toggle('selected', el.dataset.flavor === this.currentState.selectedFlavors[0]);
      });
      document.querySelectorAll('#flavor-2-double .flavor-option, #flavor-2-double .flavor-card').forEach(el => {
        el.classList.toggle('selected', el.dataset.flavor === this.currentState.selectedFlavors[1]);
      });
    }
  
    // ---------- Pricing ----------
    updatePricing() {
    const base = (this.productData.price || 0) / 100;
    
    // Calculate individual item price (same for both single and double)
    const itemPrice = base * 0.75 * 0.8; // Rs. 60.00 per item
    
    // Calculate total based on subscription type
    const totalItems = this.currentState.subscriptionType === 'single' ? 1 : 2;
    const total = (itemPrice * totalItems * (this.currentState.quantity || 1)).toFixed(2);
    
    const finalEl = document.getElementById('final-price');
    const btnSpan = document.querySelector('.button-price span');
    if (finalEl) finalEl.textContent = total;
    if (btnSpan) btnSpan.textContent = total;

    // Update card prices
    const singleNow = (itemPrice).toFixed(2); // Rs. 60.00 for 1 item
    const singleWas = base.toFixed(2); // Rs. 100.00
    const doubleNow = (itemPrice * 2).toFixed(2); // Rs. 120.00 for 2 items
    const doubleWas = (base * 2).toFixed(2); // Rs. 200.00

    const singleCard = document.querySelector('[data-type="single"]');
    const doubleCard = document.querySelector('[data-type="double"]');
    if (singleCard) {
      const c = singleCard.querySelector('.current-price'); if (c) c.textContent = singleNow;
      const o = singleCard.querySelector('.original-price'); if (o) o.textContent = singleWas;
    }
    if (doubleCard) {
      const c = doubleCard.querySelector('.current-price'); if (c) c.textContent = doubleNow;
      const o = doubleCard.querySelector('.original-price'); if (o) o.textContent = doubleWas;
    }
  }
  
    // ---------- Included content (FIXED METAFIELDS) ----------
    updateIncludedContent() {
      const metafields = this.productData.metafields || {};
      
      const content = {
        single: {
          title: metafields.single_title || 'Single Drink Subscription',
          delivery: metafields.delivery_frequency || 'Every 30 Days',
          items: [metafields.single_included || '1 Premium Drink per month'],
          benefits: metafields.single_benefits ? metafields.single_benefits.split('\n') : [
            '25% subscription discount',
            '20% sales discount',
            'Free shipping',
            'Cancel anytime',
            'Premium quality ingredients'
          ]
        },
        double: {
          title: metafields.double_title || 'Double Drink Subscription',
          delivery: metafields.delivery_frequency || 'Every 30 Days',
          items: [metafields.double_included || '2 Premium Drinks per month'],
          benefits: metafields.double_benefits ? metafields.double_benefits.split('\n') : [
            '25% subscription discount',
            '20% sales discount',
            'Free shipping',
            'Cancel anytime',
            'Mix and match flavors',
            'Premium quality ingredients'
          ]
        }
      };
      
      const currentContent = content[this.currentState.subscriptionType];
      
      // Update single subscription content
      const singleContent = document.getElementById('included-content-single');
      if (singleContent) {
        singleContent.innerHTML = `
        <h4>${currentContent.title}</h4>
        <p><strong>Delivery:</strong> ${currentContent.delivery}</p>
        <p><strong>Included:</strong></p>
        <ul>
          ${currentContent.items.map(item => `<li>${item}</li>`).join('')}
        </ul>
        <p><strong>Benefits:</strong></p>
        <ul>
          ${currentContent.benefits.map(benefit => `<li>${benefit}</li>`).join('')}
        </ul>
      `;
    }
  
      // Update double subscription content
      const doubleContent = document.getElementById('included-content-double');
      if (doubleContent) {
        doubleContent.innerHTML = `
          <h4>${currentContent.title}</h4>
          <p><strong>Delivery:</strong> ${currentContent.delivery}</p>
          <p><strong>Included:</strong></p>
          <ul>
            ${currentContent.items.map(item => `<li>${item}</li>`).join('')}
          </ul>
          <p><strong>Benefits:</strong></p>
          <ul>
            ${currentContent.benefits.map(benefit => `<li>${benefit}</li>`).join('')}
          </ul>
        `;
      }
    }
  
    // ---------- Gallery ----------
    initializeImageGallery() {
      /* Handled via delegated listeners + below helpers */
    }
  
    navigateImage(direction) {
      const total = (this.productData.images || []).length || 1;
      this.currentState.currentImageIndex =
        (this.currentState.currentImageIndex + direction + total) % total;
      this.updateMainImage();
      this.updateThumbnailSelection();
    }
  
    updateMainImage(url = null) {
      const main = document.getElementById('main-product-image');
      if (!main) return;
      if (url) { main.src = url; return; }
      const img = (this.productData.images || [])[this.currentState.currentImageIndex];
      if (img) { main.src = img.src; main.alt = img.alt || this.productData.title || ''; }
    }
  
    updateThumbnailSelection() {
      document.querySelectorAll('.thumbnail-item').forEach((el, i) => {
        el.classList.toggle('active', i === this.currentState.currentImageIndex);
      });
      document.querySelectorAll('.carousel-dots .dot').forEach((el, i) => {
        el.classList.toggle('active', i === this.currentState.currentImageIndex);
      });
    }
  
    // ---------- Validation / Cart ----------
    validateSelections() {
      const btn = document.getElementById('add-to-cart-btn');
      if (!btn) return;
  
      let ok = true;
      if (this.currentState.subscriptionType === 'single') {
        ok = !!this.currentState.selectedFlavors[0];
      } else {
        ok =
          !!this.currentState.selectedFlavors[0] &&
          !!this.currentState.selectedFlavors[1] &&
          this.currentState.selectedFlavors[0] !== this.currentState.selectedFlavors[1];
      }
      btn.disabled = !ok;
    }
  
    async addToCart() {
    const btn = document.getElementById('add-to-cart-btn');
    if (!btn) return;
    btn.disabled = true;
    btn.innerHTML = '<span class="button-text">Adding to Cart...</span>';

    try {
      const items = [];
      const finalPrice = this.calculateFinalPrice();
      
      // Create line item properties to store subscription info
      const subscriptionProperties = {
        '_subscription_type': this.currentState.subscriptionType,
        '_subscription_price': finalPrice.toFixed(2),
        '_original_price': ((this.productData.price || 0) / 100).toFixed(2),
        '_discount_applied': '25% subscription + 20% sale'
      };
        
        if (this.currentState.subscriptionType === 'single') {
          const variant = this.getVariantByFlavor(this.currentState.selectedFlavors[0]);
          if (variant) {
          items.push({
              id: variant.id,
            quantity: this.currentState.quantity || 1,
            properties: subscriptionProperties
            });
          }
        } else {
        this.currentState.selectedFlavors.forEach((flavor, index) => {
            const variant = this.getVariantByFlavor(flavor);
            if (variant) {
            items.push({
                id: variant.id,
              quantity: this.currentState.quantity || 1,
              properties: {
                ...subscriptionProperties,
                '_flavor_position': `Flavor ${index + 1}`
              }
              });
            }
          });
        }
        
      if (!items.length) throw new Error('No variants found');
        
        const response = await fetch('/cart/add.js', {
          method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items })
      });
      
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      
      // Immediate cart count update
      await this.updateCartCount();
      
      // Trigger Dawn's internal cart update events
      if (window.publish && window.PUB_SUB_EVENTS) {
        window.publish(window.PUB_SUB_EVENTS.cartUpdate, {
          source: 'subscription-product',
          cartData: await (await fetch('/cart.js')).json()
        });
      }
      
      // Multiple delayed updates to ensure cart counter shows
      setTimeout(async () => {
        await this.updateCartCount();
      }, 100);
      
      setTimeout(async () => {
        await this.updateCartCount();
      }, 300);
      
      setTimeout(async () => {
        await this.updateCartCount();
      }, 500);
        
        // Show success message
        this.showCartMessage('Items added to cart successfully!', 'success');
        
      // Optional: Open cart drawer if enabled
      const cartDrawer = document.querySelector('cart-drawer');
      if (cartDrawer) {
        cartDrawer.open();
      }
        
      } catch (error) {
      console.error('Add to cart error:', error);
        this.showCartMessage('Failed to add items to cart. Please try again.', 'error');
    } finally {
      btn.disabled = false;
      btn.innerHTML = `
          <span class="button-text">Add to Cart</span>
        <span class="button-price">Rs.<span id="final-price">${(this.calculateFinalPrice() * (this.currentState.quantity || 1)).toFixed(2)}</span></span>
        `;
      }
    }
  
    getVariantByFlavor(flavor) {
      const list = this.productData.variants || [];
      return list.find(v => (v.title || '').toLowerCase().includes((flavor || '').toLowerCase()));
    }
  
    calculateFinalPrice() {
    const base = (this.productData.price || 0) / 100;
    // For both single and double, each individual item gets 25% + 20% discount
    const sub = base * 0.75; // 25% subscription discount
    return sub * 0.8; // Additional 20% sale discount = Rs. 60.00 per item
  }
  
    showCartMessage(msg, type) {
      const el = document.getElementById('cart-message');
      if (!el) return;
      el.textContent = msg;
      el.className = `cart-message ${type}`;
      setTimeout(() => { el.textContent = ''; el.className = 'cart-message'; }, 4500);
    }
  
    async updateCartCount() {
      try {
      // Get fresh cart data
      const cart = await (await fetch('/cart.js')).json();
      console.log('Updating cart count to:', cart.item_count);
      
      // Multiple strategies to update cart counter
      
      // Strategy 1: Update Dawn's cart icon bubble section
      try {
        const cartUrl = window.routes?.cart_url || '/cart';
        const response = await fetch(`${cartUrl}?section_id=cart-icon-bubble`);
        const responseText = await response.text();
        const html = new DOMParser().parseFromString(responseText, 'text/html');
        
        const cartIconBubble = document.getElementById('cart-icon-bubble');
        const newCartIconBubble = html.querySelector('#cart-icon-bubble');
        
        if (cartIconBubble && newCartIconBubble) {
          cartIconBubble.innerHTML = newCartIconBubble.innerHTML;
          console.log('Updated cart icon bubble via section refresh');
        }
      } catch (e) {
        console.log('Section refresh failed, using fallback methods');
      }
      
      // Strategy 2: Direct count updates with comprehensive selectors
      const countSelectors = [
        '.cart-count-bubble span',
        '.cart-count-bubble',
        '.cart-count',
        '.cart-item-count',
        '[data-cart-count]',
        '#cart-icon-bubble span',
        '#cart-icon-bubble .cart-count-bubble',
        'cart-icon-bubble span',
        '.header__icon--cart .cart-count-bubble',
        '.header__icon--cart span',
        '[id*="cart"] span',
        '[class*="cart"][class*="count"] span',
        '[class*="cart"][class*="bubble"] span'
      ];
      
      countSelectors.forEach(selector => {
        document.querySelectorAll(selector).forEach(el => {
          if (el && el.textContent !== cart.item_count.toString()) {
            el.textContent = cart.item_count;
            console.log(`Updated cart count via selector ${selector}:`, el);
          }
        });
      });
      
      // Strategy 3: Update any element with cart count attributes
      document.querySelectorAll('[data-cart-count], [data-item-count]').forEach(el => {
        el.setAttribute('data-cart-count', cart.item_count);
        if (el.textContent !== cart.item_count.toString()) {
          el.textContent = cart.item_count;
        }
      });
      
      // Strategy 4: Show/hide cart count bubble based on count
      const bubbles = document.querySelectorAll('.cart-count-bubble, [class*="cart-count"]');
      bubbles.forEach(bubble => {
        if (cart.item_count > 0) {
          bubble.style.display = '';
          bubble.classList.remove('hidden');
          bubble.setAttribute('aria-hidden', 'false');
        } else {
          bubble.style.display = 'none';
          bubble.classList.add('hidden');
          bubble.setAttribute('aria-hidden', 'true');
        }
      });
      
      // Strategy 4.5: Force refresh the entire cart icon section
      try {
        const headerResponse = await fetch(window.location.href + '?section_id=header');
        const headerText = await headerResponse.text();
        const headerHtml = new DOMParser().parseFromString(headerText, 'text/html');
        
        // Find cart icon in the new HTML
        const newCartIcon = headerHtml.querySelector('.header__icon--cart, [href*="cart"], [class*="cart-icon"]');
        const currentCartIcon = document.querySelector('.header__icon--cart, [href*="cart"], [class*="cart-icon"]');
        
        if (newCartIcon && currentCartIcon) {
          currentCartIcon.outerHTML = newCartIcon.outerHTML;
          console.log('Refreshed entire cart icon from header section');
        }
      } catch (e) {
        console.log('Header section refresh failed:', e);
      }
      
      // Strategy 5: Ensure cart icon structure is correct
      const cartLinks = document.querySelectorAll('a[href*="/cart"], .header__icon--cart');
      cartLinks.forEach(cartLink => {
        // Make sure cart icon has proper structure
        if (cart.item_count > 0) {
          let bubble = cartLink.querySelector('.cart-count-bubble');
          if (!bubble) {
            // Create bubble if it doesn't exist
            bubble = document.createElement('span');
            bubble.className = 'cart-count-bubble';
            bubble.setAttribute('aria-hidden', 'false');
            cartLink.appendChild(bubble);
            console.log('Created cart count bubble');
          }
          bubble.textContent = cart.item_count;
          bubble.style.display = '';
          bubble.classList.remove('hidden');
        }
      });
      
      // Strategy 6: Force DOM update by triggering Dawn's cart update events
      if (window.publish && window.PUB_SUB_EVENTS && window.PUB_SUB_EVENTS.cartUpdate) {
        window.publish(window.PUB_SUB_EVENTS.cartUpdate, {
          source: 'subscription-product-count-update',
          cartData: cart
        });
        console.log('Published cart update event');
      }
      
      console.log('Cart count update completed');
      
      } catch (error) {
        console.error('Error updating cart count:', error);
      // Last resort fallback
      setTimeout(async () => {
        try {
          const cart = await (await fetch('/cart.js')).json();
          document.querySelectorAll('*').forEach(el => {
            if (el.textContent && /^\d+$/.test(el.textContent.trim()) && 
                el.classList.toString().includes('cart') || 
                el.id.includes('cart')) {
              el.textContent = cart.item_count;
            }
          });
        } catch {}
      }, 500);
    }
  }

  // New method to override cart pricing display
  async overrideCartPricing() {
    try {
      const cart = await (await fetch('/cart.js')).json();
      console.log('Cart data for pricing override:', cart);
      
      cart.items.forEach((item, index) => {
        console.log(`Item ${index + 1}:`, item);
        console.log('Item properties:', item.properties);
        
        // Check if this item has subscription pricing
        const subscriptionPrice = item.properties && item.properties._subscription_price;
        const originalPrice = item.properties && item.properties._original_price;
        
        console.log('Subscription price:', subscriptionPrice);
        console.log('Original price:', originalPrice);
        
        if (subscriptionPrice) {
          const subscriptionPriceNum = parseFloat(subscriptionPrice);
          const originalPriceNum = parseFloat(originalPrice) || (item.price / 100);
          
          // Calculate line totals
          const subscriptionLineTotal = (subscriptionPriceNum * item.quantity).toFixed(2);
          const originalLineTotal = (originalPriceNum * item.quantity).toFixed(2);
          
          const itemIndex = index + 1;
          
          console.log(`Updating pricing for item ${itemIndex}: ${subscriptionPriceNum} (was ${originalPriceNum})`);
          
          // Update cart drawer prices (if cart drawer is open)
          this.updateCartDrawerPricing(itemIndex, subscriptionPriceNum, originalPriceNum, subscriptionLineTotal, originalLineTotal);
          
          // Update main cart page prices (if on cart page)
          this.updateMainCartPricing(itemIndex, subscriptionPriceNum, originalPriceNum, subscriptionLineTotal, originalLineTotal);
        } else {
          console.log(`No subscription pricing found for item ${index + 1}`);
        }
      });
      
    } catch (error) {
      console.error('Error overriding cart pricing:', error);
    }
  }

  updateCartDrawerPricing(itemIndex, subscriptionPrice, originalPrice, subscriptionLineTotal, originalLineTotal) {
    console.log(`Looking for cart drawer item: #CartDrawer-Item-${itemIndex}`);
    
    // Update individual item price in cart drawer
    const cartDrawerItem = document.querySelector(`#CartDrawer-Item-${itemIndex}`);
    console.log('Found cart drawer item:', cartDrawerItem);
    
    if (cartDrawerItem) {
      // Update individual item price
      const priceElement = cartDrawerItem.querySelector('.product-option');
      console.log('Found price element:', priceElement);
      
      if (priceElement && !priceElement.querySelector('.subscription-price-override')) {
        console.log('Updating price element with subscription pricing');
        priceElement.innerHTML = `
          <span class="subscription-price-override">
            <s style="color: #999; text-decoration: line-through;">$${originalPrice.toFixed(2)}</s>
            <strong style="color: #000; margin-left: 8px;">$${subscriptionPrice.toFixed(2)}</strong>
            <small style="display: block; color: #666; font-size: 0.8em;">Subscription Price</small>
          </span>
        `;
      }
      
      // Update line total
      const totalElement = cartDrawerItem.querySelector('.cart-item__totals .price--end');
      console.log('Found total element:', totalElement);
      
      if (totalElement && !totalElement.classList.contains('subscription-total-override')) {
        console.log('Updating total element with subscription pricing');
        totalElement.classList.add('subscription-total-override');
        totalElement.innerHTML = `
          <s style="color: #999; text-decoration: line-through;">$${originalLineTotal}</s><br>
          <strong style="color: #000;">$${subscriptionLineTotal}</strong>
        `;
      }
    } else {
      console.log(`Cart drawer item #CartDrawer-Item-${itemIndex} not found`);
    }
  }

  updateMainCartPricing(itemIndex, subscriptionPrice, originalPrice, subscriptionLineTotal, originalLineTotal) {
    console.log(`Looking for main cart item with various selectors...`);
    
    // Try multiple selectors for main cart page
    const possibleSelectors = [
      `#CartItem-${itemIndex}`,
      `[data-line="${itemIndex}"]`,
      `.cart-item:nth-child(${itemIndex})`,
      `tr:nth-child(${itemIndex})`,
      `.cart-item[data-index="${itemIndex}"]`
    ];
    
    let cartItem = null;
    for (const selector of possibleSelectors) {
      cartItem = document.querySelector(selector);
      console.log(`Selector ${selector}:`, cartItem);
      if (cartItem) break;
    }
    
    // Also try to find any cart items and target by index
    if (!cartItem) {
      const allCartItems = document.querySelectorAll('.cart-item, tr[id*="CartItem"], [class*="cart-item"]');
      console.log('All cart items found:', allCartItems);
      cartItem = allCartItems[itemIndex - 1]; // 0-based index
      console.log(`Using index-based selection for item ${itemIndex}:`, cartItem);
    }
    
    if (cartItem) {
      console.log('Found main cart item:', cartItem);
      
      // Try multiple selectors for price elements
      const priceSelectors = [
        '.price',
        '.cart-item__price',
        '.money',
        '[data-price]',
        '.product-option',
        'dd'
      ];
      
      let priceElement = null;
      for (const selector of priceSelectors) {
        priceElement = cartItem.querySelector(selector);
        console.log(`Price selector ${selector}:`, priceElement);
        if (priceElement && !priceElement.classList.contains('subscription-price-override')) {
          break;
        }
      }
      
      if (priceElement && !priceElement.classList.contains('subscription-price-override')) {
        console.log('Updating main cart price element');
        priceElement.classList.add('subscription-price-override');
        priceElement.innerHTML = `
          <span style="color: #999; text-decoration: line-through;">Rs. ${originalPrice.toFixed(2)}</span><br>
          <strong style="color: #000;">Rs. ${subscriptionPrice.toFixed(2)}</strong><br>
          <small style="color: #666; font-size: 0.8em;">Subscription Price</small>
        `;
      }
      
      // Try to find total/line price elements
      const totalSelectors = [
        '.cart-item__price-wrapper .price',
        '.cart-item__total .price',
        '.cart-item__price',
        '.total',
        '.line-price'
      ];
      
      let totalElement = null;
      for (const selector of totalSelectors) {
        totalElement = cartItem.querySelector(selector);
        console.log(`Total selector ${selector}:`, totalElement);
        if (totalElement && !totalElement.classList.contains('subscription-total-override')) {
          break;
        }
      }
      
      if (totalElement && !totalElement.classList.contains('subscription-total-override')) {
        console.log('Updating main cart total element');
        totalElement.classList.add('subscription-total-override');
        totalElement.innerHTML = `
          <span style="color: #999; text-decoration: line-through;">Rs. ${originalLineTotal}</span><br>
          <strong style="color: #000;">Rs. ${subscriptionLineTotal}</strong>
        `;
      }
    } else {
      console.log('Main cart item not found with any selector');
      
      // Last resort: find and update ALL price elements on page
      console.log('Attempting global price override...');
      const allPriceElements = document.querySelectorAll('.money, .price, [class*="price"]');
      console.log('All price elements on page:', allPriceElements);
      
      allPriceElements.forEach((el, index) => {
        if (el.textContent.includes('100.00') && !el.classList.contains('subscription-price-override')) {
          console.log(`Updating global price element ${index}:`, el);
          el.classList.add('subscription-price-override');
          el.innerHTML = `
            <span style="color: #999; text-decoration: line-through;">Rs. 100.00</span><br>
            <strong style="color: #000;">Rs. 60.00</strong><br>
            <small style="color: #666; font-size: 0.8em;">Subscription Price</small>
          `;
        }
      });
    }
  }
  
    // ---------- Init ----------
    updateUI() {
      // Ensure default open section works for both UIs
      const newSingle = document.querySelector('.sub-card.single-option');
      if (newSingle) {
        newSingle.classList.add('active', 'is-open');
        newSingle.setAttribute('aria-expanded', 'true');
        const d = newSingle.querySelector('.option-details'); if (d) d.style.display = 'block';
      }
      const oldFlavor2 = document.getElementById('flavor-2');
      if (oldFlavor2) oldFlavor2.style.display = 'none';
  
      this.updateFlavorUI();
      this.updatePricing();
      this.updateIncludedContent();
      this.validateSelections();
    }
  }
  
  // Create global cart pricing override function
window.overrideSubscriptionCartPricing = async function() {
  // Prevent multiple simultaneous runs
  if (window.cartPricingInProgress) {
    console.log('Cart pricing override already in progress, skipping...');
    return;
  }
  
  window.cartPricingInProgress = true;
  
  try {
    const cart = await (await fetch('/cart.js')).json();
    console.log('Global cart pricing override - Cart data:', cart);
    
    cart.items.forEach((item, index) => {
      const subscriptionPrice = item.properties && item.properties._subscription_price;
      const originalPrice = item.properties && item.properties._original_price;
      
      if (subscriptionPrice) {
        const subscriptionPriceNum = parseFloat(subscriptionPrice);
        const originalPriceNum = parseFloat(originalPrice) || (item.price / 100);
        const subscriptionLineTotal = (subscriptionPriceNum * item.quantity).toFixed(2);
        const originalLineTotal = (originalPriceNum * item.quantity).toFixed(2);
        
        console.log(`Global override - Processing item ${index + 1}: ${subscriptionPriceNum} (was ${originalPriceNum})`);
        
        // Try multiple approaches to find cart rows for this item
        const possibleSelectors = [
          `tr[id*="CartItem-${index + 1}"]`, // Dawn theme cart row IDs
          `[data-line="${index + 1}"]`,
          `.cart-item[data-index="${index + 1}"]`,
          `tr:contains("${item.product_title}")`, // Find by product title
          `tr:nth-child(${index + 2})`, // +2 because of header row
          `.cart-item:nth-child(${index + 1})`
        ];
        
        let cartRow = null;
        for (const selector of possibleSelectors) {
          // Skip :contains() selector as it's not standard CSS
          if (selector.includes(':contains(')) continue;
          
          cartRow = document.querySelector(selector);
          if (cartRow && cartRow.tagName !== 'INPUT') { // Make sure it's not an input element
            console.log(`Found cart row with selector ${selector}:`, cartRow);
            break;
          }
        }
        
        // Manual search by product title if selectors fail
        if (!cartRow) {
          console.log('Selector search failed, trying manual search by product title...');
          const allRows = document.querySelectorAll('tr, .cart-item, [class*="cart"]');
          for (const row of allRows) {
            if (row.textContent.includes(item.product_title) && row.tagName !== 'INPUT') {
              cartRow = row;
              console.log(`Found cart row by product title search:`, cartRow);
              break;
            }
          }
        }
        
        // Fallback: use index-based selection from actual cart rows (not inputs)
        if (!cartRow) {
          const allRows = document.querySelectorAll('tr:not(:first-child):not([class*="input"]), .cart-item, [class*="cart-item"]:not(input)');
          cartRow = allRows[index];
          console.log(`Using index-based selection for item ${index + 1}:`, cartRow);
        }
        
        if (cartRow) {
          console.log('Cart row HTML:', cartRow.innerHTML);
          
          // Try comprehensive selectors for price elements
          const priceSelectors = [
            '.money:not(.subscription-price-override)',
            '.price:not(.subscription-price-override)', 
            'dd:not(.subscription-price-override)',
            '[class*="price"]:not(.subscription-price-override)',
            '[class*="money"]:not(.subscription-price-override)',
            'span:not(.subscription-price-override)',
            'div:not(.subscription-price-override)',
            '*:not(.subscription-price-override)'
          ];
          
          let priceElements = [];
          for (const selector of priceSelectors) {
            const elements = cartRow.querySelectorAll(selector);
            console.log(`Selector "${selector}" found ${elements.length} elements:`, elements);
            
            // Filter elements that contain price text
            const priceElementsFromSelector = Array.from(elements).filter(el => {
              const text = el.textContent;
              return text.includes('100.00') || text.includes('Rs.') || text.includes(originalPriceNum.toString());
            });
            
            if (priceElementsFromSelector.length > 0) {
              priceElements = priceElementsFromSelector;
              console.log(`Using selector "${selector}" - found ${priceElements.length} price elements:`, priceElements);
              break;
            }
          }
          
          console.log(`Final price elements for row ${index + 1}:`, priceElements);
          
          if (priceElements.length === 0) {
            console.log('No price elements found with selectors, trying text-based search...');
            // Last resort: find any element in the row containing the price text
            const allElements = cartRow.querySelectorAll('*:not(.subscription-price-override)');
            priceElements = Array.from(allElements).filter(el => {
              const text = el.textContent.trim();
              return (text === 'Rs. 100.00' || text === '100.00' || text.includes('Rs. 100')) && el.children.length === 0;
            });
            console.log('Text-based search found elements:', priceElements);
          }
          
          priceElements.forEach((priceEl, priceIndex) => {
            console.log(`Updating price element ${priceIndex} in row ${index + 1}:`, priceEl);
            priceEl.classList.add('subscription-price-override');
            priceEl.innerHTML = `
              <span style="color: #999; text-decoration: line-through;">Rs. ${originalPriceNum.toFixed(2)}</span><br>
              <strong style="color: #000;">Rs. ${subscriptionPriceNum.toFixed(2)}</strong><br>
              <small style="color: #666; font-size: 0.8em;">Subscription Price</small>
            `;
          });
        } else {
          console.log(`Could not find cart row for item ${index + 1}, trying global approach`);
        }
      }
    });
    
    // Global fallback: Update ALL elements containing subscription prices
    console.log('Running global price update fallback...');
    const allPossiblePriceElements = document.querySelectorAll('*:not(.subscription-price-override)');
    let updatedCount = 0;
    
    allPossiblePriceElements.forEach((el, elIndex) => {
      const text = el.textContent.trim();
      // Look for elements that contain exactly "Rs. 100.00" and have no child elements
      if ((text === 'Rs. 100.00' || text === '100.00') && el.children.length === 0 && !el.querySelector('*')) {
        console.log(`Global fallback - Updating price element ${elIndex}:`, el, 'Text:', text);
        el.classList.add('subscription-price-override');
        el.innerHTML = `
          <span style="color: #999; text-decoration: line-through;">Rs. 100.00</span><br>
          <strong style="color: #000;">Rs. 60.00</strong>
        `;
        updatedCount++;
      }
    });
    
    console.log(`Global fallback updated ${updatedCount} price elements`);
    
    // Update cart totals
    updateCartTotals();
    
  } catch (error) {
    console.error('Global cart pricing override error:', error);
  } finally {
    // Reset the flag after a delay
    setTimeout(() => {
      window.cartPricingInProgress = false;
    }, 1000);
  }
};

// Function to update cart totals with subscription pricing
function updateCartTotals() {
  fetch('/cart.js')
    .then(response => response.json())
    .then(cart => {
      console.log('Updating cart totals...');
      
      let subscriptionTotal = 0;
      let hasSubscriptionItems = false;
      
      cart.items.forEach(item => {
        const subscriptionPrice = item.properties && item.properties._subscription_price;
        if (subscriptionPrice) {
          subscriptionTotal += parseFloat(subscriptionPrice) * item.quantity;
          hasSubscriptionItems = true;
        } else {
          // Add non-subscription items at original price
          subscriptionTotal += (item.price / 100) * item.quantity;
        }
      });
      
      if (hasSubscriptionItems) {
        console.log(`Calculated subscription total: Rs. ${subscriptionTotal.toFixed(2)}`);
        
        // Find and update estimated total elements
        const totalSelectors = [
          '.totals__total-value',
          '.cart__total .price',
          '.estimated-total .price',
          '[class*="total"] .price',
          '[class*="total"]'
        ];
        
        let totalUpdated = false;
        for (const selector of totalSelectors) {
          const totalElements = document.querySelectorAll(selector);
          totalElements.forEach(el => {
            if (el.textContent.includes('200.00') || el.textContent.includes('Rs. 200') || 
                el.textContent.includes(cart.total_price / 100)) {
              console.log(`Updating total element with selector ${selector}:`, el);
              el.innerHTML = `
                <span style="color: #999; text-decoration: line-through;">Rs. ${(cart.total_price / 100).toFixed(2)}</span><br>
                <strong style="color: #000;">Rs. ${subscriptionTotal.toFixed(2)}</strong>
              `;
              totalUpdated = true;
            }
          });
          if (totalUpdated) break;
        }
        
        // Fallback: find any element with the original total and update it
        if (!totalUpdated) {
          console.log('Using fallback total update method...');
          const allElements = document.querySelectorAll('*:not(.subscription-price-override)');
          allElements.forEach(el => {
            const text = el.textContent.trim();
            if ((text === `Rs. ${(cart.total_price / 100).toFixed(2)}` || text === `${(cart.total_price / 100).toFixed(2)}`) 
                && el.children.length === 0) {
              console.log('Updating total via fallback method:', el);
              el.innerHTML = `
                <span style="color: #999; text-decoration: line-through;">Rs. ${(cart.total_price / 100).toFixed(2)}</span><br>
                <strong style="color: #000;">Rs. ${subscriptionTotal.toFixed(2)}</strong>
              `;
            }
          });
        }
      }
    })
    .catch(error => {
      console.error('Error updating cart totals:', error);
    });
}

// Boot
  document.addEventListener('DOMContentLoaded', () => {
  // Run subscription page functionality if on product page
  if (document.querySelector('.subscription-product-container')) {
    const subscriptionPage = new SubscriptionProductPage();
  }
  
  // Run cart pricing override on any page (but only once)
  if (window.location.pathname.includes('/cart') || document.querySelector('cart-drawer')) {
    console.log('Setting up cart pricing override...');
    
    // Override pricing on page load (only once)
    setTimeout(() => {
      window.overrideSubscriptionCartPricing();
    }, 1000);
    
    // Override pricing when cart changes via Shopify events (no loops)
    if (window.subscribe && window.PUB_SUB_EVENTS) {
      window.subscribe(window.PUB_SUB_EVENTS.cartUpdate, () => {
        setTimeout(() => {
          window.overrideSubscriptionCartPricing();
        }, 200);
      });
    }
    
    // Override pricing when cart drawer opens (no loop)
    const cartDrawer = document.querySelector('cart-drawer');
    if (cartDrawer) {
      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
            if (cartDrawer.classList.contains('active')) {
              setTimeout(() => {
                window.overrideSubscriptionCartPricing();
              }, 300);
            }
          }
        });
      });
      observer.observe(cartDrawer, { attributes: true, attributeFilter: ['class'] });
    }
  }
  });