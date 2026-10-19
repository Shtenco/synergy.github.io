/* Offline file preview is not a real backend connection. */
(()=>{'use strict';
 const ready=()=>{
 if(location.protocol!=='file:')return;
 const pub=new URL(document.documentElement.dataset.synPreviewHelp||'./start.html',location.href);
 document.querySelectorAll('a[href^="/"]').forEach(a=>{const value=a.getAttribute('href');if(value.startsWith('//')||value.startsWith('/api/'))return;const u=new URL(value,'https://synergy.local');let path=u.pathname.replace(/^\//,'');if(!path||path.endsWith('/'))path+='index.html';a.href=new URL(path+u.search+u.hash,pub).href;});
 const n=document.createElement('div');n.className='synv9-render-notice';n.setAttribute('role','status');
 const a=document.createElement('div');const b=document.createElement('strong');b.textContent='STATIC PREVIEW · ';a.append(b,document.createTextNode('Дизайн доступен, но API и личные данные работают только через сервер. Не оценивайте пустые данные как сбой оформления.'));
 const l=document.createElement('a');l.textContent='Как запустить сервер ↗';l.href=(document.documentElement.dataset.synPreviewHelp||'./start.html');n.append(a,l);
 const bar=document.querySelector('.synv9-bar');document.body.insertBefore(n,bar?.nextSibling||document.body.firstChild);
 if(document.documentElement.dataset.synApp==='smm' && !document.querySelector('.synv9-preview-surface')){
 const s=document.createElement('section');s.className='synv9-preview-surface';s.innerHTML='<span class="synv9-preview-label">WORKSPACE / LOCAL SHOWCASE</span><h2>Рабочий кабинет SYNERGY</h2><p>Интерфейс загружен с локальными стилями. Статистика, входящие обращения и выполнение Python-задач появляются только при запуске FastAPI и входе в систему. Защищённые разделы намеренно не показывают чужие данные.</p><div class="synv9-preview-actions"></div><p class="synv9-preview-lock">Статус: демонстрация интерфейса · подключение к серверу не выполнено</p>';
 const pages=[['Все SMM кабинеты','/synergy.github.io/smm/workspaces.html'],['Parsing Lab','/synergy.github.io/smm/parsing.html'],['Engagement Desk','/synergy.github.io/smm/engagement.html'],['AI SMM','/synergy.github.io/smm/ai-studio.html'],['Lead Radar','/synergy.github.io/smm/lead-radar.html']];
 const publicBase=new URL(document.documentElement.dataset.synPreviewHelp||'../start.html',location.href);for(const [label,target] of pages){const a=document.createElement('a');a.textContent=label;a.href=new URL(target.replace(/^\//,''),publicBase).href;s.querySelector('.synv9-preview-actions').appendChild(a)}
 const target=document.querySelector('main')||document.querySelector('#main');if(target)target.prepend(s);else document.body.append(s);
 }
 };
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',ready);else ready();
})();

/* V9.2 — load premium workspace components from the same tested asset directory. */
(()=>{'use strict';const src=document.currentScript?.src;if(!src||document.querySelector('script[data-syn-experience]'))return;const tag=document.createElement('script');tag.src=new URL('synergy-experience-v92.js',src).href;tag.dataset.synExperience='v92';tag.defer=true;document.head.appendChild(tag)})();
