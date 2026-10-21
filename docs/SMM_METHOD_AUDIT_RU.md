# SYNERGY SMM — реестр методов и элементов управления

Это честный поимённый аудит фронтенда, не сертификат работоспособности внешних API. В HTML присутствуют **144 формы**, из которых **140** привязаны к именованным методам `data-t`. Проверка нажатий и маршрутизации проводится отдельно браузерными тестами. Реальные авторизованные API-вызовы этим аудитом **не выполняются**.

## Как читать таблицу

- **Метод:** исходный идентификатор операции, сохранён без переименования.
- **Платформа:** предполагаемый адаптер по префиксу метода; необходимо сверить с backend.
- **Поля/кнопки:** количество фактических HTML-элементов.
- **Контроль:** повышенный риск означает, что действие может изменять данные, отправлять сообщения, приглашать людей или затрагивать разрешения. Нужен отдельный серверный контроль.

| № | Платформа | Метод / форма | Полей | Кнопок | Контроль |
|---:|---|---|---:|---:|---|
| 1 | SYNERGY | `loginForm` | 3 | 1 | Стандартный |
| 2 | SYNERGY | `registerForm` | 5 | 1 | Стандартный |
| 3 | SYNERGY | `crosspost_publish` | 18 | 1 | Стандартный |
| 4 | YouTube | `youtube_oauth_url` | 0 | 1 | Стандартный |
| 5 | YouTube | `youtube_competitor_collect` | 2 | 1 | Стандартный |
| 6 | YouTube | `youtube_ai_comment` | 1 | 1 | Стандартный |
| 7 | YouTube | `youtube_comment` | 3 | 1 | Стандартный |
| 8 | YouTube | `youtube_reply` | 3 | 1 | Стандартный |
| 9 | SYNERGY | `hot_lead_vk_scan` | 13 | 2 | Стандартный |
| 10 | SYNERGY | `hot_lead_score` | 10 | 1 | Стандартный |
| 11 | SYNERGY | `hot_lead_ingest` | 9 | 1 | Стандартный |
| 12 | SYNERGY | `hot_lead_list` | 2 | 1 | Стандартный |
| 13 | VK | `vk_lead_autoresponse` | 6 | 1 | Стандартный |
| 14 | VK | `vk_competitor_intel` | 3 | 1 | Стандартный |
| 15 | VK | `vk_sentiment_watch` | 3 | 1 | Стандартный |
| 16 | VK | `vk_audience_churn` | 2 | 1 | Стандартный |
| 17 | VK | `vk_crm_add_lead` | 5 | 1 | Стандартный |
| 18 | VK | `vk_crm_update_lead` | 3 | 1 | Стандартный |
| 19 | VK | `vk_crm_list_leads` | 1 | 1 | Стандартный |
| 20 | VK | `vk_crm_funnel_report` | 0 | 1 | Стандартный |
| 21 | VK | `vk_merge_cross_platform_audience` | 2 | 1 | Стандартный |
| 22 | SYNERGY | `inbox_capture` | 10 | 1 | Стандартный |
| 23 | SYNERGY | `inbox_list` | 2 | 1 | Стандартный |
| 24 | SYNERGY | `inbox_update` | 4 | 1 | Стандартный |
| 25 | SYNERGY | `generate_content` | 4 | 1 | Стандартный |
| 26 | SYNERGY | `ai_autopilot` | 2 | 1 | Стандартный |
| 27 | VK | `vk_content_from_insights` | 9 | 1 | Стандартный |
| 28 | VK | `vk_predict_virality` | 4 | 1 | Стандартный |
| 29 | VK | `vk_content_calendar` | 5 | 1 | Стандартный |
| 30 | VK | `vk_competitor_posts_ai` | 3 | 1 | Стандартный |
| 31 | VK | `vk_viral_search_ai` | 3 | 1 | Стандартный |
| 32 | SYNERGY | `ai_post_improve` | 4 | 1 | Стандартный |
| 33 | SYNERGY | `ai_post_series` | 6 | 1 | Стандартный |
| 34 | VK | `vk_search_groups` | 6 | 2 | Стандартный |
| 35 | VK | `vk_collect_users` | 5 | 2 | Стандартный |
| 36 | VK | `vk_analyze_activity` | 11 | 3 | Стандартный |
| 37 | VK | `vk_audience_intersection` | 9 | 3 | Стандартный |
| 38 | VK | `vk_parse_filter` | 6 | 2 | Стандартный |
| 39 | VK | `vk_birthday_today` | 7 | 3 | Стандартный |
| 40 | VK | `vk_stories_view_like` | 2 | 1 | Стандартный |
| 41 | VK | `vk_stories_bulk` | 2 | 1 | Повышенный |
| 42 | VK | `vk_mailing` | 7 | 1 | Повышенный |
| 43 | VK | `vk_dialog_actions` | 19 | 2 | Стандартный |
| 44 | VK | `vk_base_actions` | 21 | 2 | Стандартный |
| 45 | VK | `vk_chat_search` | 2 | 1 | Стандартный |
| 46 | VK | `vk_chat_create` | 2 | 1 | Стандартный |
| 47 | VK | `vk_chat_invite` | 11 | 1 | Повышенный |
| 48 | VK | `vk_post_wall` | 2 | 1 | Стандартный |
| 49 | VK | `vk_group_info` | 1 | 1 | Стандартный |
| 50 | VK | `vk_group_create` | 3 | 1 | Стандартный |
| 51 | VK | `vk_group_edit` | 7 | 1 | Стандартный |
| 52 | VK | `vk_group_join` | 2 | 1 | Стандартный |
| 53 | VK | `vk_group_leave` | 2 | 1 | Повышенный |
| 54 | VK | `vk_group_invite` | 4 | 1 | Повышенный |
| 55 | VK | `vk_group_get_requests` | 2 | 1 | Стандартный |
| 56 | VK | `vk_group_approve_request` | 2 | 1 | Стандартный |
| 57 | VK | `vk_group_edit_manager` | 4 | 1 | Стандартный |
| 58 | VK | `vk_group_ban` | 4 | 1 | Повышенный |
| 59 | VK | `vk_group_unban` | 2 | 1 | Повышенный |
| 60 | VK | `vk_group_get_banned` | 2 | 1 | Повышенный |
| 61 | VK | `vk_group_remove_user` | 2 | 1 | Повышенный |
| 62 | VK | `vk_group_online` | 2 | 1 | Стандартный |
| 63 | VK | `vk_wall_pin` | 2 | 1 | Стандартный |
| 64 | VK | `vk_wall_unpin` | 2 | 1 | Стандартный |
| 65 | VK | `vk_wall_edit` | 3 | 1 | Стандартный |
| 66 | VK | `vk_wall_delete` | 3 | 1 | Повышенный |
| 67 | VK | `vk_wall_comment` | 4 | 1 | Стандартный |
| 68 | VK | `vk_friends_graph` | 4 | 2 | Стандартный |
| 69 | VK | `vk_newsfeed_search` | 3 | 1 | Стандартный |
| 70 | VK | `vk_leads_search` | 3 | 2 | Стандартный |
| 71 | VK | `vk_search_groups_scored` | 4 | 2 | Стандартный |
| 72 | VK | `vk_post_to_groups` | 5 | 1 | Повышенный |
| 73 | VK | `vk_post_analytics` | 2 | 1 | Стандартный |
| 74 | Telegram | `telegram_parse_groups` | 5 | 2 | Стандартный |
| 75 | Telegram | `telegram_parse_users` | 6 | 2 | Стандартный |
| 76 | Telegram | `telegram_invite` | 6 | 1 | Повышенный |
| 77 | Telegram | `tg_mtproto_send_code` | 1 | 1 | Стандартный |
| 78 | Telegram | `tg_mtproto_sign_in` | 2 | 2 | Стандартный |
| 79 | Telegram | `tg_invite_members` | 13 | 1 | Повышенный |
| 80 | Telegram | `tg_stories_view_like` | 6 | 1 | Стандартный |
| 81 | Telegram | `telegram_mass_message` | 9 | 1 | Повышенный |
| 82 | Telegram | `telegram_post` | 6 | 1 | Стандартный |
| 83 | Telegram | `tg_get_chat` | 1 | 1 | Стандартный |
| 84 | Telegram | `tg_get_member_count` | 1 | 1 | Стандартный |
| 85 | Telegram | `tg_get_admins` | 1 | 1 | Стандартный |
| 86 | Telegram | `tg_get_member` | 2 | 1 | Стандартный |
| 87 | Telegram | `tg_send_message` | 4 | 1 | Повышенный |
| 88 | Telegram | `tg_delete_message` | 3 | 1 | Повышенный |
| 89 | Telegram | `tg_pin_message` | 3 | 1 | Стандартный |
| 90 | Telegram | `tg_unpin_message` | 2 | 1 | Стандартный |
| 91 | Telegram | `tg_unpin_all` | 1 | 1 | Стандартный |
| 92 | Telegram | `tg_set_chat_title` | 2 | 1 | Стандартный |
| 93 | Telegram | `tg_set_chat_description` | 2 | 1 | Стандартный |
| 94 | Telegram | `tg_promote_member` | 12 | 1 | Повышенный |
| 95 | Telegram | `tg_restrict_member` | 8 | 1 | Повышенный |
| 96 | Telegram | `tg_ban_member` | 4 | 1 | Повышенный |
| 97 | Telegram | `tg_unban_member` | 3 | 1 | Повышенный |
| 98 | Telegram | `tg_set_permissions` | 9 | 1 | Повышенный |
| 99 | Telegram | `tg_create_invite` | 5 | 1 | Повышенный |
| 100 | Telegram | `tg_export_invite` | 1 | 1 | Повышенный |
| 101 | Telegram | `tg_revoke_invite` | 2 | 1 | Повышенный |
| 102 | Telegram | `tg_approve_join` | 2 | 1 | Стандартный |
| 103 | Telegram | `tg_decline_join` | 2 | 1 | Стандартный |
| 104 | Telegram | `tg_forward_message` | 4 | 1 | Стандартный |
| 105 | Telegram | `tg_leave_chat` | 2 | 1 | Повышенный |
| 106 | Meta | `ig_get_commenters` | 2 | 2 | Стандартный |
| 107 | Meta | `instagram_hashtag_search` | 1 | 2 | Стандартный |
| 108 | Meta | `ig_business_discovery` | 1 | 1 | Стандартный |
| 109 | Meta | `instagram_insights` | 1 | 1 | Стандартный |
| 110 | Meta | `fb_page_posts` | 3 | 1 | Стандартный |
| 111 | Meta | `fb_get_commenters` | 3 | 2 | Стандартный |
| 112 | Meta | `meta_get_pages` | 0 | 1 | Стандартный |
| 113 | Meta | `ig_set_auto_reply` | 5 | 1 | Стандартный |
| 114 | Meta | `ig_send_dm` | 2 | 1 | Повышенный |
| 115 | Meta | `ig_bulk_optin` | 5 | 1 | Повышенный |
| 116 | Meta | `ig_private_reply` | 4 | 1 | Стандартный |
| 117 | Meta | `fb_bulk_optin` | 6 | 1 | Повышенный |
| 118 | Meta | `ig_get_my_post_comments` | 1 | 1 | Стандартный |
| 119 | Meta | `ig_reply_comment` | 2 | 1 | Стандартный |
| 120 | Meta | `fb_reply_comment` | 3 | 1 | Стандартный |
| 121 | Meta | `fb_post_reactions` | 2 | 1 | Стандартный |
| 122 | Meta | `post_instagram` | 2 | 1 | Стандартный |
| 123 | Meta | `post_facebook` | 4 | 1 | Стандартный |
| 124 | OK | `ok_group_search` | 2 | 2 | Стандартный |
| 125 | OK | `ok_group_members` | 2 | 2 | Стандартный |
| 126 | OK | `ok_users_info` | 2 | 1 | Стандартный |
| 127 | OK | `ok_group_stats` | 1 | 1 | Стандартный |
| 128 | OK | `ok_moments_view` | 4 | 1 | Стандартный |
| 129 | OK | `post_ok` | 2 | 1 | Стандартный |
| 130 | WhatsApp | `wa_set_auto_reply` | 3 | 1 | Стандартный |
| 131 | WhatsApp | `whatsapp_send` | 2 | 1 | Стандартный |
| 132 | WhatsApp | `whatsapp_bulk_send` | 8 | 1 | Повышенный |
| 133 | WhatsApp | `whatsapp_get_templates` | 1 | 1 | Стандартный |
| 134 | WhatsApp | `whatsapp_send_template` | 4 | 1 | Стандартный |
| 135 | SYNERGY | `mailing_set_settings` | 9 | 2 | Повышенный |
| 136 | VK | `vk_check` | 2 | 1 | Стандартный |
| 137 | Telegram | `telegram_check` | 4 | 1 | Стандартный |
| 138 | Meta | `meta_check` | 3 | 1 | Стандартный |
| 139 | OK | `ok_check` | 3 | 1 | Стандартный |
| 140 | WhatsApp | `whatsapp_check` | 3 | 1 | Стандартный |
| 141 | SYNERGY | `manualAccessForm` | 4 | 1 | Стандартный |
| 142 | SYNERGY | `read_file` | 1 | 1 | Стандартный |
| 143 | SYNERGY | `write_file` | 2 | 1 | Стандартный |
| 144 | SYNERGY | `fileForm` | 2 | 2 | Стандартный |

