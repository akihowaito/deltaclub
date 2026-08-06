const adminName = document.querySelector("#adminName");
const totalCount = document.querySelector("#totalCount");
const activeCount = document.querySelector("#activeCount");
const disabledCount = document.querySelector("#disabledCount");
const accountList = document.querySelector("#accountList");
const accountTemplate = document.querySelector("#accountTemplate");
const accountMessage = document.querySelector("#accountMessage");
const createAccountButton = document.querySelector("#createAccountButton");
const refreshButton = document.querySelector("#refreshButton");
const logoutButton = document.querySelector("#logoutButton");
const createConfirmDialog = document.querySelector("#createConfirmDialog");
const confirmCreateButton = document.querySelector("#confirmCreateButton");
const cancelCreateButton = document.querySelector("#cancelCreateButton");
const createConfirmStatus = document.querySelector("#createConfirmStatus");
const credentialDialog = document.querySelector("#credentialDialog");
const credentialTitle = document.querySelector("#credentialTitle");
const createdDisplayName = document.querySelector("#createdDisplayName");
const createdUsername = document.querySelector("#createdUsername");
const createdPassword = document.querySelector("#createdPassword");
const copyCredentialsButton = document.querySelector("#copyCredentialsButton");
const copyStatus = document.querySelector("#copyStatus");

let currentCredentials = null;
let accountCreationPending = false;

function formatDate(timestamp) {
  if (!timestamp) return "从未登录";
  return new Intl.DateTimeFormat("zh-CN", { year:"numeric", month:"2-digit", day:"2-digit", hour:"2-digit", minute:"2-digit", hourCycle:"h23" }).format(new Date(timestamp * 1000));
}

function showMessage(message, error = false) {
  accountMessage.textContent = message;
  accountMessage.classList.toggle("is-error", error);
}

function credentialText(credentials) {
  return [
    "HAILI CLUB 客户登录",
    `客户：${credentials.displayName}`,
    `账号：${credentials.username}`,
    `密码：${credentials.password}`,
    "网站：https://haili-club-monopoly.pages.dev/login"
  ].join("\n");
}

async function writeClipboard(text) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }
  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand("copy");
  textarea.remove();
}

function renderAccounts(users) {
  accountList.innerHTML = "";
  users.forEach((user, index) => {
    const card = accountTemplate.content.firstElementChild.cloneNode(true);
    const active = Boolean(user.active);
    card.classList.toggle("is-disabled", !active);
    const accountNumber = user.username.match(/(\d+)$/u)?.[1] || String(index + 1);
    card.querySelector(".account-avatar").textContent = accountNumber.padStart(2, "0");
    card.querySelector(".account-status").textContent = active ? "正常使用" : "已经停用";
    card.querySelector("h3").textContent = user.display_name;
    card.querySelector(".account-username").textContent = user.username;
    const passwordValue = card.querySelector(".password-value");
    const revealPasswordButton = card.querySelector(".reveal-password");
    const copyAccountButton = card.querySelector(".copy-account");
    if (user.password) {
      let revealed = false;
      const refreshPassword = () => {
        passwordValue.textContent = revealed ? user.password : "••••••••••••";
        revealPasswordButton.textContent = revealed ? "隐藏" : "显示";
      };
      refreshPassword();
      revealPasswordButton.addEventListener("click", () => {
        revealed = !revealed;
        refreshPassword();
      });
      copyAccountButton.addEventListener("click", async () => {
        try {
          await writeClipboard(credentialText({ displayName: user.display_name, username: user.username, password: user.password }));
          copyAccountButton.textContent = "✓ 已复制";
          window.setTimeout(() => { copyAccountButton.textContent = "复制账号密码"; }, 1600);
        } catch {
          showMessage(`${user.display_name} 的账号密码复制失败，请先显示后手动复制`, true);
        }
      });
    } else {
      passwordValue.textContent = "旧密码无法读取";
      passwordValue.classList.add("is-unavailable");
      revealPasswordButton.hidden = true;
      copyAccountButton.textContent = "重置并显示密码";
      copyAccountButton.classList.add("is-reset");
      copyAccountButton.addEventListener("click", () => resetPassword(user, copyAccountButton));
    }
    card.querySelector(".last-login").textContent = formatDate(user.last_login_at);
    card.querySelector(".created-date").textContent = formatDate(user.created_at).split(" ")[0];
    const button = card.querySelector(".toggle-account");
    button.textContent = active ? "停用此账号" : "恢复此账号";
    button.addEventListener("click", () => setAccountState(user, !active, button));
    accountList.appendChild(card);
  });
  totalCount.textContent = users.length;
  activeCount.textContent = users.filter((user) => user.active).length;
  disabledCount.textContent = users.filter((user) => !user.active).length;
}

