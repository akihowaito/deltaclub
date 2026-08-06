import {
  derivePasswordHash,
  isSameOrigin,
  json,
  toBase64Url
} from "../../../_lib/auth.js";
import {
  PASSWORD_ITERATIONS,
  decryptPassword,
  encryptPassword,
  generatePassword
} from "../../../_lib/password-vault.js";

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
    SELECT id, username, display_name, active, last_login_at, created_at,
           password_ciphertext, password_iv
      FROM users
     WHERE role = 'customer'
     ORDER BY id ASC
  `).all();
  const users = await Promise.all((result.results || []).map(async (user) => {
    let password = null;
    if (context.env.ACCOUNT_PASSWORD_KEY && user.password_ciphertext && user.password_iv) {
      try {
        password = await decryptPassword(user.password_ciphertext, user.password_iv, context.env.ACCOUNT_PASSWORD_KEY);
      } catch {
        password = null;
      }
    }
    return {
      id: user.id,
      username: user.username,
      display_name: user.display_name,
      active: user.active,
      last_login_at: user.last_login_at,
      created_at: user.created_at,
      password
    };
  }));
  return json({ users, vaultReady: Boolean(context.env.ACCOUNT_PASSWORD_KEY) });
}

export async function onRequestPost(context) {
  if (context.data.user?.role !== "admin") return json({ error: "没有管理员权限" }, { status: 403 });
  if (!isSameOrigin(context.request)) return json({ error: "请求来源无效" }, { status: 403 });
  if (!context.env.ACCOUNT_PASSWORD_KEY) return json({ error: "密码保险库尚未配置" }, { status: 503 });

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
    const encryptedPassword = await encryptPassword(password, context.env.ACCOUNT_PASSWORD_KEY);

    try {
      const now = Math.floor(Date.now() / 1000);
      const result = await context.env.DB.prepare(`
        INSERT INTO users (
          username, display_name, role, password_hash, password_salt,
          password_iterations, password_ciphertext, password_iv,
          active, created_at, updated_at
        ) VALUES (?, ?, 'customer', ?, ?, ?, ?, ?, 1, ?, ?)
      `).bind(
        username,
        displayName,
        passwordHash,
        salt,
        PASSWORD_ITERATIONS,
        encryptedPassword.ciphertext,
        encryptedPassword.iv,
        now,
        now
      ).run();

      return json({
        ok: true,
        user: {
          id: result.meta?.last_row_id,
          username,
          displayName,
          active: true
        },
        credentials: { username, password },
        message: `${displayName} 已创建，账号密码已加密保存`
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
