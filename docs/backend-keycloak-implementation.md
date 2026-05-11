# Backend и Keycloak: как устроен код в этом проекте

Документ описывает **только то, что реально есть в репозитории** (папка `apps/server`). Без общей лекции по OAuth: только файлы, функции и порядок вызовов.

Если чего-то в коде нет (например, NextAuth на фронте) — это **написано отдельно**, чтобы не путаться.

---

## 1. Общая структура backend

### Где что живёт

| Что | Файл | Зачем |
|-----|------|--------|
| Точка входа, запуск HTTP | `apps/server/src/server.ts` | Создаёт приложение, вешает `listen` на порт |
| Сборка Express-приложения | `apps/server/src/app.ts` | CORS, JSON, логер, регистрация роутов |
| Подключение роутов | `apps/server/src/routes/index.ts` | Функция `registerRoutes(app)` |
| Роуты API | `apps/server/src/routes/customer.route.ts`, `apps/server/src/routes/updateAccount.route.ts` | `GET /customer`, `POST /update-account` |
| Middleware проверки JWT | `apps/server/src/middlewares/requireBearerToken.middleware.ts` | Обязательный Bearer-токен для защищённых путей |
| Логирование запросов | `apps/server/src/middleware/logger.middleware.ts` | Пишет метод, URL, статус, тело для POST и т.д. |
| Переменные окружения Keycloak | `apps/server/src/keycloak/env.ts` | Читает `process.env.*`, строит issuer, JWKS URL, креды админ-клиента |

### Как запускается backend

1. Запускается скрипт из `apps/server/package.json`: `dev` → `ts-node-dev ... src/server.ts`.
2. `server.ts` вызывает `createApp()` из `app.ts` и затем `app.listen(PORT, ...)`.
3. Порт: `Number(process.env.PORT) || 3001` (см. `server.ts`).

**Замечание:** в консоли печатается строка про `API v1` и путь `/api/v1`, но **сами роуты в коде смонтированы без префикса** — реальные пути это `/customer` и `/update-account`, плюс `/health` в `app.ts`. Это просто несовпадение текста лога и кода, не ошибка в работе API.

### Простая схема

```
Клиент (браузер / curl)
    -> HTTP запрос на Express (порт 3001)
        -> cors + express.json()
        -> loggerMiddleware (лог в консоль)
        -> Router (customer или updateAccount)
            -> requireBearerToken (middleware)
                -> verifyKeycloakAccessToken (jose + JWKS)
            -> обработчик роута (читает payload, дергает Keycloak Admin или отдаёт stub)
        -> HTTP ответ
```

---

## 2. Какие файлы участвуют в интеграции с Keycloak

Ниже — **все файлы**, которые по смыслу связаны с Keycloak или JWT в этом сервере.

### `apps/server/src/keycloak/env.ts`

- **Зачем:** одно место, где читаются `KEYCLOAK_*` из окружения. Чтобы не размазывать `process.env` по проекту.
- **Кто вызывает:** `verifyAccessToken.ts`, `setUserCustomerId.ts`.
- **Что делает:**  
  - `getKeycloakPublicConfig()` — `KEYCLOAK_BASE_URL`, `KEYCLOAK_REALM` (обязательны для проверки токена).  
  - `getKeycloakIssuer()` — строка вида `{baseUrl}/realms/{realm}` — как в поле `iss` внутри JWT.  
  - `getKeycloakJwksUri()` — URL набора публичных ключей для проверки подписи.  
  - `getKeycloakAdminRealm()` — realm для **логина админ-клиента** (по умолчанию тот же, что и у пользователей).  
  - `getKeycloakAdminClientCredentials()` — `KEYCLOAK_ADMIN_CLIENT_ID` / `SECRET` (нужны только для `POST /update-account`).  
  - `getOptionalJwtAudience()` — если задали `KEYCLOAK_JWT_AUDIENCE`, проверка токена потребует совпадение `aud`.

