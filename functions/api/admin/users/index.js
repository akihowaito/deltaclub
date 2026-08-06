import {
  derivePasswordHash,
  isSameOrigin,
  json,
  toBase64Url
} from "../../../_lib/auth.js";

const PASSWORD_ITERATIONS = 100000;
const UPPERCASE = "ABCDEFGHJKLMNPQRSTUVWXYZ";
const LOWERCASE = "abcdefghijkmnopqrstuvwxyz";
const DIGITS = "23456789";
const SYMBOLS = "!@#$%";
const PASSWORD_ALPHABET = `${UPPERCASE}${LOWERCASE}${DIGITS}${SYMBOLS}`;

function randomIndex(length) {
  const limit = 256 - (256 % length);
  const bytes = new Uint8Array(1);
  do crypto.getRandomValues(bytes); while (bytes[0] >= limit);
  return bytes[0] % length;
}

function randomCharacter(alphabet) {
  return alphabet[randomIndex(alphabet.length)];
}

function generatePassword() {
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

async function nextCustomerNumber(database) {
  const row = await database.prepare(`
    SELECT COALESCE(MAX(CAST(substr(username, 7) AS INTEGER)), 0) + 1 AS next_number
      FROM users
     WHERE role = 'customer'
       AND username GLOB 'haili-[0-9]*'
       AND length(substr(username, 7)) > 0
       AND substr(username, 7) NOT GLOB '*[^0-9]*'
  `).first();
  return Number(row?.next_number || 1);
}

export async function onRequestGet(context) {
  if (context.data.user?.role !== "admin") return json({ error: "没有管理员权限" }, { status: 403 });
  const result = await context.env.DB.prepare(`
    SELECT id, username, display_name, active, last_login_at, created_at
      FROM users
     WHERE role = 'customer'
     ORDER BY id ASC
  `).all();
  return json({ users: result.results || [] });
}

export async function onRequestPost(context) {
  if (context.data.user?.role !== "admin") return json({ error: "没有管理员权限" }, { status: 403 });
  if (!isSameOrigin(context.request)) return json({ error: "请求来源无效" }, { status: 403 });

  for (let attempt = 0; attempt < 3; attempt += 1) {
    const customerNumber = await nextCustomerNumber(context.env.DB);
    if (!Number.isSafeInteger(customerNumber) || customerNumber < 1 || customerNumber > 999999) {
      return json({ error: "客户编号已经超出可创建范围" }, { status: 409 });
    }

    const username = `haili-${String(customerNumber).padStart(3, "0")}`;
    const displayName = `客户 ${String(customerNumber).padStart(2, "0")}`;
    const password = generatePassword();
    const saltBytes = new Uint8Array(16);
    crypto.getRandomValues(saltBytes);
    const salt = toBase64Url(saltBytes);
    const passwordHash = await derivePasswordHash(password, salt, PASSWORD_ITERATIONS);

    try {
      const now = Math.floor(Date.now() / 1000);
      const result = await context.env.DB.prepare(`
        INSERT INTO users (
          username, display_name, role, password_hash, password_salt,
          password_iterations, active, created_at, updated_at
        ) VALUES (?, ?, 'customer', ?, ?, ?, 1, ?, ?)
      `).bind(username, displayName, passwordHash, salt, PASSWORD_ITERATIONS, now, now).run();

      return json({
        ok: true,
        user: {
          id: result.meta?.last_row_id,
          username,
          displayName,
          active: true
        },
        credentials: { username, password },
        message: `${displayName} 已创建，请立即保存账号密码`
      }, { status: 201 });
    } catch (error) {
      const collision = String(error?.message || "").includes("UNIQUE constraint failed");
      if (!collision || attempt === 2) {
        return json({ error: collision ? "账号编号发生冲突，请重新点击创建" : "创建账号失败，请稍后重试" }, { status: collision ? 409 : 500 });
      }
    }
  }

  return json({ error: "创建账号失败，请重新点击创建" }, { status: 409 });
}

export function onRequest() {
  return json({ error: "Method not allowed" }, { status: 405, headers: { allow: "GET, POST" } });
}
