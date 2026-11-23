import test from "node:test";
import assert from "node:assert/strict";
import { runCheck } from "../src/monitor.js";

test("unknown check types return a failed result instead of throwing", async () => {
  const result = await runCheck({ name: "bad", type: "other" });
  assert.equal(result.online, false);
  assert.match(result.error, /unknown check type/);
});

test("missing TCP service is reported offline", async () => {
  const result = await runCheck({ name: "closed port", type: "tcp", host: "127.0.0.1", port: 1 }, 300);
  assert.equal(result.online, false);
});
