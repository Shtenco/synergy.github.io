/* SYNERGY SMM — HUMAN-FIRST EXPERIENCE v4
 * Task-first discovery and progressive disclosure. Original business handlers
 * and all form nodes remain in the document, unchanged. No simulated API states.
 */
(()=>{
"use strict";
const $=(sel,root=document)=>root.querySelector(sel);
const $$=(sel,root=document)=>Array.from(root.querySelectorAll(sel));
const tabs=$$('#smmViewNav button[data-view]');
const views=$$('.smm-view[data-view]');
const side=$('#sideNav'), catalogButton=$('#catalogToggle');
const status=$('#simpleStatus');
const lookup={
 crosspost_publish:["Создать публикацию","Один текст для нескольких выбранных площадок."],
 hot_lead_vk_scan:["Найти потенциальных клиентов","Найдите публичные сигналы интереса к вашему предложению."],
 vk_search_groups:["Найти сообщества","Введите тему и получите доступные тематические сообщества."],
 inbox_list:["Просмотреть обращения","Откройте очередь обращений, когда сервер подключён."],
 generate_content:["Подготовить текст с ИИ","Опишите задачу и получите черновик для проверки."],
 vk_post_analytics:["Узнать, что работает","Посмотрите статистику материалов и время активности."],
 telegram_post:["Опубликовать в Telegram","Подготовьте текст для канала с проверенными правами."],
 vk_collect_users:["Исследовать аудиторию","Соберите доступные данные для анализа и разрешённой рекламы."],
 vk_audience_intersection:["Сравнить аудитории","Найдите пересечения между разрешёнными источниками."],
 vk_mailing:["Подготовить сообщения","Только для аудитории с действительным согласием."],
 ai_post_series:["Сделать серию публикаций","Создайте несколько согласованных черновиков."]
};
const kinds=[
 [/search_groups|chat_search/,["Поиск сообществ","Найдите группы или каналы по теме."]],
 [/collect_users|audience_intersection|friends_graph|parse_users/,["Исследование аудитории","Проанализируйте доступные данные аудитории."]],
 [/lead|crm|inbox/,["Работа с клиентами","Оцените обращения и подготовьте следующий шаг."]],
 [/analytics|activity|stat|insight/,["Статистика","Посмотрите показатели и сравнения."]],
 [/post|publish|wall|content|calendar/,["Контент","Подготовьте, проверьте или опубликуйте материал."]],
 [/mail|message|reply|send|invite/,["Сообщения","Проверяйте согласие, права и получателей."]],
 [/stories|story|moment|reactions/,["Истории и реакции","Просмотрите доступные данные о публикациях."]],
 [/group|chat|member|moder|ban/,["Управление сообществом","Используйте только там, где вы администратор."]],
 [/token|auth|session|login|check/,["Подключение","Проверьте доступ к вашему аккаунту."]],
 [/file|export|import/,["Файлы","Используйте сохранённые результаты."]],
 [/./,["Инструмент","Укажите данные и проверьте результат."]]
];
const sectionLabel=(s)=>{
 const h=$(".sec-head h2",s)||$("h2",s);
 const copy=h?.cloneNode(true);
 copy?.querySelectorAll(".badge,.badge-sm").forEach(e=>e.remove());
 let str=(copy?.textContent||"Инструменты").replace(/\s+/g," ").trim();
 return str.replace(/^(SINERGY|SYNERGY)\s*[—–:-]?\s*/i,"").replace(/\bofficial API\b/gi,"").slice(0,67);
};
const titleText=(tool)=>{
 const h=$("h3",tool);
 if(!h)return "Инструмент";
 const clone=h.cloneNode(true);
 clone.querySelectorAll(".badge-sm,.badge,.code").forEach(e=>e.remove());
 const raw=clone.textContent.replace(/[\u{1F300}-\u{1FAFF}\u2600-\u27BF]/gu,"").replace(/\b[a-z]+(?:_[a-z0-9]+){1,}\b/gi,"").replace(/\s+/g," ").trim();
 return raw||"Рабочая операция";
};
function labelFor(tool){
 const code=$("form[data-t]",tool)?.dataset.t||"";
 return lookup[code]||kinds.find(([r])=>r.test(code))?.[1]||["Инструмент","Укажите необходимые данные, затем проверьте результат."];
}
function actualTab(group){
 return tabs.find(t=>t.dataset.view===group);
}
function displayView(group){
 const tab=actualTab(group);
 if(!tab)return;
 tab.click(); // delegates to the existing navigation engine
 for(const [btn] of $$("#goalNav button[data-view]").map(b=>[b])) btn.classList.toggle("is-active",btn.dataset.view===group);
 const label=tab.textContent.replace(/^\s*\d+\s*/,"").trim();
 document.title="SYNERGY SMM — "+label;
}
const sectionIndex=new Map();
const toolIndex=new Map();
for(const view of views){
 const secs=Array.from(view.querySelectorAll(":scope > section.sec[id]"));
 for(const section of secs){
  sectionIndex.set(section.id,{view,section});
  const cards=$$(".tool",section).filter(e=>e.closest("section.sec")===section);
  // Do not alter complex custom widgets without .tool cards.
  if(cards.length){
   const list=document.createElement("div");
   list.className="simple-tool-list";list.setAttribute("role","group");list.setAttribute("aria-label","Выбор задачи");
   const container=document.createElement("div");container.className="simple-tool-content";
   const originalParent=new Map(cards.map(card=>[card,card.parentElement]));
   cards.forEach((card,i)=>{
    const form=$("form[data-t]",card);
    const code=form?.dataset.t||"";
    const [fallback,summary]=labelFor(card);
    const title=titleText(card);
    const name=title.length>76?title.slice(0,73)+"…":title;
    const btn=document.createElement("button");
    btn.type="button";btn.className="simple-tool-option";
    btn.innerHTML='<span class="tool-number">'+String(i+1).padStart(2,"0")+'</span><span class="tool-option-copy"><strong></strong><small></small></span><span class="tool-chevron" aria-hidden="true">›</span>';
    $("strong",btn).textContent=name||fallback;$("small",btn).textContent=summary;
    const parent=originalParent.get(card);
    card.classList.add("simple-tool-panel");
    card.dataset.simpleCode=code;
    card.dataset.simpleIndex=String(i);
    const explanation=$(".desc",card);
    if(explanation){
      const details=document.createElement("details");details.className="simple-explanation";
      const summaryNode=document.createElement("summary");summaryNode.textContent="Описание и ограничения";
      details.append(summaryNode,explanation);const heading=$("h3",card);
      if(heading)heading.after(details);else card.prepend(details);
    }
    const tag=$(".badge-sm",card);if(tag){const codeDetails=document.createElement("details");codeDetails.className="simple-technical";const summ=document.createElement("summary");summ.textContent="Техническое название";codeDetails.append(summ,tag);card.append(codeDetails);}
    if(form){
      const kicker=document.createElement("div");kicker.className="simple-form-intro";kicker.innerHTML='<span>Шаг 1</span><strong>Заполните данные</strong><p>Проверьте поля и выбранный аккаунт. Изменения будут выполнены только после явного запуска.</p>';
      form.before(kicker);
      for(const labelEl of $$("label",form)){
       // Inputs remain untouched; group optional knobs into expandable advanced section.
       const text=labelEl.textContent.trim().toLowerCase();
       const field=$("input,textarea,select",labelEl);
       if(!field||field.required||field.type==="checkbox"||field.type==="radio"||field.type==="file"||field.type==="hidden")continue;
       if(/(лимит|макс\.?|мин\.?|задерж|таймаут|сэмпл|формат|файл результата|имя файла|кол-во|количество запис|число пост|за последн|за сколько|постов на группу)/.test(text)){
        labelEl.classList.add("simple-optional");
       }
      }
      const opt=$$(".simple-optional",form);
      if(opt.length>0){
       const details=document.createElement("details");details.className="simple-advanced";
       const summ=document.createElement("summary");summ.textContent="Дополнительные настройки ("+opt.length+")";
       details.append(summ);const grid=document.createElement("div");grid.className="simple-advanced-grid";details.append(grid);
       opt.forEach(e=>grid.append(e));form.append(details);
      }
    }
    card.hidden=i!==0;
    card.classList.toggle("is-picked",i===0);
    btn.setAttribute("aria-pressed",String(i===0));
    btn.addEventListener("click",()=>chooseTool(section,card));
    list.append(btn);container.append(card);
    // A visible card can own multiple distinct API forms (e.g. ban/unban).
    // Index every form, not only the first, so all method links are reachable.
    for(const f of $$("form[data-t]",card)){
      const method=f.dataset.t;
      if(method&&!toolIndex.has(method))toolIndex.set(method,{view,section,card,form:f});
    }
   });
   const header=document.createElement("div");header.className="simple-tools-header";header.innerHTML='<div><span>ВЫБЕРИТЕ ДЕЙСТВИЕ</span><h3></h3></div><p>Сначала одна задача — затем её настройки.</p>';
   $("h3",header).textContent=cards.length===1?"Доступный инструмент":cards.length+" действий";
   const panel=document.createElement("div");panel.className="simple-tool-layout";panel.append(list,container);
   const insert=section.querySelector(".section-desc,.sec-head")||section.firstElementChild;
   insert?.after(header,panel);
   // Existing .tools wrappers remain as empty technical containers for compatibility.
   section.classList.add("simple-section");
  }
 }
 const picker=document.createElement("div");
 picker.className="simple-sections";
 picker.setAttribute("aria-label","Подразделы");
 if(secs.length>1){
   secs.forEach((s,i)=>{
    const button=document.createElement("button");button.type="button";
    button.className="simple-section-button";
    button.textContent=sectionLabel(s);
    button.setAttribute("aria-pressed",String(i===0));
    button.addEventListener("click",()=>chooseSection(view,s,{scroll:true}));
    picker.append(button);
   });
   const vh=$(".view-head",view);
   if(vh)vh.after(picker);else view.prepend(picker);
 }
 view.dataset.simpleSections=String(secs.length);
 if(secs.length>1)secs.forEach((s,i)=>{s.classList.toggle("simple-current",i===0);s.hidden=i!==0;});
}
function chooseSection(view,section,{scroll=false}={}){
 for(const s of Array.from(view.querySelectorAll(":scope > section.sec[id]"))){
  const selected=s===section;s.hidden=!selected;s.classList.toggle("simple-current",selected);
 }
 const secs=Array.from(view.querySelectorAll(":scope > section.sec[id]"));
 $$(".simple-section-button",view).forEach((b,i)=>b.setAttribute("aria-pressed",String(secs[i]===section)));
 if(scroll)requestAnimationFrame(()=>section.scrollIntoView({block:"start",behavior:window.matchMedia("(prefers-reduced-motion: reduce)").matches?"instant":"smooth"}));
}
function chooseTool(section,card){
 const content=$(".simple-tool-content",section);
 if(!content)return;
 const cards=$$(".simple-tool-panel",content);
 cards.forEach((c,i)=>{
  const selected=c===card;c.hidden=!selected;c.classList.toggle("is-picked",selected);
  const btn=$$(".simple-tool-option",section)[i];btn?.setAttribute("aria-pressed",String(selected));
 });
 const h=$("h3",card);
 if(h)h.setAttribute("tabindex","-1");
}
function open(id){
 if(toolIndex.has(id)){
  const {view,section,card}=toolIndex.get(id);
  displayView(view.dataset.view);chooseSection(view,section);
  chooseTool(section,card);requestAnimationFrame(()=>card.scrollIntoView({block:"start"}));return true;
 }
 if(sectionIndex.has(id)){
  const {view,section}=sectionIndex.get(id);
  displayView(view.dataset.view);chooseSection(view,section);
  requestAnimationFrame(()=>section.scrollIntoView({block:"start"}));return true;
 }
 if(views.some(v=>v.dataset.view===id)){displayView(id);return true}
 return false;
}
window.SynergySimpleOpen=open;
$$("[data-simple-task]").forEach(btn=>btn.addEventListener("click",()=>open(btn.dataset.simpleTask)));
$$("[data-simple-view]").forEach(btn=>btn.addEventListener("click",()=>open(btn.dataset.simpleView)));
if(catalogButton){
 catalogButton.addEventListener("click",()=>{
  const now=!side.classList.contains("show-catalog");side.classList.toggle("show-catalog",now);
  catalogButton.setAttribute("aria-expanded",String(now));
  catalogButton.textContent=now?"Скрыть полный каталог ↑":"Все инструменты и настройки ↓";
  if(now)$("#sideSearch")?.focus();
 });
}
$$("#sideNav .side-link[href^='#']").forEach(a=>a.addEventListener("click",e=>{
 const id=a.getAttribute("href").slice(1);
 if(sectionIndex.has(id)){e.preventDefault();e.stopImmediatePropagation();open(id);history.replaceState(null,"","#"+id)}
},true));
// Restore original hash after restructuring: the old navigation handler may have
// executed before the progressive-disclosure panels were constructed.
const initial=decodeURIComponent(location.hash.slice(1));
if(initial){
 if(!open(initial)&&initial.startsWith("view-"))open(initial.slice(5));
}
window.addEventListener("hashchange",()=>{
 const id=decodeURIComponent(location.hash.slice(1));
 if(id&&!id.startsWith("view-"))open(id);
});
if(status)status.textContent="Подключение проверяется при входе — здесь нет имитации успешной авторизации.";
document.documentElement.dataset.simpleSmm="ready";
})();