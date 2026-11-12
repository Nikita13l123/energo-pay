# ЭнергоСбыт — React frontend

Учебный frontend для АС «Личный кабинет для сервиса оплаты» по ТЗ курсовой работы.

## Запуск

Требуется Node.js 20.19+ или 22.12+.

```bash
npm install
cp .env.example .env
npm run dev
```

Откройте http://localhost:5173. В демонстрационном режиме войдите с любым номером лицевого счёта и паролем длиной от 6 символов. Это **не настоящая авторизация**.

## Переключение на backend

В `.env` установите:

```env
VITE_USE_MOCKS=false
VITE_API_BASE_URL=http://localhost:8080/api
```

Перезапустите Vite. Запросы реализованы в `src/api/service.ts`, HTTP-клиент — в `src/api/client.ts`, типы — в `src/types/index.ts`.

### Предварительные контракты API (согласовать с backend)

| Метод | Путь | Данные / результат |
|---|---|---|
| POST | /auth/login | `{accountNumber,password}` → `{accessToken,user}` |
| POST | /auth/register | `{accountNumber,email,password,consent}` → `{accessToken,user}` |
| GET | /accounts/current | `Account` |
| GET | /meters/readings | `Reading[]` |
| POST | /meters/readings | `{value,confirmAnomaly}` → `Reading` |
| GET | /charges | `Charge[]` |
| GET | /payments | `Payment[]` |
| POST | /payments | `{amount}` → `{transactionId,status,paymentUrl?}` |
| GET | /notifications | `Notification[]` |
| GET | /reports/readings?from=...&to=... | файл CSV (в демонстрационном режиме) |

См. интерфейсы в `src/types/index.ts`.

### Ограничения текущей версии

- Данные демонстрационные и не сохраняются после перезагрузки.
- Платёжный шлюз не подключён: frontend только инициирует платёж и может перенаправить на HTTPS URL, полученный от backend. Нельзя считать платёж успешным до подтверждения backend.
- Период 15–25 и проверка аномалии реализованы в UI, но **обязательно должны проверяться на сервере**.
- Блокировка после пяти попыток, права ролей, 152-ФЗ, HTTPS, защита сессии, обработка реальных чеков и квитанций — задачи backend и инфраструктуры; frontend сам по себе не обеспечивает их соблюдение.
- Для production желательно заменить хранение bearer-токена в sessionStorage на согласованную с backend схему защищённой сессии (например, HttpOnly Secure SameSite cookie), настроить CSRF-защиту и CORS.
- Страницы «Квитанции» и «Абоненты» содержат точки интеграции, но пока не реализуют реальные запросы. Административные справочники также потребуют согласованных контрактов.
- Для достижения требования по истории начислений за 12 месяцев backend должен предоставлять полный набор данных (демо содержит 3 месяца).

## Структура

- `src/api` — API и переключатель моков
- `src/context` — авторизация
- `src/types` — TypeScript модели
- `src/data` — демонстрационные данные
- `src/components` — общий каркас и UI-компоненты
- `src/pages` — страницы приложения

## Важное

В `.env` переменные `VITE_*` доступны браузеру: **никогда не храните в них секреты**. Платёжные реквизиты не должны проходить через это приложение; используйте защищённый платёжный шлюз.
