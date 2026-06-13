# Smart Food — Backend API Specification

> **For the backend developer.** This document describes **every** API the Smart Food
> Telegram Mini App needs. The current frontend ships with **100% mock data** (hardcoded
> in `src/data/foods.js` and `src/store.js`, persisted to `localStorage`). There are **no
> network calls** today. This spec is the contract to replace that mock layer with a real
> backend.
>
> Anything marked **(recommended)** is not strictly used by the current UI but is required
> for a real production system. Anything marked **(frontend uses this today)** maps to an
> existing screen/feature.

---

## Table of contents

1. [Current state — what is mocked](#1-current-state--what-is-mocked)
2. [Global conventions](#2-global-conventions)
3. [Authentication (Telegram Mini App)](#3-authentication-telegram-mini-app)
4. [Error model](#4-error-model)
5. [Realtime (order tracking & courier location)](#5-realtime-order-tracking--courier-location)
6. [Endpoints](#6-endpoints)
   - 6.1 [Bootstrap / app config](#61-bootstrap--app-config)
   - 6.2 [Auth & session](#62-auth--session)
   - 6.3 [User profile](#63-user-profile)
   - 6.4 [Addresses (with map coordinates)](#64-addresses-with-map-coordinates)
   - 6.5 [Geocoding (Yandex proxy)](#65-geocoding-yandex-proxy)
   - 6.6 [Catalog — categories, foods, sizes, extras, search](#66-catalog)
   - 6.7 [Favorites](#67-favorites)
   - 6.8 [Cart (server validation)](#68-cart-server-validation)
   - 6.9 [Promo codes](#69-promo-codes)
   - 6.10 [Checkout — quote, delivery fee, time slots](#610-checkout--quote-delivery-fee-time-slots)
   - 6.11 [Orders](#611-orders)
   - 6.12 [Order tracking](#612-order-tracking)
   - 6.13 [Payments & cards](#613-payments--cards)
   - 6.14 [Loyalty (Smart Club)](#614-loyalty-smart-club)
   - 6.15 [Notifications](#615-notifications)
   - 6.16 [Support & content](#616-support--content)
7. [Webhooks](#7-webhooks)
8. [Data dictionary](#8-data-dictionary)
9. [Enumerations](#9-enumerations)
10. [Security checklist](#10-security-checklist)
11. [Appendix — mock → endpoint map](#11-appendix--mock--endpoint-map)

---

## 1. Current state — what is mocked

| Area | Where it lives now | Needs endpoint |
|---|---|---|
| Menu / catalog | `src/data/foods.js` (`FOODS`, `CATEGORIES`, `SIZES`, `EXTRAS`) | §6.6 |
| Prices, delivery fee, free-delivery threshold | `DELIVERY_FEE = 12000`, `FREE_DELIVERY_AT = 100000` | §6.6, §6.10 |
| User profile | `store.user` default "Aziz Karimov" | §6.3 |
| Addresses | `store.addresses` (now with `lat/lng` + door details) | §6.4 |
| Payment cards | `store.cards` (UzCard 4821, Humo 9032) | §6.13 |
| Favorites | `store.favorites` | §6.7 |
| Cart | `store.cart` (localStorage) | §6.8 |
| Orders + seed history | `SEED_ORDERS`, `placeOrder()` | §6.11 |
| Order tracking, courier, ETA | hardcoded in `TrackingView.vue` ("Jamshid R.", "~28 min") | §6.12 |
| Loyalty points / rewards / member ID | hardcoded in `LoyaltyView.vue` (1250/2000) | §6.14 |
| Promo `SMART50` (50% off) | client-side string check in `applyPromo()` | §6.9 |
| Notification prefs | `store.notif` | §6.15 |
| Support contacts & FAQ | hardcoded in `SupportView.vue` | §6.16 |
| Auth | none — no login at all | §6.2 |

---

## 2. Global conventions

| Topic | Rule |
|---|---|
| **Base URL** | `https://api.smartfood.uz/api/v1` (configurable in the frontend via `VITE_API_BASE`). |
| **Versioning** | URL-prefixed (`/api/v1`). Breaking changes bump to `/api/v2`. |
| **Transport** | HTTPS only. HTTP/2 preferred. |
| **Content type** | `application/json; charset=utf-8` for requests and responses. `multipart/form-data` only for media upload (recommended). |
| **Money** | Integer **so'm (UZS)**, no decimals. Example: `39000` = 39 000 so'm. Never floats. Field name suffix `*_uzs` is acceptable but the app reads plain `price`, `total`, etc. |
| **Currency** | `"UZS"` (ISO 4217). |
| **Locale** | Client sends `Accept-Language: uz | ru | en`. Catalog text returns **all three** localizations (see §6.6) so the app can switch language offline. Geocoder/system messages localize to the requested language. |
| **Timestamps** | ISO 8601 UTC, e.g. `"2026-06-13T08:24:00Z"`. The client formats relative dates ("Bugun · 13:24"). |
| **IDs** | Strings. Orders use the human format `SF-2048`. Internal entities may use UUID or ULID; treat all IDs as opaque strings. |
| **Coordinates** | `[latitude, longitude]` is **not** used in JSON; instead use explicit `{ "lat": 41.31, "lng": 69.28 }` objects. WGS-84. 6 decimal places (~0.1 m). |
| **Pagination** | Cursor-based: `?limit=20&cursor=<opaque>`. Response includes `{ "items": [...], "next_cursor": "..." | null }`. |
| **Sorting / filtering** | Documented per endpoint via query params. |
| **Idempotency** | Mutating POSTs that create resources (orders, payments) accept `Idempotency-Key: <uuid>` header. Same key + same body → same result, no duplicate. |
| **Rate limiting** | Per-user + per-IP. `429` with `Retry-After`. Geocoding endpoints especially. |
| **Empty vs null** | Optional string fields are `""` when empty (matches the app's address model), nullable numbers are `null`. |
| **CORS** | Allow the Mini App origin(s) and Telegram's web client. |

**Standard response envelope** — endpoints return the resource directly on success
(`200/201`). Lists use `{ "items": [...], "next_cursor": ... }`. Errors use the envelope in §4.

### 2.1 Frontend data-shape note (important)

This spec proposes **clean REST shapes** (nested localization objects, `snake_case`,
explicit money fields). The **current mock frontend** uses a flatter shape. When wiring the
API, add a thin adapter (or refactor the components). Key differences the backend dev should
know so nothing is lost:

| Concept | Current frontend shape (`src/...`) | This spec's API shape |
|---|---|---|
| Localized text | flat keys `uz`/`en`/`ru` (names), `duz`/`den`/`dru` (descriptions) | nested `name{uz,en,ru}`, `description{uz,en,ru}` |
| Food category | `cat` | `category_id` |
| Food prep time | `time` | `prep_minutes` |
| Food old price | `oldPrice` | `old_price` |
| Order | flat `total`, `date` (string), `status` | `totals{}`, `created_at` (ISO), `status` + `payment{}` object |
| Order payment | `payment` is a string `"cash"`/`"card"` | `payment{ method, status, card_last4 }` |
| Checkout slot | UI sends the **`"HH:MM"` label** (e.g. `"13:30"`) or `"asap"` | a slot **id** from `GET /checkout/slots` |
| Card default flag | `default` (bool) | `is_default` (bool) |
| Card expiry | captured in the add-card form but **currently dropped** before save | persisted as `expiry` |
| Address selected flag | `selected` (bool); `upsertAddress()` makes the saved/edited address selected | `is_default` + `PUT /addresses/{id}/default` |

> Recommendation: adopt the API shapes above and map them to component props at the data
> layer. The order/checkout flow especially should switch the slot to an **id** and the
> order to the nested `totals{}`/`payment{}` objects.

---

## 3. Authentication (Telegram Mini App)

The app runs inside Telegram. Telegram provides signed launch data — there is **no
password login**. The backend must verify that data and issue a session token.

### 3.1 How it works

1. On boot the Mini App reads `window.Telegram.WebApp.initData` (a URL-encoded string with
   `user`, `auth_date`, `query_id`, `hash`, and optionally `start_param`).
2. The frontend sends this raw string to the backend.
3. The backend **validates the HMAC-SHA256 signature** using the bot token, per Telegram's
   algorithm:
   - Build a `data_check_string` from all fields except `hash`, sorted alphabetically,
     joined by `\n`.
   - `secret_key = HMAC_SHA256("WebAppData", bot_token)`.
   - Valid iff `hex(HMAC_SHA256(secret_key, data_check_string)) == hash`.
   - Reject if `auth_date` is older than, say, 24h (`AUTH_DATE_MAX_AGE`).
4. On success, upsert the user (keyed by Telegram `id`) and return a session JWT.

### 3.2 `POST /auth/telegram`

Exchange Telegram `initData` for a session token.

**Auth:** none (this *is* the login).

**Request**
```json
{
  "init_data": "query_id=AAH...&user=%7B%22id%22%3A123...%7D&auth_date=1718000000&hash=abc123",
  "start_param": "ref_12345"
}
```

**Response `200`**
```json
{
  "token": "eyJhbGciOiJ...",
  "token_type": "Bearer",
  "expires_in": 2592000,
  "user": {
    "id": "u_88231",
    "telegram_id": 123456789,
    "name": "Aziz Karimov",
    "phone": "+998901234567",
    "email": "aziz@smartfood.uz",
    "language": "uz",
    "photo_url": "https://t.me/i/userpic/.../photo.jpg",
    "is_new": false
  }
}
```

**Errors:** `401 invalid_init_data`, `401 init_data_expired`.

> The frontend then sends `Authorization: Bearer <token>` on every subsequent request.

### 3.3 Phone verification (recommended)

Telegram does not always expose the phone number. For delivery you need it. Two options:

- **Telegram `requestContact`** flow on the client → send the shared contact to
  `POST /auth/phone` for the backend to store/verify.
- **OTP fallback** (SMS): `POST /auth/otp/request` → `POST /auth/otp/verify`.

```
POST /auth/phone          { "phone": "+998901234567", "telegram_contact": { ...signed... } }
POST /auth/otp/request    { "phone": "+998901234567" }              -> 200 { "ttl": 120 }
POST /auth/otp/verify     { "phone": "+998901234567", "code": "1234" } -> 200 { "verified": true }
```

### 3.4 Session

```
POST /auth/refresh        -> new token (if you use short-lived access + refresh tokens)
POST /auth/logout         -> 204 (invalidate the session/device)
```

---

## 4. Error model

All non-2xx responses use this envelope:

```json
{
  "error": {
    "code": "validation_error",
    "message": "Human readable, already localized to Accept-Language.",
    "details": [
      { "field": "phone", "issue": "invalid_format" }
    ],
    "request_id": "req_01HZX..."
  }
}
```

| HTTP | `code` examples | Meaning |
|---|---|---|
| 400 | `validation_error`, `bad_request` | Malformed input. |
| 401 | `unauthenticated`, `invalid_init_data`, `token_expired` | Missing/invalid auth. |
| 403 | `forbidden` | Authenticated but not allowed. |
| 404 | `not_found` | Resource doesn't exist. |
| 409 | `conflict`, `cart_changed`, `price_changed`, `item_unavailable` | State conflict (see checkout). |
| 410 | `gone` | e.g. promo expired. |
| 422 | `unprocessable` | Semantically invalid (e.g. address outside delivery zone). |
| 429 | `rate_limited` | Too many requests; honor `Retry-After`. |
| 5xx | `internal_error`, `upstream_error` | Server / upstream (e.g. Yandex, payment gateway) failure. |

---

## 5. Realtime (order tracking & courier location)

`TrackingView.vue` currently fakes a scooter moving on a map. Real tracking needs live
updates of **order status** and **courier GPS position**.

**Recommended: WebSocket.** Fallback: SSE or polling `GET /orders/{id}` every 10–15s.

### 5.1 `WSS /ws?token=<jwt>`

After connect, the client subscribes:

```json
{ "type": "subscribe", "channel": "order", "order_id": "SF-2048" }
```

Server pushes:

```json
{ "type": "order_status", "order_id": "SF-2048", "status": "ontheway", "eta_minutes": 18, "ts": "2026-06-13T08:30:00Z" }
```
```json
{ "type": "courier_location", "order_id": "SF-2048", "lat": 41.3119, "lng": 69.2801, "heading": 274, "speed_mps": 7.2, "ts": "2026-06-13T08:30:02Z" }
```
```json
{ "type": "order_eta", "order_id": "SF-2048", "eta_minutes": 12, "distance_m": 1400 }
```

Heartbeat: server `ping` every 30s; client replies `pong`. Reconnect with backoff and
re-subscribe.

> Courier location should be throttled to ~1 update/2–3s and only streamed while the order
> is `ready`/`ontheway`.

---

## 6. Endpoints

> Unless stated otherwise every endpoint requires `Authorization: Bearer <token>`.

### 6.1 Bootstrap / app config

One call the app can make right after auth to hydrate global config (so thresholds,
fees, promos, feature flags aren't hardcoded).

#### `GET /config`
**Response `200`**
```json
{
  "currency": "UZS",
  "delivery_fee": 12000,
  "free_delivery_threshold": 100000,
  "default_tip_options": [0, 3000, 5000, 10000],
  "supported_languages": ["uz", "ru", "en"],
  "min_order_total": 0,
  "service_area": {
    "city": "Tashkent",
    "center": { "lat": 41.311081, "lng": 69.240562 },
    "polygon": [ { "lat": 41.15, "lng": 69.10 }, { "lat": 41.42, "lng": 69.10 }, { "lat": 41.42, "lng": 69.50 }, { "lat": 41.15, "lng": 69.50 } ]
  },
  "map": {
    "default_center": { "lat": 41.311081, "lng": 69.240562 },
    "default_zoom": 17,
    "geo_bounds": { "sw": { "lat": 41.15, "lng": 69.10 }, "ne": { "lat": 41.42, "lng": 69.50 } }
  },
  "yandex": { "geocoding_via_backend": true },
  "feature_flags": { "card_payments": true, "loyalty": true, "scheduled_delivery": true },
  "support": { "phone": "+998712007070", "telegram": "@smartfood_support", "email": "help@smartfood.uz" }
}
```
> `delivery_fee`, `free_delivery_threshold`, `default_tip_options` **(frontend uses these today)** as the constants `DELIVERY_FEE`, `FREE_DELIVERY_AT`, and the `TIPS` array.

### 6.2 Auth & session
See §3.

### 6.3 User profile

**(frontend uses this today)** — `ProfileView.vue`, `store.user = { name, phone, email }`.

#### `GET /me`
```json
{
  "id": "u_88231",
  "name": "Aziz Karimov",
  "phone": "+998901234567",
  "email": "aziz@smartfood.uz",
  "language": "uz",
  "photo_url": "https://...",
  "loyalty": { "tier": "gold", "points": 1250 }
}
```

#### `PATCH /me`
**Request** (any subset)
```json
{ "name": "Aziz Karimov", "phone": "+998901234567", "email": "aziz@smartfood.uz", "language": "uz" }
```
**Response `200`** updated user object. **Errors:** `400 validation_error` (bad phone/email).

#### `PUT /me/language`
```json
{ "language": "ru" }
```
Persists the language choice server-side (the app also keeps it in `localStorage`).

---

### 6.4 Addresses (with map coordinates)

**(frontend uses this today + just upgraded for precise maps.)** This is the core of the
Yandex integration. The address model now carries **exact coordinates and door-level
details** so couriers reach the right building, entrance, and apartment.

**Address object**
```json
{
  "id": "a1",
  "tag": "Uy",
  "text": "Amir Temur ko‘chasi 12",
  "lat": 41.311158,
  "lng": 69.279737,
  "city": "Toshkent",
  "street": "Amir Temur ko‘chasi",
  "house": "12",
  "apartment": "45",
  "entrance": "2",
  "floor": "5",
  "intercom": "45",
  "comment": "Oq darvoza",
  "precision": "exact",
  "is_default": true
}
```

| Field | Type | Notes |
|---|---|---|
| `id` | string | server-assigned |
| `tag` | string | label: "Uy"/"Ish"/custom (Home/Work/Other) |
| `text` | string | display line (street + house, or full formatted) — **required** |
| `lat`, `lng` | number\|null | WGS-84, from the map pin — **strongly required for delivery** |
| `city`, `street`, `house` | string | parsed from the Yandex geocoder |
| `apartment`, `entrance`, `floor`, `intercom` | string | door-level details (optional) |
| `comment` | string | free note for courier ("white gate, mind the dog") |
| `precision` | string | Yandex precision: `exact`/`number`/`near`/`range`/`street`/`other` — see §9 |
| `is_default` | bool | the selected address |

#### `GET /addresses`
```json
{ "items": [ { ...address... }, { ...address... } ] }
```

#### `POST /addresses`
**Request** (the full object minus `id`)
```json
{
  "tag": "Uy", "text": "Amir Temur ko‘chasi 12",
  "lat": 41.311158, "lng": 69.279737,
  "city": "Toshkent", "street": "Amir Temur ko‘chasi", "house": "12",
  "apartment": "45", "entrance": "2", "floor": "5", "intercom": "45",
  "comment": "Oq darvoza", "precision": "exact", "make_default": true
}
```
**Response `201`** the created address.
**Validation:** `text` required; `lat`/`lng` required if delivery requires it; reject coords
outside `service_area` with `422 outside_delivery_zone`.

#### `PATCH /addresses/{id}` — partial update (same body). **Response `200`**.
#### `DELETE /addresses/{id}` — **Response `204`**. If it was default, server promotes another.
#### `PUT /addresses/{id}/default` — mark selected. **Response `200`**.

> Frontend mapping: `AddressEditView.vue` builds this exact object; `store.upsertAddress()`
> is the local stand-in for `POST`/`PATCH`. `selectAddress()` → `PUT .../default`.

---

### 6.5 Geocoding (Yandex proxy)

The Mini App talks to **Yandex Maps JS API 2.1** directly for the interactive map and
client-side reverse/forward geocoding (key in `VITE_YANDEX_MAPS_KEY`). However, the backend
should expose **server-side geocoding endpoints** too, for three reasons:

1. **Quota & key safety** — keep the heavier HTTP Geocoder key server-side; cache results.
2. **Validation** — confirm a chosen point is inside the delivery zone and snap to a known
   building.
3. **Courier app / order processing** — normalize addresses consistently.

Use Yandex **HTTP Geocoder API** (`https://geocode-maps.yandex.ru/1.x/`) server-side with a
geocoder key. **Cache** by rounded coordinate / normalized query (TTL e.g. 24h).

#### `GET /geo/reverse?lat=41.3112&lng=69.2797&lang=ru`
Coordinates → address (house precision).
**Response `200`**
```json
{
  "lat": 41.311158, "lng": 69.279737,
  "formatted": "Узбекистан, Ташкент, улица Амира Темура, 12",
  "country": "Узбекистан", "province": "Tashkent", "city": "Ташкент",
  "street": "улица Амира Темура", "house": "12",
  "precision": "exact", "kind": "house",
  "in_delivery_zone": true
}
```

#### `GET /geo/forward?q=Amir%20Temur%2012&lang=ru&limit=5`
Text → ranked candidates (for the search box in the map picker).
**Response `200`**
```json
{
  "items": [
    { "lat": 41.311158, "lng": 69.279737, "formatted": "...", "street": "...", "house": "12", "precision": "exact", "in_delivery_zone": true }
  ]
}
```

#### `GET /geo/suggest?q=amir&lang=ru` (recommended)
Lightweight autocomplete (Yandex Suggest API) for as-you-type address hints:
```json
{ "items": [ { "title": "улица Амира Темура", "subtitle": "Ташкент", "q": "Ташкент, улица Амира Темура" } ] }
```

#### `POST /geo/validate`
Confirm a pinned point is deliverable and return fee/ETA for it (used before saving an
address or at checkout).
```json
{ "lat": 41.3112, "lng": 69.2797 }
```
**Response `200`**
```json
{ "in_delivery_zone": true, "zone_id": "z_center", "delivery_fee": 12000, "eta_minutes": 30, "distance_m": 2400 }
```
**Errors:** `422 outside_delivery_zone`.

> **Coordinate order note for the backend:** the Yandex *HTTP* Geocoder defaults to
> `geocode=<lng>,<lat>` (longitude first). The Yandex *JS API* (used by the client) uses
> `[lat, lng]`. Keep all **our** JSON in `{lat, lng}` and convert at the Yandex boundary.

---

### 6.6 Catalog

**(frontend uses this today)** — `FOODS`, `CATEGORIES`, `SIZES`, `EXTRAS`. The app is
trilingual and switches language offline, so **return all localizations** in each object.

**Category object**
```json
{ "id": "burger", "kind": "burger", "sort": 1,
  "name": { "uz": "Burger", "en": "Burgers", "ru": "Бургеры" } }
```

**Food object**
```json
{
  "id": "f1",
  "category_id": "burger",
  "kind": "burger",
  "hue": 22,
  "price": 39000,
  "old_price": 52000,
  "rating": 4.9,
  "rating_count": 218,
  "prep_minutes": 20,
  "kcal": 540,
  "tag": "bestseller",
  "spicy": false,
  "available": true,
  "image_url": "https://cdn.smartfood.uz/f1.webp",
  "name": { "uz": "Smart Klassik Burger", "en": "Smart Classic Burger", "ru": "Классический бургер" },
  "description": {
    "uz": "Mol go‘shti kotleti, cheddar...",
    "en": "Juicy beef patty, cheddar...",
    "ru": "Сочная говяжья котлета, чеддер..."
  },
  "sizes": [
    { "id": "s", "mult": 0.85, "name": { "uz": "Kichik", "en": "Small", "ru": "Малый" } },
    { "id": "m", "mult": 1.0,  "name": { "uz": "O‘rta", "en": "Medium", "ru": "Средний" } },
    { "id": "l", "mult": 1.25, "name": { "uz": "Katta", "en": "Large", "ru": "Большой" } }
  ],
  "extras": [
    { "id": "cheese", "price": 6000, "name": { "uz": "Qo‘shimcha pishloq", "en": "Extra cheese", "ru": "Доп. сыр" } }
  ]
}
```
> `hue` and `kind` drive the generated SVG art (`FoodArt`); keep them even once real images
> exist (`image_url`). `tag` ∈ `bestseller|new|spicy|""`. `old_price` optional (strike-through).

#### `GET /categories` → `{ "items": [ {category} ] }`  (include the synthetic `all`? No — the app injects "All" itself.)

#### `GET /catalog/foods`
Query params:
- `category` — filter by category id (`all`/omitted = everything)
- `q` — search term (name match; the app searches names today)
- `tag` — `bestseller|new|spicy`
- `sort` — `popular|price_asc|price_desc|rating|new`
- `limit`, `cursor` — pagination

**Response `200`**
```json
{ "items": [ {food}, {food} ], "next_cursor": null }
```

#### `GET /catalog/foods/{id}` → single food (with `sizes`, `extras`). `404 not_found`.

#### `GET /catalog/sizes` and `GET /catalog/extras` (recommended)
Global size/extra catalogs if they're shared rather than per-food.

#### `GET /catalog/search?q=...` (recommended)
Dedicated search (could merge with `/catalog/foods?q=`). Returns foods + maybe categories.

#### `GET /home` (recommended — composes the Home screen in one call)
```json
{
  "categories": [ {category} ],
  "promo_banner": { "title": {...}, "subtitle": {...}, "badge": "free_delivery", "promo_code": "SMART50" },
  "popular": [ {food} ],
  "recommended": [ {food} ]
}
```
> Today `HomeView.vue` derives `popular` as `tag === "bestseller" || rating >= 4.8`.

---

### 6.7 Favorites

**(frontend uses this today)** — `store.favorites` is an array of food ids; toggled by ♥.

```
GET    /favorites                 -> { "items": ["f7", "f4"] }   (or full food objects)
PUT    /favorites/{foodId}        -> 204   (add)
DELETE /favorites/{foodId}        -> 204   (remove)
```
> The app toggles instantly and persists; server is the source of truth across devices.

---

### 6.8 Cart (server validation)

The cart is currently fully client-side (`store.cart`, persisted to `localStorage`). You may
keep it client-side and only **validate/price** it at checkout, **or** mirror it server-side
for cross-device carts. Recommended: validate-on-checkout + an optional sync endpoint.

**Cart line (client shape today)**
```json
{ "foodId": "f1", "sizeId": "m", "extraIds": ["cheese", "bacon"], "qty": 2, "unit": 51000 }
```
`unit` = `round(food.price * size.mult) + sum(extra.price)`. The server must **recompute**
this and never trust client prices.

#### `POST /cart/validate` (recommended, called before/at checkout)
**Request**
```json
{ "items": [ { "foodId": "f1", "sizeId": "m", "extraIds": ["cheese"], "qty": 2 } ] }
```
**Response `200`**
```json
{
  "items": [
    { "foodId": "f1", "sizeId": "m", "extraIds": ["cheese"], "qty": 2, "unit": 45000, "line_total": 90000, "available": true }
  ],
  "subtotal": 90000,
  "changes": []
}
```
If anything changed, return `changes: [{ "foodId": "f1", "type": "price_changed", "old": 51000, "new": 45000 }]`
so the UI can warn before placing the order. (`409 cart_changed` is the alternative.)

#### `GET /cart` / `PUT /cart` (optional, only if mirroring server-side)

---

### 6.9 Promo codes

**(frontend uses this today)** — `applyPromo()` checks the literal `SMART50` (50% off) on the
client. Move validation server-side.

#### `POST /promo/validate`
**Request**
```json
{ "code": "SMART50", "subtotal": 90000, "items": [ {cart line} ] }
```
**Response `200`**
```json
{
  "code": "SMART50",
  "valid": true,
  "type": "percent",
  "value": 50,
  "discount": 45000,
  "label": { "uz": "SMART50 · −50%", "en": "SMART50 · −50%", "ru": "SMART50 · −50%" },
  "conditions": { "first_order_only": true, "min_subtotal": 0, "max_discount": null }
}
```
**Invalid:** `200 { "valid": false, "reason": "expired" | "not_eligible" | "min_subtotal_not_met" | "unknown" }`
or `410 gone`. The actual discount is **recomputed at order creation** — never trust the
client's number.

---

### 6.10 Checkout — quote, delivery fee, time slots

`CheckoutView.vue` shows: order summary, address + map, courier note, time slots
(ASAP + generated 30-min slots), payment method (cash/card), tips, and a totals block
(subtotal − discount + delivery + tip).

#### `POST /checkout/quote`
Single source of truth for what the customer will pay. Call on screen load and whenever the
address/promo/tip changes.

**Request**
```json
{
  "items": [ { "foodId": "f1", "sizeId": "m", "extraIds": ["cheese"], "qty": 2 } ],
  "address_id": "a1",
  "promo_code": "SMART50",
  "tip": 3000,
  "slot": "asap"
}
```
**Response `200`**
```json
{
  "currency": "UZS",
  "subtotal": 90000,
  "discount": 45000,
  "delivery_fee": 0,
  "free_delivery_applied": true,
  "tip": 3000,
  "total": 48000,
  "eta_minutes": 30,
  "distance_m": 2400,
  "in_delivery_zone": true,
  "lines": [ { "foodId": "f1", "qty": 2, "unit": 45000, "line_total": 90000 } ]
}
```
> Free delivery when `subtotal >= free_delivery_threshold` (currently 100000). Delivery fee
> may also depend on distance/zone (use the address coords).
**Errors:** `422 outside_delivery_zone`, `409 price_changed`/`item_unavailable`.

#### `GET /checkout/slots?address_id=a1`
Available delivery windows (the app currently generates these on the client).
```json
{
  "asap": { "available": true, "eta_minutes_min": 25, "eta_minutes_max": 35 },
  "slots": [
    { "id": "slot_1330", "label": "13:30", "from": "2026-06-13T13:30:00Z", "to": "2026-06-13T14:00:00Z", "available": true },
    { "id": "slot_1400", "label": "14:00", "from": "2026-06-13T14:00:00Z", "to": "2026-06-13T14:30:00Z", "available": true }
  ]
}
```

---

### 6.11 Orders

**(frontend uses this today)** — `placeOrder()` builds an order; `OrdersView` lists Active vs
History; `OrderCard` shows a 3-node progress bar; reorder re-adds items to cart.

**Order object**
```json
{
  "id": "SF-2048",
  "status": "ontheway",
  "created_at": "2026-06-13T08:24:00Z",
  "items": [
    { "foodId": "f1", "sizeId": "m", "extraIds": ["cheese"], "qty": 1, "unit": 45000, "name": { "uz": "...", "en": "...", "ru": "..." } }
  ],
  "address": {
    "tag": "Uy", "text": "Amir Temur ko‘chasi 12",
    "lat": 41.311158, "lng": 69.279737,
    "apartment": "45", "entrance": "2", "floor": "5", "intercom": "45", "comment": "Oq darvoza"
  },
  "note": "Eshik oldida qoldiring",
  "payment": { "method": "card", "status": "paid", "card_last4": "4821" },
  "slot": "asap",
  "totals": { "subtotal": 90000, "discount": 45000, "delivery_fee": 0, "tip": 3000, "total": 48000 },
  "eta_minutes": 18,
  "courier": { "name": "Jamshid R.", "rating": 4.9, "vehicle": "Yamaha", "phone": "+998...", "photo_url": "https://..." },
  "timeline": [
    { "key": "confirmed", "at": "2026-06-13T08:24:00Z", "state": "done" },
    { "key": "preparing", "at": "2026-06-13T08:26:00Z", "state": "active" },
    { "key": "ready",     "at": null, "state": "" },
    { "key": "delivered", "at": null, "state": "" }
  ]
}
```
> Timeline keys map to the existing UI strings: `confirmed` (`stConfirmed`), `preparing`,
> `ready` (`stReady` = out for delivery), `delivered`. Status enum in §9.

#### `POST /orders`  *(Idempotency-Key recommended)*
Create the order. The server **re-validates items, recomputes totals, applies promo, charges
payment** (or marks cash), and returns the order.

**Request**
```json
{
  "items": [ { "foodId": "f1", "sizeId": "m", "extraIds": ["cheese"], "qty": 1 } ],
  "address_id": "a1",
  "promo_code": "SMART50",
  "note": "Eshik oldida qoldiring",
  "payment": { "method": "card", "card_id": "c1" },
  "tip": 3000,
  "slot": "asap",
  "client_total": 48000
}
```
`payment.method` ∈ `cash|card`. `client_total` is a **sanity check** — if it disagrees with
the server total, return `409 price_changed` with the new quote and make the client confirm.

**Response `201`** the full order object. For card payments that need a redirect/confirmation,
include a `payment` action (see §6.13):
```json
{ "id": "SF-2051", "status": "pending_payment", "payment": { "status": "requires_action", "action": { "type": "redirect", "url": "https://checkout.payme.uz/..." } }, ... }
```

**Errors:** `409 cart_changed|price_changed|item_unavailable`, `422 outside_delivery_zone`,
`402 payment_failed`.

#### `GET /orders?status=active|history&limit=&cursor=`
`active` = status ≠ `delivered`/`cancelled`; `history` = delivered/cancelled.
```json
{ "items": [ {order} ], "next_cursor": null }
```

#### `GET /orders/{id}` → full order (used by tracking; poll fallback). `404 not_found`.

#### `POST /orders/{id}/reorder` (recommended)
Returns a cart payload to re-add (the app's `reorder()` re-adds items at current prices).
```json
{ "items": [ { "foodId": "f1", "sizeId": "m", "extraIds": [], "qty": 2, "unit": 45000, "available": true } ] }
```

#### `POST /orders/{id}/cancel` (recommended)
Allowed only before `preparing`/`ready` (business rule). `409 cannot_cancel` otherwise.

#### `POST /orders/{id}/rate` (recommended)
```json
{ "food_rating": 5, "courier_rating": 5, "comment": "Tez yetkazdi" }
```

---

### 6.12 Order tracking

Realtime via §5 WebSocket. REST equivalents:

```
GET /orders/{id}                 -> full order incl. status, courier, eta, timeline
GET /orders/{id}/location        -> { "lat": 41.3119, "lng": 69.2801, "heading": 274, "updated_at": "..." }
```
The Mini App draws the route from courier → destination using the order's `address.lat/lng`
and the live `courier_location`. Provide `eta_minutes` and `distance_m` so the UI can show
"~18 min". Courier `phone` powers the call/chat buttons (`tel:` / Telegram deep link).

---

### 6.13 Payments & cards

**(frontend uses this today)** — `PaymentsView.vue` manages saved cards
(`store.cards = [{ brand, last4, default }]`); checkout chooses cash or card. Uzbek market
gateways: **Payme, Click, Uzum, UzCard/Humo**.

> **PCI:** never send raw PAN/CVV to your server. Tokenize via the gateway SDK/widget on the
> client; store only a token + `brand` + `last4`.

**Card object**
```json
{ "id": "c1", "brand": "UzCard", "last4": "4821", "expiry": "09/27", "is_default": true, "token_ref": "tok_..." }
```

```
GET    /payment-methods                 -> { "items": [ {card} ] }
POST   /payment-methods                 -> add a tokenized card (body: { "token": "...", "brand": "UzCard", "last4": "4821" }) -> 201 {card}
PUT    /payment-methods/{id}/default    -> 200
DELETE /payment-methods/{id}            -> 204
```

**Card registration that needs OTP (UzCard/Humo)** — gateway-dependent two-step:
```
POST /payment-methods/register     { "card_number": "...", "expiry": "09/27" }   -> { "session": "...", "otp_sent": true }
POST /payment-methods/confirm      { "session": "...", "code": "1234" }          -> 201 {card}
```

**Payment for an order** — usually handled inside `POST /orders`. If you split it out:
```
POST /payments                     { "order_id": "SF-2051", "method": "card", "card_id": "c1" }
                                   -> { "status": "paid" | "requires_action", "action": { "type": "redirect", "url": "..." } }
GET  /payments/{id}                -> { "status": "paid|pending|failed|refunded" }
```
Payment status enum in §9. Gateway callbacks land on webhooks (§7).

---

### 6.14 Loyalty (Smart Club)

**(frontend uses this today)** — `LoyaltyView.vue` shows points (1250/2000), tier "Gold",
member ID, a QR code, and redeemable rewards. `SettingsView` shows "1 250 points".

#### `GET /loyalty`
```json
{
  "tier": "gold",
  "tier_label": { "uz": "Gold", "en": "Gold", "ru": "Gold" },
  "points": 1250,
  "next_tier": { "name": "platinum", "at_points": 2000, "remaining": 750 },
  "member_id": "SF · 7741 2290",
  "qr_payload": "SF7741229000",
  "earn_rate": { "points_per": 1000, "currency": "UZS" }
}
```
> `qr_payload` is what the QR encodes (the app renders it with its `QRCode` component). Today
> it just shows the member id; the backend should return a scannable token.

#### `GET /loyalty/rewards`
```json
{
  "items": [
    { "id": "r_donut", "cost": 400, "kind": "dessert", "hue": 28,
      "title": { "uz": "Bepul donut", "en": "Free donut", "ru": "Бесплатный донат" },
      "subtitle": { "uz": "Istalgan shirinlik", "en": "Any dessert", "ru": "Любой десерт" },
      "redeemable": true }
  ]
}
```

#### `POST /loyalty/redeem`
```json
{ "reward_id": "r_donut" }
```
**Response `200`** `{ "ok": true, "remaining_points": 850, "voucher_code": "SF-DNT-9931" }`
**Errors:** `409 insufficient_points`, `404 not_found`.

#### `GET /loyalty/transactions` (recommended)
History of earned/spent points (paginated).

---

### 6.15 Notifications

**(frontend uses this today)** — `NotificationsView.vue` toggles `orders`, `promos`, `news`,
`sound` in `store.notif`.

#### `GET /notifications/preferences`
```json
{ "orders": true, "promos": true, "news": false, "sound": true }
```
#### `PUT /notifications/preferences`
```json
{ "orders": true, "promos": false, "news": false, "sound": true }
```
**Response `200`** the updated prefs.

#### Delivery channel
For a Telegram Mini App, order/promo notifications are typically **bot messages** to the
user's Telegram chat (the backend has the chat id from auth). If you also want web push:
```
POST /notifications/devices    { "token": "<push token>", "platform": "web" }   -> 204
DELETE /notifications/devices/{token}                                          -> 204
```

#### Notification feed (recommended) — for the bell icon on Home
```
GET  /notifications              -> { "items": [ { "id": "...", "type": "order_update", "title": {...}, "body": {...}, "read": false, "created_at": "..." } ], "next_cursor": null }
POST /notifications/read         { "ids": ["..."] }   -> 204
GET  /notifications/unread-count -> { "count": 3 }
```

---

### 6.16 Support & content

**(frontend uses this today)** — `SupportView.vue` has contact links (phone, Telegram, email)
and a 3-item FAQ, all hardcoded.

#### `GET /support`
```json
{
  "contacts": [
    { "type": "phone", "value": "+998712007070", "label": { "uz": "Qo‘ng‘iroq qilish", "en": "Call support", "ru": "Позвонить" } },
    { "type": "telegram", "value": "@smartfood_support", "href": "https://t.me/smartfood_support", "label": { ... } },
    { "type": "email", "value": "help@smartfood.uz", "label": { ... } }
  ],
  "faq": [
    { "q": { "uz": "...", "en": "...", "ru": "..." }, "a": { "uz": "...", "en": "...", "ru": "..." } }
  ]
}
```

#### `GET /content/promos` (recommended) — Home promo banner(s).
#### `POST /support/tickets` (recommended) — open a support request.

---

## 7. Webhooks

Inbound calls **to** your backend from third parties. Secure each with signature
verification + allow-listed IPs.

| Webhook | Source | Purpose |
|---|---|---|
| `POST /webhooks/payments/payme` | Payme | payment authorized/captured/cancelled |
| `POST /webhooks/payments/click` | Click | payment status callbacks |
| `POST /webhooks/payments/uzum` | Uzum | payment status callbacks |
| `POST /webhooks/telegram` | Telegram Bot API | bot updates (contact share, deep links) |
| `POST /webhooks/courier` | dispatch/courier system | status + GPS pushes (if external) |

Each must be **idempotent** (gateways retry) and respond `200` quickly; process async.

---

## 8. Data dictionary

| Entity | Key fields |
|---|---|
| **User** | `id`, `telegram_id`, `name`, `phone`, `email`, `language`, `photo_url`, `loyalty{tier,points}` |
| **Address** | `id`, `tag`, `text`, `lat`, `lng`, `city`, `street`, `house`, `apartment`, `entrance`, `floor`, `intercom`, `comment`, `precision`, `is_default` |
| **Category** | `id`, `kind`, `sort`, `name{uz,en,ru}` |
| **Food** | `id`, `category_id`, `kind`, `hue`, `price`, `old_price`, `rating`, `rating_count`, `prep_minutes`, `kcal`, `tag`, `spicy`, `available`, `image_url`, `name{}`, `description{}`, `sizes[]`, `extras[]` |
| **Size** | `id`, `mult`, `name{}` |
| **Extra** | `id`, `price`, `name{}` |
| **CartLine** | `foodId`, `sizeId`, `extraIds[]`, `qty`, `unit` |
| **Order** | `id`, `status`, `created_at`, `items[]`, `address{}`, `note`, `payment{}`, `slot`, `totals{}`, `eta_minutes`, `courier{}`, `timeline[]` |
| **OrderTotals** | `subtotal`, `discount`, `delivery_fee`, `tip`, `total` |
| **Courier** | `name`, `phone`, `rating`, `vehicle`, `photo_url`, live `lat`/`lng`/`heading` |
| **Card** | `id`, `brand`, `last4`, `expiry`, `is_default`, `token_ref` |
| **Promo** | `code`, `type`, `value`, `conditions{}`, `label{}` |
| **Reward** | `id`, `cost`, `kind`, `hue`, `title{}`, `subtitle{}`, `redeemable` |
| **NotifPrefs** | `orders`, `promos`, `news`, `sound` |

---

## 9. Enumerations

| Enum | Values |
|---|---|
| **Order status** | `pending_payment`, `confirmed`, `preparing`, `ready` (out for delivery), `ontheway`, `delivered`, `cancelled` |
| **Timeline key** | `confirmed`, `preparing`, `ready`, `delivered` |
| **Payment method** | `cash`, `card` |
| **Payment status** | `pending`, `requires_action`, `paid`, `failed`, `refunded` |
| **Card brand** | `UzCard`, `Humo`, `Visa`, `Mastercard` |
| **Food tag** | `bestseller`, `new`, `spicy`, `""` |
| **Food kind** | `burger`, `pizza`, `dessert`, `drink`, `combo` (drives generated art) |
| **Size id** | `s`, `m`, `l` |
| **Geocoder precision** (Yandex) | `exact` (building), `number` (house # interpolated), `near`, `range`, `street`, `other`, `""` (unset — address saved without a map pin) |
| **Geocoder kind** | `house`, `street`, `metro`, `district`, `locality`, `area`, `province`, `country` |
| **Loyalty tier** | `silver`, `gold`, `platinum` (extend as needed) |
| **Language** | `uz`, `ru`, `en` |

---

## 10. Security checklist

- ✅ Validate Telegram `initData` HMAC on every login; reject stale `auth_date`.
- ✅ Authorize every resource by the session user (no IDOR — a user can only read/write their
  own addresses, orders, cards).
- ✅ **Recompute money on the server** — never trust `unit`, `subtotal`, `discount`, or
  `total` from the client. `client_total` is a sanity check only.
- ✅ Tokenize cards via the gateway; never store PAN/CVV.
- ✅ Verify webhook signatures; make webhooks idempotent.
- ✅ Rate-limit auth, geocoding, OTP, and order creation.
- ✅ Keep the Yandex **HTTP Geocoder** key server-side; the client's **JS API** key is public
  but must be HTTP-Referer-restricted in the Yandex cabinet.
- ✅ Validate delivery addresses are inside the service polygon before accepting an order.
- ✅ `Idempotency-Key` on order/payment creation to prevent duplicates on retry.
- ✅ Enforce HTTPS + HSTS; sanitize all user-supplied text (address comment, notes).

---

## 11. Appendix — mock → endpoint map

| Frontend mock (file) | Replace with |
|---|---|
| `data/foods.js` → `FOODS` | `GET /catalog/foods`, `GET /catalog/foods/{id}` |
| `data/foods.js` → `CATEGORIES` | `GET /categories` |
| `data/foods.js` → `SIZES`, `EXTRAS` | embedded in food, or `GET /catalog/sizes`/`/extras` |
| `data/foods.js` → `DELIVERY_FEE`, `FREE_DELIVERY_AT` | `GET /config` |
| `store.user` | `GET /me`, `PATCH /me` |
| `store.addresses` + `upsertAddress()` | `GET/POST/PATCH/DELETE /addresses` |
| map pin → `lat/lng/precision` | client Yandex JS API + `GET /geo/reverse`, `/geo/forward`, `POST /geo/validate` |
| `store.cards` | `GET/POST/DELETE /payment-methods` |
| `store.favorites` + `toggleFav()` | `GET/PUT/DELETE /favorites` |
| `store.cart` | client + `POST /cart/validate` |
| `applyPromo()` (`SMART50`) | `POST /promo/validate` |
| `CheckoutView` totals | `POST /checkout/quote`, `GET /checkout/slots` |
| `placeOrder()` / `SEED_ORDERS` | `POST /orders`, `GET /orders`, `GET /orders/{id}` |
| `OrderCard` reorder | `POST /orders/{id}/reorder` |
| `TrackingView` (courier, ETA, map) | `GET /orders/{id}` + `WSS /ws` (`courier_location`, `order_status`) |
| `LoyaltyView` (points, rewards, QR) | `GET /loyalty`, `GET /loyalty/rewards`, `POST /loyalty/redeem` |
| `store.notif` | `GET/PUT /notifications/preferences` |
| `SupportView` (contacts, FAQ) | `GET /support` |

---

*Generated for Smart Food (Vue 3 Telegram Mini App). Frontend address model already emits
the precise `{lat, lng, precision, apartment, entrance, floor, intercom, comment}` shape via
the Yandex map picker — the backend only needs to persist and use it.*
