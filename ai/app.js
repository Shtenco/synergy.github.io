// P0: migrate legacy browser-persistent token to session-only; old token is deleted.
try { localStorage.removeItem('olga_token'); } catch (_) {}
const $ = (s, root=document) => root.querySelector(s);
const $$ = (s, root=document) => [...root.querySelectorAll(s)];
const API_BASE = location.pathname.startsWith('/ai') ? '/synergy.github.io/ai/api' : '/api';
const uid = () => crypto.randomUUID();
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const store = {
  get(k, fallback, session=false){ try{return JSON.parse((session?sessionStorage:localStorage).getItem(k)) ?? fallback}catch{return fallback} },
  set(k,v,session=false){if(k==='olga_settings')return; (session?sessionStorage:localStorage).setItem(k,JSON.stringify(v))}
};

const modeCopy = {
  single:['Одна модель','Один агент отвечает напрямую. Быстро и экономно.'],
  chain:['Последовательная цепочка','От 2 до 5 агентов по очереди улучшают результат предыдущего.'],
  consensus:['Коллективный консенсус','От 2 до 5 независимых экспертов работают параллельно, председатель синтезирует ответ.'],
  department:['AI-отдел','Главный агент ставит задачи 1–4 подчинённым и принимает итоговую работу.']
};
const defaultModel = () => ({id:uid(),name:'OLGA Lead',provider:'custom',apiStyle:'chat',baseUrl:'',apiKey:'',model:'',systemPrompt:'Ты — OLGA, сильный практический AI-ассистент экосистемы SINERGY.',temperature:.7,contextWindow:128000,maxOutput:4096,enabled:true});
let providers=[];
let settings=store.get('olga_settings',{mode:'single',models:[defaultModel()]},true);
let chats=store.get('olga_chats',[]);
let currentId=store.get('olga_current',null);
let pendingFiles=[];
let busy=false;
let user=null;
let lastTrace=[];

function currentChat(){return chats.find(c=>c.id===currentId)}
function persistChats(){store.set('olga_chats',chats.slice(0,50));store.set('olga_current',currentId)}
function toast(message,error=false){const el=$('#toast');el.textContent=message;el.className='toast show'+(error?' error':'');clearTimeout(toast.timer);toast.timer=setTimeout(()=>el.className='toast',3500)}
function openModal(id){$('#'+id).classList.add('open')}
function closeModal(id){$('#'+id).classList.remove('open')}

async function api(path, options={}){
  const token=sessionStorage.getItem('olga_token');
  const url=path.startsWith('/api')?API_BASE+path.slice(4):path;
  const response=await fetch(url,{...options,headers:{'Content-Type':'application/json',...(token?{Authorization:`Bearer ${token}`}:{ }),...(options.headers||{})}});
  const data=await response.json().catch(()=>({error:`HTTP ${response.status}`}));
  if(!response.ok) throw Object.assign(new Error(data.error||'Ошибка сервера'),{status:response.status});
  return data;
}

async function loadProviders(){
  try{providers=(await api('/api/providers')).providers}catch{providers=[]}
}

function renderModes(){
  $$('#modeSwitch button').forEach(b=>b.classList.toggle('active',b.dataset.mode===settings.mode));
  const count=settings.models.filter(m=>m.enabled!==false).length;
  $('#activeLabel').textContent=`${modeCopy[settings.mode][0]} · ${count} ${count===1?'агент':'агента'}`;
}

function renderChatList(){
  $('#chatList').innerHTML=chats.length?chats.map(c=>`<button class="chat-item ${c.id===currentId?'active':''}" data-id="${c.id}">${esc(c.title||'Новый диалог')}</button>`).join(''):'<p class="empty">Диалогов пока нет</p>';
  $$('.chat-item').forEach(b=>b.onclick=()=>{currentId=b.dataset.id;persistChats();renderAll()});
}

function renderMessages(){
  const chat=currentChat();
  if(!chat?.messages?.length){$('#messages').innerHTML=$('#welcomeTemplate')?.innerHTML||welcomeMarkup();bindSuggestions();return}
  $('#messages').innerHTML=chat.messages.map(m=>`<article class="message ${m.role}"><span class="who">${m.role==='user'?'U':'O'}</span><div class="bubble">${esc(m.content)}${m.files?.length?`<div class="message-files">${m.files.map(f=>`<span>📎 ${esc(f)}</span>`).join('')}</div>`:''}</div></article>`).join('');
  $('#messages').scrollTop=$('#messages').scrollHeight;
}

