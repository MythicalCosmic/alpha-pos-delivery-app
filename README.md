# Smart Food — Telegram Mini App

A premium food-delivery **Telegram WebApp** built with **Vue 3 + Vite + Vue Router**, recreated pixel-for-pixel from the Claude Design handoff. Dark-violet / hot-pink aesthetic, full clickable flow, three languages, light/dark themes, and an in-app theme studio.

## Run it

```bash
npm install
npm run dev        # dev server  → http://localhost:5173
npm run build      # production build → dist/
npm run preview    # serve the production build
```

The app talks to the live **Smart Food customer API** (`/api/smartfood`). In dev,
Vite proxies that path to a backend (`VITE_DEV_API_TARGET`) so the browser stays
same-origin.

**Opening in a plain browser (no Telegram).** By default (`VITE_ALLOW_BROWSER=1`)
the app boots outside Telegram, **probes the live backend** and shows a small
badge: _API connected_ (reachable), _API reachable · sign in via Telegram_ (the
backend answered but the call needs a Telegram-signed session — i.e. the API
works), or _API not responding_ (unreachable). To exercise the **authenticated**
flow from a browser, supply a captured `initData` — either `VITE_DEV_INIT_DATA`
in `.env` or per-visit via the URL: `…/#/home?init_data=<captured-string>`. Set
`VITE_ALLOW_BROWSER=0` to restore the strict "open from Telegram" gate.

## Environment

Copy `.env.example` → `.env` and set:

```bash
VITE_YANDEX_MAPS_KEY=your-yandex-maps-js-api-key       # JavaScript API + Geocoder
VITE_API_BASE=/api/smartfood                           # customer API base (same-origin path)
VITE_DEV_API_TARGET=https://pos.78.111.90.65.nip.io    # dev proxy target for /api/smartfood
# VITE_DEV_INIT_DATA=...                                # optional: test auth from a desktop browser
```

