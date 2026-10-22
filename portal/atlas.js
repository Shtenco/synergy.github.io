(()=>{'use strict';
const services=[
['01','AI SMM STUDIO','Контент, аналитика конкурентов и AI-черновики','smm','/synergy.github.io/smm/ai-studio.html','PYTHON + GEMINI','✳'],
['02','AI LEAD RADAR','Поиск потенциальных клиентов и оценка намерений','smm','/synergy.github.io/smm/lead-radar.html','PYTHON LIVE','⌁'],
['20','CASEFLOW CRM / LEGACY','Исходная проверяемая CRM P1.1 с аудитом','smm','/synergy.github.io/smm/caseflow.html','PYTHON + SQL','✳'],
['21','CASEFLOW TEAM','Командная CRM: организации, роли, входящие, согласия','smm','/synergy.github.io/smm/caseflow-team.html','PYTHON + TENANT DB','✳'],
['22','AUDIENCE LAB','Сохранение и анонимное сравнение разрешённых аудиторий','smm','/synergy.github.io/smm/audiences-team.html','PYTHON + HMAC','◉'],
['03','PARSING LAB','Исследование аудиторий и пересечений','smm','/synergy.github.io/smm/parsing.html','API + WORKER','◉'],
['04','ENGAGEMENT DESK','Черновики, согласование публикаций, журнал','smm','/synergy.github.io/smm/engagement.html','APPROVAL','↗'],
['05','PYTHON WORKERS','V7, VK и Telegram: очереди, прогресс, результаты','smm','/synergy.github.io/smm/jobs.html','JOB ENGINE','▦'],
['06','SMM HUB','Маршруты и сервисы SMM-платформы','smm','/synergy.github.io/smm/workspaces.html','NAVIGATION','✳'],
['07','SMM PRO LEGACY','Сохранённый большой кабинет оригинального сайта','smm','/synergy.github.io/smm/cabinet.html','LEGACY UI','▧'],
['08','INSTITUTIONAL RISKGUARD','Портфельный риск, лимиты, stress-test','finance','/synergy.github.io/solutions/riskguard/','RISK ANALYTICS','◉'],
['09','INVESTOR FOLIO','Учёт портфелей, Markowitz, бэктест','finance','/synergy.github.io/solutions/investor-folio/','PORTFOLIO ENGINE','◒'],
['10','BROKER MESH','FINAM, T-Invest, RoboForex, IBKR, OANDA','finance','/synergy.github.io/broker-mesh/','READ-ONLY','⌁'],
['11','INVESTOR CENTER','Инвесторский и казначейский интерфейс','finance','/synergy.github.io/investor/','LEGACY UI','◇'],
['12','AI CFO','Финансовая аналитика и документы','finance','/synergy.github.io/solutions/cfo/','PYTHON / PRIVATE','▥'],
['13','AI OLGA','Интеллектуальный ассистент и инструменты','ai','/synergy.github.io/ai/','AI API','◎'],
['14','AI VIDEO','Медиапроизводство и видео','ai','/synergy.github.io/video/','LEGACY UI','▷'],
['15','AI ADVERT','Реклама и контент для кампаний','ai','/synergy.github.io/advert/','LEGACY API','✳'],
['16','AI MARKET','Маркетплейс и коммерческая аналитика','ai','/synergy.github.io/market/','LEGACY API','⌁'],
['17','BUSINESS OPERATING SYSTEM','Продукты, бизнес-процессы и партнёры','ai','/mvp.html','SITE','↗'],
['18','NEXUS CONTROL PLANE','Репозитории GitHub, Gemini AI, Cloud Run','system','/synergy.github.io/nexus/','INTEGRATIONS','⌘'],
['19','AI ARCHIVER','Сжатие и восстановление пользовательских данных','system','/archiver.html','CLIENT APP','▧'],
['23','AI AVITO','Управление объявлениями, обращениями, AI-ответами и CRM','ai','/synergy.github.io/solutions/avito/','AVITO / WORKSPACE','✳'],
['24','AI META-API-MCP','API и MCP discovery, политики и безопасное исполнение','system','/synergy.github.io/solutions/meta-api/','API + MCP','⌘'],
['25','AI WORKSPACE','Единый центр задач, агентов, разрешений и результатов','system','/synergy.github.io/solutions/workspace/','DESKTOP / CONTROL','▦']
];
const el=(tag,cls,txt)=>{const e=document.createElement(tag);if(cls)e.className=cls;if(txt!==undefined)e.textContent=txt;return e};let group='all';const target=document.querySelector('#cards'),search=document.querySelector('#search');
function update(){const q=search.value.toLocaleLowerCase('ru').trim();target.replaceChildren();let count=0;for(const [n,name,description,category,href,kind,symbol] of services){if(group!=='all'&&category!==group)continue;if(q && !(name+' '+description+' '+category).toLocaleLowerCase('ru').includes(q))continue;count++;const card=el('a','card');card.href=href.startsWith('/synergy.github.io/')?'../'+href.slice('/synergy.github.io/'.length):href.startsWith('/')?'..'+href:href;const head=el('div','card-head');head.append(el('small','',n+' / '+category.toUpperCase()),el('span','symbol',symbol));const nameEl=el('h3','',name);const desc=el('p','',description);const foot=el('div','card-foot');foot.append(el('span','flag',kind),el('span','arrow','↗'));card.append(head,nameEl,desc,foot);target.append(card)}document.querySelector('#match-count').textContent=count+' сервисов';if(!count){target.append(el('p','empty','Ничего не найдено. Измени запрос.'))}}
for(const category of ['all','smm','finance','ai','system']){const el=document.querySelector('[data-count="'+category+'"]');if(el)el.textContent=services.filter(item=>category==='all'||item[3]===category).length}const total=document.querySelector('#catalog-total');if(total)total.textContent=services.length;search.addEventListener('input',update);document.querySelectorAll('.filter').forEach(b=>b.addEventListener('click',()=>{group=b.dataset.filter;document.querySelectorAll('.filter').forEach(x=>(x.classList.toggle('active',x===b),x.setAttribute('aria-pressed',String(x===b))));update()}));update();
async function health(){try{const r=await fetch('../api/v1/health',{credentials:'same-origin'});if(!r.ok)throw Error('HTTP '+r.status);const x=await r.json();document.querySelector('#live-status').textContent='● API ОТВЕЧАЕТ';document.querySelector('#api-state').textContent='Доступен';document.querySelector('#live-status').classList.add('ok');document.querySelector('#gateway-state').textContent=x.status==='running'?'ЛОКАЛЬНЫЙ СЕРВИС ДОСТУПЕН':'СТАТУС НЕИЗВЕСТЕН';for(const [k,id] of [['github','github-state'],['gemini','gemini-state'],['cloud_run','cloud-state']]){const s=x.integrations?.[k]||'неизвестно';document.getElementById(id).textContent=s==='not-configured'?'НЕ ПОДКЛЮЧЁН':s==='configured-not-verified'?'НАСТРОЕН / НЕ ПРОВЕРЕН':s}const m=await fetch('../api/v1/modules',{credentials:'same-origin'});if(m.ok){const modules=await m.json();document.querySelector('#modules-count').textContent=modules.modules?.length||'—'}}catch{document.querySelector('#live-status').textContent='○ API НЕДОСТУПЕН';document.querySelector('#api-state').textContent='Нет соединения';document.querySelector('#gateway-state').textContent='НЕТ СОЕДИНЕНИЯ';for(const id of ['github-state','gemini-state','cloud-state'])document.getElementById(id).textContent='НЕТ ДАННЫХ'}}
health();})();
