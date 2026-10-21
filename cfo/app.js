const $ = (s, root = document) => root.querySelector(s);
const $$ = (s, root = document) => [...root.querySelectorAll(s)];
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const OLGA_URL = '/synergy.github.io/ai/';

function toast(message, error = false) {
  const el = $('#toast');
  el.textContent = message;
  el.className = 'toast show' + (error ? ' error' : '');
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => el.className = 'toast', 3800);
}
function openModal(id) { $('#' + id).classList.add('open'); }
function closeModal(id) { $('#' + id).classList.remove('open'); }

const defaultModel = () => ({
  name: 'AI CFO', provider: 'openrouter', apiStyle: 'chat', baseUrl: 'https://openrouter.ai/api/v1',
  apiKey: '', model: 'openrouter/free', temperature: 0.4, maxOutput: 2200,
  systemPrompt: 'Ты — Ольга, финансовый аналитик SINERGY. Разбираешь цифры, видишь паттерны, даёшь конкретные рекомендации с суммами и сроками. Говоришь живым русским языком, без markdown и без списков ради списков.'
});
let modelConfig = defaultModel(); // No API keys are read or sent by this Python-only release.
let transactions = [];
let currency = '';
let lastStats = null;
let lastInsights = '';

async function api(path, options = {}) {
  const name = path.replace(/^api\//, '');
  const response = await fetch('/api/v3/cfo/' + name, {
    ...options, credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) }
  });
  const data = await response.json().catch(() => ({detail:'Ответ сервера не JSON'}));
  if (!response.ok) throw new Error(response.status === 401 ? 'Войдите как оператор через форму слева.' :
    (typeof data.detail === 'string' ? data.detail : `HTTP ${response.status}`));
  return data;
}
async function showOperatorSession() {
  const out = document.getElementById('cfo-session');
  if(!out)return;
  try {
    const res=await fetch('/api/v1/session',{credentials:'same-origin'});
    const data=await res.json();
    out.textContent = data.authenticated ? '● ВЫ ВОШЛИ. Локальная финансовая аналитика доступна.' :
      (data.login_enabled ? '○ ВОЙДИТЕ, ЧТОБЫ АНАЛИЗИРОВАТЬ ВЫПИСКУ' : '○ ВХОД ОТКЛЮЧЁН: НАСТРОЙТЕ ADMIN_PASSWORD И SESSION_SECRET');
    out.dataset.state = data.authenticated ? 'ok' : 'offline';
  } catch {out.textContent='○ Сервер не отвечает: для анализа запустите FastAPI';out.dataset.state='offline'}
}
async function operatorLogin(event) {
  event.preventDefault();
  const pass=document.getElementById('cfo-password'), button=event.submitter;
  button.disabled=true;
  try {
    const res=await fetch('/api/v1/auth/login',{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json'},body:JSON.stringify({password:pass.value})});
    pass.value='';
    if(!res.ok)throw new Error('Ошибка входа (HTTP '+res.status+'). Проверьте пароль и настройку сервера.');
    toast('Вход выполнен');await showOperatorSession();
  } catch(err) {toast(err.message,true)} finally {button.disabled=false}
}

function showStep(step) {
  ['upload', 'review', 'dashboard', 'ai', 'advanced'].forEach(s => $('#step' + cap(s)).classList.toggle('hidden', s !== step));
  $$('.mode-switch button').forEach(b => b.classList.toggle('active', b.dataset.step === step));
}
function cap(s) { return s[0].toUpperCase() + s.slice(1); }

/* ------------------------------ File input ------------------------------ */

function readFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    if (/\.pdf$/i.test(file.name) || file.type === 'application/pdf') reader.readAsDataURL(file);
    else reader.readAsText(file, 'utf-8');
  });
}

let pendingPdfBase64 = null;

async function handleFile(file) {
  try {
    const isPdf = /\.pdf$/i.test(file.name) || file.type === 'application/pdf';
    const result = await readFile(file);
    if (isPdf) {
      pendingPdfBase64 = result;
      $('#pasteArea').value = '';
      $('#pasteArea').placeholder = `PDF загружен: ${file.name} — нажмите «Разобрать выписку»`;
    } else {
      pendingPdfBase64 = null;
      $('#pasteArea').value = result.slice(0, 200000);
    }
    toast(`Файл ${file.name} загружен, теперь нажмите «Разобрать выписку»`);
  } catch { toast('Не удалось прочитать файл', true); }
}