В начале файла есть **комментарий-чеклист** для настройки Keycloak (realm, confidential client, mapper) — это подсказка разработчику, не исполняемый код.

### `apps/server/src/keycloak/verifyAccessToken.ts`

- **Зачем:** проверить, что access token **действительно выдал Keycloak**, не подделан и не просрочен (и при необходимости совпал audience).
- **Кто вызывает:** `requireBearerToken.middleware.ts`.
- **Библиотека:** `jose` (`jwtVerify`, `createRemoteJWKSet`).
- **Важное:** JWKS-клиент кэшируется в переменной модуля `jwks`, чтобы не создавать заново на каждый запрос.

### `apps/server/src/keycloak/setUserCustomerId.ts`

- **Зачем:** записать в Keycloak у пользователя атрибут `customer_id` через **Admin API** (не руками в БД).
- **Кто вызывает:** `updateAccount.route.ts` после `generateCustomerId()`.
- **Библиотека:** `@keycloak/keycloak-admin-client` (класс по умолчанию импортируется как `KcAdminClient`).

### `apps/server/src/middlewares/requireBearerToken.middleware.ts`

- **Зачем:** единый «шлагбаум»: нет валидного Bearer JWT — до обработчика роута не пускаем.
- **Кто вызывает:** Express автоматически, потому что указан вторым/третьим аргументом в цепочке: `router.get('/customer', requireBearerToken, handler)`.

### `apps/server/src/utils/jwtClaims.ts`

- **Зачем:** достать из **уже проверенного** payload поле `customer_id` (строка или массив строк — как иногда отдаёт Keycloak).
- **Кто вызывает:** `customer.route.ts`.

### `apps/server/src/utils/randomCustomerId.ts`

- **Зачем:** сгенерировать строку `cust_...` как будто её вернул внешний CRM. **К Keycloak напрямую не относится** — это учебная симуляция.

### `apps/server/src/routes/customer.route.ts` и `updateAccount.route.ts`

- **Зачем:** HTTP-слой: статусы, JSON, вызов утилит и Keycloak.

### `apps/server/src/types/express.d.ts`

- **Зачем:** расширить тип `Request`, чтобы был `req.accessTokenPayload` после middleware.

### `apps/server/src/stubs/customer.stub.ts`

- **Зачем:** **заглушка данных клиента** — не из БД и не из Keycloak. Пока в токене есть `customer_id`, API возвращает фиктивный профиль.

**Явно:** полноценного «реального» профиля клиента в проекте нет — только stub.

---

## 3. Как работает `GET /customer`

Путь в коде: `customerRouter.get('/customer', requireBearerToken, ...)`.

### Пошагово

1. **Клиент** шлёт `GET http://localhost:3001/customer` с заголовком `Authorization: Bearer <jwt>`.
2. Запрос попадает в Express-приложение из `createApp()` (`app.ts`): сначала CORS, `express.json()`, `loggerMiddleware`.
3. Подходит роутер из `customer.route.ts`; перед обработчиком Express вызывает **`requireBearerToken`**.
4. В middleware читается `req.headers.authorization`.
5. Проверяется префикс `Bearer `; из строки вырезается сам токен (`header.slice('Bearer '.length).trim()`).
6. Вызывается `verifyKeycloakAccessToken(token)` — см. раздел 5.
7. Если всё ок, в `req.accessTokenPayload` кладётся payload; вызывается `next()`.
8. В обработчике вызывается `getCustomerIdFromPayload(req.accessTokenPayload)`.
9. Если `customer_id` нет — ответ **403** с JSON-объяснением (см. ниже).
10. Если есть — `res.json(getStubCustomer(customerId))` — **всегда один и тот же** `displayName` / `tier`, меняется только `id` на ваш `customer_id`.

### Зачем доверять `customer_id` только после verify

Потому что до `jwtVerify` любой мог прислать JSON в виде JWT и написать там `customer_id: "чужой"`.  
**После** `jwtVerify` мы знаем: токен подписан ключом Keycloak, `iss` совпал, срок не вышел (и `aud`, если включили). Значит поля внутри — те, что Keycloak (и mapper) положил в этот выпуск токена.

