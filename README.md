# Smart Food — Telegram Mini App

The live Vue 3 + Vite customer app for Alpha POS delivery. It authenticates Telegram `initData`, reads the `/api/smartfood` API, browses the POS-backed catalog, quotes and submits retry-safe orders, tracks fulfillment, manages addresses, and exposes Smart Club points, rewards, and redemption codes.

## Run locally

```bash
cp .env.example .env
npm ci
npm run dev       # http://localhost:5173
npm run build     # dist/
npm run preview
```

The default API base is the same-origin path `/api/smartfood`. In development, Vite proxies that path to `VITE_DEV_API_TARGET` (checked-in default: `https://pos.78.111.90.65.nip.io`). Important variables are:

```bash
VITE_API_BASE=/api/smartfood
VITE_DEV_API_TARGET=https://pos.78.111.90.65.nip.io
VITE_YANDEX_MAPS_KEY=your-yandex-maps-js-api-key
VITE_TRACK_POLL_MS=8000
VITE_ALLOW_BROWSER=1
# VITE_DEV_INIT_DATA=...   # optional captured Telegram initData for local auth
```

Restrict the public Yandex JavaScript key by HTTP Referer to the Mini App domain. Set `VITE_ALLOW_BROWSER=0` for strict Telegram-only production gating. Plain-browser mode only probes reachability unless valid captured `initData` is supplied.

## Live feature surface

- Telegram `initData` to short-lived bearer session, one-shot reauthentication on 401, and best-effort idempotent visit tracking.
- Telegram-derived language on first use (unknown → Uzbek), with explicit customer choices persisted locally and to the server.
- Published/selling categories and products with multilingual copy, current POS prices, sizes, topping groups, search, favorites, and local cart state; browsing stays available while ordering is closed.
- Server-authoritative quote, confirmed separate first/last names and canonical Uzbekistan phone, mandatory pinned delivery coordinates, minimum/free-delivery rules, tips, point discounts, UUID checkout idempotency, connected-till gating, cancellation, order history, and tracking polling.
- Precise Yandex-backed addresses with recoverable load/write/delete errors, stale-list preservation, unsaved-edit protection, and customer support/tickets.
- Required localized order-status Telegram notifications plus a server-backed opt-in for optional promotional broadcasts.
- Operator-managed 2:1 Home banners and Smart Club reward catalog/redemption.

The current route contract and payload notes are in [BACKEND_API.md](BACKEND_API.md). The full server-owned reference is `alpha_pos_server/smartfood/CUSTOMER_WEBAPP_API.md`.

## Banners

`GET /banners?lang=...` returns only banners that are active, have an image, have started (or no start), have not ended (or no end), and have a still-visible destination when the action is `PRODUCT`. The Home screen renders them in server sort order and supports:

- `NONE` — image/copy only
- `CATALOG` — open Categories
- `PRODUCT` — open `/food/:product_id`
- `LOYALTY` — open Smart Club

The app refreshes banners on Home mount, every 60 seconds, when the page becomes visible again, and after a language change. A banner request failure is non-blocking and clears optional banner content. A broken banner image removes that card for the current view; when no working banner remains, the configured free-delivery promotion is shown when a threshold exists.

## Catalog availability

A product exists in customer list/detail only when all of these are true:

1. its Telegram product shadow is published and selling;
2. its canonical POS product is not deleted;
3. its Telegram category shadow is published and selling.

Stopped/unpublished categories and products are absent, and a previously cached detail returns 404. A complete catalog refresh reconciles cart lines, favorites, and detail cache: missing products are marked unavailable, cannot be added/submitted, and are revalidated again by quote/order endpoints.

Product photos are optional. Catalog cards/rows and product detail use deterministic `FoodArt` when a URL is empty or the image fails to load. Cart and checkout snapshots currently switch to `FoodArt` only when their stored URL is empty. Category tiles intentionally use generated category art rather than `image_url`.

The category screen keeps the catalog visible under a closed-ordering banner.
`BotConfig.enabled` gates quote/new-order actions, not menu discovery.

## Checkout identity and delivery location

