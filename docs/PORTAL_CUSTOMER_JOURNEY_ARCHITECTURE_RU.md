# SYNERGY — Portal & Customer Journey Architecture v1.0

Дата: 2026-10-22. Релиз первого этапа: 7 лендингов решений, сохранение всех старых рабочих кабинетов.

## 1. Продуктовая навигация

Публичная главная (`/index.html`) — бренд, сегменты, экономическая идея, первичные CTA.
Центр решений (`/solutions/`) — подбор сценария и сравнение направлений.
Страница решения (`/solutions/{slug}/`) — **боль → исходная ситуация → продукт → учебная демонстрация → возражения → кросс-цепочка → рабочий кабинет**.
Product Atlas (`/portal/`) — технический справочник всех 25 направлений, фильтры и поиск.
Кабинет (`/{product}/`, исторически другие пути) — фактический продуктовый интерфейс, настройки, реальные/локальные возможности и их статус.
Серверная часть (отдельные сервисы) — только после аутентификации, авторизации, проверенных адаптеров и аудита.

Первые семь посадочных страниц: `smm`, `avito`, `workspace`, `cfo`, `riskguard`, `investor-folio`, `meta-api`.

## 2. Два входа и никакого сломанного legacy

* Новый посетитель: реклама/органика → главная или конкретный SEO-лендинг → демо → FAQ → кабинет.
* Опытный пользователь: bookmark/Atlas → кабинет напрямую. Принудительных редиректов из рабочих кабинетов на лендинги нет.
* Глубокие ссылки на конкретные функции и конфигурации остаются пригодными. Лендинги не подменяют backend.

## 3. Все 25 направлений Product Atlas

### Маркетинг (10)
AI SMM Studio; AI Lead Radar; CaseFlow CRM Legacy; CaseFlow Team; Audience Lab; Parsing Lab; Engagement Desk; Python Workers; SMM Hub; SMM Pro Legacy.

### Финансы (5)
Institutional RiskGuard; Investor Folio; Broker Mesh; Investor Center; AI CFO.

### AI и бизнес (6)
AI Olga; AI Video; AI Advert; AI Market; Business Operating System; AI AVITO.

### Инфраструктура (4)
NEXUS Control Plane; AI Archiver; AI META-API-MCP; AI Workspace.

Каждый новый модуль получает карточку реестра + отдельный capability-профиль + лендинг при наличии обоснованного JTBD. Часть направлений — технические кабинеты без отдельного публичного оффера.

## 4. Карта состояния пользователя

anonymous → exploring → solution_view → demo_seen → constraints_read → cabinet_open.
После реального подключения: authorized → workspace_created → first_valid_task → first_verified_result → eligible_for_next_solution → retained.

Текущая статическая версия реализует только публичные маршруты и переходы. **Она не реализует CRM, хранение лидов, регистрацию, подписки или оплату.**

## 5. Воронки по сегментам

| Сегмент | Триггер | Страница | Первое действие | Следующая потребность |
|---|---|---|---|---|
| Эксперт/фрилансер | Нехватка времени на контент | SMM | Открыть Workspaces | Лиды → Avito/CRM; задачи → Workspace |
| ИП/продавец услуг | Теряются обращения | Avito | Выбрать сценарий | Задачи → Workspace; деньги → CFO |
| Агентство/команда | Всё разрознено | Workspace | Пройти контролируемый рабочий маршрут | API → META; деньги → CFO |
| Компания | Выручка не равна свободным средствам | CFO | Посмотреть пример CSV и проверку | RiskGuard → Investor Folio |
| Трейдер | Неясны лимиты и worst case | RiskGuard | Проверить риски на локальных вводных | Folio |
| Инвестор | Нет дисциплины аллокации | Investor Folio | Создать модель/портфель | RiskGuard/CFO |
| Техлид | Безопасность интеграций | META API | Изучить контракт | Workspace |

## 6. Ассоциативный граф

SMM → AVITO, Workspace, CFO.
AVITO → Workspace, SMM, CFO.
Workspace → Avito, CFO, META-API.
META-API → Workspace, CFO, Avito.
CFO → Workspace, RiskGuard, Investor Folio.
RiskGuard → Investor Folio, CFO, Workspace.
Investor Folio → RiskGuard, CFO, Workspace.

Смысл cross-sell: не допродажа из-за посещения, а задача, возникающая после предыдущей: создан контент → пришёл запрос → появилась работа → возник денежный результат → резерв → риск → портфель.

## 7. Конверсия и метрики

**Текущий клиентский путь в GitHub Pages:** page_view → solution_view → demo_visible → FAQ_open → cabinet_click → related_solution_click.

Предлагаемая клиентская серверная аналитика (не притворяться уже работающей):
`event_id`, `occurred_at`, `anonymous_session_id` (короткий срок жизни), `source`, `campaign`, `persona`, `product_id`, `event_name`, `consent_version`. Запрещено отправлять содержание сообщений клиентов, выписки, ключи, токены, чужие персональные данные.

Предлагаемая атрибуция: source / medium / campaign / landing product → активность → продуктовый результат. Не использовать user-level fingerprinting. Для серьёзного сбора аналитики добавить согласие, retention policy, контроль доступа и backend события.

## 8. Архитектура backend (целевое состояние)

Frontend GitHub Pages: маркетинг и безопасные публичные демонстрации.
Identity provider: OIDC, MFA, RBAC, tenant separation.
Gateway/API: серверные проверки JWT, rate limit, audit, idempotency.
Workspace: tasks, approvals, connectors, provenance.
META API: registry/capabilities/policies, fail-closed execution.
Financial control: подтверждение человеком → книга операций → дельта → резерв → сценарии.
RiskGuard / Folio: read-only аналитика, исследования; любое торговое исполнение вынесено в отдельный проверяемый канал.
Billing & CRM: только при фактическом развёртывании, утверждении тарифов, privacy policy и обработке персональных данных.

## 9. Что должно быть сделано до настоящего запуска продаж

P0: проверить опубликованные маршруты на 320/390/768/1440 px; ссылки и доступность.
P0: реальные product demos (правдивые снимки доступных функций), отсутствие фальшивых метрик.
P0: подтверждённые условия и способ запроса доступа; пока их нет, только «Открыть кабинет».
P1: onboarding из кабинета → первое полезное действие, permission checks и защита данных.
P1: first-party аналитика после правового/технического согласования.
P1: expand SEO-landings по спросу и подтверждённым продуктам, не механическое создание 25 идентичных лендингов.
P2: experimentation, cohorts, retention, cross-sell recommendation rules from consented aggregate events.

## 10. Definition of done

Для продукта: hero с контекстом, проблемой, job story; честная демонстрация; FAQ с четырьмя реальными возражениями; статус; CTA открывает подтверждённый путь; 3 контекстные cross-sell карточки; mobile accessibility; не выдаёт макет за работающий API.
Для портала: 25 каталогизированных маршрутов, сохранение legacy URLs, SEO-линки к ключевым продающим страницам, отсутствие платежей/заявок без живого backend.
