/* =========================================================
   DigitalCode – app.js (full)
   ========================================================= */
(() => {
  'use strict';

  /* ------------------ utils ------------------ */
  const $  = (q, r = document) => r.querySelector(q);
  const $$ = (q, r = document) => Array.from(r.querySelectorAll(q));
  const LS_KEY = 'dc_cart_v1';

  const fmtNPR = (n) => 'NPR ' + new Intl.NumberFormat('en-NP').format(Number(n || 0));
  const parsePrice = (t) => Number(String(t || '').replace(/[^\d]/g, '')) || 0;

  /* ------------------ cart store ------------------ */
  function getCart() {
    try {
      const raw = localStorage.getItem(LS_KEY);
      const parsed = raw ? JSON.parse(raw) : null;
      if (!parsed || !Array.isArray(parsed.items)) return { items: [] };
      return parsed;
    } catch { return { items: [] }; }
  }

  function saveCart(cart) {
    localStorage.setItem(LS_KEY, JSON.stringify(cart));
    updateCartBadge(cart);
    updateCheckoutState(cart);
  }

  function cartTotal(cart) {
    return cart.items.reduce((s, i) => s + i.price * i.qty, 0);
  }

  function cartQty(cart) {
    return cart.items.reduce((s, i) => s + i.qty, 0);
  }

  function updateCartBadge(cart = getCart()) {
    $$('.open-cart .cart-count').forEach(el => {
      el.textContent = String(cartQty(cart));
    });
  }

  /* ------------------ cart drawer ------------------ */
  const drawer  = $('#cartDrawer');
  const itemsEl = $('#cartItems');
  const subEl   = $('#cartSubtotal');
  const clearBtn = $('#clearCart');
  const checkoutBtn = $('#checkoutBtn');

  function openCart() {
    if (!drawer) return;
    drawer.classList.add('is-open');
    drawer.setAttribute('aria-hidden', 'false');
    document.documentElement.style.overflow = 'hidden';
    renderCart(); // ensure fresh
  }

  function closeCart() {
    if (!drawer) return;
    drawer.classList.remove('is-open');
    drawer.setAttribute('aria-hidden', 'true');
    document.documentElement.style.overflow = '';
  }

  // expose so toast can open
  window.openCart = openCart;

  function updateCheckoutState(cart = getCart()) {
    if (!checkoutBtn || !subEl) return;
    const total = cartTotal(cart);
    subEl.textContent = fmtNPR(total);
    checkoutBtn.disabled = cart.items.length === 0;
  }

  function renderCart() {
    if (!itemsEl) return;
    const cart = getCart();

    // keep newest (ts desc) order
    cart.items.sort((a, b) => (b.ts || 0) - (a.ts || 0));

    itemsEl.innerHTML = '';
    cart.items.forEach(it => {
      const row = document.createElement('div');
      row.className = 'cart-item';
      row.dataset.id = it.id;
      row.innerHTML = `
        <img src="${it.img || ''}" alt="" />
        <div>
          <p class="cart-title">${it.title}</p>
          <div class="qty" role="group" aria-label="Quantity">
            <button class="qdec" data-dec="${it.id}" aria-label="Decrease">–</button>
            <input type="text" value="${it.qty}" inputmode="numeric" aria-label="Quantity" readonly />
            <button class="qinc" data-inc="${it.id}" aria-label="Increase">+</button>
          </div>
        </div>
        <div class="item-actions">
          <div class="item-price">${fmtNPR(it.price)}</div>
          <button class="icon tiny danger" data-remove="${it.id}" aria-label="Remove">
            <!-- modern trash icon -->
            <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
              <path fill="currentColor" d="M9 3h6a1 1 0 0 1 1 1v1h4a1 1 0 1 1 0 2h-1v12a3 3 0 0 1-3 3H8a3 3 0 0 1-3-3V7H4a1 1 0 1 1 0-2h4V4a1 1 0 0 1 1-1Zm1 3h4V5h-4v1ZM7 7v12a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V7H7Zm3 3a1 1 0 0 1 1 1v6a1 1 0 1 1-2 0v-6a1 1 0 0 1 1-1Zm4 0a1 1 0 0 1 1 1v6a1 1 0 1 1-2 0v-6a1 1 0 0 1 1-1Z"/>
            </svg>
          </button>
        </div>
      `;
      itemsEl.appendChild(row);
    });

    updateCheckoutState(cart);
  }

  // Only close when clicking overlay or close buttons
  document.addEventListener('click', (e) => {
    if (e.target.closest('[data-close-cart]')) closeCart();
  });
  // Keep clicks inside panel from closing (we don't have global closer, but safe)
  $('.cart-panel')?.addEventListener('click', (e) => e.stopPropagation());

  // open cart buttons
  $$('.open-cart').forEach(btn => btn.addEventListener('click', (e) => {
    e.preventDefault(); openCart();
  }));

  // Esc key to close
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && drawer?.classList.contains('is-open')) closeCart();
  });

  // quantity / remove (event delegation)
  itemsEl?.addEventListener('click', (e) => {
    const dec = e.target.closest('[data-dec]');
    const inc = e.target.closest('[data-inc]');
    const rem = e.target.closest('[data-remove]');
    if (!dec && !inc && !rem) return;

    const cart = getCart();

    if (inc) {
      const id = inc.getAttribute('data-inc');
      const it = cart.items.find(i => i.id === id);
      if (it) it.qty += 1;
    }
    if (dec) {
      const id = dec.getAttribute('data-dec');
      const it = cart.items.find(i => i.id === id);
      if (it) { it.qty -= 1; if (it.qty <= 0) cart.items = cart.items.filter(i => i.id !== id); }
    }
    if (rem) {
      const id = rem.getAttribute('data-remove');
      cart.items = cart.items.filter(i => i.id !== id);
    }

    saveCart(cart);
    renderCart(); // keep drawer open and UI fresh
  });

  // clear cart
  clearBtn?.addEventListener('click', () => {
    saveCart({ items: [] });
    renderCart();
  });

  // checkout via WhatsApp
  checkoutBtn?.addEventListener('click', () => {
    const cart = getCart();
    if (!cart.items.length) return;

    const lines = cart.items.map(i => `• ${i.title} x${i.qty} — ${fmtNPR(i.price * i.qty)}`);
    lines.push(`\nSubtotal: ${fmtNPR(cartTotal(cart))}`);
    const msg = encodeURIComponent(`Hello DigitalCode,\nI'd like to buy:\n${lines.join('\n')}`);
    window.open(`https://wa.me/9779818713854?text=${msg}`, '_blank');
  });

  /* ------------------ product add-to-cart + toast ------------------ */
  function readProductFromCard(card) {
    const title = card.querySelector('h3')?.textContent.trim() || 'Product';
    const img   = card.querySelector('img')?.getAttribute('src') || '';
    const price = parsePrice(card.querySelector('.price .new')?.textContent);
    const id    = card.id || ('prod-' + title.toLowerCase().replace(/[^a-z0-9]+/g,'-'));
    return { id, title, img, price, qty: 1 };
  }

  // Add to cart on any card
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('.btn.add');
    if (!btn) return;
    e.preventDefault();

    const card = btn.closest('.card');
    if (!card) return;

    const item = readProductFromCard(card);
    const cart = getCart();
    const found = cart.items.find(i => i.id === item.id);

    if (found) {
      found.qty += 1;
    } else {
      item.ts = Date.now();  // newest first
      cart.items.unshift(item);
    }

    saveCart(cart);

    // Toast (no drawer auto-open)
    showToast({
      title: found ? 'Quantity updated' : 'Added to cart',
      subtitle: item.title,
      img: item.img,
      onViewCart: openCart
    });
  });

  /* ------------------ toast helper ------------------ */
  (function setupToasts(){
    let wrap = document.getElementById('toastWrap');
    if (!wrap) {
      wrap = document.createElement('div');
      wrap.id = 'toastWrap';
      wrap.className = 'toast-wrap';
      document.body.appendChild(wrap);
    }

    window.showToast = function({ title='Added to cart', subtitle='', img='', onViewCart } = {}){
      const t = document.createElement('div');
      t.className = 'toast';
      t.innerHTML = `
        <img class="toast__img" src="${img}" alt="">
        <div class="toast__body">
          <span class="toast__title">${title}</span>
          <div>${subtitle}</div>
        </div>
        <div class="toast__actions">
          <button class="toast__btn" type="button">View</button>
        </div>
      `;
      wrap.appendChild(t);

      const dismiss = () => {
        t.style.transition = 'opacity .2s ease, transform .2s ease';
        t.style.opacity = '0';
        t.style.transform = 'translateY(8px)';
        setTimeout(() => t.remove(), 200);
      };

      let timer = setTimeout(dismiss, 2600);
      t.addEventListener('mouseenter', () => clearTimeout(timer));
      t.addEventListener('mouseleave', () => { timer = setTimeout(dismiss, 1200); });
      t.addEventListener('click', (e) => {
        if (e.target.closest('.toast__btn')) {
          if (typeof onViewCart === 'function') onViewCart();
          dismiss();
        }
      });
    };
  })();

  /* ------------------ slider (auto, pause on hover) ------------------ */
  (function slider(){
    const slider = $('#dealSlider');
    if (!slider) return;
    const slides = $$('.deal-slide', slider);
    if (!slides.length) return;

    let i = 0, t, delay = 2500;
    const show = (n) => {
      slides[i]?.classList.remove('is-active');
      i = (n + slides.length) % slides.length;
      slides[i]?.classList.add('is-active');
    };
    const start = () => { stop(); t = setInterval(() => show(i+1), delay); };
    const stop  = () => { if (t) clearInterval(t); t = null; };

    slides.forEach(s => s.classList.remove('is-active'));
    slides[0].classList.add('is-active');

    slider.addEventListener('mouseenter', stop);
    slider.addEventListener('mouseleave', start);
    start();
  })();

  /* ------------------ search with suggestions ------------------ */
  (function search(){
    const form  = $('#searchForm');
    const input = $('#siteSearch');
    const panel = $('#searchResults');
    if (!form || !input || !panel) return;

    // build index from visible cards (home + catalog)
    const cards = $$('#catalog .card, #home-catalog .card');
    const index = cards.map(el => {
      const title = (el.querySelector('h3')?.textContent || '').trim();
      const desc  = (el.querySelector('.desc')?.textContent || '').trim();
      const alt   = (el.querySelector('img')?.getAttribute('alt') || '').trim();
      const tags  = (el.getAttribute('data-tags') || '').trim();
      if (!el.id) el.id = 'prod-' + title.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
      return { el, id: el.id, title, desc, alt, tags,
               hay: [title, desc, alt, tags].join(' ').toLowerCase() };
    });

    function score(q, it){
      const s = q.toLowerCase().trim();
      let sc = 0;
      if (it.title.toLowerCase().includes(s)) sc += 3;
      if (it.tags?.toLowerCase().includes(s)) sc += 2;
      if (it.desc.toLowerCase().includes(s) || it.alt.toLowerCase().includes(s)) sc += 1;
      return sc;
    }
    function resultsFor(q){
      if (!q || !q.trim()) return [];
      return index
        .map(item => ({ item, sc: score(q, item) }))
        .filter(x => x.sc > 0)
        .sort((a,b) => b.sc - a.sc || a.item.title.localeCompare(b.item.title))
        .slice(0,6).map(x => x.item);
    }
    function renderPanel(list){
      panel.innerHTML = '';
      if (!list.length) {
        panel.innerHTML = '<div class="empty">No matching products</div>';
        panel.hidden = false; return;
      }
      list.forEach(({ title, id }) => {
        const b = document.createElement('button');
        b.type = 'button'; b.textContent = title;
        b.addEventListener('click', () => {
          navigateTo(id); panel.hidden = true;
        });
        panel.appendChild(b);
      });
      panel.hidden = false;
    }
    function navigateTo(cardId){
      const el = document.getElementById(cardId);
      if (!el) return;
      const section = el.closest('section') || $('#catalog') || document.body;
      section.scrollIntoView({ behavior:'smooth', block:'start' });
      setTimeout(() => {
        el.classList.remove('is-found');
        el.scrollIntoView({ behavior:'smooth', block:'center' });
        el.classList.add('is-found');
        setTimeout(() => el.classList.remove('is-found'), 2200);
      }, 350);
    }

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const q = input.value.trim();
      const list = resultsFor(q);
      if (list.length) navigateTo(list[0].id);
      else renderPanel([]);
    });

    let t; input.addEventListener('input', () => {
      clearTimeout(t);
      const q = input.value;
      t = setTimeout(() => {
        if (!q.trim()) { panel.hidden = true; return; }
        renderPanel(resultsFor(q));
      }, 150);
    });

    document.addEventListener('click', (e) => {
      if (!panel.contains(e.target) && !form.contains(e.target)) panel.hidden = true;
    });
  })();

  /* ------------------ init on load ------------------ */
  updateCartBadge(getCart());
  renderCart();
})();
