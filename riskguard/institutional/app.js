const safe = x => String(x ?? '').replace(/[&<>\"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c]));
// SYNERGY: Memory-only bearer; page reload logs out intentionally.
let __rgAccess = '';
const $ = id => document.getElementById(id);
const money = n => new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',maximumFractionDigits:2}).format(Number(n||0));
const access = () => __rgAccess;
const tenantId = () => +(localStorage.getItem('rg_tenant') || 0);
const authHeaders = () => ({'Content-Type':'application/json','Authorization':`Bearer ${access()}`,'X-Tenant-ID':String(tenantId())});

function toast(msg){$('toast').textContent=msg;$('toast').classList.add('on');setTimeout(()=>$('toast').classList.remove('on'),2400)}
async function api(path,opts={}){const r=await fetch(path,{...opts,headers:{...authHeaders(),...(opts.headers||{})}});const d=await r.json().catch(()=>({}));if(!r.ok)throw new Error(typeof d.detail==='string'?d.detail:JSON.stringify(d.detail||d));return d}
function b64uToBytes(s){s=s.replace(/-/g,'+').replace(/_/g,'/');while(s.length%4)s+='=';return Uint8Array.from(atob(s),c=>c.charCodeAt(0))}
function bytesToB64u(buf){const b=String.fromCharCode(...new Uint8Array(buf));return btoa(b).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'')}
function decodeAuthOptions(o){o={...o,challenge:b64uToBytes(o.challenge)};if(o.allowCredentials)o.allowCredentials=o.allowCredentials.map(c=>({...c,id:b64uToBytes(c.id)}));return o}
function decodeRegistrationOptions(o){o={...o,challenge:b64uToBytes(o.challenge),user:{...o.user,id:b64uToBytes(o.user.id)}};if(o.excludeCredentials)o.excludeCredentials=o.excludeCredentials.map(c=>({...c,id:b64uToBytes(c.id)}));return o}
function serializeCredential(c){return {id:c.id,rawId:bytesToB64u(c.rawId),type:c.type,authenticatorAttachment:c.authenticatorAttachment,clientExtensionResults:c.getClientExtensionResults(),response:{clientDataJSON:bytesToB64u(c.response.clientDataJSON),authenticatorData:c.response.authenticatorData?bytesToB64u(c.response.authenticatorData):undefined,signature:c.response.signature?bytesToB64u(c.response.signature):undefined,userHandle:c.response.userHandle?bytesToB64u(c.response.userHandle):null,attestationObject:c.response.attestationObject?bytesToB64u(c.response.attestationObject):undefined,transports:c.response.getTransports?c.response.getTransports():undefined}}}

async function login(){
  try{
    const body={email:$('loginEmail').value,password:$('loginPassword').value};
    const r=await fetch('/api/v1/riskguard/live/api/auth/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
    const d=await r.json(); if(!r.ok)throw new Error(d.detail||'Login failed');
    if(d.mfa_required==='totp'){
      const code=prompt('TOTP code'); if(!code)return;
      const r2=await fetch('/api/v1/riskguard/live/api/auth/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...body,mfa_code:code})});
      const d2=await r2.json(); if(!r2.ok||!d2.access_token)throw new Error(d2.detail||'Invalid TOTP code');
      __rgAccess = (d2.access_token); if(d2.tenants?.length)localStorage.setItem('rg_tenant',d2.tenants[0].id); $('loginScreen').classList.add('hidden'); await bootstrap(d2.tenants); return;
    }
    if(d.mfa_required==='webauthn'){
      if(!window.PublicKeyCredential)throw new Error('WebAuthn is not supported by this browser');
      const cred=await navigator.credentials.get({publicKey:decodeAuthOptions(d.options)});
      const r2=await fetch('/api/v1/riskguard/live/api/auth/webauthn/authenticate/verify',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:body.email,challenge_id:d.challenge_id,credential:serializeCredential(cred)})});
      const d2=await r2.json(); if(!r2.ok)throw new Error(d2.detail||'Passkey verification failed');
      __rgAccess = (d2.access_token); if(d2.tenants?.length)localStorage.setItem('rg_tenant',d2.tenants[0].id); $('loginScreen').classList.add('hidden'); await bootstrap(d2.tenants); return;
    }
    __rgAccess = (d.access_token);
    if(d.tenants?.length)localStorage.setItem('rg_tenant',d.tenants[0].id);
    $('loginScreen').classList.add('hidden'); await bootstrap(d.tenants);
  }catch(e){toast(e.message)}
}
$('loginBtn').onclick=login;
$('loginPassword').addEventListener('keydown',e=>{if(e.key==='Enter')login()});
$('logoutBtn').onclick=()=>{(__rgAccess = '');localStorage.removeItem('rg_tenant');location.reload()};

