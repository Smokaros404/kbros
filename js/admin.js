// Admin dashboard logic
const $ = (sel) => document.querySelector(sel);

let data = KB.load();
let editingId = null;
let photo = null;

/* ---------- Auth ---------- */
function showApp() {
  $('#login').classList.add('hidden');
  $('#app').classList.remove('hidden');
  initForms();
  renderList();
  renderSettingsForm();
}

$('#loginForm').addEventListener('submit', (e) => {
  e.preventDefault();
  if ($('#pw').value === data.password) {
    sessionStorage.setItem('kb_auth', '1');
    showApp();
  } else {
    $('#loginErr').textContent = 'Wrong password';
  }
});

$('#logout').addEventListener('click', () => {
  sessionStorage.removeItem('kb_auth');
  location.reload();
});

if (sessionStorage.getItem('kb_auth') === '1') showApp();
else $('#login').classList.remove('hidden');

/* ---------- Tabs ---------- */
document.querySelectorAll('.tabs button').forEach((btn) => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tabs button').forEach((b) => b.classList.remove('active'));
    btn.classList.add('active');
    $('#tab-products').classList.toggle('hidden', btn.dataset.tab !== 'products');
    $('#tab-settings').classList.toggle('hidden', btn.dataset.tab !== 'settings');
  });
});

/* ---------- Helpers ---------- */
function persist() {
  try {
    KB.save(data);
    return true;
  } catch (e) {
    alert('Storage is full. Use smaller photos or remove some products.');
    return false;
  }
}

function readImage(file) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const max = 800;
      const s = Math.min(1, max / Math.max(img.width, img.height));
      const c = document.createElement('canvas');
      c.width = Math.round(img.width * s);
      c.height = Math.round(img.height * s);
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(url);
      resolve(c.toDataURL('image/jpeg', 0.8));
    };
    img.onerror = reject;
    img.src = url;
  });
}

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => (
  { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
));

/* ---------- Product form ---------- */
const form = $('#productForm');

function initForms() {
  $('#categorySelect').innerHTML = KB.CATEGORIES.map((c) => `<option>${c}</option>`).join('');
  $('#dayChecks').innerHTML = KB.DAYS.map(([k, l]) =>
    `<label><input type="checkbox" value="${k}"> ${l}</label>`
  ).join('');
}

function setPreview(src) {
  const img = $('#photoPreview');
  if (src) {
    img.src = src;
    img.classList.remove('hidden');
  } else {
    img.removeAttribute('src');
    img.classList.add('hidden');
  }
}

function resetForm() {
  form.reset();
  editingId = null;
  photo = null;
  $('#formTitle').textContent = 'New product';
  document.querySelectorAll('#dayChecks input').forEach((cb) => (cb.checked = true));
  form.querySelector('[name=from]').value = '08:00';
  form.querySelector('[name=to]').value = '20:00';
  setPreview(null);
}

function fillForm(p) {
  form.querySelector('[name=name]').value = p.name;
  form.querySelector('[name=price]').value = p.price;
  form.querySelector('[name=category]').value = p.category;
  form.querySelector('[name=ingredients]').value = p.ingredients || '';
  form.querySelector('[name=from]').value = p.schedule.from;
  form.querySelector('[name=to]').value = p.schedule.to;
  document.querySelectorAll('#dayChecks input').forEach((cb) => {
    cb.checked = p.schedule.days.includes(cb.value);
  });
  photo = p.image || null;
  setPreview(photo);
  $('#formTitle').textContent = 'Edit product';
}

$('#photoInput').addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  photo = await readImage(file);
  setPreview(photo);
});

$('#newBtn').addEventListener('click', resetForm);
$('#cancelBtn').addEventListener('click', resetForm);

