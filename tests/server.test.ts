import assert from "node:assert/strict";
import test from "node:test";

import { fetchCatalog } from "../src/server.js";

test("sends the PAT only to the Vilao key-list endpoint", async () => {
  const calls: Array<{ input: RequestInfo | URL; init?: RequestInit }> = [];
  const fetchFn = async (input: RequestInfo | URL, init?: RequestInit) => {
    calls.push({ input, init });
    return new Response(JSON.stringify({ data: [{
      id: "key-id",
      key_prefix: "sk-abcd...wxyz",
      active: true,
      subscriptions: [],
    }] }), { status: 200, headers: { "Content-Type": "application/json" } });
  };

  await fetchCatalog("pat-test", "sk-abcd-secret-wxyz", fetchFn);
  assert.equal(String(calls[0].input), "https://vilao.ai/api/v2/llm/keys");
  assert.equal((calls[0].init?.headers as Record<string, string>).Authorization, "Bearer pat-test");
});

test("returns a sanitized API error without credential values", async () => {
  const fetchFn = async () => new Response(JSON.stringify({ error: { message: "invalid token" } }), {
    status: 401,
    headers: { "Content-Type": "application/json" },
  });
  await assert.rejects(fetchCatalog("pat-secret", "sk-secret", fetchFn), (error: Error) => {
    assert.match(error.message, /invalid token/u);
    assert.doesNotMatch(error.message, /pat-secret|sk-secret/u);
    return true;
  });
});
