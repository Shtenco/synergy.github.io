(()=>{
"use strict";
const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>Array.from(r.querySelectorAll(s));
const GROUPS=[
 ["audience","Аудитория и исследования","Сообщества, сегменты и открытые источники.",/search_groups|parse_groups|collect_users|parse_users|intersection|friends_graph|group_members|group_search|newsfeed_search|audience|commenters|business_discovery|hashtag_search|users_info|chat_search/i],
 ["clients","Клиенты и CRM","Запросы клиентов, обращения и воронка.",/lead|crm|inbox|funnel/i],
 ["content","Контент и публикации","Черновики, медиаматериалы и публикации.",/post|publish|wall_edit|wall_pin|wall_unpin|content|calendar|generate_|autopilot/i],
 ["communication","Сообщения и ответы","Диалоги, шаблоны и разрешённые уведомления.",/message|mailing|bulk|reply|comment|send_dm|private_reply|auto_reply|story|invite|reactions|forward/i],
 ["analytics","Аналитика","Статистика, тенденции и сравнение результатов.",/analy|insights|stats|sentiment|churn|virality|competitor|post_reactions|moments_view|stories_view|activity|predict/i],
 ["moderation","Сообщества и модерация","Настройки, роли, ограничения и заявки.",/group_|chat_|member|admin|ban|restrict|permissions|request|pin_message|unpin_message|title|description|leave/i],
 ["accounts","Подключения и безопасность","Проверка аккаунтов и разрешений.",/check$|oauth|send_code|sign_in|set_settings/i],
 ["files","Файлы и результаты","Файлы, экспорт и загрузка.",/read_file|write_file/i],
 ["other","Дополнительные инструменты","Другие специализированные операции.",/./]
];
const NAME={
 hot_lead_vk_scan:"Поиск запросов клиентов",hot_lead_score:"Оценить обращение",hot_lead_ingest:"Сохранить обращение",hot_lead_list:"Список обращений",
 crosspost_publish:"Подготовить публикацию для нескольких площадок",vk_search_groups:"Найти сообщества ВКонтакте",
 vk_collect_users:"Изучить участников сообществ",vk_audience_intersection:"Сравнить аудитории",
 vk_analyze_activity:"Изучить активность пользователей",vk_post_analytics:"Анализ отклика на публикации",
 vk_birthday_today:"Дни рождения в своей базе",vk_mailing:"Сообщения подписчикам с согласием",
 telegram_mass_message:"Сообщения разрешённой аудитории",whatsapp_bulk_send:"Уведомления согласившимся клиентам",
 ig_bulk_optin:"Сообщения с подтверждённым согласием",fb_bulk_optin:"Сообщения с подтверждённым согласием",
 generate_content:"Подготовить текст с AI",ai_autopilot:"Составить AI-план",inbox_list:"Просмотреть входящие обращения",
 inbox_capture:"Добавить обращение",inbox_update:"Изменить статус обращения",read_file:"Открыть файл",write_file:"Сохранить файл"
};
function platform(code){
 if(/^vk_/.test(code))return "ВКонтакте";
 if(/^(tg_|telegram_)/.test(code))return "Telegram";
 if(/^(ig_|instagram_|fb_|meta_|post_instagram|post_facebook)/.test(code))return "Instagram / Facebook";
 if(/^(ok_|post_ok)/.test(code))return "Одноклассники";
 if(/^(wa_|whatsapp_)/.test(code))return "WhatsApp";
 if(/^youtube_/.test(code))return "YouTube";
 return "SYNERGY";
}
const entries=$$("form[data-t]").map((form,index)=>{
 const code=form.dataset.t||"",card=form.closest(".tool"),section=form.closest("section[id]");
 const raw=($("h3",card)?.textContent||code).replace(/\b[a-z]+(?:_[a-z0-9]+){1,}\b/gi,"").replace(/[\u{1F300}-\u{1FAFF}\u2600-\u27BF]/gu,"").replace(/\s+/g," ").trim();
 const group=GROUPS.find(g=>g[3].test(code))||GROUPS[GROUPS.length-1];
 const risk=/bulk|mass_message|mailing|invite|ban|unban|restrict|promote|edit_manager|group_leave|wall_delete|delete_message|send_message|send_dm|post_to_groups|remove_user|revoke|unpin_all|set_permissions|post_facebook|post_instagram|post_ok|telegram_post|vk_post_wall|crosspost_publish|whatsapp_send|forward_message/i.test(code);
 const fields=$$("input,textarea,select",form);
 const buttons=$$("button",form);
 const errors=[];
 if(!buttons.length)errors.push("Отсутствует кнопка");
 if(!buttons.some(b=>b.type==="submit"))errors.push("Нет отправки формы");
 if(fields.some(x=>x.type==="file"&&!x.name))errors.push("Проверить обработчик файла");
 return {index,code,name:NAME[code]||raw||"Рабочее действие",platform:platform(code),group:group[0],groupName:group[1],sectionId:section?.id||"",sectionName:($("h2",section)?.textContent||"").replace(/\s+/g," ").trim(),fields:fields.length,buttons:buttons.length,risk,errors,form};
});
const reg={count:entries.length,unique:new Set(entries.map(x=>x.code)).size,groups:GROUPS.map(g=>({id:g[0],name:g[1],description:g[2],count:entries.filter(e=>e.group===g[0]).length})),entries:entries.map(({form,...rest})=>rest)};
window.SynergySmmMethods=reg;
const root=$("#smm-method-browser");if(!root)return;
const list=$("#smm-method-list"),search=$("#smm-method-search"),select=$("#smm-method-group"),count=$("#smm-method-count"),subtitle=$("#smm-method-subtitle"),safety=$("#smm-method-safety");
for(const g of reg.groups)if(g.count){const o=document.createElement("option");o.value=g.id;o.textContent=g.name+" · "+g.count;select.append(o)}
safety.textContent=entries.length+" методов с формами. Серверная доступность проверяется отдельно. "+entries.filter(e=>e.risk).length+" методов требуют повышенного контроля.";
function open(entry){
 if(!window.SynergySimpleOpen?.(entry.code))window.SynergySimpleOpen?.(entry.sectionId);
 requestAnimationFrame(()=>entry.form.closest(".simple-tool-panel")?.scrollIntoView({block:"center"}));
}
function draw(){
 const q=search.value.trim().toLocaleLowerCase("ru-RU"),g=select.value;
 const matches=entries.filter(e=>(!g||e.group===g)&&(!q||[e.name,e.code,e.sectionName,e.platform,e.groupName].some(t=>String(t).toLocaleLowerCase("ru-RU").includes(q))));
 count.textContent=matches.length+" из "+entries.length;
 subtitle.textContent=matches.length?"Выберите действие, затем заполните одну форму.":"Ничего не найдено. Измените поиск.";
 list.replaceChildren();
 for(const entry of matches.slice(0,60)){
 const b=document.createElement("button");b.type="button";b.className="method-result";
 const label=document.createElement("span");label.className="method-label";label.textContent=entry.platform+" · "+entry.groupName;
 const heading=document.createElement("strong");heading.textContent=entry.name;
 const meta=document.createElement("small");meta.textContent=entry.risk?"Требует проверки перед действием":"Настройка и проверка результата";
 const link=document.createElement("span");link.className="method-go";link.textContent="Открыть ↗";
 b.append(label,heading,meta,link);b.addEventListener("click",()=>open(entry));list.append(b);
 }
 if(matches.length>60){const p=document.createElement("p");p.className="method-page-hint";p.textContent="Показаны первые 60. Уточните запрос или категорию.";list.append(p)}
}
search.addEventListener("input",draw);select.addEventListener("change",draw);draw();
document.documentElement.dataset.registryCount=String(entries.length);
})();