async function bootstrap(prefetchedTenants=null){
  const me=prefetchedTenants?{tenants:prefetchedTenants}:await api('/api/v1/riskguard/live/api/me');
  const tenants=me.tenants||[];
  if(!tenants.length)throw new Error('No tenant membership');
  let selected=tenantId(); if(!tenants.some(t=>t.id===selected)){selected=tenants[0].id;localStorage.setItem('rg_tenant',selected)}
  $('tenantSelect').innerHTML=tenants.map(t=>`<option value="${t.id}" ${t.id===selected?'selected':''}>${t.name} · ${t.role}</option>`).join('');
  $('tenantSelect').onchange=()=>{localStorage.setItem('rg_tenant',$('tenantSelect').value);loadAll()};
  await loadAll();
}

async function loadHealth(){const h=await fetch('/api/v1/riskguard/live/api/health').then(r=>r.json());$('liveBadge').textContent=h.execution_enabled?'ENABLED · UNVERIFIED':'SHADOW · NO EXECUTION';$('liveBadge').style.color=h.execution_enabled?'var(--red)':'var(--amber)';const q=h.risk_quorum||{};const b=h.event_bus||{};const sec=h.secrets||{};$('haStatus').innerHTML=[['Quorum',q.enabled?`${q.mode} · ${q.nodes} nodes`:'disabled'],['Event bus',b.ok?'UP':'DOWN'],['Secrets',sec.backend||'—'],['WS worker',h.ws_state_engine_enabled?'gateway':'separate']].map(([k,v])=>`<div class="mini"><b>${v}</b><span>${k}</span></div>`).join('')}
async function loadSummary(){try{const s=await api('/api/v1/riskguard/live/api/tenant/summary');$('tenantSummary').innerHTML=Object.entries(s).map(([k,v])=>`<div class="mini"><b>${typeof v==='boolean'?(v?'YES':'NO'):v}</b><span>${k.replaceAll('_',' ')}</span></div>`).join('')}catch(e){}}
async function loadMembers(){try{const xs=await api('/api/v1/riskguard/live/api/tenant/members');$('members').innerHTML=xs.map(x=>`<div class="compact-item"><b>${safe(x.email)}</b><small>${safe(x.role)}${x.active?'':' · disabled'}</small></div>`).join('')||'<p class="hint">No members.</p>'}catch(e){$('members').innerHTML=`<p class="hint">${e.message}</p>`}}
$('memberForm').onsubmit=async e=>{e.preventDefault();try{await api('/api/v1/riskguard/live/api/tenant/members',{method:'POST',body:JSON.stringify({email:$('memberEmail').value,password:$('memberPassword').value,role:$('memberRole').value})});e.target.reset();await loadMembers();toast('Member saved')}catch(x){toast(x.message)}};

async function loadRules(){try{const r=await api('/api/v1/riskguard/live/api/v21/rules');Object.entries(r).forEach(([k,v])=>{const el=$(k);if(el)el.value=v})}catch(e){toast(e.message)}}
$('saveRules').onclick=async()=>{const keys=['max_daily_loss_pct','max_weekly_loss_pct','max_drawdown_pct','max_gross_exposure_x','max_positions','max_single_position_pct','max_var95_pct','max_cvar95_pct','max_same_direction_corr','max_stress_loss_pct','min_exchange_margin_ratio','max_exchange_mm_rate'];const b={};keys.forEach(k=>b[k]=+$(k).value);Object.assign(b,{stale_data_seconds:15,warning_ratio:.8,close_on_critical_breach:true});try{await api('/api/v1/riskguard/live/api/v21/rules',{method:'PUT',body:JSON.stringify(b)});toast('Institutional policy saved')}catch(e){toast(e.message)}};