function welcomeMarkup(){return `<div class="welcome" id="welcome"><div class="orb"><span>O</span></div><p class="eyebrow">AGI OLGA · MULTI-AGENT INTELLIGENCE</p><h1>ОДИН ЗАПРОС.<br><em>КОЛЛЕКТИВНЫЙ РАЗУМ.</em></h1><p class="lead">Подключите модели разных провайдеров и соберите собственную команду AI — от последовательной цепочки до полноценного отдела.</p><div class="suggestions"><button data-prompt="Разработай стратегию запуска нового AI-продукта на российском рынке"><b>Стратегия запуска</b><span>исследование → план → критика</span></button><button data-prompt="Проведи коллективный аудит этой идеи, найди риски и предложи улучшенную версию"><b>Экспертный консенсус</b><span>несколько независимых мнений</span></button><button data-prompt="Организуй AI-отдел для решения задачи: "><b>Собрать AI-отдел</b><span>руководитель + специалисты</span></button></div></div>`}
function bindSuggestions(){$$('.suggestions button').forEach(b=>b.onclick=()=>{$('#prompt').value=b.dataset.prompt;resizePrompt();$('#prompt').focus()})}

function newChat(){
  const chat={id:uid(),title:'Новый диалог',createdAt:new Date().toISOString(),messages:[],context:null};
  chats.unshift(chat);currentId=chat.id;persistChats();pendingFiles=[];renderAll();$('#prompt').focus();
}

function renderContext(stats=currentChat()?.context){
  const limit=stats?.limit||Number(settings.models[0]?.contextWindow||128000),working=stats?.workingTokens||estimateLocal(currentChat()?.messages||[]),pct=Math.min(100,Math.round(working/limit*100));
  $('#contextValue').textContent=`${compact(working)} / ${compact(limit)}`;$('#contextProgress').style.width=pct+'%';
  $('#contextProgress').style.background=pct>=80?'#e8bb42':'var(--g)';
  $('#archiveValue').textContent=`LZMA-9 архив · ${compact(stats?.archivedTokens||working)} токенов · ${formatBytes(stats?.archiveBytes||0)}`;
  $('#compressionValue').textContent=`${stats?.compressions||0} циклов сжатия`;
}
function estimateLocal(v){return Math.max(0,Math.ceil(JSON.stringify(v).length/3.7))}
function compact(n){return Intl.NumberFormat('ru',{notation:n>=10000?'compact':'standard',maximumFractionDigits:1}).format(n||0).toUpperCase()}
function formatBytes(n){if(!n)return '0 Б';return n>1048576?(n/1048576).toFixed(1)+' МБ':Math.ceil(n/1024)+' КБ'}

function renderFiles(){
  $('#files').innerHTML=pendingFiles.map((f,i)=>`<span class="file-chip">${f.type.startsWith('image/')?'🖼':'📄'} ${esc(f.name)} · ${formatBytes(f.size)} <button data-i="${i}">×</button></span>`).join('');
  $$('#files button').forEach(b=>b.onclick=()=>{pendingFiles.splice(Number(b.dataset.i),1);renderFiles()});
}

async function addFiles(list){
  for(const file of [...list].slice(0,10-pendingFiles.length)){
    if(file.size>12*1024*1024){toast(`${file.name}: максимум 12 МБ`,true);continue}
    if(pendingFiles.reduce((sum,x)=>sum+x.size,0)+file.size>48*1024*1024){toast('Общий размер файлов — максимум 48 МБ',true);break}
    const dataUrl=await readFile(file,'data');
    let text='';
    if(/^text\//.test(file.type)||/\.(md|txt|csv|json|js|ts|py|html|css|xml|yaml|yml)$/i.test(file.name)) text=await readFile(file,'text');
    pendingFiles.push({name:file.name,type:file.type||'application/octet-stream',size:file.size,dataUrl,text});
  }
  renderFiles();
}
function readFile(file,type){return new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(r.result);r.onerror=reject;type==='text'?r.readAsText(file):r.readAsDataURL(file)})}

