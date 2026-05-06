/* =============================================
   app.js — Gardener main JavaScript
   Modules: DB, Auth, UI, Modals, Interactions
   ============================================= */

// ===== LOCAL DATABASE =====
const DB = {
  init() {
    if (!localStorage.getItem('gd_users')) {
      localStorage.setItem('gd_users', JSON.stringify([
        {
          id: 1,
          name: 'Администратор',
          email: 'admin@gardener.ru',
          password: 'admin123',
          role: 'admin',
          createdAt: new Date('2024-01-01').toISOString(),
          avatar: 'АД'
        }
      ]));
    }
    if (!localStorage.getItem('gd_requests')) {
      localStorage.setItem('gd_requests', JSON.stringify([]));
    }
    if (!localStorage.getItem('gd_session')) {
      localStorage.setItem('gd_session', JSON.stringify(null));
    }
  },

  getUsers()       { return JSON.parse(localStorage.getItem('gd_users') || '[]'); },
  saveUsers(u)     { localStorage.setItem('gd_users', JSON.stringify(u)); },
  findUser(email)  { return this.getUsers().find(u => u.email.toLowerCase() === email.toLowerCase()); },

  addUser(user) {
    const users = this.getUsers();
    user.id        = Date.now();
    user.createdAt = new Date().toISOString();
    user.role      = 'user';
    user.avatar    = user.name.slice(0, 2).toUpperCase();
    users.push(user);
    this.saveUsers(users);
    return user;
  },
  updateUser(id, data) {
    const users = this.getUsers();
    const idx = users.findIndex(u => u.id === id);
    if (idx !== -1) { users[idx] = { ...users[idx], ...data }; this.saveUsers(users); return users[idx]; }
    return null;
  },
  deleteUser(id) { this.saveUsers(this.getUsers().filter(u => u.id !== id)); },

  getSession()   { return JSON.parse(localStorage.getItem('gd_session') || 'null'); },
  setSession(u)  { localStorage.setItem('gd_session', JSON.stringify(u)); },
  clearSession() { localStorage.setItem('gd_session', JSON.stringify(null)); },

  getRequests()  { return JSON.parse(localStorage.getItem('gd_requests') || '[]'); },
  addRequest(req) {
    const reqs = this.getRequests();
    req.id        = Date.now();
    req.createdAt = new Date().toISOString();
    req.status    = 'new';
    reqs.unshift(req);
    localStorage.setItem('gd_requests', JSON.stringify(reqs));
    return req;
  },
  updateRequest(id, data) {
    const reqs = this.getRequests();
    const idx = reqs.findIndex(r => r.id === id);
    if (idx !== -1) { reqs[idx] = { ...reqs[idx], ...data }; localStorage.setItem('gd_requests', JSON.stringify(reqs)); }
  },
  deleteRequest(id) {
    const reqs = this.getRequests().filter(r => r.id !== id);
    localStorage.setItem('gd_requests', JSON.stringify(reqs));
  }
};

// ===== AUTH MODULE =====
const Auth = {
  login(email, password) {
    const user = DB.findUser(email);
    if (!user) return { ok: false, error: 'Пользователь с таким email не найден' };
    if (user.password !== password) return { ok: false, error: 'Неверный пароль' };
    DB.setSession(user);
    return { ok: true, user };
  },
  register(name, email, password, confirm, termsAccepted) {
    if (!name.trim())              return { ok: false, error: 'Введите ваше имя' };
    if (!email.includes('@'))      return { ok: false, error: 'Введите корректный email' };
    if (password.length < 6)       return { ok: false, error: 'Пароль должен быть не менее 6 символов' };
    if (password !== confirm)      return { ok: false, error: 'Пароли не совпадают' };
    if (!termsAccepted)            return { ok: false, error: 'Необходимо принять пользовательское соглашение' };
    if (DB.findUser(email))        return { ok: false, error: 'Этот email уже зарегистрирован' };
    const user = DB.addUser({ name, email, password });
    return { ok: true, user };
  },
  logout() { DB.clearSession(); UI.updateNavForUser(null); },
  current() { return DB.getSession(); }
};

// ===== UI MODULE =====
const UI = {
  updateNavForUser(user) {
    const userInfo    = document.getElementById('user-info');
    const authButtons = document.getElementById('auth-buttons');
    const nameDisplay = document.getElementById('user-name-display');
    const adminLink   = document.getElementById('admin-link');
    if (user) {
      userInfo?.classList.remove('hidden');
      authButtons?.classList.add('hidden');
      if (nameDisplay) nameDisplay.textContent = `Привет, ${user.name.split(' ')[0]}!`;
      adminLink && (user.role === 'admin' ? adminLink.classList.remove('hidden') : adminLink.classList.add('hidden'));
    } else {
      userInfo?.classList.add('hidden');
      authButtons?.classList.remove('hidden');
    }
  },
  showError(id, msg)    { const el = document.getElementById(id); if (!el) return; el.textContent = msg; el.classList.remove('hidden'); },
  hideError(id)         { document.getElementById(id)?.classList.add('hidden'); },
  showSuccess(id, msg)  { const el = document.getElementById(id); if (!el) return; el.textContent = msg; el.classList.remove('hidden'); }
};

