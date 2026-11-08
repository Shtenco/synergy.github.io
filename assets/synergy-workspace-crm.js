// SYNERGY WORKSPACE CRM — Native Embedded Client Component
(function() {
  'use strict';

  let leads = [];
  async function crmRequest(path, options = {}) {
    const response = await fetch('/api/full/crm/leads' + path, {
      credentials: 'include', cache: 'no-store',
      headers: { 'Content-Type': 'application/json', ...(options.headers || {}) }, ...options
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(result.error || `HTTP ${response.status}`);
    return result;
  }

  let activeSegment = 'all';
  let searchQuery = '';

  async function renderCRM(container) {
    if (!container) return;
    container.innerHTML = '<div class="syn-crm-wrap"><p>Загружаю CRM из защищённой базы сайта…</p></div>';
    try {
      const result = await crmRequest('');
      leads = Array.isArray(result.leads) ? result.leads : [];
      const loginEntry = document.getElementById('crm-login-entry');
      if (loginEntry) loginEntry.hidden = true;
    } catch (error) {
      container.innerHTML = `<div class="syn-crm-wrap"><h3>CRM доступна после входа</h3><p>Войдите в аккаунт SYNERGY, чтобы открыть сохранённые карточки. <a href="/auth/?next=%2Fworkspace%2F%23workbench">Войти в аккаунт →</a></p><small>${escapeHtml(error.message)}</small></div>`;
      return;
    }

    const total = leads.length;
    const hotCount = leads.filter(l => l.score >= 80).length;
    const priceCount = leads.filter(l => l.segment === 'PRICE').length;
    const crashCount = leads.filter(l => l.segment === 'CRASH').length;
    const wonCount = leads.filter(l => l.stage === 'won').length;

    container.innerHTML = `
      <div class="syn-crm-wrap" id="synCrmApp">
        <div class="syn-crm-header">
          <div class="syn-crm-title">
            <h3>SYNERGY AI CRM — Реестр целевых лидов</h3>
            <p>Управление 50 контактами, скорингом болей и адресными предложениями ИИ-автопилота</p>
          </div>
          <div class="syn-crm-owner-badge">
            <span class="dot"></span>
            koshtenco@gmail.com · SYNERGY CHAIN
          </div>
        </div>

        <div class="syn-crm-stats">
          <div class="syn-crm-stat-card">
            <small>Всего лидов</small>
            <strong>${total}</strong>
            <span>Контакты из скоринга</span>
          </div>
          <div class="syn-crm-stat-card">
            <small>🔥 Горячий спрос</small>
            <strong style="color:#d04a1f">${hotCount}</strong>
            <span>Срочные задачи</span>
          </div>
          <div class="syn-crm-stat-card">
            <small>💰 Запрос цены</small>
            <strong>${priceCount}</strong>
            <span>Ждут расчет сметы</span>
          </div>
          <div class="syn-crm-stat-card">
            <small>⚡ Сбой сервисов</small>
            <strong style="color:#b78103">${crashCount}</strong>
            <span>Prodamus / DIKIDI / VK</span>
          </div>
        </div>

        <div class="syn-crm-toolbar">
          <div class="syn-crm-search">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input type="text" id="crmSearchInput" placeholder="Поиск по имени, цитате, группе или вопросу..." value="${escapeHtml(searchQuery)}">
          </div>
          <div class="syn-crm-segments" id="crmSegmentFilters">
            <button class="syn-crm-chip ${activeSegment === 'all' ? 'active' : ''}" data-seg="all">Все (${total})</button>
            <button class="syn-crm-chip ${activeSegment === 'hot' ? 'active' : ''}" data-seg="hot">🔥 Горячие (${hotCount})</button>
            <button class="syn-crm-chip ${activeSegment === 'PRICE' ? 'active' : ''}" data-seg="PRICE">Запрос цены (${priceCount})</button>
            <button class="syn-crm-chip ${activeSegment === 'CRASH' ? 'active' : ''}" data-seg="CRASH">Сбой сервиса (${crashCount})</button>
            <button class="syn-crm-chip ${activeSegment === 'LPR' ? 'active' : ''}" data-seg="LPR">ЛПР / Бизнес</button>
            <button class="syn-crm-chip ${activeSegment === 'SETUP' ? 'active' : ''}" data-seg="SETUP">Внедрение</button>
          </div>
          <button class="btn" id="btnExportCsv" style="min-height:36px;padding:6px 14px;font-size:12px">📥 Экспорт CSV</button>
        </div>

        <div class="syn-crm-table-box">
          <table class="syn-crm-table">
            <thead>
              <tr>
                <th style="width:28%">Контакт</th>
                <th style="width:34%">Вопрос / боль лида</th>
                <th style="width:14%">Сегмент</th>
                <th style="width:10%">Скоринг</th>
                <th style="width:14%">Стадия</th>
              </tr>
            </thead>
            <tbody id="crmTableBody">
              <!-- rows inserted here -->
            </tbody>
          </table>
        </div>
      </div>
      <div id="crmDrawerContainer"></div>
    `;

    bindEvents(container);
    renderTable();
  }

  function renderTable() {
    const tbody = document.getElementById('crmTableBody');
    if (!tbody) return;

    let filtered = leads.filter(item => {
      if (activeSegment === 'hot' && item.score < 80) return false;
      if (activeSegment !== 'all' && activeSegment !== 'hot' && item.segment !== activeSegment) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const str = `${item.name} ${item.quote_used} ${item.source_group} ${item.segment_ru} ${item.signals}`.toLowerCase();
        if (!str.includes(q)) return false;
      }
      return true;
    });

    if (!filtered.length) {
      tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;padding:36px;color:var(--muted)">Ничего не найдено по заданным фильтрам</td></tr>`;
      return;
    }

    tbody.innerHTML = filtered.map(item => {
      const tempClass = item.score >= 80 ? 'hot' : item.score >= 60 ? 'warm' : 'cold';
      const initials = (item.name || 'К').split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase();
      const quoteShort = item.quote_used.length > 95 ? item.quote_used.slice(0, 95) + '…' : item.quote_used;

      return `
        <tr data-lead-id="${item.id}" style="cursor:pointer">
          <td>
            <div class="syn-crm-lead-title">
              <div class="syn-crm-avatar">${initials}</div>
              <div>
                <div class="syn-crm-lead-name">${escapeHtml(item.name)}</div>
                <div class="syn-crm-lead-sub">
                  <a href="${item.profile}" target="_blank" rel="noopener" onclick="event.stopPropagation()" style="color:var(--purple-dark);text-decoration:none">vk.com/id${item.vk_id} ↗</a>
                </div>
              </div>
            </div>
          </td>
          <td>
            <div style="font-size:12px;line-height:1.55;color:var(--ink)" title="${escapeHtml(item.quote_used)}">
              «${escapeHtml(quoteShort)}»
            </div>
            <div class="syn-crm-lead-sub" style="margin-top:3px">${escapeHtml(item.source_group)}</div>
          </td>
          <td>
            <span class="syn-crm-tag" style="background:#f0f7f2;color:var(--ink2)">${escapeHtml(item.segment_ru)}</span>
          </td>
          <td>
            <span class="syn-crm-tag ${tempClass}">${item.score} / 100</span>
          </td>
          <td>
            <select class="syn-crm-stage-select" data-id="${item.id}" onclick="event.stopPropagation()">
              <option value="new" ${item.stage === 'new' ? 'selected' : ''}>Новый</option>
              <option value="qualified" ${item.stage === 'qualified' ? 'selected' : ''}>Квалифицирован</option>
              <option value="contacted" ${item.stage === 'contacted' ? 'selected' : ''}>Контакт</option>
              <option value="negotiation" ${item.stage === 'negotiation' ? 'selected' : ''}>Переговоры</option>
              <option value="won" ${item.stage === 'won' ? 'selected' : ''}>Сделка</option>
              <option value="lost" ${item.stage === 'lost' ? 'selected' : ''}>Архив</option>
            </select>
          </td>
        </tr>
      `;
    }).join('');

    tbody.querySelectorAll('tr[data-lead-id]').forEach(tr => {
      tr.addEventListener('click', () => {
        const id = tr.getAttribute('data-lead-id');
        const lead = leads.find(l => l.id === id);
        if (lead) openDrawer(lead);
      });
    });

    tbody.querySelectorAll('.syn-crm-stage-select').forEach(sel => {
      sel.addEventListener('change', (e) => {
        const id = sel.getAttribute('data-id');
        const lead = leads.find(l => l.id === id);
        if (lead) {
          const previous = lead.stage;
          lead.stage = sel.value;
          crmRequest('/' + encodeURIComponent(id), { method: 'PATCH', body: JSON.stringify({ stage: lead.stage }) })
            .then(() => renderTable())
            .catch(() => { lead.stage = previous; sel.value = previous; alert('Не удалось сохранить стадию в базе сайта.'); });
        }
      });
    });
  }

  function openDrawer(lead) {
    const container = document.getElementById('crmDrawerContainer');
    if (!container) return;

    container.innerHTML = `
      <div class="syn-crm-drawer-overlay" id="crmDrawerOverlay">
        <div class="syn-crm-drawer">
          <div class="syn-crm-drawer-head">
            <div>
              <h3>${escapeHtml(lead.name)}</h3>
              <small style="color:var(--muted)">Сегмент: ${escapeHtml(lead.segment_ru)} · Скоринг: ${lead.score}/100</small>
            </div>
            <button class="syn-crm-close-btn" id="btnDrawerClose">&times;</button>
          </div>

          <div class="syn-crm-drawer-body">
            <div class="syn-crm-detail-block">
              <label>Контакты и сообщество</label>
              <div style="font-size:13px;line-height:1.6">
                <strong>VK ID:</strong> ${lead.vk_id} &bull; <a href="${lead.profile}" target="_blank" rel="noopener" style="color:#0b9651;font-weight:700">Открыть страницу VK ↗</a><br>
                <strong>Сообщество:</strong> ${escapeHtml(lead.source_group)}<br>
                ${lead.source_url ? `<strong>Ссылка на публикацию:</strong> <a href="${lead.source_url}" target="_blank" rel="noopener" style="color:var(--muted)">${lead.source_url} ↗</a>` : ''}
              </div>
            </div>

            <div class="syn-crm-detail-block">
              <label>Вопрос / цитата из комментария</label>
              <p class="syn-crm-quote">«${escapeHtml(lead.quote_used)}»</p>
              <div style="font-size:11px;color:var(--muted);margin-top:8px">
                <strong>Сигналы:</strong> ${escapeHtml(lead.signals)}
              </div>
            </div>

            <div class="syn-crm-offer-box">
              <div class="syn-crm-offer-head">
                <strong>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
                  Персонализированное предложение ИИ-Синергии
                </strong>
                <button class="btn" id="btnCopyOffer" style="min-height:30px;padding:4px 10px;font-size:11px">📋 Скопировать</button>
              </div>
              <div class="syn-crm-offer-text" id="offerText">${escapeHtml(lead.message)}</div>
              <small style="color:var(--muted);font-size:11px">Адресный ответ сформирован на основе болей лида и содержит обязательный этичный футер.</small>
            </div>

            <div class="syn-crm-detail-block">
              <label>Сценарии ИИ-Автопилота для этого лида</label>
              <div class="actions" style="margin-top:6px">
                <a class="btn primary" href="../portal/autopilot/" target="_blank" style="font-size:12px;padding:8px 14px">
                  ⚡ Открыть ИИ-Автопилот
                </a>
                <a class="btn" href="https://vk.com/im?sel=${lead.vk_id}" target="_blank" rel="noopener" style="font-size:12px;padding:8px 14px">
                  ✉ Диалог VK
                </a>
              </div>
            </div>
          </div>

          <div class="syn-crm-drawer-foot">
            <button class="btn" id="btnDrawerCloseFoot">Закрыть</button>
          </div>
        </div>
      </div>
    `;

    const overlay = document.getElementById('crmDrawerOverlay');
    const close = () => { container.innerHTML = ''; };
    document.getElementById('btnDrawerClose').onclick = close;
    document.getElementById('btnDrawerCloseFoot').onclick = close;
    overlay.onclick = (e) => { if (e.target === overlay) close(); };

    document.getElementById('btnCopyOffer').onclick = () => {
      const text = document.getElementById('offerText').textContent;
      navigator.clipboard.writeText(text).then(() => {
        const btn = document.getElementById('btnCopyOffer');
        btn.textContent = '✓ Скопировано!';
        setTimeout(() => { btn.textContent = '📋 Скопировать'; }, 2000);
      });
    };
  }

  function bindEvents(container) {
    const search = container.querySelector('#crmSearchInput');
    if (search) {
      search.addEventListener('input', (e) => {
        searchQuery = e.target.value.trim();
        renderTable();
      });
    }

    const chips = container.querySelectorAll('.syn-crm-chip');
    chips.forEach(btn => {
      btn.addEventListener('click', () => {
        chips.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        activeSegment = btn.getAttribute('data-seg');
        renderTable();
      });
    });

    const exportBtn = container.querySelector('#btnExportCsv');
    if (exportBtn) {
      exportBtn.addEventListener('click', () => {
        exportCsv();
      });
    }
  }

  function exportCsv() {
    let csv = 'VK_ID,Имя,Сегмент,Скоринг,Стадия,Сообщество,Цитата,Сообщение\n';
    leads.forEach(l => {
      const clean = (s) => `"${String(s || '').replace(/"/g, '""')}"`;
      csv += `${l.vk_id},${clean(l.name)},${clean(l.segment_ru)},${l.score},${clean(l.stage)},${clean(l.source_group)},${clean(l.quote_used)},${clean(l.message)}\n`;
    });
    const blob = new Blob(["\uFEFF" + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `SYNERGY_CRM_Leads_50_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function escapeHtml(str) {
    return String(str || '').replace(/[&<>"']/g, c => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[c]));
  }

  // Auto-mount inside #syn-crm-mount or #task-detail when CRM task is clicked
  window.SynergyWorkspaceCRM = {
    render: renderCRM,
    getLeads: () => leads
  };

  document.addEventListener('DOMContentLoaded', () => {
    const mount = document.getElementById('syn-crm-mount');
    if (mount) {
      renderCRM(mount);
    }
  });
})();

