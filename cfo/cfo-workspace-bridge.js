/* Explicit, local-only CFO -> Workspace handoff. No direct API/network calls. */
(()=>{"use strict";
const button=document.getElementById("cfo-export-ledger");
if(!button)return;
const node=id=>document.getElementById(id);
const status=node("cfo-bridge-status");
function fail(text){status.textContent=text;status.dataset.state="error";}
button.addEventListener("click",async()=>{
 try{
  if(!node("cfo-bridge-reviewed").checked)throw Error("Сначала проверьте операции и подтвердите сверку с оригинальной выпиской.");
  const source=node("cfo-bridge-source").value.trim();
  const currency=node("cfo-bridge-currency").value.trim().toUpperCase();
  if(!/^[a-zA-Z0-9_.:/-]{1,160}$/.test(source))throw Error("Введите постоянный ID источника: латиница, цифры, дефис, точка или подчёркивание.");
  if(!/^[A-Z]{3}$/.test(currency))throw Error("Введите трёхбуквенный код валюты: например KZT, RUB или USD.");
  const rows=window.SynergyCfoGetLedgerRows?.();
  if(!Array.isArray(rows)||!rows.length||rows.length>1000)throw Error("Не найдено операций (или их более 1000). Сначала загрузите и проверьте выписку.");
  const entries=rows.map((t,i)=>{
   const date=String(t.date||"");
   if(!/^\d{4}-\d{2}-\d{2}$/.test(date)||Number.isNaN(Date.parse(date)))throw Error("У некоторых операций нет корректной даты. Исправьте их на шаге 2.");
   if(t.currency && t.currency!==currency)throw Error("Операция в другой валюте. Отделите разные валюты перед экспортом.");
   const amount=Number(t.amount);
   if(!Number.isFinite(amount)||Math.abs(amount)>1e12)throw Error("Недопустимая сумма операции.");
   const category=String(t.category||"");
   const kind=/перевод|transfer/i.test(category)?"transfer":/инвестици|investment/i.test(category)?"investment":/возврат|refund/i.test(category)?"refund":(amount>=0?"income":"expense");
   return {entry_id:"cfo-"+String(i+1).padStart(6,"0"),date,kind,amount:Math.abs(amount).toFixed(2),memo:String(t.description||"").slice(0,2000)};
  });
  const days=entries.map(t=>t.date).sort();
  const batch={source_id:source,currency,period_start:days[0],period_end:days.at(-1),entries};
  // SHA-256 is a data-integrity fingerprint, not bank attestation.
  const raw=new TextEncoder().encode(JSON.stringify(batch));
  const sha=Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256",raw))).map(v=>v.toString(16).padStart(2,"0")).join("");
  const exportDoc={...batch,operator_reviewed:true,verified_by_bank:false,source_sha256:sha};
  const file=new Blob([JSON.stringify(exportDoc,null,2)],{type:"application/json;charset=utf-8"});
  const url=URL.createObjectURL(file),a=document.createElement("a");
  a.href=url;a.download="synergy-cfo-"+source.replace(/[^a-zA-Z0-9_-]/g,"_")+".json";
  document.body.append(a);a.click();a.remove();
  setTimeout(()=>URL.revokeObjectURL(url),3000);
  status.dataset.state="ok";status.textContent="Готово: "+entries.length+" операций в локальном JSON-пакете. Импорт в защищённый Workspace должен выполнить авторизованный оператор. Банковская подлинность не подтверждена.";
 }catch(e){fail(e.message||"Не удалось подготовить экспорт.");}
});
})();