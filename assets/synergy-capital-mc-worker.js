/* SYNERGY Monte Carlo Worker — run calculations off UI thread. */
'use strict';
importScripts('synergy-capital-mc-engine.js');
self.onmessage=function(event){
 const {id,config}=event.data||{};
 try {self.postMessage({id,ok:true,data:self.SynergyCapitalEngine.run(config)});}
 catch(error){self.postMessage({id,ok:false,error:String(error&&error.message||error)});}
};
