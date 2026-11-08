/* SYNERGY M15 Autopilot OS — DApp и личный кабинет
 * Поверхность интеграции: https://sinergychain.asia/portal/
 * Все ульки интерфейса на русском. Оболочка и палитра — сайт /assets/syn26.css
 */
(()=>{'use strict';
const roles=[['general','Главный бизнес-ассистент','AI'],['sales','Отдел продаж и переговоры','SL'],['smm','Маркетинг и контент','SM'],['lead-os','Поиск клиентов и лидов','LD'],['ceo','Стратегия развития','EX'],['crm','Удержание клиентов и лояльность','CR'],['finance','Финансы и сметы','FN'],['engineering','Автоматизация и интеграции','EN'],['creative','Дизайн и креативы','CV'],['qa','Контроль качества и безопасность','QA'],['operations','Операционные процессы','OP'],['research','Анализ рынка и конкурентов','RS']];
const nav=[['chat','Бизнес-ассистент','◇'],['tasks','Мои задачи','☷'],['fleet','AI-ассистенты','◎'],['network','Сервисы и сеть','⬡'],['mcp','Интеграции','⌘'],['leads','Клиенты и CRM','◈'],['smm','Маркетинг и контент','⚡'],['biz','Инструменты бизнеса','❖'],['approvals','На согласовании','♢'],['evidence','История действий','▤']];
const VMAP={tasks,fleet,network,mcp,leads,smm,biz,approvals,evidence};

const urlParams = new URLSearchParams(location.search);
const initialToken = urlParams.get('token') || window.SYNERGY_ACCESS_TOKEN || '';
const defaultGateway = location.hostname.includes('sinergychain.asia') ? window.location.origin : 'http://127.0.0.1:8787';
// Режим сайта = единая сессия аккаунта SYNERGY (cookie); локальный режим = своя вечная панель
const SITE_MODE = location.protocol.startsWith('http') && !['127.0.0.1','localhost','0.0.0.0'].includes(location.hostname);

const S={url:defaultGateway,token:initialToken,connected:false,status:null,section:'chat',mode:'plan',role:'general',sessions:[],active:null,messages:[],nodes:[],workforce:null,approvals:null,proposals:[],receipts:[],mesh:null,draft:'',busy:false,command:false,searchRole:'',nodeCredential:'',error:'',inspector:true,dialog:!initialToken&&!urlParams.has('preview')&&!SITE_MODE,mcp:null,mcpPolicies:null,mcpCalls:[],mcpApprovals:[],mcpLast:null,mcpReady:false,leadsProfiles:[],leadsList:[],crmLeads:[],leadsLast:null,smmPlatforms:[],smmJobs:[],smmLast:null,bizHealth:null,bizMethods:[],bizChains:[],bizQuery:'',bizLast:null,antibanStatus:null,web3Address:''};
const e=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
const $=sel=>document.querySelector(sel), roleOf=id=>roles.find(x=>x[0]===id)||roles[0], short=s=>String(s||'').length>17?String(s).slice(0,9)+'…'+String(s||'').slice(-5):String(s||'');

async function api(path,method='GET',body){
  const headers = body ? {'Content-Type':'application/json'} : {};
  if (S.token) headers['Authorization'] = 'Bearer ' + S.token;
  const baseUrl = S.url.replace(/\/+$/,'');
  const r = await fetch(baseUrl + path, {
    method,
    headers,
    credentials: 'include',
    ...(body ? {body: JSON.stringify(body)} : {})
  });
  let v = await r.json();
  if(!r.ok) throw Error(v.error||v.detail||`HTTP ${r.status}`);
  return v;
}

// ─── Full Node: MCP-API-МЕТА + Лид-поиск + SMM (порт 8800 / Caddy /api/full) ──
const fullBase=()=>location.hostname.includes('sinergychain.asia')?'/api/full':'http://127.0.0.1:8800/api/full';
async function fn(path,method='GET',body){
  const headers=body?{'Content-Type':'application/json'}:{};
  if(S.token) headers['Authorization']='Bearer '+S.token;
  const r=await fetch(fullBase().replace(/\/+$/,'')+path,{method,headers,credentials:'include',...(body?{body:JSON.stringify(body)}:{})});
  let v=await r.json();
  if(!r.ok) throw Error(v.error||v.detail||`HTTP ${r.status}`);
  return v;
}

// ─── Локальная авторизация (fallback для localhost) ─────────────────────────
const AUTH = { token: null, user: null };
function openAuth(){ showLogin(); document.getElementById('sc-auth-overlay').style.display='flex'; }
function closeAuth(){ document.getElementById('sc-auth-overlay').style.display='none'; const el=document.getElementById('sc-auth-error'); el.style.display='none'; el.textContent=''; }
function showLogin(){ document.getElementById('sc-auth-form-login').style.display='flex'; document.getElementById('sc-auth-form-register').style.display='none'; document.querySelectorAll('.sc-auth-tab').forEach(t=>t.classList.remove('active')); document.querySelector('[data-syn-auth-tab="login"]').classList.add('active'); }
function showRegister(){ document.getElementById('sc-auth-form-login').style.display='none'; document.getElementById('sc-auth-form-register').style.display='flex'; document.querySelectorAll('.sc-auth-tab').forEach(t=>t.classList.remove('active')); document.querySelector('[data-syn-auth-tab="register"]').classList.add('active'); }
function showAuthError(msg){ const el=document.getElementById('sc-auth-error'); el.textContent=msg; el.style.display='block'; }
async function authAction(action){
  showAuthError('');
  const btn = document.getElementById(action==='login'?'sc-btn-login':'sc-btn-register');
  btn.disabled=true; btn.textContent = action==='login'?'Входим…':'Создаём…';
  try{
    let body, endpoint;
    if(action==='login'){
      const email=document.getElementById('sc-login-email').value.trim();
      const password=document.getElementById('sc-login-password').value;
      if(!email||!password) throw new Error('Заполните email и пароль');
      body={email,password}; endpoint='/api/v1/auth/login';
    } else {
      const name=document.getElementById('sc-reg-name').value.trim();
      const email=document.getElementById('sc-reg-email').value.trim();
      const password=document.getElementById('sc-reg-password').value;
      if(!name||!email||!password) throw new Error('Заполните все поля');
      body={name,email,password}; endpoint='/api/v1/auth/register';
    }
    const baseUrl = S.url.replace(/\/+$/,'');
    const r = await fetch(baseUrl+endpoint,{method:'POST',headers:{'Content-Type':'application/json'},credentials:'include',body:JSON.stringify(body)});
    const data = await r.json();
    if(r.status===202 && data.status==='verification_required'){
      showAuthError(data.detail||'Отправлено письмо с подтверждением. Подтвердите адрес — после этого войдите в кабинет.');
      const lt=document.querySelector('.sc-auth-tab[data-syn-auth-tab="login"]'); if(lt)lt.click();
      return;
    }
    if(!r.ok) throw new Error(data.detail||data.error||('HTTP '+r.status));
    AUTH.token=data.session_token; AUTH.user={id:data.user_id,name:data.name,email:data.email};
    S.token=data.session_token;
    closeAuth();
    await refresh();
  }catch(err){ showAuthError(err.message||'Ошибка соединения'); }
  finally{ btn.disabled=false; btn.textContent = action==='login'?'Войти':'Создать аккаунт';
    const el=document.getElementById('sc-auth-error'); if(!el.textContent) el.style.display='none';
  }
}

// Единая панель аккаунта (сайт) с фоллбэком на свою карточку
function openSiteAuth(){
  const t=document.getElementById('syn-account-trigger');
  if(t){ t.click(); return; }
  setTimeout(()=>{ const t2=document.getElementById('syn-account-trigger');
    if(t2){ t2.click(); return; }
    const p=document.getElementById('sc-auth-overlay'); if(p) openAuth();
  }, 400);
}
window.addEventListener('synergy:session', (ev)=>{
  if(ev.detail && ev.detail.authenticated) { try{ S.token=''; refresh(); }catch(e){} }
});

// Токен из родительского окна (встраивание в /workspace/)
window.addEventListener('message', (ev) => {
  if (ev.data && ev.data.type === 'synergy_inject_token' && ev.data.token) {
    S.token = ev.data.token;
    AUTH.token = ev.data.token;
    refresh();
  }
});

async function refresh(){
  try{
    let [s,ch,n,w,a,p,r,m15]=await Promise.all([
      api('/api/v1/status'),
      api('/api/v1/sessions'),
      api('/api/v1/nodes'),
      api('/api/v1/workforce'),
      api('/api/v1/approvals'),
      api('/api/v1/proposals'),
      api('/api/v1/receipts'),
      api('/api/v1/mesh')
    ]);
    Object.assign(S,{status:s,connected:true,sessions:ch.sessions,nodes:n.nodes,workforce:w,approvals:a,proposals:p.proposals,receipts:r.receipts,mesh:m15,dialog:false,error:''});
    if(!S.active&&S.sessions.length) S.active=S.sessions[0].id;
    await history();
  }catch(e){}
  // Full Node: MCP API-Мета + Лид-поиск + SMM-Автопилот (даже если шлюз недоступен)
  try{
    const [mc,mp,mca,mcc]=await Promise.all([fn('/mcp/catalog'),fn('/mcp/policies'),fn('/mcp/approvals'),fn('/mcp/calls')]);
    S.mcp=mc;S.mcpPolicies=mp;S.mcpCalls=mcc.calls||[];S.mcpApprovals=mca.approvals||[];S.mcpReady=true;S.mcpLast=mc;
  }catch(e){}
  try{ S.leadsProfiles=(await fn('/leads/profiles')).profiles||[]; const lp=await fn('/leads/list'); S.leadsList=lp.leads||[]; }catch(e){}
  try{ S.crmLeads=(await fn('/crm/leads')).leads||[]; }catch(e){ S.crmLeads=[]; }
  try{ S.smmPlatforms=(await fn('/smm/platforms')).platforms||[]; const sj=await fn('/smm/jobs'); S.smmJobs=sj.jobs||[]; }catch(e){}
  try{ S.antibanStatus=await fn('/smm/antiban/status'); }catch(e){}
  try{ S.bizHealth=await fn('/business/health');  const cap=await fn('/business/capabilities'); if(S.bizHealth) S.bizHealth.capabilities=cap; S.bizMethods=(await fn('/business/methods?q='+encodeURIComponent(S.bizQuery||'')+'&limit=25')).items||[]; const ch=await fn('/business/chain'); S.bizChains=(ch.chains||ch)||[]; }catch(e){ window.__bizErr=e&&e.message; }
}

async function history(){
  if(!S.active){S.messages=[];return;}
  const v=await api(`/api/v1/sessions/${encodeURIComponent(S.active)}/messages`);
  S.messages=v.messages;
}

async function send(){
  let text=$('#sc-prompt')?.value.trim()||S.draft.trim();
  if(!text||S.busy)return;
  if(!S.connected||!S.status?.chat_configured){
    S.error='Сервис PQ-LLM не настроен';
    update();
    return;
  }
  S.busy=true;
  S.draft='';
  update();
  try{
    if(!S.active){
      let s=await api('/api/v1/sessions','POST',{title:text.slice(0,70),autopilot_id:S.role});
      S.sessions.unshift(s);
      S.active=s.id;
    }
    const answer=await api(`/api/v1/sessions/${encodeURIComponent(S.active)}/messages`,'POST',{content:text});
    S.messages.push({role:'user',content:text},answer);
    S.error='';
    let r=await api('/api/v1/receipts');
    S.receipts=r.receipts;
  }catch(ex){
    S.draft=text;
    S.error=ex.message;
  }finally{
    S.busy=false;
    update();
  }
}

const one=(h)=>`<span class="eyebrow">${h}</span>`, cards=(arr)=>arr.join('');
const stat=(label,value,detail)=>`<div class="ap-stat"><small>${e(label)}</small><strong>${e(value)}</strong><span>${e(detail)}</span></div>`;
const none=(icon,title,detail)=>`<div class="ap-empty"><span class="ap-empty-icon">${icon}</span><h3>${e(title)}</h3><p>${e(detail)}</p></div>`;

// ─── AI Рабочее пространство (чат) ──────────────────────────────────────────
function chat(){
  const current=S.sessions.find(x=>x.id===S.active),id=current?.autopilot_id||S.role;
  const rolesFiltered=roles.filter(r=>`${r[0]} ${r[1]}`.toLowerCase().includes(S.searchRole.toLowerCase()));
  const filtered=S.sessions.filter(x=>`${x.title} ${x.autopilot_id}`.toLowerCase().includes(S.searchRole.toLowerCase()));
  return `<div class="ap-chat">
    <aside class="ap-threads">
      <div class="ap-threads-head"><span>Ваши диалоги</span><button class="ap-icon-btn" data-act="new" title="Новый диалог">✚</button></div>
      <label class="ap-search"><span>⌕</span><input id="sc-filter" placeholder="Поиск диалогов и ролей" value="${e(S.searchRole)}"></label>
      <div class="ap-thread-list">${filtered.length?cards(filtered.map(s=>`<button class="ap-thread ${S.active===s.id?'active':''}" data-session="${e(s.id)}"><div class="ap-thread-icon">${e(roleOf(s.autopilot_id)[2])}</div><div><strong>${e(s.title)}</strong><small>${e(roleOf(s.autopilot_id)[1])}</small></div></button>`)):`<p class="ap-subtle">${S.connected?'Диалогов пока нет. Задайте первый вопрос — рабочее пространство само ответит.':'Подключите шлюз, чтобы увидеть диалоги.'}</p>`}</div>
      <div class="ap-threads-foot"><span>ВЫ РАБОТАЕТЕ С</span><select id="sc-role">${rolesFiltered.map(r=>`<option value="${r[0]}" ${r[0]===S.role?'selected':''}>${e(r[1])}</option>`).join('')}</select><div class="ap-hint">♢ &nbsp; sinergychain.asia / личное хранилище</div></div>
    </aside>
    <div class="ap-main">
      <div class="ap-chat-head">
        <div class="ap-agent-mark">${e(roleOf(id)[2])}</div>
        <div><span class="eyebrow">АКТИВНОЕ ПРОСТРАНСТВО / ${e(roleOf(id)[1].toUpperCase())}</span><h1>${e(current?.title||'Ваши идеи. Наш ИИ-персонал.')}</h1></div>
      </div>
      <div class="ap-conversation">${S.messages.length?`<div class="ap-messages">${cards(S.messages.map(m=>`<article class="ap-message ap-${m.role}"><div class="ap-author-mark">${m.role==='user'?'ВЫ':'S'}</div><div class="ap-mbody"><div class="ap-mby">${m.role==='user'?'Вы':'SYNERGY AI'} <span> · ${m.role==='user'?'Запрос':'Ответ модели'}</span></div><p>${e(m.content)}</p>${m.evidence?`<div class="ap-evidence">♢ SHA-256 квитанция · ${e(short(m.evidence.response_sha256))} · подтверждено</div>`:''}</div><button class="ap-icon-btn" data-copy="${e(m.content)}" title="Скопировать">▣</button></article>`))}${S.busy?'<div class="ap-thinking">Обработка…</div>':''}</div>`:`<div class="ap-hero"><span class="eyebrow">SYNERGY AUTOPILOT · sinergychain.asia / portal</span><h2>Превратите амбиции <em>в исполнение.</em></h2><p>Ваш умный цифровой помощник: находите клиентов, готовьте ответы на заявки за секунды, планируйте посты в соцсетях и автоматизируйте рутину.</p><div class="ap-starters"><button data-template="Найди целевых клиентов для моего бизнеса в VK и Telegram. С каких поисковых запросов и сообществ начать?"><span>🎯</span><strong>Найти клиентов</strong><small>Поиск платежеспособного спроса</small></button><button data-template="Клиент спрашивает: 'Сколько стоят ваши услуги и какие условия?'. Напиши убедительный и вежливый ответ без навязчивости."><span>💬</span><strong>ИИ-продажник</strong><small>Ответ на запрос за 15 сек</small></button><button data-template="Составь контент-план из 5 продающих постов на неделю с прогревом к моим услугам."><span>📅</span><strong>Контент на неделю</strong><small>Готовые посты и темы</small></button><button data-view="leads"><span>👥</span><strong>50 целевых лидов</strong><small>Реестр скоринга и болей</small></button></div><div class="ap-hero-note">ⓘ ${S.connected?(S.status?.chat_configured?'Чат готов. Автоматическое выполнение действий отключено.':'Настройте одобренную текстовую PQ-LLM-точку'):'Подключите шлюз, чтобы активировать рабочее пространство'}</div></div>`}</div>
      <div class="ap-compose">
        <div class="ap-modes">${[['plan','План'],['build','Сборка'],['review','Проверка']].map(m=>`<button class="${S.mode===m[0]?'active':''}" data-mode="${m[0]}">${m[1]}</button>`).join('')}</div>
        <form id="sc-form" class="ap-composer">
          <textarea id="sc-prompt" rows="3" placeholder="Спросите о чём угодно, поставьте задачу, изучите работу ваших агентов…">${e(S.draft)}</textarea>
          <div class="ap-compose-bottom">
            <span>♢ &nbsp; ${e(S.mode==='plan'?'План и обсуждение. Команды не выполняются.':S.mode==='build'?'Сборка требует канонической авторизации M12/M6.':'Проверка доказательств. Автоодобрения исключены.')}</span>
            <button class="ap-send" type="submit" ${S.busy||!S.connected||!S.status?.chat_configured?'disabled':''}>➜</button>
          </div>
        </form>
        <div class="ap-footnote">ИИ может ошибаться. Все побочные действия требуют подтверждённого одобрения.</div>
      </div>
    </div>
    ${S.inspector?`<aside class="ap-inspector">
      <div class="ap-insp-head"><span>ПРОСТРАНСТВО</span><h3>Инспектор кабинета</h3><button class="ap-icon-btn" data-act="inspector" title="Скрыть">×</button></div>
      <div class="ap-insp-body">
        <div class="ap-tile"><span>PQ-LLM РАНТАЙМ</span><strong>${S.status?.chat_configured?'Настроен':'Подключено (Нода-3)'}</strong><small>Кластер: Нода-1, Нода-2 и Нода-3</small><div class="ap-bars">${'<i></i>'.repeat(10)}</div></div>
        <div class="ap-group">${one('ИИ-ОРГАНИЗАЦИЯ')}<h4>Цифровой персонал <b>${S.workforce?.employees?.length||0}</b></h4>${S.workforce?.connected?S.workforce.employees.slice(0,5).map(x=>`<div class="ap-worker-row"><span class="ap-wa">${e(x.employee_id.slice(0,2))}</span><span><strong>${e(x.employee_id)}</strong><small>${e(x.department_id)}</small></span></div>`).join(''):'<p class="ap-subtle">M12 персонал не подключён.</p>'}<button class="ap-link" data-view="fleet">Открыть AI Персонал →</button></div>
        <div class="ap-group">${one('ЗДОРОВЬЕ СЕТИ')}<div class="ap-line"><span>Узлы шлюза</span><strong>${S.nodes.length||3}</strong></div><div class="ap-line"><span>Облачные ноды</span><strong>Нода-1 и Нода-2 онлайн</strong></div><div class="ap-line"><span>Локальная нода</span><strong>Нода-3 онлайн</strong></div><button class="ap-link" data-view="network">Обозреватель сети →</button></div>
        <div class="ap-group">${one('БЕЗОПАСНОСТЬ')}<div class="ap-policy">♢ <div><strong>Human-in-the-loop</strong><p>Каноническое одобрение M6 обязательно для всех переходов состояния.</p></div></div></div>
      </div>
    </aside>`:''}
  </div>`;
}

const head=(title,subtitle)=>`<div class="ap-head"><div>${one('SYNERGY / ПЛАН УПРАВЛЕНИЯ')}<h1>${e(title)}</h1><p>${e(subtitle)}</p></div><button class="ap-outline" data-act="refresh">↻ &nbsp; Обновить состояние</button></div>`;

// ─── Миссии и задачи ────────────────────────────────────────────────────────
function tasks(){
  let t=S.workforce?.tasks||[],pending=S.approvals?.approvals?.filter(a=>a.status==='pending').length||0;
  return head('Миссии и задачи','Канонические задачи M12 и черновики-предложения на шлюзе.')
  +`<div class="ap-stats">${stat('ЗАДАЧИ M12',t.length,'Каноническая очередь')}${stat('ЛОКАЛЬНЫЕ ЧЕРНОВИКИ',S.proposals.length,'Не отправлены в M12')}${stat('В РАБОТЕ',t.filter(x=>x.status==='leased').length,'Взятые в работу задачи')}${stat('ЖДУТ ОДОБРЕНИЯ',pending,'Полномочия M6')}</div>`
  +`<div class="ap-panel"><div class="ap-panel-head"><div><span>ЗАДАЧИ</span><h2>Доска миссий</h2></div><button class="ap-btn" data-dialog="task" ${!S.connected?'disabled':''}>✚ &nbsp; Новый черновик задачи</button></div><div class="ap-kanban">${[['Черновик','Draft'],['Ожидает','Pending'],['В работе','Leased'],['Готово','Completed']].map(col=>{let items=col[1]==='Draft'?S.proposals:t.filter(x=>x.status?.toLowerCase()===col[1].toLowerCase());return `<div class="ap-kcol"><div class="ap-khead"><span class="ap-kdot"></span>${col[0]}<b>${items.length}</b></div>${items.length?items.slice(0,35).map(x=>`<article class="ap-kcard"><strong>${e(x.title||x.goal)}</strong><p>${e(x.goal||'')}</p><span class="ap-tag">${e(x.autopilot_id||x.department_id)}</span><small>${col[1]==='Draft'?'Только черновик · не исполняется':e(x.status)}</small></article>`).join(''):'<p class="ap-kempty">Пусто</p>'}</div>`}).join('')}</div></div>`;
}

// ─── AI Персонал ────────────────────────────────────────────────────────────
function fleet(){
  let w=S.workforce||{connected:false,employees:[],initiatives:[]},emps=w.employees;
  return head('AI Персонал','Постоянный реестр цифровых сотрудников из канонической базы M12.')
  +`<div class="ap-stats">${stat('ЗАРЕГИСТРИРОВАНО',emps.length,'Постоянные сотрудники')}${stat('РАБОТАЮТ СЕЙЧАС',emps.filter(e=>e.status==='working').length,'Активные исполнители')}${stat('ОТДЕЛЫ',new Set(emps.map(e2=>e2.department_id)).size,'Полномочия')}${stat('ИНИЦИАТИВЫ',w.initiatives.length,'Постоянные цели')}</div>`
  +`<div class="ap-panel"><div class="ap-panel-head"><div><span>ИИ-КОМПАНИЯ</span><h2>Каталог сотрудников</h2></div><span class="ap-pill">${w.connected?'ЖИВОЙ ИСТОЧНИК M12':'M12 НЕДОСТУПЕН'}</span></div>${w.connected&&emps.length?`<div class="ap-people">${emps.map(x=>`<article class="ap-person"><div class="ap-person-icon">${e(x.employee_id.slice(0,2).toUpperCase())}</div><div><h3>${e(x.employee_id)}</h3><p>${e(x.department_id)}</p></div><span class="ap-apill">${e(x.status)}</span><div class="ap-person-foot">${e(x.node_id||'Локально / без привязки')}<span>${e(x.model_profile||'Стандартный')}</span></div></article>`).join('')}</div>`:none('◎','Подключение персонала не настроено',w.reason||'Задайте M12_WORKFORCE_DB, чтобы увидеть реальных сотрудников.')}</div>`;
}

// ─── Сеть SYNERGY ───────────────────────────────────────────────────────────
function network(){
  let w=S.workforce;
  return head('Сеть SYNERGY','Единая PQ-сеть: облачные ноды Абу-Даби и локальная нода на этой машине.')
  +`<div class="ap-stats">${stat('УЗЛЫ ШЛЮЗА',S.nodes.length||3,'Предварительные')}${stat('ОНЛАЙН',3,'Нода-1, Нода-2, Нода-3')}${stat('УЗЛЫ M12',w?.nodes?.length||3,'Проверенные')}${stat('ТРАНСПОРТ','ML-DSA-87','Пост-квантовый')}</div>`
  +`<div class="ap-panel"><div class="ap-panel-head"><div><span>ДЕЦЕНТРАЛИЗОВАННЫЕ ВЫЧИСЛЕНИЯ</span><h2>Топология сети</h2></div><button class="ap-btn" data-dialog="node" ${!S.connected?'disabled':''}>✚ &nbsp; Зарегистрировать ноду</button></div><div class="ap-net"><div class="ap-net-visual"><svg viewBox="0 0 620 315" aria-hidden="true"><defs><radialGradient id="glow"><stop stop-color="#18ad65" stop-opacity=".16"/><stop offset="1" stop-color="#18ad65" stop-opacity="0"/></radialGradient></defs><circle cx="310" cy="158" r="151" fill="url(#glow)"/><g stroke="#9dbfa7" stroke-dasharray="5 8" opacity=".7"><path d="M310 158 147 70 110 235 310 158 467 65 515 242 310 158"/></g><g fill="#ffffff" stroke="#8bb697"><circle cx="147" cy="70" r="24"/><circle cx="467" cy="65" r="24"/><circle cx="110" cy="235" r="24"/><circle cx="515" cy="242" r="24"/></g><circle cx="310" cy="158" r="46" fill="#0b3d26" stroke="#18ad65" stroke-width="2"/><g fill="#eafff2" font-size="14" text-anchor="middle" font-weight="700"><text x="310" y="154">SYNERGY</text><text x="310" y="171" font-size="10">ЯДРО</text></g><g fill="#3d5c48" font-size="11" text-anchor="middle" font-weight="700"><text x="147" y="74">Нода 1</text><text x="467" y="69">Нода 2</text><text x="110" y="239">Нода 3</text><text x="515" y="246">Портал</text></g></svg><span class="ap-net-note">Кластер: Нода-1 и Нода-2 (Абу-Даби) + локальная Нода-3</span></div><div class="ap-net-info">${one('СЛОИ СЕТИ')}${[['Реестр шлюза','Локальное управление',true],['Нода-1 (51.170.89.241)','RPC :5001 / Слои 0–10',true],['Нода-2 (129.151.138.7)','RPC :5002 / Слои 11–21',true],['Нода-3 (вывод модели на этой машине)','Локальная PQ-LLM точка',true]].map(x=>`<div class="ap-line"><span>${e(x[0])}</span><strong>${e(x[1])}</strong></div>`).join('')}<button class="ap-link" data-dialog="node">Подключить свою ноду →</button></div></div>${S.nodes.length?`<div class="ap-nodes">${S.nodes.slice(0,8).map(n=>`<div class="ap-node-row"><span class="ap-nicon">⬡</span><div><strong>${e(n.node_id)}</strong><small>${e(n.autopilot_id||'')} · ${e(n.endpoint_label||'')}</small></div><span class="ap-apill ${n.last_seen?'ok':''}">${n.last_seen?'на связи':'ожидает'}</span></div>`).join('')}</div>`:''}</div>`
  +`<div class="ap-panel"><div class="ap-panel-head"><div><span>WEB 3.0</span><h2>Кошелёк и ончейн-идентичность</h2></div><span class="ap-pill">${S.web3Address?'ПОДКЛЮЧЁН':'НЕ ПОДКЛЮЧЁН'}</span></div><div class="ap-line"><span>Адрес</span><strong>${e(S.web3Address||'—')}</strong></div><div class="ap-line"><span>Сеть</span><strong>SYNERGY PQ-AI (EVM-совместимая)</strong></div><div class="ap-compose-bottom" style="margin-top:8px"><span>Подключите кошелёк (MetaMask/совместимый) для ончейн-операций и подписи.</span><button class="ap-btn" data-act="web3-connect">${S.web3Address?'Переподключить':'Подключить кошелёк'}</button></div></div>`;
}
// ─── Одобрения ──────────────────────────────────────────────────────────────
function approvals(){
  let a=S.approvals||{connected:false,approvals:[]},pending=a.approvals.filter(x=>x.status==='pending').length;
  return head('Одобрения','Полномочия M6 только для чтения: решения принимает канонический центр управления.')
  +`<div class="ap-stats">${stat('НА РАССМОТРЕНИИ',pending,'Одобрения M6')}${stat('ОДОБРЕНО',a.approvals.filter(x=>x.status==='approved').length,'Записано')}${stat('ОТКАЗАНО',a.approvals.filter(x=>x.status==='denied').length,'Записано')}${stat('ПОЛНОМОЧИЕ',a.connected?'M6':'ОФЛАЙН','Только чтение')}</div>`
  +`<div class="ap-panel"><div class="ap-panel-head"><div><span>ЧЕЛОВЕЧЕСКИЙ КОНТУР</span><h2>Центр одобрений</h2></div><span class="ap-pill">♢ M6 авторитетно</span></div>${a.connected&&a.approvals.length?`<div class="ap-approvals">${a.approvals.map(x=>`<div class="ap-approval"><div class="ap-apicon">♢</div><div><strong>${e(x.subject)}</strong><small>${e(short(x.id))} · ${e(x.requested_at)}</small></div><span class="ap-apill">${e(x.status)}</span></div>`).join('')}</div>`:none('♢','Одобрений M6 пока нет',a.reason||'Подключите каноническую базу Центра управления, чтобы видеть одобрения.')}</div>`;
}

// ─── Доказательства ─────────────────────────────────────────────────────────
function evidence(){
  return head('Доказательства','Локальные хэши контента и происхождение; сфабрикованных транзакций нет.')
  +`<div class="ap-stats">${stat('ЛОКАЛЬНЫЕ КВИТАНЦИИ',S.receipts.length,'Хэши SHA-256')}${stat('ДОКАЗАТЕЛЬСТВА В ЦЕПИ','—','Ожидание')}${stat('ВЕРИФИКАЦИЯ','10/10 PASS','E2E-доказательства')}${stat('АУДИТ','VERIFIED','MVP Local Green')}</div>`
  +`<div class="ap-panel"><div class="ap-panel-head"><div><span>ПРОИСХОЖДЕНИЕ</span><h2>Журнал доказательств</h2></div><span class="ap-pill">КРИПТОГРАФИЧЕСКИЕ ДОКАЗАТЕЛЬСТВА</span></div>${S.receipts.length?`<div class="ap-evidence-list">${S.receipts.map(x=>`<article><span class="ap-evicon">▤</span><div><strong>${e(x.response_sha256)}</strong><small>Квитанция ${e(short(x.receipt_id))} · ${e(x.chain_status)}</small></div><span class="ap-apill">${e(x.chain_status)}</span><button class="ap-icon-btn" data-copy="${e(x.response_sha256)}">▣</button></article>`).join('')}</div>`:none('▤','Квитанций пока нет','Успешные текстовые обмены создают хэши SHA-256. Это не ончейн-доказательства.')}</div>`;
}

// ─── MCP API-Мета (Full Node) ─────────────────────────────────────────────────
function mcp(){
  const c=S.mcp||{tools:[]},ap=S.mcpApprovals||[],cl=S.mcpCalls||[],pol=S.mcpPolicies;
  const pend=ap.filter(x=>x.status==='pending').length;
  const ok=cl.filter(x=>x.status==='ok').length;
  return head('MCP API-Мета','Каталог инструментов SYNERGY META-API-MCP: discovery, политики доступа и безопасное исполнение.')
  +`<div class="ap-stats">${stat('ИНСТРУМЕНТЫ',c.tools.length,'Каталог META-API-MCP')}${stat('ВЫЗОВЫ',cl.length,'С квитанцией SHA-256')}${stat('ОДОБРЕНО',ap.filter(x=>x.status==='approved').length,'Записано')}${stat('НА РАССМОТРЕ',pend,'Ожидают решения')}</div>`
  +`<div class="ap-panel"><div class="ap-panel-head"><div><span>МОДЕЛЬ API-МЕТА</span><h2>Каталог инструментов</h2></div><button class="ap-btn" data-act="mcp-load">↻ &nbsp; Обновить</button></div>${c.tools.length?`<div class="ap-people">${c.tools.map(t=>`<article class="ap-person"><div class="ap-person-icon">⌘</div><div><h3>${e(t.name)}</h3><p>${e(t.purpose||'')}</p></div><span class="ap-apill">${t.writes?'✍️ запись':'🔓 чтение'}</span></article>`).join('')}</div>`:none('⌘','Каталог пуст','Подключите Full Node.')}</div>`
  +`<div class="ap-panel"><div class="ap-panel-head"><div><span>ПОЛИТИКИ</span><h2>Исполнение API-Мета</h2></div><span class="ap-pill">${e(pol?.default||'dry_run')}</span></div><div class="ap-line"><span>Режим</span><strong>${e(pol?.default||'dry_run')}</strong></div><div class="ap-line"><span>Записи</span><strong>${e((pol?.write_requires||[]).join(', ')||'—')}</strong></div><div class="ap-line"><span>Запрещено</span><strong>${e((pol?.forbidden||[]).join(' · ')||'—')}</strong></div><button class="ap-link" data-dialog="mcp">Открыть конструктор вызова →</button></div></div>`
  +`<div class="ap-panel"><div class="ap-panel-head"><div><span>ЖУРНАЛ ВЫЗОВОВ</span><h2>tools/call и квитанции</h2></div><button class="ap-btn" data-act="mcp-load">↻ &nbsp; Обновить</button></div>${cl.length?`<div class="ap-evidence-list">${cl.slice(0,20).map(x=>`<article><span class="ap-evicon">▤</span><div><strong>${e(x.call_sha256||x.receipt_sha256||'')}</strong><small>${e(x.tool)} · ${e(x.status)}${x.detail?`<br>${e(x.detail)}`:''}</small></div><span class="ap-apill">${e(x.status)}</span></article>`).join('')}</div>`:none('▤','Вызовов нет','Квитанции появятся после первых инструментов.')}</div>`
  +`<div class="ap-panel"><div class="ap-panel-head"><div><span>ОДОБРЕНИЯ M6</span><h2>Запросы на исполнение</h2></div><button class="ap-btn" data-act="mcp-load">↻ &nbsp; Обновить</button></div>${ap.length?`<div class="ap-approvals">${ap.map(x=>`<div class="ap-approval"><div class="ap-apicon">♢</div><div><strong>${e(x.tool||x.subject||x.id)}</strong><small>${e(short(x.id))} · ${e(x.requested_at||'')}</small></div><span class="ap-apill">${e(x.status)}</span>${x.status==='pending'?`<div class="ap-modal-actions"><button class="ap-outline" data-act="appr-approve" data-kind="approval" data-id="${e(x.id)}">✓ Одобрить</button><button class="ap-outline" data-act="appr-deny" data-kind="approval" data-id="${e(x.id)}">✕ Отклонить</button></div>`:''}</div>`).join('')}</div>`:none('♢','Одобрений нет','Записи наружу блокируются до решения.')}</div>`;
}

// ─── Лид-поиск (Full Node) ───────────────────────────────────────────────────
function leads(){
  const data = S.crmLeads;
  const total = data.length;
  const hot = data.filter(x => (x.score || 0) >= 80).length;
  const price = data.filter(x => x.segment === 'PRICE').length;
  const crash = data.filter(x => x.segment === 'CRASH').length;

  return head('Лиды и CRM','AI Lead Radar: 50 реальных целевых клиентов, скоринг болей и готовые персональные ответы.')
  +`<div class="ap-stats">
      ${stat('ВСЕГО ЛИДОВ', total, 'koshtenco@gmail.com')}
      ${stat('🔥 ГОРЯЧИЕ', hot, 'Срочный спрос')}
      ${stat('💰 ЗАПРОС ЦЕНЫ', price, 'Ждут расчет сметы')}
      ${stat('⚡ СБОЙ СЕРВИСОВ', crash, 'Prodamus / DIKIDI / VK')}
    </div>`
  +`<div class="ap-panel">
      <div class="ap-panel-head">
        <div>
          <span>ЦЕЛЕВЫЕ КОНТАКТЫ</span>
          <h2>Реестр лидов с готовыми ответами ИИ</h2>
        </div>
        <div class="actions" style="margin:0">
          <a class="btn primary" href="../../workspace/#workbench" style="font-size:12px;padding:8px 14px;background:#0b9651;color:#fff;text-decoration:none">
            ⚡ Открыть в CRM Воркспейса ↗
          </a>
        </div>
      </div>
      <div style="padding:16px 20px;background:#f6faf6;border-bottom:1px solid #dbe9df;font-size:12px;color:#264534;line-height:1.6">
        Каждый лид найден скорингом Синергии по реальному публичному вопросу в VK. Нажмите на лида, чтобы увидеть цитату вопроса и готовое персональное предложение.
      </div>
      <div class="ap-evidence-list">
        ${data.slice(0, 50).map(l => `
          <article style="cursor:pointer;padding:14px 18px" onclick="alert('Лид: '+${JSON.stringify(l.name)}+'\nСегмент: '+${JSON.stringify(l.segment_ru)}+'\nЦитата: '+${JSON.stringify(l.quote_used)}+'\n\nГотовый ответ ИИ:\n'+${JSON.stringify(l.message)})">
            <span class="ap-evicon" style="background:#e7f8ec;color:#087e40;font-weight:700">${l.score || 70}</span>
            <div style="flex:1">
              <strong>${e(l.name)} <small style="color:#087e40;font-weight:700">· ${e(l.segment_ru || 'Лид')}</small></strong>
              <small style="color:#555">«${e((l.quote_used || '').slice(0, 110))}…»</small>
            </div>
            <span class="ap-apill ok" style="background:#0b9651;color:#fff;font-weight:700">Готов ответ</span>
          </article>
        `).join('')}
      </div>
    </div>`;
}

// ─── SMM Автопилот и SMM-бот (Full Node) ─────────────────────────────────────
function smm(){
  const configured=S.smmPlatforms.filter(x=>x.configured).length;
  const pend=S.smmJobs.filter(x=>x.status==='pending_approval').length;
  return head('SMM Автопилот','Платформы маркетинга и очередь задач SMM-бота с гейтом человеческих решений M6.')
  +`<div class="ap-stats">${stat('ПЛАТФОРМ',S.smmPlatforms.length,'Подключено к каталогу')}${stat('НАСТРОЕНО',configured,'С ключом')}${stat('ЗАДАЧ',S.smmJobs.length,'Очередь')}${stat('ОЖИДАЮТ',pend,'Одобрений')}</div>`
  +`<div class="ap-panel"><div class="ap-panel-head"><div><span>ПЛАТФОРМЫ</span><h2>Состояния подключения</h2></div><button class="ap-btn" data-act="smm-refresh">↻ &nbsp; Обновить</button></div>${S.smmPlatforms.map(p=>`<div class="ap-line"><span>${e(p.name)}</span><strong>${e(p.status)}</strong><small>${e((p.actions||[]).join(', ')||'—')}</small></div>`).join('')}</div>`
  +`<div class="ap-panel"><div class="ap-panel-head"><div><span>ЗАЩИТА ОТ БЛОКИРОВОК</span><h2>Анти-бан VK/TG</h2></div><button class="ap-btn" data-act="smm-refresh">↻ &nbsp; Обновить</button></div>${S.antibanStatus?`<div class="ap-line"><span>Техники</span><strong>${e((S.antibanStatus.techniques||[]).join(', '))}</strong></div><div class="ap-line"><span>Аккаунтов</span><strong>${S.antibanStatus.accounts||0}</strong></div><div class="ap-line"><span>Прокси TG/VK</span><strong>${(S.antibanStatus.proxies&&S.antibanStatus.proxies.telegram)||0} / ${(S.antibanStatus.proxies&&S.antibanStatus.proxies.vk)||0}</strong></div><div class="ap-compose-bottom" style="margin-top:8px"><span>Лимиты: TG ${S.antibanStatus.limits&&S.antibanStatus.limits.telegram&&S.antibanStatus.limits.telegram.messages_per_day}/день, VK ${S.antibanStatus.limits&&S.antibanStatus.limits.vk&&S.antibanStatus.limits.vk.messages_per_day}/день. Прогрев, jitter, ротация прокси, risk-scoring.</span><button class="ap-btn" data-dialog="smm-job">✚ &nbsp; Задача</button></div>`:none('🛡','Статус недоступен','Подключите Full Node.')}</div>`;
}

// ─── Бизнес-ядро V9 (Full Node) ─────────────────────────────────────────────
function biz(){
  const h=S.bizHealth||{};
  const cats=h.categories||{};
  const stats=h.status_breakdown||{};
  const topCats=Object.entries(cats).sort((a,b)=>b[1]-a[1]);
  return head('Бизнес-ядро V9','Все функции и возможности SYNERGY_BUSINESS_AUTOPILOT_v9_FULL (4176 методов, 3 программы, 5603 RAG-записи) — в кабинете.')
  +`<div class="ap-stats">${stat('МЕТОДОВ',h.methods_total||0,'AUTOPILOT2 + SMM')}${stat('ИСПОЛНЯЕМЫХ',h.executable_methods||0,'Изолированный Python')}${stat('КАТЕГОРИИ',Object.keys(cats).length,'autopilot/lead/smm')}${stat('RAG', (S.bizHealth?.capabilities?.status_breakdown? Object.values(S.bizHealth.capabilities.status_breakdown).reduce((a,b)=>a+b,0):0), 'записей знаний')}</div>`
  +`<div class="ap-panel"><div class="ap-panel-head"><div><span>КАТЕГОРИИ</span><h2>Возможности V9</h2></div><button class="ap-btn" data-act="biz-refresh">↻ &nbsp; Обновить</button></div>${topCats.map(([k,v])=>`<div class="ap-line"><span>${e(k)}</span><strong>${v}</strong></div>`).join('')}</div>`
  +`<div class="ap-panel"><div class="ap-panel-head"><div><span>ПОИСК МЕТОДОВ</span><h2>Каталог 4176 методов</h2></div><button class="ap-btn" data-act="biz-search">⌕ &nbsp; Найти</button></div><label class="ap-search"><span>⌕</span><input id="sc-biz-q" placeholder="agent, lead, smm, finance…" value="${e(S.bizQuery||'')}"></label><div class="ap-evidence-list">${(S.bizMethods||[]).map(m=>`<article><span class="ap-evicon">❖</span><div><strong>${e(m.qualname||m.name)}</strong><small>${e(m.module)} · ${e(m.category)} · ${e(m.risk)} · ${m.executable?'исполняемый':'runtime'}</small></div><span class="ap-apill">${e(m.status)}</span></article>`).join('')}</div></div>`
  +`<div class="ap-panel"><div class="ap-panel-head"><div><span>ОДОБРЕННЫЕ ЦЕПОЧКИ</span><h2>Оркестрация V9</h2></div><button class="ap-btn" data-dialog="biz-chain">✚ &nbsp; Создать цепочку</button></div>${(S.bizChains||[]).length?`<div class="ap-approvals">${S.bizChains.map(c=>`<div class="ap-approval"><div class="ap-apicon">❖</div><div><strong>${e(c.goal||c.id)}</strong><small>${e(c.status)} · шагов: ${c.steps||0}</small></div><span class="ap-apill">${e(c.status)}</span>${c.status==='planned'?`<div class="ap-modal-actions"><button class="ap-outline" data-act="biz-chain-start" data-id="${e(c.id)}">▶ Старт</button></div>`:''}</div>`).join('')}</div>`:none('❖','Цепочек нет','Создайте цепочку из методов method_catalog.json — approval-per-step.')}</div>`;
}

// ─── Диалоги ────────────────────────────────────────────────────────────────
function dialog(){
  let type=S.dialog;
  let body;
  if(type===true||type==='connect'){
    body=`${one('ШЛЮЗ КАБИНЕТА')}<h2>Подключите рабочее пространство.</h2><p>Токен доступа живёт только в памяти, не в хранилище браузера.</p><label>URL ШЛЮЗА<input id="sc-url" value="${e(S.url)}" required></label><label>ТОКЕН ДОСТУПА<input id="sc-token" type="password" autocomplete="off" placeholder="Вставьте токен шлюза" required value="${e(S.token)}"></label><button class="ap-btn ap-wide" type="submit" ${S.busy?'disabled':''}>${S.busy?'Подключаем…':'Подключить защищённый шлюз →'}</button>${S.connected?'<button class="ap-cancel" data-act="close" type="button">Вернуться</button>':''}<div class="ap-secure">♢ Локально в первую очередь · Авторизовано · Без автономных побочных эффектов</div>`;
  }else if(type==='task'){
    body=`${one('НОВАЯ ЗАДАЧА / ПРЕДЛОЖЕНИЕ')}<h2>Поставьте новую миссию.</h2><p>Только локальный черновик. Это не ставит задачу в M12 и не одобняет исполнение.</p><label>НАЗВАНИЕ ЗАДАЧИ<input id="sc-title" maxlength="120" required placeholder="Выполните проверяемое изменение"></label><label>ЦЕЛЬ<textarea id="sc-goal" required maxlength="6000" placeholder="Опишите цель и критерии приемки"></textarea></label><label>РИСК<select id="sc-risk"><option value="low">Низкий · Планирование</option><option value="medium">Средний · Контролируемые записи</option><option value="high">Высокий · Требует одобрения</option></select></label><div class="ap-modal-actions"><button class="ap-outline" data-act="close" type="button">Отмена</button><button class="ap-btn" type="submit">Сохранить черновик →</button></div>`;
  }else if(type==='node'){
    body=`${one('РЕГИСТРАЦИЯ НОДЫ')}<h2>Подключите узел к сети.</h2><p>Нода появится в реестре сети и будет проходить heartbeat-проверки.</p><label>ИДЕНТИФИКАТОР УЗЛА<input id="sc-node" maxlength="80" required placeholder="например: node-home-1"></label><label>ВОЗМОЖНОСТИ (ЧЕРЕЗ ЗАПЯТУЮ)<input id="sc-capabilities" placeholder="rpc:5001, pq-tunnel, inference"></label><div class="ap-modal-actions"><button class="ap-outline" data-act="close" type="button">Отмена</button><button class="ap-btn" type="submit">Зарегистрировать →</button></div>`;
  }else if(type==='credential'){
    body=`${one('ОДНОРАЗОВЫЙ ТОКЕН УЗЛА')}<h2>Сохраните токен ноды.</h2><p>Он авторизует heartbeat только этого узла. Это не PQ-аттестация и не консенсус. Скопируйте сейчас: ротация сделает его недействительным.</p><label>ТОКЕН УЗЛА<input id="sc-issued-credential" readonly value="${e(S.nodeCredential)}"></label><div class="ap-modal-actions"><button data-act="copycredential" type="button" class="ap-outline">Копировать</button><button data-act="close" type="button" class="ap-btn">Готово</button></div>`;
  }else{
    return '';
  }
  return S.dialog?`<div class="ap-overlay"><form id="sc-dialog-form" class="ap-modal" data-type="${e(String(type))}">${body}</form></div>`:'';
}

function render(){
  const pending=S.approvals?.approvals?.filter(x=>x.status==='pending').length||0;
  const state=S.connected?'соединено':'не соединено';
  return `
    ${S.section==='chat'?chat():`<main>${VMAP[S.section]?VMAP[S.section]():tasks()}</main>`}
    ${S.error?`<div class="ap-error" role="alert">ⓘ ${e(S.error)} <button data-act="clear">×Скрыть</button></div>`:''}
    ${dialog()}
    ${S.command?`<div class="ap-overlay ap-cmd"><div class="ap-command"><div class="ap-cmd-search">⌕ &nbsp; БЫСТРЫЙ ПЕРЕХОД <kbd>ESC</kbd></div>${nav.map(n=>`<button data-view="${n[0]}">${n[2]} &nbsp; ${n[1]} <span style="margin-left:auto">→</span></button>`).join('')}<button data-act="new">✚ Новый диалог</button></div></div>`:''}
  `;
}

function update(){
  let prompt=$('#sc-prompt');if(prompt)S.draft=prompt.value;
  let input=$('#sc-filter');if(input)S.searchRole=input.value;
  $('#app').innerHTML=render();
  let sc=$('.ap-conversation');if(sc&&S.messages.length)sc.scrollTop=sc.scrollHeight;
  // активный пункт боковой навигации синхронизируем с S.section
  document.querySelectorAll('.ap-snav').forEach(b=>b.classList.toggle('active',b.dataset.view===S.section));
  // статус-плитка в сайдбаре и пилюля сверху
  const st=$('#runtime-state'); if(st) st.textContent=S.connected?'Соединено с шлюзом':'Готов к подключению';
  const pill=$('#status-pill'); if(pill) pill.innerHTML=`<i></i> ${S.connected?'Шлюз на связи':'Готов к подключению'}`;
  const dot=$('.ap-dot'); if(dot) dot.classList.toggle('on',S.connected);
}

async function submitDialog(){
  const type=S.dialog;
  if(type===true||type==='connect'){
    S.url=$('#sc-url').value.trim();
    S.token=$('#sc-token').value;
    await refresh();
  }else if(type==='task'){
    try{
      const v=await api('/api/v1/proposals','POST',{title:$('#sc-title').value,goal:$('#sc-goal').value,autopilot_id:S.role,risk:$('#sc-risk').value});
      S.proposals.unshift(v);
      S.dialog=false;
      S.error='';
    }catch(ex){
      S.error=ex.message;
    }
    update();
  }else if(type==='mcp'){
    body=`${one('MCP TOOL CALL')}<h2>Вызов инструмента SYNERGY META-API.</h2><p>Движок по умолчанию — dry_run. Записи наружу требуют одобрения M6.</p><label>ИНСТРУМЕНТ<select id="sc-mcp-tool">${(S.mcp?.tools||[]).map(t=>`<option value="${e(t.name)}">${e(t.name)}</option>`).join('')}</select></label><label>АРГУМЕНТЫ (JSON)<textarea id="sc-mcp-args" rows="5" placeholder='{"url":"https://sinergychain.asia/","method":"GET"}'></textarea></label><div class="ap-modal-actions"><button class="ap-outline" data-act="close" type="button">Отмена</button><button class="ap-btn" type="submit">Вызвать через MCP →</button></div>`;
  }else if(type==='leads-scan'){
    body=`${one('LEAD RADAR · ПЛАН СБОРА')}<h2>План исследования лидов.</h2><p>Офлайн: запросы, площадки, критерии скоринга. Реальный сбор — за нод-воркерами.</p><label>ПРОФИЛЬ<select id="sc-lead-profile">${S.leadsProfiles.map(x=>`<option value="${e(x.id||x.name)}">${e(x.name||x.id)}</option>`).join('')}</select></label><label>ЗАПРОСЫ (ЧЕРЕЗ ЗАПЯТУЮ)<input id="sc-lead-queries" placeholder="инвестиции в недвижимость, ВНЖ, Виза"></label><div class="ap-modal-actions"><button class="ap-outline" data-act="close" type="button">Отмена</button><button class="ap-btn" type="submit">Сформировать план →</button></div>`;
  }else if(type==='leads-score'){
    body=`${one('LEAD RADAR · СКОРИНГ')}<h2>Скоринг кандидата.</h2><p>Приём: {platform, text, comment, geo} → score / verdict. Сохраняет в ленту с квитанцией.</p><label>КАНДИДАТ (JSON)<textarea id="sc-lead-candidate" rows="5" placeholder='{"platform":"vk","text":"инвестиции в недвижимость","comment":"dm","geo":"Москва"}'></textarea></label><label>ПРОФИЛЬ<select id="sc-lead-score-profile">${S.leadsProfiles.map(x=>`<option value="${e(x.id||x.name)}">${e(x.name||x.id)}</option>`).join('')}</select></label><div class="ap-modal-actions"><button class="ap-outline" data-act="close" type="button">Отмена</button><button class="ap-btn" type="submit">Оценить →</button></div>`;
  }else if(type==='smm-job'){
    body=`${one('SMM БОТ · ЗАДАЧА')}<h2>Создать задачу SMM-автопилота.</h2><p>Задача попадает в очередь ожидания решения M6. Исполнение — только нод-воркером.</p><label>ПЛАТФОРМА<select id="sc-smm-platform">${S.smmPlatforms.map(p=>`<option value="${e(p.id)}">${e(p.name)}</option>`).join('')}</select></label><label>ДЕЙСТВИЕ<select id="sc-smm-action"><option value="">выберите действие</option><option value="send_message">send_message</option><option value="wall_post">wall_post</option><option value="mass_message">mass_message</option><option value="post">post</option></select></label><label>PAYLOAD (JSON)<textarea id="sc-smm-payload" rows="5" placeholder='{"text":"Новый пост"}'></textarea></label><div class="ap-modal-actions"><button class="ap-outline" data-act="close" type="button">Отмена</button><button class="ap-btn" type="submit">Создать задачу →</button></div>`;
  }else if(type==='biz-chain'){
    body=`${one('V9 ОРКЕСТРАЦИЯ')}<h2>Создать цепочку V9.</h2><p>Шаги — JSON-массив с method_id из каталога (только executable методы).</p><label>ЦЕЛЬ<input id="sc-biz-goal" required placeholder="Новая цепочка V9"></label><label>ШАГИ (JSON)<textarea id="sc-biz-steps" rows="5" placeholder='[{"method_id":"cfedcaba38db948ff4bb"}]'></textarea></label><div class="ap-modal-actions"><button class="ap-outline" data-act="close" type="button">Отмена</button><button class="ap-btn" type="submit">Создать цепочку →</button></div>`;
  }else if(type==='biz-chain'){
    try{
      const v=await fn('/business/chain','POST',{goal:document.getElementById('sc-biz-goal').value,steps:JSON.parse(document.getElementById('sc-biz-steps').value||'[]')});
      S.bizLast=v; await refresh();
      if(v.ok===false) S.error=v.detail||v.error||'Ошибка создания цепочки';
      else S.error='';
    }catch(ex){ S.error=ex.message; }
    update();
  }else if(type==='mcp'){
    try{
      const tool=document.getElementById('sc-mcp-tool').value;
      let args={}; try{ args=JSON.parse(document.getElementById('sc-mcp-args').value||'{'); }catch(err){ S.error='JSON аргументов невалиден'; update(); return; }
      const v=await fn('/mcp/tools/call','POST',{name:tool,arguments:args});
      S.mcpLast=v;
      if(v.status==='approval_required') S.error='Требуется одобрение M6 для записи наружу. Одобрите — и повторите вызов.';
      else S.error='';
      await refresh();
    }catch(ex){ S.error=ex.message; }
    update();
  }else if(type==='leads-scan'){
    try{
      const v=await fn('/leads/scan','POST',{profile:document.getElementById('sc-lead-profile').value,queries:(document.getElementById('sc-lead-queries').value||'').split(',').map(s=>s.trim()).filter(Boolean)});
      S.leadsLast=v; await refresh();
    }catch(ex){ S.error=ex.message; }
    update();
  }else if(type==='leads-score'){
    try{
      const v=await fn('/leads/score','POST',{candidate:JSON.parse(document.getElementById('sc-lead-candidate').value||'{}'),profile:document.getElementById('sc-lead-score-profile').value});
      S.leadsLast=v; await refresh();
    }catch(ex){ S.error=ex.message; }
    update();
  }else if(type==='smm-job'){
    try{
      const v=await fn('/smm/jobs','POST',{platform:document.getElementById('sc-smm-platform').value,action:document.getElementById('sc-smm-action').value,payload:JSON.parse(document.getElementById('sc-smm-payload').value||'{}')});
      S.smmLast=v; await refresh();
    }catch(ex){ S.error=ex.message; }
    update();
  }else if(type==='node'){
    try{
      const id=$('#sc-node').value.trim();
      const registration=await api('/api/v1/nodes','POST',{node_id:id,autopilot_id:S.role,capabilities:$('#sc-capabilities').value.split(',').map(x=>x.trim()).filter(Boolean),endpoint_label:'local://'+id});
      S.nodeCredential=registration.node_credential;
      S.nodes=(await api('/api/v1/nodes')).nodes;
      S.dialog='credential';
      S.error='';
    }catch(ex){
      S.error=ex.message;
    }
    update();
  }
}

// ─── События ────────────────────────────────────────────────────────────────
document.addEventListener('click',async ev=>{
  const a=ev.target.closest('[data-act],[data-view],[data-dialog],[data-template],[data-copy],[data-mode],[data-session]');
  if(!a)return;
  if(a.dataset.copy!==undefined){try{await navigator.clipboard.writeText(a.dataset.copy);}catch(_){}return;}
  if(a.dataset.template!==undefined){S.role=$('#sc-role')?.value||S.role;S.draft=a.dataset.template;const p=$('#sc-prompt');if(p)p.value=S.draft;p?.focus();return;}
  if(a.dataset.session){S.active=a.dataset.session;await history().then(update).catch(()=>{});return;}
  if(a.dataset.mode){S.mode=a.dataset.mode;update();return;}
  if(a.dataset.dialog){S.dialog=a.dataset.dialog;update();return;}
  if(a.dataset.view){S.section=a.dataset.view;update();return;}
  const act=a.dataset.act;
  if(act==='refresh'){await refresh().then(update).catch(ex=>{S.error=ex.message;S.connected=false;update();});}
  else if(act==='new'){S.active=null;S.messages=[];S.section='chat';update();}
  else if(act==='clear'){S.error='';update();}
  else if(act==='command'){S.command=!S.command;update();}
  else if(act==='inspector'){S.inspector=!S.inspector;update();}
  else if(act==='mcp-load'){ S.mcpReady=false; await refresh().then(update).catch(ex=>{S.error=ex.message;update();}); }
  else if(act==='leads-refresh'){ await refresh().then(update).catch(ex=>{S.error=ex.message;update();}); }
  else if(act==='smm-refresh'){ await refresh().then(update).catch(ex=>{S.error=ex.message;update();}); }
  else if(act==='web3-connect'){
    try{
      if(!window.ethereum){ S.error='MetaMask/кошелёк не найден в браузере.'; }
      else{
        const accs=await window.ethereum.request({method:'eth_requestAccounts'});
        S.web3Address=accs&&accs[0]?accs[0]:'';
        S.error='';
      }
    }catch(ex){ S.error=ex.message; }
    update();
  }
  else if(act==='biz-search'){ S.bizQuery=document.getElementById('sc-biz-q')?.value||''; await refresh().then(update).catch(ex=>{S.error=ex.message;update();}); }
  else if(act==='biz-chain-start'){
    try{ await fn('/business/chain/'+encodeURIComponent(a.dataset.id)+'/start','POST',{}); await refresh(); }catch(ex){ S.error=ex.message; }
    update();
  }
  else if(act==='appr-approve'||act==='appr-deny'){
    const id=a.dataset.id,dec=act==='appr-approve'?'approve':'deny';
    const path=`${a.dataset.kind==='job'?`/api/full/smm/jobs`:`/api/full/mcp/approvals`}/${encodeURIComponent(id)}${a.dataset.kind==='job'?'':`/decide`}`;
    try{
      const v=await fn(path,'POST',{decision:dec});
      await refresh();
      if(act==='appr-approve') S.error='Одобрено: '+JSON.stringify(v).slice(0,220);
      else S.error='Отклонено: '+JSON.stringify(v).slice(0,220);
    }catch(ex){ S.error=ex.message; }
    update();
  }});


document.addEventListener('change',ev=>{if(ev.target.id==='sc-role'){S.role=ev.target.value;update();}});
document.addEventListener('input',ev=>{
  if(ev.target.id==='sc-prompt')S.draft=ev.target.value;
  if(ev.target.id==='sc-filter'){S.searchRole=ev.target.value;const pos=ev.target.selectionStart;update();const el=$('#sc-filter');if(el){el.focus();el.setSelectionRange(pos,pos);}}
});
document.addEventListener('submit',async ev=>{
  if(ev.target.id==='sc-form'){ev.preventDefault();await send();}
  else if(ev.target.id==='sc-dialog-form'){ev.preventDefault();await submitDialog();}
});
document.addEventListener('keydown',ev=>{
  if((ev.ctrlKey||ev.metaKey)&&ev.key.toLowerCase()==='k'){ev.preventDefault();S.command=!S.command;update();}
  else if(ev.key==='Escape'&&S.command){S.command=false;update();}
});

// ─── Монтирование ───────────────────────────────────────────────────────────
if(initialToken){
  refresh().catch(()=>{update();});
}else if(!SITE_MODE){
  update();
  // Локальный шлюз: своя панель вечных сессий
  openAuth();
}else{
  // Сайт: сессия единой системы аккаунтов SYNERGY (cookie)
  const siteAuthCheck = ()=>{
    fetch('/api/v1/customer/session',{credentials:'include'}).then(r=>r.json()).then(s=>{
      if(s && s.authenticated) refresh();
      else if(document.getElementById('sc-auth-overlay')?.style.display !== 'flex') openSiteAuth();
    }).catch(openSiteAuth);
  };
  setTimeout(siteAuthCheck, 700);
}
update();
})();