async function loadConnections(){try{const xs=await api('/api/v1/riskguard/live/api/v21/connections');$('connections').innerHTML=xs.length?xs.map(x=>`<div class="compact-item"><b>${x.exchange.toUpperCase()} · ${safe(x.label)}</b><small>${safe(x.api_key_masked)} · ${x.enabled?'enabled':'disabled'} <button onclick="testConn(${x.id})">Test</button></small></div>`).join(''):'<p class="hint">No exchange connections.</p>';$('m_connection').innerHTML=xs.map(x=>`<option value="${x.id}">${x.id} · ${x.exchange.toUpperCase()} · ${safe(x.label)}</option>`).join('')}catch(e){$('connections').innerHTML=`<p class="hint">${e.message}</p>`}}
window.testConn=async id=>{try{const r=await api(`/api/v21/connections/${id}/test`,{method:'POST'});toast(`${r.exchange}: connection OK`)}catch(e){toast(e.message)}};
$('connectionForm').onsubmit=async e=>{e.preventDefault();const body={exchange:$('exchange').value,label:$('label').value,api_key:$('api_key').value,api_secret:$('api_secret').value};if($('api_passphrase').value)body.api_passphrase=$('api_passphrase').value;try{await api('/api/v1/riskguard/live/api/v21/connections',{method:'POST',body:JSON.stringify(body)});e.target.reset();await loadConnections();toast('Encrypted exchange credential stored')}catch(x){toast(x.message)}};

async function loadStrategies(){try{const xs=await api('/api/v1/riskguard/live/api/v21/strategies');$('strategies').innerHTML=xs.length?xs.map(x=>`<div class="compact-item"><b>${safe(x.name)}</b><small>#${x.id} · $${x.max_order_notional_usd}/order · $${x.max_daily_notional_usd}/day · ${x.max_orders_per_day}/day</small></div>`).join(''):'<p class="hint">No strategy credentials.</p>'}catch(e){}}
$('strategyForm').onsubmit=async e=>{e.preventDefault();const b={name:$('s_name').value,max_order_notional_usd:+$('s_order').value,max_daily_notional_usd:+$('s_daily').value,max_orders_per_day:+$('s_orders').value};try{const r=await api('/api/v1/riskguard/live/api/v21/strategies',{method:'POST',body:JSON.stringify(b)});$('newSecret').textContent=`SAVE NOW — shown once\n\nX-RiskGuard-Key:\n${r.api_key}\n\nTradingView secret:\n${r.webhook_secret}\n\nBot endpoint: /v22/execute\nTradingView: /v22/webhooks/tradingview/${r.id}`;await loadStrategies();toast('Strategy credentials created')}catch(x){toast(x.message)}};

$('manualForm').onsubmit=async e=>{e.preventDefault();const b={connection_id:+$('m_connection').value,symbol:$('m_symbol').value,side:$('m_side').value,order_type:$('m_type').value,notional_usd:+$('m_notional').value,reduce_only:$('m_reduce').checked};if(b.order_type==='LIMIT')b.price=+$('m_price').value;const idem='manual'+Date.now()+Math.random().toString(36).slice(2,9);try{const r=await api('/api/v1/riskguard/live/api/v22/manual/execute',{method:'POST',headers:{'Idempotency-Key':idem},body:JSON.stringify(b)});$('manualResult').textContent=JSON.stringify(r,null,2);toast(r.status);await loadExecutions()}catch(x){$('manualResult').textContent=x.message;toast(x.message)}};

