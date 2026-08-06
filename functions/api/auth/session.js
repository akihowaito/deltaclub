import { getAuthenticatedUser, json } from "../../_lib/auth.js";

export async function onRequestGet(context) {
  if (!context.env.DB) return json({ authenticated: false }, { status: 503 });
  const user = await getAuthenticatedUser(context);
  if (!user) return json({ authenticated: false }, { status: 401 });
  return json({
    authenticated: true,
    user: { username: user.username, displayName: user.display_name, role: user.role }
  });
}

export function onRequest() {
  return json({ error: "Method not allowed" }, { status: 405, headers: { allow: "GET" } });
}

