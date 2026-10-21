/* SYNERGY SMM console 3.0 — navigation only.
   The original 144 form handlers remain untouched in the preserved inline engine. */
(() => {
  "use strict";
  const nav=document.getElementById("smmViewNav");
  const tabs=[...nav.querySelectorAll('[role="tab"][data-view]')];
  const views=[...document.querySelectorAll(".smm-view[data-view]")];
  const sectionMap=new Map();
  for(const v of views)for(const sec of v.querySelectorAll("section[id]"))sectionMap.set(sec.id,v.dataset.view);
  const viewMap=new Map(views.map(v=>[v.dataset.view,v]));
  const menu=document.getElementById("smm-menu-toggle");
  const sidebar=document.getElementById("sideNav");
  const overlay=document.getElementById("smm-side-overlay");
  const globalSearch=document.getElementById("globalToolSearch");
  const resultWrap=document.getElementById("toolSearchResults");
  const title=document.getElementById("current-view-name");
  let firstSearchResult=null;

  function closeMenu(){
    sidebar.classList.remove("is-open");
    overlay.classList.remove("is-open");
    overlay.hidden=true;
    menu.setAttribute("aria-expanded","false");
    document.body.classList.remove("smm-menu-open");
  }
  function openMenu(){
    sidebar.classList.add("is-open");overlay.hidden=false;overlay.classList.add("is-open");
    menu.setAttribute("aria-expanded","true");document.body.classList.add("smm-menu-open");
  }
  menu.addEventListener("click",()=>sidebar.classList.contains("is-open")?closeMenu():openMenu());
  overlay.addEventListener("click",closeMenu);
  document.addEventListener("keydown",e=>{
    if(e.key==="Escape"){closeMenu();hideResults()}
    if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==="k"){e.preventDefault();globalSearch.focus();globalSearch.select()}
    if(e.key==="/"&&!["INPUT","TEXTAREA","SELECT"].includes(document.activeElement?.tagName)){e.preventDefault();globalSearch.focus()}
  });
  function activate(group,{focus=false,scroll=false}={}){
    if(!viewMap.has(group))return false;
    for(const v of views){
      const active=v.dataset.view===group;
      v.classList.toggle("is-active",active);v.setAttribute("aria-hidden",String(!active));
    }
    for(const tab of tabs){
      const active=tab.dataset.view===group;
      tab.setAttribute("aria-selected",String(active));tab.tabIndex=active?0:-1;
      if(active&&focus)tab.focus({preventScroll:true});
    }
    title.textContent=tabs.find(t=>t.dataset.view===group)?.textContent.replace(/^\s*\d+\s*/,"").trim()||group;
    if(scroll){
      const y=nav.getBoundingClientRect().top+window.scrollY-85;
      window.scrollTo({top:Math.max(0,y),behavior:matchMedia("(prefers-reduced-motion:reduce)").matches?"instant":"smooth"});
    }
    return true;
  }
  function openTarget(id,{setHash=true,scroll=true}={}){
    if(id.startsWith("view-")){
      const view=id.slice(5);if(activate(view,{scroll})){if(setHash)history.replaceState(null,"","#view-"+view);closeMenu();return true}
    }
    const group=sectionMap.get(id);
    if(!group)return false;
    activate(group);
    const target=document.getElementById(id);
    if(setHash)history.replaceState(null,"","#"+id);
    if(scroll)requestAnimationFrame(()=>target?.scrollIntoView({behavior:matchMedia("(prefers-reduced-motion:reduce)").matches?"instant":"smooth",block:"start"}));
    for(const a of sidebar.querySelectorAll('.side-link[href^="#"]')){
      const active=a.getAttribute("href")==="#"+id;
      a.classList.toggle("active",active);
      if(active)a.setAttribute("aria-current","location");else a.removeAttribute("aria-current");
    }
    closeMenu();hideResults();
    return true;
  }
  for(const tab of tabs)tab.addEventListener("click",()=>{
    activate(tab.dataset.view,{scroll:true});history.replaceState(null,"","#view-"+tab.dataset.view);
    closeMenu();hideResults();
  });
  nav.addEventListener("keydown",e=>{
    if(!["ArrowLeft","ArrowRight","Home","End"].includes(e.key))return;
    e.preventDefault();
    const cur=tabs.indexOf(document.activeElement);let index=cur<0?0:cur;
    if(e.key==="ArrowLeft")index=(index-1+tabs.length)%tabs.length;
    if(e.key==="ArrowRight")index=(index+1)%tabs.length;
    if(e.key==="Home")index=0;if(e.key==="End")index=tabs.length-1;
    activate(tabs[index].dataset.view,{focus:true,scroll:false});
    history.replaceState(null,"","#view-"+tabs[index].dataset.view);
  });
  // Capture before legacy scroll logic, so hidden sections become visible first.
  document.addEventListener("click",e=>{
    const link=e.target.closest('a[href^="#"],[data-target]');
    if(!link)return;
    const id=link.dataset.target||(link.getAttribute("href")||"").replace(/^#/,"");
    if(!id||!sectionMap.has(id))return;
    if(link.closest(".side")||link.closest(".work-card")||link.closest(".hero-quick")||link.hasAttribute("data-target")){
      e.preventDefault();e.stopImmediatePropagation();openTarget(id);
    }
  },true);
  function hideResults(){resultWrap.hidden=true;resultWrap.replaceChildren();firstSearchResult=null}
  const sourceLinks=[...sidebar.querySelectorAll('.side-link[href^="#"]')];
  function runSearch(){
    const q=globalSearch.value.trim().toLocaleLowerCase("ru-RU");
    if(!q){hideResults();return}
    const matches=sourceLinks.filter(a=>a.textContent.toLocaleLowerCase("ru-RU").includes(q)).slice(0,15);
    resultWrap.replaceChildren();
    resultWrap.hidden=false;
    const hint=document.createElement("p");hint.className="search-caption";
    hint.textContent=matches.length?"Найденные инструменты":"Ничего не найдено";
    resultWrap.append(hint);firstSearchResult=null;
    for(const a of matches){
      const id=a.getAttribute("href").slice(1);
      const button=document.createElement("button");button.type="button";
      button.className="search-result";button.dataset.target=id;
      button.textContent=a.textContent.replace(/\s+/g," ").trim();
      button.addEventListener("click",()=>{openTarget(id);globalSearch.value="";hideResults()});
      resultWrap.append(button);if(!firstSearchResult)firstSearchResult=button;
    }
  }
  globalSearch.addEventListener("input",runSearch);
  globalSearch.addEventListener("keydown",e=>{
    if(e.key==="Enter"&&firstSearchResult){e.preventDefault();firstSearchResult.click()}
    if(e.key==="Escape"){globalSearch.value="";hideResults();globalSearch.blur()}
  });
  // Initial deep links opened from platform-specific cabinets and bookmarked workspaces.
  function onHash(){
    const id=decodeURIComponent(location.hash.replace(/^#/,""));
    if(id&&openTarget(id,{setHash:false,scroll:false})){
      requestAnimationFrame(()=>{if(!id.startsWith("view-"))document.getElementById(id)?.scrollIntoView({block:"start"})});
    }else activate("overview");
  }
  window.addEventListener("hashchange",onHash);
  onHash();
  // Tiny diagnostics, no false API-connected indicator.
  document.documentElement.dataset.consoleReady="true";
})();