function modelCard(model,index){
  const opts=providers.map(p=>`<option value="${esc(p.id)}" ${p.id===model.provider?'selected':''}>${esc(p.name)}</option>`).join('');
  const role=settings.mode==='department'?(index===0?'Руководитель':'Подчинённый'):index===0?'Ведущий агент':`Агент ${index+1}`;
  return `<article class="model-card" data-id="${model.id}"><div class="model-summary"><span class="model-number">${index+1}</span><strong>${esc(model.name||model.model||'Модель')} <small>· ${role}</small></strong>${index?'<button class="model-remove" title="Удалить">Удалить</button>':''}</div><div class="model-fields">
    <label>Название агента<input data-f="name" value="${esc(model.name||'')}"></label><label>Провайдер<select data-f="provider">${opts}</select></label>
    <label>API-протокол<select data-f="apiStyle"><option value="chat" ${model.apiStyle!=='responses'&&model.apiStyle!=='opencode'?'selected':''}>Chat Completions</option><option value="responses" ${model.apiStyle==='responses'?'selected':''}>Responses API</option><option value="opencode" ${model.apiStyle==='opencode'?'selected':''}>OpenCode Server</option></select></label><label>${model.apiStyle==='opencode'?'Пароль OpenCode Server':'API-ключ'}<input data-f="apiKey" type="password" value="${esc(model.apiKey||'')}" autocomplete="off" placeholder="${model.apiStyle==='opencode'?'необязательно':'sk-…'}"></label>
    <label class="wide">OpenAI-compatible endpoint<input data-f="baseUrl" value="${esc(model.baseUrl||'')}" placeholder="https://api.example.com/v1"></label>
    <label class="wide">Model ID ${model.apiStyle==='opencode'?'<small>provider/model</small>':''}<input data-f="model" value="${esc(model.model||'')}" placeholder="provider/model-name"></label>
    <label class="wide">Системный промпт<textarea data-f="systemPrompt">${esc(model.systemPrompt||'')}</textarea></label>
    <div class="inline-fields"><label>Температура<input data-f="temperature" type="number" min="0" max="2" step="0.1" value="${model.temperature??.7}"></label><label>Контекст, токенов<input data-f="contextWindow" type="number" min="4096" value="${model.contextWindow||128000}"></label><label>Макс. ответ<input data-f="maxOutput" type="number" min="128" value="${model.maxOutput||4096}"></label></div>
    <button class="test-model wide" type="button">Проверить подключение</button></div></article>`;
}

function renderSettings(){
  $('#modeInfo').innerHTML=`<b>${modeCopy[settings.mode][0]}</b><br>${modeCopy[settings.mode][1]}`;
  $('#modelList').innerHTML=settings.models.map(modelCard).join('');
  $('#addModel').classList.toggle('hidden',settings.models.length>=5);
  $$('.model-card').forEach((card,index)=>{
    const model=settings.models[index];
    $$('[data-f]',card).forEach(field=>field.oninput=()=>model[field.dataset.f]=field.type==='number'?Number(field.value):field.value);
    $('[data-f="provider"]',card).onchange=e=>{const p=providers.find(x=>x.id===e.target.value);model.provider=e.target.value;if(p){model.baseUrl=p.baseUrl;model.model=p.defaultModel;model.apiStyle=p.apiStyle||'chat';renderSettings()}};
    $('.model-remove',card)?.addEventListener('click',()=>{settings.models.splice(index,1);renderSettings()});
    $('.test-model',card).onclick=async e=>{e.currentTarget.textContent='Проверяем…';try{const d=await api('/api/provider/test',{method:'POST',body:JSON.stringify({model})});toast(`Подключение работает: ${d.response}`)}catch(err){toast(err.message,true)}finally{e.currentTarget.textContent='Проверить подключение'}};
  });
}

function saveSettings(){
  const min=settings.mode==='single'?1:2;
  if(settings.models.length<min)return toast(`Для режима нужно минимум ${min} модели`,true);
  if(settings.models.some(m=>!m.baseUrl||!m.model))return toast('Заполните endpoint и Model ID у всех агентов',true);
  store.set('olga_settings',settings,true);renderModes();renderContext();closeModal('settingsModal');toast('Команда OLGA сохранена');
}

