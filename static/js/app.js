
// --- Category panel precise positioning under header (works with .fixed-top) ---
(function(){
  const wrapper = document.querySelector('.category-all');
  const btn = wrapper ? wrapper.querySelector('.category-btn') : null;
  const menu = document.querySelector('.header .header-menu, .main-navigation .navbar');
  // Fallback: pick the first navbar inside header
  const nav = document.querySelector('.header .navbar') || document.querySelector('.main-navigation .navbar');
  const container = document.querySelector('.header .header-menu .container, .main-navigation .container');
  if (!wrapper || !btn || !nav) return;

  function updateVars(){
    const menuEl = nav;
    const h = menuEl ? menuEl.getBoundingClientRect().height : 64;
    document.documentElement.style.setProperty('--header-menu-height', h + 'px');
    if (container){
      const left = container.getBoundingClientRect().left;
      document.documentElement.style.setProperty('--container-left', Math.max(12, left) + 'px');
    }
  }
  updateVars();
  window.addEventListener('resize', updateVars);
  window.addEventListener('scroll', updateVars);

  btn.addEventListener('click', (e)=>{
    e.stopPropagation();
    wrapper.classList.toggle('open');
    updateVars();
  });
  document.addEventListener('click', (e)=>{
    if (!wrapper.contains(e.target)) wrapper.classList.remove('open');
  });
})();

// Sticky header shadow on scroll
(function(){
  const menu = document.querySelector('.header .header-menu');
  if (!menu) return;
  function onScroll(){
    if (window.scrollY > 10) menu.classList.add('is-sticky'); else menu.classList.remove('is-sticky');
  }
  window.addEventListener('scroll', onScroll, {passive:true});
  onScroll();
})();


// Category panel toggle + sticky alignment
(function(){
  const wrapper = document.querySelector('.category-all');
  const btn = wrapper ? wrapper.querySelector('.category-btn') : null;
  const menu = document.querySelector('.header .header-menu');
  const container = document.querySelector('.header .header-menu .container');
  if (!wrapper || !btn || !menu) return;

  function updateVars(){
    const h = menu.getBoundingClientRect().height;
    document.documentElement.style.setProperty('--header-menu-height', h+'px');
    if (container){
      const left = container.getBoundingClientRect().left;
      document.documentElement.style.setProperty('--container-left', left+'px');
    }
  }
  updateVars();
  window.addEventListener('resize', updateVars);

  btn.addEventListener('click', (e)=>{
    e.stopPropagation();
    wrapper.classList.toggle('open');
  });
  document.addEventListener('click', (e)=>{
    if (!wrapper.contains(e.target)) wrapper.classList.remove('open');
  });
})();

(function(){
  const $ = (s, el=document)=>el.querySelector(s);
  const $$ = (s, el=document)=>Array.from(el.querySelectorAll(s));
  const money = n => '$' + Number(n||0).toFixed(2);

  function refreshCartBadge(count){
    const el = document.getElementById('cart-count');
    if (el) el.textContent = count;
  }

  function renderDropdown(cart){
    const list = $('#cart-list');
    const itemsCount = $('#cart-items-count');
    const total = $('#cart-total');
    if (!list) return;
    list.innerHTML = '';
    (cart.items||[]).forEach(i => {
      const li = document.createElement('li');
      li.innerHTML = `
        <div class="dropdown-cart-item">
          <div class="cart-img">
            <a href="/product/${i.id}"><img alt="#" src="${i.image}"/></a>
          </div>
          <div class="cart-info">
            <h4><a href="/product/${i.id}">${i.title}</a></h4>
            <p class="cart-qty">${i.qty}x -<span class="cart-amount">${money(i.price)}</span></p>
          </div>
          <a class="cart-remove" href="#" title="Remove"><i class="far fa-times-circle"></i></a>
        </div>`;
      li.querySelector('.cart-remove').addEventListener('click', (e)=>{ e.preventDefault(); apiRemove(i.id); });
      list.appendChild(li);
    });
    if (itemsCount) itemsCount.textContent = String(cart.count).padStart(2,'0') + ' artículos';
    if (total) total.textContent = money(cart.total);
    refreshCartBadge(cart.count);
  }

  function renderCartPage(cart){
    const root = $('#cart-page');
    if (!root) return;
    if (!cart.items || !cart.items.length) { root.innerHTML = '<p>Tu carrito está vacío.</p>'; return; }
    const rows = cart.items.map(i => `
      <tr>
        <td><img src="${i.image}" alt="" style="width:60px;height:60px;object-fit:cover;border-radius:8px"/></td>
        <td>${i.title}</td>
        <td>${i.qty}</td>
        <td>${money(i.price)}</td>
        <td>${money(i.qty * i.price)}</td>
        <td><button class="btn btn-sm btn-outline-danger remove" data-id="${i.id}">Eliminar</button></td>
      </tr>`).join('');
    root.innerHTML = `
      <div class="table-responsive">
        <table class="table">
          <thead><tr><th></th><th>Producto</th><th>Cant.</th><th>Precio</th><th>Subtotal</th><th></th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
      <div class="d-flex justify-content-between align-items-center">
        <div class="h5 m-0">Total: ${money(cart.total)}</div>
        <div class="d-flex gap-2">
          <a class="theme-btn" href="/checkout">Pagar</a>
          <button class="btn btn-outline-danger" id="btn-clear">Vaciar</button>
        </div>
      </div>
    `;
    $$('.remove', root).forEach(b => b.addEventListener('click', e => { apiRemove(b.dataset.id); }));
    $('#btn-clear', root)?.addEventListener('click', ()=> apiClear());
  }

  async function apiGet(){ const r = await fetch('/api/cart'); return r.json(); }
  async function apiAdd(id, qty=1){
    const r = await fetch('/api/cart/add', {method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({id, qty})});
    const cart = await r.json(); renderDropdown(cart); renderCartPage(cart);
  }
  async function apiRemove(id){
    const r = await fetch('/api/cart/remove', {method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({id})});
    const cart = await r.json(); renderDropdown(cart); renderCartPage(cart);
  }
  async function apiClear(){
    const r = await fetch('/api/cart/clear', {method:'POST'});
    const cart = await r.json(); renderDropdown(cart); renderCartPage(cart);
  }

  document.addEventListener('click', (e)=>{
    const btn = e.target.closest('.add-to-cart');
    if (!btn) return;
    e.preventDefault();
    const id = btn.dataset.id || btn.getAttribute('data-id');
    if (id) apiAdd(id, 1);
  });

  apiGet().then(cart => { renderDropdown(cart); renderCartPage(cart); });
})();