async function parseStatement() {
  const text = $('#pasteArea').value.trim();
  if (!text && !pendingPdfBase64) return toast('Вставьте текст выписки или загрузите файл', true);
  try {
    if (pendingPdfBase64) throw Error('PDF не поддерживается этим безопасным Python-обработчиком. Экспортируйте выписку в CSV/TXT.');
    const payload = {text,filename:'statement.csv'};
    const result = await api('api/parse', { method: 'POST', body: JSON.stringify(payload) });
    transactions = result.transactions;
    currency = transactions.find(t => t.currency)?.currency || '';
    $('#parseMeta').textContent = `Распознано операций: ${result.meta.rowCount} · разделитель "${result.meta.delimiter}" · ${result.meta.isBrokerage ? 'брокерский отчёт' : 'банковская/финансовая выписка'}`;
    renderReviewTable();
    showStep('review');
  } catch (err) { toast(err.message, true); }
}

async function loadSample() {
  try {
    const response = await fetch('fixtures/sample_bank_statement.csv');
    const text = await response.text();
    $('#pasteArea').value = text;
    toast('Пример загружен. Нажмите «Разобрать выписку»');
  } catch { toast('Не удалось загрузить пример', true); }
}

/* ------------------------------ Review table ------------------------------ */

const CATEGORY_OPTIONS = ['Продукты', 'Кафе и рестораны', 'Транспорт', 'ЖКХ и связь', 'Аренда/Ипотека', 'Здоровье', 'Одежда и обувь', 'Развлечения', 'Подписки', 'Образование', 'Путешествия', 'Переводы', 'Доход/Зарплата', 'Инвестиции', 'Кредиты и займы', 'Комиссии и обслуживание', 'Прочее', 'Доход (не распознано)'];

function renderReviewTable() {
  const tbody = $('#reviewTable tbody');
  tbody.innerHTML = transactions.map((t, i) => `
    <tr data-i="${i}">
      <td><input type="date" value="${t.date || ''}" data-field="date"></td>
      <td><input type="text" value="${esc(t.description)}" data-field="description"></td>
      <td><input type="number" step="0.01" value="${t.amount}" data-field="amount" class="${t.amount >= 0 ? 'amount-pos' : 'amount-neg'}"></td>
      <td><select data-field="sign"><option value="expense" ${t.amount < 0 ? 'selected' : ''}>Расход</option><option value="income" ${t.amount >= 0 ? 'selected' : ''}>Доход</option></select></td>
      <td><select data-field="category">${CATEGORY_OPTIONS.map(c => `<option ${c === t.category ? 'selected' : ''}>${c}</option>`).join('')}</select></td>
      <td><input type="text" value="${esc(t.stream || '')}" data-field="stream" placeholder="Трейдинг / MQL5 / …"></td>
    </tr>`).join('');
  tbody.querySelectorAll('input,select').forEach(el => el.onchange = e => {
    const i = Number(e.target.closest('tr').dataset.i);
    const field = e.target.dataset.field;
    if (field === 'sign') { transactions[i].amount = Math.abs(transactions[i].amount) * (e.target.value === 'income' ? 1 : -1); }
    else if (field === 'amount') { transactions[i].amount = Number(e.target.value) || 0; }
    else if (field === 'stream') { transactions[i].stream = e.target.value.trim() || null; }
    else transactions[i][field] = e.target.value;
  });
}

/* -------------------------------- Dashboard -------------------------------- */

function fmt(n) { return Number(n || 0).toLocaleString('ru-RU', { maximumFractionDigits: 0 }); }

async function buildDashboard() {
  try {
    const { stats } = await api('api/stats', { method: 'POST', body: JSON.stringify({ transactions }) });
    lastStats = stats;
    renderDashboard(stats);
    showStep('dashboard');
  } catch (err) { toast(err.message, true); }
}