### Почему backend не ходит в Keycloak на каждый запрос

Проверка — это математика по **публичным ключам** (JWKS) и полям внутри JWT. Отдельный запрос «Keycloak, этот токен ок?» для стандартного access token **в этом проекте не делается** — достаточно JWKS + `iss` (+ опционально `aud`).

### Почему `customer_id` читают из токена, а не из БД сервера

В учебном сценарии «истина» о том, какой внешний `customer_id` привязан к пользователю, хранится в Keycloak как **user attribute**, а во фронт/бэк попадает уже как **claim в access token** (после mapper + refresh). Backend ленивый: не хранит свою таблицу пользователей, а доверяет claim после криптопроверки.

### ASCII flow

```
Client
  -> GET /customer
      -> requireBearerToken
          -> Authorization: Bearer ...
          -> verifyKeycloakAccessToken (JWKS + iss [+ aud])
          -> req.accessTokenPayload = payload
      -> route handler
          -> getCustomerIdFromPayload
          -> нет customer_id? -> 403
          -> есть? -> getStubCustomer(customerId) -> 200 JSON
```

### Кусок реального кода (403 vs 200)

Файл `apps/server/src/routes/customer.route.ts`:

```14:27:apps/server/src/routes/customer.route.ts
customerRouter.get('/customer', requireBearerToken, (req, res) => {
    const customerId = getCustomerIdFromPayload(req.accessTokenPayload);

    if (!customerId) {
        res.status(403).json({
            error: 'Forbidden',
            message:
                'Access token is missing customer_id. Call POST /update-account, refresh the token, then retry.',
        });
        return;
    }

    res.json(getStubCustomer(customerId));
});
```

---

## 4. Как работает `POST /update-account`

Путь: `updateAccountRouter.post('/update-account', requireBearerToken, async ...)`.

### Пошагово

1. Запрос приходит так же через `createApp()` → тот же `requireBearerToken` → в `req.accessTokenPayload` попадает **пользовательский** access token (проверенный).
2. **Кто текущий пользователь:** по стандарту OIDC в payload есть **`sub`** — стабильный id пользователя в Keycloak (в этом проекте его и используют как Keycloak user id).
3. Код берёт `req.accessTokenPayload?.sub`. Если нет — **401**.
4. `generateCustomerId()` создаёт новую строку `cust_...`.
5. `await setKeycloakUserCustomerId(sub, customerId)` — здесь поднимается **Keycloak Admin Client**, логин service account, поиск пользователя, `update` атрибутов (подробно в разделе 6).
6. Успех → **200** и тело `{ "customerId": "<сгенерированное>" }`.
7. Ошибка в `catch` → **502** с текстом из `Error` (сообщение Keycloak/сети попадёт в `details`).

### ASCII flow

```
Client
  -> POST /update-account + Bearer user token
      -> requireBearerToken -> verified payload
      -> handler: sub из payload
      -> generateCustomerId()
      -> setKeycloakUserCustomerId(sub, customerId)
          -> Admin Client: client_credentials
          -> find user by id
          -> users.update(... attributes ...)
      -> 200 { customerId }
```

### Кусок реального кода

Файл `apps/server/src/routes/updateAccount.route.ts`:

```12:30:apps/server/src/routes/updateAccount.route.ts
updateAccountRouter.post('/update-account', requireBearerToken, async (req, res) => {
    const sub = req.accessTokenPayload?.sub;
    if (!sub) {
        res.status(401).json({ error: 'Unauthorized', message: 'Access token is missing sub (Keycloak user id)' });
        return;
    }

    try {
        const customerId = generateCustomerId();
        await setKeycloakUserCustomerId(sub, customerId);
        res.status(200).json({ customerId });
    } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        res.status(502).json({
            error: 'Bad Gateway',
            message: 'Failed to update Keycloak user attributes',
            details: message,
        });
    }
});
```

---

