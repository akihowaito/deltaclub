export const SESSION_COOKIE = "haili_session";
export const SESSION_MAX_AGE = 60 * 60 * 24 * 7;
export const MAX_FAILED_ATTEMPTS = 5;
export const LOCK_SECONDS = 60 * 15;

const encoder = new TextEncoder();

export function json(data, init = {}) {
  const headers = new Headers(init.headers || {});
  headers.set("content-type", "application/json; charset=utf-8");
  headers.set("cache-control", "no-store");
  return new Response(JSON.stringify(data), { ...init, headers });
}

export function toBase64Url(bytes) {
  let binary = "";
  for (const byte of new Uint8Array(bytes)) binary += String.fromCharCode(byte);
  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/u, "");
}

export function fromBase64Url(value) {
  const normalized = value.replaceAll("-", "+").replaceAll("_", "/");
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
  const binary = atob(padded);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

export async function derivePasswordHash(password, salt, iterations = 210000) {
  const key = await crypto.subtle.importKey("raw", encoder.encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits({
    name: "PBKDF2",
    hash: "SHA-256",
    salt: typeof salt === "string" ? fromBase64Url(salt) : salt,
    iterations
  }, key, 256);
  return toBase64Url(bits);
}

export function timingSafeEqualBase64(left, right) {
  try {
    const leftBytes = fromBase64Url(left);
    const rightBytes = fromBase64Url(right);
    if (leftBytes.length !== rightBytes.length) return false;
    if (typeof crypto.subtle.timingSafeEqual === "function") {
      return crypto.subtle.timingSafeEqual(leftBytes, rightBytes);
    }
    let difference = 0;
    for (let index = 0; index < leftBytes.length; index += 1) difference |= leftBytes[index] ^ rightBytes[index];
    return difference === 0;
  } catch {
    return false;
  }
}

export async function verifyPassword(password, user) {
  const actualHash = await derivePasswordHash(password, user.password_salt, user.password_iterations);
  return timingSafeEqualBase64(actualHash, user.password_hash);
}

export async function performDummyPasswordWork(password) {
  await derivePasswordHash(password || "invalid-password", "AAAAAAAAAAAAAAAAAAAAAA", 210000);
}

export function parseCookies(request) {
  const result = new Map();
  const header = request.headers.get("cookie") || "";
  for (const part of header.split(";")) {
    const separator = part.indexOf("=");
    if (separator < 0) continue;
    result.set(part.slice(0, separator).trim(), decodeURIComponent(part.slice(separator + 1).trim()));
  }
  return result;
}

export async function hashSessionToken(token) {
  return toBase64Url(await crypto.subtle.digest("SHA-256", encoder.encode(token)));
}

export function newSessionToken() {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return toBase64Url(bytes);
}

export function sessionCookie(token, request) {
  const secure = new URL(request.url).protocol === "https:" ? "; Secure" : "";
  return `${SESSION_COOKIE}=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${SESSION_MAX_AGE}${secure}`;
}

export function clearSessionCookie(request) {
  const secure = new URL(request.url).protocol === "https:" ? "; Secure" : "";
  return `${SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0${secure}`;
}

export async function createSession(context, userId) {
  const token = newSessionToken();
  const tokenHash = await hashSessionToken(token);
  const now = Math.floor(Date.now() / 1000);
  const expiresAt = now + SESSION_MAX_AGE;
  const userAgent = (context.request.headers.get("user-agent") || "").slice(0, 300);
  await context.env.DB.batch([
    context.env.DB.prepare("DELETE FROM sessions WHERE expires_at <= ?").bind(now),
    context.env.DB.prepare("INSERT INTO sessions (token_hash, user_id, expires_at, created_at, last_seen_at, user_agent) VALUES (?, ?, ?, ?, ?, ?)")
      .bind(tokenHash, userId, expiresAt, now, now, userAgent)
  ]);
  return token;
}

export async function deleteCurrentSession(context) {
  const token = parseCookies(context.request).get(SESSION_COOKIE);
  if (!token) return;
  await context.env.DB.prepare("DELETE FROM sessions WHERE token_hash = ?").bind(await hashSessionToken(token)).run();
}

export async function getAuthenticatedUser(context) {
  const token = parseCookies(context.request).get(SESSION_COOKIE);
  if (!token) return null;
  const now = Math.floor(Date.now() / 1000);
  const tokenHash = await hashSessionToken(token);
  const user = await context.env.DB.prepare(`
    SELECT users.id, users.username, users.display_name, users.role, users.active,
           sessions.expires_at
      FROM sessions
      JOIN users ON users.id = sessions.user_id
     WHERE sessions.token_hash = ? AND sessions.expires_at > ? AND users.active = 1
  `).bind(tokenHash, now).first();
  if (!user) return null;
  context.waitUntil(context.env.DB.prepare("UPDATE sessions SET last_seen_at = ? WHERE token_hash = ?").bind(now, tokenHash).run());
  return user;
}

export function isSameOrigin(request) {
  const origin = request.headers.get("origin");
  return Boolean(origin) && origin === new URL(request.url).origin;
}

export function withSecurityHeaders(response, pathname = "") {
  const secured = new Response(response.body, response);
  secured.headers.set("x-content-type-options", "nosniff");
  secured.headers.set("x-frame-options", "DENY");
  secured.headers.set("referrer-policy", "no-referrer");
  secured.headers.set("permissions-policy", "camera=(), microphone=(), geolocation=(), payment=()");
  secured.headers.set("cross-origin-opener-policy", "same-origin");
  secured.headers.set("content-security-policy", "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self' data:; connect-src 'self'; object-src 'none'; base-uri 'self'; frame-ancestors 'none'; form-action 'self'");
  if (pathname.endsWith(".html") || pathname.startsWith("/api/")) secured.headers.set("cache-control", "no-store");
  return secured;
}

