(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) {
    root.SYNERGY_ACCOUNT = api;
    if (root.document) api.boot();
  }
})(typeof window !== 'undefined' ? window : globalThis, function () {
  'use strict';

  const events = new Set(['landing_view', 'registration_started', 'registration_submitted', 'email_verified', 'login', 'onboarding_completed', 'product_opened', 'key_action', 'trial_expired']);
  const products = new Set(['ai', 'cfo', 'smm', 'video', 'advert', 'market', 'investor', 'riskguard', 'investor-folio', 'broker-mesh', 'archiver', 'business-os', 'portal', 'nexus']);
  const unavailableMessage = 'Регистрация временно недоступна. Вход для существующих аккаунтов работает.';
  const unknownMessage = 'Не удалось проверить доступность регистрации. Повторите проверку.';

  function safeNext(value) {
    try {
      const base = new URL('https://local.invalid/portal/');
      const url = new URL(value || '', base);
      if (url.origin !== base.origin || !url.pathname.startsWith('/') || url.pathname.startsWith('//')) return '/portal/';
      return url.pathname + url.search + url.hash;
    } catch (_) {
      return '/portal/';
    }
  }

  function trialView(session) {
    if (!session || !session.authenticated) return {state: 'anonymous', label: '7 ДНЕЙ БЕСПЛАТНО'};
    if (session.access_tier === 'lifetime') return {state: 'active', label: 'ПОСТОЯННЫЙ ДОСТУП'};
    const seconds = Math.max(0, Number(session.trial_seconds_remaining) || 0);
    if (session.trial_status !== 'active' || seconds <= 0) return {state: 'expired', label: 'ДЕМО ЗАВЕРШЕНО'};
    if (seconds < 3600) return {state: 'active', label: 'ДЕМО · < 1 Ч'};
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    return {state: 'active', label: days ? `ДЕМО · ${days} ДНЯ ${hours} Ч` : `ДЕМО · ${hours} Ч`};
  }

  function eventPayload(name, path, product) {
    if (!events.has(name) || (product && !products.has(product))) return null;
    let clean = '/';
    try {
      const url = new URL(path || '/', 'https://local.invalid');
      if (url.origin === 'https://local.invalid') clean = url.pathname;
    } catch (_) {}
    return {name, path: clean, product: product || null};
  }

  function productFromPath(path) {
    const first = String(path || '/').split('/').filter(Boolean)[0] || 'portal';
    return products.has(first) ? first : 'portal';
  }

  function registrationGate(config, failed) {
    if (failed) return {state: 'unknown', enabled: false, message: unknownMessage};
    if (config && config.registration_available === true) return {state: 'ready', enabled: true, message: ''};
    return {state: 'unavailable', enabled: false, message: unavailableMessage};
  }

  async function request(path, options) {
    const incoming = options || {};
    const response = await fetch(path, {
      credentials: 'include',
      ...incoming,
      cache: 'no-store',
      headers: {
        Accept: 'application/json',
        ...(incoming.body ? {'Content-Type': 'application/json'} : {}),
        ...(incoming.headers || {}),
      },
    });
    const body = await response.json().catch(() => ({detail: 'Некорректный ответ сервера'}));
    if (!response.ok) throw new Error(typeof body.detail === 'string' ? body.detail : `HTTP ${response.status}`);
    return body;
  }

  function sendEvent(name, product) {
    const payload = eventPayload(name, location.href, product);
    if (!payload) return;
    request('/api/v1/customer/events', {method: 'POST', body: JSON.stringify(payload)}).catch(() => {});
  }

  function pushAppMarkup(base = '/') {
    return `<button id="syn-account-trigger" type="button" aria-expanded="false" aria-controls="syn-auth-panel">
      <span class="syn-account-mark" aria-hidden="true"><img src="${base}assets/synergy-logo.webp" alt="" width="32" height="32"></span>
      <span class="syn-account-copy"><b>7 ДНЕЙ БЕСПЛАТНО</b><small>Открыть экосистему</small></span>
      <span class="syn-account-arrow" aria-hidden="true">↗</span>
    </button>
    <button id="syn-auth-scrim" type="button" aria-label="Закрыть окно аккаунта" hidden></button>
    <section id="syn-auth-panel" role="dialog" aria-modal="true" aria-labelledby="syn-auth-title" hidden>
      <header class="syn-auth-head">
        <div><span class="syn-auth-kicker"><i></i> SYNERGY ACCESS</span><h2 id="syn-auth-title">7 дней.<br><em>Вся экосистема.</em></h2><p>Без карты и автоматического списания.</p></div>
        <button class="syn-auth-close" type="button" data-syn-auth-close aria-label="Закрыть">×</button>
      </header>
      <div class="syn-auth-body">
        <div class="syn-auth-tabs" role="tablist" aria-label="Аккаунт">
          <button type="button" role="tab" aria-selected="true" data-syn-auth-tab="register">Регистрация</button>
          <button type="button" role="tab" aria-selected="false" data-syn-auth-tab="login">Вход</button>
        </div>
        <div class="syn-auth-notice" data-syn-auth-notice role="status" aria-live="polite"></div>
        <button class="syn-auth-retry" type="button" data-syn-auth-retry hidden>Проверить снова</button>
        <form data-syn-auth-form="register">
          <label><span>Имя</span><input name="name" autocomplete="name" minlength="2" maxlength="80" required></label>
          <label><span>Почта</span><input name="email" type="email" autocomplete="email" required></label>
          <label><span>Пароль</span><input name="password" type="password" autocomplete="new-password" minlength="12" maxlength="128" required><small>Минимум 12 символов</small></label>
          <label class="syn-auth-check"><input name="terms_accepted" type="checkbox" required><span>Я принимаю условия демо и обработку данных для создания аккаунта.</span></label>
          <button class="syn-auth-primary" type="submit" disabled>ПОЛУЧИТЬ 7 ДНЕЙ <span>→</span></button>
          <button class="syn-auth-link" type="button" data-syn-auth-resend>Отправить письмо ещё раз</button>
        </form>
        <form data-syn-auth-form="login" hidden>
          <label><span>Почта</span><input name="email" type="email" autocomplete="email" required></label>
          <label><span>Пароль</span><input name="password" type="password" autocomplete="current-password" required></label>
          <button class="syn-auth-primary" type="submit">ВОЙТИ <span>→</span></button>
          <button class="syn-auth-link" type="button" data-syn-auth-forgot>Забыли пароль?</button>
        </form>
        <footer><span><i></i> Защищённое соединение</span><a data-syn-auth-page href="/auth/">Открыть отдельно ↗</a></footer>
      </div>
    </section>`;
  }

  function pushAppCss() {
    return `
#syn-account{--sa-green:#0b9651;--sa-forest:#103422;--sa-ink:#173323;--sa-muted:#698071;--sa-line:#d8e8dc;position:fixed;left:18px;bottom:18px;z-index:2147483000;font-family:Manrope,Inter,system-ui,-apple-system,sans-serif;color:var(--sa-ink)}
#syn-account[data-embedded="true"]{position:relative;inset:auto;z-index:2;width:100%}
#syn-account *{box-sizing:border-box}
#syn-account button,#syn-account input{font:inherit}
#syn-account button:focus-visible,#syn-account a:focus-visible,#syn-account input:focus-visible{outline:3px solid #64ce8d;outline-offset:3px}
#syn-account-trigger{width:252px;min-height:58px;display:grid;grid-template-columns:38px minmax(0,1fr) 22px;align-items:center;gap:10px;padding:8px 12px 8px 9px;border:1px solid #bcdcc6;border-radius:16px;background:#fffffff2;color:var(--sa-ink);box-shadow:0 16px 44px #16482825;backdrop-filter:blur(16px);cursor:pointer;text-align:left}
#syn-account-trigger:hover{border-color:#70b989;transform:translateY(-1px)}
#syn-account[data-compact="true"]:not([data-embedded="true"]) #syn-account-trigger{width:56px;min-width:56px;grid-template-columns:38px;padding:8px;overflow:hidden}#syn-account[data-compact="true"]:not([data-embedded="true"]) .syn-account-copy,#syn-account[data-compact="true"]:not([data-embedded="true"]) .syn-account-arrow{display:none}
.syn-account-mark{width:38px;height:38px;display:grid;place-items:center;border-radius:11px;background:#fff;border:1px solid #d4e6da;overflow:hidden}.syn-account-mark img{display:block;width:32px;height:32px;object-fit:contain}
#syn-account[data-embedded="true"] #syn-account-trigger{width:100%;min-height:50px;grid-template-columns:34px minmax(0,1fr) 18px;padding:6px 9px;box-shadow:none;border-radius:11px}.syn-account-mark{width:34px;height:34px}
.syn-account-copy{min-width:0}.syn-account-copy b{display:block;font-size:10px;letter-spacing:.08em;white-space:nowrap}.syn-account-copy small{display:block;margin-top:4px;color:var(--sa-muted);font-size:10px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.syn-account-arrow{color:var(--sa-green);font-weight:900}
#syn-auth-scrim{position:fixed;inset:0;width:100vw;height:100vh;border:0;background:#06170c33;backdrop-filter:blur(3px);cursor:default}
#syn-auth-panel{position:fixed;left:18px;bottom:88px;width:min(430px,calc(100vw - 36px));max-height:calc(100dvh - 106px);overflow:auto;border:1px solid #bad7c3;border-radius:22px;background:#fff;box-shadow:0 35px 110px #0b321f45;animation:syn-auth-in .28s cubic-bezier(.22,1,.36,1);overscroll-behavior:contain}
@keyframes syn-auth-in{from{opacity:0;transform:translateY(-10px) scale(.97)}to{opacity:1;transform:none}}
.syn-auth-head{position:relative;padding:24px 25px 22px;border-radius:21px 21px 0 0;background:radial-gradient(circle at 88% 0,#24784a,transparent 46%),var(--sa-forest);color:#fff;overflow:hidden}
.syn-auth-head:after{content:"";position:absolute;width:210px;height:210px;border:1px solid #a5e9ba33;border-radius:50%;right:-110px;bottom:-130px;box-shadow:0 0 0 34px #a5e9ba0d,0 0 0 68px #a5e9ba09}
.syn-auth-kicker{display:flex;align-items:center;gap:7px;color:#bce9c9;font-size:9px;font-weight:800;letter-spacing:.16em}.syn-auth-kicker i,.syn-auth-body footer i{width:7px;height:7px;border-radius:50%;background:#36e67a;box-shadow:0 0 12px #36e67a}
.syn-auth-head h2{position:relative;z-index:1;margin:13px 0 8px;color:#fff;font-size:32px;line-height:1.03;letter-spacing:-.055em}.syn-auth-head h2 em{color:#78eea4;font-family:Georgia,serif;font-weight:400}.syn-auth-head p{margin:0;color:#bbd7c3;font-size:11px}.syn-auth-close{position:absolute;right:15px;top:15px;z-index:2;width:36px;height:36px;border:1px solid #ffffff33;border-radius:10px;background:#ffffff13;color:#fff;font-size:24px;line-height:1;cursor:pointer}.syn-auth-close:hover{background:#ffffff24}
.syn-auth-body{padding:21px 24px 19px}.syn-auth-tabs{display:grid;grid-template-columns:1fr 1fr;border-bottom:1px solid var(--sa-line);margin-bottom:17px}.syn-auth-tabs button{border:0;border-bottom:2px solid transparent;background:none;color:#718477;padding:10px;font-size:12px;font-weight:800;cursor:pointer}.syn-auth-tabs button[aria-selected="true"]{border-bottom-color:var(--sa-green);color:var(--sa-green)}
.syn-auth-notice{display:none;margin-bottom:13px;padding:11px 12px;border:1px solid #a9d8b8;border-radius:10px;background:#ecf8ef;color:#26623b;font-size:11px;line-height:1.5}.syn-auth-notice.is-visible{display:block}.syn-auth-notice.is-error{border-color:#edc5bd;background:#fff3f0;color:#8d3a2f}.syn-auth-retry{width:100%;margin:-5px 0 12px;border:1px solid #b8d9c2;border-radius:9px;background:#f5fbf6;color:#16713e;padding:9px;font-size:11px;font-weight:800;cursor:pointer}
#syn-account form label{display:block;margin:12px 0;color:#355941;font-size:10px;font-weight:800;letter-spacing:.02em}#syn-account form label>span:first-child{display:block;margin-bottom:6px}#syn-account form input:not([type="checkbox"]){display:block;width:100%;min-height:43px;margin:0;border:1px solid #c7ddcd;border-radius:10px;background:#f8fbf8;color:#173323;padding:10px 12px;font-size:13px}#syn-account form input:not([type="checkbox"]):focus{border-color:var(--sa-green);background:#fff}#syn-account form label small{display:block;margin-top:5px;color:#849388;font-size:9px;font-weight:500}
#syn-account .syn-auth-check{display:grid;grid-template-columns:16px 1fr;align-items:start;gap:9px;padding:10px 11px;border-radius:9px;background:#f3f8f4;color:#65796a;font-weight:500;line-height:1.45}#syn-account .syn-auth-check input{width:15px;height:15px;margin:2px 0;accent-color:var(--sa-green)}
.syn-auth-primary{width:100%;min-height:44px;display:flex;align-items:center;justify-content:space-between;border:0;border-radius:10px;background:var(--sa-green);color:#fff;padding:11px 14px;font-size:11px;font-weight:900;letter-spacing:.04em;cursor:pointer;box-shadow:0 8px 20px #0b965126}.syn-auth-primary:hover{background:#087c43}.syn-auth-primary:disabled{opacity:.5;cursor:wait}.syn-auth-link{width:100%;border:0;background:none;color:#4f7960;padding:11px 5px 2px;font-size:10px;font-weight:700;cursor:pointer}.syn-auth-link:hover{color:var(--sa-green)}
.syn-auth-body footer{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-top:17px;padding-top:14px;border-top:1px solid var(--sa-line);font-size:9px;color:#7b8c80}.syn-auth-body footer span{display:flex;align-items:center;gap:6px}.syn-auth-body footer a{color:#1b7441;font-weight:800;text-decoration:none}
#syn-account[data-state="expired"] .syn-account-mark{color:#ffd985}.syn-auth-panel-open{overflow:hidden}
@media(max-width:560px){#syn-account{left:8px;bottom:8px}#syn-account-trigger{width:auto;min-width:207px;min-height:50px;border-radius:14px}.syn-account-mark{width:34px;height:34px}.syn-account-copy b{font-size:9px}#syn-account[data-compact="true"]:not([data-embedded="true"]) #syn-account-trigger{min-width:50px;width:50px}#syn-auth-panel{left:0;right:0;top:auto;bottom:0;width:100%;max-height:92dvh;border-radius:22px 22px 0 0;border-bottom:0;animation:syn-auth-mobile-in .3s cubic-bezier(.22,1,.36,1)}@keyframes syn-auth-mobile-in{from{opacity:.7;transform:translateY(40px)}to{opacity:1;transform:none}}.syn-auth-head{border-radius:21px 21px 0 0;padding:22px 21px 19px}.syn-auth-body{padding:18px 20px 20px}.syn-auth-head h2{font-size:28px}}
@media(prefers-reduced-motion:reduce){#syn-account-trigger,#syn-auth-panel{animation:none;transition:none}}
`;
  }

  function boot() {
    if (document.documentElement?.getAttribute('data-syn-app') === 'smm' && !document.querySelector('link[data-smm-portal-theme]')) {
      const theme = document.createElement('link');
      theme.rel = 'stylesheet';
      theme.href = '/smm/smm-portal-theme.css';
      theme.dataset.smmPortalTheme = '1';
      document.head.appendChild(theme);
    }
    if (document.getElementById('syn-account') || location.pathname.startsWith('/auth/')) return;
    const style = document.createElement('style');
    style.textContent = pushAppCss();
    document.head.appendChild(style);
    const host = document.createElement('div');
    host.id = 'syn-account';
    host.innerHTML = pushAppMarkup(window.SYNERGY_PAGES?.base || '/');
    const dock = document.querySelector('[data-syn-system-dock]');
    if (dock) host.dataset.embedded = 'true';
    (dock || document.body).appendChild(host);

    const trigger = host.querySelector('#syn-account-trigger');
    const panel = host.querySelector('#syn-auth-panel');
    const scrim = host.querySelector('#syn-auth-scrim');
    const notice = host.querySelector('[data-syn-auth-notice]');
    const retryButton = host.querySelector('[data-syn-auth-retry]');
    const registerForm = host.querySelector('[data-syn-auth-form="register"]');
    const loginForm = host.querySelector('[data-syn-auth-form="login"]');
    const registerButton = registerForm.querySelector('[type="submit"]');
    const next = safeNext(location.pathname + location.search);
    let gate = {state: 'checking', enabled: false, message: ''};
    let authenticated = false;
    let lastFocus = null;
    const compact = () => { if (!host.dataset.embedded && panel.hidden) host.dataset.compact = 'true'; };
    const expand = () => { delete host.dataset.compact; };
    if (!host.dataset.embedded) {
      trigger.title = 'Демо-доступ SYNERGY';
      setTimeout(compact,6000);
      host.addEventListener('mouseenter', expand);
      host.addEventListener('focusin', expand);
      host.addEventListener('mouseleave', () => setTimeout(compact,700));
    }

    host.querySelector('[data-syn-auth-page]').href = `/auth/?next=${encodeURIComponent(next)}`;

    function show(message, error) {
      notice.textContent = message || '';
      notice.className = 'syn-auth-notice' + (message ? ' is-visible' : '') + (error ? ' is-error' : '');
    }

    function setTab(name) {
      const registering = name === 'register';
      registerForm.hidden = !registering;
      loginForm.hidden = registering;
      host.querySelectorAll('[data-syn-auth-tab]').forEach((button) => button.setAttribute('aria-selected', String(button.dataset.synAuthTab === name)));
      retryButton.hidden = !(registering && gate.state === 'unknown');
      if (registering && gate.message) show(gate.message, true);
      else if (notice.textContent === unavailableMessage || notice.textContent === unknownMessage) show('');
    }

    function openPanel() {
      expand();
      lastFocus = document.activeElement;
      panel.hidden = false;
      scrim.hidden = false;
      trigger.setAttribute('aria-expanded', 'true');
      document.documentElement.classList.add('syn-auth-panel-open');
      const focusTarget = panel.querySelector('input:not([type="checkbox"]),button');
      if (focusTarget) focusTarget.focus();
      sendEvent('registration_started', productFromPath(location.pathname));
    }

    function closePanel() {
      panel.hidden = true;
      scrim.hidden = true;
      trigger.setAttribute('aria-expanded', 'false');
      document.documentElement.classList.remove('syn-auth-panel-open');
      if (lastFocus && typeof lastFocus.focus === 'function') lastFocus.focus();
    }

    function applyGate(nextGate) {
      gate = nextGate;
      registerButton.disabled = !gate.enabled;
      retryButton.hidden = gate.state !== 'unknown' || registerForm.hidden;
      if (!registerForm.hidden) show(gate.message, gate.state !== 'ready');
    }

    async function loadRegistrationGate() {
      registerButton.disabled = true;
      retryButton.hidden = true;
      try {
        applyGate(registrationGate(await request('/api/v1/customer/config'), false));
      } catch (_) {
        applyGate(registrationGate(null, true));
      }
    }

    async function submit(form, path, payload, done) {
      const button = form.querySelector('[type="submit"]');
      button.disabled = true;
      try {
        done(await request(path, {method: 'POST', body: JSON.stringify(payload)}));
      } catch (error) {
        show(error.message, true);
      } finally {
        button.disabled = form === registerForm ? !gate.enabled : false;
      }
    }

    trigger.addEventListener('click', () => {
      if (authenticated) return location.assign('/welcome.html');
      if (panel.hidden) openPanel(); else closePanel();
    });
    host.querySelector('[data-syn-auth-close]').addEventListener('click', closePanel);
    scrim.addEventListener('click', closePanel);
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && !panel.hidden) closePanel();
    });
    host.querySelectorAll('[data-syn-auth-tab]').forEach((button) => button.addEventListener('click', () => setTab(button.dataset.synAuthTab)));
    retryButton.addEventListener('click', loadRegistrationGate);

    registerForm.addEventListener('submit', (event) => {
      event.preventDefault();
      if (!gate.enabled) return show(gate.message || unknownMessage, true);
      const form = event.currentTarget;
      const data = new FormData(form);
      sendEvent('registration_submitted', productFromPath(location.pathname));
      submit(form, '/api/v1/customer/register', {
        name: data.get('name'), email: data.get('email'), password: data.get('password'), terms_accepted: data.get('terms_accepted') === 'on',
      }, () => {
        show('Письмо отправлено. Подтвердите адрес — после этого начнутся 7 дней.');
        form.reset();
      });
    });

    loginForm.addEventListener('submit', (event) => {
      event.preventDefault();
      const form = event.currentTarget;
      const data = new FormData(form);
      submit(form, '/api/v1/customer/login', {email: data.get('email'), password: data.get('password')}, () => {
        sendEvent('login', productFromPath(location.pathname));
        location.assign(next || '/welcome.html');
      });
    });

    host.querySelector('[data-syn-auth-resend]').addEventListener('click', () => {
      if (!gate.enabled) return show(gate.message || unknownMessage, true);
      const email = registerForm.elements.email.value;
      if (!email) return show('Сначала укажите почту.', true);
      submit(registerForm, '/api/v1/customer/resend', {email}, () => show('Если адрес ожидает подтверждения, новое письмо отправлено.'));
    });
    host.querySelector('[data-syn-auth-forgot]').addEventListener('click', () => {
      const email = loginForm.elements.email.value;
      if (!email) return show('Сначала укажите почту.', true);
      submit(loginForm, '/api/v1/customer/forgot-password', {email}, () => show('Если аккаунт существует, письмо для восстановления отправлено.'));
    });

    loadRegistrationGate();
    request('/api/v1/customer/session').then((session) => {
      const view = trialView(session);
      authenticated = Boolean(session.authenticated);
      host.dataset.state = view.state;
      trigger.querySelector('b').textContent = view.label;
      if (authenticated) {
        trigger.querySelector('small').textContent = session.name || session.email;
        trigger.querySelector('.syn-account-arrow').textContent = '→';
        sendEvent('product_opened', productFromPath(location.pathname));
        if (view.state === 'expired') sendEvent('trial_expired', productFromPath(location.pathname));
      } else {
        trigger.querySelector('small').textContent = 'Открыть экосистему';
        sendEvent('landing_view', productFromPath(location.pathname));
      }
      window.dispatchEvent(new CustomEvent('synergy:session', {detail: session}));
    }).catch(() => {
      trigger.querySelector('small').textContent = 'Регистрация и вход';
    });
  }

  return {safeNext, trialView, eventPayload, registrationGate, request, sendEvent, pushAppMarkup, boot};
});