## 5. Как реализована проверка токена

### Библиотека и файл

- Файл: `apps/server/src/keycloak/verifyAccessToken.ts`
- Пакет: **`jose`** (функция `jose.jwtVerify`, `jose.createRemoteJWKSet`)

### Что такое verify и чем отличается от decode

- **decode** (в `jose` это `jose.decodeJwt` и т.п.) — просто разобрать строку на части и прочитать payload **без проверки подписи**. Любой может подделать payload.
- **verify** (`jwtVerify`) — проверить подпись ключом из JWKS и стандартные вещи вроде срока действия, плюс то, что вы явно передали (issuer, audience).

В этом проекте для защиты роутов используется **только verify** через `verifyKeycloakAccessToken`.

### Что именно проверяется здесь

Фрагмент:

```18:27:apps/server/src/keycloak/verifyAccessToken.ts
export async function verifyKeycloakAccessToken(token: string): Promise<jose.JWTPayload> {
    const issuer = getKeycloakIssuer();
    const audience = getOptionalJwtAudience();

    const { payload } = await jose.jwtVerify(token, getJwks(), {
        issuer,
        ...(audience ? { audience } : {}),
    });

    return payload;
}
```

Коротко по пунктам:

| Проверка | Как в этом коде |
|----------|------------------|
| **Подпись** | `jwtVerify` + `createRemoteJWKSet` — ключи тянутся с JWKS URL Keycloak |
| **`exp` (срок)** | Включено по умолчанию в `jwtVerify` в `jose` |
| **`iss` (issuer)** | Передаётся `issuer: getKeycloakIssuer()` — должен совпасть с токеном |
| **`aud` (audience)** | Только если задана env `KEYCLOAK_JWT_AUDIENCE`; иначе **строгая проверка audience не задаётся** |

### Если токен подделан

Подпись не сойдётся с публичным ключом → `jwtVerify` бросит ошибку → в `requireBearerToken` попадём в `catch` → клиент получит **401** `Invalid or expired access token` (намеренно общее сообщение, без деталей).

---

## 6. Keycloak Admin Client — подробно по текущему коду

### 6.1 Что такое Keycloak Admin API (в контексте этого проекта)

У Keycloak есть **отдельный REST Admin API** (пути обычно начинаются с `/admin/realms/...`).  
Через него сервер с правами администратора может **менять пользователей**: атрибуты, роли и т.д.

**Почему обычный user access token не подходит:** токен пользователя выдан для **входа в приложение** (ограниченный набор прав). Он не даёт права дергать админские endpoint'ы «измени любого пользователя». Иначе любой залогиненный пользователь мог бы менять чужие аккаунты.

**Почему backend «логинится отдельно»:** в коде используется **confidential client + service account** (`client_credentials`). Это отдельная пара client id / secret на сервере — не то же самое, что публичный клиент SPA. Так Keycloak выдаёт токен **сервису**, у которого в консоли Keycloak выданы админские роли (в README сервера сказано: как минимум что-то вроде `manage-users` для realm-management).

### 6.2 Что такое Keycloak Admin Client в проекте

- **Файл:** `apps/server/src/keycloak/setUserCustomerId.ts`
- **Пакет:** `@keycloak/keycloak-admin-client`
- **Создание:** `new KcAdminClient({ baseUrl, realmName: adminRealm })`
- **Env:** из `env.ts` — `KEYCLOAK_BASE_URL`, `KEYCLOAK_REALM`; для админки ещё `KEYCLOAK_ADMIN_CLIENT_ID`, `KEYCLOAK_ADMIN_CLIENT_SECRET`; опционально `KEYCLOAK_ADMIN_REALM`.

### 6.3 Как backend получает admin access token (логика библиотеки + наш вызов)

В коде явный вызов:

```23:27:apps/server/src/keycloak/setUserCustomerId.ts
    await admin.auth({
        grantType: 'client_credentials',
        clientId,
        clientSecret,
    });
```

Что это значит простыми словами:

1. Библиотека шлёт запрос на **token endpoint** Keycloak (для выбранного `realmName` при создании клиента — сначала `adminRealm`).
2. Grant type `client_credentials` — «я приложение, вот secret, дай токен сервиса».
3. В ответ приходит **access token админского типа** (с ролями service account). Библиотека **держит его внутри экземпляра** `admin` и подставляет в заголовки следующих вызовов Admin API.

Схема:

```
Backend (setUserCustomerId)
  -> KcAdminClient.auth(client_credentials)
      -> POST .../realms/{adminRealm}/protocol/openid-connect/token
      <- access_token (service account)
  -> admin.users.findOne / admin.users.update
      -> GET/PUT .../admin/realms/{userRealm}/users/...
```

После `auth` код делает:

```29:30:apps/server/src/keycloak/setUserCustomerId.ts
    // User CRUD endpoints target the realm that owns the users, not necessarily the admin client's realm.
    admin.setConfig({ realmName: userRealm });
```

**Зачем:** пользователи живут в `KEYCLOAK_REALM` (`userRealm`), а логин service account мог теоретически быть в другом realm (`KEYCLOAK_ADMIN_REALM`). Поэтому сначала auth в одном realm, потом переключили конфиг на realm пользователей для `findOne` / `update`.

### 6.4 Почему это безопасно (в модели этого проекта)

- Обычный пользователь **не знает** `KEYCLOAK_ADMIN_CLIENT_SECRET` — он лежит только в env на сервере.
- User JWT **не принимается** Keycloak как доказательство прав на Admin API для этих операций — для `users.update` нужен токен с админскими правами, который получают по client credentials на сервере.
- **Нельзя класть admin secret во фронт:** его увидит любой — и сможет вызывать Admin API от имени сервисного аккаунта.

### 6.5 Как обновляется `customer_id` (пошагово по коду)

1. У пользователя уже есть **валидный user access token** в заголовке (проверен в middleware).
2. Из токена взят `sub` — это id пользователя в Keycloak.
3. `setKeycloakUserCustomerId(sub, customerId)`:
   - `admin.users.findOne({ id: keycloakUserId })` — найти пользователя.
   - Собрать `attributes` = старые атрибуты + `customer_id: [customerId]` (Keycloak хранит много значений как массивы строк).
   - `admin.users.update({ id: user.id }, { ...user, attributes })` — отправить обновлённого пользователя.

Пример того, **какой смысл** у HTTP-вызова update (точный JSON формирует библиотека; путь типичный для Keycloak):

```http
PUT /admin/realms/{realm}/users/{userId}
Authorization: Bearer <service_account_access_token>
Content-Type: application/json

{ ...поля пользователя..., "attributes": { "customer_id": ["cust_abcd..."] } }
```

### 6.6 Три токена простым языком (как в этом flow)

| Токен | Аналогия | Где в проекте |
|-------|-----------|----------------|
| **User access token** | «Пропуск конкретного человека в API» | Заголовок `Authorization` у `/customer` и `/update-account`; проверяется `verifyKeycloakAccessToken` |
| **Refresh token** | «Купон на новый пропуск» | В **этом репозитории сервер refresh token не обрабатывает** — им занимается клиент/OIDC-провайдер сессии (см. раздел 8) |
| **Admin access token** | «Пропуск робота-администратора для Keycloak Admin API» | Внутри `KcAdminClient` после `admin.auth({ client_credentials })` |

### 6.7 Почему не лезут напрямую в БД Keycloak

База Keycloak — внутренняя реализация, схема может меняться. **Поддерживаемый** способ — Admin API. Код проекта делает именно так через официальный клиент.

### 6.8 Как backend понимает, кого обновлять

Связка одна цепочка:

```
User JWT (после verify)
  -> поле `sub`
      -> это тот же идентификатор, что `id` пользователя в Admin API
          -> findOne({ id: sub }) -> update({ id }, ...)
```

То есть **не email и не username из тела запроса** — только `sub` из уже доверенного токена. Это защищает от сценария «пришлю чужой email и перепишу чужой аккаунт».