## Выявленные случаи для отдельного тестирования

- `crosspost_publish`: присутствует файловое поле без `name`. Проверить клиентский JavaScript-обработчик загрузки и передачу результата.
- `vk_stories_bulk`: присутствует файловое поле без `name`. Проверить клиентский JavaScript-обработчик загрузки и передачу результата.
- `vk_mailing`: присутствует файловое поле без `name`. Проверить клиентский JavaScript-обработчик загрузки и передачу результата.
- `vk_base_actions`: присутствует файловое поле без `name`. Проверить клиентский JavaScript-обработчик загрузки и передачу результата.
- `vk_chat_invite`: присутствует файловое поле без `name`. Проверить клиентский JavaScript-обработчик загрузки и передачу результата.
- `telegram_invite`: присутствует файловое поле без `name`. Проверить клиентский JavaScript-обработчик загрузки и передачу результата.
- `tg_invite_members`: присутствует файловое поле без `name`. Проверить клиентский JavaScript-обработчик загрузки и передачу результата.
- `telegram_mass_message`: присутствует файловое поле без `name`. Проверить клиентский JavaScript-обработчик загрузки и передачу результата.
- `telegram_post`: присутствует файловое поле без `name`. Проверить клиентский JavaScript-обработчик загрузки и передачу результата.
- `ok_users_info`: присутствует файловое поле без `name`. Проверить клиентский JavaScript-обработчик загрузки и передачу результата.
- `whatsapp_bulk_send`: присутствует файловое поле без `name`. Проверить клиентский JavaScript-обработчик загрузки и передачу результата.

## Что не подтверждается этой таблицей

Успешность серверных вызовов, качество результатов AI, авторизация, реальные публикации, обработка webhooks, права платформ и устойчивость к сбоям. Наличие HTML-кнопки или привязки `data-t` не означает наличия работающей серверной операции.
