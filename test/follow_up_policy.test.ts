import assert from "node:assert/strict";
import test from "node:test";
import { decideFollowUp } from "../src/follow_up_policy.js";

test("an on-site work order without a technician note needs urgent contact", () => {
  assert.deepEqual(decideFollowUp("on_site", "  "), {
    priority: "urgent",
    nextAction: "contact_technician",
  });
});

test("a completed work order moves to closure", () => {
  assert.deepEqual(decideFollowUp("completed", "Repair verified"), {
    priority: "routine",
    nextAction: "close_work_order",
  });
});
