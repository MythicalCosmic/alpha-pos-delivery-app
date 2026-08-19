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
- Published/selling categories and products with multilingual copy, current POS prices, sizes, topping groups, search, favorites, and local cart state.
- Server-authoritative quote, minimum/free-delivery rules, tips, point discounts, required UUID checkout idempotency, connected-till gating, cancellation, order history, and tracking polling.
- Precise Yandex-backed addresses with manual details and customer support/tickets.
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

The source-of-truth integration layers are `src/api/`, `src/store.js`, and the server API. Favorites, theme choices, notification toggles, and the cart remain client-owned; catalog, config, banners, orders, addresses, loyalty, rewards, support, and profile are live server data.
