/**
 * Unit tests for privacy PIN hash/verify logic.
 * Run: node scripts/test-privacy-pin.mjs
 */
import bcrypt from "bcryptjs";

const PIN_MIN_LEN = 4;
const PIN_MAX_LEN = 6;

function validatePinFormat(pin) {
  if (!/^\d+$/.test(pin)) return "PIN must contain only digits";
  if (pin.length < PIN_MIN_LEN || pin.length > PIN_MAX_LEN) {
    return `PIN must be ${PIN_MIN_LEN}–${PIN_MAX_LEN} digits`;
  }
  return null;
}

async function hashPin(pin) {
  return bcrypt.hash(pin, 10);
}

async function verifyPin(pin, hash) {
  if (!hash) return false;
  return bcrypt.compare(pin, hash);
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
  console.log("Privacy PIN unit tests\n");

  assert(validatePinFormat("123") !== null, "rejects short PIN");
  assert(validatePinFormat("1234567") !== null, "rejects long PIN");
  assert(validatePinFormat("12ab") !== null, "rejects non-digits");
  assert(validatePinFormat("1234") === null, "accepts 4-digit PIN");
  assert(validatePinFormat("123456") === null, "accepts 6-digit PIN");

  const testPin = "4829";
  const wrongPin = "0000";
  const hash = await hashPin(testPin);
  assert(typeof hash === "string" && hash.startsWith("$2"), "hash looks like bcrypt");

  const ok = await verifyPin(testPin, hash);
  const bad = await verifyPin(wrongPin, hash);
  assert(ok === true, "verify correct PIN");
  assert(bad === false, "verify wrong PIN fails");

  console.log(`\n${passed} passed, ${failed} failed`);
  process.exit(failed > 0 ? 1 : 0);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
