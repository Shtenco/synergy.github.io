// P0 security repair: never persist client provider credentials.
// Legacy multi-provider API not implemented; use verified server Gemini Gateway.
(function(){
 const box=document.querySelector('#models');
 if(box)box.innerHTML='<article class="card" style="padding:28px"><h3>Серверное управление моделями</h3><p>Многомодельный провайдерный шлюз пока не подключён. Ввод и хранение API-ключей в браузере отключены.</p><p>Доступный проверяемый путь: защищённый Gemini Gateway, если настроен серверный ключ.</p></article>';
 const status=document.querySelector('#status');if(status)status.textContent='Только серверные подключения. Локальные секреты не сохраняются.';
 const save=document.querySelector('#save');if(save){save.disabled=true;save.title='Отключено до реализации защищённого серверного хранилища провайдеров';}
 const add=document.querySelector('#add');if(add)add.disabled=true;
 sessionStorage.removeItem('olga_settings');
})();
