export const PRIVACY_PIN_HASH_KEY = "privacy_pin_hash";
export const PIN_MIN_LEN = 4;
export const PIN_MAX_LEN = 6;

export function validatePinFormat(pin: string): string | null {
  if (!/^\d+$/.test(pin)) {
    return "PIN must contain only digits";
  }
  if (pin.length < PIN_MIN_LEN || pin.length > PIN_MAX_LEN) {
    return `PIN must be ${PIN_MIN_LEN}–${PIN_MAX_LEN} digits`;
  }
  return null;
}
