/* P0 legacy form gate: any unverified legacy action is non-executable.
 * Do not remove the legacy source or simulate successful provider calls. */
(() => {
  'use strict';
  const msg = 'Эта исходная SMM-операция ещё не перенесена в проверенный Python API. Выполнение заблокировано. Откройте Capability Control для статуса и разрешённых альтернатив.';
  function ready(){
    const banner=document.createElement('section');banner.setAttribute('role','status');banner.setAttribute('aria-live','polite');banner.style.cssText='position:sticky;top:0;z-index:9999;padding:12px 18px;border-bottom:1px solid #00e664;background:#0c2115;color:#e1ffe9;font:13px/1.5 system-ui,sans-serif';
    banner.innerHTML='P0 · Архивный кабинет: <strong>144 исходные формы сохранены, но не признаны рабочими</strong>. '+
      '<a href="/synergy.github.io/smm/p14.html" style="color:#00e664;text-decoration:underline">Проверить контракт операции</a><span id="legacy-action-message" style="display:block"></span>';
    document.body.insertBefore(banner,document.body.firstChild);
    document.addEventListener('submit',(event) => {
      if (!event.target.closest('form')) return;
      if (event.target.dataset.p0Verified === 'true') return;
      event.preventDefault();event.stopImmediatePropagation();
      const feedback=document.getElementById('legacy-action-message');
      if (feedback) feedback.textContent=msg;
    },true);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',ready,{once:true});else ready();
})();