function renderDashboard(stats) {
  $('#summaryCards').innerHTML = `
    <div class="stat-card"><span>Доходы</span><b class="pos">${fmt(stats.totalIncome)} ${esc(currency)}</b></div>
    <div class="stat-card"><span>Расходы</span><b class="neg">${fmt(stats.totalExpense)} ${esc(currency)}</b></div>
    <div class="stat-card"><span>Дельта</span><b class="${stats.net >= 0 ? 'pos' : 'neg'}">${fmt(stats.net)} ${esc(currency)}</b></div>
    <div class="stat-card"><span>Норма сбережений</span><b>${stats.savingsRate != null ? (stats.savingsRate * 100).toFixed(1) + '%' : 'н/д'}</b></div>
    <div class="stat-card"><span>Операций</span><b>${stats.transactionCount}</b></div>`;

  const maxCat = Math.max(1, ...stats.byCategory.map(c => c.total));
  $('#categoryChart').innerHTML = stats.byCategory.length ? stats.byCategory.map(c => `
    <div class="bar-row"><span class="bar-label" title="${esc(c.category)}">${esc(c.category)}</span><div class="bar-track"><div class="bar-fill" style="width:${(c.total / maxCat * 100).toFixed(1)}%"></div></div><span class="bar-value">${fmt(c.total)} (${c.percent.toFixed(0)}%)</span></div>`).join('') : '<p class="empty">Нет расходов</p>';

  const maxMonth = Math.max(1, ...stats.byMonth.flatMap(m => [m.income, m.expense]));
  $('#monthChart').innerHTML = `<div class="month-chart">${stats.byMonth.map(m => `
    <div class="month-col"><div class="month-bars"><div class="inc" style="height:${(m.income / maxMonth * 120).toFixed(0)}px" title="Доход ${fmt(m.income)}"></div><div class="exp" style="height:${(m.expense / maxMonth * 120).toFixed(0)}px" title="Расход ${fmt(m.expense)}"></div></div><small>${esc(m.month)}</small></div>`).join('')}</div>`;

  $('#recurringList').innerHTML = stats.recurring.length ? stats.recurring.map(r => `
    <div class="list-item"><div><b>${esc(r.description)}</b><br><span>${esc(r.category)} · ${r.occurrences}× за ${r.months} мес.</span></div><div class="val">${fmt(r.monthlyAmount)}/мес<br><span>${fmt(r.annualCost)}/год</span></div></div>`).join('') : '<p class="empty">Регулярных платежей не найдено</p>';

  $('#topExpensesList').innerHTML = stats.topExpenses.length ? stats.topExpenses.map(t => `
    <div class="list-item"><div><b>${esc(t.description)}</b><br><span>${esc(t.date || '')} · ${esc(t.category)}</span></div><div class="val">${fmt(t.amount)}</div></div>`).join('') : '<p class="empty">Нет данных</p>';

  $('#brokerageCard').classList.toggle('hidden', !stats.brokerage);
  if (stats.brokerage) {
    $('#brokerageList').innerHTML = stats.brokerage.positions.map(p => `
      <div class="list-item"><div><b>${esc(p.ticker)}</b><br><span>Покупки ${fmt(p.buy)} · Продажи ${fmt(p.sell)} · Дивиденды ${fmt(p.dividends)}</span></div><div class="val">${fmt(p.netCashFlow)}</div></div>`).join('');
  }

  $('#streamCard').classList.toggle('hidden', !stats.hasStreams);
  if (stats.hasStreams) {
    $('#streamList').innerHTML = stats.byStream.map(s => `
      <div class="list-item"><div><b>${esc(s.stream)}</b><br><span>Доход ${fmt(s.income)} · Расход ${fmt(s.expense)}</span></div><div class="val ${s.net >= 0 ? '' : 'amount-neg'}">${fmt(s.net)}</div></div>`).join('');
  }
}

/* --------------------------------- AI CFO --------------------------------- */

function insightsText(insights) {
  if (typeof insights === 'string') return insights;
  if (!insights || typeof insights !== 'object') return String(insights || '');
  const parts = [];
  if (insights.summary) parts.push(insights.summary);
  if (Array.isArray(insights.priority_actions) && insights.priority_actions.length) parts.push(`Приоритетные действия:\n${insights.priority_actions.map((x, i) => `${i + 1}. ${x}`).join('\n')}`);
  if (Array.isArray(insights.risks) && insights.risks.length) parts.push(`Риски и ограничения:\n${insights.risks.map(x => `— ${x}`).join('\n')}`);
  if (insights.disclaimer) parts.push(insights.disclaimer);
  return parts.join('\n\n');
}

