import assert from "node:assert/strict";
import test from "node:test";

import { shouldPushSpaPageView } from "../lib/spaPageView.ts";

test("SPA page views skip initial mount and fire once per later route", () => {
  let previousRoute = null;
  let pushes = 0;

  const visit = (route) => {
    if (shouldPushSpaPageView(previousRoute, route)) pushes += 1;
    previousRoute = route;
  };

  visit("/");
  assert.equal(pushes, 0, "initial mount must use only the base Google tag");

  visit("/parts");
  assert.equal(pushes, 1, "first client-side navigation pushes once");

  visit("/parts?page=2");
  assert.equal(pushes, 2, "query-string navigation pushes once");

  visit("/parts?page=2");
  assert.equal(pushes, 2, "re-running the same route does not double fire");

  visit("/cart");
  assert.equal(pushes, 3, "a second pathname navigation adds one push");
});