function showCreatedCredentials(result, title = "新客户账号已创建") {
  currentCredentials = {
    displayName: result.user.displayName,
    username: result.credentials.username,
    password: result.credentials.password
  };
  createdDisplayName.textContent = currentCredentials.displayName;
  createdUsername.textContent = currentCredentials.username;
  createdPassword.textContent = currentCredentials.password;
  credentialTitle.textContent = title;
  copyStatus.textContent = "";
  credentialDialog.showModal();
}

async function copyCredentials() {
  if (!currentCredentials) return;
  try {
    await writeClipboard(credentialText(currentCredentials));
    copyStatus.textContent = "已复制，可以直接发送给对应客户。";
    copyCredentialsButton.textContent = "✓ 已复制";
  } catch {
    copyStatus.textContent = "自动复制失败，请手动复制上方账号和密码。";
  }
}

async function resetPassword(user, button) {
  if (!window.confirm(`确定为「${user.display_name}」生成新密码吗？\n旧密码会立即失效，现有登录也会被退出。`)) return;
  button.disabled = true;
  button.textContent = "正在生成…";
  showMessage(`正在重置 ${user.display_name} 的密码…`);
  try {
    const response = await fetch(`/api/admin/users/${user.id}/password`, { method: "POST" });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "重置密码失败");
    await loadAccounts(false);
    showMessage(result.message);
    showCreatedCredentials(result, "新密码已生成");
  } catch (error) {
    showMessage(error.message, true);
    button.disabled = false;
    button.textContent = "重置并显示密码";
  }
}

async function createAccount() {
  accountCreationPending = true;
  createAccountButton.disabled = true;
  confirmCreateButton.disabled = true;
  cancelCreateButton.disabled = true;
  confirmCreateButton.textContent = "正在创建…";
  createConfirmStatus.classList.remove("is-error");
  createConfirmStatus.textContent = "正在生成下一个客户编号和随机密码…";
  try {
    const response = await fetch("/api/admin/users", { method: "POST" });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "创建账号失败");
    createConfirmDialog.close("created");
    await loadAccounts(false);
    showMessage(result.message);
    showCreatedCredentials(result);
  } catch (error) {
    createConfirmStatus.classList.add("is-error");
    createConfirmStatus.textContent = error.message;
    showMessage(error.message, true);
  } finally {
    accountCreationPending = false;
    createAccountButton.disabled = false;
    confirmCreateButton.disabled = false;
    cancelCreateButton.disabled = false;
    confirmCreateButton.textContent = "确认创建";
  }
}

function openCreateConfirmation() {
  createConfirmStatus.textContent = "";
  createConfirmStatus.classList.remove("is-error");
  confirmCreateButton.disabled = false;
  confirmCreateButton.textContent = "确认创建";
  createConfirmDialog.showModal();
}

async function loadAccounts(announce = false) {
  refreshButton.disabled = true;
  try {
    const response = await fetch("/api/admin/users");
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "读取账号失败");
    renderAccounts(result.users);
    if (announce) showMessage("账号状态已刷新。");
  } catch (error) {
    showMessage(error.message, true);
  } finally {
    refreshButton.disabled = false;
  }
}

async function setAccountState(user, active, button) {
  if (!active && !window.confirm(`确定停用「${user.display_name}」吗？\n该客户当前登录会立即失效。`)) return;
  button.disabled = true;
  showMessage(active ? "正在恢复账号…" : "正在停用并撤销登录…");
  try {
    const response = await fetch(`/api/admin/users/${user.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ active })
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "修改账号失败");
    showMessage(result.message);
    await loadAccounts(false);
  } catch (error) {
    showMessage(error.message, true);
    button.disabled = false;
  }
}

createAccountButton.addEventListener("click", openCreateConfirmation);
confirmCreateButton.addEventListener("click", createAccount);
createConfirmDialog.addEventListener("cancel", (event) => {
  if (accountCreationPending) event.preventDefault();
});
refreshButton.addEventListener("click", () => loadAccounts(true));
copyCredentialsButton.addEventListener("click", copyCredentials);
credentialDialog.addEventListener("close", () => {
  currentCredentials = null;
  createdPassword.textContent = "—";
  copyStatus.textContent = "";
  copyCredentialsButton.textContent = "复制账号和密码";
  credentialTitle.textContent = "新客户账号已创建";
});
logoutButton.addEventListener("click", async () => {
  logoutButton.disabled = true;
  await fetch("/api/auth/logout", { method:"POST" }).catch(() => {});
  location.replace("/login");
});

fetch("/api/auth/session").then(async (response) => {
  if (!response.ok) throw new Error("登录状态已失效");
  const result = await response.json();
  if (result.user.role !== "admin") throw new Error("没有管理员权限");
  adminName.textContent = result.user.displayName;
  return loadAccounts();
}).catch((error) => {
  showMessage(error.message, true);
  window.setTimeout(() => location.replace("/login"), 900);
});
