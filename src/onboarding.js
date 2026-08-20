const DEFAULT_CHECKOUT_RETURN = "/checkout";

export function accountSetupReturnPath(value) {
  const target = typeof value === "string" ? value : DEFAULT_CHECKOUT_RETURN;
  if (!target.startsWith("/") || target.startsWith("//")) {
    return DEFAULT_CHECKOUT_RETURN;
  }
  // Never redirect a completed customer back into the setup screen, even if
  // an old Telegram WebView URL contains a recursive/malformed return value.
  if (target.startsWith("/checkout/account")) {
    return DEFAULT_CHECKOUT_RETURN;
  }
  return target;
}

export function completedAccountRedirect({ bootState, routeName, customer, returnTo }) {
  if (
    bootState !== "ready" ||
    routeName !== "account-setup" ||
    !customer?.profileComplete
  ) {
    return null;
  }
  return accountSetupReturnPath(returnTo);
}