### 6.9 ASCII: полный admin flow для `POST /update-account`

```
Client
  -> POST /update-account + Bearer USER token
      -> requireBearerToken -> payload с sub
      -> generateCustomerId()
      -> setKeycloakUserCustomerId(sub, customerId)
          -> new KcAdminClient({ baseUrl, realmName: adminRealm })
          -> admin.auth(client_credentials) -> ADMIN token (внутри клиента)
          -> admin.setConfig({ realmName: userRealm })
          -> admin.users.findOne({ id: sub })
          -> admin.users.update(..., { attributes: { ..., customer_id: [...] } })
      -> 200 { customerId }
```

### 6.10 Что было бы без Admin Client

В рамках **этого** учебного backend без Admin API / client credentials:

- Нельзя было бы **записать** `customer_id` в атрибуты пользователя Keycloak из кода.
- `GET /customer` опирается на claim в токене → без записи атрибута и mapper сценарий «сначала 403, потом 200» **не собрать**.
- Любые «онбординги», создание пользователей, смена атрибутов с сервера — всё это обычно делается через Admin API или отдельные интеграции, а не через «просто user JWT».

---

## 7. Почему `customer_id` не появляется в токене сразу после `POST /update-account`

Уже написано в комментариях к роутам — здесь развернуто «для ребёнка».

1. Пользователь залогинен — у него есть **текущий** access token (строка JWT).
2. Этот токен — **снимок на момент выдачи**. Keycloak сгенерировал список claims и подписал.
3. Backend через Admin Client **меняет данные пользователя в Keycloak** (атрибут в хранилище).
4. **Старая строка JWT в браузере не меняется сама** — это просто текст. Никто не «дописывает» туда поле задним числом.
5. Чтобы внутри JWT появился новый claim, нужен **новый** access token, который Keycloak соберёт **заново** из актуальных атрибутов + mapper.
6. Обычно новый access token дают после **refresh** (или повторного логина) — refresh token ходит на token endpoint, и выдаётся свежая пара токенов.
7. Уже **новый** access token может содержать `customer_id`, если в Keycloak настроен **User Attribute → token claim** mapper (как в README сервера).

ASCII:

```
POST /update-account
  -> атрибут в Keycloak ОБНОВЛЁН
  -> старый JWT у клиента БЕЗ ИЗМЕНЕНИЙ
Client refresh
  -> Keycloak читает актуальные атрибуты
  -> mapper кладёт customer_id в НОВЫЙ access token
GET /customer
  -> verify нового токена
  -> customer_id найден -> 200 + stub
```

---

## 8. Как это связано с NextAuth

**Факт по репозиторию:** в `apps/web` **нет** зависимости `next-auth`, нет конфигурации провайдера и нет кода сессии. То есть **текущий фронтенд в этом монорепо NextAuth не использует**.

Как это **обычно** стыкуется в курсе или после добавления NextAuth (концептуально, не как «код из этого git»):

- NextAuth хранит токены в **зашифрованной сессии** (cookie/JWT сессии — зависит от настроек).
- Access / refresh токены от Keycloak кладут в **callbacks** (`jwt`, `session`), чтобы браузер не хранил refresh в `localStorage` без необходимости.
- Клиент берёт сессию через `getSession` / `useSession` (на стороне NextAuth).
- Когда access token истёк или не хватает claims, NextAuth (или провайдер) делает **refresh** к Keycloak — приходит **новый** access token уже с обновлёнными claims (если mapper настроен).
- После этого фронт шлёт `Authorization: Bearer <новый access>` на `http://localhost:3001/customer`.

Пока NextAuth не подключён, токены для `curl`/Bruno нужно получать **вручную** из Keycloak (как в `apps/server/README.md`).

---

## 9. Полный сценарий проекта (как задумано в README сервера)

Это **сценарий из документации** `apps/server/README.md` + поведение кода, а не отдельное приложение на фронте.

