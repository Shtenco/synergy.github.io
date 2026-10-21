/* SYNERGY · human-first navigation utilities */
(()=>{
"use strict";
const $=(s,r=document)=>r.querySelector(s);
const $$=(s,r=document)=>Array.from(r.querySelectorAll(s));
const toggle=$("#smm-more-toggle"),menu=$("#smm-more-menu");
function closeMenu(){if(!toggle||!menu)return;menu.hidden=true;toggle.setAttribute("aria-expanded","false")}
toggle?.addEventListener("click",()=>{menu.hidden=!menu.hidden;toggle.setAttribute("aria-expanded",String(!menu.hidden))});
$$('#smm-more-menu [data-simple-view]').forEach(b=>b.addEventListener("click",closeMenu));
document.addEventListener("keydown",e=>{if(e.key==="Escape")closeMenu()});
document.addEventListener("click",e=>{if(menu&&!menu.hidden&&!e.target.closest("#smm-more-menu,#smm-more-toggle"))closeMenu()});
const search=$("#globalToolSearch"),box=$("#toolSearchResults");
if(!search||!box)return;
const entries=[],ids=new Set();
for(const form of $$('form[data-t]')){
 const t=form.dataset.t,card=form.closest(".tool");
 if(!t||!card||ids.has(t))continue;ids.add(t);
 const heading=card.querySelector("h3");
 const name=(heading?.textContent||t).replace(/\b[a-z]+(?:_[a-z0-9]+){1,}\b/gi,"").replace(/[\u{1F300}-\u{1FAFF}\u2600-\u27BF]/gu,"").replace(/\s+/g," ").trim();
 const section=card.closest("section.sec");
 const sectionName=section?.querySelector(".sec-head h2")?.textContent.replace(/\s+/g," ").trim()||"";
 entries.push({name:name||"Инструмент",code:t,sectionName});
}
let first=null;
function find(){
 const val=search.value.trim().toLocaleLowerCase("ru-RU");
 if(!val){box.hidden=true;box.replaceChildren();first=null;return}
 const m=entries.map(e=>({...e,score:(e.name.toLocaleLowerCase("ru-RU").includes(val)?3:0)+(e.sectionName.toLocaleLowerCase("ru-RU").includes(val)?1:0)+(e.code.toLowerCase().includes(val)?1:0)})).filter(e=>e.score>0).sort((a,b)=>b.score-a.score).slice(0,18);
 box.replaceChildren();box.hidden=false;first=null;
 const label=document.createElement("p");label.className="search-caption";label.textContent=m.length?("Подходящие действия · "+m.length):"Ничего не найдено — попробуйте другие слова";
 box.append(label);
 for(const e of m){
   const b=document.createElement("button");b.type="button";b.className="search-result";
   b.textContent=e.name+"   ↗";
   b.addEventListener("click",()=>{
     window.SynergySimpleOpen?.(e.code);
     search.value="";box.hidden=true;box.replaceChildren();first=null;
   });
   box.append(b);if(!first)first=b;
 }
}
search.addEventListener("input",find);
search.addEventListener("keydown",e=>{
 if(e.key==="Enter"&&first){e.preventDefault();e.stopImmediatePropagation();first.click()}
 if(e.key==="Escape"){box.hidden=true;box.replaceChildren();search.value="";first=null}
},true);
})();
