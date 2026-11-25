// Public website logic
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => (
  { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
));
const DAY_LABEL = Object.fromEntries(KB.DAYS);
const DEFAULT_ABOUT =
  'Kbros is a small cantina serving fresh coffee, snacks and daily plates. ' +
  'We keep the menu short, the ingredients clear and the service quick.';

let data;
let activeCat = 'All';

const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((e) => {
    if (e.isIntersecting) {
      e.target.classList.add('in');
      revealObserver.unobserve(e.target);
    }
  });
}, { threshold: 0.12 });

function observeReveal(root = document) {
  root.querySelectorAll('.reveal:not(.in)').forEach((el) => revealObserver.observe(el));
}

function renderSettings() {
  const s = data.settings;
  document.title = `${s.name} | Cantina`;
  document.getElementById('siteName').textContent = s.name;
  document.getElementById('tagline').textContent = s.tagline;
}

function renderMarquee() {
  const s = data.settings;
  const words = [s.name, 'Coffee', 'Snacks', 'Daily plates', 'Fresh'];
  const item = words.map((w) => `<span>${esc(w)}</span><span class="dot">•</span>`).join('');
  // Repeat twice so the ticker loops seamlessly
  document.getElementById('marqueeTrack').innerHTML = item + item;
}

function renderFilters() {
  const cats = ['All', ...new Set(data.products.map((p) => p.category).filter(Boolean))];
  document.getElementById('filters').innerHTML = cats.map((c) =>
    `<button class="chip ${c === activeCat ? 'on' : ''}" data-cat="${esc(c)}">${esc(c)}</button>`
  ).join('');
}

function productCard(p) {
  const available = KB.isAvailable(p.schedule);
  const img = p.image
    ? `<img src="${p.image}" alt="${esc(p.name)}" loading="lazy">`
    : `<div class="ph">${esc(p.name.charAt(0))}</div>`;
  const ings = (p.ingredients || '')
    .split(',').map((s) => s.trim()).filter(Boolean)
    .map((s) => `<li>${esc(s)}</li>`).join('');
  const days = (p.schedule.days || []).map((d) => DAY_LABEL[d]).join(' · ');

  return `
    <article class="card reveal">
      <div class="card-img">
        ${img}
        <span class="badge ${available ? 'ok' : ''}">${available ? 'Available now' : 'Not available now'}</span>
      </div>
      <div class="card-body">
        <div class="row-between">
          <h3>${esc(p.name)}</h3>
          <span class="price">€${Number(p.price).toFixed(2)}</span>
        </div>
        <p class="cat">${esc(p.category)}</p>
        ${ings ? `<ul class="ings">${ings}</ul>` : ''}
        <p class="sched">Served ${esc(days)} · ${esc(p.schedule.from)}–${esc(p.schedule.to)}</p>
      </div>
    </article>`;
}

function renderFeatured() {
  const picks = data.products.slice(0, 3);
  document.getElementById('featuredGrid').innerHTML = picks.length
    ? picks.map(productCard).join('')
    : '<p class="empty">Products you add in the admin will appear here.</p>';
}

function renderProducts() {
  const grid = document.getElementById('productGrid');
  const list = data.products.filter((p) => activeCat === 'All' || p.category === activeCat);
  grid.innerHTML = list.length
    ? list.map(productCard).join('')
    : '<p class="empty">No items in this category yet.</p>';
  observeReveal(grid);
}

function renderGallery() {
  const withPhotos = data.products.filter((p) => p.image);
  const section = document.getElementById('gallery');
  section.hidden = withPhotos.length === 0;
  document.getElementById('galleryGrid').innerHTML = withPhotos.map((p) => `
    <figure class="reveal">
      <img src="${p.image}" alt="${esc(p.name)}" loading="lazy">
      <figcaption>${esc(p.name)}</figcaption>
    </figure>`).join('');
  observeReveal(section);
}

function renderAbout() {
  document.getElementById('aboutText').textContent = data.settings.about || DEFAULT_ABOUT;
}

function renderHours() {
  const hours = data.settings.hours;
  const today = KB.dayKey();
  document.getElementById('hoursTable').innerHTML = KB.DAYS.map(([k, label]) => {
    const h = hours[k];
    const text = !h || h.closed ? 'Closed' : `${h.open} – ${h.close}`;
    return `<tr class="${k === today ? 'today' : ''}"><td>${label}</td><td>${text}</td></tr>`;
  }).join('');
}

function renderOpenNow() {
  const el = document.getElementById('openNow');
  const open = KB.isShopOpen(data.settings.hours);
  const h = data.settings.hours[KB.dayKey()];
  el.textContent = open ? `Open now · closes at ${h.close}` : 'Closed right now';
  el.className = `status ${open ? 'ok' : 'no'}`;
}

function renderContact() {
  const s = data.settings;
  document.getElementById('contactInfo').innerHTML = `
    <span>${esc(s.address)}</span>
    <a href="tel:${esc(s.phone.replace(/\s/g, ''))}">${esc(s.phone)}</a>
    <a href="mailto:${esc(s.email)}">${esc(s.email)}</a>
    ${s.instagram ? `<a href="https://instagram.com/${esc(s.instagram.replace('@', ''))}" target="_blank" rel="noopener">${esc(s.instagram)}</a>` : ''}
  `;
}

function renderMap() {
  const s = data.settings;
  document.getElementById('addressText').textContent = s.address;
  if (!window.L) return;
  const map = L.map('map', { scrollWheelZoom: false }).setView([s.lat, s.lng], 15);
  L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; OpenStreetMap &copy; CARTO',
    subdomains: 'abcd',
    maxZoom: 19
  }).addTo(map);
  L.marker([s.lat, s.lng]).addTo(map)
    .bindPopup(`<strong>${esc(s.name)}</strong><br>${esc(s.address)}`)
    .openPopup();
}

document.addEventListener('DOMContentLoaded', () => {
  data = KB.load();

  renderSettings();
  renderMarquee();
  renderFeatured();
  renderFilters();
  renderProducts();
  renderGallery();
  renderAbout();
  renderHours();
  renderOpenNow();
  renderContact();
  renderMap();

  document.querySelectorAll('section:not(#gallery), footer').forEach((s) => s.classList.add('reveal'));
  observeReveal();

  document.getElementById('filters').addEventListener('click', (e) => {
    const btn = e.target.closest('[data-cat]');
    if (!btn) return;
    activeCat = btn.dataset.cat;
    renderFilters();
    renderProducts();
  });

  setInterval(renderOpenNow, 60000);

  window.addEventListener('storage', (e) => {
    if (e.key === KB.KEY) location.reload();
  });
});