The Yandex key must have **"JavaScript API and Geocoder API"** enabled in the
[Yandex cabinet](https://developer.tech.yandex.ru/services). Client map keys are public by
design — restrict the key by **HTTP-Referer** to your Mini App domain.

## Maps & precise addresses (Yandex)

Delivery addresses are pinned on a real **Yandex map** so couriers reach the exact building:

- **`src/maps.js`** — loads the Yandex JS API 2.1 once, exposes `reverseGeocode`/`forwardGeocode`.
- **`MapPicker.vue`** — full-screen picker with a fixed centre pin (the map moves under it),
  "my location" (Telegram `LocationManager` → browser geolocation fallback), address search,
  and a live precision badge (*Pinpoint* vs *Approximate*).
- **`AddressEditView.vue`** — map pin + door-level fields (apartment, entrance, floor,
  intercom, courier note).
- **`MiniMap.vue`** — read-only map preview shown on the address list and at checkout.

Each saved address now carries `{ lat, lng, precision, street, house, apartment, entrance,
floor, intercom, comment }` and that snapshot rides along on the order.

## Backend integration

The app is wired to the live **Smart Food customer API** under the `/api/smartfood` prefix.
The implemented contract — auth handshake, envelope/closed/conflict semantics, every
endpoint and payload shape — is realized in `src/api/` (the code is the source of truth).

> ⚠️ The committed [`BACKEND_API.md`](./BACKEND_API.md) describes an **older `/api/v1`
> design** (categories at `/categories`, sizes via `mult`, `extras[]`, `data.user`, WSS
> tracking). The frontend now targets the newer **`/api/smartfood`** contract instead
> (`/catalog/categories`, sizes via `price_delta`, `topping_groups`, `data.customer`,
> `/orders/:id/track` polling). That doc is stale relative to this implementation.

The integration lives under `src/api/`:

| File | Role |
|---|---|
| `api/http.js` | Fetch wrapper + the envelope contract — branches **closed → conflict → error**, typed `ClosedError` / `ConflictError` / `ApiError` / `NetworkError`, bearer token. |
| `api/endpoints.js` | One thin function per customer route (§6). |
| `api/session.js` | Telegram `initData` → bearer handshake, token persistence, one-shot re-auth on 401. |
| `api/normalize.js` | Maps raw server dicts → view-models (keeps `names`/`descriptions` i18n maps; derives a `FoodArt` kind). |
| `api/index.js` | The `ds` data-source facade the store consumes (normalizes + wraps every call in the auth guard). |

`src/store.js` holds the reactive state and orchestrates it. The **cart is the only
client-owned state** — there is no server cart, so it's kept locally and priced via
`POST /cart/quote`. Catalog, orders, tracking, addresses, loyalty, support and profile
are all live. Favorites, saved cards and notification toggles are local-only (no backend
endpoint exists for them; the launch is cash-only).

The UI handles every gating state from the guide: **store closed** (`bot_off`),
**no cashier** at checkout (`no_cashier`), cart/order **conflict codes**
(`item_unavailable`, `min_order`, `topping_*`, …), below-minimum orders, delivery without
an address, and session expiry.

## What's inside

**Pages (all working, full flow):**
- **Splash** — animated logo, orbiting food tiles, aurora glow, loading bar
- **Home** — location header, search, category chips, 50%-off promo, "Popular" rail, recommended feed
- **Categories** — big category tiles + filtered list
- **Favorites** — saved dishes (tap ♥ anywhere)
- **Orders** — Active / History segments with live status timeline; reorder & track
- **Settings** — profile/loyalty card, language, **theme studio** (dark toggle, accent colors, home layout, display font, card radius)
- **Detail** — size, extras, quantity, live total → add to cart
- **Cart** — free-delivery meter, unified bag, upsell rail, `SMART50` promo, ticket receipt
- **Checkout** — order summary, address + map strip, courier note, time slots, payment, tips
- **Tracking** — animated map with riding scooter, ETA, courier card, status timeline
- **Loyalty (Smart Club)** — membership card, branded QR, redeemable rewards

**Features:**
- 🇺🇿 Uzbek-first i18n with 🇬🇧 English + 🇷🇺 Russian, prices in so'm
- 🌗 Dark/light themes + 5 accent colors, persisted to `localStorage`
- ✨ Entrance/press/route animations (honors `prefers-reduced-motion`)
- 📱 Real **Telegram WebApp SDK** wiring: `expand()`, theme-synced header, native **BackButton**, **haptic feedback** — all no-ops in a normal browser

## Deploy (Docker)

The Mini App ships as static files served by **nginx**, which also reverse-proxies
`/api/smartfood` to the backend on the **same origin** (so the bearer transport needs no
CORS — see `BACKEND_API.md` §D). The app is served at **`/webapp/`** to match the
backend's `CUSTOMER_WEBAPP_URL = https://<host>/webapp/`.

```bash
# one-shot build + run (parameterized via env)
BACKEND_ORIGIN=https://your-backend WEBAPP_PORT=8080 ./deploy.sh
#   -> http://localhost:8080/webapp/   (health: /healthz)

# or with docker compose
BACKEND_ORIGIN=https://your-backend docker compose up -d --build
```

| Var | Default | Purpose |
|---|---|---|
| `BACKEND_ORIGIN` | `https://pos.78.111.90.65.nip.io` | origin `/api/smartfood` is proxied to |
| `WEBAPP_PORT` | `8080` | host port (container listens on 80) |
| `VITE_API_BASE` | `/api/smartfood` | API base baked into the bundle |
| `VITE_YANDEX_MAPS_KEY` | – | Yandex JS Maps + Geocoder key (baked at build) |

After deploy: front it with public HTTPS, set the backend `CUSTOMER_WEBAPP_URL` and the
@BotFather Mini App URL to `https://<host>/webapp/`, and restrict the Yandex key by
HTTP-Referer to that domain.

## Structure

```
src/
  main.js            app entry
  App.vue            fullscreen shell: boot gate, theme vars, router-view, cart bar, nav
  router.js          hash routes (tab screens + pushed screens)
  store.js           reactive store + actions (boot, catalog, cart/quote, orders, addresses…)
  api/               live /api/smartfood client: http, endpoints, session, normalize, ds facade
  telegram.js        Telegram Mini App SDK helpers (guarded) — initData, haptics, back button
  util.js            small date/time formatters
  data/              strings (i18n) + presentation helpers
  components/        Icon, FoodArt, cards, nav, splash, QR, StatusScreen, etc.
  views/             one component per page
  styles/            design tokens + component CSS (ported from the design system)
```

Docker/deploy: `Dockerfile` (multi-stage build → nginx), `nginx.conf` (SPA + API proxy
template), `docker-compose.yml`, `deploy.sh`.