async function askAi() {
  $('#aiReport').innerHTML = '<p class="empty">Локальный SHTENCO AI CFO анализирует операции…</p>';
  try {
    const payload = { transactions, currency, baseCurrency: currency };
    // V9.3: no browser-provided model credentials are transmitted.
    const result = await api('api/analyze', { method: 'POST', body: JSON.stringify(payload) });
    lastStats = result.stats;
    lastInsights = insightsText(result.insights);
    $('#aiReport').textContent = lastInsights;
    $('#handoffRow').hidden = false;
  } catch (err) {
    $('#aiReport').innerHTML = `<p class="empty">Ошибка: ${esc(err.message)}</p>`;
    toast(err.message, true);
  }
}

async function handoff(target) {
  if (!lastInsights) return toast('Сначала получите заключение AI CFO', true);
  try {
    await api('api/handoff', { method: 'POST', body: JSON.stringify({ target, title: `Финансовый инсайт AI CFO (${new Date().toLocaleDateString('ru')})`, body: lastInsights, meta: { currency, totalIncome: lastStats?.totalIncome, totalExpense: lastStats?.totalExpense } }) });
    if (target === 'olga') {
      toast('Отправлено в AI OLGA — открываю чат…');
      window.open(`${OLGA_URL}/?prefill=${encodeURIComponent('Вот заключение от AI CFO по моим финансам:\n\n' + lastInsights + '\n\nПомоги превратить это в конкретный план действий.')}`, '_blank');
    } else {
      toast('Задача с контент-идеей отправлена в AI SMM через шину OLGA');
    }
  } catch (err) { toast(err.message, true); }
}

/* -------------------------------- Settings -------------------------------- */

function renderSettings() {
  $('#modelForm').innerHTML = `
    <label>Провайдер / имя</label><input id="mName" value="${esc(modelConfig.name)}">
    <label>Endpoint (baseUrl)</label><input id="mBase" value="${esc(modelConfig.baseUrl)}">
    <label>Model ID</label><input id="mModel" value="${esc(modelConfig.model)}">
    <label>API-ключ</label><input id="mKey" type="password" value="${esc(modelConfig.apiKey)}">
    <label>Системный промпт</label><textarea id="mPrompt" rows="3">${esc(modelConfig.systemPrompt)}</textarea>`;
}
function saveSettings() {
  modelConfig = { ...modelConfig, name: $('#mName').value, baseUrl: $('#mBase').value, model: $('#mModel').value, apiKey: $('#mKey').value, systemPrompt: $('#mPrompt').value };
  sessionStorage.setItem('cfo_model', JSON.stringify(modelConfig));
  closeModal('settingsModal');
  toast('Настройки модели сохранены в этой вкладке');
}

/* ------------------------------ Продвинутая аналитика ------------------------------ */

let lastForecast = null;

async function runForecast() {
  if (!transactions.length) return toast('Сначала разберите выписку', true);
  const months = Number($('#forecastMonths').value || 6);
  try {
    const { forecast } = await api('api/forecast', { method: 'POST', body: JSON.stringify({ transactions, months }) });
    lastForecast = forecast;
    const maxAbs = Math.max(1, ...forecast.months.map(m => Math.abs(m.cumulativeBalance)));
    $('#forecastChart').innerHTML = forecast.months.map(m => `
      <div class="bar-row"><span class="bar-label">Мес. +${m.monthOffset}</span><div class="bar-track"><div class="bar-fill" style="width:${Math.abs(m.cumulativeBalance) / maxAbs * 100}%;background:${m.cumulativeBalance >= 0 ? 'var(--g)' : 'var(--danger)'}"></div></div><span class="bar-value">${fmt(m.cumulativeBalance)} (${fmt(m.confidenceLow)}…${fmt(m.confidenceHigh)})</span></div>`).join('');
    $('#forecastMeta').textContent = `Фикс. расходы/мес: ${fmt(forecast.basis.fixedMonthlyExpense)} · переменные: ${fmt(forecast.basis.avgVariableExpense)} · тренд дохода: ${fmt(forecast.basis.incomeTrendPerMonth)}/мес${forecast.warning ? ' · ⚠ ' + forecast.warning : ''}`;
  } catch (err) { toast(err.message, true); }
}