// ===== MODAL MODULE =====
const Modal = {
  open(id)    { const o = document.getElementById(id); if (o) { o.classList.add('open'); document.body.style.overflow = 'hidden'; } },
  close(id)   { const o = document.getElementById(id); if (o) { o.classList.remove('open'); document.body.style.overflow = ''; } },
  closeAll()  { document.querySelectorAll('.modal-overlay.open').forEach(m => m.classList.remove('open')); document.body.style.overflow = ''; }
};

// ===== INIT =====
document.addEventListener('DOMContentLoaded', () => {
  DB.init();
  UI.updateNavForUser(Auth.current());

  // Navbar scroll
  window.addEventListener('scroll', () => {
    document.getElementById('navbar')?.classList.toggle('scrolled', window.scrollY > 50);
  });

  // Burger
  document.getElementById('burger')?.addEventListener('click', () => document.getElementById('mobile-menu')?.classList.add('open'));
  document.getElementById('mobile-close')?.addEventListener('click', () => document.getElementById('mobile-menu')?.classList.remove('open'));
  document.querySelectorAll('.mobile-menu a').forEach(a => a.addEventListener('click', () => document.getElementById('mobile-menu')?.classList.remove('open')));

  // Auth modal triggers
  document.getElementById('open-login')?.addEventListener('click',    () => Modal.open('modal-login'));
  document.getElementById('open-register')?.addEventListener('click', () => Modal.open('modal-register'));
  document.getElementById('mob-login')?.addEventListener('click',     () => { document.getElementById('mobile-menu')?.classList.remove('open'); Modal.open('modal-login'); });
  document.getElementById('mob-register')?.addEventListener('click',  () => { document.getElementById('mobile-menu')?.classList.remove('open'); Modal.open('modal-register'); });

  // Switch
  document.getElementById('switch-to-register')?.addEventListener('click', e => { e.preventDefault(); Modal.close('modal-login'); Modal.open('modal-register'); });
  document.getElementById('switch-to-login')?.addEventListener('click',    e => { e.preventDefault(); Modal.close('modal-register'); Modal.open('modal-login'); });

  // Close buttons
  document.querySelectorAll('[data-close]').forEach(btn => btn.addEventListener('click', () => Modal.close(btn.dataset.close)));
  document.querySelectorAll('.modal-overlay').forEach(overlay => overlay.addEventListener('click', e => { if (e.target === overlay) Modal.close(overlay.id); }));
  document.addEventListener('keydown', e => { if (e.key === 'Escape') Modal.closeAll(); });

  // ---- LOGIN ----
  document.getElementById('login-submit')?.addEventListener('click', () => {
    const email    = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;
    UI.hideError('login-error');
    const r = Auth.login(email, password);
    if (r.ok) {
      Modal.close('modal-login');
      UI.updateNavForUser(r.user);
      clearLoginForm();
      showToast(r.user.role === 'admin' ? 'Добро пожаловать, Администратор!' : `Добро пожаловать, ${r.user.name}!`);
    } else { UI.showError('login-error', r.error); }
  });
  document.getElementById('login-password')?.addEventListener('keydown', e => { if (e.key === 'Enter') document.getElementById('login-submit')?.click(); });

  // ---- REGISTER ----
  document.getElementById('reg-submit')?.addEventListener('click', () => {
    const name          = document.getElementById('reg-name').value.trim();
    const email         = document.getElementById('reg-email').value.trim();
    const password      = document.getElementById('reg-password').value;
    const confirm       = document.getElementById('reg-confirm').value;
    const termsAccepted = document.getElementById('reg-terms')?.checked;
    UI.hideError('reg-error');
    UI.hideError('reg-success');
    const r = Auth.register(name, email, password, confirm, termsAccepted);
    if (r.ok) {
      UI.showSuccess('reg-success', 'Аккаунт создан! Теперь войдите в систему.');
      setTimeout(() => { Modal.close('modal-register'); Modal.open('modal-login'); clearRegisterForm(); }, 1500);
    } else { UI.showError('reg-error', r.error); }
  });
  document.getElementById('reg-confirm')?.addEventListener('keydown', e => { if (e.key === 'Enter') document.getElementById('reg-submit')?.click(); });

  // ---- LOGOUT ----
  document.getElementById('logout-btn')?.addEventListener('click', () => { Auth.logout(); showToast('Вы вышли из аккаунта'); });

  // ---- CONSULT MODAL ----
  document.getElementById('hero-consult')?.addEventListener('click',  () => Modal.open('modal-consult'));
  document.getElementById('about-consult')?.addEventListener('click', () => Modal.open('modal-consult'));
  document.getElementById('cons-submit')?.addEventListener('click', () => {
    const name    = document.getElementById('cons-name').value.trim();
    const phone   = document.getElementById('cons-phone').value.trim();
    const service = document.getElementById('cons-service').value;
    if (!name || !phone) { showToast('Заполните имя и телефон'); return; }
    DB.addRequest({ type: 'consult', name, phone, service });
    UI.showSuccess('cons-success', 'Заявка принята! Скоро перезвоним.');
    document.getElementById('cons-name').value = '';
    document.getElementById('cons-phone').value = '';
    document.getElementById('cons-service').value = '';
    setTimeout(() => { Modal.close('modal-consult'); document.getElementById('cons-success')?.classList.add('hidden'); }, 2000);
  });

  // ---- CONTACT FORM ----
  document.getElementById('cf-submit')?.addEventListener('click', () => {
    const name  = document.getElementById('cf-name').value.trim();
    const phone = document.getElementById('cf-phone').value.trim();
    const msg   = document.getElementById('cf-msg').value.trim();
    if (!name || !phone) { showToast('Заполните имя и телефон'); return; }
    DB.addRequest({ type: 'contact', name, phone, message: msg });
    UI.showSuccess('cf-success', 'Заявка отправлена! Мы свяжемся с вами.');
    document.getElementById('cf-name').value = '';
    document.getElementById('cf-phone').value = '';
    document.getElementById('cf-msg').value = '';
  });

  // ---- TERMS MODAL ----
  const openTerms = () => Modal.open('modal-terms');
  document.getElementById('footer-terms')?.addEventListener('click',       e => { e.preventDefault(); openTerms(); });
  document.getElementById('footer-terms-2')?.addEventListener('click',     e => { e.preventDefault(); openTerms(); });
  document.getElementById('open-terms-from-reg')?.addEventListener('click', e => {
    e.preventDefault();
    Modal.open('modal-terms');
  });
  document.getElementById('accept-terms-btn')?.addEventListener('click', () => {
    const checkbox = document.getElementById('reg-terms');
    if (checkbox) checkbox.checked = true;
    Modal.close('modal-terms');
    // Re-open register if it's not open
    if (!document.getElementById('modal-register')?.classList.contains('open')) {
      Modal.open('modal-register');
    }
    showToast('Соглашение принято');
  });

  // ---- PORTFOLIO FILTER ----
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const filter = btn.dataset.filter;
      document.querySelectorAll('.portfolio-item').forEach(item => {
        item.classList.toggle('hidden-filter', filter !== 'all' && item.dataset.cat !== filter);
      });
    });
  });

  initScrollAnimations();
});

