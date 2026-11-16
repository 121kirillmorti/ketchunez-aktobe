(function () {
  'use strict';

  /* ============================================================
     Helpers
     ============================================================ */
  const $ = (sel, root) => (root || document).querySelector(sel);
  const $$ = (sel, root) => Array.prototype.slice.call((root || document).querySelectorAll(sel));
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const money = n => Math.round(n).toLocaleString('ru-RU').replace(/[\u00A0\u202F]/g, ' ') + ' ₸';
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const plural = (n, forms) => {
    const a = Math.abs(n) % 100;
    const b = a % 10;
    if (a > 10 && a < 20) return forms[2];
    if (b > 1 && b < 5) return forms[1];
    if (b === 1) return forms[0];
    return forms[2];
  };
  const pad2 = n => (n < 10 ? '0' : '') + n;
  const todayKey = () => {
    const d = new Date();
    return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate());
  };

  const store = {
    get(key, fallback) {
      try {
        const v = localStorage.getItem(key);
        return v === null ? fallback : v;
      } catch (e) { return fallback; }
    },
    set(key, value) {
      try { localStorage.setItem(key, value); } catch (e) { /* ignore */ }
    }
  };

  const toast = (msg, type) => {
    const wrap = $('#toasts');
    if (!wrap) return;
    const el = document.createElement('div');
    el.className = 'toast' + (type ? ' toast--' + type : '');
    el.textContent = msg;
    wrap.appendChild(el);
    setTimeout(() => {
      el.classList.add('out');
      setTimeout(() => el.remove(), 300);
    }, 3000);
  };

  /* ============================================================
     Icons
     ============================================================ */
  const ICONS = {
    fries: '<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14 18h20l-2.5 22h-15L14 18Z"/><path d="M19 18V9m5 9V6.5m5 11.5V10"/><path d="M16.5 27h15"/></svg>',
    nuggets: '<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 20h24l-3 18H15l-3-18Z"/><circle cx="19" cy="28" r="3.2"/><circle cx="27" cy="25" r="3.2"/><circle cx="30" cy="32" r="2.8"/><circle cx="21" cy="34" r="2.6"/></svg>',
    cup: '<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 14h18l-2.5 26h-13L15 14Z"/><path d="M17 22h14"/><path d="M24 14l4-7"/><path d="M15 14c2 2 16 2 18 0"/></svg>',
    bottle: '<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6h8v6l3 5v23H17V17l3-5V6Z"/><path d="M20 6h8"/><path d="M17 23h14"/><path d="M22 30h4"/></svg>',
    water: '<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M24 7c5.5 7.5 9 11.5 9 17.5a9 9 0 0 1-18 0C15 18.5 18.5 14.5 24 7Z"/><path d="M20 27c0 2.2 1.5 4 4 4"/></svg>',
    glass: '<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14 8h20l-3 30H17L14 8Z"/><path d="M15.5 21h17"/><path d="M18 28h12"/></svg>',
    pepper: '<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M29 12c2 0 3 2 2 4-2 6-8 13-14 15-4 1-7-1-6-5 1-6 8-12 13-13 2-1 3-1 5-1Z"/><path d="M29 12c0-3 2-5 5-5"/><path d="M22 19c-2 2-4 4-5 7"/></svg>',
    sauce: '<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M13 21h22l-2 15H15l-2-15Z"/><path d="M13 21c0-3 5-5 11-5s11 2 11 5"/><path d="M19 28c2 2 8 2 10 0"/></svg>',
    chicken: '<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M32 9c4 2 5 7 2 11-3 3-7 3-10 6-2 2-2 5-5 6-4 1-7-2-6-6 1-4 4-5 7-7 4-2 5-6 7-8 2-2 3-2 5-2Z"/><path d="M20 31l-4 4"/><path d="M25 17c1-1 3-1 4 0"/></svg>'
  };

  /* ============================================================
     Menu data
     ============================================================ */
  const SIZES = [
    { label: '25 см', extra: 0 },
    { label: '30 см', extra: 600 },
    { label: '35 см', extra: 1100 }
  ];

  const DONER_OPTS = [
    { label: 'Острый', extra: 0 },
    { label: 'Сырный', extra: 250 },
    { label: 'Двойное мясо', extra: 550 }
  ];

  const PROMOS = {
    GAME10: { code: 'GAME10', label: 'Скидка 10%', type: 'percent', value: 10 },
    WHEEL5: { code: 'WHEEL5', label: 'Скидка 5%', type: 'percent', value: 5 },
    WHEEL10: { code: 'WHEEL10', label: 'Скидка 10%', type: 'percent', value: 10 },
    WHEEL15: { code: 'WHEEL15', label: 'Скидка 15%', type: 'percent', value: 15 },
    FREEDELIVERY: { code: 'FREEDELIVERY', label: 'Бесплатная доставка', type: 'freeDelivery', value: 0 },
    FREEDRINK: { code: 'FREEDRINK', label: 'Напиток в подарок (600 ₸)', type: 'fixed', value: 600 },
    BONUS200: { code: 'BONUS200', label: 'Бонус 200 ₸', type: 'fixed', value: 200 }
  };

  const PAYMENT_LABELS = { card: 'Картой курьеру', cash: 'Наличными', kaspi: 'Kaspi QR' };

  const PRODUCTS = [
    { id: 'margarita', cat: 'pizza', name: 'Маргарита', desc: 'Томатный соус, моцарелла, свежий базилик', price: 1690, img: 'assets/menu/pizza_margarita.png', tag: 'Хит', sizes: true },
    { id: 'pepperoni', cat: 'pizza', name: 'Пепперони', desc: 'Острая пепперони, моцарелла, томатный соус', price: 1890, img: 'assets/menu/pizza_pepperoni.png', tag: 'Остро', sizes: true },
    { id: 'chicken-mushroom', cat: 'pizza', name: 'Курица с грибами', desc: 'Курица, шампиньоны, сливочный соус', price: 2090, img: 'assets/menu/pizza_chicken_mushroom.png', sizes: true },
    { id: 'four-cheese', cat: 'pizza', name: '4 сыра', desc: 'Моцарелла, чеддер, пармезан и дор блю', price: 2090, img: 'assets/menu/pizza_four_cheese.png', tag: 'Вег', sizes: true },
    { id: 'bolognese', cat: 'pizza', name: 'Болоньезе', desc: 'Говядина болоньезе, томаты, пармезан', price: 2490, img: 'assets/menu/pizza_bolognese.png', tag: 'Новинка', sizes: true },
    { id: 'set-1', cat: 'pizza', name: 'Пицца-сет №1', desc: 'Маргарита + курица с грибами + 4 сыра', price: 5190, img: 'assets/menu/set_1.jpg', cover: true, tag: 'Выгодно' },
    { id: 'set-2', cat: 'pizza', name: 'Пицца-сет №2', desc: 'Пепперони + болоньезе + 4 сыра', price: 5690, img: 'assets/menu/set_2.jpg', cover: true, tag: 'Выгодно' },

    { id: 'picconer', cat: 'doner', name: 'Пиццонер', desc: 'Пицца-лепёшка, курица, овощи, фирменный соус', price: 1290, img: 'assets/menu/picconer.jpg', cover: true, tag: 'Хит', opts: true },
    { id: 'doner-ketchunez', cat: 'doner', name: 'Донер-Кетчунез', desc: 'Курица, овощи, кетчунез, фирменный соус', price: 1290, img: 'assets/menu/doner_ketchunez.jpg', cover: true, opts: true },
    { id: 'doner-paltaraha', cat: 'doner', name: 'Донер-Палтараха', desc: 'Курица, овощи, халапеньо, сырный соус', price: 1690, img: 'assets/menu/doner_paltaraha.jpg', cover: true, opts: true },
    { id: 'combo-picconer', cat: 'doner', name: 'Пиццонер + Кола', desc: 'Пиццонер и напиток 0,5 л по акции', price: 1290, img: 'assets/menu/picconer.jpg', cover: true, tag: 'Акция' },

    { id: 'chicken-8', cat: 'snack', name: 'Чикен 8 шт', desc: 'Хрустящий чикен с соусом на выбор', price: 2190, img: 'assets/menu/chicken_8.png' },
    { id: 'chicken-16', cat: 'snack', name: 'Чикен 16 шт', desc: 'Большая порция для компании', price: 3690, img: 'assets/menu/chicken_16.png' },
    { id: 'fries', cat: 'snack', name: 'Картофель фри', desc: 'Хрустящая соломка с фирменной солью', price: 690, icon: 'fries' },
    { id: 'nuggets', cat: 'snack', name: 'Наггетсы 6 шт', desc: 'Куриное филе в хрустящей панировке', price: 790, icon: 'nuggets' },
    { id: 'cola-05', cat: 'snack', name: 'Кола 0,5 л', desc: 'Кола, фанта или спрайт', price: 600, icon: 'cup' },
    { id: 'cola-1', cat: 'snack', name: 'Кола 1 л', desc: 'Кола, фанта или спрайт', price: 850, icon: 'bottle' },
    { id: 'water', cat: 'snack', name: 'Мини вода 0,5 л', desc: 'Питьевая вода без газа', price: 400, icon: 'water' },
    { id: 'ayran', cat: 'snack', name: 'Айран', desc: 'Освежающий кисломолочный напиток', price: 400, icon: 'glass' },
    { id: 'jalapeno', cat: 'snack', name: 'Халепеньо', desc: 'Маринованный острый перец', price: 100, icon: 'pepper' },
    { id: 'ketchup', cat: 'snack', name: 'Кетчуп', desc: 'Классический томатный соус', price: 100, icon: 'sauce' },
    { id: 'cheese-sauce', cat: 'snack', name: 'Сырный соус', desc: 'Густой соус из моцареллы', price: 150, icon: 'sauce' },
    { id: 'white-sauce', cat: 'snack', name: 'Белый соус', desc: 'Чесночно-сливочный соус', price: 100, icon: 'sauce' }
  ];

  const findProduct = id => PRODUCTS.find(p => p.id === id);

  /* ============================================================
     State
     ============================================================ */
  let activeCat = 'all';
  let cart = {};
  let promo = null;
  let firstCartRender = true;

  const sel = {};
  PRODUCTS.forEach(p => { sel[p.id] = { size: 0, opts: [] }; });

  try {
    const parsed = JSON.parse(store.get('kv_cart', '{}'));
    if (parsed && typeof parsed === 'object') {
      Object.keys(parsed).forEach(k => {
        const it = parsed[k];
        if (it && it.name && it.qty > 0 && it.unit >= 0) cart[k] = it;
      });
    }
  } catch (e) { cart = {}; }

  const savedPromo = store.get('kv_promo', '');
  if (savedPromo && PROMOS[savedPromo]) promo = PROMOS[savedPromo];

  function unitPrice(p) {
    let total = p.price;
    const s = sel[p.id];
    if (!s) return total;
    if (p.sizes) total += SIZES[s.size] ? SIZES[s.size].extra : 0;
    if (p.opts) s.opts.forEach(i => { if (DONER_OPTS[i]) total += DONER_OPTS[i].extra; });
    return total;
  }

  /* ============================================================
     Menu
     ============================================================ */
  const menuGrid = $('#menuGrid');

  function mediaHTML(p) {
    if (p.img) {
      return '<div class="pcard__media' + (p.cover ? ' is-cover' : '') + '">' +
        '<img src="' + p.img + '" alt="' + esc(p.name) + '">' +
        (p.tag ? '<span class="pcard__tag">' + p.tag + '</span>' : '') +
      '</div>';
    }
    return '<div class="pcard__media">' +
      '<div class="icon-tile">' + (ICONS[p.icon] || ICONS.sauce) + '</div>' +
      (p.tag ? '<span class="pcard__tag">' + p.tag + '</span>' : '') +
    '</div>';
  }

  function cardHTML(p, i) {
    const s = sel[p.id];
    const options = [];

    if (p.sizes) {
      options.push(
        '<div class="pcard__opts">' +
          '<span class="opt-label">Размер</span>' +
          '<div class="chips">' +
            SIZES.map((z, idx) =>
              '<button type="button" class="chip' + (idx === s.size ? ' active' : '') + '" data-size="' + idx + '" data-id="' + p.id + '">' +
                z.label + (z.extra ? '<small>+' + money(z.extra) + '</small>' : '') +
              '</button>'
            ).join('') +
          '</div>' +
        '</div>'
      );
    }

    if (p.opts) {
      options.push(
        '<div class="pcard__opts">' +
          '<span class="opt-label">Опции</span>' +
          '<div class="chips">' +
            DONER_OPTS.map((o, idx) =>
              '<button type="button" class="chip' + (s.opts.indexOf(idx) !== -1 ? ' active' : '') + '" data-opt="' + idx + '" data-id="' + p.id + '">' +
                o.label + (o.extra ? '<small>+' + money(o.extra) + '</small>' : '') +
              '</button>'
            ).join('') +
          '</div>' +
        '</div>'
      );
    }

    return '<article class="pcard" data-card="' + p.id + '" style="animation-delay:' + (i * 35) + 'ms">' +
      mediaHTML(p) +
      '<div class="pcard__body">' +
        '<h3 class="pcard__title">' + p.name + '</h3>' +
        '<p class="pcard__desc">' + p.desc + '</p>' +
        options.join('') +
      '</div>' +
      '<div class="pcard__foot">' +
        '<span class="price" data-price>' + money(unitPrice(p)) + '</span>' +
        '<button class="add-btn" type="button" data-add="' + p.id + '">В корзину</button>' +
      '</div>' +
    '</article>';
  }

  function renderMenu() {
    if (!menuGrid) return;
    const list = PRODUCTS.filter(p => activeCat === 'all' || p.cat === activeCat);
    menuGrid.innerHTML = list.map(cardHTML).join('');
  }

  function refreshCard(id) {
    const p = findProduct(id);
    if (!p) return;
    const card = menuGrid.querySelector('[data-card="' + id + '"]');
    if (!card) return;
    const s = sel[id];

    $$('[data-size]', card).forEach(b => b.classList.toggle('active', Number(b.dataset.size) === s.size));
    $$('[data-opt]', card).forEach(b => b.classList.toggle('active', s.opts.indexOf(Number(b.dataset.opt)) !== -1));

    const priceEl = card.querySelector('[data-price]');
    if (priceEl) {
      priceEl.textContent = money(unitPrice(p));
      priceEl.classList.remove('bump');
      void priceEl.offsetWidth;
      priceEl.classList.add('bump');
    }
  }

  function setCat(cat) {
    activeCat = cat;
    $$('.seg').forEach(b => {
      const on = b.dataset.cat === cat;
      b.classList.toggle('active', on);
      b.setAttribute('aria-selected', on ? 'true' : 'false');
    });
    renderMenu();
  }

  if (menuGrid) {
    menuGrid.addEventListener('click', e => {
      const sizeBtn = e.target.closest('[data-size]');
      if (sizeBtn) {
        const id = sizeBtn.dataset.id;
        sel[id].size = Number(sizeBtn.dataset.size);
        refreshCard(id);
        return;
      }

      const optBtn = e.target.closest('[data-opt]');
      if (optBtn) {
        const id = optBtn.dataset.id;
        const idx = Number(optBtn.dataset.opt);
        const pos = sel[id].opts.indexOf(idx);
        if (pos === -1) sel[id].opts.push(idx);
        else sel[id].opts.splice(pos, 1);
        refreshCard(id);
        return;
      }

      const addBtn = e.target.closest('[data-add]');
      if (addBtn) addToCart(addBtn.dataset.add);
    });
  }

  /* ============================================================
     Cart
     ============================================================ */
  function cartCount() {
    return Object.keys(cart).reduce((sum, k) => sum + cart[k].qty, 0);
  }

  function cartSubtotal() {
    return Object.keys(cart).reduce((sum, k) => sum + cart[k].unit * cart[k].qty, 0);
  }

  function getTotals() {
    const sub = cartSubtotal();
    let discount = 0;
    if (promo && sub > 0) {
      if (promo.type === 'percent') discount = sub * promo.value / 100;
      else if (promo.type === 'fixed') discount = Math.min(sub, promo.value);
    }
    const delivery = sub === 0 ? 0 : (promo && promo.type === 'freeDelivery' ? 0 : (sub >= 4000 ? 0 : 490));
    return {
      sub: sub,
      discount: Math.round(discount),
      delivery: delivery,
      total: Math.max(0, Math.round(sub - discount + delivery))
    };
  }

  function saveCart() {
    store.set('kv_cart', JSON.stringify(cart));
    store.set('kv_promo', promo ? promo.code : '');
  }

  function thumbHTML(it) {
    if (it.img) {
      return '<img class="' + (it.cover ? 'is-cover' : '') + '" src="' + it.img + '" alt="">';
    }
    return '<span class="ci__thumb-icon">' + (ICONS[it.icon] || ICONS.sauce) + '</span>';
  }

  function itemHTML(it) {
    const key = encodeURIComponent(it.key);
    return '<div class="ci">' +
      '<div class="ci__thumb">' + thumbHTML(it) + '</div>' +
      '<div class="ci__info">' +
        '<b>' + esc(it.name) + '</b>' +
        (it.meta ? '<small>' + esc(it.meta) + '</small>' : '') +
        '<div class="qty">' +
          '<button type="button" data-qty="-1" data-key="' + key + '" aria-label="Уменьшить количество">−</button>' +
          '<span>' + it.qty + '</span>' +
          '<button type="button" data-qty="1" data-key="' + key + '" aria-label="Увеличить количество">+</button>' +
        '</div>' +
      '</div>' +
      '<div class="ci__right">' +
        '<b>' + money(it.unit * it.qty) + '</b>' +
        '<button type="button" class="ci__del" data-del="' + key + '" aria-label="Удалить товар">✕</button>' +
      '</div>' +
    '</div>';
  }

  function updateBadge() {
    const count = cartCount();
    const sum = cartSubtotal();
    const c = $('#cartCount');
    const s = $('#cartSum');
    if (c) {
      c.textContent = String(count);
      c.classList.toggle('hidden', count === 0);
    }
    if (s) s.textContent = money(sum);
    if (!firstCartRender) {
      const btn = $('#cartBtn');
      if (btn) {
        btn.classList.remove('bump');
        void btn.offsetWidth;
        btn.classList.add('bump');
      }
    }
  }

  function updateTotals() {
    const t = getTotals();
    const sub = $('#tSub');
    const del = $('#tDelivery');
    const discRow = $('#tDiscountRow');
    const disc = $('#tDiscount');
    const total = $('#tTotal');
    const hint = $('#deliveryHint');

    if (sub) sub.textContent = money(t.sub);
    if (del) del.textContent = t.delivery === 0 ? 'Бесплатно' : money(t.delivery);
    if (discRow) discRow.classList.toggle('hidden', t.discount === 0);
    if (disc) disc.textContent = '−' + money(t.discount);
    if (total) total.textContent = money(t.total);

    if (hint) {
      if (t.sub === 0) {
        hint.innerHTML = 'Бесплатная доставка от <b>4 000 ₸</b>';
      } else if (t.delivery === 0) {
        hint.innerHTML = '<b>Доставка бесплатно</b>';
      } else {
        hint.innerHTML = 'До бесплатной доставки: <b>' + money(4000 - t.sub) + '</b>';
      }
    }
  }

  function renderCart() {
    const itemsBox = $('#cartItems');
    if (!itemsBox) return;
    const items = Object.keys(cart).map(k => cart[k]);
    const empty = items.length === 0;

    itemsBox.innerHTML = items.map(itemHTML).join('');

    const emptyBox = $('#cartEmpty');
    const form = $('#orderForm');
    const checkout = $('#checkoutBtn');
    const hint = $('#cartHint');

    if (emptyBox) emptyBox.classList.toggle('hidden', !empty);
    if (form) form.classList.toggle('hidden', empty);
    if (checkout) {
      checkout.disabled = empty;
      checkout.textContent = empty ? 'Корзина пуста' : 'Оформить заказ';
    }
    if (hint) {
      hint.textContent = empty ? 'Пока пусто' : cartCount() + ' ' + plural(cartCount(), ['товар', 'товара', 'товаров']) + ' в корзине';
    }

    updateTotals();
    updateBadge();
    saveCart();
    firstCartRender = false;
  }

  function bumpCart() {
    const btn = $('#cartBtn');
    if (!btn) return;
    btn.classList.remove('bump');
    void btn.offsetWidth;
    btn.classList.add('bump');
  }

  function addToCart(id) {
    const p = findProduct(id);
    if (!p) return;
    const s = sel[id] || { size: 0, opts: [] };
    const meta = [];

    if (p.sizes) meta.push(SIZES[s.size].label);
    if (p.opts) {
      s.opts.slice().sort((a, b) => a - b).forEach(i => {
        if (DONER_OPTS[i]) meta.push(DONER_OPTS[i].label);
      });
    }

    const metaStr = meta.join(' · ');
    const key = id + (metaStr ? '|' + metaStr : '');

    if (cart[key]) {
      cart[key].qty += 1;
    } else {
      cart[key] = {
        key: key,
        id: id,
        name: p.name,
        img: p.img || '',
        cover: !!p.cover,
        icon: p.icon || '',
        meta: metaStr,
        unit: unitPrice(p),
        qty: 1
      };
    }

    renderCart();
    bumpCart();
    toast(p.name + ' — в корзине');
  }

  function changeQty(key, delta) {
    if (!cart[key]) return;
    cart[key].qty += delta;
    if (cart[key].qty <= 0) delete cart[key];
    renderCart();
    bumpCart();
  }

  function removeItem(key) {
    if (!cart[key]) return;
    delete cart[key];
    renderCart();
    bumpCart();
    toast('Товар удалён');
  }

  const cartItemsBox = $('#cartItems');
  if (cartItemsBox) {
    cartItemsBox.addEventListener('click', e => {
      const qtyBtn = e.target.closest('[data-qty]');
      if (qtyBtn) {
        changeQty(decodeURIComponent(qtyBtn.dataset.key), Number(qtyBtn.dataset.qty));
        return;
      }
      const delBtn = e.target.closest('[data-del]');
      if (delBtn) removeItem(decodeURIComponent(delBtn.dataset.del));
    });
  }

  /* ============================================================
     Promo
     ============================================================ */
  function promoError(msg) {
    toast(msg, 'error');
    const row = $('.promo-row');
    if (row) {
      row.classList.remove('shake');
      void row.offsetWidth;
      row.classList.add('shake');
    }
  }

  function renderPromo() {
    const activeBox = $('#promoActive');
    const hint = $('#promoHint');
    const label = $('#promoLabel');
    const input = $('#promoInput');
    const isActive = !!promo;

    if (activeBox) activeBox.classList.toggle('hidden', !isActive);
    if (hint) hint.classList.toggle('hidden', isActive);
    if (label && promo) label.textContent = promo.code + ' — ' + promo.label;
    if (input && promo) input.value = promo.code;

    updateTotals();
  }

  function applyPromo(code) {
    const c = String(code || '').trim().toUpperCase();
    if (!c) {
      promoError('Введите промокод');
      return false;
    }
    const found = PROMOS[c];
    if (!found) {
      promoError('Такого промокода нет. Попробуй GAME10');
      return false;
    }
    promo = found;
    saveCart();
    renderPromo();
    toast('Промокод ' + c + ' применён: ' + found.label);
    return true;
  }

  function clearPromo() {
    promo = null;
    saveCart();
    const input = $('#promoInput');
    if (input) input.value = '';
    renderPromo();
    toast('Промокод убран');
  }

  function grantPromo(code) {
    const input = $('#promoInput');
    if (input) input.value = code;
    if (applyPromo(code)) openCart();
  }

  const promoApplyBtn = $('#promoApply');
  if (promoApplyBtn) promoApplyBtn.addEventListener('click', () => applyPromo($('#promoInput').value));

  const promoInput = $('#promoInput');
  if (promoInput) {
    promoInput.addEventListener('keydown', e => {
      if (e.key === 'Enter') {
        e.preventDefault();
        applyPromo(promoInput.value);
      }
    });
  }

  const promoRemoveBtn = $('#promoRemove');
  if (promoRemoveBtn) promoRemoveBtn.addEventListener('click', clearPromo);

  /* ============================================================
     Drawer + modal
     ============================================================ */
  const drawer = $('#cartDrawer');
  const scrim = $('#scrim');

  function openCart() {
    if (!drawer) return;
    drawer.classList.add('open');
    drawer.setAttribute('aria-hidden', 'false');
    if (scrim) scrim.classList.add('show');
    document.body.classList.add('locked');
    closeMobileNav();
  }

  function closeCart() {
    if (!drawer) return;
    drawer.classList.remove('open');
    drawer.setAttribute('aria-hidden', 'true');
    if (scrim) scrim.classList.remove('show');
    if (!$('#orderModal').classList.contains('open')) document.body.classList.remove('locked');
  }

  const cartBtn = $('#cartBtn');
  if (cartBtn) cartBtn.addEventListener('click', openCart);

  const cartCloseBtn = $('#cartClose');
  if (cartCloseBtn) cartCloseBtn.addEventListener('click', closeCart);

  if (scrim) scrim.addEventListener('click', closeCart);

  const emptyMenuBtn = $('#emptyMenuBtn');
  if (emptyMenuBtn) {
    emptyMenuBtn.addEventListener('click', () => {
      closeCart();
      const menu = $('#menu');
      if (menu) menu.scrollIntoView({ behavior: 'smooth' });
    });
  }

  function openOrderModal() {
    const modal = $('#orderModal');
    if (!modal) return;
    modal.classList.add('open');
    document.body.classList.add('locked');
  }

  function closeOrderModal() {
    const modal = $('#orderModal');
    if (!modal) return;
    modal.classList.remove('open');
    if (drawer && !drawer.classList.contains('open')) document.body.classList.remove('locked');
  }

  const orderModalClose = $('#orderModalClose');
  if (orderModalClose) orderModalClose.addEventListener('click', closeOrderModal);

  const orderModal = $('#orderModal');
  if (orderModal) {
    orderModal.addEventListener('click', e => {
      if (e.target === orderModal) closeOrderModal();
    });
  }

  /* ============================================================
     Order form
     ============================================================ */
  function setErr(input, msg) {
    if (!input) return;
    const field = input.closest('.field');
    if (!field) return;
    field.classList.toggle('is-error', !!msg);
    const err = field.querySelector('.field__error');
    if (err) err.textContent = msg || '';
  }

  function formatPhone(value) {
    let d = value.replace(/\D/g, '');
    if (d.startsWith('8')) d = '7' + d.slice(1);
    if (!d.startsWith('7')) d = '7' + d;
    d = d.slice(0, 11);

    let out = '+7';
    if (d.length > 1) out += ' (' + d.slice(1, 4);
    if (d.length >= 5) out += ') ' + d.slice(4, 7);
    if (d.length >= 8) out += '-' + d.slice(7, 9);
    if (d.length >= 10) out += '-' + d.slice(9, 11);
    return out;
  }

  const phoneInput = $('#fPhone');
  if (phoneInput) {
    phoneInput.addEventListener('input', e => {
      e.target.value = formatPhone(e.target.value);
      setErr(e.target, '');
    });
  }

  ['fName', 'fAddr'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('input', () => setErr(el, ''));
  });

  const orderForm = $('#orderForm');
  if (orderForm) {
    orderForm.addEventListener('submit', e => {
      e.preventDefault();

      if (cartCount() === 0) {
        toast('Сначала добавьте блюдо в корзину', 'error');
        return;
      }

      const nameEl = $('#fName');
      const phoneEl = $('#fPhone');
      const addrEl = $('#fAddr');
      let firstError = null;

      if (!nameEl.value.trim() || nameEl.value.trim().length < 2) {
        setErr(nameEl, 'Напишите, как к вам обращаться');
        firstError = firstError || nameEl;
      } else {
        setErr(nameEl, '');
      }

      const digits = phoneEl.value.replace(/\D/g, '');
      if (digits.length < 11) {
        setErr(phoneEl, 'Введите номер телефона полностью');
        firstError = firstError || phoneEl;
      } else {
        setErr(phoneEl, '');
      }

      if (!addrEl.value.trim() || addrEl.value.trim().length < 6) {
        setErr(addrEl, 'Укажите улицу, дом и квартиру');
        firstError = firstError || addrEl;
      } else {
        setErr(addrEl, '');
      }

      if (firstError) {
        firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
        firstError.focus({ preventScroll: true });
        toast('Заполните обязательные поля', 'error');
        return;
      }

      const checkedPay = orderForm.querySelector('input[name="payment"]:checked');
      const payment = checkedPay ? checkedPay.value : 'card';
      const totals = getTotals();
      const orderNo = 'K-' + (1000 + Math.floor(Math.random() * 9000));
      const address = addrEl.value.trim();

      const summary = $('#orderSummary');
      if (summary) {
        summary.innerHTML =
          '<div><span>Номер заказа</span><b>' + orderNo + '</b></div>' +
          '<div><span>Сумма</span><b>' + money(totals.total) + '</b></div>' +
          '<div><span>Оплата</span><b>' + PAYMENT_LABELS[payment] + '</b></div>' +
          '<div><span>Адрес</span><b>' + esc(address) + '</b></div>' +
          '<div><span>Время</span><b>30–40 минут</b></div>';
      }

      cart = {};
      promo = null;
      store.set('kv_cart', '{}');
      store.set('kv_promo', '');
      orderForm.reset();
      if (promoInput) promoInput.value = '';
      setErr(nameEl, '');
      setErr(phoneEl, '');
      setErr(addrEl, '');
      firstCartRender = true;
      renderCart();
      renderPromo();
      closeCart();
      openOrderModal();
      toast('Заказ отправлен на кухню');
    });
  }

  /* ============================================================
     Navigation / filters / promo actions
     ============================================================ */
  const burger = $('#burger');
  const mobileNav = $('#mobileNav');

  function closeMobileNav() {
    if (mobileNav) mobileNav.classList.remove('open');
    if (burger) burger.setAttribute('aria-expanded', 'false');
  }

  if (burger) {
    burger.addEventListener('click', () => {
      if (!mobileNav) return;
      const isOpen = mobileNav.classList.toggle('open');
      burger.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    });
  }

  $$('.mobile-nav a').forEach(link => link.addEventListener('click', closeMobileNav));

  $$('.seg').forEach(btn => {
    btn.addEventListener('click', () => setCat(btn.dataset.cat));
  });

  $$('[data-add-deal]').forEach(btn => {
    btn.addEventListener('click', () => addToCart(btn.dataset.addDeal));
  });

  $$('[data-promo]').forEach(btn => {
    btn.addEventListener('click', () => grantPromo(btn.dataset.promo));
  });

  /* ============================================================
     Arcade
     ============================================================ */
  function initArcade() {
    const canvas = $('#arcadeCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const W = 400;
    const H = 520;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const el = {
      score: $('#arcScore'),
      time: $('#arcTime'),
      lives: $('#arcLives'),
      overlay: $('#arcadeOverlay'),
      start: $('#arcadeStart'),
      end: $('#arcadeEnd'),
      endTitle: $('#arcadeEndTitle'),
      endText: $('#arcadeEndText'),
      prize: $('#arcadePrize'),
      startBtn: $('#arcadeStartBtn'),
      retry: $('#arcadeRetry'),
      apply: $('#arcadeApply'),
      best: $('#arcBest')
    };

    let playerX = W / 2;
    let items = [];
    let pops = [];
    let score = 0;
    let lives = 3;
    let timeLeft = 45;
    let running = false;
    let raf = 0;
    let lastTs = 0;
    let spawnIn = 0.5;
    let shake = 0;
    let prizeCode = null;
    const keys = { left: false, right: false };

    let best = parseInt(store.get('kv_arc_best', '0'), 10);
    if (isNaN(best)) best = 0;
    if (el.best) el.best.textContent = String(best);

    const dots = [];
    for (let i = 0; i < 28; i++) {
      dots.push({
        x: Math.random() * W,
        y: Math.random() * H,
        r: Math.random() * 1.6 + 0.4,
        a: Math.random() * 0.09 + 0.03
      });
    }

    function updateHud() {
      if (el.score) el.score.textContent = String(score);
      if (el.time) el.time.textContent = String(Math.ceil(timeLeft));
      if (el.lives) el.lives.textContent = '♥'.repeat(Math.max(0, lives)) + '♡'.repeat(Math.max(0, 3 - lives));
    }

    function drawPlayer() {
      const y = H - 46;

      const glow = ctx.createRadialGradient(playerX, y, 4, playerX, y, 92);
      glow.addColorStop(0, 'rgba(232,56,13,.28)');
      glow.addColorStop(1, 'rgba(232,56,13,0)');
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.ellipse(playerX, y, 90, 35, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#d9913f';
      ctx.beginPath();
      ctx.ellipse(playerX, y, 60, 18, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#f7c85e';
      ctx.beginPath();
      ctx.ellipse(playerX, y - 2, 50, 13, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#e8642f';
      ctx.beginPath();
      ctx.ellipse(playerX, y - 2, 42, 9.5, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#b81f1a';
      [[-27, -2], [-6, 2], [20, -3], [8, -7], [34, 1]].forEach(function (pt) {
        ctx.beginPath();
        ctx.arc(playerX + pt[0], y + pt[1], 4.4, 0, Math.PI * 2);
        ctx.fill();
      });

      ctx.strokeStyle = 'rgba(255,255,255,.5)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.ellipse(playerX, y - 5, 46, 9, 0, 0, Math.PI * 2);
      ctx.stroke();
    }

    function drawItem(it) {
      ctx.save();
      ctx.translate(it.x, it.y);
      ctx.rotate(it.rot);

      if (it.type === 'bomb') {
        ctx.shadowColor = 'rgba(0,0,0,.18)';
        ctx.shadowBlur = 8;
        ctx.fillStyle = '#2c2c2e';
        ctx.beginPath();
        ctx.arc(0, 0, 15, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        ctx.fillStyle = 'rgba(255,255,255,.28)';
        ctx.beginPath();
        ctx.arc(-5, -5, 4, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#a98a45';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(4, -12);
        ctx.quadraticCurveTo(15, -24, 8, -29);
        ctx.stroke();

        ctx.fillStyle = '#e8380d';
        ctx.beginPath();
        ctx.arc(8, -30, 4.5, 0, Math.PI * 2);
        ctx.fill();
      } else if (it.type === 'cheese') {
        ctx.fillStyle = '#ffcf4d';
        ctx.strokeStyle = '#d9a327';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-17, 12);
        ctx.lineTo(17, 12);
        ctx.lineTo(2, -15);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#e0a62c';
        [[-8, 6, 3], [4, 7, 2.6], [9, -1, 2.2], [-1, 0, 2.4]].forEach(function (h) {
          ctx.beginPath();
          ctx.arc(h[0], h[1], h[2], 0, Math.PI * 2);
          ctx.fill();
        });
      } else {
        ctx.fillStyle = '#d92b1f';
        ctx.beginPath();
        ctx.arc(0, 0, 15, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#a91c14';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.fillStyle = '#a91c14';
        [[-5, -3], [5, 3], [3, -6], [-3, 6]].forEach(function (pt) {
          ctx.beginPath();
          ctx.arc(pt[0], pt[1], 2.2, 0, Math.PI * 2);
          ctx.fill();
        });
      }

      ctx.restore();
    }

    function draw() {
      ctx.save();
      if (shake > 0) {
        ctx.translate((Math.random() - 0.5) * 9 * shake, (Math.random() - 0.5) * 9 * shake);
      }

      const bg = ctx.createLinearGradient(0, 0, 0, H);
      bg.addColorStop(0, '#f8f3ea');
      bg.addColorStop(0.6, '#f3ece1');
      bg.addColorStop(1, '#eee4d6');
      ctx.fillStyle = bg;
      ctx.fillRect(-12, -12, W + 24, H + 24);

      const glow = ctx.createRadialGradient(W / 2, 70, 10, W / 2, 70, 330);
      glow.addColorStop(0, 'rgba(232,56,13,.08)');
      glow.addColorStop(1, 'rgba(232,56,13,0)');
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, W, H);

      dots.forEach(function (d) {
        ctx.fillStyle = 'rgba(29,29,31,' + d.a + ')';
        ctx.beginPath();
        ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
        ctx.fill();
      });

      ctx.strokeStyle = 'rgba(29,29,31,.12)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, H - 70);
      ctx.lineTo(W, H - 70);
      ctx.stroke();

      items.forEach(drawItem);
      drawPlayer();

      pops.forEach(function (p) {
        ctx.globalAlpha = Math.max(0, p.life);
        ctx.fillStyle = p.c;
        ctx.font = '600 16px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(p.t, p.x, p.y);
        ctx.globalAlpha = 1;
      });

      ctx.restore();
    }

    function spawnItem() {
      const r = Math.random();
      const type = r < 0.2 ? 'bomb' : (r < 0.6 ? 'cheese' : 'pepperoni');
      items.push({
        x: 30 + Math.random() * (W - 60),
        y: -32,
        vy: 150 + Math.random() * 95 + Math.min(score * 0.45, 95),
        rot: Math.random() * Math.PI,
        vr: (Math.random() - 0.5) * 2.2,
        type: type
      });
    }

    function update(dt) {
      timeLeft -= dt;
      if (timeLeft <= 0) {
        timeLeft = 0;
        finish();
        return;
      }

      if (keys.left) playerX -= 470 * dt;
      if (keys.right) playerX += 470 * dt;
      playerX = clamp(playerX, 55, W - 55);

      spawnIn -= dt;
      if (spawnIn <= 0) {
        spawnItem();
        spawnIn = Math.max(0.26, 0.62 - score * 0.0014) + Math.random() * 0.2;
      }

      for (let i = items.length - 1; i >= 0; i--) {
        const it = items[i];
        it.y += it.vy * dt;
        it.rot += it.vr * dt;

        if (it.y > H - 94 && it.y < H - 2 && Math.abs(it.x - playerX) < 64) {
          if (it.type === 'bomb') {
            lives -= 1;
            score = Math.max(0, score - 20);
            shake = 1;
            pops.push({ x: it.x, y: it.y, t: '−20', life: 0.9, c: '#c8102e' });
          } else {
            const pts = it.type === 'pepperoni' ? 15 : 10;
            score += pts;
            pops.push({ x: it.x, y: it.y, t: '+' + pts, life: 0.85, c: '#1d1d1f' });
          }
          items.splice(i, 1);
          continue;
        }

        if (it.y > H + 40) items.splice(i, 1);
      }

      for (let i = pops.length - 1; i >= 0; i--) {
        pops[i].life -= dt * 2.2;
        pops[i].y -= 42 * dt;
        if (pops[i].life <= 0) pops.splice(i, 1);
      }

      if (shake > 0) shake = Math.max(0, shake - dt * 3.2);

      updateHud();

      if (lives <= 0) finish();
    }

    function loop(ts) {
      if (!running) return;
      if (!lastTs) lastTs = ts;
      const dt = Math.min((ts - lastTs) / 1000, 0.045);
      lastTs = ts;
      update(dt);
      draw();
      if (running) raf = requestAnimationFrame(loop);
    }

    function start() {
      cancelAnimationFrame(raf);
      score = 0;
      lives = 3;
      timeLeft = 45;
      items = [];
      pops = [];
      playerX = W / 2;
      spawnIn = 0.55;
      shake = 0;
      prizeCode = null;
      lastTs = 0;
      running = true;
      updateHud();
      if (el.end) el.end.classList.add('hidden');
      if (el.start) el.start.classList.remove('hidden');
      if (el.overlay) el.overlay.classList.add('hidden');
      draw();
      raf = requestAnimationFrame(loop);
    }

    function finish() {
      running = false;
      cancelAnimationFrame(raf);
      updateHud();

      if (score > best) {
        best = score;
        store.set('kv_arc_best', String(best));
        if (el.best) el.best.textContent = String(best);
      }

      if (score >= 150) {
        prizeCode = 'GAME10';
        if (el.endTitle) el.endTitle.textContent = 'Ты выиграл скидку';
        if (el.endText) el.endText.textContent = 'Очков: ' + score + '. Промокод даёт −10% на весь заказ.';
      } else if (score >= 80) {
        prizeCode = 'WHEEL5';
        if (el.endTitle) el.endTitle.textContent = 'Есть скидка';
        if (el.endText) el.endText.textContent = 'Очков: ' + score + '. Промокод даёт −5% на заказ.';
      } else {
        prizeCode = null;
        if (el.endTitle) el.endTitle.textContent = 'Почти получилось';
        if (el.endText) el.endText.textContent = 'Очков: ' + score + '. Нужно 80+ для скидки — попробуй ещё.';
      }

      if (el.prize) {
        el.prize.innerHTML = prizeCode ? '<div class="prize-code">' + prizeCode + '</div>' : '';
      }
      if (el.apply) el.apply.classList.toggle('hidden', !prizeCode);
      if (el.start) el.start.classList.add('hidden');
      if (el.end) el.end.classList.remove('hidden');
      if (el.overlay) el.overlay.classList.remove('hidden');

      draw();
    }

    function setPlayerFromClientX(clientX) {
      const rect = canvas.getBoundingClientRect();
      if (!rect.width) return;
      playerX = clamp((clientX - rect.left) / rect.width * W, 55, W - 55);
    }

    canvas.addEventListener('pointerdown', e => setPlayerFromClientX(e.clientX));
    canvas.addEventListener('pointermove', e => setPlayerFromClientX(e.clientX));

    document.addEventListener('keydown', e => {
      if (!running) return;
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'ф' || e.key === 'A' || e.key === 'Ф') {
        keys.left = true;
        e.preventDefault();
      } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'в' || e.key === 'D' || e.key === 'В') {
        keys.right = true;
        e.preventDefault();
      }
    });
    document.addEventListener('keyup', e => {
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'ф' || e.key === 'A' || e.key === 'Ф') keys.left = false;
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'в' || e.key === 'D' || e.key === 'В') keys.right = false;
    });
    window.addEventListener('blur', () => { keys.left = false; keys.right = false; });

    if (el.startBtn) el.startBtn.addEventListener('click', start);
    if (el.retry) el.retry.addEventListener('click', start);
    if (el.apply) {
      el.apply.addEventListener('click', () => {
        if (!prizeCode) return;
        grantPromo(prizeCode);
        if (el.overlay) el.overlay.classList.add('hidden');
      });
    }

    updateHud();
    draw();
  }

  /* ============================================================
     Wheel
     ============================================================ */
  function initWheel() {
    const canvas = $('#wheelCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const S = 400;
    const cx = 200;
    const cy = 200;
    const R = 176;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = S * dpr;
    canvas.height = S * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const prizes = [
      { short: '−5%', code: 'WHEEL5', bg: '#f5f5f7', fg: '#1d1d1f' },
      { short: 'ДОСТАВКА', code: 'FREEDELIVERY', bg: '#1d1d1f', fg: '#f5f5f7' },
      { short: '−10%', code: 'WHEEL10', bg: '#e8380d', fg: '#ffffff' },
      { short: 'НАПИТОК', code: 'FREEDRINK', bg: '#f5f5f7', fg: '#1d1d1f' },
      { short: '−15%', code: 'WHEEL15', bg: '#1d1d1f', fg: '#f5f5f7' },
      { short: '−200 ₸', code: 'BONUS200', bg: '#e8380d', fg: '#ffffff' },
      { short: '−10%', code: 'WHEEL10', bg: '#f5f5f7', fg: '#1d1d1f' },
      { short: '−5%', code: 'WHEEL5', bg: '#1d1d1f', fg: '#f5f5f7' }
    ];
    const step = Math.PI * 2 / prizes.length;

    const logo = new Image();
    logo.src = 'assets/logo.png';
    logo.onload = draw;

    let rotation = -0.35;
    let spinning = false;
    let pendingCode = null;
    let usedToday = store.get('kv_spin_date', '') === todayKey();

    const spinBtn = $('#wheelSpin');
    const note = $('#wheelNote');
    const overlay = $('#wheelOverlay');
    const wheelTitle = $('#wheelTitle');
    const wheelText = $('#wheelText');
    const wheelCode = $('#wheelCode');
    const wheelApply = $('#wheelApply');
    const wheelClose = $('#wheelClose');

    function draw() {
      ctx.clearRect(0, 0, S, S);

      ctx.beginPath();
      ctx.arc(cx, cy, R + 13, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
      ctx.lineWidth = 1;
      ctx.strokeStyle = 'rgba(0,0,0,.12)';
      ctx.stroke();

      for (let i = 0; i < prizes.length; i++) {
        const p = prizes[i];
        const a0 = rotation + i * step;
        const a1 = a0 + step;

        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.arc(cx, cy, R, a0, a1);
        ctx.closePath();
        ctx.fillStyle = p.bg;
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2.5;
        ctx.stroke();

        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(a0 + step / 2);
        ctx.textAlign = 'right';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = p.fg;
        ctx.font = '600 15px Inter, sans-serif';
        ctx.fillText(p.short, R - 24, 0);
        ctx.restore();
      }

      ctx.beginPath();
      ctx.arc(cx, cy, 36, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = 'rgba(0,0,0,.12)';
      ctx.stroke();

      if (logo.complete && logo.naturalWidth) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(cx, cy, 32, 0, Math.PI * 2);
        ctx.clip();
        ctx.drawImage(logo, cx - 32, cy - 32, 64, 64);
        ctx.restore();
      } else {
        ctx.fillStyle = '#e8380d';
        ctx.beginPath();
        ctx.arc(cx, cy, 32, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    function setUsedNote() {
      if (!note) return;
      const last = store.get('kv_spin_prize', '');
      if (usedToday) {
        note.textContent = last
          ? 'Сегодняшний приз: ' + last + '. Возвращайся завтра.'
          : 'Сегодня уже крутили. Возвращайся завтра.';
        if (spinBtn) {
          spinBtn.disabled = true;
          spinBtn.textContent = 'Приходи завтра';
        }
      } else {
        note.textContent = '1 бесплатное вращение в день';
        if (spinBtn) {
          spinBtn.disabled = false;
          spinBtn.textContent = 'Крутить колесо';
        }
      }
    }

    function showResult(p) {
      pendingCode = p.code;
      const info = PROMOS[p.code];
      if (wheelTitle) wheelTitle.textContent = 'Твой приз';
      if (wheelText) wheelText.textContent = info.label + '. Промокод готов — примени его в корзине.';
      if (wheelCode) wheelCode.textContent = p.code;
      if (overlay) overlay.classList.remove('hidden');
    }

    function finish(idx) {
      rotation = rotation % (Math.PI * 2);
      spinning = false;
      const p = prizes[idx];
      usedToday = true;
      store.set('kv_spin_date', todayKey());
      store.set('kv_spin_prize', PROMOS[p.code].label);
      setUsedNote();
      showResult(p);
      draw();
    }

    function spin() {
      if (spinning || usedToday) return;
      spinning = true;
      if (spinBtn) spinBtn.disabled = true;

      const idx = Math.floor(Math.random() * prizes.length);
      const targetMod = -Math.PI / 2 - idx * step - step / 2 + (Math.random() - 0.5) * step * 0.6;
      const startRot = rotation;
      let delta = (targetMod - startRot) % (Math.PI * 2);
      if (delta < 0) delta += Math.PI * 2;
      const target = startRot + Math.PI * 2 * 7 + delta;
      const t0 = performance.now();
      const dur = 4600;

      function anim(t) {
        const k = Math.min(1, (t - t0) / dur);
        const e = 1 - Math.pow(1 - k, 3);
        rotation = startRot + (target - startRot) * e;
        draw();
        if (k < 1) {
          requestAnimationFrame(anim);
        } else {
          finish(idx);
        }
      }
      requestAnimationFrame(anim);
    }

    if (spinBtn) spinBtn.addEventListener('click', spin);

    if (wheelClose) {
      wheelClose.addEventListener('click', () => {
        if (overlay) overlay.classList.add('hidden');
      });
    }

    if (wheelApply) {
      wheelApply.addEventListener('click', () => {
        if (!pendingCode) return;
        grantPromo(pendingCode);
        if (overlay) overlay.classList.add('hidden');
      });
    }

    setUsedNote();
    draw();
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(draw).catch(function () {});
    }
  }

  /* ============================================================
     Reveal
     ============================================================ */
  function initReveal() {
    const els = $$('.reveal');
    if (!('IntersectionObserver' in window)) {
      els.forEach(el => el.classList.add('in'));
      return;
    }
    const io = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
    els.forEach(el => io.observe(el));
  }

  /* ============================================================
     Init
     ============================================================ */
  renderMenu();
  renderCart();
  renderPromo();
  initReveal();
  initArcade();
  initWheel();

  document.addEventListener('keydown', e => {
    if (e.key !== 'Escape') return;
    if (orderModal && orderModal.classList.contains('open')) closeOrderModal();
    else if (drawer && drawer.classList.contains('open')) closeCart();
  });

})();
