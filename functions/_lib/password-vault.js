import { fromBase64Url, toBase64Url } from "./auth.js";

export const PASSWORD_ITERATIONS = 100000;

const encoder = new TextEncoder();
const decoder = new TextDecoder();
const UPPERCASE = "ABCDEFGHJKLMNPQRSTUVWXYZ";
const LOWERCASE = "abcdefghijkmnopqrstuvwxyz";
const DIGITS = "23456789";
const SYMBOLS = "!@#$%";
const PASSWORD_ALPHABET = `${UPPERCASE}${LOWERCASE}${DIGITS}${SYMBOLS}`;
const ADDITIONAL_DATA = encoder.encode("HAILI_PASSWORD_VAULT_V1");
const importedKeys = new Map();

function randomIndex(length) {
  const limit = 256 - (256 % length);
  const bytes = new Uint8Array(1);
  do crypto.getRandomValues(bytes); while (bytes[0] >= limit);
  return bytes[0] % length;
}

function randomCharacter(alphabet) {
  return alphabet[randomIndex(alphabet.length)];
}

export function generatePassword() {
  const characters = [
    randomCharacter(UPPERCASE),
    randomCharacter(LOWERCASE),
    randomCharacter(DIGITS),
    randomCharacter(SYMBOLS)
  ];
  while (characters.length < 18) characters.push(randomCharacter(PASSWORD_ALPHABET));
  for (let index = characters.length - 1; index > 0; index -= 1) {
    const swapIndex = randomIndex(index + 1);
    [characters[index], characters[swapIndex]] = [characters[swapIndex], characters[index]];
  }
  return characters.join("");
}

async function importVaultKey(encodedKey) {
  if (!encodedKey) throw new Error("Password vault key is not configured");
  if (!importedKeys.has(encodedKey)) {
    const rawKey = fromBase64Url(encodedKey);
    if (rawKey.byteLength !== 32) throw new Error("Password vault key must be 32 bytes");
    importedKeys.set(encodedKey, crypto.subtle.importKey("raw", rawKey, "AES-GCM", false, ["encrypt", "decrypt"]));
  }
  return importedKeys.get(encodedKey);
}

export async function encryptPassword(password, encodedKey) {
  const key = await importVaultKey(encodedKey);
  const iv = new Uint8Array(12);
  crypto.getRandomValues(iv);
  const ciphertext = await crypto.subtle.encrypt({ name: "AES-GCM", iv, additionalData: ADDITIONAL_DATA }, key, encoder.encode(password));
  return { ciphertext: toBase64Url(ciphertext), iv: toBase64Url(iv) };
}

export async function decryptPassword(ciphertext, iv, encodedKey) {
  const key = await importVaultKey(encodedKey);
  const plaintext = await crypto.subtle.decrypt({
    name: "AES-GCM",
    iv: fromBase64Url(iv),
    additionalData: ADDITIONAL_DATA
  }, key, fromBase64Url(ciphertext));
  return decoder.decode(plaintext);
}
