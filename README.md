# Smart Food — Telegram Mini App

A premium food-delivery **Telegram WebApp** built with **Vue 3 + Vite + Vue Router**, recreated pixel-for-pixel from the Claude Design handoff. Dark-violet / hot-pink aesthetic, full clickable flow, three languages, light/dark themes, and an in-app theme studio.

## Run it

```bash
npm install
npm run dev        # dev server  → http://localhost:5173
npm run build      # production build → dist/
npm run preview    # serve the production build
```

Open the printed URL in a browser, or host `dist/` and set it as your bot's Mini App URL in **@BotFather**.

## Environment

Copy `.env.example` → `.env` and set:

```bash
VITE_YANDEX_MAPS_KEY=your-yandex-maps-js-api-key   # JavaScript API + Geocoder
VITE_API_BASE=/api/v1                              # backend base URL
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

## Backend

The app currently runs on **mock data** (see `src/data/` + `src/store.js`). Every API the
real backend must provide — auth, catalog, cart, checkout, orders, tracking, payments,
loyalty, addresses, and the Yandex geocoding proxy — is fully specified in
**[`BACKEND_API.md`](./BACKEND_API.md)**.

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

## Structure

```
src/
  main.js            app entry
  App.vue            fullscreen shell: theme vars, router-view, cart bar, nav
  router.js          hash routes (tab screens + pushed screens)
  store.js           reactive store (cart, favorites, orders, theme tweaks) + persistence
  telegram.js        Telegram Mini App SDK helpers (guarded)
  data/              strings (i18n) + food catalog
  components/        Icon, FoodArt, cards, nav, splash, QR, etc.
  views/             one component per page
  styles/            design tokens + component CSS (ported from the design system)
```
