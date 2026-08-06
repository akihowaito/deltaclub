import { isSameOrigin, json } from "../../../_lib/auth.js";

export async function onRequestPatch(context) {
  if (context.data.user?.role !== "admin") return json({ error: "没有管理员权限" }, { status: 403 });
  if (!isSameOrigin(context.request)) return json({ error: "请求来源无效" }, { status: 403 });

  const id = Number(context.params.id);
  if (!Number.isInteger(id) || id <= 0) return json({ error: "账号编号无效" }, { status: 400 });

  let body;
  try {
    body = await context.request.json();
  } catch {
    return json({ error: "请求内容无效" }, { status: 400 });
  }
  if (typeof body.active !== "boolean") return json({ error: "缺少账号状态" }, { status: 400 });

  const target = await context.env.DB.prepare("SELECT id, username, display_name, active FROM users WHERE id = ? AND role = 'customer'")
    .bind(id).first();
  if (!target) return json({ error: "找不到客户账号" }, { status: 404 });

  const nextActive = body.active ? 1 : 0;
  const now = Math.floor(Date.now() / 1000);
  const statements = [
    context.env.DB.prepare("UPDATE users SET active = ?, failed_attempts = 0, locked_until = NULL, updated_at = ? WHERE id = ?")
      .bind(nextActive, now, id),
    context.env.DB.prepare("INSERT INTO account_audit (actor_user_id, target_user_id, action, created_at) VALUES (?, ?, ?, ?)")
      .bind(context.data.user.id, id, nextActive ? "enable" : "disable", now)
  ];
  if (!nextActive) statements.push(context.env.DB.prepare("DELETE FROM sessions WHERE user_id = ?").bind(id));
  await context.env.DB.batch(statements);

  return json({
    ok: true,
    user: { id, username: target.username, displayName: target.display_name, active: Boolean(nextActive) },
    message: nextActive ? "账号已恢复，客户可以重新登录" : "账号已停用，现有登录已立即失效"
  });
}

export function onRequest() {
  return json({ error: "Method not allowed" }, { status: 405, headers: { allow: "PATCH" } });
}

