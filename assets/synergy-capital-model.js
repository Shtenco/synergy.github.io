/* SYNERGY Capital Model — deterministic educational scenario, no network or storage.
   C_n = C_0(1+r_m)^n + sum_{t=1}^n I_t(1+r_m)^(n-t). Contributions at month end.
*/
(()=>{'use strict';
const form=document.getElementById('capital-plan-form');if(!form)return;
const id=x=>document.getElementById(x);
const inputs=['cp-currency','cp-years','cp-income','cp-expenses','cp-reserve','cp-share','cp-return'].map(id);
const output=['cp-total','cp-delta','cp-reserve-amount','cp-monthly','cp-contributions','cp-growth'].map(id);
const sym={KZT:'₸',RUB:'₽',USD:'$'};
function showError(message){const err=id('cp-error');err.textContent=message;err.hidden=false;output.forEach(el=>el.textContent='—')}
function compute(){
 const currency=id('cp-currency').value,years=Number(id('cp-years').value),
 income=Number(id('cp-income').value),expenses=Number(id('cp-expenses').value),
 reserve=Number(id('cp-reserve').value),share=Number(id('cp-share').value),
 annualReturn=Number(id('cp-return').value);
 if(!['KZT','RUB','USD'].includes(currency)||!Number.isInteger(years)||years<1||years>20||
 [income,expenses,reserve,share,annualReturn].some(x=>!Number.isFinite(x))||
 income<0||expenses<0||income>1e11||expenses>1e11||reserve<0||reserve>100||share<0||share>100||annualReturn < -50||annualReturn>50){
  showError('Проверьте значения: суммы от 0, доли от 0 до 100%, доходность от −50% до +50%.');return;
 }
 id('cp-error').hidden=true;
 const rawDelta=income-expenses;
 const reserveAmount=Math.max(0,rawDelta)*reserve/100;
 const afterReserve=Math.max(0,rawDelta)-reserveAmount;
 const monthlyContribution=afterReserve*share/100;
 const months=years*12;
 const monthlyRate=Math.pow(1+annualReturn/100,1/12)-1;
 let portfolio=0;
 for(let n=0;n<months;n++) portfolio=portfolio*(1+monthlyRate)+monthlyContribution;
 const contributions=monthlyContribution*months;
 const growth=portfolio-contributions;
 function money(v){
  const rounded=Math.round(v);
  const formatted=new Intl.NumberFormat('ru-RU',{maximumFractionDigits:0}).format(Math.abs(rounded));
  return (rounded<0?'−':'')+formatted+' '+sym[currency];
 }
 id('cp-total').textContent=money(portfolio);
 id('cp-delta').textContent=money(rawDelta);
 id('cp-reserve-amount').textContent=money(reserveAmount);
 id('cp-monthly').textContent=money(monthlyContribution);
 id('cp-contributions').textContent=money(contributions);
 id('cp-growth').textContent=money(growth);
}
for(const el of inputs)el.addEventListener('input',compute);
form.addEventListener('submit',e=>e.preventDefault());
compute();
})();