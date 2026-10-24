/* SYNERGY V4 unified funnel: public links only, no private API or credentials. */
(()=>{"use strict";
if(document.getElementById("synergy-growth-v4"))return;
const base=new URL("../",document.currentScript.src);
const products=[
["LEAD OS","Найти возможность","smm/lead-radar.html","Прототип поиска обращений"],
["AI SALES","Превратить обращение в сделку","workspace/","CRM и подтверждаемые черновики"],
["AI SMM","Поддерживать поток новых обращений","smm/","Контент и маркетинг"],
["AI CFO","Учесть выручку, расходы и капитал","cfo/","Финансовый анализ и учёт"],
["AUTOPILOT","Координировать разрешённые действия","workspace/","Контролируемая автоматизация"]
];
const s=document.createElement("section");s.id="synergy-growth-v4";
s.setAttribute("aria-label","SYNERGY: единая воронка продуктов");
const h=document.createElement("h2");h.textContent="SYNERGY · От клиента к капиталу";s.append(h);
const p=document.createElement("p");p.className="syn-growth-intro";p.textContent="Одна цепочка: привлечение → продажа → маркетинг → учёт → автоматизация. Статус каждой интеграции проверяется отдельно.";s.append(p);
const g=document.createElement("nav");g.className="syn-growth-grid";g.setAttribute("aria-label","Все продукты SYNERGY");
products.forEach((x,i)=>{const a=document.createElement("a");a.href=new URL(x[2],base).href;a.className="syn-growth-card";
const n=document.createElement("span");n.textContent="0"+(i+1);n.className="syn-growth-number";a.append(n);
const b=document.createElement("b");b.textContent=x[0];a.append(b);
const d=document.createElement("span");d.textContent=x[1];a.append(d);
const q=document.createElement("small");q.textContent=x[3]+" · Открыть ↗";a.append(q);g.append(a)});
s.append(g);
const r=document.createElement("div");r.className="syn-growth-future";
const f=document.createElement("strong");f.textContent="Дальнейшее расширение";r.append(f);
[["MIDAS Research","investor-folio/"],["Инвестиционная аналитика","riskguard/"],["SYNA · только после юридической готовности","investor/"]].forEach((x,i)=>{if(i)r.append(document.createTextNode(" → "));const a=document.createElement("a");a.href=new URL(x[1],base).href;a.textContent=x[0];r.append(a)});
s.append(r);
const c=document.createElement("p");c.className="syn-growth-note";c.textContent="Карточки не подтверждают работу API. Платежи, трейдинг и операции с SYNA не включаются автоматически.";s.append(c);
(document.querySelector("main")||document.body).append(s);
const css=document.createElement("style");css.textContent="#synergy-growth-v4{max-width:1180px;width:calc(100% - 28px);margin:42px auto!important;padding:28px!important;background:linear-gradient(120deg,#09172b,#14263c);color:#edf6ff!important;border:1px solid #355878;border-radius:20px;box-sizing:border-box;font:14px/1.55 system-ui,sans-serif;box-shadow:0 14px 40px #15223930}#synergy-growth-v4 *{box-sizing:border-box}#synergy-growth-v4 h2{color:#fff;margin:0 0 10px;font-size:clamp(23px,3vw,32px);font-weight:800}#synergy-growth-v4 .syn-growth-intro{color:#bad3ec;margin:0 0 20px}#synergy-growth-v4 .syn-growth-grid{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:10px}#synergy-growth-v4 .syn-growth-card{display:flex;flex-direction:column;gap:9px;min-width:0;min-height:185px;padding:17px 14px;background:#ffffff0d;border:1px solid #6e9eca66;border-radius:12px;color:#f3f9ff;text-decoration:none}#synergy-growth-v4 .syn-growth-card:hover,#synergy-growth-v4 .syn-growth-card:focus-visible{border-color:#82ddff;outline-offset:3px}#synergy-growth-v4 .syn-growth-number{color:#75c5fa;font-weight:800}#synergy-growth-v4 .syn-growth-card b{color:#fff;font-size:16px}#synergy-growth-v4 .syn-growth-card span:not(.syn-growth-number){color:#d8e7f8}#synergy-growth-v4 .syn-growth-card small{margin-top:auto;color:#eecf94;font-size:11px}#synergy-growth-v4 .syn-growth-future{margin-top:19px;padding-top:17px;border-top:1px solid #6e9eca66;line-height:2}#synergy-growth-v4 .syn-growth-future strong{display:block;color:#efdbaf}#synergy-growth-v4 .syn-growth-future a{color:#9ddfff}#synergy-growth-v4 .syn-growth-note{font-size:11px;color:#b5c4d4;margin:14px 0 0}@media(max-width:900px){#synergy-growth-v4 .syn-growth-grid{grid-template-columns:repeat(3,minmax(0,1fr))}}@media(max-width:560px){#synergy-growth-v4{width:calc(100% - 16px);padding:18px 12px!important}#synergy-growth-v4 .syn-growth-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(max-width:355px){#synergy-growth-v4 .syn-growth-grid{grid-template-columns:1fr}}";document.head.append(css);
})();