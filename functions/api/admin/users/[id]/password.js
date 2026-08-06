import {
  derivePasswordHash,
  isSameOrigin,
  json,
  toBase64Url
} from "../../../../_lib/auth.js";
import {
  PASSWORD_ITERATIONS,
  encryptPassword,
  generatePassword
} from "../../../../_lib/password-vault.js";

export async function onRequestPost(context) {
  if (context.data.user?.role !== "admin") return json({ error: "没有管理员权限" }, { status: 403 });
  if (!isSameOrigin(context.request)) return json({ error: "请求来源无效" }, { status: 403 });
  if (!context.env.ACCOUNT_PASSWORD_KEY) return json({ error: "密码保险库尚未配置" }, { status: 503 });

  const id = Number(context.params.id);
  if (!Number.isInteger(id) || id <= 0) return json({ error: "账号编号无效" }, { status: 400 });
  const target = await context.env.DB.prepare("SELECT id, username, display_name FROM users WHERE id = ? AND role = 'customer'")
    .bind(id).first();
  if (!target) return json({ error: "找不到客户账号" }, { status: 404 });

  const password = generatePassword();
  const saltBytes = new Uint8Array(16);
  crypto.getRandomValues(saltBytes);
  const salt = toBase64Url(saltBytes);
  const passwordHash = await derivePasswordHash(password, salt, PASSWORD_ITERATIONS);
  const encryptedPassword = await encryptPassword(password, context.env.ACCOUNT_PASSWORD_KEY);
  const now = Math.floor(Date.now() / 1000);

  await context.env.DB.batch([
    context.env.DB.prepare(`
      UPDATE users
         SET password_hash = ?, password_salt = ?, password_iterations = ?,
             password_ciphertext = ?, password_iv = ?, failed_attempts = 0,
             locked_until = NULL, updated_at = ?
       WHERE id = ?
    `).bind(
      passwordHash,
      salt,
      PASSWORD_ITERATIONS,
      encryptedPassword.ciphertext,
      encryptedPassword.iv,
      now,
      id
    ),
    context.env.DB.prepare("DELETE FROM sessions WHERE user_id = ?").bind(id)
  ]);

  return json({
    ok: true,
    user: { id, username: target.username, displayName: target.display_name },
    credentials: { username: target.username, password },
    message: `${target.display_name} 的密码已重置并加密保存`
  });
}

export function onRequest() {
  return json({ error: "Method not allowed" }, { status: 405, headers: { allow: "POST" } });
}