async function loadRisk(){try{const s=await api('/api/v1/riskguard/live/api/v21/snapshot');const eq=Number(s.equity||0);const gross=Number(s.gross_exposure||0);$('riskState').textContent=s.demo?'DEMO':'INCOMPLETE';$('riskState').style.color='var(--amber)';$('riskReason').textContent=s.demo?'Synthetic empty demo snapshot':'Read-only snapshot · cannot verify full VaR/policy state';$('equity').textContent=money(eq);$('var95').textContent='N/A';$('cvar95').textContent='CVaR N/A · no verified market history';$('stressLoss').textContent='N/A';$('stressScenario').textContent='Run stress explicitly';$('marginRatio').textContent='N/A';$('exposure').textContent=money(gross);$('exposureX').textContent=eq>0?`${(gross/eq).toFixed(2)}× equity`:'N/A';}catch(e){$('riskState').textContent='NOT CONNECTED';$('riskReason').textContent=e.message}}

async function loadExecutions(){try{const xs=await api('/api/v1/riskguard/live/api/v21/executions?limit=40');$('executions').innerHTML=xs.length?xs.map(x=>`<div class="event"><b>${safe(x.status)} · ${x.exchange.toUpperCase()} · ${safe(x.symbol)}</b><p>${x.side} ${x.order_type} · ${money(x.requested_notional)} · ${safe(x.source)}${x.external_order_id?' · #'+x.external_order_id:''}</p><time>${new Date(x.ts).toLocaleString()}</time></div>`).join(''):'<p class="hint">No trade intents yet.</p>'}catch(e){}}
async function loadEvents(){try{const xs=await api('/api/v1/riskguard/live/api/v21/events?limit=40');$('events').innerHTML=xs.length?xs.map(x=>`<div class="event"><b>${safe(x.severity)} · ${safe(x.source)}</b><p>${safe(x.message)}</p><time>${new Date(x.ts).toLocaleString()}</time></div>`).join(''):'<p class="hint">No events.</p>'}catch(e){}}

async function loadAlerts(){try{const xs=await api('/api/v1/riskguard/live/api/v21/alerts');$('alerts').innerHTML=xs.length?xs.map(x=>`<div class="compact-item"><b>${x.kind.toUpperCase()} · ${safe(x.label)}</b><small>${x.enabled?'enabled':'disabled'}</small></div>`).join(''):'<p class="hint">No tenant alert endpoints.</p>'}catch(e){$('alerts').innerHTML=`<p class="hint">${e.message}</p>`}}
$('alertForm').onsubmit=async e=>{e.preventDefault();const b={kind:$('alertKind').value,label:$('alertLabel').value,target:$('alertTarget').value,enabled:true};if($('alertSecret').value)b.secret=$('alertSecret').value;try{await api('/api/v1/riskguard/live/api/v21/alerts',{method:'POST',body:JSON.stringify(b)});e.target.reset();await loadAlerts();toast('Alert endpoint encrypted & saved')}catch(x){toast(x.message)}};
$('testAlert').onclick=async()=>{try{await api('/api/v1/riskguard/live/api/v21/alerts/test',{method:'POST'});toast('Test alert sent')}catch(e){toast(e.message)}};
$('runStress').onclick=async()=>{try{const r=await api('/api/v1/riskguard/live/api/v21/stress',{method:'POST',body:JSON.stringify({shocks_pct:[-2,-5,-10,-20],concentration_shock_pct:-25,correlation_break:.85})});$('stressResult').textContent=JSON.stringify(r,null,2)}catch(e){$('stressResult').textContent=e.message}};

$('killBtn').onclick=async()=>{if(!confirm('Activate tenant KILL SWITCH? New risk-increasing orders will be blocked; live emergency actions run only when enabled.'))return;try{await api('/api/v1/riskguard/live/api/v21/kill-switch',{method:'POST',body:JSON.stringify({reason:'Manual institutional dashboard kill switch'})});toast('KILL SWITCH ACTIVE');await loadRisk()}catch(e){toast(e.message)}};

