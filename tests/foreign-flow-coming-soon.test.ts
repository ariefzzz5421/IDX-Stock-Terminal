import assert from "node:assert/strict";
import test from "node:test";
import { GET } from "../app/api/market/foreign-flow/route";

test("foreign-flow API clearly reports coming soon without fabricated flow", async () => {
  const response = await GET();
  assert.equal(response.status, 503);
  assert.equal(response.headers.get("cache-control"), "no-store");
  const payload = await response.json();
  assert.equal(payload.available, false);
  assert.equal(payload.status, "coming_soon");
  assert.equal("topBuy" in payload, false);
  assert.equal("topSell" in payload, false);
});