form.addEventListener('submit', (e) => {
  e.preventDefault();
  const days = [...document.querySelectorAll('#dayChecks input:checked')].map((c) => c.value);
  if (!days.length) {
    alert('Select at least one day for this product.');
    return;
  }

  const product = {
    id: editingId || 'p' + Date.now(),
    name: form.querySelector('[name=name]').value.trim(),
    price: parseFloat(form.querySelector('[name=price]').value),
    category: form.querySelector('[name=category]').value,
    ingredients: form.querySelector('[name=ingredients]').value.trim(),
    image: photo,
    schedule: {
      days,
      from: form.querySelector('[name=from]').value,
      to: form.querySelector('[name=to]').value
    }
  };

  if (editingId) {
    data.products = data.products.map((p) => (p.id === editingId ? product : p));
  } else {
    data.products.push(product);
  }

  if (persist()) {
    resetForm();
    renderList();
  }
});

/* ---------- Product list ---------- */
function renderList() {
  const list = $('#productList');
  if (!data.products.length) {
    list.innerHTML = '<li><span class="meta">No products yet.</span></li>';
    return;
  }
  list.innerHTML = data.products.map((p) => `
    <li>
      ${p.image ? `<img src="${p.image}" alt="">` : `<div class="thumb"></div>`}
      <div class="meta">
        <strong>${esc(p.name)}</strong> · €${Number(p.price).toFixed(2)}
        <small>${esc(p.category)} · ${p.schedule.days.join(', ')} ${esc(p.schedule.from)}–${esc(p.schedule.to)}</small>
      </div>
      <div class="acts">
        <button data-edit="${p.id}">Edit</button>
        <button class="del" data-del="${p.id}">Delete</button>
      </div>
    </li>`).join('');
}

$('#productList').addEventListener('click', (e) => {
  const editBtn = e.target.closest('[data-edit]');
  const delBtn = e.target.closest('[data-del]');

  if (editBtn) {
    const p = data.products.find((x) => x.id === editBtn.dataset.edit);
    if (!p) return;
    editingId = p.id;
    fillForm(p);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  if (delBtn) {
    const p = data.products.find((x) => x.id === delBtn.dataset.del);
    if (!p || !confirm(`Delete "${p.name}"?`)) return;
    data.products = data.products.filter((x) => x.id !== p.id);
    if (persist()) {
      if (editingId === p.id) resetForm();
      renderList();
    }
  }
});

/* ---------- Settings ---------- */
const settingsForm = $('#settingsForm');

function renderSettingsForm() {
  const s = data.settings;
  ['name', 'tagline', 'about', 'address', 'phone', 'email', 'instagram', 'lat', 'lng'].forEach((k) => {
    settingsForm.querySelector(`[name=${k}]`).value = s[k] ?? '';
  });

  $('#hoursEdit').innerHTML = KB.DAYS.map(([k, label]) => {
    const h = s.hours[k];
    return `
      <tr>
        <td>${label}</td>
        <td><label><input type="checkbox" data-closed="${k}" ${h.closed ? 'checked' : ''}> Closed</label></td>
        <td><input type="time" data-open="${k}" value="${h.open}"></td>
        <td><input type="time" data-close="${k}" value="${h.close}"></td>
      </tr>`;
  }).join('');
}

settingsForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const s = data.settings;

  ['name', 'tagline', 'about', 'address', 'phone', 'email', 'instagram'].forEach((k) => {
    s[k] = settingsForm.querySelector(`[name=${k}]`).value.trim();
  });
  s.lat = parseFloat(settingsForm.querySelector('[name=lat]').value) || s.lat;
  s.lng = parseFloat(settingsForm.querySelector('[name=lng]').value) || s.lng;

  KB.DAYS.forEach(([k]) => {
    s.hours[k] = {
      open: document.querySelector(`[data-open="${k}"]`).value,
      close: document.querySelector(`[data-close="${k}"]`).value,
      closed: document.querySelector(`[data-closed="${k}"]`).checked
    };
  });

  const newPw = settingsForm.querySelector('[name=newPw]').value;
  if (newPw) {
    data.password = newPw;
    settingsForm.querySelector('[name=newPw]').value = '';
  }

  if (persist()) {
    const msg = $('#saved');
    msg.classList.remove('hidden');
    setTimeout(() => msg.classList.add('hidden'), 2000);
  }
});
