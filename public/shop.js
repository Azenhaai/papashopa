/* PapaShopa client store — everything lives in localStorage, no backend.
   Keys: ps-cart {slug: qty}, ps-orders [order], ps-profile {name,email,card,created}. */
(function () {
  'use strict';

  var LS = {
    get: function (key, fallback) {
      try {
        var raw = localStorage.getItem(key);
        return raw ? JSON.parse(raw) : fallback;
      } catch (e) {
        return fallback;
      }
    },
    set: function (key, value) {
      try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) {}
    },
  };

  var TIERS = [
    { id: 'bronze', name: 'Bronze', min: 0, discount: 0 },
    { id: 'silver', name: 'Silver', min: 150, discount: 3 },
    { id: 'gold', name: 'Gold', min: 400, discount: 5 },
  ];

  function getCart() { return LS.get('ps-cart', {}); }
  function setCart(cart) { LS.set('ps-cart', cart); updateBadge(); }

  function addToCart(slug, qty) {
    var cart = getCart();
    cart[slug] = (cart[slug] || 0) + (qty || 1);
    setCart(cart);
  }

  function setQty(slug, qty) {
    var cart = getCart();
    if (qty <= 0) delete cart[slug];
    else cart[slug] = qty;
    setCart(cart);
  }

  function cartCount() {
    var cart = getCart();
    return Object.keys(cart).reduce(function (sum, k) { return sum + cart[k]; }, 0);
  }

  function cartLines() {
    var cart = getCart();
    var catalog = window.PAPA_CATALOG || {};
    return Object.keys(cart)
      .filter(function (slug) { return catalog[slug]; })
      .map(function (slug) {
        var p = catalog[slug];
        return { slug: slug, name: p.name, emoji: p.emoji, price: p.price, qty: cart[slug], total: p.price * cart[slug] };
      });
  }

  function cartSubtotal() {
    return cartLines().reduce(function (sum, l) { return sum + l.total; }, 0);
  }

  function getProfile() {
    var profile = LS.get('ps-profile', null);
    if (!profile) {
      var digits = '';
      for (var i = 0; i < 12; i++) digits += Math.floor(Math.random() * 10);
      profile = { name: '', email: '', card: digits, created: new Date().toISOString() };
      LS.set('ps-profile', profile);
    }
    return profile;
  }

  function saveProfile(patch) {
    var profile = getProfile();
    Object.keys(patch).forEach(function (k) { profile[k] = patch[k]; });
    LS.set('ps-profile', profile);
    return profile;
  }

  function getOrders() { return LS.get('ps-orders', []); }

  function lifetimePoints() {
    return getOrders().reduce(function (sum, o) { return sum + (o.pointsEarned || 0); }, 0);
  }

  function tierFor(points) {
    var tier = TIERS[0];
    TIERS.forEach(function (t) { if (points >= t.min) tier = t; });
    return tier;
  }

  function currentTier() { return tierFor(lifetimePoints()); }

  function nextTier() {
    var points = lifetimePoints();
    for (var i = 0; i < TIERS.length; i++) {
      if (points < TIERS[i].min) return TIERS[i];
    }
    return null;
  }

  function placeOrder(details) {
    var lines = cartLines();
    if (!lines.length) return null;
    var subtotal = cartSubtotal();
    var tier = currentTier();
    var discount = subtotal * (tier.discount / 100);
    var shipping = details.shippingCost || 0;
    var total = subtotal - discount + shipping;
    var order = {
      id: 'PS-' + Date.now().toString(36).toUpperCase(),
      date: new Date().toISOString(),
      lines: lines,
      subtotal: subtotal,
      discountPct: tier.discount,
      discount: discount,
      shipping: shipping,
      shippingLabel: details.shippingLabel || 'Standard',
      total: total,
      address: details.address || {},
      pointsEarned: Math.round(total),
    };
    var orders = getOrders();
    orders.unshift(order);
    LS.set('ps-orders', orders);
    setCart({});
    return order;
  }

  function money(n) { return '€' + n.toFixed(2); }

  function updateBadge() {
    var count = cartCount();
    document.querySelectorAll('[data-cart-badge]').forEach(function (el) {
      el.textContent = count;
      el.classList.toggle('on', count > 0);
    });
  }

  window.PS = {
    TIERS: TIERS,
    getCart: getCart,
    addToCart: addToCart,
    setQty: setQty,
    cartCount: cartCount,
    cartLines: cartLines,
    cartSubtotal: cartSubtotal,
    getProfile: getProfile,
    saveProfile: saveProfile,
    getOrders: getOrders,
    lifetimePoints: lifetimePoints,
    tierFor: tierFor,
    currentTier: currentTier,
    nextTier: nextTier,
    placeOrder: placeOrder,
    money: money,
    updateBadge: updateBadge,
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', updateBadge);
  } else {
    updateBadge();
  }
})();
