/**
 * Integration test for privacy PIN storage in settings table.
 * Run: node scripts/test-privacy-settings-integration.mjs
 */
import bcrypt from "bcryptjs";
import { createClient } from "@supabase/supabase-js";
import { readFileSync, existsSync } from "fs";
import { resolve } from "path";

const KEY = "privacy_pin_hash";
const TEST_PIN = "991122";

function loadEnvFile(path) {
  if (!existsSync(path)) return;
  const text = readFileSync(path, "utf8");
  for (const line of text.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const k = trimmed.slice(0, eq).trim();
    let v = trimmed.slice(eq + 1).trim();
    if (
      (v.startsWith('"') && v.endsWith('"')) ||
      (v.startsWith("'") && v.endsWith("'"))
    ) {
      v = v.slice(1, -1);
    }
    if (!process.env[k]) process.env[k] = v;
  }
}

loadEnvFile(resolve(process.cwd(), ".env.local"));
loadEnvFile(resolve(process.cwd(), ".env"));

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

async function getHash() {
  const { data, error } = await supabase
    .from("settings")
    .select("value")
    .eq("key", KEY)
    .maybeSingle();
  if (error) throw error;
  return data?.value ?? null;
}

async function setHash(hash) {
  const { error } = await supabase.from("settings").upsert({ key: KEY, value: hash });
  if (error) throw error;
}

async function removeHash() {
  const { error } = await supabase.from("settings").delete().eq("key", KEY);
  if (error) throw error;
}

let passed = 0;
let failed = 0;

function assert(condition, label) {
  if (condition) {
    passed += 1;
    console.log(`  ✓ ${label}`);
  } else {
    failed += 1;
    console.error(`  ✗ ${label}`);
  }
}

async function run() {
  console.log("Privacy settings integration tests\n");

  const before = await getHash();

  try {
    const hash = await bcrypt.hash(TEST_PIN, 10);
    await setHash(hash);

    const stored = await getHash();
    assert(stored === hash, "set PIN hash (first time)");

    const correct = await bcrypt.compare(TEST_PIN, stored);
    const wrong = await bcrypt.compare("0000", stored);
    assert(correct === true, "verify correct PIN against stored hash");
    assert(wrong === false, "verify wrong PIN fails");

    const pinEnabled = Boolean(stored);
    assert(pinEnabled === true, "privacy GET equivalent: pinEnabled true");

    await removeHash();
    const afterRemove = await getHash();
    assert(afterRemove === null, "remove PIN hash");
    assert(Boolean(afterRemove) === false, "privacy GET equivalent: pinEnabled false");
  } finally {
    if (before) {
      await setHash(before);
      console.log("\n  ↺ Restored previous privacy_pin_hash");
    } else {
      await removeHash();
      console.log("\n  ↺ Cleaned up test privacy_pin_hash row");
    }
  }

  console.log(`\n${passed} passed, ${failed} failed`);
  process.exit(failed > 0 ? 1 : 0);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
