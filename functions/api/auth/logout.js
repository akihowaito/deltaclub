import { clearSessionCookie, deleteCurrentSession, json } from "../../_lib/auth.js";

export async function onRequestPost(context) {
  if (context.env.DB) await deleteCurrentSession(context);
  return json({ ok: true }, {
    headers: { "set-cookie": clearSessionCookie(context.request) }
  });
}

export function onRequest() {
  return json({ error: "Method not allowed" }, { status: 405, headers: { allow: "POST" } });
}

