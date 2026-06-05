#!/usr/bin/env node
/**
 * Integration tests for /api/settings/preferences
 * Run: node scripts/test-user-preferences.mjs
 * Requires dev server + logged-in session cookie or test env.
 */

const BASE = process.env.TEST_BASE_URL ?? "http://localhost:3000";

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    passed++;
    console.log(`  ✓ ${message}`);
  } else {
    failed++;
    console.error(`  ✗ ${message}`);
  }
}

async function fetchJson(path, init) {
  const res = await fetch(`${BASE}${path}`, init);
  const json = await res.json().catch(() => ({}));
  return { res, json };
}

async function main() {
  console.log("User preferences API tests\n");

  const { res: getRes, json: getJson } = await fetchJson(
    "/api/settings/preferences"
  );
  assert(
    getRes.status === 401 || getRes.status === 200,
    `GET returns 401 (unauth) or 200 (auth), got ${getRes.status}`
  );

  if (getRes.status === 200) {
    assert(
      typeof getJson.preferences === "object",
      "GET returns preferences object"
    );
    assert(
      typeof getJson.preferences.moneyVisibleByDefault === "boolean",
      "preferences include moneyVisibleByDefault"
    );
    assert(
      typeof getJson.preferences.defaultMaxPhotoSelection === "number",
      "preferences include defaultMaxPhotoSelection"
    );

    const { res: patchRes, json: patchJson } = await fetchJson(
      "/api/settings/preferences",
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ defaultCalendarView: "list" }),
      }
    );
    assert(patchRes.status === 200, `PATCH partial update returns 200`);
    assert(
      patchJson.preferences?.defaultCalendarView === "list",
      "PATCH applies defaultCalendarView"
    );

    await fetchJson("/api/settings/preferences", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ defaultCalendarView: "month" }),
    });
  } else {
    console.log("  (skipped authenticated PATCH tests — not logged in)");
  }

  const { res: badRes } = await fetchJson("/api/settings/preferences", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: "not-json",
  });
  assert(badRes.status === 401 || badRes.status === 400, "PATCH rejects invalid JSON");

  console.log(`\n${passed} passed, ${failed} failed`);
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