async function runWhatif() {
  if (!lastForecast) return toast('Сначала постройте прогноз выше', true);
  const scenario = { type: $('#whatifType').value, amount: Number($('#whatifAmount').value || 0), ratePct: Number($('#whatifAmount').value || 0), startMonth: Number($('#whatifStart').value || 1) };
  try {
    const result = await api('api/whatif', { method: 'POST', body: JSON.stringify({ forecast: lastForecast, scenario, months: lastForecast.months.length }) });
    $('#whatifResult').innerHTML = result.result.map(r => `<div class="list-item"><b>Мес. +${r.monthOffset}</b><span>Баланс: ${fmt(r.cumulativeBalance)} (${r.delta >= 0 ? '+' : ''}${fmt(r.delta)} к базовому прогнозу)</span></div>`).join('') + `<p class="meta-line">Итоговое отклонение через ${result.result.length} мес.: <b>${fmt(result.finalDelta)}</b></p>`;
  } catch (err) { toast(err.message, true); }
}

async function runAnomalies() {
  if (!transactions.length) return toast('Сначала разберите выписку', true);
  try {
    const result = await api('api/anomalies', { method: 'POST', body: JSON.stringify({ transactions }) });
    const parts = [];
    if (result.outliers.length) parts.push('<b>Необычно крупные траты:</b>' + result.outliers.map(o => `<div class="list-item"><span>${esc(o.date || '')} · ${esc(o.description)} (${esc(o.category)})</span><div class="val">${fmt(Math.abs(o.amount))}</div></div>`).join(''));
    if (result.duplicates.length) parts.push('<b>Похожие на дубли списания:</b>' + result.duplicates.map(d => `<div class="list-item"><span>${esc(d.pair[0].description)}</span><div class="val">${fmt(Math.abs(d.pair[0].amount))} ×2 за ${d.daysDiff} дн.</div></div>`).join(''));
    $('#anomaliesResult').innerHTML = parts.length ? parts.join('') : '<p class="empty">Аномалий и дублей не найдено</p>';
  } catch (err) { toast(err.message, true); }
}

async function runScore() {
  if (!transactions.length) return toast('Сначала разберите выписку', true);
  try {
    const { score } = await api('api/score', { method: 'POST', body: JSON.stringify({ transactions }) });
    $('#scoreResult').innerHTML = `
      <div class="stat-card"><span>Оценка</span><b class="${score.overallGrade === 'A' ? 'pos' : score.overallGrade === 'D' ? 'neg' : ''}">${score.overallGrade}</b></div>
      <p class="meta-line">Доля ведущей категории расходов ${score.topCategoryShare}% · концентрация: ${esc(score.expenseDiversification)}. Регулярные платежи: ${score.recurringLoadShare}% среднемесячных расходов.</p>
      <p class="meta-line" style="opacity:.7">${esc(score.percentileNote)}</p>`;
  } catch (err) { toast(err.message, true); }
}

async function runTax() {
  const monthlyIncomeAvg = Number($('#taxIncome').value || 0);
  if (!monthlyIncomeAvg) return toast('Укажите средний доход в месяц', true);
  try {
    const rate = $('#taxRate').value.trim() === '' ? null : Number($('#taxRate').value);
    const { tax } = await api('api/tax-estimate', { method: 'POST', body: JSON.stringify({ monthlyIncomeAvg, country: $('#taxCountry').value, rate }) });
    if (tax.requiresVerifiedRate) {
      $('#taxResult').innerHTML = `<p class="disclaimer">${esc(tax.disclaimer)}</p>`;
    } else {
      $('#taxResult').innerHTML = `<p class="meta-line"><b>Ставка ${tax.verifiedRatePercent}%</b>: ~${fmt(tax.estimatedMonthlyTax)}/мес (${fmt(tax.estimatedAnnualTax)}/год)</p><p class="disclaimer">${esc(tax.disclaimer)}</p>`;
    }
  } catch (err) { toast(err.message, true); }
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => { const r = new FileReader(); r.onload = () => resolve(r.result); r.onerror = reject; r.readAsDataURL(file); });
}

async function runReceiptOcr(file) {
  $('#receiptResult').innerHTML = '<p class="empty">Распознаём чек…</p>';
  try {
    const dataUrl = await readFileAsDataUrl(file);
    const result = await api('api/receipt-ocr', { method: 'POST', body: JSON.stringify({ imageBase64: dataUrl }) });
    const t = result.transaction;
    $('#receiptResult').innerHTML = `<p class="meta-line"><b>${esc(t.merchant || '?')}</b> · ${esc(t.date || 'дата не найдена')} · <b>${t.total ? fmt(t.total) : 'сумма не найдена'}</b></p><button class="ghost" id="addReceiptTx">Добавить как операцию</button>`;
    $('#addReceiptTx').onclick = () => {
      if (!t.total) return toast('Не удалось распознать сумму — добавьте вручную на шаге 2', true);
      transactions.push({ id: crypto.randomUUID?.() || String(Date.now()), date: null, description: t.merchant || 'Чек (OCR)', amount: -Math.abs(t.total), currency: null, category: 'Продукты', stream: null });
      toast('Операция добавлена — откройте шаг «Проверка»');
    };
  } catch (err) { $('#receiptResult').innerHTML = `<p class="empty">${esc(err.message)}</p>`; }
}