async function loadTraderBooks(){try{const xs=await api('/api/v1/riskguard/live/api/v22/traders/risk-books');$('traderBooks').innerHTML=xs.length?xs.map(x=>`<div class="compact-item"><b>${safe(x.email)}</b><small>${x.quarantined?'QUARANTINED · ':''}$${x.max_order_notional_usd}/order · $${x.max_daily_notional_usd}/day · denial streak ${x.denial_streak}</small></div>`).join(''):'<p class="hint">Risk books are created when traders begin trading.</p>'}catch(e){$('traderBooks').innerHTML=`<p class="hint">${e.message}</p>`}}


async function loadMfaStatus(){
  try{
    const s=await api('/api/v1/riskguard/live/api/auth/mfa/status');
    $('mfaStatus').innerHTML=[
      ['TOTP',s.totp_enabled?'ENABLED':'OFF'],
      ['Passkeys',`${s.credential_count||0}`],
      ['WebAuthn',s.webauthn_available?'AVAILABLE':'UNAVAILABLE']
    ].map(([k,v])=>`<div class="mini"><b>${v}</b><span>${k}</span></div>`).join('');
  }catch(e){
    $('mfaResult').textContent=e.message;
  }
}

$('setupTotp').onclick=async()=>{
  try{
    const setup=await api('/api/v1/riskguard/live/api/auth/mfa/totp/setup',{method:'POST'});
    $('mfaResult').textContent=`Add this secret to your authenticator app:\n\n${setup.secret}\n\nProvisioning URI:\n${setup.provisioning_uri}`;
    const code=prompt('Enter the current 6-digit TOTP code to confirm');
    if(!code)return;
    const confirmed=await api('/api/v1/riskguard/live/api/auth/mfa/totp/confirm',{method:'POST',body:JSON.stringify({code})});
    if(confirmed.access_token)__rgAccess = (confirmed.access_token);
    toast('TOTP enabled');
    await loadMfaStatus();
  }catch(e){toast(e.message);$('mfaResult').textContent=e.message}
};

$('registerPasskey').onclick=async()=>{
  try{
    if(!window.PublicKeyCredential)throw new Error('WebAuthn/passkeys are not supported by this browser');
    const start=await api('/api/v1/riskguard/live/api/auth/webauthn/register/options',{method:'POST'});
    const credential=await navigator.credentials.create({publicKey:decodeRegistrationOptions(start.options)});
    const verified=await api('/api/v1/riskguard/live/api/auth/webauthn/register/verify',{
      method:'POST',
      body:JSON.stringify({
        challenge_id:start.challenge_id,
        credential:serializeCredential(credential)
      })
    });
    if(verified.access_token)__rgAccess = (verified.access_token);
    $('mfaResult').textContent=`Passkey registered.\nCredential: ${verified.credential_id||'stored'}`;
    toast('Passkey registered');
    await loadMfaStatus();
  }catch(e){toast(e.message);$('mfaResult').textContent=e.message}
};

async function loadAll(){await loadHealth();await Promise.allSettled([loadSummary(),loadMembers(),loadRules(),loadConnections(),loadStrategies(),loadRisk(),loadExecutions(),loadEvents(),loadAlerts(),loadTraderBooks(),loadMfaStatus()])}

(async()=>{if(!access())return;try{$('loginScreen').classList.add('hidden');await bootstrap()}catch(e){(__rgAccess = '');$('loginScreen').classList.remove('hidden');toast(e.message)}})();
setInterval(()=>{if(access()){loadRisk();loadExecutions();loadEvents()}},10000);

// Read-only institutional portal. Writes/trading never route through this gateway.
for(const id of ['saveRules','killBtn','setupTotp','registerPasskey','testAlert']){const el=$(id);if(el){el.disabled=true;el.title='Read-only portal: configure separately in audited V2.2 service';el.style.opacity='.45'}}
for(const id of ['memberForm','connectionForm','strategyForm','manualForm','alertForm']){const el=$(id);if(el){for(const ctl of el.querySelectorAll('input,button,select'))ctl.disabled=true;el.title='Read-only portal; RiskGuard mutations are blocked'}}