1. Пользователь логинится через Keycloak (OIDC) — получает access (и часто refresh) токен.
2. Первый access token часто **без** `customer_id` (mapper/атрибут ещё не настроены или не провиженили).
3. Клиент вызывает `GET /customer` с Bearer → middleware verify → **403** с подсказкой в `message`.
4. Клиент вызывает `POST /update-account` с тем же Bearer → backend берёт `sub`, генерит id, **Admin Client** пишет атрибут в Keycloak → **200** `{ customerId }`.
5. Старый access token **всё ещё без** `customer_id` в payload.
6. Клиент делает **refresh** (или логин заново) → Keycloak выпускает **новый** access token.
7. Если mapper настроен — в новом токене есть `customer_id`.
8. `GET /customer` с новым токеном → **200** и stub JSON из `getStubCustomer`.

---

## 10. Типичные ошибки (привязка к этому коду)

### Почему нельзя взять `jwt.decode` вместо verify для защиты API

`decode` не проверяет подпись. Любой сможет подставить чужой `customer_id` в payload. В проекте защита строится на **`jwtVerify`** в `verifyAccessToken.ts`.

### Почему `customer_id` «не появился» сразу после POST

Потому что POST меняет **хранилище Keycloak**, а не строку текущего JWT. Нужен новый токен (раздел 7).

### Почему protocol mapper важен

Атрибут пользователя в Keycloak **сам по себе** не обязан попадать в JWT. Mapper говорит: «положи атрибут `customer_id` в access token как claim». Без этого `getCustomerIdFromPayload` в токене ничего не найдёт даже после refresh.

### Почему бывает `invalid issuer`

`getKeycloakIssuer()` должен **точно** совпасть с полем `iss` в токене. Частая ошибка — в env другой хост (`localhost` vs `127.0.0.1`), лишний слэш, другой realm.

### Почему бывает проблема с `audience`

Если выставили `KEYCLOAK_JWT_AUDIENCE`, `jose` потребует, чтобы токен содержал это значение в `aud`. Если Keycloak отдаёт другой `aud` — verify упадёт → 401.

### Почему admin login может не работать

- Неверные `KEYCLOAK_ADMIN_CLIENT_ID` / `SECRET`.
- У service account нет ролей на управление пользователями в нужном realm.
- Неверный `KEYCLOAK_ADMIN_REALM`, если клиент зарегистрирован не там.

### Почему backend «не находит public key»

JWKS берётся с URL из `getKeycloakJwksUri()`. Если Keycloak недоступен, URL неверный, или TLS/сеть режут запрос — `jwtVerify` упадёт → 401.

### Почему refresh мог «не добавить» `customer_id`

- Не сделали mapper.
- Обновили не тот realm / не того пользователя.
- Клиент после refresh всё ещё шлёт **старый** токен (кэш, не обновили сессию).

---

## 11. Стиль и краткое резюме

### Что важно запомнить

1. **Express** собирается в `app.ts`, слушает порт в `server.ts`, роуты подключаются в `routes/index.ts`.
2. Любой защищённый путь сначала проходит **`requireBearerToken`** — из заголовка Bearer, затем **`verifyKeycloakAccessToken`** (`jose` + JWKS + `iss` + опционально `aud`).
3. **`GET /customer`** читает `customer_id` **только из проверенного токена**; данные профиля — **stub**, не БД.
4. **`POST /update-account`** узнаёт пользователя по **`sub` из токена**, генерит id, пишет атрибут через **`@keycloak/keycloak-admin-client`** и **client credentials** — это отдельный **admin** токен внутри библиотеки, не user JWT.
5. После записи атрибута нужен **новый user access token** (refresh), иначе в старом JWT по-прежнему нет claim — будет **403** на `/customer`.
6. **NextAuth в текущем репозитории не подключён**; связка с токенами на фронте — следующий шаг курса/проекта, не часть текущего кода `apps/web`.

---

*Документ сгенерирован по состоянию файлов в `apps/server` и `apps/server/README.md`.*
