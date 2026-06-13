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