async function sendMessage(){
  const text=$('#prompt').value.trim();if(!text||busy)return;
  if(!user){openModal('authModal');return}
  const min=settings.mode==='single'?1:2;if(settings.models.length<min||settings.models.some(m=>!m.baseUrl||!m.model)){location.href='settings.html';return}
  if(!currentChat())newChat();const chat=currentChat();const sentFiles=pendingFiles;
  chat.messages.push({role:'user',content:text,files:sentFiles.map(f=>f.name)});if(chat.messages.length===1)chat.title=text.slice(0,52);
  $('#prompt').value='';pendingFiles=[];busy=true;$('#send').disabled=true;persistChats();renderAll();
  $('#messages').insertAdjacentHTML('beforeend','<article class="message assistant" id="thinking"><span class="who">O</span><div class="bubble"><span class="thinking"><i></i><i></i><i></i></span></div></article>');$('#messages').scrollTop=$('#messages').scrollHeight;
  try{
    const payload={sessionId:chat.id,config:settings,messages:chat.messages.map(({role,content})=>({role,content})),files:sentFiles};
    const data=await api('/api/chat',{method:'POST',body:JSON.stringify(payload)});
    chat.messages.push({role:'assistant',content:data.content});chat.context=data.context;lastTrace=data.trace||[];updateUser(data.user);persistChats();renderAll();renderTrace();
  }catch(err){
    if(err.status===401)openModal('authModal');toast(err.message,true);renderMessages();
  }finally{busy=false;$('#send').disabled=false}
}

function renderTrace(){
  $('#traceList').innerHTML=lastTrace.length?lastTrace.map((x,i)=>`<article class="trace-card"><header><span class="model-number">${i+1}</span><b>${esc(x.agent)}</b> · ${esc(x.role)}</header>${x.task?`<small>${esc(x.task)}</small>`:''}<p>${esc(x.content)}</p></article>`).join(''):'<p class="empty">Здесь появятся этапы работы команды после первого запроса.</p>';
}

function updateUser(next){
  if(next)user=next;
  if(!user){$('#userName').textContent='Гость';$('#userStatus').textContent='Войти в OLGA';return}
  $('#userName').textContent=user.name;const end=new Date(user.paidUntil||user.trialUntil);const days=Math.max(0,Math.ceil((end-Date.now())/86400000));
  $('#userStatus').textContent=user.status==='trial'?`Trial · ${days} дн.`:'Подписка активна';$('#trialDays').textContent=`${days} дн.`;
  const limit=user.messagesLimit||Math.max(100,user.messagesUsed),windowText=user.windowLimit?` · ${user.windowUsed}/${user.windowLimit} за ${user.windowHours} ч`:'';$('#trialUsage').textContent=(user.messagesLimit?`${user.messagesUsed} / ${limit} сообщений`:`${user.messagesUsed} сообщений`)+windowText;
  $('#trialProgress').style.width=Math.min(100,user.messagesUsed/limit*100)+'%';
}

async function loadMe(){
  if(!sessionStorage.getItem('olga_token'))return updateUser(null);
  try{updateUser((await api('/api/me')).user)}catch{sessionStorage.removeItem('olga_token');updateUser(null)}
}
async function authSubmit(form,path){
  $('#authError').textContent='';const data=Object.fromEntries(new FormData(form));
  try{const result=await api(path,{method:'POST',body:JSON.stringify(data)});sessionStorage.setItem('olga_token',result.token);updateUser(result.user);closeModal('authModal');toast('AGI OLGA активирована. Добро пожаловать!');if($('#prompt').value.trim())sendMessage()}
  catch(err){$('#authError').textContent=err.message}
}

function resizePrompt(){const el=$('#prompt');el.style.height='auto';el.style.height=Math.min(170,el.scrollHeight)+'px'}
function renderAll(){renderModes();renderChatList();renderMessages();renderFiles();renderContext()}

