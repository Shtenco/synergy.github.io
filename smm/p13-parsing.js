/* Parsing Lab P1.3: genuine team endpoints, no invented live API results. */
(()=>{'use strict';
const $=id=>document.getElementById(id),base='/api/v2/smm/team';
let me=null;const csrf=()=>sessionStorage.getItem('smm_team_csrf')||'';
const el=(tag,value,className)=>{const e=document.createElement(tag);e.textContent=String(value??'');if(className)e.className=className;return e};
const feedback=(message,bad=false)=>{const n=$('feedback');n.textContent=message;n.classList.toggle('error',!!bad)};
async function api(path,{method='GET',body}={}){
 const headers={};if(body!==undefined)headers['Content-Type']='application/json';if(method!=='GET'){headers['Origin']=location.origin;headers['X-SMM-CSRF']=csrf()}
 const r=await fetch(base+path,{credentials:'same-origin',cache:'no-store',method,headers,body:body!==undefined?JSON.stringify(body):undefined});
 const v=await r.json().catch(()=>({}));if(!r.ok)throw Error(typeof v.detail==='string'?v.detail:`HTTP ${r.status}`);return v
}
const lines=(s)=>[...new Set(String(s||'').split(/[\r\n,;]+/).map(x=>x.trim()).filter(Boolean))];
const button=(label,fn)=>{const b=el('button',label,'p13-action secondary');b.type='button';b.addEventListener('click',fn);return b};
async function refresh(){const [ar,comp,overview]=await Promise.all([api('/audiences'),api('/p13/comparisons'),api('/p13/overview')]);
 const audiences=ar.audiences||[];$('metric-audiences').textContent=audiences.length;$('metric-reports').textContent=(comp.reports||[]).length;$('metric-api').textContent='OK';
 const root=$('audience-list');root.replaceChildren();for(const a of audiences){const n=el('div','','p13-item');const body=el('div');body.append(el('strong',a.title),el('small',`${a.platform.toUpperCase()} · ${a.size} участников · ${a.active_size} активных`),el('small',`До ${a.expires_at.slice(0,10)}`));n.append(body);root.append(n)}if(!audiences.length)root.append(el('p','Аудитории ещё не загружены.','p13-empty'));
 for(const id of ['compare-left','compare-right']){const select=$(id);select.replaceChildren();for(const a of audiences){const option=el('option',`${a.title} · ${a.platform}`);option.value=a.id;select.append(option)}}
 if(audiences.length>1)$('compare-right').selectedIndex=1;
 const rr=$('report-list');rr.replaceChildren();for(const a of comp.reports||[]){const n=el('div','','p13-item'),body=el('div');body.append(el('strong',a.label),el('small',`${a.platform} · ${a.intersection} общих · ${a.active_intersection} активных`),el('small',`Жаккар ${(100*a.jaccard).toFixed(1)}% · до ${a.expires_at.slice(0,10)}`));n.append(body);rr.append(n)}if(!comp.reports?.length)rr.append(el('p','Сохранённых отчётов пока нет.','p13-empty'));
}
$('import-form').addEventListener('submit',async e=>{e.preventDefault();const f=new FormData(e.target);try{const members=lines(f.get('members')),active=lines(f.get('active'));if(members.length>3000||active.length>3000)throw Error('Лимит: 3000 идентификаторов');
 const r=await api('/audiences',{method:'POST',body:{title:f.get('title'),platform:f.get('platform'),members,active,authorized:f.has('authorized'),retention_days:30}});feedback(`Аудитория сохранена: ${r.count} участников, ${r.active_count} активных. ID не сохранены в открытом виде.`);e.target.reset();await refresh()}catch(err){feedback(err.message,true)}});
$('compare-form').addEventListener('submit',async e=>{e.preventDefault();const f=new FormData(e.target);try{const r=await api('/p13/comparisons',{method:'POST',body:Object.fromEntries(f.entries())});$('latest-comparison').textContent=`${r.intersection} общих участников · ${r.active_intersection} общих активных · Jaccard ${(100*r.jaccard).toFixed(2)}%`;feedback('Расчёт завершён. Создан проверяемый отчёт без идентификаторов участников.');await refresh()}catch(err){feedback(err.message,true)}});
$('refresh-audiences').addEventListener('click',()=>refresh().catch(e=>feedback(e.message,true)));
api('/session').then(async r=>{me=r.user;$('login-needed').hidden=true;$('workspace').hidden=false;$('auth-indicator').textContent=`● ${me.role} · ${me.email}`;feedback('Командная сессия активна. Источники данных ограничены организацией.');await refresh()}).catch(e=>{$('login-needed').hidden=false;$('workspace').hidden=true;$('auth-indicator').textContent='● Вход обязателен';feedback('Сначала авторизуйтесь в CaseFlow Team: '+e.message,true)});
})();
