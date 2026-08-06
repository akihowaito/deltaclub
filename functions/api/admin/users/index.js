import { json } from "../../../_lib/auth.js";

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

export function onRequest() {
  return json({ error: "Method not allowed" }, { status: 405, headers: { allow: "GET" } });
}

