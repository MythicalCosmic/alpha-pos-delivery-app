import test from "node:test";
import assert from "node:assert/strict";

import {
  accountSetupReturnPath,
  completedAccountRedirect,
} from "../src/onboarding.js";

test("a persisted complete profile bypasses a Telegram-restored setup URL", () => {
  assert.equal(completedAccountRedirect({
    bootState: "ready",
    routeName: "account-setup",
    customer: { profileComplete: true },
    returnTo: "/checkout",
  }), "/checkout");

  assert.equal(completedAccountRedirect({
    bootState: "loading",
    routeName: "account-setup",
    customer: { profileComplete: true },
    returnTo: "/checkout",
  }), null);

  assert.equal(completedAccountRedirect({
    bootState: "ready",
    routeName: "account-setup",
    customer: { profileComplete: false },
    returnTo: "/checkout",
  }), null);
});

test("completed onboarding cannot redirect to an unsafe or recursive setup URL", () => {
  assert.equal(accountSetupReturnPath("https://example.com"), "/checkout");
  assert.equal(accountSetupReturnPath("//example.com"), "/checkout");
  assert.equal(accountSetupReturnPath("/checkout/account?return=/checkout"), "/checkout");
  assert.equal(accountSetupReturnPath("/cart"), "/cart");
});
