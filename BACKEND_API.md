# Smart Food customer API — implemented frontend contract

This document describes the API consumed by this repository. It is a concise companion to the canonical server reference in `alpha_pos_server/smartfood/CUSTOMER_WEBAPP_API.md`; when changing the backend contract, update both.

## Production base and transport

- Mini App: `https://delivery.78.111.90.65.nip.io/webapp/`
- Customer API: `https://delivery.78.111.90.65.nip.io/api/smartfood`
- Managed media: relative URLs below `/api/smartfood/media/...`, resolved on the same `delivery.` origin
- Backend upstream behind nginx: `https://pos.78.111.90.65.nip.io`

The checked-in production build uses `VITE_API_BASE=/api/smartfood`; nginx proxies that path to `BACKEND_ORIGIN`. This avoids credentialed CORS. A full absolute API base is supported for deliberate direct-backend builds.

All JSON endpoints omit a trailing slash. Money is integer UZS. Dates are ISO 8601. There is no server cart and no customer-list pagination.

## Authentication and envelopes

Send the unmodified `window.Telegram.WebApp.initData` once:

```http
POST /auth
Content-Type: application/json

{"init_data":"<raw Telegram query string>"}
```

Login returns HTTP 200 with `data.token`; subsequent requests use `Authorization: Bearer <token>`. The frontend persists the token through its session layer and retries authentication once after a 401 when fresh `initData` is available.

Success:

```json
{"success":true,"message":"Success","data":{}}
```

The client branches in this order:

1. `{"success":false,"closed":true,"reason":"bot_off"|"no_cashier"}` is a closed state even though HTTP is 200.
2. A failure with top-level `code` is a cart/order conflict (`item_unavailable`, `min_order`, `topping_*`, `invalid_client_order_id`, `idempotency_conflict`, and related codes).
3. Other non-2xx or `success:false` responses are API errors. Framework errors may use `{status,status_code,success,data,meta}` instead of a top-level `message`.
4. Fetch failures are network errors.

## Endpoint map

All routes except `/auth` and public managed-media GETs require the customer bearer.

| Method | Route | Use |
|---|---|---|
| POST | `/auth` | Telegram `initData` login |
| POST | `/auth/logout` | invalidate the current session |
| POST | `/analytics/visit` | best-effort idempotent boot event with `{client_visit_id: UUID}` |
| GET/PATCH | `/me` | confirmed identity, language, and broadcast opt-in |
| GET | `/config` | store state, delivery rules, loyalty flags, support |
| GET | `/catalog/categories` | customer-visible categories |
| GET | `/catalog/products` | customer-visible products; `?category_id&tag&q&lang` |
| GET | `/catalog/products/:id` | detail, sizes, and topping groups |
| GET | `/banners` | scheduled Home content; `?lang` |
| POST | `/cart/quote` | authoritative cart validation/pricing |
| POST | `/orders` | retry-safe order create |
| GET | `/orders` | order list; `?status=active|history` |
| GET | `/orders/:id` | owned order detail |
| GET | `/orders/:id/track` | polling contract |
| POST | `/orders/:id/cancel` | cancel raw `PENDING` order only |
| GET/POST | `/addresses` | list/create; create requires line and coordinates |
| PUT/DELETE | `/addresses/:id` | update/delete; resulting address must retain coordinates |
| PUT | `/addresses/:id/default` | set default |
| GET | `/geo/reverse` | `?lat&lng&lang` |
| GET | `/geo/forward` | `?q&lang&limit` |
| GET | `/loyalty` | balance, rates, history, active redemption codes |
| GET | `/rewards` | personalized reward catalog; `?lang` |
| POST | `/rewards/:id/redeem` | atomic point exchange and code issue |
| GET | `/redemptions` | recent redemptions |
| GET | `/support` | contacts and FAQ |
| GET/POST | `/support/tickets` | list/open threads |
| POST | `/support/tickets/:id/messages` | append customer message |

## Config and independent loyalty modes

Relevant `GET /config` payload:

```json
{
  "enabled": true,
  "currency": "UZS",
  "delivery_fee": 15000,
  "free_delivery_threshold": 150000,
  "min_order_amount": 30000,
  "default_tip_options": [0, 5000, 10000],
  "supported_languages": ["uz", "ru", "en"],
  "default_language": "uz",
  "feature_flags": {
    "loyalty": true,
    "loyalty_earning": false,
    "loyalty_spending": true,
    "card_payments": false,
    "scheduled_delivery": false
  },
  "support": {"phone":"","telegram":"","email":""}
}
```