async function runConnector() {
  const provider = $('#connectorProvider').value;
  let config = {};
  try { config = $('#connectorConfig').value ? JSON.parse($('#connectorConfig').value) : {}; }
  catch { return toast('Конфигурация должна быть в формате JSON', true); }
  $('#connectorResult').innerHTML = '<p class="empty">Подключаемся…</p>';
  try {
    const result = await api('api/connectors/sync', { method: 'POST', body: JSON.stringify({ provider, config }) });
    $('#connectorResult').innerHTML = result.connected ? `<p class="meta-line">✅ Подключено: ${esc(result.provider)}</p><pre style="white-space:pre-wrap;font-size:11px">${esc(JSON.stringify(result, null, 2).slice(0, 1500))}</pre>` : `<p class="empty">${esc(result.reason)}</p>`;
  } catch (err) { $('#connectorResult').innerHTML = `<p class="empty">${esc(err.message)}</p>`; }
}

async function runDebtLetter() {
  // A safe deterministic letter template: no external AI key or LLM request.
  $('#debtLetterResult').innerHTML = '<p class="empty">Составляем письмо…</p>';
  try {
    const result = await api('api/debt-letter', { method: 'POST', body: JSON.stringify({ creditor: $('#debtCreditor').value, amount: $('#debtAmount').value, situation: $('#debtSituation').value }) });
    $('#debtLetterResult').innerHTML = `<div class="ai-report">${esc(result.letter)}</div>`;
  } catch (err) { $('#debtLetterResult').innerHTML = `<p class="empty">${esc(err.message)}</p>`; }
}

/* ---------------------------------- Init ---------------------------------- */

function init() {
  $('#dropzone').onclick = () => $('#fileInput').click();
  $('#fileInput').onchange = e => { if (e.target.files[0]) handleFile(e.target.files[0]); };
  ['dragover', 'dragleave', 'drop'].forEach(evt => $('#dropzone').addEventListener(evt, e => {
    e.preventDefault();
    $('#dropzone').classList.toggle('drag', evt === 'dragover');
    if (evt === 'drop' && e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]);
  }));
  $('#parseBtn').onclick = parseStatement;
  $('#loadSample').onclick = loadSample;
  $('#analyzeBtn').onclick = buildDashboard;
  $('#askAiBtn').onclick = askAi;
  $('#sendOlga').disabled=true;
  $('#sendSmm').disabled=true;
  // Model settings disabled: deterministic engine, no external model connection.
  // Legacy model settings retained for compatibility but not invoked.
  $('#forecastBtn').onclick = runForecast;
  $('#whatifBtn').onclick = runWhatif;
  $('#anomaliesBtn').onclick = runAnomalies;
  $('#scoreBtn').onclick = runScore;
  $('#taxBtn').onclick = runTax;
  $('#receiptInput').disabled=true;
  $('#connectorBtn').disabled=true;
  $('#debtLetterBtn').onclick = runDebtLetter;
  $$('[data-close]').forEach(b => b.onclick = () => closeModal(b.dataset.close));
  $$('.modal-backdrop').forEach(m => m.onclick = e => { if (e.target === m) closeModal(m.id); });
  $$('.mode-switch button').forEach(b => b.onclick = () => {
    if (b.dataset.step !== 'upload' && !transactions.length) return toast('Сначала разберите выписку', true);
    if (b.dataset.step === 'dashboard' && !lastStats) return buildDashboard();
    showStep(b.dataset.step);
  });
  $('#pasteArea').oninput = () => { pendingPdfBase64 = null; };
  document.getElementById('cfo-login-form')?.addEventListener('submit',operatorLogin);
  showOperatorSession();
  $('#mobileMenu').onclick = () => $('.sidebar').classList.toggle('open');
}
init();
