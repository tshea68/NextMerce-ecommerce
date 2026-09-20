import assert from "node:assert/strict";
import test from "node:test";

import { shouldPushSpaPageView } from "../lib/spaPageView.ts";

test("SPA page views skip initial mount and fire once per later pathname", () => {
  let previousPath = null;
  let pushes = 0;

  const visit = (pathname) => {
    if (shouldPushSpaPageView(previousPath, pathname)) pushes += 1;
    previousPath = pathname;
  };

  visit("/");
  assert.equal(pushes, 0, "initial mount must use only the base Google tag");

  visit("/");
  assert.equal(pushes, 0, "query-only changes on the same pathname must not fire");

  visit("/grid");
  assert.equal(pushes, 1, "first client-side pathname navigation pushes once");

  visit("/grid");
  assert.equal(pushes, 1, "query-only changes on /grid must not fire");

  visit("/parts/ABC123");
  assert.equal(pushes, 2, "a second pathname navigation adds one push");

  visit("/parts/ABC123");
  assert.equal(pushes, 2, "re-running the same pathname does not double fire");
});
