import {
  LOCK_SECONDS,
  MAX_FAILED_ATTEMPTS,
  createSession,
  json,
  performDummyPasswordWork,
  sessionCookie,
  verifyPassword
} from "../../_lib/auth.js";

export async function onRequestPost(context) {
  if (!context.env.DB) return json({ error: "登录数据库尚未配置" }, { status: 503 });

  let body;
  try {
    body = await context.request.json();
  } catch {
    return json({ error: "请输入账号和密码" }, { status: 400 });
  }

  const username = String(body.username || "").trim();
  const password = String(body.password || "");
  if (!/^[A-Za-z0-9_-]{3,40}$/u.test(username) || password.length < 8 || password.length > 128) {
    await performDummyPasswordWork(password);
    return json({ error: "账号或密码错误" }, { status: 401 });
  }

  const user = await context.env.DB.prepare(`
    SELECT id, username, display_name, role, password_hash, password_salt,
           password_iterations, active, failed_attempts, locked_until
      FROM users
     WHERE username = ? COLLATE NOCASE
  `).bind(username).first();

  if (!user) {
    await performDummyPasswordWork(password);
    return json({ error: "账号或密码错误" }, { status: 401 });
  }

  const now = Math.floor(Date.now() / 1000);
  if (user.locked_until && user.locked_until > now) {
    return json({ error: "尝试次数过多，请 15 分钟后再试" }, { status: 429 });
  }

  const passwordMatches = await verifyPassword(password, user);
  if (!passwordMatches) {
    const failedAttempts = Number(user.failed_attempts || 0) + 1;
    const lockedUntil = failedAttempts >= MAX_FAILED_ATTEMPTS ? now + LOCK_SECONDS : null;
    await context.env.DB.prepare("UPDATE users SET failed_attempts = ?, locked_until = ?, updated_at = ? WHERE id = ?")
      .bind(failedAttempts, lockedUntil, now, user.id).run();
    const remaining = Math.max(0, MAX_FAILED_ATTEMPTS - failedAttempts);
    return json({
      error: lockedUntil ? "尝试次数过多，账号已暂时锁定 15 分钟" : `账号或密码错误，还可尝试 ${remaining} 次`
    }, { status: lockedUntil ? 429 : 401 });
  }

  if (!user.active) {
    return json({ error: "该账号已停用，请联系管理员" }, { status: 403 });
  }

  await context.env.DB.prepare("UPDATE users SET failed_attempts = 0, locked_until = NULL, last_login_at = ?, updated_at = ? WHERE id = ?")
    .bind(now, now, user.id).run();
  const token = await createSession(context, user.id);
  return json({
    ok: true,
    user: { username: user.username, displayName: user.display_name, role: user.role }
  }, {
    status: 200,
    headers: { "set-cookie": sessionCookie(token, context.request) }
  });
}

export function onRequest() {
  return json({ error: "Method not allowed" }, { status: 405, headers: { allow: "POST" } });
}

