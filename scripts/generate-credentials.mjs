import { pbkdf2Sync, randomBytes, randomInt } from "node:crypto";
import { writeFileSync } from "node:fs";

const [seedPath, credentialsPath] = process.argv.slice(2);
if (!seedPath || !credentialsPath) {
  throw new Error("Usage: node generate-credentials.mjs <seed.sql> <private-credentials.txt>");
}

const iterations = 100000;
const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%";
const accounts = [
  { username: "akihowaito-admin", displayName: "HAILI 管理员", role: "admin" },
  { username: "haili-001", displayName: "客户 01", role: "customer" },
  { username: "haili-002", displayName: "客户 02", role: "customer" },
  { username: "haili-003", displayName: "客户 03", role: "customer" }
];

const password = () => Array.from({ length: 18 }, () => alphabet[randomInt(alphabet.length)]).join("");
const base64url = (value) => Buffer.from(value).toString("base64url");
const sqlString = (value) => `'${String(value).replaceAll("'", "''")}'`;

for (const account of accounts) {
  account.password = password();
  const salt = randomBytes(16);
  account.salt = base64url(salt);
  account.hash = base64url(pbkdf2Sync(account.password, salt, iterations, 32, "sha256"));
}

const seed = [
  "-- Passwords are PBKDF2-SHA256 hashes. Plaintext credentials are never committed.",
  ...accounts.map((account) => `INSERT INTO users (username, display_name, role, password_hash, password_salt, password_iterations, active)\nVALUES (${sqlString(account.username)}, ${sqlString(account.displayName)}, ${sqlString(account.role)}, ${sqlString(account.hash)}, ${sqlString(account.salt)}, ${iterations}, 1)\nON CONFLICT(username) DO UPDATE SET display_name=excluded.display_name, role=excluded.role, password_hash=excluded.password_hash, password_salt=excluded.password_salt, password_iterations=excluded.password_iterations, active=1, failed_attempts=0, locked_until=NULL, updated_at=unixepoch();`),
  "DELETE FROM sessions;",
  ""
].join("\n\n");

const generatedAt = new Intl.DateTimeFormat("zh-CN", { dateStyle: "full", timeStyle: "medium", timeZone: "Asia/Singapore" }).format(new Date());
const credentials = [
  "HAILI CLUB 私人账号凭据",
  `生成时间：${generatedAt}`,
  "",
  "重要：此文件包含明文密码，请勿上传 GitHub、Cloudflare 静态文件或发给无关人员。",
  "管理员账号仅供 akihowaito 使用；三个客户账号分别发给对应客户。",
  "",
  ...accounts.flatMap((account) => [
    `[${account.role === "admin" ? "管理员" : account.displayName}]`,
    `账号：${account.username}`,
    `密码：${account.password}`,
    ""
  ])
].join("\r\n");

writeFileSync(seedPath, seed, "utf8");
writeFileSync(credentialsPath, credentials, "utf8");
console.log(JSON.stringify({ seedPath, credentialsPath, accounts: accounts.map(({ username, displayName, role }) => ({ username, displayName, role })) }, null, 2));