Checkout routes incomplete customers through a dedicated account step. First name,
last name, and phone are separate fields; the phone is normalized to canonical
`998XXXXXXXXX`, and the frontend sends `confirm:true`. Editing those values later
reconfirms the resulting identity. The server remains authoritative through
`profile_complete`, `profile_missing`, `profile_required`, and
`profile_phone_mismatch`.

Every delivery address requires a map pin. Checkout distinguishes loading, a hard
address-list failure, stale cached addresses, no address, and a legacy address
without coordinates; `location_required` returns the customer to that address's
map step. A successful address write is retained locally if the follow-up refresh
fails, avoiding duplicate creation. Edit/profile forms guard unsaved changes across
in-app, browser, and Telegram closing navigation. An accepted order freezes both
`address_text` and `address_location`, so later address edits or deletion do not
alter courier/order history.

## Telegram notifications

Order status messages are always operational. The Promotions switch updates
`PATCH /me {broadcast_opted_in}` and rolls back visually if the server save fails;
it is not a local-only toggle. The server also tracks Telegram reachability and
excludes blocked/unreachable or opted-out accounts from broadcast audiences.

## Loyalty and rewards

Earning and checkout spending are independent capabilities:

- `feature_flags.loyalty_earning` follows the configured spend required to earn one point; zero disables only earning.
- `feature_flags.loyalty_spending` plus a positive `earn_rate.point_value_uzs` controls applying points as a checkout discount; zero disables only checkout spending.
- the legacy `feature_flags.loyalty` is true when either capability is on and is used only as a compatibility fallback when the specific flags are absent.

Smart Club reward exchange is separate from checkout spending. `GET /rewards` supplies the viewer's balance and active, valid, in-stock choices. Each item carries `affordable`, `limit_reached`, and authoritative `can_redeem`; reaching a per-customer limit keeps the reward visible but disables redemption. A two-tap confirmation calls `POST /rewards/:id/redeem`, deducts the reward's `points_cost`, decrements finite stock, and returns a `GIFT-...` code. The app then refreshes the balance, active codes, and reward flags.

Reward art is optional; an absent or broken reward image leaves the reward-kind emoji visible. Reward types are custom gift, free product, UZS discount, and free delivery. Free-product rewards disappear when their linked product or category stops being customer-visible.

## API failure model

The HTTP client checks responses in this order:

1. HTTP 200 `closed:true` (`bot_off` or new-checkout `no_cashier`) becomes `ClosedError`.
2. A failure with top-level `code` becomes `ConflictError` for cart/order remediation.
3. Other API/framework failures become `ApiError`; network/DNS/CORS/TLS failures become `NetworkError`.

The cart is client-owned, but prices and availability are not. Never trust snapshot prices; quote and create both reprice against the server. Persist one `client_order_id` with an unchanged checkout attempt and reuse it after an ambiguous response; generate a new UUID when the payload changes.

## Production deployment

The production bundle is served by nginx under `/webapp/`, with `/api/smartfood/` reverse-proxied to the backend on the same customer origin.

- Canonical Mini App: `https://delivery.78.111.90.65.nip.io/webapp/`
- Same-origin customer API/media: `https://delivery.78.111.90.65.nip.io/api/smartfood`
- Backend upstream: `https://pos.78.111.90.65.nip.io`
- Admin console: `https://alpha-pos-admin.78.111.90.65.nip.io`

```bash
BACKEND_ORIGIN=https://pos.78.111.90.65.nip.io ./deploy.sh --compose
```

Compose builds with `VITE_API_BASE=/api/smartfood`, joins the external `edge` network as `delivery-webapp`, exposes container port 80 through `WEBAPP_PORT` (8080 by default), and receives HTTPS from Caddy. The backend `CUSTOMER_WEBAPP_URL` and Telegram menu button must use the canonical `/webapp/` URL exactly.

## Verification

```bash
npm test
npm run build
```

The source-of-truth integration layers are `src/api/`, `src/store.js`, and the server API. Favorites, theme choices, non-promotional convenience settings, and the cart remain client-owned; catalog, config, banners, orders, addresses, loyalty, rewards, support, profile, language override, and promotional opt-in are live server data.
