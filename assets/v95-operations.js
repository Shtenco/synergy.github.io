/* SYNERGY V9.5: evidence-first contextual panels for existing products. */
(()=>{'use strict';
const el=(tag,cls,text)=>{const x=document.createElement(tag);if(cls)x.className=cls;if(text!==undefined)x.textContent=String(text);return x};
const req=async path=>{const r=await fetch(path,{credentials:'same-origin',cache:'no-store',headers:{Accept:'application/json'}});let data={};try{data=await r.json()}catch{}if(!r.ok)throw Error(typeof data.detail==='string'?data.detail:'HTTP '+r.status);return data};
function shell(title,desc){const root=el('section','syn95');root.setAttribute('aria-label',title);const head=el('div','syn95-head'),left=el('div');left.append(el('div','syn95-tag','SYNERGY / VERIFIED OPERATIONS'),el('h2','',title),el('p','',desc));const state=el('span','syn95-status','Загрузка…');head.append(left,state);root.append(head);return {root,state}}
function links(root,items){const bar=el('div','syn95-links');items.forEach(([name,url])=>{const a=el('a','',name);a.href=url;bar.append(a)});root.append(bar)}
function alertState(state,msg,err){state.textContent=msg;state.classList.toggle('syn95-error',!!err)}
const path=location.pathname;
if(['/synergy.github.io/smm/caseflow-team.html','/synergy.github.io/smm/parsing.html','/synergy.github.io/smm/engagement.html'].includes(path)){
 const names={'/synergy.github.io/smm/caseflow-team.html':'CASEFLOW · Командная аналитика','/synergy.github.io/smm/parsing.html':'PARSING · Контроль данных','/synergy.github.io/smm/engagement.html':'ENGAGEMENT · Очередь решений'};
 const panel=shell(names[path],'Только записи текущей организации. Числа поступают из защищённого SQL API, а не из демонстрационных данных.');
 const grid=el('div','syn95-grid');panel.root.append(grid);
 links(panel.root,[['CRM','/synergy.github.io/smm/caseflow-team.html'],['Аудитории','/synergy.github.io/smm/parsing.html'],['Согласования','/synergy.github.io/smm/engagement.html'],['Python workers','/synergy.github.io/smm/jobs.html']]);
 const tasks=el('div','syn95-transcript');tasks.setAttribute('aria-live','polite');panel.root.append(tasks);
 panel.root.append(el('div','syn95-foot','Внешние соцсети не считаются подключёнными без проверки API. Одобрение ≠ отправка.'));
 const parent=document.querySelector('.page')||document.querySelector('main')||document.body;
 const hero=parent.querySelector('.hero');if(hero&&hero.parentNode===parent)parent.insertBefore(panel.root,hero);else parent.prepend(panel.root);
 const refresh=async()=>{try{const d=await req('/api/v3/smm/team/pulse');const c=d.counts;grid.replaceChildren();
 [['Новые обращения',c.inbox_new],['Старше 24 часов',c.inbox_older_than_24h],['Карточки на проверке',c.cases_awaiting_review],['Квалифицированы',c.cases_qualified],['Черновики ожидают',c.drafts_pending],['Без действующего согласия',c.drafts_without_current_consent],['Аудитории',c.audiences_active],['Сохранённые отчёты',c.reports_active]].forEach(([name,value])=>{const box=el('div','syn95-metric'+((name.includes('24 часов')||name.includes('согласия'))&&value?' warn':''));box.append(el('strong','',value),el('span','',name));grid.append(box)});
 alertState(panel.state,'SQL · '+d.role+' · '+new Date(d.observed_at).toLocaleTimeString('ru-RU'));
 const q=await req('/api/v3/smm/team/action-queue');tasks.replaceChildren();
 if(!q.items.length)tasks.append(el('p','','Внутренних задач для проверки пока нет. Это не означает отсутствие событий в социальных сетях.'));
 else q.items.slice(0,8).forEach(item=>{const entry=el('div','syn95-turn');entry.append(el('strong','',item.priority==='high'?'ПРИОРИТЕТ · ТРЕБУЕТ ВНИМАНИЯ':'ОЖИДАЕТ ОБРАБОТКИ'),document.createTextNode(item.reason+'  '));const a=el('a','','Открыть кабинет →');a.href=item.path;entry.append(a);tasks.append(entry)});}
 catch(e){grid.replaceChildren(el('p','syn95-error','Данные организации скрыты до входа в CaseFlow Team.'));tasks.replaceChildren();alertState(panel.state,'Сессия не подтверждена',true)}};
 refresh();
 const b=el('button','','Обновить показатели');b.type='button';b.addEventListener('click',refresh);const bar=panel.root.querySelector('.syn95-links');bar.prepend(b);
}
if(path==='/synergy.github.io/nexus/'||path==='/synergy.github.io/nexus/index.html'){
 const panel=shell('NEXUS · Проверяемая готовность','Конфигурация не равна успешному внешнему подключению. GitHub и Cloud Run проверяются отдельными запросами.');
 const grid=el('div','syn95-grid');panel.root.append(grid);const transcript=el('div','syn95-transcript');panel.root.append(transcript);
 const box=(name,value)=>{const n=el('div','syn95-metric');n.append(el('strong','',value),el('span','',name));grid.append(n)};
 const show=async()=>{try{const d=await req('/api/v3/system/readiness');grid.replaceChildren();box('Архив GitHub',d.registry_snapshot.count);box('Маршруты API',d.api_routes);box('Gemini',d.gemini.state);box('Cloud Run',d.cloud_run.state);alertState(panel.state,'API доступен · авторизация подтверждена');}
 catch(e){alertState(panel.state,'Требуется вход / API недоступен',true);grid.replaceChildren(el('p','syn95-error','Данные интеграций не доступны: '+e.message))}};
 const query=async(which)=>{const div=el('div','syn95-turn','Проверка '+which+'…');transcript.prepend(div);try{const d=await req(which==='GitHub'?'/api/v1/repositories':'/api/v1/cloud/services');div.textContent=which==='GitHub'?`Живых репозиториев: ${d.count}. Архив: ${d.snapshot_count}. Новые: ${(d.added_since_snapshot||[]).length}. Нет в ответе: ${(d.missing_from_live_inventory||[]).length}. Полнота не подтверждена.`:`Cloud Run: ${(d.services||[]).length} сервисов, регион ${d.region}. Статус готовности каждого проверяется отдельно.`}catch(e){div.textContent=which+': '+e.message;div.classList.add('syn95-error')}};
 const bar=el('div','syn95-links');[['Проверить состояние',show],['GitHub — live',()=>query('GitHub')],['Cloud Run — live',()=>query('Cloud Run')]].forEach(([title,fn])=>{const b=el('button','',title);b.addEventListener('click',fn);bar.append(b)});panel.root.append(bar);
 panel.root.append(el('div','syn95-foot','Не выполняет deployment, push, финансовые операции или запуск автономных агентов.'));
 const parent=document.querySelector('main.main')||document.querySelector('main')||document.body;const hero=parent.querySelector('.hero');if(hero&&hero.parentNode===parent)parent.insertBefore(panel.root,hero);else parent.prepend(panel.root);show();
}
if(path==='/synergy.github.io/ai/'||path==='/synergy.github.io/ai/index.html'){
 const panel=shell('OLGA · Проверяемый AI Gateway','Отдельный серверный режим: один запрос к выбранной модели Gemini. Старые режимы «консенсус» и «AI-отдел» этим интерфейсом не подтверждаются.');
 const form=el('form','syn95-form'),label=el('label','', 'Модель'),sel=el('select');[['gemini-2.5-flash','Gemini 2.5 Flash'],['gemini-2.5-pro','Gemini 2.5 Pro']].forEach(([v,t])=>{const opt=el('option','',t);opt.value=v;sel.append(opt)});label.append(sel);const lbl=el('label','','Ваш запрос'),ta=el('textarea');ta.maxLength=10000;ta.placeholder='Опиши задачу для серверного Gemini Gateway…';ta.required=true;lbl.append(ta);const send=el('button','syn95-primary','Отправить через защищённый API');send.type='submit';form.append(label,lbl,send);panel.root.append(form);const turns=el('div','syn95-transcript');turns.setAttribute('aria-live','polite');panel.root.append(turns);
 const check=async()=>{try{const [s,h]=await Promise.all([req('/api/v1/session'),req('/api/v1/health')]);alertState(panel.state,!s.authenticated?'Вход оператора обязателен':h.integrations?.gemini==='not-configured'?'Gemini не настроен':'Gemini настроен · live не проверен',!s.authenticated||h.integrations?.gemini==='not-configured')}catch(e){alertState(panel.state,'API не доступен',true)}};
 form.addEventListener('submit',async e=>{e.preventDefault();if(send.disabled)return;const message=ta.value.trim();if(!message)return;send.disabled=true;const loading=el('div','syn95-turn syn95-loading','Отправка запроса…');turns.prepend(loading);try{const r=await fetch('/api/v1/ai/chat',{method:'POST',credentials:'same-origin',cache:'no-store',headers:{'Content-Type':'application/json','Origin':location.origin},body:JSON.stringify({message,model:sel.value})});const d=await r.json().catch(()=>({}));if(!r.ok)throw Error(d.detail||'HTTP '+r.status);loading.replaceChildren(el('strong','',d.model+' · live Gemini API'),document.createTextNode(d.answer));ta.value='';alertState(panel.state,'Ответ получен от API')}catch(err){loading.textContent='Ошибка: '+err.message;loading.classList.add('syn95-error');alertState(panel.state,'Ошибка запроса',true)}finally{send.disabled=false}});
 panel.root.append(el('div','syn95-foot','История этого проверяемого режима находится только в текущей странице. Не сохраняйте здесь секреты. Live Gemini требует GEMINI_API_KEY или Vertex AI на сервере.'));
 const parent=document.querySelector('.messages')||document.querySelector('main.workspace')||document.body;
 parent.prepend(panel.root);check();
}
})();
