(()=>{'use strict';
const status=document.getElementById('archiver-server-status');if(!status)return;
const actions=['btn-compress','btn-decompress'].map(id=>document.getElementById(id));
let online=false;let reason='Не подтверждён';
async function check(){
 status.replaceChildren();
 const title=document.createElement('strong'),txt=document.createElement('span');status.append(title,txt);
 try{
 const res=await fetch('/archiver/health',{credentials:'same-origin',cache:'no-store',signal:AbortSignal.timeout(5000),headers:{'Accept':'application/json'}});
 const ct=res.headers.get('content-type')||'';
 if(!res.ok||!ct.includes('json'))throw Error('API недоступен');
 const data=await res.json();
 if(data.status!=='ok'&&data.status!=='running'&&data.healthy!==true)throw Error('Не подтверждена готовность движка');
 online=true;title.textContent='Сервер отвечает';txt.textContent='API подтвердил готовность. Доступность конкретных движков и функций проверяется при выполнении.';
 }catch{
 online=false;title.textContent='Архиватор не подключён';txt.textContent='На публичном GitHub Pages нет подтверждённого вычислительного backend. Для обработки нужен развернутый сервер архиватора.';
 }
 actions.forEach(btn=>{if(btn)btn.disabled=true});
 document.querySelectorAll('#file-compress,#file-decompress').forEach(input=>{if(!online)input.disabled=true});
}
check();
})();