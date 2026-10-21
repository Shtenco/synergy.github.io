'use strict';
const API='/api/v1';
const $=id=>document.getElementById(id);
let authenticated=false;
let repos=[];
const shortStatus=v=>v==='configured-not-verified'?'READY?':v==='configured'?'CONFIG':v==='not-configured'?'OFF':'UNKNOWN';
function setText(id,v){const e=$(id);if(e)e.textContent=v;}
async function api(path,options={}){
 const res=await fetch(API+path,{credentials:'same-origin',cache:'no-store',headers:{'Content-Type':'application/json'},...options});
 let body;try{body=await res.json()}catch{body={detail:'Ответ сервера не JSON'}}
 if(!res.ok)throw Error(typeof body.detail==='string'?body.detail:`HTTP ${res.status}`);return body;
}
function notify(element,message){element.textContent=message;}
async function bootstrap(){
 try{const h=await api('/health');const v=h.integrations;
  setText('ai-state',shortStatus(v.gemini));setText('cloud-state',shortStatus(v.cloud_run));
  const label=$('live-status');label.className='pill '+(v.operator==='configured'?'connected':'disconnected');label.innerHTML='<span class="status-dot"></span>';label.append(document.createTextNode(v.operator==='configured'?'API RUNNING':'SETUP REQUIRED'));
 }catch(err){setText('ai-state','ERR');setText('cloud-state','ERR');setText('live-status','API UNAVAILABLE')}
 try{const s=await api('/session');authenticated=s.authenticated;setText('auth-state',s.authenticated?'Авторизация подтверждена':s.login_enabled?'Требуется авторизация':'Оператор не настроен');$('login-form').hidden=s.authenticated||!s.login_enabled;$('logout').hidden=!s.authenticated;}
 catch{setText('auth-state','Ошибка проверки сеанса')}
}
$('login-form').addEventListener('submit',async e=>{e.preventDefault();try{await api('/auth/login',{method:'POST',body:JSON.stringify({password:$('login-pass').value})});$('login-pass').value='';await bootstrap();}catch(err){setText('auth-state','Вход не выполнен: '+err.message)}});
$('logout').addEventListener('click',async()=>{try{await api('/auth/logout',{method:'POST'});}finally{authenticated=false;repos=[];paintRepos();await bootstrap()}});
for(const button of document.querySelectorAll('[data-tab]'))button.addEventListener('click',()=>{
 for(const b of document.querySelectorAll('[data-tab]')){b.classList.toggle('active',b===button);b.setAttribute('aria-selected',b===button?'true':'false')}
 for(const c of document.querySelectorAll('[data-content]'))c.classList.toggle('active',c.dataset.content===button.dataset.tab);
});
function paintRepos(){const q=$('repo-search').value.trim().toLowerCase();const shown=repos.filter(x=>x.full_name.toLowerCase().includes(q));const list=$('repo-list');list.replaceChildren();setText('repo-counter',`${repos.length} LIVE / 82 AUDITED`);if(!shown.length){const empty=document.createElement('div');empty.className='empty';empty.textContent=repos.length?'Ничего не найдено':'Живой реестр пока не получен';list.append(empty);return}
 for(const r of shown){const item=document.createElement('div');item.className='repo-item';const a=document.createElement('a');a.textContent=r.full_name;a.href=r.url==='#'?'https://github.com/'+encodeURI(r.full_name):r.url;a.rel='noopener noreferrer';a.target='_blank';const sm=document.createElement('small');sm.textContent=[r.private?'PRIVATE':'PUBLIC',r.language||'—',r.archived?'ARCHIVED':''].filter(Boolean).join(' / ');item.append(a,sm);list.append(item)}
}
$('repo-search').addEventListener('input',paintRepos);
$('show-audit').addEventListener('click',async()=>{setText('repos-status','Загрузка сохранённого аудита…');try{const data=await api('/repository-audit');repos=data.repositories.map(r=>({full_name:r.full_name,url:'#',private:null,language:r.role,archived:false}));paintRepos();setText('repos-status',`${data.audited_count} репозитория: проверенный снимок каталога, НЕ живое подключение. Для ссылок и текущего состояния нажмите LIVE GITHUB.`);}catch(err){setText('repos-status','Снимок каталога: '+err.message)}});

$('load-repos').addEventListener('click',async()=>{setText('repos-status','Загрузка GitHub…');try{const data=await api('/repositories');repos=data.repositories||[];paintRepos();setText('repos-status',`Живой GitHub: ${data.count}. Архивная копия: ${data.snapshot_count}. Новые записи: ${(data.added_since_snapshot||[]).length}, отсутствующие в ответе: ${(data.missing_from_live_inventory||[]).length}. Полнота доступа не подтверждена.`);}catch(err){setText('repos-status','GitHub: '+err.message)}});
$('load-cloud').addEventListener('click',async()=>{const el=$('cloud-list');el.replaceChildren();const p=document.createElement('div');p.className='empty';p.textContent='Проверка Cloud Run…';el.append(p);try{const r=await api('/cloud/services');el.replaceChildren();if(!r.services.length){p.textContent='Сервисы не найдены в выбранном проекте/регионе.';el.append(p)}for(const svc of r.services){const row=document.createElement('div');row.className='repo-item';const label=document.createElement('strong');label.textContent=svc.name;const small=document.createElement('small');small.textContent=svc.latest_ready_revision||'READY REVISION NOT VERIFIED';row.append(label,small);el.append(row)}}catch(err){p.textContent='Cloud Run: '+err.message;el.replaceChildren(p)}});
$('chat-form').addEventListener('submit',async e=>{e.preventDefault();const msg=$('chat-input').value.trim();if(!msg)return;const out=$('chat-output');const b=document.createElement('div');b.className='bubble user';b.textContent=msg;out.append(b);$('chat-input').value='';const ans=document.createElement('div');ans.className='bubble';ans.textContent='Генерация…';out.append(ans);out.scrollTop=out.scrollHeight;try{const r=await api('/synergy.github.io/ai/chat',{method:'POST',body:JSON.stringify({message:msg,model:$('ai-model').value})});ans.textContent=r.answer}catch(err){ans.textContent='Gemini: '+err.message}out.scrollTop=out.scrollHeight});
bootstrap();
