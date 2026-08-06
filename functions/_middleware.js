import { getAuthenticatedUser, json, withSecurityHeaders } from "./_lib/auth.js";

const PUBLIC_PATHS = new Set([
  "/login",
  "/login.html",
  "/login.css",
  "/login.js",
  "/api/auth/login",
  "/api/auth/logout",
  "/api/auth/session"
]);

function wantsHtml(request, pathname) {
  if (pathname.startsWith("/api/")) return false;
  return request.headers.get("sec-fetch-dest") === "document"
    || request.headers.get("accept")?.includes("text/html")
    || pathname === "/"
    || pathname.endsWith(".html");
}

export async function onRequest(context) {
  const url = new URL(context.request.url);
  const pathname = url.pathname;

  if (PUBLIC_PATHS.has(pathname)) {
    return withSecurityHeaders(await context.next(), pathname);
  }

  if (!context.env.DB) {
    return json({ error: "登录数据库尚未配置" }, { status: 503 });
  }

  const user = await getAuthenticatedUser(context);
  if (!user) {
    if (wantsHtml(context.request, pathname)) {
      const loginUrl = new URL("/login", url.origin);
      if (pathname !== "/") loginUrl.searchParams.set("next", `${pathname}${url.search}`);
      return Response.redirect(loginUrl.toString(), 302);
    }
    return json({ error: "请先登录" }, { status: 401 });
  }

  const adminPath = pathname === "/admin" || pathname === "/admin.html" || pathname === "/admin.css" || pathname === "/admin.js" || pathname.startsWith("/api/admin/");
  if (adminPath && user.role !== "admin") {
    if (wantsHtml(context.request, pathname)) return Response.redirect(new URL("/", url.origin).toString(), 302);
    return json({ error: "没有管理员权限" }, { status: 403 });
  }

  context.data.user = user;
  return withSecurityHeaders(await context.next(), pathname);
}
