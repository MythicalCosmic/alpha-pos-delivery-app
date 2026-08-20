/* ===== Smart Food — routing ===== */
import { createRouter, createWebHashHistory } from "vue-router";
import { store } from "./store.js";
import { completedAccountRedirect } from "./onboarding.js";

const routes = [
  { path: "/", redirect: "/home" },
  { path: "/home", name: "home", component: () => import("./views/HomeView.vue"), meta: { tab: "home" } },
  { path: "/categories", name: "categories", component: () => import("./views/CategoriesView.vue"), meta: { tab: "cats" } },
  { path: "/favorites", name: "favorites", component: () => import("./views/FavoritesView.vue"), meta: { tab: "fav" } },
  { path: "/orders", name: "orders", component: () => import("./views/OrdersView.vue"), meta: { tab: "orders" } },
  { path: "/settings", name: "settings", component: () => import("./views/SettingsView.vue"), meta: { tab: "settings" } },
  { path: "/food/:id", name: "detail", component: () => import("./views/DetailView.vue"), meta: { pushed: true, hideNav: true } },
  { path: "/cart", name: "cart", component: () => import("./views/CartView.vue"), meta: { pushed: true, hideNav: true } },
  { path: "/checkout", name: "checkout", component: () => import("./views/CheckoutView.vue"), meta: { pushed: true, hideNav: true } },
  { path: "/checkout/account", name: "account-setup", component: () => import("./views/AccountSetupView.vue"), meta: { pushed: true, hideNav: true } },
  { path: "/tracking/:id", name: "tracking", component: () => import("./views/TrackingView.vue"), meta: { pushed: true, hideNav: true } },
  { path: "/loyalty", name: "loyalty", component: () => import("./views/LoyaltyView.vue"), meta: { pushed: true } },
  { path: "/themes", name: "themes", component: () => import("./views/ThemesView.vue"), meta: { pushed: true, hideNav: true } },
  { path: "/profile", name: "profile", component: () => import("./views/ProfileView.vue"), meta: { pushed: true, hideNav: true } },
  { path: "/addresses", name: "addresses", component: () => import("./views/AddressesView.vue"), meta: { pushed: true, hideNav: true } },
  { path: "/address/edit/:id?", name: "address-edit", component: () => import("./views/AddressEditView.vue"), meta: { pushed: true, hideNav: true } },
  { path: "/payments", name: "payments", component: () => import("./views/PaymentsView.vue"), meta: { pushed: true, hideNav: true } },
  { path: "/notifications", name: "notifications", component: () => import("./views/NotificationsView.vue"), meta: { pushed: true, hideNav: true } },
  { path: "/support", name: "support", component: () => import("./views/SupportView.vue"), meta: { pushed: true, hideNav: true } },
  { path: "/:pathMatch(.*)*", redirect: "/home" },
];

export const router = createRouter({
  // hash history keeps the app working when hosted from any static path (incl. Telegram)
  history: createWebHashHistory(),
  routes,
  scrollBehavior() { return { top: 0 }; },
});

router.beforeEach((to) => {
  const completedTarget = completedAccountRedirect({
    bootState: store.bootState,
    routeName: to.name,
    customer: store.me,
    returnTo: to.query.return,
  });
  if (completedTarget) {
    return { path: completedTarget, replace: true };
  }
  if (
    to.name === "checkout" &&
    store.bootState === "ready" &&
    !store.browser &&
    store.me &&
    !store.me.profileComplete
  ) {
    return {
      name: "account-setup",
      query: { return: to.fullPath },
      replace: true,
    };
  }
  return true;
});
