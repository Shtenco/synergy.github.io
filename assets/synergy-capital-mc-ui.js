/* SYNERGY Capital Lab v1.0 — UI: SVG fan, portfolio bundle and diagnostics. */
(()=>{'use strict';
const form=document.querySelector('#capital-plan-form');if(!form)return;
const $=id=>document.getElementById(id),money=(x)=>{const c=$('cp-currency').value;return new Intl.NumberFormat('ru-RU',{maximumFractionDigits:0}).format(Math.round(x))+' '+({KZT:'₸',RUB:'₽',USD:'$'}[c]||c)};
const pct=x=>new Intl.NumberFormat('ru-RU',{style:'percent',maximumFractionDigits:1}).format(x);
let worker=null,ticket=0,timer=0,latest=null;
const items=['cp-currency','cp-years','cp-income','cp-expenses','cp-reserve','cp-share','cp-return','mc-initial','mc-vol','mc-inflation','mc-inflvol','mc-fee','mc-target','mc-paths','mc-seed','mc-index','mc-profile','mc-custom-cash','mc-custom-bond','mc-custom-equity','mc-chart-mode','mc-show-paths'];
const palette=['#34846b','#0a9560','#6ab778','#b39439','#a75b58','#3068a8'];
function number(id){return Number($(id).value);}
function read(){
 const income=number('cp-income'),expenses=number('cp-expenses'),positive=Math.max(0,income-expenses),monthly=positive*(1-number('cp-reserve')/100)*number('cp-share')/100;
 const eq=number('mc-custom-equity'),bond=number('mc-custom-bond'),cash=number('mc-custom-cash');
 if(Math.abs(eq+bond+cash-100)>.00001)throw Error('Доли своего портфеля должны в сумме составлять 100%.');
 const r=number('cp-return');
 return {monthly,initial:number('mc-initial'),target:number('mc-target'),years:number('cp-years'),paths:number('mc-paths'),seed:number('mc-seed'),inflation:number('mc-inflation'),inflVol:number('mc-inflvol'),fee:number('mc-fee'),indexContributions:$('mc-index').checked,selected:$('mc-profile').value,customWeights:[cash/100,bond/100,eq/100],
 assets:[{return:Math.max(-40,r-3),vol:.6},{return:Math.max(-40,r-1),vol:Math.max(1,number('mc-vol')*.4)},{return:r+3,vol:number('mc-vol')}]};
}
function flag(s,isError){$('mc-status').textContent=s;$('mc-status').classList.toggle('mc-error',!!isError);}
function draw(el,lines,options={}){
 const w=940,h=340,L=78,R=16,T=21,B=41,N=lines[0]?.values.length||0;
 if(!N)return;
 const data=lines.flatMap(line=>line.values.filter(Number.isFinite));
 const hi=Math.max(1,...data)*1.08,low=Math.min(0,...data);
 const X=i=>L+(w-L-R)*i/(N-1),Y=y=>T+(h-T-B)*(hi-y)/(hi-low||1);
 const fmt=(x)=>{if(Math.abs(x)>=1e9)return (x/1e9).toFixed(1)+' млрд';if(Math.abs(x)>=1e6)return (x/1e6).toFixed(1)+' млн';if(Math.abs(x)>=1e3)return (x/1e3).toFixed(0)+' тыс';return String(Math.round(x));};
 const enc=s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('"','&quot;');
 const path=v=>v.map((y,i)=>(i?'L':'M')+X(i).toFixed(2)+','+Y(y).toFixed(2)).join(' ');
 let svg='<svg viewBox="0 0 '+w+' '+h+'" role="img" aria-label="'+enc(options.title||'Модельные траектории капитала')+'" xmlns="http://www.w3.org/2000/svg">';
 for(let k=0;k<=4;k++){let y=low+(hi-low)*k/4;svg+='<line x1="'+L+'" y1="'+Y(y)+'" x2="'+(w-R)+'" y2="'+Y(y)+'" stroke="#dcebe0"/><text x="'+(L-9)+'" y="'+(Y(y)+4)+'" text-anchor="end" fill="#617767" font-size="11">'+fmt(y)+'</text>';}
 const years=number('cp-years');for(let yr=0;yr<=years;yr+=Math.max(1,Math.ceil(years/6))){let x=X(Math.round(yr/years*(N-1)));svg+='<text x="'+x+'" y="'+(h-13)+'" fill="#617767" text-anchor="middle" font-size="12">'+yr+' г.</text>';}
 if(options.fan){
  const q=options.fan;
  const area=(upper,lower)=>q.map((_,i)=>X(i).toFixed(2)+','+Y(q[i][upper]).toFixed(2)).join(' ')+' '+q.map((_,i)=>X(q.length-1-i).toFixed(2)+','+Y(q[q.length-1-i][lower]).toFixed(2)).join(' ');
  svg+='<polygon points="'+area(6,0)+'" fill="#0c9961" fill-opacity=".09"/><polygon points="'+area(5,1)+'" fill="#0c9961" fill-opacity=".15"/><polygon points="'+area(4,2)+'" fill="#0c9961" fill-opacity=".25"/>';
 }
 lines.forEach(line=>{svg+='<path d="'+path(line.values)+'" stroke="'+(line.color||'#0b9b51')+'" stroke-width="'+(line.width||2)+'" stroke-opacity="'+(line.opacity??1)+'" fill="none" vector-effect="non-scaling-stroke"/>';});
 svg+='</svg>';el.innerHTML=svg;
}
function render(result){
 latest=result;
 const mode=$('mc-chart-mode').value,real=mode==='real',fan=real?result.fan.real:result.fan.nominal;
 const paths=[];
 if($('mc-show-paths').checked)result.samples.slice(0,36).forEach(p=>paths.push({values:real?p.real:p.nominal,color:'#278a72',opacity:.15,width:1}));
 paths.push({values:fan.map(x=>x[3]),color:'#05643e',width:3.2});
 draw($('mc-fan'),paths,{fan,title:'Веер 5–95 процентилей и независимые траектории выбранного портфеля'});
 const alternatives=result.chartCompare.map((p,i)=>({values:real?p.real:p.nominal,color:palette[i],width:p.id===$('mc-profile').value?3.6:2,opacity:p.id===$('mc-profile').value?1:.77}));
 draw($('mc-bundle'),alternatives,{title:'Сравнение медианных сценариев шести портфелей'});
 const s=result.selected;
 $('mc-real').textContent=money(s.p50);$('mc-nominal').textContent=money(s.nominalP50);
 $('mc-range').textContent=money(s.p10)+' — '+money(s.p90);
 $('mc-goal').textContent=pct(s.goalProbability);
 $('mc-loss').textContent=pct(s.realLossProbability);
 $('cp-total').textContent=money(s.nominalP50);
 const comparison=$('mc-comparison');comparison.replaceChildren();
 result.comparison.forEach((p,i)=>{
  const tr=document.createElement('tr');if(p.id===$('mc-profile').value)tr.className='mc-selected';
  [p.name,p.weights.join(' / ')+' %',money(p.p10),money(p.p50),money(p.p90),pct(p.goalProbability),pct(p.realLossProbability)].forEach((v,k)=>{const td=document.createElement('td');td.textContent=v;if(k===0){td.style.borderLeft='4px solid '+palette[i];td.style.fontWeight='800';}tr.append(td);});comparison.append(tr);
 });
 $('mc-chart-caption').textContent=real?'В сегодняшних ценах: каждый путь дефлирован собственной траекторией инфляции.':'Номинальные суммы: без поправки на изменение покупательной способности.';
 $('mc-runs').textContent=String(result.meta.paths);flag('Готово · '+result.meta.paths.toLocaleString('ru-RU')+' прогонов · seed '+result.meta.seed,false);
}
function schedule(){clearTimeout(timer);timer=setTimeout(run,170);}
function run(){
 if(!window.SynergyCapitalEngine){flag('Расчётный движок недоступен.',true);return;}
 let config;
 try {config=read();window.SynergyCapitalEngine.validate(config);}catch(e){flag(e.message,true);return;}
 const id=++ticket;flag('Расчёт '+config.paths.toLocaleString('ru-RU')+' сценариев…');
 if(worker){worker.terminate();worker=null;}
 try{
  if(typeof Worker!=='undefined'){
   worker=new Worker('assets/synergy-capital-mc-worker.js');
   worker.onmessage=e=>{if(e.data.id!==ticket)return;if(e.data.ok)render(e.data.data);else flag(e.data.error,true);};
   worker.onerror=()=>{if(id===ticket)flag('Ошибка Web Worker. Проверьте загрузку файлов.',true);};
   worker.postMessage({id,config});return;
  }
  setTimeout(()=>{if(id!==ticket)return;try{render(window.SynergyCapitalEngine.run(config));}catch(e){flag(e.message,true);}},0);
 }catch(e){flag(e.message,true);}
}
for(const item of items){const el=$(item);if(el)el.addEventListener(el.type==='checkbox'?'change':'input',schedule);}
$('mc-profile').addEventListener('change',()=>{$('mc-custom-fields').hidden=$('mc-profile').value!=='custom';schedule();});
$('mc-chart-mode').addEventListener('change',()=>{if(latest)render(latest);});
$('mc-show-paths').addEventListener('change',()=>{if(latest)render(latest);});
$('mc-recalculate').addEventListener('click',run);
$('mc-reset').addEventListener('click',()=>{['mc-initial','mc-vol','mc-inflation','mc-inflvol','mc-fee','mc-target','mc-seed','mc-custom-cash','mc-custom-bond','mc-custom-equity'].forEach((id,i)=>$(id).value=[0,18,6,3,0.7,5000000,20261022,10,40,50][i]);$('mc-profile').value='balanced';$('mc-custom-fields').hidden=true;$('mc-paths').value='3000';$('mc-index').checked=false;schedule();});
window.addEventListener('pagehide',()=>{if(worker)worker.terminate();});
run();
})();