// --- SINERGY BUS: обмен событиями с AI CFO и AI SMM (см. shared/bus.js) ---
let busEvents=[];
async function loadBus(){
  try{busEvents=(await api('/api/bus/feed?to=olga')).events||[]}catch{busEvents=[]}
  $('#busLabel').textContent=`SINERGY BUS · ${busEvents.filter(e=>e.status==='new').length}`;
  renderBus();
}
function renderBus(){
  $('#busList').innerHTML=busEvents.length?busEvents.map(e=>`<article class="trace-card"><header><span class="model-number">${e.from==='cfo'?'₸':'S'}</span><b>${esc(e.from.toUpperCase())} → ${esc(e.to)}</b> · ${esc(new Date(e.ts).toLocaleString('ru'))}</header>${e.title?`<small>${esc(e.title)}</small>`:''}<p>${esc(e.body)}</p><div class="bus-actions"><button data-use="${e.id}">Обсудить с OLGA</button>${e.to==='smm'?`<button data-smm="${e.id}">Отправить в SMM</button>`:''}</div></article>`).join(''):'<p class="empty">Здесь появятся финансовые инсайты от AI CFO и задачи для AI SMM.</p>';
  $$('#busList [data-use]').forEach(b=>b.onclick=()=>{const ev=busEvents.find(x=>x.id===b.dataset.use);if(!ev)return;newChat();$('#prompt').value=`Контекст от AI CFO:\n\n${ev.title}\n${ev.body}\n\nПроанализируй и предложи конкретные следующие шаги.`;resizePrompt();$('#busDrawer').classList.remove('open');api('/api/bus/ack',{method:'POST',body:JSON.stringify({id:ev.id,status:'seen'})}).catch(()=>{});sendMessage()});
  $$('#busList [data-smm]').forEach(b=>b.onclick=async()=>{const ev=busEvents.find(x=>x.id===b.dataset.smm);if(!ev)return;try{await api('/api/bus/publish',{method:'POST',body:JSON.stringify({from:'olga',to:'smm',type:'content_task',title:`Контент-идея из инсайта AI CFO: ${ev.title}`,body:ev.body,meta:{sourceEvent:ev.id}})});toast('Задача отправлена в AI SMM');await api('/api/bus/ack',{method:'POST',body:JSON.stringify({id:ev.id,status:'done'})});loadBus()}catch(err){toast(err.message,true)}});
}
function applyPrefill(){
  const params=new URLSearchParams(location.search);
  const prefill=params.get('prefill');
  if(!prefill)return;
  newChat();
  $('#prompt').value=decodeURIComponent(prefill);
  resizePrompt();
  history.replaceState(null,'',location.pathname);
}

async function init(){
  await Promise.all([loadProviders(),loadMe(),loadBus()]);
  if(!currentId&&chats.length)currentId=chats[0].id;
  renderAll();
  applyPrefill();
  $('#busPill').onclick=()=>{loadBus();$('#busDrawer').classList.add('open')};
  $('#busClose').onclick=()=>$('#busDrawer').classList.remove('open');
  setInterval(loadBus,20000);
  $('#newChat').onclick=newChat;$('#settingsOpen').onclick=()=>location.href='settings.html';$('#agentPill').onclick=()=>location.href='settings.html';
  $('#saveSettings').onclick=saveSettings;$('#addModel').onclick=()=>{if(settings.models.length<5){const m=defaultModel();m.name=`Агент ${settings.models.length+1}`;settings.models.push(m);renderSettings()}};
  $$('#modeSwitch button').forEach(b=>b.onclick=()=>{settings.mode=b.dataset.mode;if(settings.mode!=='single'&&settings.models.length<2){const m=defaultModel();m.name='Эксперт 2';settings.models.push(m)}renderModes();renderSettings();store.set('olga_settings',settings,true)});
  $$('[data-close]').forEach(b=>b.onclick=()=>closeModal(b.dataset.close));$$('.modal-backdrop').forEach(m=>m.onclick=e=>{if(e.target===m)closeModal(m.id)});
  $('#send').onclick=sendMessage;$('#prompt').oninput=resizePrompt;$('#prompt').onkeydown=e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();sendMessage()}};
  $('#fileInput').onchange=e=>{addFiles(e.target.files);e.target.value=''};
  $('#traceOpen').onclick=()=>$('#traceDrawer').classList.add('open');$('#traceClose').onclick=()=>$('#traceDrawer').classList.remove('open');
  $('#userButton').onclick=()=>user?toast(`${user.email} · ${user.status==='trial'?'пробный период':'активная подписка'}`):openModal('authModal');
  $('#mobileMenu').onclick=()=>$('.sidebar').classList.toggle('open');
  $$('.auth-tabs button').forEach(b=>b.onclick=()=>{$$('.auth-tabs button').forEach(x=>x.classList.toggle('active',x===b));$('#registerForm').hidden=b.dataset.auth!=='register';$('#loginForm').hidden=b.dataset.auth!=='login'});
  $('#registerForm').onsubmit=e=>{e.preventDefault();authSubmit(e.currentTarget,'/api/register')};$('#loginForm').onsubmit=e=>{e.preventDefault();authSubmit(e.currentTarget,'/api/login')};
  bindSuggestions();
}
init();
