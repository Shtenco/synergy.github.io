/* Node-only deterministic tests; pure calculation, no browser dependencies. */
'use strict';
const assert=require('node:assert/strict');
const E=require('../assets/synergy-capital-mc-engine.js');
const cfg={monthly:1000,initial:5000,target:25000,years:2,paths:300,seed:12345,
 inflation:5,inflVol:2,fee:.7,indexContributions:false,selected:'balanced',
 customWeights:[.1,.4,.5],
 assets:[{return:2,vol:1},{return:4,vol:6},{return:8,vol:18}]};
const a=E.run(cfg),b=E.run(cfg);
assert.equal(a.selected.p50,b.selected.p50,'same seed is reproducible');
assert.equal(a.selected.goalProbability,b.selected.goalProbability);
assert.equal(a.comparison.length,6);
assert.equal(a.fan.nominal.length,25);
assert.equal(a.fan.real.length,25);
assert.equal(a.samples.length,48);
for(const p of a.comparison){assert.ok(p.p10<=p.p50&&p.p50<=p.p90);assert.ok(p.goalProbability>=0&&p.goalProbability<=1);assert.ok(p.realLossProbability>=0&&p.realLossProbability<=1);}
for(let t=0;t<a.fan.nominal.length;t++){let row=a.fan.nominal[t];for(let i=1;i<row.length;i++)assert.ok(row[i]>=row[i-1],'percentiles monotonic');}
const zero=E.run({...cfg,initial:0,monthly:100,fee:0,inflation:0,inflVol:0,assets:[{return:0,vol:0},{return:0,vol:0},{return:0,vol:0}]});
assert.ok(Math.abs(zero.selected.p50-2400)<1e-7,'zero-return contributions');
assert.ok(Math.abs(zero.selected.nominalP50-zero.selected.p50)<1e-7,'no inflation matches real');
const rising=E.run({...cfg,fee:0,inflation:10,inflVol:0,assets:[{return:0,vol:0},{return:0,vol:0},{return:0,vol:0}]});
assert.ok(rising.selected.nominalP50>rising.selected.p50,'inflation reduces purchasing power');
const indexed=E.run({...cfg,fee:0,indexContributions:true,inflation:10,inflVol:0,assets:[{return:0,vol:0},{return:0,vol:0},{return:0,vol:0}]});
assert.ok(indexed.selected.nominalP50>rising.selected.nominalP50,'indexing raises nominal contributions');
assert.ok(indexed.selected.p50>rising.selected.p50,'indexing protects real savings');
assert.throws(()=>E.run({...cfg,customWeights:[.1,.1,.1]}),/100%/);
assert.throws(()=>E.run({...cfg,paths:10001}));
console.log('PASS: reproducibility, six profiles, fan monotonicity, inflation, contribution timing, indexing, bounds');
