// Shared storage and helpers used by both the site and the admin.
const KB = {
  KEY: 'kbros_v1',
  DAYS: [
    ['mon', 'Mon'], ['tue', 'Tue'], ['wed', 'Wed'], ['thu', 'Thu'],
    ['fri', 'Fri'], ['sat', 'Sat'], ['sun', 'Sun']
  ],
  CATEGORIES: ['Coffee', 'Snacks', 'Meals', 'Drinks', 'Desserts'],

  defaults() {
    const hours = {};
    this.DAYS.forEach(([k]) => {
      hours[k] = { open: '08:00', close: '20:00', closed: k === 'sun' };
    });
    return {
      password: 'kbros2026',
      settings: {
        name: 'Kbros',
        tagline: 'Fresh coffee, snacks and daily plates.',
        address: 'Main Street 1, Your Town',
        lat: 40.7779,
        lng: 24.7033,
        phone: '+30 000 000 0000',
        email: 'hello@kbros.gr',
        instagram: '@kbros',
        hours
      },
      products: [
        {
          id: 'p1', name: 'Freddo Espresso', price: 3.5, category: 'Coffee',
          ingredients: 'Espresso, ice, milk, sugar',
          image: null,
          schedule: { days: ['mon','tue','wed','thu','fri','sat','sun'], from: '08:00', to: '20:00' }
        },
        {
          id: 'p2', name: 'Club Sandwich', price: 5.9, category: 'Meals',
          ingredients: 'Chicken, bacon, lettuce, tomato, mayo, toast',
          image: null,
          schedule: { days: ['mon','tue','wed','thu','fri'], from: '11:00', to: '16:00' }
        }
      ]
    };
  },

  load() {
    try {
      const raw = localStorage.getItem(this.KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) { /* fall through to defaults */ }
    const d = this.defaults();
    this.save(d);
    return d;
  },

  save(data) {
    localStorage.setItem(this.KEY, JSON.stringify(data));
  },

  toMin(t) {
    const [h, m] = String(t).split(':').map(Number);
    return h * 60 + m;
  },

  dayKey(date = new Date()) {
    return this.DAYS[(date.getDay() + 6) % 7][0];
  },

  isAvailable(schedule, now = new Date()) {
    if (!schedule || !schedule.days || !schedule.days.length) return false;
    if (!schedule.days.includes(this.dayKey(now))) return false;
    const mins = now.getHours() * 60 + now.getMinutes();
    return mins >= this.toMin(schedule.from) && mins < this.toMin(schedule.to);
  },

  isShopOpen(hours, now = new Date()) {
    const h = hours[this.dayKey(now)];
    if (!h || h.closed) return false;
    const mins = now.getHours() * 60 + now.getMinutes();
    return mins >= this.toMin(h.open) && mins < this.toMin(h.close);
  }
};