// ===== HELPERS =====
function clearLoginForm() {
  ['login-email', 'login-password'].forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
  UI.hideError('login-error');
}
function clearRegisterForm() {
  ['reg-name', 'reg-email', 'reg-password', 'reg-confirm'].forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
  const cb = document.getElementById('reg-terms'); if (cb) cb.checked = false;
  UI.hideError('reg-error');
}

// ===== TOAST =====
function showToast(message) {
  document.getElementById('gd-toast')?.remove();
  const toast = document.createElement('div');
  toast.id = 'gd-toast';
  toast.textContent = message;
  toast.style.cssText = `position:fixed;bottom:32px;left:50%;transform:translateX(-50%) translateY(20px);background:#1a3a2a;color:#fff;padding:14px 28px;border-radius:40px;font-family:'Jost',sans-serif;font-size:15px;font-weight:500;box-shadow:0 8px 32px rgba(0,0,0,.2);z-index:9999;opacity:0;transition:all .4s cubic-bezier(.4,0,.2,1);white-space:nowrap;`;
  document.body.appendChild(toast);
  requestAnimationFrame(() => { toast.style.opacity = '1'; toast.style.transform = 'translateX(-50%) translateY(0)'; });
  setTimeout(() => { toast.style.opacity = '0'; toast.style.transform = 'translateX(-50%) translateY(10px)'; setTimeout(() => toast.remove(), 400); }, 3000);
}

// ===== SCROLL ANIMATIONS =====
function initScrollAnimations() {
  const style = document.createElement('style');
  style.textContent = `.anim-ready{opacity:0;transform:translateY(24px);transition:opacity .6s ease,transform .6s ease}.anim-ready.visible{opacity:1!important;transform:translateY(0)!important}`;
  document.head.appendChild(style);

  const observer = new IntersectionObserver(entries => {
    entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); observer.unobserve(e.target); } });
  }, { threshold: 0.1 });

  document.querySelectorAll('.service-card, .portfolio-item, .testimonial-card, .team-card, .about-wrap, .contact-wrap').forEach((el, i) => {
    el.classList.add('anim-ready');
    if (el.classList.contains('service-card') || el.classList.contains('team-card')) {
      el.style.transitionDelay = `${(i % 6) * 70}ms`;
    }
    observer.observe(el);
  });
}

// Export for admin.js
window.DB   = DB;
window.Auth = Auth;
window.showToast = showToast;
