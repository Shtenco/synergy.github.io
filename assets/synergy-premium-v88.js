/* SYNERGY ATELIER V8.8: contextual, accessible cross-portal navigation without altering the legacy DOM */
(()=>{'use strict';if(document.documentElement.dataset.synV9==='true')return;
const here=location.pathname;
const definitions=[['/synergy.github.io/portal/','КОМПАС','◈'],['/synergy.github.io/smm/workspaces.html','SMM','✳'],['/synergy.github.io/nexus/','NEXUS','⌘'],['/synergy.github.io/riskguard/','RISK','◉'],['/synergy.github.io/investor-folio/','FOLIO','◒']];
const dock=document.createElement('nav');dock.className='syn-dock';dock.setAttribute('aria-label','Быстрый переход по кабинетам SYNERGY');
const marker=document.createElement('span');marker.className='syn-dock-status';marker.title='Состояние сервисов проверяйте в NEXUS';dock.append(marker);
for(let i=0;i<definitions.length;i++){
 const [href,label,glyph]=definitions[i];const a=document.createElement('a');a.href=href;a.title=label;
 if((here===href)||(href!=='/synergy.github.io/portal/' && here.startsWith(href.replace(/[^/]+\.html$/, '')) && here===href))a.setAttribute('aria-current','page');
 const ic=document.createElement('span');ic.className='syn-dock-icon';ic.setAttribute('aria-hidden','true');ic.textContent=glyph;
 const tx=document.createElement('span');tx.className=i>=3?'syn-dock-hide':'';tx.textContent=label;a.append(ic,tx);dock.append(a);
}
document.body.append(dock);
if(here==='/synergy.github.io/portal/'||here==='/synergy.github.io/portal/index.html')dock.querySelector('a[href="/synergy.github.io/portal/"]')?.setAttribute('aria-current','page');
})();
