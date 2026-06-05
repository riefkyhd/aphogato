import "server-only";
import bcrypt from "bcryptjs";

export { PRIVACY_PIN_HASH_KEY, PIN_MIN_LEN, PIN_MAX_LEN } from "@/lib/privacy/constants";
export { validatePinFormat } from "@/lib/privacy/constants";

const BCRYPT_ROUNDS = 10;

export async function hashPin(pin: string): Promise<string> {
  return bcrypt.hash(pin, BCRYPT_ROUNDS);
}

export async function verifyPin(pin: string, hash: string): Promise<boolean> {
  if (!hash) return false;
  return bcrypt.compare(pin, hash);
}
