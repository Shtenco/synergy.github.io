/* SYNERGY Capital Lab / research engine v1.0 — pure and reproducible.
 * Annual arithmetic expected returns and standard deviations are illustrative INPUT assumptions.
 * Correlated three-asset geometric random walks; annual rebalancing; monthly end contributions.
 * Inflation is stochastic and independent of asset shocks (explicit model limitation).
 * No brokerage execution, price feeds, banking or network requests.
 */
(function (root) {
  'use strict';
  const PROFILES = Object.freeze([
    {id:'defensive',name:'Защитный',w:[.30,.60,.10]},
    {id:'conservative',name:'Консервативный',w:[.15,.60,.25]},
    {id:'balanced',name:'Сбалансированный',w:[.10,.40,.50]},
    {id:'growth',name:'Рост',w:[.05,.20,.75]},
    {id:'aggressive',name:'Агрессивный',w:[0,.05,.95]},
    {id:'custom',name:'Мой портфель',w:null}
  ]);
  const floor01=x=>Math.max(0,Math.min(1,x));
  function quantile(sorted,p) {
    if (!sorted.length) return NaN;
    const n=(sorted.length-1)*p,lo=Math.floor(n),hi=Math.ceil(n);
    return sorted[lo]+(sorted[hi]-sorted[lo])*(n-lo);
  }
  function makeRng(seed) {
    let a=(Math.floor(seed)>>>0)||0x6d2b79f5;
    return function(){
      a=(a+0x6d2b79f5)>>>0;
      let t=a;
      t=Math.imul(t^(t>>>15),t|1);
      t^=t+Math.imul(t^(t>>>7),t|61);
      return ((t^(t>>>14))>>>0)/4294967296;
    };
  }
  function gaussian(rng) {
    return Math.sqrt(-2*Math.log(Math.max(1e-12,rng())))*Math.cos(2*Math.PI*rng());
  }
  function annualParams(mu,vol,fee) {
    const mean=1+mu/100,sd=vol/100;
    if (!(mean>0)) throw Error('Expected arithmetic return must be > -100%.');
    const variance=Math.log(1+(sd/mean)**2);
    return {drift:(Math.log(mean)-variance/2-Math.log(1+fee/100))/12,
      sigma:Math.sqrt(variance/12)};
  }
  function validate(x) {
    if (!x || typeof x!=='object') throw Error('Параметры отсутствуют.');
    function between(key,min,max){if(!Number.isFinite(x[key])||x[key]<min||x[key]>max)throw Error('Недопустимое значение: '+key);}
    between('monthly',0,1e11);between('initial',0,1e12);between('target',0,1e13);
    between('inflation',-10,40);between('inflVol',0,30);between('fee',0,5);
    between('years',1,30);between('paths',200,10000);between('seed',0,4294967295);
    if(!Number.isInteger(x.years)||!Number.isInteger(x.paths)||!Number.isInteger(x.seed)) throw Error('Нужны целочисленные годы, прогоны и seed.');
    if(!PROFILES.some(p=>p.id===x.selected))throw Error('Неизвестный портфель.');
    if(typeof x.indexContributions!=='boolean')throw Error('Ошибка индексации взносов.');
    if(!Array.isArray(x.customWeights)||x.customWeights.length!==3||x.customWeights.some(w=>!Number.isFinite(w)||w<0||w>1)||Math.abs(x.customWeights.reduce((a,b)=>a+b,0)-1)>1e-8)throw Error('Сумма долей своего портфеля должна составлять 100%.');
    if(!Array.isArray(x.assets)||x.assets.length!==3)throw Error('Нужны параметры трёх классов активов.');
    x.assets.forEach((a,i)=>{if(!a||!Number.isFinite(a.return)||!Number.isFinite(a.vol)||a.return< -50||a.return>50||a.vol<0||a.vol>80)throw Error('Некорректные доходность/риск класса '+i);});
    return x;
  }
  function run(raw) {
    const x=validate(raw), profiles=PROFILES.map(p=>({...p,w:p.w||x.customWeights.slice()}));
    const selected=profiles.findIndex(p=>p.id===x.selected), months=x.years*12, n=x.paths;
    const rng=makeRng(x.seed);
    const pars=x.assets.map(a=>annualParams(a.return,a.vol,x.fee));
    const inf=annualParams(x.inflation,x.inflVol,0);
    // Assets: 0 cash, 1 bonds, 2 equities. Bond/equity correlation = 0.25.
    const bondCorr=.25, bondOrth=Math.sqrt(1-bondCorr*bondCorr);
    const nominal=Array.from({length:months+1},()=>new Float64Array(n));
    const real=Array.from({length:months+1},()=>new Float64Array(n));
    const yearly=profiles.map(()=>Array.from({length:x.years+1},()=>new Float64Array(n)));
    const yearlyNom=profiles.map(()=>Array.from({length:x.years+1},()=>new Float64Array(n)));
    const samples=Array.from({length:Math.min(48,n)},()=>({nominal:[],real:[]}));
    const endings=profiles.map(()=>({nom:new Float64Array(n),real:new Float64Array(n),shortfall:0,loss:0}));
    let selectedBasisReal=0,selectedPaidNom=0;const goal=x.target;
    for (let i=0;i<n;i++) {
      const balances=profiles.map(p=>p.w.map(w=>x.initial*w));
      let inflationFactor=1,basisReal=x.initial,paidNom=x.initial;
      nominal[0][i]=real[0][i]=x.initial;
      profiles.forEach((p,j)=>{yearly[j][0][i]=x.initial;yearlyNom[j][0][i]=x.initial;});
      if(i<samples.length){samples[i].nominal.push(x.initial);samples[i].real.push(x.initial);}
      for(let t=1;t<=months;t++){
        const zStock=gaussian(rng),zBond=gaussian(rng),zCash=gaussian(rng),zInf=gaussian(rng);
        const shocks=[zCash,bondCorr*zStock+bondOrth*zBond,zStock];
        const factors=pars.map((p,j)=>Math.exp(p.drift+p.sigma*shocks[j]));
        inflationFactor*=Math.exp(inf.drift+inf.sigma*zInf);
        const contribution=x.monthly*(x.indexContributions?inflationFactor:1);
        paidNom+=contribution;
        basisReal+=contribution/inflationFactor;
        for(let j=0;j<profiles.length;j++){
          const b=balances[j],w=profiles[j].w;
          for(let k=0;k<3;k++)b[k]=b[k]*factors[k]+contribution*w[k];
          let value=b[0]+b[1]+b[2];
          if(t%12===0)for(let k=0;k<3;k++)b[k]=value*w[k];
          if(j===selected){
            nominal[t][i]=value;real[t][i]=value/inflationFactor;
            if(i<samples.length){samples[i].nominal.push(value);samples[i].real.push(value/inflationFactor);}
          }
          if(t%12===0){yearly[j][t/12][i]=value/inflationFactor;yearlyNom[j][t/12][i]=value;}
          if(t===months){
            const end=endings[j];end.nom[i]=value;end.real[i]=value/inflationFactor;
            if(end.real[i]+1e-8<basisReal)end.loss++;
            if(end.real[i]+1e-8<goal)end.shortfall++;
          }
        }
      }
      if(i===0){selectedBasisReal=basisReal;selectedPaidNom=paidNom;}
    }
    const P=[.05,.10,.25,.50,.75,.90,.95];
    function percentiles(series){
      return series.map(row=>{
        const sorted=Array.from(row).sort((a,b)=>a-b);
        return P.map(q=>quantile(sorted,q));
      });
    }
    const fanNom=percentiles(nominal),fanReal=percentiles(real);
    const comparison=profiles.map((p,j)=>{
      const e=endings[j],r=Array.from(e.real).sort((a,b)=>a-b),z=Array.from(e.nom).sort((a,b)=>a-b);
      return {id:p.id,name:p.name,weights:p.w.map(x=>Math.round(x*100)),
        p10:quantile(r,.10),p50:quantile(r,.50),p90:quantile(r,.90),
        nominalP50:quantile(z,.50),goalProbability:1-e.shortfall/n,
        realLossProbability:e.loss/n};
    });
    const chartCompare=profiles.map((p,j)=>({
      id:p.id,name:p.name,
      real:yearly[j].map(row=>quantile(Array.from(row).sort((a,b)=>a-b),.5)),
      nominal:yearlyNom[j].map(row=>quantile(Array.from(row).sort((a,b)=>a-b),.5))
    }));
    const end=endings[selected],nomSorted=Array.from(end.nom).sort((a,b)=>a-b),realSorted=Array.from(end.real).sort((a,b)=>a-b);
    // For inflation-indexed monthly contributions, real paid equals initial + monthly*months exactly.
    // For fixed nominal contributions it depends on the sampled inflation path;
    // report only a representative nominal amount, not a fabricated fixed real basis.
    const cashFlow={monthly:x.monthly,nominalContributionsFixed:x.initial+x.monthly*months,indexed:x.indexContributions};
    return {
      meta:{paths:n,years:x.years,seed:x.seed,selected:x.selected,quantiles:P,
        nominalVsReal:'Покупательная способность в ценах начала периода, по каждому пути инфляции.',
        assumptions:'Три синтетических класса активов; корреляция облигаций и акций 0.25, инфляция независима. Ежегодная ребалансировка; взносы в конце месяца; lognormal monthly gross returns; комиссии учтены.'},
      selected:{p5:quantile(realSorted,.05),p10:quantile(realSorted,.10),p50:quantile(realSorted,.5),p90:quantile(realSorted,.90),p95:quantile(realSorted,.95),
        nominalP50:quantile(nomSorted,.5),goalProbability:1-end.shortfall/n,realLossProbability:end.loss/n},
      fan:{nominal:fanNom,real:fanReal},
      samples,comparison,chartCompare,cashFlow
    };
  }
  root.SynergyCapitalEngine={PROFILES,validate,run,quantile,makeRng};
  if(typeof module!=='undefined'&&module.exports)module.exports=root.SynergyCapitalEngine;
})(typeof self!=='undefined'?self:globalThis);