`loyalty_earning` and `loyalty_spending` are independent. `loyalty` is the compatibility OR of the two. The frontend falls back to the legacy flag only when a specific flag is absent. Checkout spending is also gated by a positive `/loyalty.data.earn_rate.point_value_uzs`.

Earning uses `loyalty_earn_per` server-side: one point per configured UZS of subtotal, with zero meaning off. Checkout spending uses `loyalty_point_value`: UZS removed per point, capped by the balance and subtotal, with zero meaning off. Quote/order `loyalty_points_earned` is a preview; actual earning settles only after the linked POS order is completed and authoritatively paid.

Smart Club reward redemption does not depend on `loyalty_point_value`; it always uses a reward's `points_cost`.

## Profile, language, and notification preference

`GET /me` returns separate `first_name`/`last_name`, canonical `phone`,
`profile_complete`, `profile_missing`, `profile_confirmed_at`,
`broadcast_opted_in`, and `telegram_reachable` in addition to the resolved `name`,
language, photo, and points.

Checkout requires non-empty separate names, a canonical Uzbekistan phone
(`998` plus nine digits), and explicit confirmation. Send the resulting values in
one atomic PATCH:

```json
{
  "first_name": "Ali",
  "last_name": "Valiyev",
  "phone": "998901234567",
  "confirm": true
}
```

Changing either name or phone invalidates the previous confirmation unless the
same request reconfirms. `POST /orders` returns 422 `profile_required` when the
account is incomplete and `profile_phone_mismatch` if a supplied compatibility
phone differs from `/me.phone`.

Until the customer explicitly chooses a language, login follows Telegram
`language_code`; unknown/missing codes become Uzbek. `PATCH /me {language}`
persists an explicit `uz|ru|en` choice so later Telegram login does not replace
it. `PATCH /me {broadcast_opted_in:boolean}` is the server-owned Promotions
preference. Order-status messages remain operational and are not controlled by
that switch.

## Exact catalog availability

Categories are returned only when their Telegram shadow is published and selling and the POS category is not deleted.

Products are returned/openable only when:

- the Telegram product shadow is published and selling;
- the canonical POS product is not deleted;
- its Telegram category shadow exists, is published, and is selling.

List responses silently omit anything else. Detail returns 404 `Product not found`. Quote and create repeat the same validation, so cached cart data cannot bypass a stop. `available` is normally true on returned product rows because filtering happened first.

Catalog category/list/detail routes remain authenticated and available while
`config.enabled` is false. The UI renders the current menu under closed-ordering
copy; `bot_off` applies to quote and genuinely new order creation.

Product/category IDs are canonical POS IDs. Size, topping-group, topping, reward, redemption, banner, and Smart Food order IDs are Smart Food-local.

## Home banners

`GET /banners?lang=en` returns:

```json
{
  "items": [{
    "id": 4,
    "title": "Today's pick",
    "subtitle": "Open the menu",
    "image_url": "/api/smartfood/media/banners/<uuid>.webp",
    "action_type": "CATALOG",
    "product_id": null
  }]
}
```

The server includes only active rows with non-empty images where `starts_at` is null or `<= now`, `ends_at` is null or `> now`, and a `PRODUCT` destination is still customer-visible. Ordering is `sort_order`, then ID. Actions are `NONE`, `CATALOG`, `PRODUCT`, and `LOYALTY`. This endpoint is authenticated but not bot-open gated; the UI decides whether Home content is rendered while ordering is closed.

## Rewards and redemptions

`GET /loyalty` returns balance, member ID, both rates, up to 50 ledger rows, and currently issued redemptions. `GET /rewards` returns the viewer balance plus public catalog items:

```json
{
  "points": 240,
  "items": [{
    "id": 9,
    "name": "Free dessert",
    "names": {"uz":"...","ru":"...","en":"Free dessert"},
    "description": "Show the code at the counter",
    "kind": "CUSTOM",
    "points_cost": 100,
    "image_url": "/api/smartfood/media/rewards/<uuid>.png",
    "discount_amount": null,
    "product_id": null,
    "in_stock": true,
    "affordable": true,
    "limit_reached": false,
    "can_redeem": true
  }]
}
```

Global catalog inclusion requires an active reward with `points_cost > 0`, remaining/unlimited stock, and valid kind-specific setup. `FREE_PRODUCT` additionally requires its product and category to satisfy the exact catalog rules; `DISCOUNT` requires a positive UZS amount. `FREE_DELIVERY` and `CUSTOM` require no linked product.

`stock = null` is unlimited. `per_customer_limit = 0` is unlimited. Canceled redemptions do not count toward the customer limit. A limit-reached reward remains in the response with `limit_reached:true` and `can_redeem:false`; out-of-stock rewards are omitted globally.

