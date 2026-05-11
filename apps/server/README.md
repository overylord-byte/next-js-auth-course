# Backend (Express + Keycloak)

Minimal notes for running the API and Keycloak locally.

## Install dependencies

From the monorepo root:

```sh
pnpm install
```

## Start Keycloak

Example (official image, dev mode):

```sh
docker run -p 8080:8080 -e KEYCLOAK_ADMIN=admin -e KEYCLOAK_ADMIN_PASSWORD=admin quay.io/keycloak/keycloak:latest start-dev
```

Admin UI: `http://localhost:8080`. Create a realm, users, a public/confidential client for your app, and a **User Attribute** protocol mapper so claim `customer_id` appears on access tokens after refresh. For `POST /update-account`, the backend uses **Keycloak admin credentials** (see below) only on the server to obtain an **admin token** and call the Admin REST API — the browser never sees these secrets.

## Environment variables

Required for JWT verification and JWKS:

| Variable | Purpose |
|----------|---------|
| `KEYCLOAK_BASE_URL` | Keycloak base URL (no trailing slash), e.g. `http://localhost:8080` |
| `KEYCLOAK_REALM` | Realm that issues tokens |

Required for `POST /update-account` (Admin API, local password grant):

| Variable | Purpose |
|----------|---------|
| `KEYCLOAK_ADMIN_USERNAME` | Keycloak admin username (local dev often `admin`) |
| `KEYCLOAK_ADMIN_PASSWORD` | Keycloak admin password — **server only**, never sent to the frontend |

Optional:

| Variable | Purpose |
|----------|---------|
| `KEYCLOAK_ADMIN_REALM` | Realm used for admin login (default **`master`**) |
| `KEYCLOAK_TARGET_REALM` | Realm whose users are updated (defaults to **`KEYCLOAK_REALM`**, i.e. the realm that issued the user access token) |
| `KEYCLOAK_ADMIN_AUTH_CLIENT_ID` | OAuth client for direct access grant (default **`admin-cli`**) |
| `KEYCLOAK_JWT_AUDIENCE` | If set, access tokens must include this `aud` |
| `PORT` | HTTP port for this API (default **3001**) |

**Tokens:** the **user** `Authorization: Bearer` token identifies who is calling `/update-account` (`sub` → Keycloak user id). A separate **admin** token is obtained with the env username/password and is used only inside the backend to update that user’s attributes in Keycloak. This pattern is for **local learning/dev**; production should use a proper service account or secrets management and **cache or refresh** the admin token instead of authenticating on every request.

**Security:** do not expose `KEYCLOAK_ADMIN_PASSWORD` (or any admin client secret) to the SPA; the frontend must never store admin credentials.

## Start the backend

From monorepo root:

```sh
pnpm --filter backend dev
```

Or from `apps/server`:

```sh
pnpm dev
```

Base URL: **`http://localhost:3001`** (or your `PORT`).

## Endpoints

Both expect **`Authorization: Bearer <access_token>`**.

| Method | Path | Behavior |
|--------|------|----------|
| `GET` | `/customer` | **403** if token has no `customer_id`; otherwise stub customer JSON |
| `POST` | `/update-account` | Generates `customer_id`, writes it to the Keycloak user (`sub`), returns `{ "customerId": "..." }` |

## Expected auth flow

1. User logs in via Keycloak (OIDC).
2. First access token usually has **no** `customer_id` → `GET /customer` → **403**.
3. `POST /update-account` stores `customer_id` on the Keycloak user.
4. Client **refreshes** (or re-authenticates) so a new token includes `customer_id`.
5. `GET /customer` returns stub customer data.

## Test the APIs

Use any HTTP client with a valid Keycloak access token:

```sh
curl -s http://localhost:3001/customer -H "Authorization: Bearer <ACCESS_TOKEN>"
curl -s -X POST http://localhost:3001/update-account -H "Authorization: Bearer <ACCESS_TOKEN>"
```

**Bruno:** a `/bruno` folder at the **monorepo root** will hold saved API requests for manual testing. If it is already present, open that collection in Bruno and run requests against `http://localhost:3001` with your Bearer token.