`POST /rewards/:id/redeem` locks the customer/reward, revalidates all rules, decrements finite stock, deducts points in the ledger, and returns HTTP 201:

```json
{"redemption":{"id":31,"code":"GIFT-ABC234","reward_name":"Free dessert","kind":"CUSTOM","points_spent":100,"status":"ISSUED","created_at":"...","fulfilled_at":null}}
```

Expected 400 messages cover insufficient points, stock exhaustion, reached limit, unavailable linked product, and malformed reward configuration; missing/inactive reward is 404 `Gift not found`.

## Media contract and UI failure behavior

Managed product, banner, reward, and broadcast uploads are operator-only. The
server fully decodes actual JPEG, PNG, or WebP content up to 8 MB. Recommended
sizes are 1200×900 (product), 1440×720 (banner), 800×800 (reward), and 1200×628
(broadcast). Broadcast photos additionally enforce Telegram geometry
(`width + height <= 10000`, aspect ratio at most 20:1); WebP is converted to JPEG
and must remain under 8 MB after conversion.

Managed URLs are immutable UUID filenames and public GET responses carry one-year immutable caching plus `nosniff`. Unknown/unsafe filenames or missing files return 404. A storage write failure returns 503 with safe retry copy and does not replace the database URL; replacing/removing cleans up only service-managed files, never arbitrary external URLs.

Frontend behavior is intentionally resilient:

- failed Home banner requests clear optional banners; failed banner images remove only that card and allow the free-delivery fallback;
- product list/card/detail images fall back to generated food art when absent or broken;
- reward images are optional, and broken images are hidden so the reward-kind emoji remains;
- reward/banner availability comes from the JSON record, not from whether the browser could paint its image.

## Checkout invariants

The cart body uses `{product_id, size_id?, topping_ids?, quantity}`. Server quote/create ignore client prices and re-evaluate products, sizes, toppings, minimum order, delivery fee, tips, and points.

Create and persist a UUID `client_order_id` before the first order request. Retry the identical normalized payload with the same UUID after timeout/reload; a first create returns 201 and a replay returns the original order with 200. Reusing it for changed checkout data returns 409 `idempotency_conflict`.

DELIVERY requires an owned address with a non-blank line and valid pinned
coordinates. Address create/update validates text lengths, finite latitude in
`[-90,90]`, and longitude in `[-180,180]`. A legacy row without a pin returns
`location_required` at checkout. Successful creation freezes both
`address_text` and `address_location`; these snapshots remain authoritative after
the saved address changes or is deleted.

New orders can return HTTP 200 closed reason `no_cashier`; browsing and quote remain available. Render `effective_status`, not raw `status`, because dispatched Smart Food orders follow the linked POS state through `PREPARING`, `READY`, `COMPLETED`, or `CANCELED`.

Placed, dispatched, preparing, ready, completed, canceled, and rejected Telegram
updates are written to a localized durable outbox. The isolated message worker
preserves per-order event order and retries delivery; WebSocket plus `/track`
remain the authoritative customer state.

## Address UX and recovery

The shipped client preserves a last-known address list when refresh fails and
shows an explicit retryable stale warning. A successful create/update keeps the
returned canonical record locally even if its follow-up list refresh fails, while
delete updates local truth before attempting refresh. Deep-linked edits show a
recoverable load error instead of silently opening an empty form; saves and
deletes keep visible progress/error state. Map selection can confirm a coordinate
even if reverse geocoding is delayed or unavailable, falling back to formatted
text or coordinates. Address and identity forms protect dirty work on browser,
Telegram, and in-app navigation.

## Deployment checklist

- Build with `VITE_API_BASE=/api/smartfood` for same-origin production.
- Set nginx `BACKEND_ORIGIN=https://pos.78.111.90.65.nip.io` (or the deployment's POS origin).
- Set backend `CUSTOMER_WEBAPP_URL=https://delivery.78.111.90.65.nip.io/webapp/` and synchronize the Telegram menu button to the same URL.
- Attach the webapp as `delivery-webapp` and Django as `alpha-web` on the shared `edge` network; Caddy terminates TLS.
- Run the backend `bot`, `smartfood_dispatch`, and `smartfood_messages` services, apply migrations, configure `CUSTOMER_BOT_TOKEN`, enable ordering in runtime config, and set `SMARTFOOD_AUTO_DISPATCH=true` for automatic production dispatch. The webhook and poller are mutually exclusive update modes; both immediately offer the Mini App, remove the retired contact keyboard, and keep catalog entry available while ordering is closed.
- Verify `/healthz`, `/api/smartfood/config`, managed-media GETs, Telegram auth, and the public `/webapp/` route after deploy.
